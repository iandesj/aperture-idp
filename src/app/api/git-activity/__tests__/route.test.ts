/**
 * @jest-environment node
 */
import { GET } from '../route';
import { getComponentByName } from '@/lib/catalog';
import { getActivityMetrics } from '@/lib/git-activity/service';
import { NextRequest } from 'next/server';

jest.mock('@/lib/auth', () => ({
  auth: jest.fn(),
}));

jest.mock('@/lib/catalog', () => ({
  getComponentByName: jest.fn(),
}));

jest.mock('@/lib/git-activity/service', () => ({
  getActivityMetrics: jest.fn(),
}));

const mockGetComponentByName = getComponentByName as jest.MockedFunction<typeof getComponentByName>;
const mockGetActivityMetrics = getActivityMetrics as jest.MockedFunction<typeof getActivityMetrics>;

import { auth } from '@/lib/auth';
const mockAuth = auth as jest.MockedFunction<typeof auth>;

describe('/api/git-activity', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.mockResolvedValue({
      user: { id: '1', name: 'test', email: 'test@example.com' },
    } as any);
  });

  describe('GET', () => {
    it('should return activity metrics for a component', async () => {
      const mockComponent = {
        apiVersion: 'backstage.io/v1alpha1',
        kind: 'Component',
        metadata: { name: 'test-component', description: 'Test' },
        spec: { type: 'service', lifecycle: 'production', owner: 'team-a' },
      };

      const mockMetrics = {
        lastCommitDate: '2025-01-15T10:00:00Z',
        openIssuesCount: 5,
        openPullRequestsCount: 2,
        source: 'github' as const,
      };

      mockGetComponentByName.mockReturnValue(mockComponent);
      mockGetActivityMetrics.mockResolvedValue(mockMetrics);

      const request = new NextRequest(
        'http://localhost:3000/api/git-activity?componentName=test-component'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.metrics).toEqual(mockMetrics);
      expect(mockGetComponentByName).toHaveBeenCalledWith('test-component');
      expect(mockGetActivityMetrics).toHaveBeenCalledWith(mockComponent);
    });

    it('should return 400 when componentName is missing', async () => {
      const request = new NextRequest('http://localhost:3000/api/git-activity');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('componentName query parameter is required');
      expect(mockGetComponentByName).not.toHaveBeenCalled();
    });

    it('should return 404 when component is not found', async () => {
      mockGetComponentByName.mockReturnValue(null);

      const request = new NextRequest(
        'http://localhost:3000/api/git-activity?componentName=nonexistent'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Component not found');
      expect(mockGetActivityMetrics).not.toHaveBeenCalled();
    });

    it('should return metrics even when they are null', async () => {
      const mockComponent = {
        apiVersion: 'backstage.io/v1alpha1',
        kind: 'Component',
        metadata: { name: 'test-component', description: 'Test' },
        spec: { type: 'service', lifecycle: 'production', owner: 'team-a' },
      };

      mockGetComponentByName.mockReturnValue(mockComponent);
      mockGetActivityMetrics.mockResolvedValue(null);

      const request = new NextRequest(
        'http://localhost:3000/api/git-activity?componentName=test-component'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.metrics).toBeNull();
    });

    it('should handle errors gracefully', async () => {
      const mockComponent = {
        apiVersion: 'backstage.io/v1alpha1',
        kind: 'Component',
        metadata: { name: 'test-component', description: 'Test' },
        spec: { type: 'service', lifecycle: 'production', owner: 'team-a' },
      };

      mockGetComponentByName.mockReturnValue(mockComponent);
      mockGetActivityMetrics.mockRejectedValue(new Error('API Error'));

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      const request = new NextRequest(
        'http://localhost:3000/api/git-activity?componentName=test-component'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to fetch git activity');
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to fetch git activity:',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });

    it('should handle GitLab source metrics', async () => {
      const mockComponent = {
        apiVersion: 'backstage.io/v1alpha1',
        kind: 'Component',
        metadata: { name: 'test-component', description: 'Test' },
        spec: { type: 'service', lifecycle: 'production', owner: 'team-a' },
      };

      const mockMetrics = {
        lastCommitDate: '2025-01-15T10:00:00Z',
        openIssuesCount: 3,
        openPullRequestsCount: 1,
        source: 'gitlab' as const,
      };

      mockGetComponentByName.mockReturnValue(mockComponent);
      mockGetActivityMetrics.mockResolvedValue(mockMetrics);

      const request = new NextRequest(
        'http://localhost:3000/api/git-activity?componentName=test-component'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.metrics.source).toBe('gitlab');
    });
  });
});

