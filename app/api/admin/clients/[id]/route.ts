import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// Actualizar cliente
export async function PUT(
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
    const { full_name, email, role, password } = body;

    // Actualizar perfil en la base de datos
    const updateData: Record<string, string> = {
      full_name,
      role,
    };

    const { error: profileError } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', id);

    if (profileError) {
      console.error('Error updating profile:', profileError);
      return NextResponse.json({ error: 'Error al actualizar perfil' }, { status: 500 });
    }

    // Actualizar email y/o contraseña en Supabase Auth si se proporcionaron
    const authUpdateData: { email?: string; password?: string } = {};
    if (email) authUpdateData.email = email;
    if (password) authUpdateData.password = password;

    if (Object.keys(authUpdateData).length > 0) {
      const { error: authError } = await supabase.auth.admin.updateUserById(
        id,
        authUpdateData
      );

      if (authError) {
        console.error('Error updating auth:', authError);
        // No fallar si solo el auth falla, el perfil ya se actualizó
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error en PUT /api/admin/clients/[id]:', error);
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}

// Eliminar cliente
export async function DELETE(
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

    // Verificar que no se está intentando eliminar a sí mismo
    if (id === user.id) {
      return NextResponse.json({ error: 'No puedes eliminar tu propia cuenta' }, { status: 400 });
    }

    // Eliminar usuario de Supabase Auth (esto también eliminará el perfil por cascada)
    const { error: authError } = await supabase.auth.admin.deleteUser(id);

    if (authError) {
      console.error('Error deleting user from auth:', authError);
      return NextResponse.json({ error: 'Error al eliminar usuario' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error en DELETE /api/admin/clients/[id]:', error);
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}
