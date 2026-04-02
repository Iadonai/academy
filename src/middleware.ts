import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

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
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh da sessao — nao remova esta linha
  const { data: { user } } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // Rotas protegidas — redireciona para login se nao autenticado
  const protectedRoutes = ['/dashboard', '/admin', '/comunidade', '/cursos', '/ranking', '/perfil']
  const isProtected = protectedRoutes.some(route => pathname.startsWith(route))

  if (isProtected && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (isProtected && user) {
    const { data: profile } = await supabase
      .from('users')
      .select('role, status')
      .eq('id', user.id)
      .single()

    // Bloqueado ou pendente — redireciona para página de espera
    if (profile?.status === 'PENDING' && pathname !== '/aguardando') {
      const url = request.nextUrl.clone()
      url.pathname = '/aguardando'
      return NextResponse.redirect(url)
    }
    if (profile?.status === 'BANNED' && pathname !== '/bloqueado') {
      const url = request.nextUrl.clone()
      url.pathname = '/bloqueado'
      return NextResponse.redirect(url)
    }

    // Admin — redireciona se nao for admin
    if (pathname.startsWith('/admin') && profile?.role !== 'ADMIN') {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
