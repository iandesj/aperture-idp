import { render, screen } from '@testing-library/react';
import Home from '../page';
import * as catalogLib from '@/lib/catalog';

jest.mock('@/lib/catalog');

const mockCatalogLib = catalogLib as jest.Mocked<typeof catalogLib>;

describe('Home Dashboard', () => {
  beforeEach(() => {
    mockCatalogLib.getCatalogStats.mockReturnValue({
      total: 5,
      byType: {
        service: 3,
        library: 2,
      },
      byLifecycle: {
        production: 3,
        experimental: 2,
      },
    });

    mockCatalogLib.getScorecardStats.mockReturnValue({
      averageScore: 75,
      tierDistribution: {
        gold: 2,
        silver: 2,
        bronze: 1,
        'needs-improvement': 0,
      },
      topPerformers: [
        {
          component: {
            apiVersion: 'backstage.io/v1alpha1',
            kind: 'Component',
            metadata: { name: 'top-component' },
            spec: { type: 'service', lifecycle: 'production', owner: 'team-a' },
          },
          score: {
            total: 95,
            tier: 'gold' as const,
            breakdown: { metadata: 40, architecture: 30, lifecycle: 25 },
            details: {
              hasDescription: true,
              hasThreePlusTags: true,
              hasDocumentationLink: true,
              hasOwner: true,
              isPartOfSystem: true,
              hasDependencies: true,
              lifecycle: 'production',
            },
          },
        },
      ],
      needsAttention: [
        {
          component: {
            apiVersion: 'backstage.io/v1alpha1',
            kind: 'Component',
            metadata: { name: 'needs-work' },
            spec: { type: 'service', lifecycle: 'deprecated', owner: 'team-b' },
          },
          score: {
            total: 30,
            tier: 'needs-improvement' as const,
            breakdown: { metadata: 10, architecture: 20, lifecycle: 0 },
            details: {
              hasDescription: false,
              hasThreePlusTags: false,
              hasDocumentationLink: false,
              hasOwner: true,
              isPartOfSystem: false,
              hasDependencies: false,
              lifecycle: 'deprecated',
            },
          },
        },
      ],
    });

    mockCatalogLib.getRecentComponents.mockReturnValue([
      {
        apiVersion: 'backstage.io/v1alpha1',
        kind: 'Component',
        metadata: {
          name: 'test-component',
          description: 'Test component description',
          tags: ['typescript', 'backend'],
        },
        spec: {
          type: 'service',
          lifecycle: 'production',
          owner: 'team-a',
        },
      },
      {
        apiVersion: 'backstage.io/v1alpha1',
        kind: 'Component',
        metadata: {
          name: 'another-component',
          description: 'Another component',
          tags: ['react'],
        },
        spec: {
          type: 'library',
          lifecycle: 'experimental',
          owner: 'team-b',
        },
      },
    ]);
  });

  it('renders without crashing', () => {
    render(<Home />);
    expect(screen.getByText('Welcome to Aperture IDP')).toBeInTheDocument();
  });

  it('displays catalog statistics', () => {
    render(<Home />);
    
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('Total Components')).toBeInTheDocument();
    expect(screen.getByText('By Type')).toBeInTheDocument();
    expect(screen.getByText('By Lifecycle')).toBeInTheDocument();
  });

  it('displays component cards', () => {
    render(<Home />);
    
    expect(screen.getByText('test-component')).toBeInTheDocument();
    expect(screen.getByText('Test component description')).toBeInTheDocument();
    expect(screen.getByText('another-component')).toBeInTheDocument();
    expect(screen.getByText('Another component')).toBeInTheDocument();
  });

  it('displays component badges', () => {
    render(<Home />);
    
    expect(screen.getAllByText('service').length).toBeGreaterThan(0);
    expect(screen.getAllByText('production').length).toBeGreaterThan(0);
    expect(screen.getAllByText('library').length).toBeGreaterThan(0);
    expect(screen.getAllByText('experimental').length).toBeGreaterThan(0);
  });

  it('displays component tags', () => {
    render(<Home />);
    
    expect(screen.getByText('typescript')).toBeInTheDocument();
    expect(screen.getByText('backend')).toBeInTheDocument();
    expect(screen.getByText('react')).toBeInTheDocument();
  });

  it('displays link to view all components', () => {
    render(<Home />);
    
    const link = screen.getByRole('link', { name: /view all/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/plugins/catalog');
  });

  it('calls catalog functions on render', () => {
    render(<Home />);
    
    expect(mockCatalogLib.getCatalogStats).toHaveBeenCalled();
    expect(mockCatalogLib.getRecentComponents).toHaveBeenCalledWith(6);
  });
});

