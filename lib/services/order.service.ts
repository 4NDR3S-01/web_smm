/**
 * Servicio de gestión de pedidos
 * Replica la lógica del panel PHP (public_html/app/modules/order/)
 */

import { createClient } from '../supabase/server';
import { Order, OrderStatus, ServiceType } from '../types/database';
import { mapApiStatus, isOrderFinished } from '../constants/order-status';
import {
  getUserPrice,
  calculateTotalCharge,
  calculateFormalCharge,
  calculateProfit,
  calculateRefund,
} from './pricing.service';

export interface CreateOrderInput {
  userId: string;
  serviceId: string;
  serviceName: string;
  serviceType: ServiceType;
  quantity: number;
  targetUrl: string;
  notes?: string;
}

export interface CreateOrderResult {
  success: boolean;
  order?: Order;
  error?: string;
}

/**
 * Crear un nuevo pedido
 * Replica: ajax_add_order del PHP (línea 66-264)
 */
export async function createOrder(
  input: CreateOrderInput
): Promise<CreateOrderResult> {
  const supabase = await createClient();

  try {
    // 1. Obtener información del servicio
    const { data: service, error: serviceError } = await supabase
      .from('services')
      .select('*, api_provider_id, original_price')
      .eq('id', input.serviceId)
      .eq('is_active', true)
      .single();

    if (serviceError || !service) {
      return { success: false, error: 'Servicio no encontrado o inactivo' };
    }

    // 2. Validar cantidad mínima y máxima
    if (input.quantity < service.min_quantity) {
      return {
        success: false,
        error: `La cantidad mínima es ${service.min_quantity}`,
      };
    }

    if (input.quantity > service.max_quantity) {
      return {
        success: false,
        error: `La cantidad máxima es ${service.max_quantity}`,
      };
    }

    // 3. Obtener precio para el usuario
    const pricePerThousand = await getUserPrice(input.userId, input.serviceId);

    // 4. Calcular cargos
    const charge = calculateTotalCharge(
      pricePerThousand,
      input.quantity,
      input.serviceType
    );

    const formalCharge = calculateFormalCharge(
      service.original_price || service.price_per_1000,
      input.quantity,
      input.serviceType
    );

    const profit = calculateProfit(charge, formalCharge);

    // 5. Verificar balance del usuario
    const { data: profile } = await supabase
      .from('profiles')
      .select('balance')
      .eq('id', input.userId)
      .single();

    if (!profile || profile.balance < charge) {
      return { success: false, error: 'Balance insuficiente' };
    }

    // 6. Generar número de orden único
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

    // 7. Crear orden y actualizar balance en una transacción
    const newBalance = profile.balance - charge;

    // Actualizar balance
    const { error: balanceError } = await supabase
      .from('profiles')
      .update({ balance: newBalance })
      .eq('id', input.userId);

    if (balanceError) {
      return { success: false, error: 'Error al actualizar balance' };
    }

    // Crear orden
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        order_number: orderNumber,
        user_id: input.userId,
        service_id: input.serviceId,
        service_name: input.serviceName,
        service_type: input.serviceType,
        quantity: input.quantity,
        price: charge,
        target_url: input.targetUrl,
        status: 'awaiting', // El cron job lo procesará
        started_count: 0,
        remains: input.quantity,
        notes: input.notes,
        api_provider_id: service.api_provider_id,
        api_order_id: -1, // No enviado aún
        mode: true, // true = API
        formal_charge: formalCharge,
        profit: profit,
      })
      .select()
      .single();

    if (orderError) {
      // Rollback: devolver balance
      await supabase
        .from('profiles')
        .update({ balance: profile.balance })
        .eq('id', input.userId);

      return { success: false, error: 'Error al crear el pedido' };
    }

    // 8. Crear registro de transacción
    await supabase.from('transactions').insert({
      user_id: input.userId,
      type: 'withdrawal',
      amount: -charge,
      description: `Pedido ${orderNumber}: ${input.serviceName}`,
      reference_id: order.id,
      status: 'completed',
    });

    return { success: true, order };
  } catch (error) {
    console.error('Error creating order:', error);
    return { success: false, error: 'Error interno del servidor' };
  }
}

/**
 * Actualizar estado de un pedido desde la respuesta de la API
 * Replica: lógica de actualización de estados del cron PHP
 */
export interface UpdateOrderStatusInput {
  orderId: string;
  apiStatus: string;
  charge?: string;
  startCount?: string;
  remains?: string;
  details?: Record<string, unknown>;
}

export async function updateOrderStatus(
  input: UpdateOrderStatusInput
): Promise<boolean> {
  const supabase = await createClient();

  try {
    // Mapear estado de API a estado interno
    const newStatus = mapApiStatus(input.apiStatus);

    // Obtener orden actual
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', input.orderId)
      .single();

    if (orderError || !order) {
      console.error('Order not found:', input.orderId);
      return false;
    }

    // Preparar actualización
    const updateData: Partial<Order> = {
      status: newStatus,
      updated_at: new Date().toISOString(),
    };

    if (input.startCount) {
      updateData.started_count = Number.parseInt(input.startCount, 10);
    }

    if (input.remains) {
      updateData.remains = Number.parseInt(input.remains, 10);
    }

    if (input.details) {
      updateData.details = input.details;
    }

    // Si el pedido está completado, marcar fecha de finalización
    if (isOrderFinished(newStatus) && !order.finished_at) {
      updateData.finished_at = new Date().toISOString();
      if (newStatus === 'completed') {
        updateData.completed_at = new Date().toISOString();
      }
    }

    // Calcular reembolso si es necesario
    if (['partial', 'canceled', 'refunded'].includes(newStatus)) {
      const remains = Number.parseInt(input.remains || '0', 10);
      const refund = calculateRefund(order, remains, newStatus);

      updateData.price = refund.realCharge;
      updateData.formal_charge = refund.formalCharge;
      updateData.profit = refund.profit;

      // Si hay dinero a reembolsar, actualizar balance del usuario
      if (refund.refundMoney > 0) {
        await processRefund(order.user_id, order.id, refund.refundMoney, order.order_number);
      }
    }

    // Actualizar orden
    const { error: updateError } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', input.orderId);

    if (updateError) {
      console.error('Error updating order:', updateError);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in updateOrderStatus:', error);
    return false;
  }
}

/**
 * Procesar reembolso para un pedido
 */
async function processRefund(
  userId: string,
  orderId: string,
  amount: number,
  orderNumber: string
): Promise<boolean> {
  const supabase = await createClient();

  try {
    // Obtener balance actual
    const { data: profile } = await supabase
      .from('profiles')
      .select('balance')
      .eq('id', userId)
      .single();

    if (!profile) return false;

    // Actualizar balance
    const newBalance = profile.balance + amount;
    await supabase
      .from('profiles')
      .update({ balance: newBalance })
      .eq('id', userId);

    // Crear transacción de reembolso
    await supabase.from('transactions').insert({
      user_id: userId,
      type: 'refund',
      amount: amount,
      description: `Reembolso parcial - Pedido ${orderNumber}`,
      reference_id: orderId,
      status: 'completed',
    });

    return true;
  } catch (error) {
    console.error('Error processing refund:', error);
    return false;
  }
}

/**
 * Obtener pedidos pendientes de enviar al proveedor
 * Para uso del cron job
 */
export async function getPendingOrders(limit: number = 15): Promise<Order[]> {
  const supabase = await createClient();

  const { data: orders } = await supabase
    .from('orders')
    .select('*')
    .eq('status', 'awaiting')
    .eq('mode', true)
    .eq('api_order_id', -1)
    .limit(limit)
    .order('created_at', { ascending: true });

  return orders || [];
}

/**
 * Obtener pedidos activos para actualizar estado
 * Para uso del cron job
 */
export async function getActiveOrders(limit: number = 100): Promise<Order[]> {
  const supabase = await createClient();

  const { data: orders } = await supabase
    .from('orders')
    .select('*')
    .in('status', ['pending', 'processing', 'inprogress', 'active'])
    .gt('api_order_id', 0)
    .limit(limit)
    .order('updated_at', { ascending: true });

  return orders || [];
}

/**
 * Marcar pedido como enviado a la API
 */
export async function markOrderAsSent(
  orderId: string,
  apiOrderId: number,
  status: OrderStatus = 'pending'
): Promise<boolean> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('orders')
    .update({
      api_order_id: apiOrderId,
      status: status,
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId);

  return !error;
}

/**
 * Marcar pedido con error
 */
export async function markOrderAsError(
  orderId: string,
  errorMessage: string
): Promise<boolean> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('orders')
    .update({
      status: 'error',
      details: { error: errorMessage },
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId);

  return !error;
}
