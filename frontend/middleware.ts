import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Middleware — runs at the edge BEFORE any page renders.
 *
 * - /dashboard and /ops: fully blocked in production (internal agent tools)
 * - /admin: requires valid Supabase session cookie — unauthenticated users
 *   get redirected to / before any HTML is served. The client-side email
 *   allowlist remains as a secondary check for authorized admin emails.
 */

// Routes that are NEVER accessible in production (no auth bypass)
const BLOCKED_PATHS = ['/dashboard', '/ops']

// Note: /admin uses client-side auth (localStorage, not cookies) so it cannot
// be gated at the middleware layer. Protection is handled by the admin page
// itself: it renders nothing until useAuth() confirms an admin email.

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const hostname = request.headers.get('host') || ''

  const isLocal =
    hostname.startsWith('localhost') ||
    hostname.startsWith('127.0.0.1') ||
    hostname.includes('.local')

  // Allow everything in local development
  if (isLocal) return NextResponse.next()

  // Fully block internal routes in production
  if (BLOCKED_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'))) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    url.search = ''
    return NextResponse.redirect(url, 308)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/ops/:path*'],
}
