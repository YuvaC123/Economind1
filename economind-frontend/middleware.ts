import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const AUTH_PAGES = ['/login', '/signup']

export function middleware(request: NextRequest) {
  const token = request.cookies.get('em_token')?.value
  const { pathname } = request.nextUrl

  const isDashboardRoute = pathname.startsWith('/dashboard') || pathname.startsWith('/results')

  if (isDashboardRoute && !token) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    const response = NextResponse.redirect(url)
    response.headers.set('Cache-Control', 'no-store')
    return response
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/results'],
}
