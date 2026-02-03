/**
 * Constantes de configuración de la aplicación
 */

// Información de la aplicación
export const APP_NAME = "ViralizaTuRed";
export const APP_DESCRIPTION = "Panel SMM para gestión de servicios de redes sociales";
export const APP_VERSION = "1.0.0";

// Configuración de sesión
export const SESSION_TIMEOUT = 15 * 60 * 1000; // 15 minutos en milisegundos
export const SESSION_WARNING_TIME = 2 * 60 * 1000; // 2 minutos antes de expirar

// Límites de paginación
export const ORDERS_PER_PAGE = 10;
export const TRANSACTIONS_PER_PAGE = 10;
export const SERVICES_PER_PAGE = 20;

// Montos predefinidos para recarga
export const PRESET_AMOUNTS = [10, 25, 50, 100, 250, 500];

// Configuración de pedidos
export const ORDER_CONFIG = {
  MIN_ORDER_AMOUNT: 1,
  MAX_ORDER_AMOUNT: 1000000,
  DEFAULT_CURRENCY: "USD",
  CURRENCY_SYMBOL: "$"
};

// Estados de pedidos
export const ORDER_STATUS = {
  PENDING: "pending",
  PROCESSING: "processing",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
  REFUNDED: "refunded"
} as const;

// Estados de transacciones
export const TRANSACTION_STATUS = {
  PENDING: "pending",
  COMPLETED: "completed",
  FAILED: "failed",
  CANCELLED: "cancelled"
} as const;

// Tipos de transacciones
export const TRANSACTION_TYPES = {
  DEPOSIT: "deposit",
  WITHDRAWAL: "withdrawal",
  REFUND: "refund"
} as const;

// Roles de usuario
export const USER_ROLES = {
  CLIENTE: "cliente",
  DISTRIBUIDOR: "distribuidor",
  SOPORTE: "soporte",
  ADMIN: "administrador"
} as const;

// Configuración de formatos
export const LOCALE = "es-ES";
export const DATE_FORMAT = {
  SHORT: { year: 'numeric', month: '2-digit', day: '2-digit' } as Intl.DateTimeFormatOptions,
  LONG: { 
    year: 'numeric', 
    month: '2-digit', 
    day: '2-digit', 
    hour: '2-digit', 
    minute: '2-digit' 
  } as Intl.DateTimeFormatOptions
};

// Mensajes de error comunes
export const ERROR_MESSAGES = {
  UNAUTHORIZED: "No estás autorizado para realizar esta acción",
  NOT_FOUND: "El recurso solicitado no fue encontrado",
  SERVER_ERROR: "Error del servidor. Por favor, intenta de nuevo más tarde",
  NETWORK_ERROR: "Error de conexión. Verifica tu conexión a internet",
  INVALID_DATA: "Los datos proporcionados no son válidos",
  INSUFFICIENT_BALANCE: "Saldo insuficiente para completar la operación"
};

// Mensajes de éxito
export const SUCCESS_MESSAGES = {
  ORDER_CREATED: "Pedido creado exitosamente",
  PAYMENT_SUCCESS: "Pago procesado correctamente",
  PROFILE_UPDATED: "Perfil actualizado exitosamente",
  PASSWORD_CHANGED: "Contraseña cambiada exitosamente"
};

// URLs de la API (si las usas)
export const API_ENDPOINTS = {
  ORDERS: "/api/orders",
  TRANSACTIONS: "/api/transactions",
  SERVICES: "/api/services",
  PROFILE: "/api/profile"
};

// Configuración de servicios populares
export const POPULAR_SERVICES = [
  {
    name: "Instagram",
    slug: "instagram",
    icon: "Instagram",
    gradient: "from-pink-500 to-purple-500"
  },
  {
    name: "YouTube",
    slug: "youtube",
    icon: "Youtube",
    gradient: "from-red-500 to-pink-500"
  },
  {
    name: "Facebook",
    slug: "facebook",
    icon: "Facebook",
    gradient: "from-blue-600 to-blue-400"
  },
  {
    name: "X (Twitter)",
    slug: "twitter",
    icon: "Twitter",
    gradient: "from-gray-800 to-gray-600"
  },
  {
    name: "TikTok",
    slug: "tiktok",
    icon: "Package",
    gradient: "from-black to-pink-600"
  }
] as const;
