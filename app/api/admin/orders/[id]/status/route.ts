import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { calculateOrderRefund, canRefundOrder } from '@/lib/utils/order-refund';

export async function PATCH(
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
    const { status, remains } = body; // remains = cantidad que NO se entregó

    const validStatuses = ['pending', 'processing', 'in_progress', 'completed', 'partial', 'canceled', 'refunded'];
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Estado inválido' }, { status: 400 });
    }

    // Obtener datos de la orden actual
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, user_id, quantity, price, profit, status, remains')
      .eq('id', id)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 });
    }

    // Preparar datos de actualización
    const updateData: any = {
      status,
      updated_at: new Date().toISOString(),
    };

    // Si es completado, marcar fecha de completado
    if (status === 'completed') {
      updateData.completed_at = new Date().toISOString();
      updateData.remains = 0; // No quedan pendientes
    }

    // Lógica de REFUND para estados: partial, canceled, refunded
    if (['partial', 'canceled', 'refunded'].includes(status)) {
      // Verificar que se pueda hacer refund
      if (!canRefundOrder(order.status)) {
        return NextResponse.json({ 
          error: 'No se puede cambiar el estado de esta orden. Ya está completada, cancelada o reembolsada.' 
        }, { status: 400 });
      }

      // Para parcial, necesitamos el valor de "remains"
      if (status === 'partial' && remains === undefined) {
        return NextResponse.json({ 
          error: 'Para estado parcial, debes especificar la cantidad que quedó sin entregar (remains)' 
        }, { status: 400 });
      }

      // Calcular remains según el estado
      let finalRemains = 0;
      if (status === 'partial') {
        finalRemains = Number(remains); // Lo que NO se entregó
      } else if (status === 'canceled') {
        finalRemains = order.quantity; // No se entregó nada
      } else if (status === 'refunded') {
        finalRemains = order.quantity; // Devolver todo
      }

      // Calcular el refund
      const refundCalc = calculateOrderRefund({
        price: order.price,
        profit: order.profit || 0,
        quantity: order.quantity,
        remains: finalRemains,
      });

      // Actualizar datos de la orden
      updateData.remains = finalRemains;
      updateData.price = refundCalc.realCharge; // Nuevo precio (solo por lo entregado)
      updateData.profit = refundCalc.newProfit; // Nueva ganancia

      // Si hay dinero a devolver, actualizar balance del usuario y crear transacción
      if (refundCalc.refundAmount > 0) {
        // Obtener perfil del usuario
        const { data: userProfile } = await supabase
          .from('profiles')
          .select('balance')
          .eq('id', order.user_id)
          .single();

        if (userProfile) {
          const newBalance = Number(userProfile.balance) + refundCalc.refundAmount;

          // Actualizar balance
          const { error: balanceError } = await supabase
            .from('profiles')
            .update({ balance: newBalance })
            .eq('id', order.user_id);

          if (balanceError) {
            console.error('Error al actualizar balance:', balanceError);
          }

          // Crear transacción de refund
          const { error: transactionError } = await supabase
            .from('transactions')
            .insert({
              user_id: order.user_id,
              type: 'refund',
              amount: refundCalc.refundAmount,
              description: `Reembolso de orden ${status === 'partial' ? 'parcial' : 'cancelada'} - ID: ${id}`,
              reference_id: id,
              status: 'completed',
            });

          if (transactionError) {
            console.error('Error al crear transacción de refund:', transactionError);
          }
        }
      }
    }

    // Actualizar la orden
    const { error } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', id);

    if (error) {
      console.error('Error al actualizar orden:', error);
      return NextResponse.json({ error: 'Error al actualizar orden' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
