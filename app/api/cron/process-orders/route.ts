/**
 * API Route (Cron Job): /api/cron/process-orders
 * Enviar pedidos pendientes a los proveedores API
 * Frecuencia: Cada 2 minutos
 */

import { NextRequest, NextResponse } from 'next/server';
import { getPendingOrders, markOrderAsSent, markOrderAsError } from '@/lib/services/order.service';
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

    // Obtener órdenes pendientes (status='awaiting', api_order_id=-1)
    const pendingOrders = await getPendingOrders(15);

    if (pendingOrders.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No hay pedidos pendientes',
        processed: 0,
      });
    }

    let processed = 0;
    let errors = 0;

    // Procesar cada pedido
    for (const order of pendingOrders) {
      try {
        if (!order.api_provider_id) {
          await markOrderAsError(order.id, 'Sin proveedor API configurado');
          errors++;
          continue;
        }

        // Obtener datos del proveedor
        const provider = await getProvider(order.api_provider_id);
        if (!provider) {
          await markOrderAsError(order.id, 'Proveedor no encontrado');
          errors++;
          continue;
        }

        // Crear cliente API
        const apiClient = new SmmApiClient(provider.url, provider.api_key);

        // Preparar datos del pedido según tipo de servicio
        const orderData = prepareOrderData(order);

        // Enviar pedido al proveedor
        const response = await apiClient.createOrder(orderData);

        if (response.order) {
          // Actualizar orden con el ID del proveedor
          await markOrderAsSent(
            order.id,
            parseInt(response.order),
            'pending'
          );
          processed++;
        } else {
          await markOrderAsError(order.id, 'Respuesta inválida de la API');
          errors++;
        }
      } catch (error: any) {
        console.error(`Error processing order ${order.id}:`, error);
        await markOrderAsError(order.id, error.message || 'Error desconocido');
        errors++;
      }
    }

    return NextResponse.json({
      success: true,
      processed,
      errors,
      total: pendingOrders.length,
    });
  } catch (error: any) {
    console.error('Error in process-orders cron:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno' },
      { status: 500 }
    );
  }
}

/**
 * Preparar datos del pedido según el tipo de servicio
 */
function prepareOrderData(order: any): any {
  const baseData: any = {
    link: order.target_url,
    quantity: order.quantity,
  };

  // Para servicios estándar (default)
  if (order.service_type === 'default' || !order.service_type) {
    return baseData;
  }

  // Para paquetes
  if (order.service_type === 'package') {
    return {
      link: order.target_url,
    };
  }

  // Para comentarios personalizados
  if (order.service_type === 'custom_comments') {
    // Los comentarios deberían estar en notes como array separado por líneas
    const comments = order.notes?.split('\n').filter((c: string) => c.trim()) || [];
    return {
      link: order.target_url,
      comments: comments,
    };
  }

  // Para otros tipos especiales, agregar lógica según sea necesario
  return baseData;
}
