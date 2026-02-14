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

    // Obtener todos los tickets con información del usuario
    const { data: tickets, error } = await supabase
      .from('support_tickets')
      .select(`
        *,
        user:profiles!support_tickets_user_id_fkey (
          id,
          full_name,
          email
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error al obtener tickets:', error);
      return NextResponse.json({ error: 'Error al obtener tickets' }, { status: 500 });
    }

    return NextResponse.json({ tickets });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
