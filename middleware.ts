import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Middleware para manejar la autenticación y redirecciones
 */
export async function middleware(request: NextRequest) {
  // Rutas protegidas que requieren autenticación
  const protectedRoutes = ['/dashboard', '/cliente', '/distribuidor', '/soporte', '/admin']
  const isProtectedRoute = protectedRoutes.some(route => request.nextUrl.pathname.startsWith(route))

  // Rutas de autenticación
  const authRoutes = ['/login', '/register', '/forgot-password', '/reset-password']
  const isAuthRoute = authRoutes.some(route => request.nextUrl.pathname.startsWith(route))

  // Si no es una ruta protegida ni de auth, continuar sin verificación (incluye página de inicio)
  if (!isProtectedRoute && !isAuthRoute) {
    return NextResponse.next()
  }

  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refrescar sesión si existe
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Redirigir a login si intenta acceder a ruta protegida sin autenticación
  if (isProtectedRoute && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirect', request.nextUrl.pathname)
    return NextResponse.redirect(url)
  }

  // Redirigir a dashboard si ya está autenticado e intenta acceder a rutas de auth
  if (isAuthRoute && user) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
