import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Create Redis client for production, fallback to in-memory for development
const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  : null;

// Rate limiter for authentication endpoints (5 requests per 15 minutes)
export const authRateLimit = new Ratelimit({
  redis: redis || undefined,
  limiter: Ratelimit.slidingWindow(5, '15 m'),
  analytics: true,
  ephemeralCache: new Map(),
});

// Rate limiter for API endpoints (30 requests per minute)
export const apiRateLimit = new Ratelimit({
  redis: redis || undefined,
  limiter: Ratelimit.slidingWindow(30, '1 m'),
  analytics: true,
  ephemeralCache: new Map(),
});

// Rate limiter for user creation (3 requests per hour per IP)
export const createUserRateLimit = new Ratelimit({
  redis: redis || undefined,
  limiter: Ratelimit.slidingWindow(3, '1 h'),
  analytics: true,
  ephemeralCache: new Map(),
});

