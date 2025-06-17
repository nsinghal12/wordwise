import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const authToken = request.cookies.get('auth_token');
  const { pathname } = request.nextUrl;

  console.log('Middleware - Path:', pathname);
  console.log('Middleware - Auth token exists:', !!authToken);

  // Public paths that don't require authentication
  const publicPaths = ['/login'];
  
  // If the path is public, allow access
  if (publicPaths.includes(pathname)) {
    // If user has auth token and tries to access login, redirect to home
    if (authToken && pathname === '/login') {
      console.log('Middleware - Redirecting authenticated user from login to home');
      return NextResponse.redirect(new URL('/home', request.url));
    }
    console.log('Middleware - Allowing access to public path');
    return NextResponse.next();
  }

  // For all other paths, require authentication
  if (!authToken) {
    console.log('Middleware - No auth token, redirecting to login');
    return NextResponse.redirect(new URL('/login', request.url));
  }

  console.log('Middleware - Auth token found, allowing access');
  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/login', '/dashboard', '/home'],
}; 