import { render, screen } from '@testing-library/react';
import { notFound } from 'next/navigation';
import ComponentDetailPage from '../page';
import * as catalogLib from '@/lib/catalog';

jest.mock('next/navigation', () => ({
  notFound: jest.fn(),
}));

jest.mock('@/lib/catalog');
jest.mock('@/components/DependencyGraph', () => ({
  DependencyGraph: () => <div data-testid="dependency-graph" />,
}));

const mockCatalogLib = catalogLib as jest.Mocked<typeof catalogLib>;

const mockComponent = {
  apiVersion: 'backstage.io/v1alpha1' as const,
  kind: 'Component' as const,
  metadata: {
    name: 'test-service',
    description: 'A test service for unit testing',
    tags: ['typescript', 'testing', 'backend'],
    links: [
      { url: 'https://github.com/example/test', title: 'Repository' },
      { url: 'https://docs.example.com/test', title: 'Documentation' },
    ],
  },
  spec: {
    type: 'service',
    lifecycle: 'production',
    owner: 'team-test',
    system: 'test-system',
  },
};

const mockMinimalComponent = {
  apiVersion: 'backstage.io/v1alpha1' as const,
  kind: 'Component' as const,
  metadata: {
    name: 'minimal-component',
  },
  spec: {
    type: 'library',
    lifecycle: 'experimental',
    owner: 'team-minimal',
  },
};

describe('ComponentDetailPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCatalogLib.getDependencyGraph.mockReturnValue({
      component: mockComponent,
      dependencies: [],
      dependents: [],
      indirectDependencies: [],
      indirectDependents: [],
    });
  });

  it('renders component details correctly', async () => {
    mockCatalogLib.getComponentByName.mockReturnValue(mockComponent);

    const params = Promise.resolve({ componentName: 'test-service' });
    const page = await ComponentDetailPage({ params });
    
    render(page);

    expect(screen.getByText('test-service')).toBeInTheDocument();
    expect(screen.getByText('A test service for unit testing')).toBeInTheDocument();
  });

  it('displays all metadata fields', async () => {
    mockCatalogLib.getComponentByName.mockReturnValue(mockComponent);

    const params = Promise.resolve({ componentName: 'test-service' });
    const page = await ComponentDetailPage({ params });
    
    render(page);

    expect(screen.getByText('Type')).toBeInTheDocument();
    expect(screen.getByText('service')).toBeInTheDocument();
    
    expect(screen.getAllByText('Lifecycle').length).toBeGreaterThan(0);
    expect(screen.getByText('production')).toBeInTheDocument();
    
    expect(screen.getByText('Owner')).toBeInTheDocument();
    expect(screen.getByText('team-test')).toBeInTheDocument();
    
    expect(screen.getByText('System')).toBeInTheDocument();
    expect(screen.getByText('test-system')).toBeInTheDocument();
  });

  it('displays tags', async () => {
    mockCatalogLib.getComponentByName.mockReturnValue(mockComponent);

    const params = Promise.resolve({ componentName: 'test-service' });
    const page = await ComponentDetailPage({ params });
    
    render(page);

    expect(screen.getByText('Tags')).toBeInTheDocument();
    expect(screen.getByText('typescript')).toBeInTheDocument();
    expect(screen.getByText('testing')).toBeInTheDocument();
    expect(screen.getByText('backend')).toBeInTheDocument();
  });

  it('displays links', async () => {
    mockCatalogLib.getComponentByName.mockReturnValue(mockComponent);

    const params = Promise.resolve({ componentName: 'test-service' });
    const page = await ComponentDetailPage({ params });
    
    render(page);

    expect(screen.getByText('Links')).toBeInTheDocument();
    
    const repoLink = screen.getByRole('link', { name: /Repository/i });
    expect(repoLink).toHaveAttribute('href', 'https://github.com/example/test');
    expect(repoLink).toHaveAttribute('target', '_blank');
    
    const docsLink = screen.getByRole('link', { name: /Documentation/i });
    expect(docsLink).toHaveAttribute('href', 'https://docs.example.com/test');
  });

  it('displays back to catalog link', async () => {
    mockCatalogLib.getComponentByName.mockReturnValue(mockComponent);

    const params = Promise.resolve({ componentName: 'test-service' });
    const page = await ComponentDetailPage({ params });
    
    render(page);

    const backLink = screen.getByRole('link', { name: /Back to Catalog/i });
    expect(backLink).toHaveAttribute('href', '/plugins/catalog');
  });

  it('handles component without optional fields', async () => {
    mockCatalogLib.getComponentByName.mockReturnValue(mockMinimalComponent);

    const params = Promise.resolve({ componentName: 'minimal-component' });
    const page = await ComponentDetailPage({ params });
    
    render(page);

    expect(screen.getByText('minimal-component')).toBeInTheDocument();
    expect(screen.getByText('No description provided')).toBeInTheDocument();
    
    expect(screen.queryByText('System')).not.toBeInTheDocument();
    expect(screen.queryByText('Tags')).not.toBeInTheDocument();
    expect(screen.queryByText('Links')).not.toBeInTheDocument();
  });

  it('calls notFound when component does not exist', async () => {
    mockCatalogLib.getComponentByName.mockReturnValue(null);
    (notFound as jest.Mock).mockImplementation(() => {
      throw new Error('NEXT_NOT_FOUND');
    });

    const params = Promise.resolve({ componentName: 'nonexistent' });
    
    await expect(ComponentDetailPage({ params })).rejects.toThrow('NEXT_NOT_FOUND');
    expect(notFound).toHaveBeenCalled();
  });

  it('fetches the correct component by name', async () => {
    mockCatalogLib.getComponentByName.mockReturnValue(mockComponent);

    const params = Promise.resolve({ componentName: 'test-service' });
    
    await ComponentDetailPage({ params });

    expect(mockCatalogLib.getComponentByName).toHaveBeenCalledWith('test-service');
  });
});

