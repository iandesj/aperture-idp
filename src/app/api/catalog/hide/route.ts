import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { hiddenStore } from '@/lib/hidden/store';
import { getComponentByName } from '@/lib/catalog';

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const { componentName } = body;

    if (!componentName || typeof componentName !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Component name is required' },
        { status: 400 }
      );
    }

    const component = getComponentByName(componentName, true);
    if (!component) {
      return NextResponse.json(
        { success: false, error: 'Component not found' },
        { status: 404 }
      );
    }

    hiddenStore.hideComponent(componentName);

    return NextResponse.json({
      success: true,
      message: `Component "${componentName}" has been hidden`,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const componentName = searchParams.get('componentName');

    if (!componentName) {
      return NextResponse.json(
        { success: false, error: 'Component name is required' },
        { status: 400 }
      );
    }

    if (!hiddenStore.isHidden(componentName)) {
      return NextResponse.json(
        { success: false, error: 'Component is not hidden' },
        { status: 400 }
      );
    }

    hiddenStore.unhideComponent(componentName);

    return NextResponse.json({
      success: true,
      message: `Component "${componentName}" has been unhidden`,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const stats = hiddenStore.getStats();
    return NextResponse.json({
      success: true,
      stats,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}

