import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
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

    const body = await request.json();
    const { response } = body;

    if (!response || !response.trim()) {
      return NextResponse.json({ error: 'Respuesta requerida' }, { status: 400 });
    }

    // Actualizar ticket con respuesta
    const { error } = await supabase
      .from('support_tickets')
      .update({ 
        response,
        response_at: new Date().toISOString(),
        status: 'resolved',
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) {
      console.error('Error al responder ticket:', error);
      return NextResponse.json({ error: 'Error al responder ticket' }, { status: 500 });
    }

    // TODO: Enviar notificación por email al usuario

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
