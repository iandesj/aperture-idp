import NextAuth from 'next-auth';
import type { NextAuthConfig } from 'next-auth';

const middlewareConfig: NextAuthConfig = {
  providers: [],
  session: {
    strategy: 'jwt' as const,
  },
  pages: {
    signIn: '/login',
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnLoginPage = nextUrl.pathname.startsWith('/login');
      const isOnApiAuth = nextUrl.pathname.startsWith('/api/auth');

      if (isOnApiAuth) {
        return true;
      }

      if (isOnLoginPage) {
        if (isLoggedIn) return Response.redirect(new URL('/', nextUrl));
        return true;
      }

      if (!isLoggedIn) {
        return false;
      }

      return true;
    },
  },
};

export const { handlers, auth } = NextAuth(middlewareConfig);

