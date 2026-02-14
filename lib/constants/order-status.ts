import { OrderStatus } from '../types/database';

/**
 * Estados de pedidos en el sistema
 * Basado en el panel PHP (public_html/app/config/constants.php)
 */
export const ORDER_STATUS = {
  AWAITING: 'awaiting',
  PENDING: 'pending',
  INPROGRESS: 'inprogress',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  PARTIAL: 'partial',
  CANCELED: 'canceled',
  REFUNDED: 'refunded',
  ERROR: 'error',
  FAIL: 'fail',
  ACTIVE: 'active',
  PAUSED: 'paused',
  EXPIRED: 'expired',
  REJECTED: 'rejected',
} as const;

/**
 * Mapeo de estados de API externa a estados internos
 * Los proveedores SMM pueden devolver estados en diferentes formatos
 */
export const API_TO_DB_STATUS_MAP: Record<string, OrderStatus> = {
  // Estados estándar
  'Completed': 'completed',
  'Complete': 'completed',
  'completed': 'completed',
  
  // Estados en progreso
  'In progress': 'inprogress',
  'Inprogress': 'inprogress',
  'in progress': 'inprogress',
  'inprogress': 'inprogress',
  
  'Processing': 'processing',
  'processing': 'processing',
  
  'Pending': 'pending',
  'pending': 'pending',
  
  // Estados activos (subscriptions)
  'Active': 'active',
  'active': 'active',
  
  // Estados de problema
  'Partial': 'partial',
  'partial': 'partial',
  'Partially completed': 'partial',
  
  'Canceled': 'canceled',
  'Cancelled': 'canceled',
  'canceled': 'canceled',
  'cancelled': 'canceled',
  
  'Refunded': 'refunded',
  'refunded': 'refunded',
  
  'Error': 'error',
  'error': 'error',
  
  'Fail': 'fail',
  'Failed': 'fail',
  'fail': 'fail',
  'failed': 'fail',
  
  // Estados especiales
  'Paused': 'paused',
  'paused': 'paused',
  
  'Expired': 'expired',
  'expired': 'expired',
  
  'Rejected': 'rejected',
  'rejected': 'rejected',
};

/**
 * Estados que indican que el pedido está en proceso
 */
export const ACTIVE_ORDER_STATUSES: OrderStatus[] = [
  'pending',
  'processing',
  'inprogress',
  'active',
];

/**
 * Estados que indican que el pedido ha finalizado
 */
export const COMPLETED_ORDER_STATUSES: OrderStatus[] = [
  'completed',
  'partial',
  'canceled',
  'refunded',
  'rejected',
  'expired',
];

/**
 * Estados que indican error o fallo
 */
export const ERROR_ORDER_STATUSES: OrderStatus[] = [
  'error',
  'fail',
];

/**
 * Colores de badge para cada estado
 */
export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  awaiting: 'bg-gray-100 text-gray-800',
  pending: 'bg-blue-100 text-blue-800',
  inprogress: 'bg-blue-100 text-blue-800',
  processing: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  partial: 'bg-yellow-100 text-yellow-800',
  canceled: 'bg-red-100 text-red-800',
  refunded: 'bg-purple-100 text-purple-800',
  error: 'bg-red-100 text-red-800',
  fail: 'bg-red-100 text-red-800',
  active: 'bg-green-100 text-green-800',
  paused: 'bg-gray-100 text-gray-800',
  expired: 'bg-gray-100 text-gray-800',
  rejected: 'bg-red-100 text-red-800',
};

/**
 * Textos en español para cada estado
 */
export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  awaiting: 'En espera',
  pending: 'Pendiente',
  inprogress: 'En progreso',
  processing: 'Procesando',
  completed: 'Completado',
  partial: 'Parcial',
  canceled: 'Cancelado',
  refunded: 'Reembolsado',
  error: 'Error',
  fail: 'Fallido',
  active: 'Activo',
  paused: 'Pausado',
  expired: 'Expirado',
  rejected: 'Rechazado',
};

/**
 * Mapear estado de API a estado interno
 */
export function mapApiStatus(apiStatus: string): OrderStatus {
  const mapped = API_TO_DB_STATUS_MAP[apiStatus];
  if (!mapped) {
    console.warn(`Unknown API status: ${apiStatus}, defaulting to 'pending'`);
    return 'pending';
  }
  return mapped;
}

/**
 * Verificar si un pedido puede ser cancelado
 */
export function canCancelOrder(status: OrderStatus): boolean {
  return ['awaiting', 'pending', 'processing', 'inprogress'].includes(status);
}

/**
 * Verificar si un pedido puede solicitar refill
 */
export function canRefillOrder(status: OrderStatus): boolean {
  return ['completed', 'partial'].includes(status);
}

/**
 * Verificar si un pedido está finalizado
 */
export function isOrderFinished(status: OrderStatus): boolean {
  return COMPLETED_ORDER_STATUSES.includes(status) || ERROR_ORDER_STATUSES.includes(status);
}
