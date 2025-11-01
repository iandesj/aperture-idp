import { handlers } from '@/lib/auth';
import { authRateLimit } from '@/lib/auth/rate-limit';
import { NextRequest } from 'next/server';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  // Apply rate limiting to login attempts
  const ip = request.headers.get('x-forwarded-for') || 
             request.headers.get('x-real-ip') || 
             'unknown';
  const { success } = await authRateLimit.limit(ip);
  
  if (!success) {
    return new Response(
      JSON.stringify({ error: 'Too many login attempts. Please try again later.' }),
      { status: 429, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Call the NextAuth handler
  const result = await handlers.POST(request);
  return result;
}

export async function GET(request: NextRequest) {
  // Apply rate limiting to auth requests
  const ip = request.headers.get('x-forwarded-for') || 
             request.headers.get('x-real-ip') || 
             'unknown';
  const { success } = await authRateLimit.limit(ip);
  
  if (!success) {
    return new Response(
      JSON.stringify({ error: 'Too many requests. Please try again later.' }),
      { status: 429, headers: { 'Content-Type': 'application/json' } }
    );
  }

  return handlers.GET(request);
}
