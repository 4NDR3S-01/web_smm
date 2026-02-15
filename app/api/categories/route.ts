/**
 * API Route: /api/categories
 * Obtener categorías públicas
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET: Listar todas las categorías activas
export async function GET() {
  try {
    const supabase = await createClient();

    // Obtener todas las categorías ordenadas por nombre
    const { data: categories, error } = await supabase
      .from('service_categories')
      .select('id, name, slug, description, is_active')
      .eq('is_active', true)
      .order('name');

    if (error) {
      console.error('Error fetching categories:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ categories: categories || [] });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
