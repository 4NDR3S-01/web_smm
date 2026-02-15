/**
 * Servicio de gestión de proveedores API SMM
 * Replica la lógica del panel PHP (public_html/app/modules/admin/controllers/provider.php)
 */

import { createClient } from '../supabase/server';
import { ApiProvider, ProviderType } from '../types/database';
import { SmmApiClient } from '../api/smm-provider';

export interface CreateProviderInput {
  name: string;
  url: string;
  api_key: string;
  type: ProviderType;
  description?: string;
  status?: boolean;
}

export interface TestConnectionResult {
  success: boolean;
  balance?: number;
  error?: string;
}

/**
 * Crear un nuevo proveedor API
 */
export async function createProvider(
  input: CreateProviderInput
): Promise<{ success: boolean; provider?: ApiProvider; error?: string }> {
  const supabase = await createClient();

  try {
    // Primero, validar la conexión con el proveedor
    console.log('[createProvider] Validando conexión con proveedor:', {
      url: input.url,
      type: input.type
    });
    
    const apiClient = new SmmApiClient(input.url, input.api_key);
    
    let initialBalance = 0;
    try {
      const balanceData = await apiClient.getBalance();
      console.log('[createProvider] Balance obtenido:', balanceData);
      initialBalance = Number.parseFloat(balanceData.balance);
    } catch (error) {
      console.error('[createProvider] Error validating provider connection:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      return { 
        success: false, 
        error: `No se pudo conectar con el proveedor: ${errorMessage}. Verifica la URL y API key.` 
      };
    }

    // Si la conexión es exitosa, crear el proveedor
    const { data: provider, error } = await supabase
      .from('api_providers')
      .insert({
        name: input.name,
        url: input.url,
        api_key: input.api_key,
        type: input.type,
        description: input.description,
        status: input.status ?? true,
        balance: initialBalance,
        no_current_services: 0,
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, provider };
  } catch (error) {
    console.error('Error creating provider:', error);
    return { success: false, error: 'Error interno al crear proveedor' };
  }
}

/**
 * Actualizar un proveedor existente
 */
export async function updateProvider(
  id: string,
  updates: Partial<CreateProviderInput>
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  try {
    const { error } = await supabase
      .from('api_providers')
      .update(updates)
      .eq('id', id);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error updating provider:', error);
    return { success: false, error: 'Error interno al actualizar proveedor' };
  }
}

/**
 * Obtener un proveedor por ID
 */
export async function getProvider(id: string): Promise<ApiProvider | null> {
  const supabase = await createClient();

  const { data: provider } = await supabase
    .from('api_providers')
    .select('*')
    .eq('id', id)
    .single();

  return provider;
}

/**
 * Obtener todos los proveedores activos
 */
export async function getActiveProviders(): Promise<ApiProvider[]> {
  const supabase = await createClient();

  const { data: providers } = await supabase
    .from('api_providers')
    .select('*')
    .eq('status', true)
    .order('name');

  return providers || [];
}

/**
 * Obtener todos los proveedores (activos e inactivos)
 */
export async function getAllProviders(): Promise<ApiProvider[]> {
  const supabase = await createClient();

  // Obtener proveedores con conteo de servicios importados
  const { data: providers } = await supabase
    .from('api_providers')
    .select(`
      *,
      services:services(count)
    `)
    .order('created_at', { ascending: false });

  // Mapear el resultado para incluir el conteo correcto
  const providersWithCount = (providers || []).map(provider => ({
    ...provider,
    no_current_services: provider.services?.[0]?.count || 0,
    services: undefined, // Eliminar el campo temporal
  }));

  return providersWithCount as ApiProvider[];
}

/**
 * Probar conexión con un proveedor
 */
export async function testProviderConnection(
  provider: ApiProvider
): Promise<TestConnectionResult> {
  try {
    const apiClient = new SmmApiClient(provider.url, provider.api_key);

    // Intentar obtener balance (testConnection internamente hace lo mismo)
    const balanceData = await apiClient.getBalance();
    const balance = Number.parseFloat(balanceData.balance);

    // Actualizar balance en la base de datos
    const supabase = await createClient();
    await supabase
      .from('api_providers')
      .update({ balance })
      .eq('id', provider.id);

    return { success: true, balance };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Error de conexión';
    return { success: false, error: errorMessage };
  }
}

/**
 * Actualizar balance de un proveedor
 */
export async function updateProviderBalance(
  providerId: string
): Promise<{ success: boolean; balance?: number; error?: string }> {
  try {
    const provider = await getProvider(providerId);
    if (!provider) {
      return { success: false, error: 'Proveedor no encontrado' };
    }

    const apiClient = new SmmApiClient(provider.url, provider.api_key);

    const balanceData = await apiClient.getBalance();
    const balance = Number.parseFloat(balanceData.balance);

    // Actualizar en la base de datos
    const supabase = await createClient();
    await supabase
      .from('api_providers')
      .update({ balance })
      .eq('id', providerId);

    return { success: true, balance };
  } catch (error: any) {
    return { success: false, error: error.message || 'Error al obtener balance' };
  }
}

/**
 * Obtener proveedores ordenados por última sincronización
 * Útil para el cron job de sincronización
 */
export async function getProvidersForSync(limit?: number): Promise<ApiProvider[]> {
  const supabase = await createClient();

  let query = supabase
    .from('api_providers')
    .select('*')
    .eq('status', true)
    .order('last_sync_at', { ascending: true, nullsFirst: true });

  if (limit) {
    query = query.limit(limit);
  }

  const { data: providers } = await query;

  return providers || [];
}

/**
 * Marcar proveedor como sincronizado
 */
export async function markProviderAsSynced(
  providerId: string,
  servicesCount?: number
): Promise<void> {
  const supabase = await createClient();

  const updateData: any = {
    last_sync_at: new Date().toISOString(),
  };

  if (servicesCount !== undefined) {
    updateData.no_current_services = servicesCount;
  }

  await supabase
    .from('api_providers')
    .update(updateData)
    .eq('id', providerId);
}

/**
 * Eliminar un proveedor
 */
export async function deleteProvider(
  id: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  try {
    // Verificar si tiene servicios asociados
    const { data: services } = await supabase
      .from('services')
      .select('id')
      .eq('api_provider_id', id)
      .limit(1);

    if (services && services.length > 0) {
      return {
        success: false,
        error: 'No se puede eliminar el proveedor porque tiene servicios asociados',
      };
    }

    const { error } = await supabase
      .from('api_providers')
      .delete()
      .eq('id', id);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error deleting provider:', error);
    return { success: false, error: 'Error interno al eliminar proveedor' };
  }
}

/**
 * Obtener estadísticas de un proveedor
 */
export interface ProviderStats {
  totalServices: number;
  activeServices: number;
  totalOrders: number;
  completedOrders: number;
  totalRevenue: number;
  lastSync?: string;
}

export async function getProviderStats(providerId: string): Promise<ProviderStats> {
  const supabase = await createClient();

  // Servicios
  const { data: allServices } = await supabase
    .from('services')
    .select('id, is_active')
    .eq('api_provider_id', providerId);

  const totalServices = allServices?.length || 0;
  const activeServices = allServices?.filter((s: { is_active: boolean }) => s.is_active).length || 0;

  // Pedidos
  const { data: orders } = await supabase
    .from('orders')
    .select('status, price')
    .eq('api_provider_id', providerId);

  const totalOrders = orders?.length || 0;
  const completedOrders = orders?.filter((o: { status: string }) => o.status === 'completed').length || 0;
  const totalRevenue = orders
    ?.filter((o: { status: string }) => o.status === 'completed')
    .reduce((sum: number, o: { price: number }) => sum + o.price, 0) || 0;

  // Última sincronización
  const { data: provider } = await supabase
    .from('api_providers')
    .select('last_sync_at')
    .eq('id', providerId)
    .single();

  return {
    totalServices,
    activeServices,
    totalOrders,
    completedOrders,
    totalRevenue,
    lastSync: provider?.last_sync_at,
  };
}
