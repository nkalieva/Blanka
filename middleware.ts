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

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  let role = user.user_metadata?.role as string | undefined

  if (!role) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    role = profile?.role
  }

  if (!role) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  const path = request.nextUrl.pathname

  if (path.startsWith('/manager') && role !== 'manager') {
    return NextResponse.redirect(new URL('/worker', request.url))
  }

  if (path.startsWith('/worker') && role !== 'worker') {
    return NextResponse.redirect(new URL('/manager', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/worker/:path*', '/manager/:path*'],
}
