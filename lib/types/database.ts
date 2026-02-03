export type UserRole = 'cliente' | 'distribuidor' | 'soporte' | 'administrador';

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  avatar_url?: string;
  balance: number;
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
  type: string;
  price_per_1000: number;
  min_quantity: number;
  max_quantity: number;
  is_active: boolean;
  delivery_time: string;
  // Nuevos campos para API externa
  api_service_id?: string;
  api_price?: number;
  markup_percentage?: number;
  last_sync_at?: string;
  created_at: string;
  updated_at: string;
}

export interface ServiceWithFinalPrice extends Service {
  final_price_per_1000: number;
}

export interface MarkupSetting {
  id: string;
  category_id?: string;
  global_markup_percentage: number;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

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
  service_type: string;
  quantity: number;
  price: number;
  target_url: string;
  status: 'pending' | 'processing' | 'completed' | 'cancelled' | 'refunded';
  started_count: number;
  remains?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
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
      markup_settings: {
        Row: MarkupSetting;
        Insert: Omit<MarkupSetting, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<MarkupSetting>;
      };
      api_sync_log: {
        Row: ApiSyncLog;
        Insert: Omit<ApiSyncLog, 'id' | 'started_at'>;
        Update: Partial<ApiSyncLog>;
      };
    };
    Views: {
      services_with_final_price: {
        Row: ServiceWithFinalPrice;
      };
    };
  };
};


