import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Proxy — runs at the edge BEFORE any page renders.
 *
 * - /dashboard, /ops, /admin: fully blocked in production (internal tools).
 *   These pages use localStorage-based auth (no cookies) so true server-side
 *   auth is not possible at the edge. Blocking the routes entirely in
 *   production prevents any HTML from being served to unauthenticated users.
 *   Admins access these pages in development (localhost) where the block is
 *   lifted, or via a separate admin-only deployment.
 *
 * Client-side guards remain as a defence-in-depth secondary layer:
 *   - Spinner shown until useAuth() resolves
 *   - Returns null + router.replace('/') if not admin
 */

// Routes that are NEVER accessible in production (no auth bypass)
// /admin is intentionally excluded: it now relies on the in-app auth/admin
// guard, which can read localStorage after hydration. Blocking it here caused
// an unconditional production redirect before admin auth could resolve.
const BLOCKED_PATHS = ['/dashboard', '/ops']

export function proxy(request: NextRequest) {
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
