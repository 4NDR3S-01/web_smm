/**
 * API Route (Cron Job): /api/cron/update-statuses
 * Actualizar estados de pedidos activos desde los proveedores
 * Frecuencia: Cada 5 minutos
 */

import { NextRequest, NextResponse } from 'next/server';
import { getActiveOrders, updateOrderStatus } from '@/lib/services/order.service';
import { getProvider } from '@/lib/services/provider.service';
import { SmmApiClient } from '@/lib/api/smm-provider';

export async function GET(request: NextRequest) {
  try {
    // Verificar autorización del cron job
    const authHeader = request.headers.get('Authorization');
    const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;

    if (authHeader !== expectedAuth) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Obtener órdenes activas (pending, processing, inprogress, active)
    const activeOrders = await getActiveOrders(100);

    if (activeOrders.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No hay pedidos activos para actualizar',
        updated: 0,
      });
    }

    // Agrupar órdenes por proveedor para consultas eficientes
    const ordersByProvider = new Map<string, typeof activeOrders>();

    for (const order of activeOrders) {
      if (!order.api_provider_id) continue;

      const providerId = order.api_provider_id;
      if (!ordersByProvider.has(providerId)) {
        ordersByProvider.set(providerId, []);
      }
      ordersByProvider.get(providerId)!.push(order);
    }

    let updated = 0;
    let errors = 0;

    // Procesar cada grupo de órdenes por proveedor
    for (const [providerId, orders] of ordersByProvider.entries()) {
      try {
        const provider = await getProvider(providerId);
        if (!provider) {
          console.warn(`Provider not found: ${providerId}`);
          continue;
        }

        // Crear cliente API
        const apiClient = new SmmApiClient(provider.url, provider.api_key);

        // Obtener IDs de las órdenes en la API
        const orderIds = orders
          .map(o => String(o.api_order_id))
          .filter(id => id && id !== '-1');

        if (orderIds.length === 0) continue;

        // Consultar estados en batch (más eficiente)
        const statuses = await apiClient.getMultiOrderStatus(orderIds);

        // Actualizar cada orden con su estado
        for (const [apiOrderId, statusData] of Object.entries(statuses)) {
          const order = orders.find(o => String(o.api_order_id) === apiOrderId);
          if (!order) continue;

          try {
            const success = await updateOrderStatus({
              orderId: order.id,
              apiStatus: statusData.status,
              charge: statusData.charge,
              startCount: statusData.start_count,
              remains: statusData.remains,
              details: statusData as unknown as Record<string, unknown>,
            });

            if (success) {
              updated++;
            } else {
              errors++;
            }
          } catch (error) {
            console.error(`Error updating order ${order.id}:`, error);
            errors++;
          }
        }
      } catch (error: any) {
        console.error(`Error processing provider ${providerId}:`, error);
        errors++;
      }
    }

    return NextResponse.json({
      success: true,
      updated,
      errors,
      total: activeOrders.length,
      providers: ordersByProvider.size,
    });
  } catch (error: any) {
    console.error('Error in update-statuses cron:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno' },
      { status: 500 }
    );
  }
}
