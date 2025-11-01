import type { NextAuthConfig } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { verifyUser } from './users';
import { generateTokenId, isTokenBlacklisted, clearUserTokenBlacklist } from './token-blacklist';

// Validate AUTH_SECRET at startup
if (!process.env.AUTH_SECRET) {
  throw new Error(
    'AUTH_SECRET environment variable is required. Generate one with: openssl rand -base64 32'
  );
}

if (process.env.AUTH_SECRET.length < 32) {
  throw new Error(
    'AUTH_SECRET must be at least 32 characters long for security. Generate a new one with: openssl rand -base64 32'
  );
}

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
        // Clear user pattern blacklist on new login
        // This allows new logins after signout without blocking them
        if (user.id) {
          const userId = parseInt(user.id);
          clearUserTokenBlacklist(userId);
        }
        return token;
      }

      // For existing tokens, check if they're blacklisted
      if (token.jti && isTokenBlacklisted(token.jti)) {
        throw new Error('Token has been revoked');
      }

      // Check by user ID pattern only for existing tokens (not during new login)
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
      // Only check individual token JTI, not user pattern
      // User pattern blacklist is checked in jwt callback for existing tokens only
      if (token.jti && isTokenBlacklisted(token.jti)) {
        // Throw error to prevent session creation
        throw new Error('Token has been revoked');
      }

      if (token && session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;

