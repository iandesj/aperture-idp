import { auth } from '@/lib/auth-middleware';
import { NextResponse } from 'next/server';

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;
  const isOnLoginPage = pathname.startsWith('/login');
  const isOnApiAuth = pathname.startsWith('/api/auth');
  const isApiRoute = pathname.startsWith('/api/');

  // Allow access to API auth routes
  if (isOnApiAuth) {
    return NextResponse.next();
  }

  // For API routes (other than /api/auth), check authentication
  if (isApiRoute && !isLoggedIn) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  // If on login page and logged in, redirect to home
  if (isOnLoginPage && isLoggedIn) {
    return NextResponse.redirect(new URL('/', req.url));
  }

  // If not logged in and not on login page, redirect to login
  if (!isLoggedIn && !isOnLoginPage && !isApiRoute) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (NextAuth routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico).*)',
  ],
};

