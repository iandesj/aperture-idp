import { NextResponse } from 'next/server';
import { importFromGitHub, type ImportResult } from '@/lib/github/importer';
import { importFromGitLab } from '@/lib/gitlab/importer';
import { importStore } from '@/lib/import/store';
import config from '@/lib/aperture.config';

export async function POST() {
  try {
    const results = {
      github: null as ImportResult | null,
      gitlab: null as ImportResult | null,
      combined: {
        success: 0,
        failed: 0,
        skipped: 0,
        total: 0,
        errors: [] as Array<{ repository?: string; project?: string; error: string }>,
      },
    };

    // Import from GitHub if enabled
    if (config.github.enabled) {
      try {
        const githubResult = await importFromGitHub();
        results.github = githubResult;
        results.combined.success += githubResult.success;
        results.combined.failed += githubResult.failed;
        results.combined.skipped += githubResult.skipped;
        results.combined.total += githubResult.total;
        results.combined.errors.push(...githubResult.errors);
      } catch (error) {
        results.combined.errors.push({
          repository: 'GitHub',
          error: error instanceof Error ? error.message : 'Unknown error occurred',
        });
      }
    }

    // Import from GitLab if enabled
    if (config.gitlab.enabled) {
      try {
        const gitlabResult = await importFromGitLab();
        results.gitlab = gitlabResult;
        results.combined.success += gitlabResult.success;
        results.combined.failed += gitlabResult.failed;
        results.combined.skipped += gitlabResult.skipped;
        results.combined.total += gitlabResult.total;
        results.combined.errors.push(...gitlabResult.errors);
      } catch (error) {
        results.combined.errors.push({
          project: 'GitLab',
          error: error instanceof Error ? error.message : 'Unknown error occurred',
        });
      }
    }

    return NextResponse.json({
      success: true,
      results,
      stats: importStore.getStats(),
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
    const stats = importStore.getStats();
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

