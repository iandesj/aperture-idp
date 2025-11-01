import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { blacklistUserTokens } from '@/lib/auth/token-blacklist';

export const runtime = 'nodejs';

export async function POST() {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const userId = parseInt(session.user.id);
    const expiresAt = Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60; // 30 days
    
    // Blacklist all tokens for this user
    // This ensures that any existing sessions are invalidated
    blacklistUserTokens(userId, expiresAt);
    
    return NextResponse.json({ success: true, message: 'User tokens invalidated' });
  } catch (error) {
    console.error('Token invalidation error:', error);
    return NextResponse.json(
      { error: 'Failed to invalidate token' },
      { status: 500 }
    );
  }
}

