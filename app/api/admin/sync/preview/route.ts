/**
 * API Route: Preview provider services before importing
 * GET /api/admin/sync/preview?providerId=xxx
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { SmmApiClient } from '@/lib/api/smm-provider';

// export const maxDuration = 60; // (solo disponible en Vercel Pro+)

export async function GET(request: NextRequest) {
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

    const searchParams = request.nextUrl.searchParams;
    const providerId = searchParams.get('providerId');
    const customMarkup = searchParams.get('markup');

    if (!providerId) {
      return NextResponse.json({ error: 'providerId es requerido' }, { status: 400 });
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
    console.log(`Obteniendo servicios de ${provider.name}...`);
    const apiClient = new SmmApiClient(provider.url, provider.api_key);
    const apiServices = await apiClient.getServices();

    console.log(`Obtenidos ${apiServices.length} servicios del proveedor`);

    // 3. Obtener servicios existentes de este proveedor
    const { data: existingServices } = await adminClient
      .from('services')
      .select('id, api_service_id, name, category_id, is_active, price_per_1000, original_price')
      .eq('api_provider_id', providerId);

    const existingMap = new Map(
      (existingServices || []).map(s => [s.api_service_id, s])
    );

    // 4. Enriquecer servicios con estado (nuevo/existente)
    const enrichedServices = apiServices.map(apiService => {
      const existing = existingMap.get(apiService.service);
      const originalPrice = Number.parseFloat(apiService.rate);
      // Usar markup personalizado si se proporciona, sino el del proveedor
      const markup = customMarkup ? Number.parseFloat(customMarkup) : (provider.markup_percentage || 20);
      const finalPrice = originalPrice * (1 + markup / 100);

      return {
        api_service_id: apiService.service,
        name: apiService.name,
        description: apiService.description || '',
        type: apiService.type || 'default',
        original_price: originalPrice,
        suggested_price: Number.parseFloat(finalPrice.toFixed(4)),
        min_quantity: Number.parseInt(apiService.min, 10),
        max_quantity: Number.parseInt(apiService.max, 10),
        refill: apiService.refill || false,
        cancel: apiService.cancel || false,
        // Estado de importación
        is_imported: !!existing,
        existing_id: existing?.id,
        existing_category_id: existing?.category_id,
        existing_is_active: existing?.is_active,
        existing_price: existing?.price_per_1000,
      };
    });

    return NextResponse.json({
      success: true,
      provider: {
        id: provider.id,
        name: provider.name,
        markup_percentage: customMarkup ? Number.parseFloat(customMarkup) : (provider.markup_percentage || 20),
      },
      services: enrichedServices,
      stats: {
        total: enrichedServices.length,
        imported: enrichedServices.filter(s => s.is_imported).length,
        new: enrichedServices.filter(s => !s.is_imported).length,
      },
    });
  } catch (error) {
    console.error('Error previewing services:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error al cargar servicios';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
