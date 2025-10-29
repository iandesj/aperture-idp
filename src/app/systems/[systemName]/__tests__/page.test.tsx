import { render } from '@testing-library/react';
import SystemDetailPage from '../page';
import * as catalogLib from '@/lib/catalog';
import { notFound } from 'next/navigation';
import { Component } from '@/plugins/catalog/types';

jest.mock('@/lib/catalog');
jest.mock('next/navigation', () => ({
  notFound: jest.fn(() => {
    throw new Error('NEXT_NOT_FOUND');
  }),
}));

const mockCatalogLib = catalogLib as jest.Mocked<typeof catalogLib>;
const mockNotFound = notFound as jest.Mock;

describe('SystemDetailPage', () => {
  const mockComponents: Component[] = [
    {
      apiVersion: 'backstage.io/v1alpha1',
      kind: 'Component',
      metadata: {
        name: 'service-1',
        description: 'Service description',
        tags: ['typescript', 'api'],
      },
      spec: {
        type: 'service',
        lifecycle: 'production',
        owner: 'team-backend',
        system: 'test-system',
      },
    },
    {
      apiVersion: 'backstage.io/v1alpha1',
      kind: 'Component',
      metadata: {
        name: 'service-2',
        description: 'Another service',
        tags: ['nodejs'],
      },
      spec: {
        type: 'service',
        lifecycle: 'experimental',
        owner: 'team-backend',
        system: 'test-system',
      },
    },
    {
      apiVersion: 'backstage.io/v1alpha1',
      kind: 'Component',
      metadata: {
        name: 'library-1',
        description: 'Library description',
        tags: ['react'],
      },
      spec: {
        type: 'library',
        lifecycle: 'production',
        owner: 'team-frontend',
        system: 'test-system',
      },
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render system detail page with components', async () => {
    mockCatalogLib.getComponentsBySystem.mockReturnValue(mockComponents);

    const result = await SystemDetailPage({
      params: Promise.resolve({ systemName: 'test-system' }),
    });

    const { container } = render(result);

    expect(container.textContent).toContain('test-system');
    expect(container.textContent).toContain('3 components in this system');
    expect(container.textContent).toContain('service-1');
    expect(container.textContent).toContain('service-2');
    expect(container.textContent).toContain('library-1');
  });

  it('should group components by type', async () => {
    mockCatalogLib.getComponentsBySystem.mockReturnValue(mockComponents);

    const result = await SystemDetailPage({
      params: Promise.resolve({ systemName: 'test-system' }),
    });

    const { container } = render(result);

    expect(container.textContent).toContain('services');
    expect(container.textContent).toContain('librarys');
  });

  it('should call notFound when system has no components', async () => {
    mockCatalogLib.getComponentsBySystem.mockReturnValue([]);

    await expect(
      SystemDetailPage({
        params: Promise.resolve({ systemName: 'nonexistent' }),
      })
    ).rejects.toThrow('NEXT_NOT_FOUND');

    expect(mockNotFound).toHaveBeenCalled();
  });

  it('should handle uncategorized system', async () => {
    const uncategorizedComponents = mockComponents.map((c) => ({
      ...c,
      spec: { ...c.spec, system: undefined },
    }));
    mockCatalogLib.getAllComponents.mockReturnValue(uncategorizedComponents);

    const result = await SystemDetailPage({
      params: Promise.resolve({ systemName: 'uncategorized' }),
    });

    const { container } = render(result);

    expect(container.textContent).toContain('Uncategorized');
    expect(container.textContent).toContain('3 components in this system');
  });

  it('should not call notFound for uncategorized with no components', async () => {
    mockCatalogLib.getAllComponents.mockReturnValue([]);

    const result = await SystemDetailPage({
      params: Promise.resolve({ systemName: 'uncategorized' }),
    });

    const { container } = render(result);

    expect(container.textContent).toContain('Uncategorized');
    expect(container.textContent).toContain('0 components in this system');
    expect(mockNotFound).not.toHaveBeenCalled();
  });

  it('should display component metadata badges', async () => {
    mockCatalogLib.getComponentsBySystem.mockReturnValue([mockComponents[0]]);

    const result = await SystemDetailPage({
      params: Promise.resolve({ systemName: 'test-system' }),
    });

    const { container } = render(result);

    expect(container.textContent).toContain('service');
    expect(container.textContent).toContain('production');
  });

  it('should display component tags', async () => {
    mockCatalogLib.getComponentsBySystem.mockReturnValue([mockComponents[0]]);

    const result = await SystemDetailPage({
      params: Promise.resolve({ systemName: 'test-system' }),
    });

    const { container } = render(result);

    expect(container.textContent).toContain('typescript');
    expect(container.textContent).toContain('api');
  });

  it('should limit displayed tags to 3 with overflow indicator', async () => {
    const componentWithManyTags: Component = {
      ...mockComponents[0],
      metadata: {
        ...mockComponents[0].metadata,
        tags: ['tag1', 'tag2', 'tag3', 'tag4', 'tag5'],
      },
    };
    mockCatalogLib.getComponentsBySystem.mockReturnValue([componentWithManyTags]);

    const result = await SystemDetailPage({
      params: Promise.resolve({ systemName: 'test-system' }),
    });

    const { container } = render(result);

    expect(container.textContent).toContain('tag1');
    expect(container.textContent).toContain('tag2');
    expect(container.textContent).toContain('tag3');
    expect(container.textContent).toContain('+2');
  });

  it('should render back to systems link', async () => {
    mockCatalogLib.getComponentsBySystem.mockReturnValue(mockComponents);

    const result = await SystemDetailPage({
      params: Promise.resolve({ systemName: 'test-system' }),
    });

    const { container } = render(result);

    const links = container.querySelectorAll('a');
    const backLink = Array.from(links).find((link) => link.getAttribute('href') === '/systems');
    expect(backLink).toBeInTheDocument();
  });

  it('should use singular form for single component', async () => {
    mockCatalogLib.getComponentsBySystem.mockReturnValue([mockComponents[0]]);

    const result = await SystemDetailPage({
      params: Promise.resolve({ systemName: 'test-system' }),
    });

    const { container } = render(result);

    expect(container.textContent).toContain('1 component in this system');
  });
});

