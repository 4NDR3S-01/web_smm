/**
 * API Route: /api/admin/services
 * Gestión de servicios (listar, crear, editar)
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET: Listar todos los servicios
export async function GET() {
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

    // Obtener todos los servicios con relaciones
    const { data: services, error } = await supabase
      .from('services')
      .select(`
        *,
        category:categories (
          id,
          name
        ),
        api_provider:api_providers (
          id,
          name
        )
      `)
      .order('name');

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ services });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
