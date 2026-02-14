/**
 * Servicio de sincronización de órdenes con proveedores API
 * Sincroniza el estado de órdenes individuales
 */

import { createClient } from '../supabase/server';
import { SmmApiClient } from '../api/smm-provider';

/**
 * Sincronizar el estado de una orden con el proveedor API
 */
export async function syncOrderStatus(orderId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const supabase = await createClient();

    // 1. Obtener la orden con información del proveedor
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        *,
        api_provider:api_providers (
          id,
          name,
          url,
          api_key
        )
      `)
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return { success: false, error: 'Orden no encontrada' };
    }

    // 2. Verificar si la orden tiene un proveedor API y un ID de orden API
    if (!order.api_provider_id || !order.api_order_id) {
      return { 
        success: false, 
        error: 'La orden no está vinculada a un proveedor API' 
      };
    }

    // 3. Verificar que el proveedor tenga configuración API válida
    const provider = Array.isArray(order.api_provider) 
      ? order.api_provider[0] 
      : order.api_provider;

    if (!provider?.url || !provider?.api_key) {
      return {
        success: false,
        error: 'El proveedor no tiene configuración API válida'
      };
    }

    // 4. Conectar con la API del proveedor
    const apiClient = new SmmApiClient(provider.url, provider.api_key);

    // 5. Consultar el estado de la orden
    const orderStatus = await apiClient.getOrderStatus(order.api_order_id);

    if (!orderStatus) {
      return {
        success: false,
        error: 'No se pudo obtener el estado de la orden del proveedor'
      };
    }

    // 6. Mapear el estado de la API al estado interno
    const statusMap: Record<string, string> = {
      'Pending': 'pending',
      'In progress': 'processing',
      'Processing': 'processing',
      'Completed': 'completed',
      'Partial': 'completed',
      'Canceled': 'cancelled',
      'Refunded': 'refunded',
    };

    const newStatus = statusMap[orderStatus.status] || 'pending';

    // 7. Preparar datos de actualización
    const updateData: Record<string, unknown> = {
      status: newStatus,
      updated_at: new Date().toISOString(),
    };

    // Actualizar contador inicial y restantes si están disponibles
    if (orderStatus.start_count) {
      updateData.started_count = Number.parseInt(orderStatus.start_count, 10);
    }
    if (orderStatus.remains) {
      updateData.remains = Number.parseInt(orderStatus.remains, 10);
    }

    // Si está completada, registrar fecha de finalización
    if (newStatus === 'completed' && !order.completed_at) {
      updateData.completed_at = new Date().toISOString();
    }

    // 8. Actualizar la orden en la base de datos
    const { error: updateError } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', orderId);

    if (updateError) {
      return {
        success: false,
        error: `Error al actualizar la orden: ${updateError.message}`
      };
    }

    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    console.error('Error syncing order:', errorMessage);
    return {
      success: false,
      error: errorMessage
    };
  }
}

/**
 * Sincronizar múltiples órdenes en lote
 */
export async function syncMultipleOrders(orderIds: string[]): Promise<{
  success: boolean;
  totalProcessed: number;
  successCount: number;
  errorCount: number;
  errors: Array<{ orderId: string; error: string }>;
}> {
  const results = {
    success: true,
    totalProcessed: orderIds.length,
    successCount: 0,
    errorCount: 0,
    errors: [] as Array<{ orderId: string; error: string }>,
  };

  for (const orderId of orderIds) {
    const result = await syncOrderStatus(orderId);
    if (result.success) {
      results.successCount++;
    } else {
      results.errorCount++;
      results.errors.push({
        orderId,
        error: result.error || 'Error desconocido'
      });
    }
  }

  results.success = results.errorCount === 0;
  return results;
}

/**
 * Sincronizar todas las órdenes pendientes o en proceso
 */
export async function syncPendingOrders(): Promise<{
  success: boolean;
  processed: number;
  updated: number;
  errors: number;
}> {
  const supabase = await createClient();

  // Obtener órdenes que están en estado pendiente o procesando y tienen API provider
  const { data: orders } = await supabase
    .from('orders')
    .select('id')
    .in('status', ['pending', 'processing'])
    .not('api_provider_id', 'is', null)
    .not('api_order_id', 'is', null);

  if (!orders || orders.length === 0) {
    return {
      success: true,
      processed: 0,
      updated: 0,
      errors: 0
    };
  }

  const orderIds = orders.map(o => o.id);
  const result = await syncMultipleOrders(orderIds);

  return {
    success: result.success,
    processed: result.totalProcessed,
    updated: result.successCount,
    errors: result.errorCount
  };
}
