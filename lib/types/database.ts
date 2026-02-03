export type UserRole = 'cliente' | 'distribuidor' | 'soporte' | 'administrador';

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}
