import db from './db';
import { randomBytes } from 'crypto';

// Initialize the blacklist table
db.exec(`
  CREATE TABLE IF NOT EXISTS token_blacklist (
    jti TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL,
    expires_at INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Clean up expired tokens periodically (older than 30 days)
db.exec(`
  CREATE INDEX IF NOT EXISTS idx_token_blacklist_expires ON token_blacklist(expires_at);
`);

/**
 * Add a token to the blacklist
 */
export function blacklistToken(jti: string, userId: number, expiresAt: number): void {
  const stmt = db.prepare(
    'INSERT OR REPLACE INTO token_blacklist (jti, user_id, expires_at) VALUES (?, ?, ?)'
  );
  stmt.run(jti, userId, expiresAt);
}

/**
 * Check if a token is blacklisted
 */
export function isTokenBlacklisted(jti: string): boolean {
  const stmt = db.prepare('SELECT 1 FROM token_blacklist WHERE jti = ? AND expires_at > ?');
  const result = stmt.get(jti, Math.floor(Date.now() / 1000)) as { '1': number } | undefined;
  return !!result;
}

/**
 * Blacklist all tokens for a user (useful for signout)
 */
export function blacklistUserTokens(userId: number, expiresAt: number): void {
  // This is a fallback - blacklist by user ID pattern
  // In practice, you'd want to blacklist specific token JTIs
  const jti = `user-${userId}-all`;
  blacklistToken(jti, userId, expiresAt);
}

/**
 * Clear the user pattern blacklist (allows new logins after signout)
 */
export function clearUserTokenBlacklist(userId: number): void {
  const jti = `user-${userId}-all`;
  const stmt = db.prepare('DELETE FROM token_blacklist WHERE jti = ?');
  stmt.run(jti);
}

/**
 * Generate a unique token ID (JWT ID)
 */
export function generateTokenId(): string {
  return randomBytes(16).toString('hex');
}

/**
 * Clean up expired tokens (older than 30 days)
 */
export function cleanupExpiredTokens(): void {
  const thirtyDaysAgo = Math.floor((Date.now() - 30 * 24 * 60 * 60 * 1000) / 1000);
  const stmt = db.prepare('DELETE FROM token_blacklist WHERE expires_at < ?');
  stmt.run(thirtyDaysAgo);
}

// Clean up on startup
cleanupExpiredTokens();

