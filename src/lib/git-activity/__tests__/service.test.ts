import { getActivityMetrics } from '../service';
import { Component } from '@/plugins/catalog/types';
import { importStore } from '@/lib/import/store';
import { gitActivityCache } from '../cache';
import { GitHubClient } from '@/lib/github/client';
import { GitLabClient } from '@/lib/gitlab/client';
import config from '@/lib/aperture.config';

jest.mock('../cache');
jest.mock('@/lib/import/store');
jest.mock('@/lib/github/client');
jest.mock('@/lib/gitlab/client');
jest.mock('@/lib/aperture.config', () => ({
  __esModule: true,
  default: {
    github: {
      enabled: true,
      token: 'test-github-token',
    },
    gitlab: {
      enabled: true,
      token: 'test-gitlab-token',
    },
  },
}));

const mockImportStore = importStore as jest.Mocked<typeof importStore>;
const mockCache = gitActivityCache as jest.Mocked<typeof gitActivityCache>;

describe('getActivityMetrics', () => {
  const mockComponent: Component = {
    apiVersion: 'backstage.io/v1alpha1',
    kind: 'Component',
    metadata: {
      name: 'test-component',
      description: 'Test component',
    },
    spec: {
      type: 'service',
      lifecycle: 'production',
      owner: 'team-a',
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockCache.get.mockReturnValue(null);
  });

  it('should return null for non-imported component', async () => {
    mockImportStore.getImportedComponents.mockReturnValue([]);

    const result = await getActivityMetrics(mockComponent);

    expect(result).toBeNull();
  });

  it('should return cached metrics if available', async () => {
    const cachedMetrics = {
      lastCommitDate: '2025-01-15T10:00:00Z',
      openIssuesCount: 5,
      openPullRequestsCount: 2,
      source: 'github' as const,
    };

    mockImportStore.getImportedComponents.mockReturnValue([
      {
        component: mockComponent,
        source: {
          type: 'github',
          repository: 'owner/repo',
          url: 'https://github.com/owner/repo/blob/main/catalog-info.yaml',
          repositoryUrl: 'https://github.com/owner/repo',
        },
        lastSynced: new Date().toISOString(),
      },
    ]);

    mockCache.get.mockReturnValue(cachedMetrics);

    const result = await getActivityMetrics(mockComponent);

    expect(result).toEqual(cachedMetrics);
    expect(mockCache.get).toHaveBeenCalledWith('github', 'owner/repo', 'test-component');
  });

  it('should fetch GitHub metrics when not cached', async () => {
    const mockMetrics = {
      lastCommitDate: '2025-01-15T10:00:00Z',
      openIssuesCount: 5,
      openPullRequestsCount: 2,
      source: 'github' as const,
    };

    mockImportStore.getImportedComponents.mockReturnValue([
      {
        component: mockComponent,
        source: {
          type: 'github',
          repository: 'owner/repo',
          url: 'https://github.com/owner/repo/blob/main/catalog-info.yaml',
          repositoryUrl: 'https://github.com/owner/repo',
        },
        lastSynced: new Date().toISOString(),
      },
    ]);

    const mockClient = {
      getRepositoryActivity: jest.fn().mockResolvedValue(mockMetrics),
    };
    (GitHubClient as jest.Mock).mockImplementation(() => mockClient);

    const result = await getActivityMetrics(mockComponent);

    expect(result).toEqual(mockMetrics);
    expect(mockClient.getRepositoryActivity).toHaveBeenCalledWith('owner', 'repo');
    expect(mockCache.set).toHaveBeenCalledWith('github', 'owner/repo', 'test-component', mockMetrics);
  });

  it('should fetch GitLab metrics when not cached', async () => {
    const mockMetrics = {
      lastCommitDate: '2025-01-15T10:00:00Z',
      openIssuesCount: 3,
      openPullRequestsCount: 1,
      source: 'gitlab' as const,
    };

    mockImportStore.getImportedComponents.mockReturnValue([
      {
        component: mockComponent,
        source: {
          type: 'gitlab',
          repository: 'group/project',
          url: 'https://gitlab.com/group/project/-/blob/main/catalog-info.yaml',
          repositoryUrl: 'https://gitlab.com/group/project',
        },
        lastSynced: new Date().toISOString(),
      },
    ]);

    const mockClient = {
      getRepositoryActivity: jest.fn().mockResolvedValue(mockMetrics),
    };
    (GitLabClient as jest.Mock).mockImplementation(() => mockClient);

    const result = await getActivityMetrics(mockComponent);

    expect(result).toEqual(mockMetrics);
    expect(mockClient.getRepositoryActivity).toHaveBeenCalledWith('group/project');
    expect(mockCache.set).toHaveBeenCalledWith('gitlab', 'group/project', 'test-component', mockMetrics);
  });

  it('should return null when GitHub is not enabled', async () => {
    const originalConfig = config.github.enabled;
    (config as any).github.enabled = false;

    mockImportStore.getImportedComponents.mockReturnValue([
      {
        component: mockComponent,
        source: {
          type: 'github',
          repository: 'owner/repo',
          url: 'https://github.com/owner/repo/blob/main/catalog-info.yaml',
          repositoryUrl: 'https://github.com/owner/repo',
        },
        lastSynced: new Date().toISOString(),
      },
    ]);

    const result = await getActivityMetrics(mockComponent);

    expect(result).toBeNull();
    expect(GitHubClient).not.toHaveBeenCalled();

    (config as any).github.enabled = originalConfig;
  });

  it('should return null when GitHub token is missing', async () => {
    const originalToken = config.github.token;
    (config as any).github.token = undefined;

    mockImportStore.getImportedComponents.mockReturnValue([
      {
        component: mockComponent,
        source: {
          type: 'github',
          repository: 'owner/repo',
          url: 'https://github.com/owner/repo/blob/main/catalog-info.yaml',
          repositoryUrl: 'https://github.com/owner/repo',
        },
        lastSynced: new Date().toISOString(),
      },
    ]);

    const result = await getActivityMetrics(mockComponent);

    expect(result).toBeNull();

    (config as any).github.token = originalToken;
  });

  it('should return null for invalid repository format', async () => {
    mockImportStore.getImportedComponents.mockReturnValue([
      {
        component: mockComponent,
        source: {
          type: 'github',
          repository: 'invalid-repo',
          url: 'https://github.com/invalid-repo/blob/main/catalog-info.yaml',
          repositoryUrl: 'https://github.com/invalid-repo',
        },
        lastSynced: new Date().toISOString(),
      },
    ]);

    const result = await getActivityMetrics(mockComponent);

    expect(result).toBeNull();
  });

  it('should handle errors gracefully', async () => {
    mockImportStore.getImportedComponents.mockReturnValue([
      {
        component: mockComponent,
        source: {
          type: 'github',
          repository: 'owner/repo',
          url: 'https://github.com/owner/repo/blob/main/catalog-info.yaml',
          repositoryUrl: 'https://github.com/owner/repo',
        },
        lastSynced: new Date().toISOString(),
      },
    ]);

    const mockClient = {
      getRepositoryActivity: jest.fn().mockRejectedValue(new Error('API Error')),
    };
    (GitHubClient as jest.Mock).mockImplementation(() => mockClient);

    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

    const result = await getActivityMetrics(mockComponent);

    expect(result).toBeNull();
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      'Failed to fetch git activity for test-component:',
      expect.any(Error)
    );

    consoleWarnSpy.mockRestore();
  });

  it('should return null when metrics are null', async () => {
    mockImportStore.getImportedComponents.mockReturnValue([
      {
        component: mockComponent,
        source: {
          type: 'github',
          repository: 'owner/repo',
          url: 'https://github.com/owner/repo/blob/main/catalog-info.yaml',
          repositoryUrl: 'https://github.com/owner/repo',
        },
        lastSynced: new Date().toISOString(),
      },
    ]);

    const mockClient = {
      getRepositoryActivity: jest.fn().mockResolvedValue(null),
    };
    (GitHubClient as jest.Mock).mockImplementation(() => mockClient);

    const result = await getActivityMetrics(mockComponent);

    expect(result).toBeNull();
  });
});

