/**
 * API Route: /api/admin/providers/[id]/test
 * Probar conexión con un proveedor
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getProvider, testProviderConnection } from '@/lib/services/provider.service';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'administrador') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const provider = await getProvider(id);
    if (!provider) {
      return NextResponse.json(
        { error: 'Proveedor no encontrado' },
        { status: 404 }
      );
    }

    const result = await testProviderConnection(provider);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Error de conexión',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      balance: result.balance,
      message: 'Conexión exitosa',
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Error al probar conexión' },
      { status: 500 }
    );
  }
}
