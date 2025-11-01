import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getUserByUsername } from '@/lib/auth/users';
import { featuresStore, FeatureFlag } from '@/lib/features/store';

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const features = featuresStore.getAllFeatures();
  return NextResponse.json({ features });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  // Check if user is admin
  const user = getUserByUsername(session.user.name as string);
  if (!user || user.role !== 'admin') {
    return NextResponse.json(
      { error: 'Forbidden: Admin access required' },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { feature, enabled } = body;

    if (!feature || typeof enabled !== 'boolean') {
      return NextResponse.json(
        { error: 'Invalid request. feature and enabled are required.' },
        { status: 400 }
      );
    }

    if (feature !== 'gitActivityEnabled' && feature !== 'scoringEnabled') {
      return NextResponse.json(
        { error: 'Invalid feature flag' },
        { status: 400 }
      );
    }

    featuresStore.setFeature(feature as FeatureFlag, enabled);
    const features = featuresStore.getAllFeatures();
    return NextResponse.json({ features });
  } catch (error) {
    console.error('Failed to update feature flag:', error);
    return NextResponse.json(
      { error: 'Failed to update feature flag' },
      { status: 500 }
    );
  }
}
