/**
 * API Route: Selective service import
 * POST /api/admin/sync/selective
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { SmmApiClient } from '@/lib/api/smm-provider';

// export const maxDuration = 60; // (solo disponible en Vercel Pro+)

interface ServiceToImport {
  api_service_id: string;
  category_id?: string;
  custom_price?: number;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Verificar que es administrador
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'administrador') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const body = await request.json();
    const { providerId, services: servicesToImport, markupPercentage } = body as {
      providerId: string;
      services: ServiceToImport[];
      markupPercentage?: number;
    };

    if (!providerId || !servicesToImport || servicesToImport.length === 0) {
      return NextResponse.json(
        { error: 'providerId y services son requeridos' },
        { status: 400 }
      );
    }

    const adminClient = createAdminClient();

    // 1. Obtener datos del proveedor
    const { data: provider, error: providerError } = await adminClient
      .from('api_providers')
      .select('*')
      .eq('id', providerId)
      .single();

    if (providerError || !provider) {
      return NextResponse.json({ error: 'Proveedor no encontrado' }, { status: 404 });
    }

    // 2. Obtener servicios del proveedor via API
    const apiClient = new SmmApiClient(provider.url, provider.api_key);
    const apiServices = await apiClient.getServices();

    // Crear mapa para búsqueda rápida
    const apiServiceMap = new Map(apiServices.map(s => [s.service, s]));

    // 3. Obtener servicios existentes de este proveedor
    const { data: existingServices } = await adminClient
      .from('services')
      .select('id, api_service_id')
      .eq('api_provider_id', providerId);

    const existingMap = new Map(
      (existingServices || []).map(s => [s.api_service_id, s])
    );

    const stats = {
      total: servicesToImport.length,
      created: 0,
      updated: 0,
      errors: 0,
    };

    const errors: string[] = [];

    // 4. Procesar cada servicio seleccionado
    for (const serviceToImport of servicesToImport) {
      try {
        // Ensure api_service_id is a number for map lookup
        const serviceId = typeof serviceToImport.api_service_id === 'string' 
          ? Number.parseInt(serviceToImport.api_service_id, 10)
          : serviceToImport.api_service_id;

        const apiService = apiServiceMap.get(serviceId.toString());
        if (!apiService) {
          errors.push(`Servicio ${serviceId} no encontrado en API`);
          stats.errors++;
          continue;
        }

        const existing = existingMap.get(serviceId);
        const originalPrice = Number.parseFloat(apiService.rate);
        // Use custom markup from request if provided, otherwise use provider's default
        const markup = markupPercentage !== undefined ? markupPercentage : (provider.markup_percentage || 20);
        const finalPrice = serviceToImport.custom_price || originalPrice * (1 + markup / 100);

        if (existing) {
          // Actualizar servicio existente
          const { error } = await adminClient
            .from('services')
            .update({
              name: apiService.name,
              description: apiService.description || null,
              price_per_1000: finalPrice,
              original_price: originalPrice,
              min_quantity: Number.parseInt(apiService.min, 10),
              max_quantity: Number.parseInt(apiService.max, 10),
              refill: apiService.refill || false,
              cancel: apiService.cancel || false,
              category_id: serviceToImport.category_id || null,
              last_sync_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq('id', existing.id);

          if (error) {
            errors.push(`Error actualizando ${apiService.name}: ${error.message}`);
            stats.errors++;
          } else {
            stats.updated++;
          }
        } else {
          // Crear nuevo servicio
          const { data: newService, error } = await adminClient
            .from('services')
            .insert({
              name: apiService.name,
              description: apiService.description || null,
              type: apiService.type || 'default',
              price_per_1000: finalPrice,
              original_price: originalPrice,
              min_quantity: Number.parseInt(apiService.min, 10),
              max_quantity: Number.parseInt(apiService.max, 10),
              is_active: true,
              delivery_time: '1-24 horas',
              api_provider_id: providerId,
              api_service_id: apiService.service,
              add_type: 'api',
              refill: apiService.refill || false,
              cancel: apiService.cancel || false,
              category_id: serviceToImport.category_id || null,
              last_sync_at: new Date().toISOString(),
            })
            .select()
            .single();

          if (error) {
            errors.push(`Error creando ${apiService.name}: ${error.message}`);
            stats.errors++;
          } else {
            // Crear opciones de sincronización por defecto
            await adminClient.from('service_sync_options').insert({
              service_id: newService.id,
              sync_rate: true,
              auto_rate_percent: markup,
              sync_min: true,
              sync_max: true,
              auto_status: true,
              auto_sync_name: false,
              auto_sync_desc: false,
            });
            stats.created++;
          }
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
        errors.push(`Error procesando servicio: ${errorMessage}`);
        stats.errors++;
      }
    }

    return NextResponse.json({
      success: true,
      stats,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('Error importing services:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error al importar servicios';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
