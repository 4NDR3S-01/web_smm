import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;
    
    // Verificar que el usuario es administrador
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'administrador') {
      return NextResponse.json({ error: 'No tienes permisos' }, { status: 403 });
    }

    const body = await request.json();
    const { action, amount, description } = body;

    if (!action || !amount || amount <= 0) {
      return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
    }

    // Obtener balance actual del cliente
    const { data: client, error: clientError } = await supabase
      .from('profiles')
      .select('balance, full_name')
      .eq('id', id)
      .single();

    if (clientError || !client) {
      return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 });
    }

    let newBalance: number;
    if (action === 'add') {
      newBalance = (client.balance || 0) + amount;
    } else if (action === 'subtract') {
      if (amount > client.balance) {
        return NextResponse.json({ error: 'Balance insuficiente' }, { status: 400 });
      }
      newBalance = client.balance - amount;
    } else {
      return NextResponse.json({ error: 'Acción inválida' }, { status: 400 });
    }

    // Actualizar balance
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ balance: newBalance })
      .eq('id', id);

    if (updateError) {
      console.error('Error updating balance:', updateError);
      return NextResponse.json({ error: 'Error al actualizar balance' }, { status: 500 });
    }

    // Registrar transacción
    const { error: transactionError } = await supabase
      .from('transactions')
      .insert({
        user_id: id,
        type: action === 'add' ? 'deposit' : 'withdrawal',
        amount: amount,
        description: description || `${action === 'add' ? 'Recarga' : 'Retiro'} manual por administrador`,
        status: 'completed',
        reference_id: `admin-${user.id}-${Date.now()}`,
      });

    if (transactionError) {
      console.error('Error creating transaction:', transactionError);
      // No fallar si solo falla el registro de transacción
    }

    return NextResponse.json({ 
      success: true, 
      newBalance,
      message: `Balance ${action === 'add' ? 'agregado' : 'retirado'} exitosamente`
    });
  } catch (error) {
    console.error('Error en POST /api/admin/clients/[id]/balance:', error);
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}
