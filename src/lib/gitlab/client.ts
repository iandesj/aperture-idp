import { Component } from '@/plugins/catalog/types';
import yaml from 'js-yaml';
import { GitActivityMetrics } from '@/lib/git-activity/types';

export interface GitLabProject {
  id: number;
  name: string;
  path_with_namespace: string;
  web_url: string;
  default_branch?: string;
}

export interface GitLabRateLimit {
  limit: number;
  remaining: number;
  reset: number;
}

export class GitLabClientError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public rateLimit?: GitLabRateLimit
  ) {
    super(message);
    this.name = 'GitLabClientError';
  }
}

export class GitLabClient {
  private token: string;
  private baseURL = 'https://gitlab.com/api/v4';

  constructor(token: string) {
    this.token = token;
  }

  private async fetch(endpoint: string): Promise<Response> {
    const url = `${this.baseURL}${endpoint}`;
    const response = await fetch(url, {
      headers: {
        'PRIVATE-TOKEN': this.token,
      },
    });

    if (!response.ok) {
      const rateLimit = this.extractRateLimit(response);
      throw new GitLabClientError(
        `GitLab API error: ${response.statusText}`,
        response.status,
        rateLimit
      );
    }

    return response;
  }

  private extractRateLimit(response: Response): GitLabRateLimit | undefined {
    const limit = response.headers.get('RateLimit-Limit');
    const remaining = response.headers.get('RateLimit-Remaining');
    const reset = response.headers.get('RateLimit-Reset');

    if (limit && remaining && reset) {
      return {
        limit: parseInt(limit, 10),
        remaining: parseInt(remaining, 10),
        reset: parseInt(reset, 10),
      };
    }

    return undefined;
  }

  async getDefaultBranch(projectPath: string): Promise<string> {
    const encodedPath = encodeURIComponent(projectPath);
    const response = await this.fetch(`/projects/${encodedPath}`);
    const data = (await response.json()) as GitLabProject;
    return data.default_branch || 'main';
  }

  async checkCatalogFileExists(projectPath: string): Promise<boolean> {
    try {
      const defaultBranch = await this.getDefaultBranch(projectPath);
      const encodedPath = encodeURIComponent(projectPath);
      const encodedFilePath = encodeURIComponent('catalog-info.yaml');
      const response = await this.fetch(
        `/projects/${encodedPath}/repository/files/${encodedFilePath}?ref=${defaultBranch}`
      );
      return response.ok;
    } catch (error) {
      if (error instanceof GitLabClientError && error.statusCode === 404) {
        return false;
      }
      throw error;
    }
  }

  async fetchCatalogFile(projectPath: string): Promise<Component | null> {
    try {
      const defaultBranch = await this.getDefaultBranch(projectPath);
      const encodedPath = encodeURIComponent(projectPath);
      const encodedFilePath = encodeURIComponent('catalog-info.yaml');
      const response = await this.fetch(
        `/projects/${encodedPath}/repository/files/${encodedFilePath}/raw?ref=${defaultBranch}`
      );

      const content = await response.text();
      const parsed = yaml.load(content) as Component;

      if (parsed.kind === 'Component') {
        return parsed;
      }

      return null;
    } catch (error) {
      if (error instanceof GitLabClientError && error.statusCode === 404) {
        return null;
      }
      throw error;
    }
  }

  async listGroupProjects(groupPath: string): Promise<string[]> {
    const projects: string[] = [];
    let page = 1;
    const perPage = 100;

    while (true) {
      const encodedGroup = encodeURIComponent(groupPath);
      const response = await this.fetch(
        `/groups/${encodedGroup}/projects?include_subgroups=true&per_page=${perPage}&page=${page}`
      );

      const data = (await response.json()) as GitLabProject[];

      if (data.length === 0) {
        break;
      }

      projects.push(...data.map((p) => p.path_with_namespace));

      if (data.length < perPage) {
        break;
      }

      page++;
    }

    return projects;
  }

  async listUserProjects(username: string): Promise<string[]> {
    const projects: string[] = [];
    let page = 1;
    const perPage = 100;

    while (true) {
      const response = await this.fetch(
        `/users/${username}/projects?per_page=${perPage}&page=${page}`
      );

      const data = (await response.json()) as GitLabProject[];

      if (data.length === 0) {
        break;
      }

      projects.push(...data.map((p) => p.path_with_namespace));

      if (data.length < perPage) {
        break;
      }

      page++;
    }

    return projects;
  }

  async listAuthenticatedUserProjects(): Promise<string[]> {
    const projects: string[] = [];
    let page = 1;
    const perPage = 100;

    while (true) {
      const response = await this.fetch(
        `/projects?membership=true&per_page=${perPage}&page=${page}`
      );

      const data = (await response.json()) as GitLabProject[];

      if (data.length === 0) {
        break;
      }

      projects.push(...data.map((p) => p.path_with_namespace));

      if (data.length < perPage) {
        break;
      }

      page++;
    }

    return projects;
  }

  async getAuthenticatedUser(): Promise<{ username: string }> {
    const response = await this.fetch('/user');
    const data = await response.json();
    return { username: data.username };
  }

  async getRateLimit(): Promise<GitLabRateLimit | null> {
    try {
      const response = await fetch(`${this.baseURL}/user`, {
        method: 'HEAD',
        headers: {
          'PRIVATE-TOKEN': this.token,
        },
      });

      return this.extractRateLimit(response) || null;
    } catch {
      return null;
    }
  }

  private getCountFromHeaders(response: Response, currentPageSize: number): number {
    const totalHeader = response.headers.get('X-Total');
    if (totalHeader) {
      return parseInt(totalHeader, 10);
    }

    const totalPagesHeader = response.headers.get('X-Total-Pages');
    const perPageHeader = response.headers.get('X-Per-Page');
    if (totalPagesHeader && perPageHeader) {
      const totalPages = parseInt(totalPagesHeader, 10);
      const perPage = parseInt(perPageHeader, 10);
      return totalPages * perPage;
    }

    return currentPageSize;
  }

  async getRepositoryActivity(projectPath: string): Promise<GitActivityMetrics> {
    try {
      let lastCommitDate: string | null = null;
      let openIssuesCount = 0;
      let openMergeRequestsCount = 0;

      const encodedPath = encodeURIComponent(projectPath);

      const projectResponse = await this.fetch(`/projects/${encodedPath}`);
      if (projectResponse.ok) {
        const project = await projectResponse.json() as GitLabProject;
        const commitsUrl = `/projects/${encodedPath}/repository/commits?per_page=1`;
        const commitsResponse = await this.fetch(commitsUrl);
        if (commitsResponse.ok) {
          const commits = await commitsResponse.json() as Array<{ committed_date: string }>;
          if (commits.length > 0) {
            lastCommitDate = commits[0].committed_date;
          }
        }

        const issuesUrl = `/projects/${encodedPath}/issues?state=opened&per_page=100`;
        const issuesResponse = await this.fetch(issuesUrl);
        if (issuesResponse.ok) {
          const issues = await issuesResponse.json() as Array<unknown>;
          openIssuesCount = this.getCountFromHeaders(issuesResponse, issues.length);
        }

        const mergeRequestsUrl = `/projects/${encodedPath}/merge_requests?state=opened&per_page=1`;
        const mergeRequestsResponse = await this.fetch(mergeRequestsUrl);
        if (mergeRequestsResponse.ok) {
          openMergeRequestsCount = this.getCountFromHeaders(mergeRequestsResponse, 0);
        }
      }

      return {
        lastCommitDate,
        openIssuesCount,
        openPullRequestsCount: openMergeRequestsCount,
        source: 'gitlab',
      };
    } catch (error) {
      if (error instanceof GitLabClientError) {
        throw error;
      }
      throw new GitLabClientError(
        `Failed to fetch repository activity: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
}

