import type { Service, MarkupSetting } from "../types/database";
import { DEFAULT_MARKUP } from "../constants/api";

/**
 * Calcula el precio final de un servicio aplicando el markup
 * @param apiPrice - Precio original de la API del proveedor
 * @param markupPercentage - Porcentaje de markup a aplicar
 * @returns Precio final con markup aplicado
 */
export function calculateFinalPrice(
  apiPrice: number,
  markupPercentage: number = DEFAULT_MARKUP.GLOBAL
): number {
  const markup = 1 + (markupPercentage / 100);
  return Number((apiPrice * markup).toFixed(4));
}

/**
 * Calcula el markup que se está aplicando
 * @param apiPrice - Precio original de la API
 * @param finalPrice - Precio final al cliente
 * @returns Porcentaje de markup aplicado
 */
export function calculateMarkupPercentage(
  apiPrice: number,
  finalPrice: number
): number {
  if (apiPrice === 0) return 0;
  return Number((((finalPrice - apiPrice) / apiPrice) * 100).toFixed(2));
}

/**
 * Calcula la ganancia bruta de un pedido
 * @param quantity - Cantidad del pedido
 * @param apiPrice - Precio por 1000 de la API
 * @param finalPrice - Precio por 1000 al cliente
 * @returns Ganancia bruta en la moneda base
 */
export function calculateProfit(
  quantity: number,
  apiPrice: number,
  finalPrice: number
): number {
  const apiCost = (apiPrice / 1000) * quantity;
  const clientPrice = (finalPrice / 1000) * quantity;
  return Number((clientPrice - apiCost).toFixed(2));
}

/**
 * Obtiene el markup aplicable a un servicio
 * Prioridad: markup específico del servicio > markup de categoría > markup global
 * @param service - Servicio a evaluar
 * @param markupSettings - Configuraciones de markup disponibles
 * @returns Porcentaje de markup a aplicar
 */
export function getApplicableMarkup(
  service: Service,
  markupSettings: MarkupSetting[] = []
): number {
  // 1. Prioridad: markup específico del servicio
  if (service.markup_percentage !== null && service.markup_percentage !== undefined) {
    return service.markup_percentage;
  }

  // 2. Prioridad: markup de la categoría del servicio
  if (service.category_id) {
    const categoryMarkup = markupSettings.find(
      m => m.category_id === service.category_id && m.is_active
    );
    if (categoryMarkup) {
      return categoryMarkup.global_markup_percentage;
    }
  }

  // 3. Prioridad: markup global (sin category_id)
  const globalMarkup = markupSettings.find(
    m => !m.category_id && m.is_active
  );
  if (globalMarkup) {
    return globalMarkup.global_markup_percentage;
  }

  // 4. Por defecto
  return DEFAULT_MARKUP.GLOBAL;
}

/**
 * Calcula el precio final de un servicio considerando todos los markups
 * @param service - Servicio a calcular
 * @param markupSettings - Configuraciones de markup
 * @returns Precio final por 1000 unidades
 */
export function calculateServiceFinalPrice(
  service: Service,
  markupSettings: MarkupSetting[] = []
): number {
  const apiPrice = service.api_price || service.price_per_1000;
  const markup = getApplicableMarkup(service, markupSettings);
  return calculateFinalPrice(apiPrice, markup);
}

/**
 * Formatea un número como precio
 * @param price - Precio a formatear
 * @param currency - Símbolo de moneda
 * @returns Precio formateado
 */
export function formatPrice(price: number, currency: string = "$"): string {
  return `${currency}${price.toFixed(2)}`;
}

/**
 * Calcula el costo total de un pedido en la API externa
 * @param quantity - Cantidad del pedido
 * @param apiPricePer1000 - Precio por 1000 en la API
 * @returns Costo total del pedido
 */
export function calculateApiCost(
  quantity: number,
  apiPricePer1000: number
): number {
  return Number(((apiPricePer1000 / 1000) * quantity).toFixed(4));
}

/**
 * Calcula el precio al cliente de un pedido
 * @param quantity - Cantidad del pedido
 * @param finalPricePer1000 - Precio final por 1000
 * @returns Precio total al cliente
 */
export function calculateClientPrice(
  quantity: number,
  finalPricePer1000: number
): number {
  return Number(((finalPricePer1000 / 1000) * quantity).toFixed(2));
}

/**
 * Valida si un markup está dentro de los límites permitidos
 * @param markup - Porcentaje de markup
 * @returns true si es válido
 */
export function isValidMarkup(markup: number): boolean {
  return markup >= DEFAULT_MARKUP.MIN && markup <= DEFAULT_MARKUP.MAX;
}

/**
 * Calcula estadísticas de ganancias para un período
 * @param orders - Array de pedidos
 * @returns Objeto con estadísticas
 */
export function calculateProfitStats(orders: Array<{
  quantity: number;
  price: number;
  service_id?: string;
}>, services: Service[]) {
  let totalRevenue = 0;
  let totalCost = 0;
  let totalProfit = 0;

  orders.forEach(order => {
    const service = services.find(s => s.id === order.service_id);
    if (!service) return;

    const clientPrice = order.price;
    const apiCost = calculateApiCost(
      order.quantity,
      service.api_price || service.price_per_1000
    );

    totalRevenue += clientPrice;
    totalCost += apiCost;
    totalProfit += (clientPrice - apiCost);
  });

  return {
    totalRevenue: Number(totalRevenue.toFixed(2)),
    totalCost: Number(totalCost.toFixed(2)),
    totalProfit: Number(totalProfit.toFixed(2)),
    profitMargin: totalRevenue > 0 
      ? Number(((totalProfit / totalRevenue) * 100).toFixed(2))
      : 0,
  };
}
