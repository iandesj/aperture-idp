import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Simple in-memory Redis mock for development
class MockRedis {
  private store = new Map<string, string>();

  async get(key: string): Promise<string | null> {
    return this.store.get(key) || null;
  }

  async set(key: string, value: string, options?: { ex?: number }): Promise<string> {
    this.store.set(key, value);
    if (options?.ex) {
      setTimeout(() => this.store.delete(key), options.ex * 1000);
    }
    return 'OK';
  }
}

// Create Redis client - use real Redis in production, mock in development
const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  : (new MockRedis() as unknown as Redis);

// Rate limiter for authentication endpoints (5 requests per 15 minutes)
export const authRateLimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(5, '15 m'),
  analytics: true,
  ephemeralCache: new Map(),
});

// Rate limiter for API endpoints (30 requests per minute)
export const apiRateLimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(30, '1 m'),
  analytics: true,
  ephemeralCache: new Map(),
});

// Rate limiter for user creation (3 requests per hour per IP)
export const createUserRateLimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(3, '1 h'),
  analytics: true,
  ephemeralCache: new Map(),
});

