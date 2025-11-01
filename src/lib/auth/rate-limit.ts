interface RateLimitEntry {
  count: number;
  resetTime: number;
}

class InMemoryRateLimiter {
  private store = new Map<string, RateLimitEntry>();
  private maxRequests: number;
  private windowMs: number;

  constructor(maxRequests: number, windowMinutes: number) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMinutes * 60 * 1000;
  }

  async limit(identifier: string): Promise<{ success: boolean }> {
    const now = Date.now();
    const entry = this.store.get(identifier);

    // Clean up expired entries
    if (entry && now >= entry.resetTime) {
      this.store.delete(identifier);
    }

    const current = this.store.get(identifier) || { count: 0, resetTime: now + this.windowMs };

    if (current.count >= this.maxRequests) {
      return { success: false };
    }

    current.count++;
    this.store.set(identifier, current);

    // Cleanup old entries periodically
    if (Math.random() < 0.01) {
      this.cleanup(now);
    }

    return { success: true };
  }

  private cleanup(now: number): void {
    for (const [key, entry] of this.store.entries()) {
      if (now >= entry.resetTime) {
        this.store.delete(key);
      }
    }
  }
}

// Rate limiter for authentication endpoints (5 requests per 15 minutes)
export const authRateLimit = new InMemoryRateLimiter(5, 15);

// Rate limiter for API endpoints (30 requests per minute)
export const apiRateLimit = new InMemoryRateLimiter(30, 1);

// Rate limiter for user creation (3 requests per hour per IP)
export const createUserRateLimit = new InMemoryRateLimiter(3, 60);

