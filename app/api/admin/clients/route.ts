/**
 * API Route: /api/admin/clients
 * Gestión de clientes (listar, crear, editar)
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET: Listar todos los clientes
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

    // Obtener todos los clientes
    const { data: clients, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, role, balance, api_status, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ clients });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
