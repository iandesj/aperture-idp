import NextAuth from 'next-auth';
import type { NextAuthConfig } from 'next-auth';

const middlewareConfig: NextAuthConfig = {
  trustHost: true,
  providers: [],
  session: {
    strategy: 'jwt' as const,
  },
  pages: {
    signIn: '/login',
  },
};

export const { handlers, auth } = NextAuth(middlewareConfig);

