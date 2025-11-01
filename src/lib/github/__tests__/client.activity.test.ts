import { GitHubClient, GitHubClientError } from '../client';

jest.mock('../../aperture.config', () => ({
  __esModule: true,
  default: {
    github: {
      enabled: true,
      token: 'test-token',
    },
  },
}));

describe('GitHubClient - getRepositoryActivity', () => {
  let client: GitHubClient;
  const mockFetch = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    client = new GitHubClient('test-token');
    (global as any).fetch = mockFetch;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should fetch repository activity successfully', async () => {
    const mockCommits = [
      {
        commit: {
          author: {
            date: '2025-01-15T10:00:00Z',
          },
        },
      },
    ];

    const mockIssues = Array.from({ length: 5 }, (_, i) => ({
      id: i + 1,
      pull_request: undefined,
    }));

    const mockPulls = [
      { id: 1 },
    ];

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockCommits,
        headers: new Headers(),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockIssues,
        headers: new Headers(),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockPulls,
        headers: new Headers({
          Link: '<https://api.github.com/repositories/123/pulls?state=open&page=2>; rel="last"',
        }),
      });

    const result = await client.getRepositoryActivity('owner', 'repo');

    expect(result).toEqual({
      lastCommitDate: '2025-01-15T10:00:00Z',
      openIssuesCount: 5,
      openPullRequestsCount: 60,
      source: 'github',
    });
  });

  it('should handle repositories with no commits', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [],
        headers: new Headers(),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [],
        headers: new Headers(),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [],
        headers: new Headers(),
      });

    const result = await client.getRepositoryActivity('owner', 'repo');

    expect(result).toEqual({
      lastCommitDate: null,
      openIssuesCount: 0,
      openPullRequestsCount: 0,
      source: 'github',
    });
  });

  it('should filter out pull requests from issues', async () => {
    const mockIssues = [
      { id: 1, pull_request: undefined },
      { id: 2, pull_request: { url: 'https://api.github.com/pulls/2' } },
      { id: 3, pull_request: undefined },
    ];

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [{ commit: { author: { date: '2025-01-15T10:00:00Z' } } }],
        headers: new Headers(),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockIssues,
        headers: new Headers(),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [],
        headers: new Headers(),
      });

    const result = await client.getRepositoryActivity('owner', 'repo');

    expect(result.openIssuesCount).toBe(2);
  });

  it('should handle pagination for issues', async () => {
    const manyIssues = Array.from({ length: 100 }, (_, i) => ({
      id: i + 1,
      pull_request: undefined,
    }));

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [{ commit: { author: { date: '2025-01-15T10:00:00Z' } } }],
        headers: new Headers(),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => manyIssues,
        headers: new Headers({
          Link: '<https://api.github.com/repositories/123/issues?state=open&page=5>; rel="last"',
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [],
        headers: new Headers(),
      });

    const result = await client.getRepositoryActivity('owner', 'repo');

    expect(result.openIssuesCount).toBe(150);
  });

  it('should handle API errors gracefully', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    await expect(client.getRepositoryActivity('owner', 'repo')).rejects.toThrow(
      GitHubClientError
    );
  });

  it('should handle non-OK responses', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ message: 'Not Found' }),
        headers: new Headers(),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [],
        headers: new Headers(),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [],
        headers: new Headers(),
      });

    const result = await client.getRepositoryActivity('owner', 'repo');

    expect(result.lastCommitDate).toBeNull();
  });

  it('should handle missing Link header for pagination', async () => {
    const mockPulls = [{ id: 1 }];

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [{ commit: { author: { date: '2025-01-15T10:00:00Z' } } }],
        headers: new Headers(),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [{ id: 1 }],
        headers: new Headers(),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockPulls,
        headers: new Headers(),
      });

    const result = await client.getRepositoryActivity('owner', 'repo');

    expect(result.openPullRequestsCount).toBe(0);
  });

  it('should cap pagination count at 1000', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [{ commit: { author: { date: '2025-01-15T10:00:00Z' } } }],
        headers: new Headers(),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => Array.from({ length: 100 }, (_, i) => ({ id: i + 1 })),
        headers: new Headers({
          Link: '<https://api.github.com/repositories/123/issues?state=open&page=50>; rel="last"',
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [],
        headers: new Headers(),
      });

    const result = await client.getRepositoryActivity('owner', 'repo');

    expect(result.openIssuesCount).toBeLessThanOrEqual(1000);
  });
});

