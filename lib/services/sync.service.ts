/**
 * Servicio de sincronización con proveedores API SMM
 * Replica la lógica del panel PHP (public_html/app/modules/cron/controllers/provider.php)
 */

import { createClient } from '../supabase/server';
import { ApiProvider, Service, ServiceSyncOption } from '../types/database';
import { SmmApiClient } from '../api/smm-provider';
import { applyMarkupToProviderPrice } from './pricing.service';
import { markProviderAsSynced } from './provider.service';

export interface SyncServicesInput {
  providerId: string;
  categoryId?: string;
  markupPercentage?: number;
  autoImport?: boolean;
}

export interface SyncResult {
  success: boolean;
  stats: {
    total: number;
    newServices: number;
    updatedServices: number;
    deactivatedServices: number;
    errors: number;
  };
  errors?: string[];
  provider?: ApiProvider;
}

/**
 * Sincronizar servicios de un proveedor
 * Replica: sync_services del PHP (línea 12-92)
 */
export async function syncServicesFromProvider(
  input: SyncServicesInput
): Promise<SyncResult> {
  const supabase = await createClient();

  const stats = {
    total: 0,
    newServices: 0,
    updatedServices: 0,
    deactivatedServices: 0,
    errors: 0,
  };

  const errors: string[] = [];

  try {
    // 1. Obtener datos del proveedor
    const { data: provider } = await supabase
      .from('api_providers')
      .select('*')
      .eq('id', input.providerId)
      .single();

    if (!provider) {
      return {
        success: false,
        stats,
        errors: ['Proveedor no encontrado'],
      };
    }

    // 2. Conectar con la API del proveedor
    const apiClient = new SmmApiClient(provider.url, provider.api_key);

    // 3. Obtener lista de servicios de la API
    const apiServices = await apiClient.getServices();
    stats.total = apiServices.length;

    // 4. Obtener servicios existentes de este proveedor
    const { data: existingServices } = await supabase
      .from('services')
      .select('*, service_sync_options(*)')
      .eq('api_provider_id', input.providerId);

    const existingServiceMap = new Map(
      (existingServices || []).map(s => [s.api_service_id, s])
    );

    // IDs de servicios de la API (para detectar eliminados)
    const apiServiceIds = new Set(apiServices.map(s => s.service));

    // 5. Procesar cada servicio de la API
    for (const apiService of apiServices) {
      try {
        const existingService = existingServiceMap.get(apiService.service);

        if (existingService) {
          // Actualizar servicio existente
          await updateExistingService(
            existingService,
            apiService,
            input.markupPercentage
          );
          stats.updatedServices++;
        } else if (input.autoImport) {
          // Crear nuevo servicio
          await createNewService(
            apiService,
            input.providerId,
            input.categoryId,
            input.markupPercentage
          );
          stats.newServices++;
        }
      } catch (error: any) {
        stats.errors++;
        errors.push(`Servicio ${apiService.service}: ${error.message}`);
      }
    }

    // 6. Desactivar servicios que ya no existen en la API
    if (existingServices) {
      for (const existingService of existingServices) {
        if (
          existingService.api_service_id &&
          !apiServiceIds.has(existingService.api_service_id)
        ) {
          const syncOptions = existingService.service_sync_options?.[0];
          if (syncOptions?.auto_status) {
            await supabase
              .from('services')
              .update({ is_active: false })
              .eq('id', existingService.id);
            stats.deactivatedServices++;
          }
        }
      }
    }

    // 7. Actualizar balance del proveedor
    try {
      const balanceData = await apiClient.getBalance();
      await supabase
        .from('api_providers')
        .update({ balance: parseFloat(balanceData.balance) })
        .eq('id', input.providerId);
    } catch (error) {
      console.warn('Could not update provider balance:', error);
    }

    // 8. Marcar proveedor como sincronizado
    await markProviderAsSynced(input.providerId, stats.newServices + stats.updatedServices);

    // 9. Registrar log de sincronización
    await supabase.from('api_sync_log').insert({
      sync_type: 'services',
      status: stats.errors > 0 ? 'partial' : 'success',
      services_synced: stats.newServices + stats.updatedServices,
      errors_count: stats.errors,
      error_details: errors.length > 0 ? JSON.stringify(errors) : null,
      completed_at: new Date().toISOString(),
      performed_by: input.providerId,
    });

    return {
      success: true,
      stats,
      errors: errors.length > 0 ? errors : undefined,
      provider,
    };
  } catch (error: any) {
    console.error('Error syncing services:', error);
    return {
      success: false,
      stats,
      errors: [error.message || 'Error desconocido al sincronizar'],
    };
  }
}

/**
 * Actualizar un servicio existente con datos de la API
 */
async function updateExistingService(
  existingService: any,
  apiService: any,
  markupPercentage?: number
): Promise<void> {
  const supabase = await createClient();

  // Obtener opciones de sincronización
  const syncOptions = existingService.service_sync_options?.[0];

  const updates: Partial<Service> = {
    last_sync_at: new Date().toISOString(),
  };

  // Sincronizar nombre
  if (syncOptions?.auto_sync_name) {
    updates.name = apiService.name;
  }

  // Sincronizar descripción
  if (syncOptions?.auto_sync_desc && apiService.description) {
    updates.description = apiService.description;
  }

  // Sincronizar precio
  if (syncOptions?.sync_rate) {
    const originalPrice = parseFloat(apiService.rate);
    updates.original_price = originalPrice;

    const markup = syncOptions.auto_rate_percent || markupPercentage || 20;
    const finalPrice = await applyMarkupToProviderPrice(originalPrice, markup);
    updates.price_per_1000 = finalPrice;
  }

  // Sincronizar cantidad mínima
  if (syncOptions?.sync_min) {
    updates.min_quantity = parseInt(apiService.min);
  }

  // Sincronizar cantidad máxima
  if (syncOptions?.sync_max) {
    updates.max_quantity = parseInt(apiService.max);
  }

  // Auto-activar/desactivar según disponibilidad
  if (syncOptions?.auto_status) {
    updates.is_active = true; // Si está en la API, está disponible
  }

  // Actualizar campos adicionales
  updates.refill = apiService.refill || false;
  updates.cancel = apiService.cancel || false;

  await supabase
    .from('services')
    .update(updates)
    .eq('id', existingService.id);
}

/**
 * Crear un nuevo servicio desde la API
 */
async function createNewService(
  apiService: any,
  providerId: string,
  categoryId?: string,
  markupPercentage?: number
): Promise<void> {
  const supabase = await createClient();

  const originalPrice = parseFloat(apiService.rate);
  const markup = markupPercentage || 20;
  const finalPrice = await applyMarkupToProviderPrice(originalPrice, markup);

  const serviceData: any = {
    name: apiService.name,
    description: apiService.description || null,
    type: apiService.type || 'default',
    price_per_1000: finalPrice,
    original_price: originalPrice,
    min_quantity: parseInt(apiService.min),
    max_quantity: parseInt(apiService.max),
    is_active: true,
    delivery_time: '1-24 horas',
    api_provider_id: providerId,
    api_service_id: apiService.service,
    add_type: 'api',
    refill: apiService.refill || false,
    cancel: apiService.cancel || false,
    category_id: categoryId || null,
    last_sync_at: new Date().toISOString(),
  };

  const { data: newService, error } = await supabase
    .from('services')
    .insert(serviceData)
    .select()
    .single();

  if (error) {
    throw new Error(`Error creando servicio: ${error.message}`);
  }

  // Crear opciones de sincronización por defecto
  await supabase.from('service_sync_options').insert({
    service_id: newService.id,
    sync_rate: true,
    auto_rate_percent: markup,
    sync_min: true,
    sync_max: true,
    auto_status: true,
    auto_sync_name: false,
    auto_sync_desc: false,
  });
}

/**
 * Actualizar opciones de sincronización para un servicio
 */
export async function updateServiceSyncOptions(
  serviceId: string,
  options: Partial<ServiceSyncOption>
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  try {
    // Verificar si ya existen opciones para este servicio
    const { data: existing } = await supabase
      .from('service_sync_options')
      .select('id')
      .eq('service_id', serviceId)
      .single();

    if (existing) {
      // Actualizar existentes
      const { error } = await supabase
        .from('service_sync_options')
        .update(options)
        .eq('service_id', serviceId);

      if (error) {
        return { success: false, error: error.message };
      }
    } else {
      // Crear nuevas
      const { error } = await supabase
        .from('service_sync_options')
        .insert({
          service_id: serviceId,
          ...options,
        });

      if (error) {
        return { success: false, error: error.message };
      }
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error updating sync options:', error);
    return { success: false, error: 'Error interno' };
  }
}

/**
 * Obtener servicios que necesitan sincronización
 */
export async function getServicesNeedingSync(
  maxAge: number = 24 * 60 * 60 * 1000 // 24 horas
): Promise<Service[]> {
  const supabase = await createClient();

  const cutoffDate = new Date(Date.now() - maxAge).toISOString();

  const { data: services } = await supabase
    .from('services')
    .select('*')
    .eq('add_type', 'api')
    .or(`last_sync_at.is.null,last_sync_at.lt.${cutoffDate}`)
    .limit(100);

  return services || [];
}

/**
 * Sincronizar servicios automáticamente (para cron job)
 */
export async function autoSyncAllProviders(): Promise<void> {
  const supabase = await createClient();

  // Obtener proveedores activos ordenados por última sincronización
  const { data: providers } = await supabase
    .from('api_providers')
    .select('*')
    .eq('status', true)
    .order('last_sync_at', { ascending: true, nullsFirst: true })
    .limit(5); // Sincronizar máximo 5 proveedores por ejecución

  if (!providers || providers.length === 0) {
    console.log('No providers to sync');
    return;
  }

  for (const provider of providers) {
    console.log(`Auto-syncing provider: ${provider.name}`);
    
    try {
      await syncServicesFromProvider({
        providerId: provider.id,
        autoImport: false, // No importar automáticamente en sync automática
        markupPercentage: 20,
      });
    } catch (error) {
      console.error(`Error syncing provider ${provider.name}:`, error);
    }

    // Esperar un poco entre proveedores para no saturar
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
}
