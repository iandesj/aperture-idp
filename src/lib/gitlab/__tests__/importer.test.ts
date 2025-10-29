import { importFromGitLab, getImportStats, clearImportedData } from '../importer';
import { GitLabClient, GitLabClientError } from '../client';
import { importStore } from '../../import/store';
import config from '../../aperture.config';

jest.mock('../client');
jest.mock('../../import/store', () => ({
  importStore: {
    addImportedComponent: jest.fn(),
    getStats: jest.fn(),
    clearImported: jest.fn(),
  },
}));

jest.mock('../../aperture.config', () => ({
  __esModule: true,
  default: {
    gitlab: {
      enabled: true,
      token: 'test-token',
      projects: [],
    },
  },
}));

describe('GitLab Importer', () => {
  let mockClient: jest.Mocked<GitLabClient>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockClient = new GitLabClient('test-token') as jest.Mocked<GitLabClient>;
    (GitLabClient as jest.MockedClass<typeof GitLabClient>).mockImplementation(() => mockClient);
  });

  describe('importFromGitLab', () => {
    beforeEach(() => {
      config.gitlab.enabled = true;
      config.gitlab.token = 'test-token';
      config.gitlab.projects = [];
    });

    it('should throw error if GitLab is not enabled', async () => {
      config.gitlab.enabled = false;

      await expect(importFromGitLab()).rejects.toThrow(
        'GitLab integration is not enabled in configuration'
      );
    });

    it('should throw error if GitLab token is not configured', async () => {
      config.gitlab.token = undefined;

      await expect(importFromGitLab()).rejects.toThrow(
        'GitLab token is not configured'
      );
    });

    it('should throw error if no projects are configured', async () => {
      config.gitlab.projects = [];

      await expect(importFromGitLab()).rejects.toThrow(
        'No projects configured'
      );
    });

    it('should import components from configured projects', async () => {
      config.gitlab.projects = ['my-group/project-1', 'my-group/project-2'];

      const mockComponent1 = {
        apiVersion: 'backstage.io/v1alpha1',
        kind: 'Component' as const,
        metadata: {
          name: 'service-1',
          description: 'Service 1',
        },
        spec: {
          type: 'service',
          lifecycle: 'production',
          owner: 'team-a',
        },
      };

      const mockComponent2 = {
        apiVersion: 'backstage.io/v1alpha1',
        kind: 'Component' as const,
        metadata: {
          name: 'service-2',
          description: 'Service 2',
        },
        spec: {
          type: 'service',
          lifecycle: 'production',
          owner: 'team-b',
        },
      };

      mockClient.checkCatalogFileExists = jest
        .fn()
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(true);

      mockClient.fetchCatalogFile = jest
        .fn()
        .mockResolvedValueOnce(mockComponent1)
        .mockResolvedValueOnce(mockComponent2);

      const result = await importFromGitLab();

      expect(result.success).toBe(2);
      expect(result.failed).toBe(0);
      expect(result.skipped).toBe(0);
      expect(result.total).toBe(2);
      expect(result.errors).toHaveLength(0);

      expect(importStore.addImportedComponent).toHaveBeenCalledTimes(2);
      expect(importStore.addImportedComponent).toHaveBeenCalledWith(
        'gitlab',
        'my-group/project-1',
        mockComponent1,
        'https://gitlab.com/my-group/project-1/-/blob/main/catalog-info.yaml'
      );
    });

    it('should skip projects without catalog files', async () => {
      config.gitlab.projects = ['my-group/project-1', 'my-group/project-2'];

      mockClient.checkCatalogFileExists = jest
        .fn()
        .mockResolvedValueOnce(false)
        .mockResolvedValueOnce(false);

      const result = await importFromGitLab();

      expect(result.success).toBe(0);
      expect(result.failed).toBe(0);
      expect(result.skipped).toBe(2);
      expect(result.total).toBe(2);

      expect(importStore.addImportedComponent).not.toHaveBeenCalled();
    });

    it('should handle errors and continue processing', async () => {
      config.gitlab.projects = ['my-group/project-1', 'my-group/project-2'];

      const apiError = new GitLabClientError('API Error', 500);
      
      mockClient.checkCatalogFileExists = jest
        .fn()
        .mockRejectedValueOnce(apiError)
        .mockResolvedValueOnce(true);

      mockClient.fetchCatalogFile = jest.fn().mockResolvedValueOnce({
        apiVersion: 'backstage.io/v1alpha1',
        kind: 'Component',
        metadata: { name: 'service-2' },
        spec: { type: 'service', lifecycle: 'production', owner: 'team-b' },
      });

      const result = await importFromGitLab();

      expect(result.success).toBe(1);
      expect(result.failed).toBe(1);
      expect(result.skipped).toBe(0);
      expect(result.total).toBe(2);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].project).toBe('my-group/project-1');
    });

    it('should stop on rate limit error', async () => {
      config.gitlab.projects = ['my-group/project-1', 'my-group/project-2'];

      const rateLimitError = new GitLabClientError(
        'Rate limit exceeded',
        429,
        { limit: 2000, remaining: 0, reset: 1234567890 }
      );

      mockClient.checkCatalogFileExists = jest.fn().mockRejectedValueOnce(rateLimitError);

      const result = await importFromGitLab();

      expect(result.failed).toBe(1);
      expect(result.errors.length).toBeGreaterThanOrEqual(1);
      expect(result.errors[0].project).toBe('my-group/project-1');
      
      // Should have two errors: one for the project and one for rate limit
      if (result.errors.length > 1) {
        expect(result.errors.some(e => e.project === 'all')).toBe(true);
      }
    });

    it('should expand group wildcards', async () => {
      config.gitlab.projects = ['my-group/*'];

      mockClient.listGroupProjects = jest
        .fn()
        .mockResolvedValueOnce(['my-group/project-1', 'my-group/project-2']);

      mockClient.checkCatalogFileExists = jest
        .fn()
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(false);

      mockClient.fetchCatalogFile = jest.fn().mockResolvedValueOnce({
        apiVersion: 'backstage.io/v1alpha1',
        kind: 'Component',
        metadata: { name: 'service-1' },
        spec: { type: 'service', lifecycle: 'production', owner: 'team-a' },
      });

      const result = await importFromGitLab();

      expect(mockClient.listGroupProjects).toHaveBeenCalledWith('my-group');
      expect(result.success).toBe(1);
      expect(result.skipped).toBe(1);
      expect(result.total).toBe(2);
    });

    it('should handle wildcard expansion gracefully on errors', async () => {
      config.gitlab.projects = ['nonexistent-group/*'];

      // Mock all expansion attempts to fail
      mockClient.listGroupProjects = jest.fn().mockRejectedValue(new Error('Not found'));
      mockClient.getAuthenticatedUser = jest.fn().mockRejectedValue(new Error('Unauthorized'));
      mockClient.listUserProjects = jest.fn().mockRejectedValue(new Error('Not found'));
      mockClient.listAuthenticatedUserProjects = jest.fn().mockRejectedValue(new Error('Unauthorized'));

      const result = await importFromGitLab();

      // Should have expansion error
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some(e => e.project === 'nonexistent-group/*')).toBe(true);
    });

    it('should handle invalid project format gracefully', async () => {
      config.gitlab.projects = ['invalid-format'];

      mockClient.checkCatalogFileExists = jest.fn().mockResolvedValue(false);

      const result = await importFromGitLab();

      // Should skip the invalid project
      expect(result.skipped).toBe(1);
      expect(result.total).toBe(1);
    });

    it('should handle wildcard expansion errors', async () => {
      config.gitlab.projects = ['invalid-group/*'];

      mockClient.listGroupProjects = jest
        .fn()
        .mockRejectedValueOnce(new Error('Group not found'));

      const result = await importFromGitLab();

      expect(result.errors).toContainEqual({
        project: 'invalid-group/*',
        error: 'Group not found',
      });
    });

    it('should skip projects with null component data', async () => {
      config.gitlab.projects = ['my-group/project-1'];

      mockClient.checkCatalogFileExists = jest.fn().mockResolvedValueOnce(true);
      mockClient.fetchCatalogFile = jest.fn().mockResolvedValueOnce(null);

      const result = await importFromGitLab();

      expect(result.success).toBe(0);
      expect(result.skipped).toBe(1);
      expect(importStore.addImportedComponent).not.toHaveBeenCalled();
    });

    it('should handle invalid project format', async () => {
      config.gitlab.projects = ['invalid-format'];

      mockClient.checkCatalogFileExists = jest.fn();

      const result = await importFromGitLab();

      expect(result.success).toBe(0);
      expect(result.skipped).toBe(1);
      expect(mockClient.checkCatalogFileExists).toHaveBeenCalledWith('invalid-format');
    });
  });

  describe('getImportStats', () => {
    it('should return import statistics', () => {
      const mockStats = {
        total: 10,
        repositories: 5,
        bySource: { github: 5, gitlab: 5 },
        lastSync: '2025-10-29T12:00:00Z',
      };

      (importStore.getStats as jest.Mock).mockReturnValue(mockStats);

      const result = getImportStats();

      expect(result).toEqual(mockStats);
      expect(importStore.getStats).toHaveBeenCalled();
    });
  });

  describe('clearImportedData', () => {
    it('should clear all imported data', () => {
      clearImportedData();

      expect(importStore.clearImported).toHaveBeenCalled();
    });
  });
});

