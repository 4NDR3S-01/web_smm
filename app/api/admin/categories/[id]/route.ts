/**
 * API Route: /api/admin/categories/[id]
 * Gestión de categoría individual (admin)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// PATCH: Actualizar categoría
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: categoryId } = await params;
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
    const { name, description, is_active } = body;

    // Verificar que la categoría existe
    const { data: existingCategory } = await supabase
      .from('service_categories')
      .select('*')
      .eq('id', categoryId)
      .single();

    if (!existingCategory) {
      return NextResponse.json(
        { error: 'Categoría no encontrada' },
        { status: 404 }
      );
    }

    const updates: any = {};

    // Si se actualiza el nombre, generar nuevo slug
    if (name && name.trim() && name !== existingCategory.name) {
      const newSlug = name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

      // Verificar que no exista otro slug igual
      const { data: slugExists } = await supabase
        .from('service_categories')
        .select('id')
        .eq('slug', newSlug)
        .neq('id', categoryId)
        .single();

      if (slugExists) {
        return NextResponse.json(
          { error: 'Ya existe una categoría con ese nombre' },
          { status: 400 }
        );
      }

      updates.name = name.trim();
      updates.slug = newSlug;
    }

    if (description !== undefined) {
      updates.description = description?.trim() || null;
    }

    if (is_active !== undefined) {
      updates.is_active = is_active;
    }

    // Si no hay actualizaciones, retornar
    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ category: existingCategory });
    }

    updates.updated_at = new Date().toISOString();

    // Actualizar categoría
    const { data: category, error } = await supabase
      .from('service_categories')
      .update(updates)
      .eq('id', categoryId)
      .select()
      .single();

    if (error) {
      console.error('Error updating category:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ category });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE: Eliminar categoría
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: categoryId } = await params;
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

    // Verificar que la categoría existe
    const { data: existingCategory } = await supabase
      .from('service_categories')
      .select('id')
      .eq('id', categoryId)
      .single();

    if (!existingCategory) {
      return NextResponse.json(
        { error: 'Categoría no encontrada' },
        { status: 404 }
      );
    }

    // Verificar si hay servicios asociados
    const { data: services, error: servicesError } = await supabase
      .from('services')
      .select('id')
      .eq('category_id', categoryId)
      .limit(1);

    if (servicesError) {
      console.error('Error checking services:', servicesError);
      return NextResponse.json(
        { error: 'Error al verificar servicios' },
        { status: 400 }
      );
    }

    if (services && services.length > 0) {
      return NextResponse.json(
        { error: 'No se puede eliminar la categoría porque tiene servicios asociados. Primero mueve o elimina los servicios.' },
        { status: 400 }
      );
    }

    // Eliminar categoría
    const { error } = await supabase
      .from('service_categories')
      .delete()
      .eq('id', categoryId);

    if (error) {
      console.error('Error deleting category:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
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
