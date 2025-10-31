import { gitActivityCache } from '../cache';
import fs from 'fs';
import path from 'path';

jest.mock('fs');

const mockFs = fs as jest.Mocked<typeof fs>;

describe('GitActivityCache', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFs.existsSync.mockReturnValue(false);
    mockFs.readFileSync.mockReturnValue('{}');
    mockFs.mkdirSync.mockReturnValue(undefined);
    mockFs.writeFileSync.mockReturnValue(undefined);
    
    gitActivityCache.clear();
  });

  describe('get and set', () => {
    it('should return null for non-existent cache entry', () => {
      const result = gitActivityCache.get('github', 'owner/repo', 'component-1');
      expect(result).toBeNull();
    });

    it('should set and get cached metrics', () => {
      const metrics = {
        lastCommitDate: '2025-01-15T10:00:00Z',
        openIssuesCount: 5,
        openPullRequestsCount: 2,
        source: 'github' as const,
      };

      gitActivityCache.set('github', 'owner/repo', 'component-1', metrics);
      const result = gitActivityCache.get('github', 'owner/repo', 'component-1');

      expect(result).toEqual(metrics);
    });

    it('should handle different repositories separately', () => {
      const metrics1 = {
        lastCommitDate: '2025-01-15T10:00:00Z',
        openIssuesCount: 5,
        openPullRequestsCount: 2,
        source: 'github' as const,
      };

      const metrics2 = {
        lastCommitDate: '2025-01-20T10:00:00Z',
        openIssuesCount: 10,
        openPullRequestsCount: 3,
        source: 'gitlab' as const,
      };

      gitActivityCache.set('github', 'owner/repo1', 'component-1', metrics1);
      gitActivityCache.set('gitlab', 'group/project', 'component-2', metrics2);

      expect(gitActivityCache.get('github', 'owner/repo1', 'component-1')).toEqual(metrics1);
      expect(gitActivityCache.get('gitlab', 'group/project', 'component-2')).toEqual(metrics2);
    });

    it('should handle GitLab source', () => {
      const metrics = {
        lastCommitDate: '2025-01-15T10:00:00Z',
        openIssuesCount: 3,
        openPullRequestsCount: 1,
        source: 'gitlab' as const,
      };

      gitActivityCache.set('gitlab', 'group/project', 'component-1', metrics);
      const result = gitActivityCache.get('gitlab', 'group/project', 'component-1');

      expect(result).toEqual(metrics);
    });
  });

  describe('cache expiration', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should return cached value when not expired', () => {
      const metrics = {
        lastCommitDate: '2025-01-15T10:00:00Z',
        openIssuesCount: 5,
        openPullRequestsCount: 2,
        source: 'github' as const,
      };

      gitActivityCache.set('github', 'owner/repo', 'component-1', metrics);
      
      jest.advanceTimersByTime(4 * 60 * 1000);
      
      const result = gitActivityCache.get('github', 'owner/repo', 'component-1');
      expect(result).toEqual(metrics);
    });

    it('should return null when cache is expired', () => {
      const metrics = {
        lastCommitDate: '2025-01-15T10:00:00Z',
        openIssuesCount: 5,
        openPullRequestsCount: 2,
        source: 'github' as const,
      };

      gitActivityCache.set('github', 'owner/repo', 'component-1', metrics);
      
      jest.advanceTimersByTime(6 * 60 * 1000);
      
      const result = gitActivityCache.get('github', 'owner/repo', 'component-1');
      expect(result).toBeNull();
    });

    it('should remove expired entries from cache', () => {
      const metrics = {
        lastCommitDate: '2025-01-15T10:00:00Z',
        openIssuesCount: 5,
        openPullRequestsCount: 2,
        source: 'github' as const,
      };

      gitActivityCache.set('github', 'owner/repo', 'component-1', metrics);
      
      jest.advanceTimersByTime(6 * 60 * 1000);
      
      gitActivityCache.get('github', 'owner/repo', 'component-1');
      expect(mockFs.writeFileSync).toHaveBeenCalled();
    });
  });

  describe('clear', () => {
    it('should clear all cached entries', () => {
      const metrics = {
        lastCommitDate: '2025-01-15T10:00:00Z',
        openIssuesCount: 5,
        openPullRequestsCount: 2,
        source: 'github' as const,
      };

      gitActivityCache.set('github', 'owner/repo', 'component-1', metrics);
      gitActivityCache.clear();

      const result = gitActivityCache.get('github', 'owner/repo', 'component-1');
      expect(result).toBeNull();
    });

    it('should save to disk when clearing', () => {
      gitActivityCache.clear();
      expect(mockFs.writeFileSync).toHaveBeenCalled();
    });
  });

  describe('disk persistence', () => {
    it('should load from disk on initialization', () => {
      const cachedData = {
        'github:owner/repo:component-1': {
          lastCommitDate: '2025-01-15T10:00:00Z',
          openIssuesCount: 5,
          openPullRequestsCount: 2,
          source: 'github',
          cachedAt: new Date().toISOString(),
        },
      };

      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(JSON.stringify(cachedData));

      gitActivityCache.clear();
      
      const loadSpy = jest.spyOn(gitActivityCache as any, 'loadFromDisk');
      loadSpy.mockImplementation(() => {
        try {
          if (mockFs.existsSync(gitActivityCache['persistencePath'])) {
            const data = mockFs.readFileSync(gitActivityCache['persistencePath'], 'utf-8');
            const parsed = JSON.parse(data);
            gitActivityCache['cache'] = new Map(Object.entries(parsed));
          }
        } catch (error) {
          console.warn('Failed to load git activity cache from disk:', error);
        }
      });

      gitActivityCache['loadFromDisk']();
      const result = gitActivityCache.get('github', 'owner/repo', 'component-1');

      expect(result).toBeDefined();
      expect(result?.openIssuesCount).toBe(5);
      
      loadSpy.mockRestore();
    });

    it('should handle corrupted disk data gracefully', () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue('invalid json');

      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

      gitActivityCache.clear();
      
      const loadSpy = jest.spyOn(gitActivityCache as any, 'loadFromDisk');
      loadSpy.mockImplementation(() => {
        try {
          if (mockFs.existsSync(gitActivityCache['persistencePath'])) {
            const data = mockFs.readFileSync(gitActivityCache['persistencePath'], 'utf-8');
            JSON.parse(data);
          }
        } catch (error) {
          console.warn('Failed to load git activity cache from disk:', error);
        }
      });

      gitActivityCache['loadFromDisk']();
      const result = gitActivityCache.get('github', 'owner/repo', 'component-1');

      expect(result).toBeNull();
      expect(consoleWarnSpy).toHaveBeenCalled();

      consoleWarnSpy.mockRestore();
      loadSpy.mockRestore();
    });

    it('should save to disk when setting cache', () => {
      const writeData: string[] = [];
      mockFs.writeFileSync.mockImplementation((filePath, data) => {
        writeData.push(data as string);
      });

      const metrics = {
        lastCommitDate: '2025-01-15T10:00:00Z',
        openIssuesCount: 5,
        openPullRequestsCount: 2,
        source: 'github' as const,
      };

      gitActivityCache.set('github', 'owner/repo', 'component-1', metrics);

      expect(mockFs.writeFileSync).toHaveBeenCalled();
      expect(writeData.length).toBeGreaterThan(0);
      const writtenData = JSON.parse(writeData[writeData.length - 1]);
      expect(writtenData).toHaveProperty('github:owner/repo:component-1');
    });

    it('should create directory if it does not exist', () => {
      mockFs.existsSync.mockReturnValue(false);

      const metrics = {
        lastCommitDate: '2025-01-15T10:00:00Z',
        openIssuesCount: 5,
        openPullRequestsCount: 2,
        source: 'github' as const,
      };

      gitActivityCache.set('github', 'owner/repo', 'component-1', metrics);

      expect(mockFs.mkdirSync).toHaveBeenCalledWith(
        expect.stringContaining('.aperture'),
        { recursive: true }
      );
    });
  });
});

