/**
 * API Route: /api/admin/sync
 * Sincronización de servicios desde proveedores API
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { syncServicesFromProvider } from '@/lib/services/sync.service';

export async function POST(request: NextRequest) {
  try {
    // 1. Autenticar usuario
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // 2. Verificar rol de administrador
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'administrador') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 403 }
      );
    }

    // 3. Obtener parámetros de la solicitud
    const body = await request.json();
    const { providerId, categoryId, markupPercentage, autoImport } = body;

    if (!providerId) {
      return NextResponse.json(
        { error: 'Provider ID requerido' },
        { status: 400 }
      );
    }

    // 4. Ejecutar sincronización
    const result = await syncServicesFromProvider({
      providerId,
      categoryId: categoryId || undefined,
      markupPercentage: markupPercentage || 20,
      autoImport: autoImport !== undefined ? autoImport : true,
    });

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.errors?.[0] || 'Error al sincronizar',
          stats: result.stats,
        },
        { status: 500 }
      );
    }

    // 5. Retornar resultado
    return NextResponse.json({
      success: true,
      stats: result.stats,
      provider: result.provider,
      errors: result.errors,
    });
  } catch (error: any) {
    console.error('Error in sync endpoint:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
