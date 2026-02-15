import { createClient } from '@supabase/supabase-js';

/**
 * Cliente de Supabase con privilegios de administrador
 * Usa el service_role key para bypasear Row Level Security (RLS)
 * 
 * ⚠️ SOLO usar en operaciones del servidor que requieren acceso administrativo
 * - Sincronización de servicios desde proveedores API
 * - Operaciones cron jobs
 * - Scripts de migración
 * 
 * NUNCA exponer este cliente al cliente del navegador
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL no está configurada');
  }

  if (!supabaseServiceKey) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY no está configurada. ' +
      'Obtén esta key desde: Supabase Dashboard > Settings > API > service_role key'
    );
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
