import { auth } from '@/lib/auth';

export default auth((req) => {
  // The auth function handles authentication checks
  // based on the callbacks.authorized in auth config
});

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};

