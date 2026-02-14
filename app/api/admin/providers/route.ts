/**
 * API Route: /api/admin/providers
 * CRUD de proveedores API SMM
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  createProvider,
  updateProvider,
  getAllProviders,
} from '@/lib/services/provider.service';

// GET: Obtener todos los proveedores
export async function GET() {
  try {
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

    const providers = await getAllProviders();
    return NextResponse.json({ providers });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Error al obtener proveedores' },
      { status: 500 }
    );
  }
}

// POST: Crear nuevo proveedor
export async function POST(request: NextRequest) {
  try {
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

    const body = await request.json();
    const { name, url, api_key, type, description, status } = body;

    if (!name || !url || !api_key || !type) {
      return NextResponse.json(
        { error: 'Campos requeridos: name, url, api_key, type' },
        { status: 400 }
      );
    }

    const result = await createProvider({
      name,
      url,
      api_key,
      type,
      description,
      status,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ success: true, provider: result.provider });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Error al crear proveedor' },
      { status: 500 }
    );
  }
}

// PATCH: Actualizar proveedor
export async function PATCH(request: NextRequest) {
  try {
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

    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'ID de proveedor requerido' },
        { status: 400 }
      );
    }

    const result = await updateProvider(id, updates);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Error al actualizar proveedor' },
      { status: 500 }
    );
  }
}
