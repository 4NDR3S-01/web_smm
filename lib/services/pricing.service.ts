/**
 * Servicio de pricing y cálculos de precios
 * Replica la lógica del panel PHP (public_html/app/helpers/smmapis_helper.php)
 * Extiende las funcionalidades de lib/utils/pricing.ts
 */

import { Order } from '../types/database';
import { createClient } from '../supabase/server';

/**
 * Aplicar markup al precio del proveedor
 * Replica: import_new_rate() del PHP (línea 89-110)
 */
export async function applyMarkupToProviderPrice(
  rate: number,
  percentage: number,
  currencyRate: number = 1,
  decimalPlaces: number = 2
): Promise<number> {
  // Calcular nuevo precio con markup
  let newRate = rate + (rate * percentage) / 100;
  newRate = Number(newRate.toFixed(decimalPlaces));

  // Si el redondeo lo hizo menor o igual, usar más decimales
  if (newRate <= rate) {
    newRate = Number((rate + (rate * percentage) / 100).toFixed(6));
  }

  // Aplicar tasa de conversión de moneda
  newRate = newRate * currencyRate;

  return newRate;
}

/**
 * Obtener el precio que debe pagar un usuario por un servicio
 * Considera: precio personalizado > precio base con markup
 * Replica: get_user_price() del PHP
 */
export async function getUserPrice(
  userId: string,
  serviceId: string
): Promise<number> {
  const supabase = await createClient();

  // Buscar precio personalizado
  const { data: customPrice } = await supabase
    .from('user_prices')
    .select('custom_price')
    .eq('user_id', userId)
    .eq('service_id', serviceId)
    .single();

  if (customPrice?.custom_price) {
    return customPrice.custom_price;
  }

  // Si no hay precio personalizado, obtener precio del servicio con markup aplicado
  const { data: service } = await supabase
    .from('services_with_final_price')
    .select('final_price_per_1000')
    .eq('id', serviceId)
    .single();

  return service?.final_price_per_1000 || 0;
}

/**
 * Calcular cargo total para un pedido
 */
export function calculateTotalCharge(
  pricePerThousand: number,
  quantity: number,
  serviceType: string = 'default'
): number {
  // Para paquetes, el precio es fijo
  if (serviceType === 'package') {
    return pricePerThousand;
  }

  // Para servicios normales, calcular basado en cantidad
  return (pricePerThousand * quantity) / 1000;
}

/**
 * Calcular el costo formal (lo que se paga al proveedor)
 */
export function calculateFormalCharge(
  originalPricePerThousand: number,
  quantity: number,
  serviceType: string = 'default'
): number {
  if (serviceType === 'package') {
    return originalPricePerThousand;
  }

  return (originalPricePerThousand * quantity) / 1000;
}

/**
 * Calcular ganancia de un pedido
 */
export function calculateProfit(
  charge: number,
  formalCharge: number
): number {
  return Number((charge - formalCharge).toFixed(6));
}

/**
 * Calcular reembolso para pedidos parciales o cancelados
 * Replica: calculate_order_by_status() del PHP (línea 122-156)
 */
export interface RefundCalculation {
  realCharge: number;
  profit: number;
  formalCharge: number;
  refundMoney: number;
}

export function calculateRefund(
  order: Order,
  remains: number,
  status: string
): RefundCalculation {
  const originalCharge = order.price;
  const originalFormalCharge = order.formal_charge || 0;
  const quantity = order.quantity;

  // Si el pedido está parcialmente completado
  if (status === 'partial' || status === 'canceled') {
    // Cantidad real entregada
    const deliveredQuantity = quantity - remains;
    const deliveryRatio = deliveredQuantity / quantity;

    // Cargo real basado en lo entregado
    const realCharge = originalCharge * deliveryRatio;
    const formalCharge = originalFormalCharge * deliveryRatio;
    const profit = realCharge - formalCharge;

    // Dinero a reembolsar (lo no entregado)
    const refundMoney = originalCharge - realCharge;

    return {
      realCharge: Number(realCharge.toFixed(6)),
      profit: Number(profit.toFixed(6)),
      formalCharge: Number(formalCharge.toFixed(6)),
      refundMoney: Number(refundMoney.toFixed(6)),
    };
  }

  // Si está completamente cancelado o reembolsado
  if (status === 'refunded' || status === 'canceled') {
    return {
      realCharge: 0,
      profit: 0,
      formalCharge: 0,
      refundMoney: originalCharge,
    };
  }

  // Sin cambios
  return {
    realCharge: originalCharge,
    profit: order.profit || 0,
    formalCharge: originalFormalCharge,
    refundMoney: 0,
  };
}

/**
 * Obtener el markup aplicable para un servicio
 * Prioridad: servicio > categoría > global
 */
export async function getApplicableMarkup(
  serviceId: string,
  categoryId?: string
): Promise<number> {
  const supabase = await createClient();

  // 1. Buscar markup del servicio
  const { data: service } = await supabase
    .from('services')
    .select('markup_percentage')
    .eq('id', serviceId)
    .single();

  if (service?.markup_percentage !== null && service?.markup_percentage !== undefined) {
    return service.markup_percentage;
  }

  // 2. Buscar markup de la categoría
  if (categoryId) {
    const { data: categoryMarkup } = await supabase
      .from('markup_settings')
      .select('global_markup_percentage')
      .eq('category_id', categoryId)
      .eq('is_active', true)
      .single();

    if (categoryMarkup?.global_markup_percentage !== null && categoryMarkup?.global_markup_percentage !== undefined) {
      return categoryMarkup.global_markup_percentage;
    }
  }

  // 3. Buscar markup global (sin category_id)
  const { data: globalMarkup } = await supabase
    .from('markup_settings')
    .select('global_markup_percentage')
    .is('category_id', null)
    .eq('is_active', true)
    .single();

  if (globalMarkup?.global_markup_percentage !== null && globalMarkup?.global_markup_percentage !== undefined) {
    return globalMarkup.global_markup_percentage;
  }

  // Por defecto: 20%
  return 20;
}

/**
 * Calcular estadísticas de ganancias
 */
export interface ProfitStats {
  totalRevenue: number;
  totalCost: number;
  totalProfit: number;
  profitMargin: number;
  orderCount: number;
}

export async function calculateProfitStats(
  userId?: string,
  startDate?: Date,
  endDate?: Date
): Promise<ProfitStats> {
  const supabase = await createClient();

  let query = supabase
    .from('orders')
    .select('price, formal_charge, profit, status');

  if (userId) {
    query = query.eq('user_id', userId);
  }

  if (startDate) {
    query = query.gte('created_at', startDate.toISOString());
  }

  if (endDate) {
    query = query.lte('created_at', endDate.toISOString());
  }

  // Solo órdenes completadas
  query = query.eq('status', 'completed');

  const { data: orders } = await query;

  if (!orders || orders.length === 0) {
    return {
      totalRevenue: 0,
      totalCost: 0,
      totalProfit: 0,
      profitMargin: 0,
      orderCount: 0,
    };
  }

  interface OrderWithPrice {
    price: number;
    formal_charge?: number;
    profit?: number;
  }

  const totalRevenue = orders.reduce<number>((sum, order: OrderWithPrice) => sum + order.price, 0);
  const totalCost = orders.reduce<number>((sum, order: OrderWithPrice) => sum + (order.formal_charge || 0), 0);
  const totalProfit = orders.reduce<number>((sum, order: OrderWithPrice) => sum + (order.profit || 0), 0);
  const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

  return {
    totalRevenue: Number(totalRevenue.toFixed(2)),
    totalCost: Number(totalCost.toFixed(2)),
    totalProfit: Number(totalProfit.toFixed(2)),
    profitMargin: Number(profitMargin.toFixed(2)),
    orderCount: orders.length,
  };
}

/**
 * Validar que el markup esté en rango válido
 */
export function isValidMarkup(markup: number): boolean {
  return markup >= 0 && markup <= 100;
}

/**
 * Formatear precio para mostrar
 */
export function formatPrice(amount: number, currency: string = '$'): string {
  return `${currency}${amount.toFixed(2)}`;
}
