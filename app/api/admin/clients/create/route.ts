import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verificar autenticación
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Verificar rol de administrador
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'administrador') {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    const body = await request.json();
    const { email, password, full_name, role, balance } = body;

    // Validar datos requeridos
    if (!email || !password || !full_name) {
      return NextResponse.json(
        { error: 'Email, contraseña y nombre completo son requeridos' },
        { status: 400 }
      );
    }

    // Crear usuario en Supabase Auth
    const { data: newUser, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name,
      },
    });

    if (authError) {
      return NextResponse.json(
        { error: authError.message || 'Error al crear usuario' },
        { status: 400 }
      );
    }

    if (!newUser.user) {
      return NextResponse.json({ error: 'Error al crear usuario' }, { status: 500 });
    }

    // Crear perfil en la tabla profiles
    const { error: profileError } = await supabase.from('profiles').insert({
      id: newUser.user.id,
      full_name,
      email,
      role: role || 'cliente',
      balance: Number.parseFloat(balance) || 0,
    });

    if (profileError) {
      // Si hay error, intentar eliminar el usuario de auth
      await supabase.auth.admin.deleteUser(newUser.user.id);
      return NextResponse.json(
        { error: 'Error al crear perfil: ' + profileError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: newUser.user.id,
        email,
        full_name,
        role,
      },
    });
  } catch (error) {
    console.error('Error creating client:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
