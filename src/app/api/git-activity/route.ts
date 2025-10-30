import { NextRequest, NextResponse } from 'next/server';
import { getComponentByName } from '@/lib/catalog';
import { getActivityMetrics } from '@/lib/git-activity/service';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const componentName = searchParams.get('componentName');

  if (!componentName) {
    return NextResponse.json(
      { error: 'componentName query parameter is required' },
      { status: 400 }
    );
  }

  try {
    const component = getComponentByName(componentName);
    if (!component) {
      return NextResponse.json(
        { error: 'Component not found' },
        { status: 404 }
      );
    }

    const metrics = await getActivityMetrics(component);
    return NextResponse.json({ metrics });
  } catch (error) {
    console.error('Failed to fetch git activity:', error);
    return NextResponse.json(
      { error: 'Failed to fetch git activity' },
      { status: 500 }
    );
  }
}

