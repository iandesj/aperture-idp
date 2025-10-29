import config from '../aperture.config';
import { GitHubClient, GitHubClientError } from './client';
import { importStore } from '../import/store';

export interface ImportResult {
  success: number;
  failed: number;
  skipped: number;
  errors: Array<{
    repository: string;
    error: string;
  }>;
  total: number;
}

async function expandWildcards(
  client: GitHubClient,
  repositories: string[]
): Promise<{ expanded: string[]; errors: Array<{ repository: string; error: string }> }> {
  const expanded: string[] = [];
  const errors: Array<{ repository: string; error: string }> = [];

  for (const repoString of repositories) {
    // Check for owner/* or org/* pattern
    if (repoString.endsWith('/*')) {
      const ownerOrOrg = repoString.slice(0, -2);
      try {
        const repos = await client.listRepositories(ownerOrOrg);
        expanded.push(...repos);
      } catch (error) {
        errors.push({
          repository: repoString,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    } else {
      // Not a wildcard, add as-is
      expanded.push(repoString);
    }
  }

  return { expanded, errors };
}

export async function importFromGitHub(): Promise<ImportResult> {
  const result: ImportResult = {
    success: 0,
    failed: 0,
    skipped: 0,
    errors: [],
    total: 0,
  };

  if (!config.github.enabled) {
    throw new Error('GitHub integration is not enabled in configuration');
  }

  if (!config.github.token) {
    throw new Error(
      'GitHub token is not configured. Set GITHUB_TOKEN environment variable.'
    );
  }

  if (config.github.repositories.length === 0) {
    throw new Error(
      'No repositories configured. Add repositories to aperture.config.ts'
    );
  }

  const client = new GitHubClient(config.github.token);
  
  // Expand wildcards first
  const { expanded: repositories, errors: expansionErrors } = await expandWildcards(
    client,
    config.github.repositories
  );
  
  // Add any expansion errors
  result.errors.push(...expansionErrors);
  result.total = repositories.length;

  for (const repoString of repositories) {

    const [owner, repo] = repoString.split('/');
    if (!owner || !repo) {
      result.failed++;
      result.errors.push({
        repository: repoString,
        error: 'Invalid repository format. Use "owner/repo"',
      });
      continue;
    }

    try {
      // Check if catalog file exists
      const exists = await client.checkCatalogFileExists(owner, repo);
      if (!exists) {
        result.skipped++;
        continue;
      }

      // Fetch and parse the catalog file
      const component = await client.fetchCatalogFile(owner, repo);
      if (!component) {
        result.skipped++;
        continue;
      }

      // Add to store
      const url = `https://github.com/${owner}/${repo}/blob/main/catalog-info.yaml`;
      importStore.addImportedComponent('github', repoString, component, url);

      result.success++;
    } catch (error) {
      result.failed++;
      
      if (error instanceof GitHubClientError) {
        result.errors.push({
          repository: repoString,
          error: error.message,
        });

        // If rate limited, stop processing
        if (error.statusCode === 403 && error.rateLimit) {
          result.errors.push({
            repository: 'all',
            error: `Rate limit exceeded. Resets at ${new Date(
              error.rateLimit.reset * 1000
            ).toISOString()}`,
          });
          break;
        }
      } else {
        result.errors.push({
          repository: repoString,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  }

  return result;
}

export function getImportStats() {
  return importStore.getStats();
}

export function clearImportedData() {
  importStore.clearImported();
}

