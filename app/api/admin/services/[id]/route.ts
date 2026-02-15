/**
 * API Route: Update and Delete service
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

// PATCH: Actualizar servicio
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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
    const updates: any = {};

    // Campos que se pueden actualizar
    if (body.name !== undefined) updates.name = body.name;
    if (body.description !== undefined) updates.description = body.description;
    if (body.type !== undefined) updates.type = body.type;
    if (body.price_per_1000 !== undefined) updates.price_per_1000 = body.price_per_1000;
    if (body.min_quantity !== undefined) updates.min_quantity = body.min_quantity;
    if (body.max_quantity !== undefined) updates.max_quantity = body.max_quantity;
    if (body.is_active !== undefined) updates.is_active = body.is_active;
    if (body.category_id !== undefined) updates.category_id = body.category_id;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No hay cambios para actualizar' }, { status: 400 });
    }

    updates.updated_at = new Date().toISOString();

    // Usar admin client para bypasear RLS
    const adminClient = createAdminClient();

    // Actualizar servicio
    const { data: service, error } = await adminClient
      .from('services')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ service });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    // Usar admin client para bypasear RLS
    const adminClient = createAdminClient();

    // Verificar si hay pedidos usando este servicio
    const { data: orders } = await adminClient
      .from('orders')
      .select('id')
      .eq('service_id', id)
      .limit(1);

    if (orders && orders.length > 0) {
      return NextResponse.json(
        { success: false, error: 'No se puede eliminar un servicio con pedidos asociados' },
        { status: 400 }
      );
    }

    // Eliminar servicio
    const { error } = await adminClient
      .from('services')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
