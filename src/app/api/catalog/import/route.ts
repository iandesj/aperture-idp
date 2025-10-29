import { NextResponse } from 'next/server';
import { importFromGitHub, getImportStats } from '@/lib/github/importer';

export async function POST() {
  try {
    const result = await importFromGitHub();
    return NextResponse.json({
      success: true,
      result,
      stats: getImportStats(),
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
  try {
    const stats = getImportStats();
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

