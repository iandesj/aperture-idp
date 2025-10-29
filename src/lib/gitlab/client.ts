import { Component } from '@/plugins/catalog/types';
import yaml from 'js-yaml';

export interface GitLabProject {
  id: number;
  name: string;
  path_with_namespace: string;
  web_url: string;
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

  async checkCatalogFileExists(projectPath: string): Promise<boolean> {
    try {
      const encodedPath = encodeURIComponent(projectPath);
      const encodedFilePath = encodeURIComponent('catalog-info.yaml');
      const response = await this.fetch(
        `/projects/${encodedPath}/repository/files/${encodedFilePath}?ref=main`
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
      const encodedPath = encodeURIComponent(projectPath);
      const encodedFilePath = encodeURIComponent('catalog-info.yaml');
      const response = await this.fetch(
        `/projects/${encodedPath}/repository/files/${encodedFilePath}/raw?ref=main`
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
}

