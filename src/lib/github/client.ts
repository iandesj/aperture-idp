import { Component } from '@/plugins/catalog/types';
import yaml from 'js-yaml';
import { GitActivityMetrics } from '@/lib/git-activity/types';

export interface GitHubFile {
  name: string;
  path: string;
  sha: string;
  size: number;
  url: string;
  download_url: string;
  type: 'file' | 'dir';
}

export interface GitHubRepository {
  name: string;
  full_name: string;
  default_branch: string;
}

export interface GitHubRateLimit {
  limit: number;
  remaining: number;
  reset: number;
}

export class GitHubClientError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public rateLimit?: GitHubRateLimit
  ) {
    super(message);
    this.name = 'GitHubClientError';
  }
}

export class GitHubClient {
  private baseUrl = 'https://api.github.com';
  private token?: string;

  constructor(token?: string) {
    this.token = token;
  }

  private async fetch(url: string): Promise<Response> {
    const headers: HeadersInit = {
      Accept: 'application/vnd.github.v3+json',
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    const response = await fetch(url, { headers });

    // Check rate limit
    const remaining = response.headers.get('x-ratelimit-remaining');
    const limit = response.headers.get('x-ratelimit-limit');
    const reset = response.headers.get('x-ratelimit-reset');

    if (remaining && parseInt(remaining) < 10) {
      console.warn(
        `GitHub API rate limit low: ${remaining}/${limit}. Resets at ${new Date(
          parseInt(reset || '0') * 1000
        ).toISOString()}`
      );
    }

    return response;
  }

  async getDefaultBranch(owner: string, repo: string): Promise<string> {
    const url = `${this.baseUrl}/repos/${owner}/${repo}`;
    try {
      const response = await this.fetch(url);
      if (!response.ok) {
        return 'main';
      }
      const data = (await response.json()) as GitHubRepository;
      return data.default_branch || 'main';
    } catch {
      return 'main';
    }
  }

  async checkCatalogFileExists(
    owner: string,
    repo: string
  ): Promise<boolean> {
    const url = `${this.baseUrl}/repos/${owner}/${repo}/contents/catalog-info.yaml`;

    try {
      const response = await this.fetch(url);
      return response.status === 200;
    } catch {
      return false;
    }
  }

  async fetchCatalogFile(
    owner: string,
    repo: string
  ): Promise<Component | null> {
    const url = `${this.baseUrl}/repos/${owner}/${repo}/contents/catalog-info.yaml`;

    try {
      const response = await this.fetch(url);

      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        if (response.status === 403) {
          const rateLimit: GitHubRateLimit = {
            limit: parseInt(response.headers.get('x-ratelimit-limit') || '0'),
            remaining: parseInt(
              response.headers.get('x-ratelimit-remaining') || '0'
            ),
            reset: parseInt(response.headers.get('x-ratelimit-reset') || '0'),
          };
          throw new GitHubClientError(
            'GitHub API rate limit exceeded',
            403,
            rateLimit
          );
        }
        if (response.status === 401) {
          throw new GitHubClientError(
            'GitHub authentication failed. Check your token.',
            401
          );
        }
        throw new GitHubClientError(
          `GitHub API error: ${response.status} ${response.statusText}`,
          response.status
        );
      }

      const data = (await response.json()) as GitHubFile;

      if (data.type !== 'file' || !data.download_url) {
        throw new GitHubClientError('Invalid catalog file structure');
      }

      // Fetch the actual file content
      const contentResponse = await fetch(data.download_url);
      if (!contentResponse.ok) {
        throw new GitHubClientError(
          `Failed to download catalog file: ${contentResponse.status}`
        );
      }

      const yamlContent = await contentResponse.text();
      const component = yaml.load(yamlContent) as Component;

      // Validate basic structure
      if (!component.metadata?.name || !component.spec?.type) {
        throw new GitHubClientError(
          'Invalid catalog file: missing required fields (metadata.name or spec.type)'
        );
      }

      return component;
    } catch (error) {
      if (error instanceof GitHubClientError) {
        throw error;
      }
      throw new GitHubClientError(
        `Failed to fetch catalog file: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async getRateLimit(): Promise<GitHubRateLimit> {
    const url = `${this.baseUrl}/rate_limit`;

    try {
      const response = await this.fetch(url);
      if (!response.ok) {
        throw new GitHubClientError(
          `Failed to get rate limit: ${response.status}`
        );
      }

      const data = await response.json();
      return data.rate as GitHubRateLimit;
    } catch (error) {
      throw new GitHubClientError(
        `Failed to get rate limit: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async listRepositories(ownerOrOrg: string): Promise<string[]> {
    const repositories: string[] = [];
    let page = 1;
    const perPage = 100;

    try {
      // Try both org and user endpoints
      // First try as organization (orgs can have private repos visible with proper token)
      let baseEndpoint = `/orgs/${ownerOrOrg}/repos`;
      let queryParams = `per_page=${perPage}&type=all`;
      
      // Check if it's an org or user by trying org endpoint first
      const testUrl = `${this.baseUrl}${baseEndpoint}?per_page=1&type=all`;
      const testResponse = await this.fetch(testUrl);
      
      if (testResponse.status === 404) {
        // Not an org, check if we can get the authenticated user
        const userResponse = await this.fetch(`${this.baseUrl}/user`);
        
        if (userResponse.ok) {
          const user = await userResponse.json() as { login: string };
          
          if (user.login.toLowerCase() === ownerOrOrg.toLowerCase()) {
            // This is the authenticated user - use /user/repos to get all repos including private
            baseEndpoint = '/user/repos';
            queryParams = `per_page=${perPage}&visibility=all&affiliation=owner`;
          } else {
            // Different user - use /users/{username}/repos
            // Note: This will only return public repos + any private repos we have access to
            baseEndpoint = `/users/${ownerOrOrg}/repos`;
            queryParams = `per_page=${perPage}&type=all`;
          }
        } else {
          // Can't determine authenticated user, fall back to public user endpoint
          baseEndpoint = `/users/${ownerOrOrg}/repos`;
          queryParams = `per_page=${perPage}&type=all`;
        }
      }

      // Now paginate through all repositories
      while (true) {
        const url = `${this.baseUrl}${baseEndpoint}?${queryParams}&page=${page}`;
        const response = await this.fetch(url);

        if (!response.ok) {
          if (response.status === 404) {
            throw new GitHubClientError(
              `Owner/Organization "${ownerOrOrg}" not found or not accessible`,
              404
            );
          }
          throw new GitHubClientError(
            `Failed to list repositories for "${ownerOrOrg}": ${response.status}`,
            response.status
          );
        }

        const repos = await response.json() as Array<{ full_name: string }>;
        
        if (repos.length === 0) {
          break;
        }

        repositories.push(...repos.map(repo => repo.full_name));

        // If we got fewer than perPage results, we're on the last page
        if (repos.length < perPage) {
          break;
        }

        page++;
      }

      return repositories;
    } catch (error) {
      if (error instanceof GitHubClientError) {
        throw error;
      }
      throw new GitHubClientError(
        `Failed to list repositories: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  private getCountFromLinkHeader(linkHeader: string | null, currentPageSize: number): number {
    if (!linkHeader) {
      return currentPageSize;
    }

    const lastLink = linkHeader.split(',').find((link) => link.includes('rel="last"'));
    if (!lastLink) {
      return currentPageSize;
    }

    const match = lastLink.match(/[?&]page=(\d+)/);
    if (!match) {
      return currentPageSize;
    }

    const lastPage = parseInt(match[1], 10);
    const perPage = 30;
    return Math.min(lastPage * perPage, 1000);
  }

  async getRepositoryActivity(owner: string, repo: string): Promise<GitActivityMetrics> {
    try {
      let lastCommitDate: string | null = null;
      let openIssuesCount = 0;
      let openPullRequestsCount = 0;

      const commitsUrl = `${this.baseUrl}/repos/${owner}/${repo}/commits?per_page=1`;
      const commitsResponse = await this.fetch(commitsUrl);
      if (commitsResponse.ok) {
        const commits = await commitsResponse.json() as Array<{ commit: { author: { date: string } } }>;
        if (commits.length > 0) {
          lastCommitDate = commits[0].commit.author.date;
        }
      }

      const issuesUrl = `${this.baseUrl}/repos/${owner}/${repo}/issues?state=open&per_page=100`;
      const issuesResponse = await this.fetch(issuesUrl);
      if (issuesResponse.ok) {
        const issues = await issuesResponse.json() as Array<{ pull_request?: unknown }>;
        const actualIssues = issues.filter((issue) => !issue.pull_request);
        openIssuesCount = actualIssues.length;
        
        const linkHeader = issuesResponse.headers.get('Link');
        if (linkHeader && issues.length === 100) {
          openIssuesCount = this.getCountFromLinkHeader(linkHeader, actualIssues.length);
        }
      }

      const pullsUrl = `${this.baseUrl}/repos/${owner}/${repo}/pulls?state=open&per_page=1`;
      const pullsResponse = await this.fetch(pullsUrl);
      if (pullsResponse.ok) {
        const linkHeader = pullsResponse.headers.get('Link');
        openPullRequestsCount = this.getCountFromLinkHeader(linkHeader, 0);
      }

      return {
        lastCommitDate,
        openIssuesCount,
        openPullRequestsCount,
        source: 'github',
      };
    } catch (error) {
      if (error instanceof GitHubClientError) {
        throw error;
      }
      throw new GitHubClientError(
        `Failed to fetch repository activity: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
}

