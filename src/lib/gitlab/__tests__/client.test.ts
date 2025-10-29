import { GitLabClient, GitLabClientError } from '../client';
import { Component } from '@/plugins/catalog/types';

describe('GitLabClient', () => {
  let client: GitLabClient;
  const mockToken = 'glpat-test-token';

  beforeEach(() => {
    client = new GitLabClient(mockToken);
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('checkCatalogFileExists', () => {
    it('should return true when catalog file exists', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: new Headers(),
      });

      const result = await client.checkCatalogFileExists('my-group/my-project');

      expect(result).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('my-group%2Fmy-project'),
        expect.objectContaining({
          headers: { 'PRIVATE-TOKEN': mockToken },
        })
      );
    });

    it('should return false when catalog file does not exist (404)', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        headers: new Headers(),
      });

      const result = await client.checkCatalogFileExists('my-group/my-project');

      expect(result).toBe(false);
    });

    it('should throw error for non-404 errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
        headers: new Headers(),
      });

      await expect(client.checkCatalogFileExists('my-group/my-project')).rejects.toThrow(
        GitLabClientError
      );
    });
  });

  describe('fetchCatalogFile', () => {
    const mockComponent: Component = {
      apiVersion: 'backstage.io/v1alpha1',
      kind: 'Component',
      metadata: {
        name: 'test-service',
        description: 'A test service',
        tags: ['typescript', 'api'],
      },
      spec: {
        type: 'service',
        lifecycle: 'production',
        owner: 'team-platform',
      },
    };

    it('should fetch and parse valid catalog file', async () => {
      const yamlContent = `apiVersion: backstage.io/v1alpha1
kind: Component
metadata:
  name: test-service
  description: A test service
  tags:
    - typescript
    - api
spec:
  type: service
  lifecycle: production
  owner: team-platform`;

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        text: jest.fn().mockResolvedValue(yamlContent),
        headers: new Headers(),
      });

      const result = await client.fetchCatalogFile('my-group/my-project');

      expect(result).toEqual(mockComponent);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/raw?ref=main'),
        expect.any(Object)
      );
    });

    it('should return null for non-Component kind', async () => {
      const yamlContent = `apiVersion: backstage.io/v1alpha1
kind: API
metadata:
  name: test-api`;

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        text: jest.fn().mockResolvedValue(yamlContent),
        headers: new Headers(),
      });

      const result = await client.fetchCatalogFile('my-group/my-project');

      expect(result).toBeNull();
    });

    it('should return null when file not found (404)', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        headers: new Headers(),
      });

      const result = await client.fetchCatalogFile('my-group/my-project');

      expect(result).toBeNull();
    });

    it('should throw error for other API errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        headers: new Headers(),
      });

      await expect(client.fetchCatalogFile('my-group/my-project')).rejects.toThrow(
        GitLabClientError
      );
    });
  });

  describe('listGroupProjects', () => {
    it('should fetch all projects in a group with pagination', async () => {
      const page1 = Array.from({ length: 100 }, (_, i) => ({
        id: i + 1,
        name: `project-${i + 1}`,
        path_with_namespace: `my-group/project-${i + 1}`,
        web_url: `https://gitlab.com/my-group/project-${i + 1}`,
      }));

      const page2 = Array.from({ length: 50 }, (_, i) => ({
        id: i + 101,
        name: `project-${i + 101}`,
        path_with_namespace: `my-group/project-${i + 101}`,
        web_url: `https://gitlab.com/my-group/project-${i + 101}`,
      }));

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue(page1),
          headers: new Headers(),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue(page2),
          headers: new Headers(),
        });

      const result = await client.listGroupProjects('my-group');

      expect(result).toHaveLength(150);
      expect(result[0]).toBe('my-group/project-1');
      expect(result[149]).toBe('my-group/project-150');
      expect(global.fetch).toHaveBeenCalledTimes(2);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('include_subgroups=true'),
        expect.any(Object)
      );
    });

    it('should handle empty group', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue([]),
        headers: new Headers(),
      });

      const result = await client.listGroupProjects('empty-group');

      expect(result).toEqual([]);
    });
  });

  describe('listUserProjects', () => {
    it('should fetch all projects for a user', async () => {
      const mockProjects = [
        {
          id: 1,
          name: 'project-1',
          path_with_namespace: 'username/project-1',
          web_url: 'https://gitlab.com/username/project-1',
        },
        {
          id: 2,
          name: 'project-2',
          path_with_namespace: 'username/project-2',
          web_url: 'https://gitlab.com/username/project-2',
        },
      ];

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue(mockProjects),
          headers: new Headers(),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue([]),
          headers: new Headers(),
        });

      const result = await client.listUserProjects('username');

      expect(result).toEqual(['username/project-1', 'username/project-2']);
    });
  });

  describe('listAuthenticatedUserProjects', () => {
    it('should fetch all projects for authenticated user', async () => {
      const mockProjects = [
        {
          id: 1,
          name: 'private-project',
          path_with_namespace: 'myuser/private-project',
          web_url: 'https://gitlab.com/myuser/private-project',
        },
      ];

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue(mockProjects),
          headers: new Headers(),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue([]),
          headers: new Headers(),
        });

      const result = await client.listAuthenticatedUserProjects();

      expect(result).toEqual(['myuser/private-project']);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('membership=true'),
        expect.any(Object)
      );
    });
  });

  describe('getAuthenticatedUser', () => {
    it('should return authenticated user info', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({ username: 'testuser', id: 123 }),
        headers: new Headers(),
      });

      const result = await client.getAuthenticatedUser();

      expect(result).toEqual({ username: 'testuser' });
    });
  });

  describe('getRateLimit', () => {
    it('should extract rate limit from headers', async () => {
      const headers = new Headers({
        'RateLimit-Limit': '2000',
        'RateLimit-Remaining': '1500',
        'RateLimit-Reset': '1234567890',
      });

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers,
      });

      const result = await client.getRateLimit();

      expect(result).toEqual({
        limit: 2000,
        remaining: 1500,
        reset: 1234567890,
      });
    });

    it('should return null if rate limit headers are missing', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: new Headers(),
      });

      const result = await client.getRateLimit();

      expect(result).toBeNull();
    });

    it('should return null on error', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const result = await client.getRateLimit();

      expect(result).toBeNull();
    });
  });

  describe('GitLabClientError', () => {
    it('should include status code and rate limit info', () => {
      const rateLimit = { limit: 2000, remaining: 0, reset: 1234567890 };
      const error = new GitLabClientError('Rate limit exceeded', 429, rateLimit);

      expect(error.message).toBe('Rate limit exceeded');
      expect(error.statusCode).toBe(429);
      expect(error.rateLimit).toEqual(rateLimit);
      expect(error.name).toBe('GitLabClientError');
    });
  });
});

