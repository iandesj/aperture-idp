import config from '../aperture.config';
import { GitLabClient, GitLabClientError } from './client';
import { importStore } from '../import/store';

export interface ImportResult {
  success: number;
  failed: number;
  skipped: number;
  errors: Array<{
    project: string;
    error: string;
  }>;
  total: number;
}

async function expandWildcards(
  client: GitLabClient,
  projects: string[]
): Promise<{ expanded: string[]; errors: Array<{ project: string; error: string }> }> {
  const expanded: string[] = [];
  const errors: Array<{ project: string; error: string }> = [];

  for (const projectString of projects) {
    // Check for group/* or user/* pattern
    if (projectString.endsWith('/*')) {
      const groupOrUser = projectString.slice(0, -2);
      try {
        // Try as a group first
        let projectsList: string[] = [];
        try {
          projectsList = await client.listGroupProjects(groupOrUser);
        } catch (groupError) {
          // If group fails, check if it's the authenticated user
          if (groupError instanceof GitLabClientError && groupError.statusCode === 404) {
            try {
              const authenticatedUser = await client.getAuthenticatedUser();
              if (authenticatedUser.username === groupOrUser) {
                // Use authenticated user endpoint to get all their projects including private
                projectsList = await client.listAuthenticatedUserProjects();
              } else {
                // Different user, use public endpoint
                projectsList = await client.listUserProjects(groupOrUser);
              }
            } catch {
              throw groupError; // Throw original group error if user lookup also fails
            }
          } else {
            throw groupError;
          }
        }
        expanded.push(...projectsList);
      } catch (error) {
        errors.push({
          project: projectString,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    } else {
      // Not a wildcard, add as-is
      expanded.push(projectString);
    }
  }

  return { expanded, errors };
}

export async function importFromGitLab(): Promise<ImportResult> {
  const result: ImportResult = {
    success: 0,
    failed: 0,
    skipped: 0,
    errors: [],
    total: 0,
  };

  if (!config.gitlab.enabled) {
    throw new Error('GitLab integration is not enabled in configuration');
  }

  if (!config.gitlab.token) {
    throw new Error(
      'GitLab token is not configured. Set GITLAB_TOKEN environment variable.'
    );
  }

  if (config.gitlab.projects.length === 0) {
    throw new Error(
      'No projects configured. Add projects to aperture.config.ts'
    );
  }

  const client = new GitLabClient(config.gitlab.token);
  
  // Expand wildcards first
  const { expanded: projects, errors: expansionErrors } = await expandWildcards(
    client,
    config.gitlab.projects
  );
  
  // Add any expansion errors
  result.errors.push(...expansionErrors);
  result.total = projects.length;

  for (const projectPath of projects) {
    try {
      // Check if catalog file exists
      const exists = await client.checkCatalogFileExists(projectPath);
      if (!exists) {
        result.skipped++;
        continue;
      }

      // Fetch and parse the catalog file
      const component = await client.fetchCatalogFile(projectPath);
      if (!component) {
        result.skipped++;
        continue;
      }

      // Add to store
      const url = `https://gitlab.com/${projectPath}/-/blob/main/catalog-info.yaml`;
      importStore.addImportedComponent('gitlab', projectPath, component, url);

      result.success++;
    } catch (error) {
      result.failed++;
      
      if (error instanceof GitLabClientError) {
        result.errors.push({
          project: projectPath,
          error: error.message,
        });

        // If rate limited, stop processing
        if (error.statusCode === 429 && error.rateLimit) {
          result.errors.push({
            project: 'all',
            error: `Rate limit exceeded. Resets at ${new Date(
              error.rateLimit.reset * 1000
            ).toISOString()}`,
          });
          break;
        }
      } else {
        result.errors.push({
          project: projectPath,
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

