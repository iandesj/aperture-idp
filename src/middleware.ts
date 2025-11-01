import { auth } from '@/lib/auth-middleware';
import { NextResponse } from 'next/server';

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;
  const isOnLoginPage = pathname.startsWith('/login');
  const isOnApiAuth = pathname.startsWith('/api/auth');

  // Allow access to API auth routes
  if (isOnApiAuth) {
    return NextResponse.next();
  }

  // If on login page and logged in, redirect to home
  if (isOnLoginPage && isLoggedIn) {
    return NextResponse.redirect(new URL('/', req.url));
  }

  // If not logged in and not on login page, redirect to login
  if (!isLoggedIn && !isOnLoginPage) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};

