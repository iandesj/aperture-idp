import { NextRequest, NextResponse } from 'next/server';
import { createUser } from '@/lib/auth/users';
import { auth } from '@/lib/auth';
import { createUserRateLimit } from '@/lib/auth/rate-limit';
import { createUserSchema } from '@/lib/auth/validators';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  // Check authentication
  const session = await auth();
  if (!session?.user?.name) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  // Check if user is admin
  const { getUserByUsername } = await import('@/lib/auth/users');
  const currentUser = getUserByUsername(session.user.name);
  
  if (!currentUser || currentUser.role !== 'admin') {
    return NextResponse.json(
      { error: 'Forbidden: Admin access required' },
      { status: 403 }
    );
  }

  // Apply rate limiting
  const ip = request.headers.get('x-forwarded-for') || 
             request.headers.get('x-real-ip') || 
             'unknown';
  const { success } = await createUserRateLimit.limit(ip);
  
  if (!success) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    
    // Validate input
    const validationResult = createUserSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Validation failed',
          details: validationResult.error.issues.map((e) => e.message).join(', ')
        },
        { status: 400 }
      );
    }

    const { username, email, password } = validationResult.data;

    const user = await createUser(username, email, password);

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to create user',
      },
      { status: 400 }
    );
  }
}

