import fs from 'fs';
import path from 'path';
import { GitActivityMetrics, CachedActivityMetrics } from './types';

const CACHE_TTL_MS = 60 * 60 * 1000;

class GitActivityCache {
  private cache: Map<string, CachedActivityMetrics> = new Map();
  private persistencePath: string;

  constructor() {
    this.persistencePath = path.join(process.cwd(), '.aperture', 'git-activity-cache.json');
    this.loadFromDisk();
  }

  private loadFromDisk(): void {
    try {
      if (fs.existsSync(this.persistencePath)) {
        const data = fs.readFileSync(this.persistencePath, 'utf-8');
        const parsed = JSON.parse(data);
        this.cache = new Map(Object.entries(parsed));
      }
    } catch (error) {
      console.warn('Failed to load git activity cache from disk:', error);
    }
  }

  private saveToDisk(): void {
    try {
      const dir = path.dirname(this.persistencePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      const data = Object.fromEntries(this.cache);
      fs.writeFileSync(this.persistencePath, JSON.stringify(data, null, 2), 'utf-8');
    } catch (error) {
      console.warn('Failed to save git activity cache to disk:', error);
    }
  }

  private getCacheKey(sourceType: string, repository: string, componentName: string): string {
    return `${sourceType}:${repository}:${componentName}`;
  }

  private isExpired(cached: CachedActivityMetrics): boolean {
    const cachedAt = new Date(cached.cachedAt);
    const now = new Date();
    return now.getTime() - cachedAt.getTime() > CACHE_TTL_MS;
  }

  get(sourceType: string, repository: string, componentName: string): GitActivityMetrics | null {
    const key = this.getCacheKey(sourceType, repository, componentName);
    const cached = this.cache.get(key);

    if (!cached) {
      return null;
    }

    if (this.isExpired(cached)) {
      this.cache.delete(key);
      this.saveToDisk();
      return null;
    }

    return {
      lastCommitDate: cached.lastCommitDate,
      openIssuesCount: cached.openIssuesCount,
      openPullRequestsCount: cached.openPullRequestsCount,
      source: cached.source,
    };
  }

  set(
    sourceType: string,
    repository: string,
    componentName: string,
    metrics: GitActivityMetrics
  ): void {
    const key = this.getCacheKey(sourceType, repository, componentName);
    this.cache.set(key, {
      ...metrics,
      cachedAt: new Date().toISOString(),
    });
    this.saveToDisk();
  }

  clear(): void {
    this.cache.clear();
    this.saveToDisk();
  }
}

export const gitActivityCache = new GitActivityCache();

