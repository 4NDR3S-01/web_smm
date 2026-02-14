/**
 * Utilidades para calcular refunds en órdenes canceladas o parciales
 * Basado en la lógica del panel PHP
 */

interface OrderRefundData {
  price: number; // charge (precio que pagó el cliente)
  profit?: number; // ganancia original
  quantity: number; // cantidad original solicitada
  remains: number; // cantidad que NO se entregó
}

interface RefundCalculation {
  realCharge: number; // Precio real que debe pagar (solo por lo entregado)
  refundAmount: number; // Dinero a devolver al cliente
  newProfit: number; // Nueva ganancia después del refund
}

/**
 * Calcula el refund para una orden parcial o cancelada
 * 
 * PARTIAL: Solo se entregó parte de la orden
 * - Si pediste 1000 followers pero solo te dieron 700, remains = 300
 * - Solo pagas por los 700 entregados, te devolvemos el costo de los 300
 * 
 * CANCELED: Se canceló la orden completa
 * - remains = quantity (no se entregó nada)
 * - Te devolvemos todo el dinero
 * 
 * @param order - Datos de la orden original
 * @returns Cálculo de refund
 */
export function calculateOrderRefund(order: OrderRefundData): RefundCalculation {
  const { price, profit = 0, quantity, remains } = order;

  if (quantity === 0) {
    return {
      realCharge: 0,
      refundAmount: price,
      newProfit: 0,
    };
  }

  // Porcentaje completado = (quantity - remains) / quantity
  // Si pediste 1000 y quedan 300 sin entregar: completado = (1000-300)/1000 = 0.7 (70%)
  const completionRate = 1 - (remains / quantity);

  // Precio real = precio original * porcentaje completado
  // Si pagaste $10 y se completó el 70%: real = $10 * 0.7 = $7
  const realCharge = price * completionRate;

  // Refund = lo que pagaste - lo que realmente debes pagar
  // $10 - $7 = $3 de refund
  const refundAmount = price - realCharge;

  // Nueva ganancia = ganancia original * porcentaje completado
  const newProfit = profit * completionRate;

  return {
    realCharge: Number(realCharge.toFixed(2)),
    refundAmount: Number(refundAmount.toFixed(2)),
    newProfit: Number(newProfit.toFixed(2)),
  };
}

/**
 * Valida si una orden puede ser cancelada o marcada como parcial
 */
export function canRefundOrder(status: string): boolean {
  // No se puede hacer refund si ya está completada, cancelada o ya se hizo refund
  const nonRefundableStatuses = ['completed', 'canceled', 'refunded', 'cancelled'];
  return !nonRefundableStatuses.includes(status);
}

/**
 * Obtiene el mensaje de explicación del refund
 */
export function getRefundExplanation(status: string, refundAmount: number, completedQty: number, totalQty: number): string {
  if (status === 'canceled' || status === 'cancelled') {
    return `Orden cancelada. Se devolverá $${refundAmount.toFixed(2)} a la billetera del cliente.`;
  }
  
  if (status === 'partial') {
    const percentage = Math.round((completedQty / totalQty) * 100);
    return `Orden parcial (${percentage}% completado: ${completedQty.toLocaleString()} de ${totalQty.toLocaleString()}). Se devolverá $${refundAmount.toFixed(2)} al cliente.`;
  }

  return '';
}
