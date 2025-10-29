import { render, screen } from '@testing-library/react';
import { CatalogPage } from '../CatalogPage';
import * as catalogLib from '@/lib/catalog';

jest.mock('@/lib/catalog');

const mockCatalogLib = catalogLib as jest.Mocked<typeof catalogLib>;

describe('CatalogPage', () => {
  beforeEach(() => {
    mockCatalogLib.getAllComponents.mockReturnValue([
      {
        apiVersion: 'backstage.io/v1alpha1',
        kind: 'Component',
        metadata: {
          name: 'component-1',
          description: 'First component',
          tags: ['typescript'],
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
          name: 'component-2',
          description: 'Second component',
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
    render(<CatalogPage />);
    expect(screen.getByText('Software Catalog')).toBeInTheDocument();
  });

  it('displays all components', () => {
    render(<CatalogPage />);
    
    expect(screen.getByText('component-1')).toBeInTheDocument();
    expect(screen.getByText('First component')).toBeInTheDocument();
    expect(screen.getByText('component-2')).toBeInTheDocument();
    expect(screen.getByText('Second component')).toBeInTheDocument();
  });

  it('calls getAllComponents on render', () => {
    render(<CatalogPage />);
    
    expect(mockCatalogLib.getAllComponents).toHaveBeenCalled();
  });

  it('handles empty catalog', () => {
    mockCatalogLib.getAllComponents.mockReturnValue([]);
    
    render(<CatalogPage />);
    
    expect(screen.getByText('Software Catalog')).toBeInTheDocument();
  });
});

