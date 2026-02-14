import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();

    // Verificar autenticación
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Verificar que sea administrador
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'administrador') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    // Obtener todas las órdenes con información del usuario
    const { data: orders, error } = await supabase
      .from('orders')
      .select(`
        id,
        order_number,
        user_id,
        service_name,
        service_type,
        quantity,
        price,
        profit,
        target_url,
        status,
        started_count,
        remains,
        created_at,
        updated_at,
        user:profiles!orders_user_id_fkey (
          id,
          full_name,
          email
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error al obtener órdenes:', error);
      return NextResponse.json({ error: 'Error al obtener órdenes' }, { status: 500 });
    }

    return NextResponse.json({ orders });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
