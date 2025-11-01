import type { NextAuthConfig } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { verifyUser } from './users';
import { generateTokenId, isTokenBlacklisted } from './token-blacklist';

export const authConfig = {
  trustHost: true,
  providers: [
    Credentials({
      name: 'Credentials',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null;
        }

        const user = await verifyUser(
          credentials.username as string,
          credentials.password as string
        );

        if (!user) {
          return null;
        }

        return {
          id: user.id.toString(),
          name: user.username,
          email: user.email,
        };
      },
    }),
  ],
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
    async jwt({ token, user }) {
      // Initialize token ID on first creation
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
        token.jti = generateTokenId();
      }

      // Check if token is blacklisted using the stored jti
      if (token.jti && isTokenBlacklisted(token.jti)) {
        throw new Error('Token has been revoked');
      }

      // Also check by user ID pattern (for fallback blacklisting)
      if (token.id) {
        const userId = parseInt(token.id as string);
        const userPatternJti = `user-${userId}-all`;
        if (isTokenBlacklisted(userPatternJti)) {
          throw new Error('User tokens have been revoked');
        }
      }

      return token;
    },
    async session({ session, token }) {
      // Check if token is blacklisted before creating session
      if (token.jti && isTokenBlacklisted(token.jti)) {
        // Throw error to prevent session creation
        throw new Error('Token has been revoked');
      }

      // Also check user pattern
      if (token.id) {
        const userId = parseInt(token.id as string);
        const userPatternJti = `user-${userId}-all`;
        if (isTokenBlacklisted(userPatternJti)) {
          throw new Error('User tokens have been revoked');
        }
      }

      if (token && session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;

