/**
 * Servicio de gestión de API Keys para distribuidores
 * Permite a clientes/distribuidores usar el panel vía API REST
 */

import { createClient } from '../supabase/server';
import { Profile } from '../types/database';

/**
 * Generar una API key aleatoria segura
 */
function generateApiKey(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const length = 64;
  let result = '';
  
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return result;
}

/**
 * Obtener perfil de usuario por API key
 */
export async function getUserByApiKey(apiKey: string): Promise<Profile | null> {
  const supabase = await createClient();
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('api_key', apiKey)
    .eq('api_status', true)
    .single();
  
  return profile;
}

/**
 * Generar nueva API key para un usuario
 */
export async function generateApiKeyForUser(
  userId: string
): Promise<{ success: boolean; apiKey?: string; error?: string }> {
  const supabase = await createClient();
  
  try {
    const newApiKey = generateApiKey();
    
    const { error } = await supabase
      .from('profiles')
      .update({
        api_key: newApiKey,
        api_status: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);
    
    if (error) {
      return { success: false, error: error.message };
    }
    
    return { success: true, apiKey: newApiKey };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Error al generar API key';
    return { success: false, error: errorMessage };
  }
}

/**
 * Deshabilitar API key de un usuario
 */
export async function disableApiKeyForUser(
  userId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  
  try {
    const { error } = await supabase
      .from('profiles')
      .update({
        api_status: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);
    
    if (error) {
      return { success: false, error: error.message };
    }
    
    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Error al deshabilitar API';
    return { success: false, error: errorMessage };
  }
}

/**
 * Habilitar API key de un usuario
 */
export async function enableApiKeyForUser(
  userId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  
  try {
    // Verificar si el usuario tiene api_key, si no, generar una
    const { data: profile } = await supabase
      .from('profiles')
      .select('api_key')
      .eq('id', userId)
      .single();
    
    if (!profile?.api_key) {
      return await generateApiKeyForUser(userId);
    }
    
    const { error } = await supabase
      .from('profiles')
      .update({
        api_status: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);
    
    if (error) {
      return { success: false, error: error.message };
    }
    
    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Error al habilitar API';
    return { success: false, error: errorMessage };
  }
}

/**
 * Regenerar API key (invalidar la anterior y crear una nueva)
 */
export async function regenerateApiKeyForUser(
  userId: string
): Promise<{ success: boolean; apiKey?: string; error?: string }> {
  return generateApiKeyForUser(userId);
}

/**
 * Obtener información de API del usuario
 */
export async function getUserApiInfo(
  userId: string
): Promise<{ apiKey?: string; apiStatus: boolean; error?: string }> {
  const supabase = await createClient();
  
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('api_key, api_status')
      .eq('id', userId)
      .single();
    
    if (error || !profile) {
      return { apiStatus: false, error: 'Usuario no encontrado' };
    }
    
    return {
      apiKey: profile.api_key || undefined,
      apiStatus: profile.api_status || false,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Error al obtener info de API';
    return { apiStatus: false, error: errorMessage };
  }
}
