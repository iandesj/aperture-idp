/**
 * @jest-environment node
 */
import { POST, DELETE, GET } from '../route';
import { hiddenStore } from '@/lib/hidden/store';
import { getComponentByName } from '@/lib/catalog';
import { NextRequest } from 'next/server';

jest.mock('@/lib/hidden/store', () => ({
  hiddenStore: {
    hideComponent: jest.fn(),
    unhideComponent: jest.fn(),
    isHidden: jest.fn(),
    getStats: jest.fn(),
  },
}));

jest.mock('@/lib/catalog', () => ({
  getComponentByName: jest.fn(),
}));

const mockHiddenStore = hiddenStore as jest.Mocked<typeof hiddenStore>;
const mockGetComponentByName = getComponentByName as jest.MockedFunction<typeof getComponentByName>;

describe('/api/catalog/hide', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST', () => {
    it('should hide a component successfully', async () => {
      const mockComponent = {
        apiVersion: 'backstage.io/v1alpha1',
        kind: 'Component',
        metadata: { name: 'test-component', description: 'Test' },
        spec: { type: 'service', lifecycle: 'production', owner: 'team-a' },
      };

      mockGetComponentByName.mockReturnValue(mockComponent);
      mockHiddenStore.hideComponent.mockReturnValue();

      const request = new NextRequest('http://localhost:3000/api/catalog/hide', {
        method: 'POST',
        body: JSON.stringify({ componentName: 'test-component' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toContain('test-component');
      expect(mockHiddenStore.hideComponent).toHaveBeenCalledWith('test-component');
    });

    it('should return 400 when component name is missing', async () => {
      const request = new NextRequest('http://localhost:3000/api/catalog/hide', {
        method: 'POST',
        body: JSON.stringify({}),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('required');
    });

    it('should return 400 when component name is not a string', async () => {
      const request = new NextRequest('http://localhost:3000/api/catalog/hide', {
        method: 'POST',
        body: JSON.stringify({ componentName: 123 }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });

    it('should return 404 when component does not exist', async () => {
      mockGetComponentByName.mockReturnValue(null);

      const request = new NextRequest('http://localhost:3000/api/catalog/hide', {
        method: 'POST',
        body: JSON.stringify({ componentName: 'nonexistent' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toContain('not found');
    });

    it('should handle errors gracefully', async () => {
      mockGetComponentByName.mockImplementation(() => {
        throw new Error('Database error');
      });

      const request = new NextRequest('http://localhost:3000/api/catalog/hide', {
        method: 'POST',
        body: JSON.stringify({ componentName: 'test-component' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Database error');
    });
  });

  describe('DELETE', () => {
    it('should unhide a component successfully', async () => {
      mockHiddenStore.isHidden.mockReturnValue(true);
      mockHiddenStore.unhideComponent.mockReturnValue();

      const request = new NextRequest(
        'http://localhost:3000/api/catalog/hide?componentName=test-component',
        { method: 'DELETE' }
      );

      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toContain('test-component');
      expect(mockHiddenStore.unhideComponent).toHaveBeenCalledWith('test-component');
    });

    it('should return 400 when component name is missing', async () => {
      const request = new NextRequest('http://localhost:3000/api/catalog/hide', {
        method: 'DELETE',
      });

      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('required');
    });

    it('should return 400 when component is not hidden', async () => {
      mockHiddenStore.isHidden.mockReturnValue(false);

      const request = new NextRequest(
        'http://localhost:3000/api/catalog/hide?componentName=test-component',
        { method: 'DELETE' }
      );

      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('not hidden');
    });

    it('should handle errors gracefully', async () => {
      mockHiddenStore.isHidden.mockImplementation(() => {
        throw new Error('Storage error');
      });

      const request = new NextRequest(
        'http://localhost:3000/api/catalog/hide?componentName=test-component',
        { method: 'DELETE' }
      );

      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Storage error');
    });
  });

  describe('GET', () => {
    it('should return hidden component stats', async () => {
      mockHiddenStore.getStats.mockReturnValue({
        total: 2,
        components: ['comp-1', 'comp-2'],
      });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.stats.total).toBe(2);
      expect(data.stats.components).toHaveLength(2);
    });

    it('should handle errors gracefully', async () => {
      mockHiddenStore.getStats.mockImplementation(() => {
        throw new Error('Storage error');
      });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Storage error');
    });
  });
});

