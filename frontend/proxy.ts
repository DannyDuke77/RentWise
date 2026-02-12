import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define which routes are protected
const protectedRoutes = ['/dashboard', '/properties', '/tenants', '/payments', '/settings'];
const authRoutes = ['/auth/login', 'auth/register'];

export function proxy(request: NextRequest) {
  // Access the cookie directly from the request
  const token = request.cookies.get("session_access_token")?.value;

  const { pathname, search } = request.nextUrl;

  // 1. Redirect to login if trying to access a protected route without a token
  if (!token && protectedRoutes.some(route => pathname.startsWith(route))) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/auth/login';

    loginUrl.searchParams.set('next', pathname + search);
    
    return NextResponse.redirect(loginUrl);
  }

  // 2. Redirect to home/dashboard if already logged in and trying to access login/signup
  if (token && authRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

// Optimization: Only run middleware on relevant paths
export const config = {
  matcher: [
    '/dashboard/:path*', 
    '/properties/:path*',
    '/tenants/:path*',
    '/payments/:path*',
    '/settings/:path*',
    '/auth/:path*', 
  ],
};