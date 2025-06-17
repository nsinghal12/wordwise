import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const session = request.cookies.get('__session');
  const { pathname } = request.nextUrl;

  // Create URLs using the current origin
  const loginUrl = new URL('/login', request.url);
  const homeUrl = new URL('/', request.url);

  // Redirect authenticated users from login page to home
  if (pathname === '/login' && session) {
    return NextResponse.redirect(homeUrl);
  }

  // Protect routes that require authentication
  if (!session && pathname !== '/login') {
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/login', '/dashboard', '/home'],
}; 