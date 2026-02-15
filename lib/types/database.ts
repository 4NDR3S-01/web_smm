export type UserRole = 'cliente' | 'distribuidor' | 'soporte' | 'administrador';

export type OrderStatus = 
  | 'awaiting'
  | 'pending'
  | 'inprogress'
  | 'processing'
  | 'completed'
  | 'partial'
  | 'canceled'
  | 'refunded'
  | 'error'
  | 'fail'
  | 'active'
  | 'paused'
  | 'expired'
  | 'rejected';

export type ServiceType = 
  | 'default'
  | 'package'
  | 'subscriptions'
  | 'custom_comments'
  | 'custom_comments_package'
  | 'mentions_with_hashtags'
  | 'mentions_custom_list'
  | 'mentions_hashtag'
  | 'mentions_user_followers'
  | 'mentions_media_likers'
  | 'comment_likes';

export type ProviderType = 'standard' | 'indusrabbit' | 'yoyomedia' | 'instasmm' | 'realfans';

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  avatar_url?: string;
  phone?: string;
  balance: number;
  api_key?: string;
  api_status?: boolean;
  preferences?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface ServiceCategory {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Service {
  id: string;
  category_id?: string;
  name: string;
  description?: string;
  type: ServiceType;
  price_per_1000: number;
  min_quantity: number;
  max_quantity: number;
  is_active: boolean;
  delivery_time: string;
  // API Provider fields
  api_provider_id?: string;
  api_service_id?: string;
  add_type?: 'api' | 'manual';
  original_price?: number; // Precio del proveedor antes de markup
  api_price?: number; // Deprecated: usar original_price
  markup_percentage?: number;
  // Service metadata
  avg_time?: string;
  refill?: boolean;
  cancel?: boolean;
  last_sync_at?: string;
  created_at: string;
  updated_at: string;
}

export interface ServiceWithFinalPrice extends Service {
  final_price_per_1000: number;
}

// MarkupSetting removed - markup_settings table dropped
// Now using simple provider-based markup + per-sync customization

export interface ApiSyncLog {
  id: string;
  sync_type: 'services' | 'categories' | 'prices';
  status: 'success' | 'error' | 'partial';
  services_synced: number;
  errors_count: number;
  error_details?: string;
  started_at: string;
  completed_at?: string;
  performed_by?: string;
}

export interface Order {
  id: string;
  order_number: string;
  user_id: string;
  service_id?: string;
  service_name: string;
  service_type: ServiceType;
  quantity: number;
  price: number; // Cargo al cliente
  target_url: string;
  status: OrderStatus;
  started_count: number;
  remains?: number;
  notes?: string;
  // API Provider fields
  api_provider_id?: string;
  api_order_id?: number; // ID en el proveedor externo (-1 = no enviado)
  mode?: boolean; // true = API, false = Manual
  formal_charge?: number; // Costo del proveedor
  profit?: number; // Ganancia calculada
  details?: Record<string, any>; // Logs de respuestas API
  // Timestamps
  created_at: string;
  updated_at: string;
  completed_at?: string;
  finished_at?: string;
}

export interface ApiProvider {
  id: string;
  name: string;
  url: string;
  api_key: string;
  type: ProviderType;
  balance?: number;
  status: boolean;
  description?: string;
  no_current_services?: number;
  last_sync_at?: string;
  created_at: string;
  updated_at: string;
}

export interface ServiceSyncOption {
  id: string;
  service_id: string;
  sync_rate: boolean; // Sincronizar precio
  auto_rate_percent?: number; // Porcentaje de margen
  sync_min: boolean; // Sincronizar mínimo
  sync_max: boolean; // Sincronizar máximo
  auto_status: boolean; // Auto-activar/desactivar
  auto_sync_name: boolean; // Sincronizar nombre
  auto_sync_desc: boolean; // Sincronizar descripción
  created_at: string;
  updated_at: string;
}

export interface OrderRefill {
  id: string;
  order_id: string;
  api_refill_id?: string;
  status: 'pending' | 'completed' | 'rejected';
  created_at: string;
  updated_at: string;
}

export interface OrderCancel {
  id: string;
  order_id: string;
  reason?: string;
  status: 'pending' | 'completed' | 'rejected';
  created_at: string;
  updated_at: string;
}

export interface UserPrice {
  id: string;
  user_id: string;
  service_id: string;
  custom_price: number; // Precio personalizado por 1000
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  type: 'deposit' | 'withdrawal' | 'refund';
  amount: number;
  description?: string;
  reference_id?: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  payment_method?: string;
  created_at: string;
}

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, 'id' | 'created_at' | 'updated_at'> & { id: string };
        Update: Partial<Profile>;
      };
      service_categories: {
        Row: ServiceCategory;
        Insert: Omit<ServiceCategory, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<ServiceCategory>;
      };
      services: {
        Row: Service;
        Insert: Omit<Service, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Service>;
      };
      orders: {
        Row: Order;
        Insert: Omit<Order, 'id' | 'order_number' | 'created_at' | 'updated_at'>;
        Update: Partial<Order>;
      };
      transactions: {
        Row: Transaction;
        Insert: Omit<Transaction, 'id' | 'created_at'>;
        Update: Partial<Transaction>;
      };
      api_sync_log: {
        Row: ApiSyncLog;
        Insert: Omit<ApiSyncLog, 'id' | 'started_at'>;
        Update: Partial<ApiSyncLog>;
      };
      api_providers: {
        Row: ApiProvider;
        Insert: Omit<ApiProvider, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<ApiProvider>;
      };
      service_sync_options: {
        Row: ServiceSyncOption;
        Insert: Omit<ServiceSyncOption, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<ServiceSyncOption>;
      };
      orders_refill: {
        Row: OrderRefill;
        Insert: Omit<OrderRefill, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<OrderRefill>;
      };
      orders_cancel: {
        Row: OrderCancel;
        Insert: Omit<OrderCancel, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<OrderCancel>;
      };
      user_prices: {
        Row: UserPrice;
        Insert: Omit<UserPrice, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<UserPrice>;
      };
    };
    Views: {
      services_with_final_price: {
        Row: ServiceWithFinalPrice;
      };
    };
  };
};


