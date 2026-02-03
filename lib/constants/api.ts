/**
 * Configuración para integración con API externa de proveedores SMM
 */

// Configuración de la API del proveedor
export const API_PROVIDER_CONFIG = {
  // URL base de la API (se configurará en variables de entorno)
  BASE_URL: process.env.NEXT_PUBLIC_SMM_API_URL || '',
  API_KEY: process.env.SMM_API_KEY || '',
  
  // Endpoints comunes de proveedores SMM
  ENDPOINTS: {
    SERVICES: '/services',
    CATEGORIES: '/categories', 
    ORDER: '/order',
    STATUS: '/status',
    BALANCE: '/balance',
    ADD_ORDER: '/add',
  },
  
  // Configuración de sincronización
  SYNC_INTERVAL: 24 * 60 * 60 * 1000, // 24 horas en milisegundos
  MAX_RETRIES: 3,
  TIMEOUT: 30000, // 30 segundos
};

// Markup por defecto para servicios (%)
export const DEFAULT_MARKUP = {
  GLOBAL: 20, // 20% de margen por defecto
  MIN: 0,
  MAX: 100,
};

// Estados de sincronización
export const SYNC_STATUS = {
  IDLE: 'idle',
  SYNCING: 'syncing',
  SUCCESS: 'success',
  ERROR: 'error',
  PARTIAL: 'partial',
} as const;

// Tipos de sincronización
export const SYNC_TYPES = {
  SERVICES: 'services',
  CATEGORIES: 'categories',
  PRICES: 'prices',
  BALANCE: 'balance',
} as const;

// Mapeo de tipos de servicio de la API a categorías locales
export const SERVICE_TYPE_MAPPING: Record<string, string> = {
  'instagram_followers': 'instagram',
  'instagram_likes': 'instagram',
  'instagram_views': 'instagram',
  'instagram_comments': 'instagram',
  'tiktok_followers': 'tiktok',
  'tiktok_likes': 'tiktok',
  'tiktok_views': 'tiktok',
  'youtube_subscribers': 'youtube',
  'youtube_views': 'youtube',
  'youtube_likes': 'youtube',
  'facebook_followers': 'facebook',
  'facebook_likes': 'facebook',
  'twitter_followers': 'twitter',
  'twitter_likes': 'twitter',
  'twitter_retweets': 'twitter',
};

// Configuración del panel de administrador
export const ADMIN_CONFIG = {
  // Permisos
  PERMISSIONS: {
    SYNC_SERVICES: ['administrador'],
    MANAGE_MARKUP: ['administrador'],
    VIEW_LOGS: ['administrador', 'soporte'],
    MANAGE_USERS: ['administrador'],
    VIEW_STATS: ['administrador', 'soporte'],
  },
  
  // Límites de paginación para admin
  PAGINATION: {
    SERVICES: 50,
    USERS: 20,
    ORDERS: 30,
    LOGS: 50,
  },
};

// Mensajes de estado de sincronización
export const SYNC_MESSAGES = {
  IDLE: 'Sin sincronización reciente',
  SYNCING: 'Sincronizando servicios...',
  SUCCESS: 'Sincronización completada',
  ERROR: 'Error en la sincronización',
  PARTIAL: 'Sincronización parcial completada',
} as const;

// Configuración de alertas para admin
export const ADMIN_ALERTS = {
  LOW_BALANCE_THRESHOLD: 100, // Alertar cuando el balance sea menor a $100
  OLD_SYNC_THRESHOLD: 48 * 60 * 60 * 1000, // Alertar si hace más de 48h que no se sincroniza
  ERROR_LOG_LIMIT: 10, // Mostrar últimos 10 errores
};

/**
 * Interfaces para respuestas de API externa
 */
export interface ApiServiceResponse {
  service: string; // ID del servicio en la API
  name: string;
  type: string;
  rate: string; // Precio por 1000
  min: string; // Cantidad mínima
  max: string; // Cantidad máxima
  category?: string;
  description?: string;
  dripfeed?: boolean;
  refill?: boolean;
}

export interface ApiBalanceResponse {
  balance: string;
  currency: string;
}

export interface ApiOrderResponse {
  order: string; // ID del pedido en la API externa
  status?: string;
  charge?: string; // Monto cobrado
  start_count?: string;
  remains?: string;
}

export interface ApiStatusResponse {
  charge: string;
  start_count: string;
  status: string;
  remains: string;
  currency: string;
}
