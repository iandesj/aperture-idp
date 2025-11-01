import { blacklistToken } from './token-blacklist';
import { cookies } from 'next/headers';

/**
 * Blacklist the current session token
 * This should be called during signout to invalidate the JWT
 */
export async function invalidateCurrentSession(userId: number, jti?: string): Promise<void> {
  if (jti) {
    // If we have the JTI from the token, use it
    const expiresAt = Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60; // 30 days
    blacklistToken(jti, userId, expiresAt);
    return;
  }

  // Fallback: try to get from cookie
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('authjs.session-token') || 
                        cookieStore.get('__Secure-authjs.session-token');
  
  if (sessionCookie?.value) {
    // Use part of the token value as the jti for blacklisting
    const tokenValue = sessionCookie.value;
    const tokenJti = Buffer.from(tokenValue.substring(0, 32)).toString('hex');
    const expiresAt = Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60; // 30 days
    blacklistToken(tokenJti, userId, expiresAt);
  }
}

