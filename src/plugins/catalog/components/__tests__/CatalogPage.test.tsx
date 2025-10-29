import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CatalogPage } from '../CatalogPage';

const mockComponents = [
  {
    apiVersion: 'backstage.io/v1alpha1' as const,
    kind: 'Component' as const,
    metadata: {
      name: 'api-service',
      description: 'Backend API service',
      tags: ['typescript', 'backend', 'api'],
      links: [{ url: 'https://github.com/example/api', title: 'Repository' }],
    },
    spec: {
      type: 'service',
      lifecycle: 'production',
      owner: 'team-backend',
    },
  },
  {
    apiVersion: 'backstage.io/v1alpha1' as const,
    kind: 'Component' as const,
    metadata: {
      name: 'frontend-app',
      description: 'React frontend application',
      tags: ['react', 'frontend'],
    },
    spec: {
      type: 'website',
      lifecycle: 'production',
      owner: 'team-frontend',
    },
  },
  {
    apiVersion: 'backstage.io/v1alpha1' as const,
    kind: 'Component' as const,
    metadata: {
      name: 'utils-library',
      description: 'Shared utility library',
      tags: ['typescript', 'library'],
    },
    spec: {
      type: 'library',
      lifecycle: 'experimental',
      owner: 'team-platform',
    },
  },
  {
    apiVersion: 'backstage.io/v1alpha1' as const,
    kind: 'Component' as const,
    metadata: {
      name: 'old-service',
      description: 'Legacy service being phased out',
    },
    spec: {
      type: 'service',
      lifecycle: 'deprecated',
      owner: 'team-backend',
    },
  },
];

describe('CatalogPage', () => {
  describe('Basic Rendering', () => {
    it('renders without crashing', () => {
      render(<CatalogPage components={mockComponents} />);
      expect(screen.getByText('Software Catalog')).toBeInTheDocument();
    });

    it('displays all components initially', () => {
      render(<CatalogPage components={mockComponents} />);
      
      expect(screen.getByText('api-service')).toBeInTheDocument();
      expect(screen.getByText('frontend-app')).toBeInTheDocument();
      expect(screen.getByText('utils-library')).toBeInTheDocument();
      expect(screen.getByText('old-service')).toBeInTheDocument();
    });

    it('shows component count', () => {
      render(<CatalogPage components={mockComponents} />);
      expect(screen.getByText('4 components')).toBeInTheDocument();
    });

    it('displays component metadata', () => {
      render(<CatalogPage components={mockComponents} />);
      
      expect(screen.getByText('Backend API service')).toBeInTheDocument();
      expect(screen.getAllByText(/Owner: team-backend/).length).toBeGreaterThan(0);
      expect(screen.getAllByText('typescript').length).toBeGreaterThan(0);
    });

    it('displays component links', () => {
      render(<CatalogPage components={mockComponents} />);
      
      const link = screen.getByRole('link', { name: 'Repository' });
      expect(link).toHaveAttribute('href', 'https://github.com/example/api');
      expect(link).toHaveAttribute('target', '_blank');
    });
  });

  describe('Search Functionality', () => {
    it('filters components by name', async () => {
      const user = userEvent.setup();
      render(<CatalogPage components={mockComponents} />);
      
      const searchInput = screen.getByPlaceholderText(/search by name/i);
      await user.type(searchInput, 'api');
      
      expect(screen.getByText('api-service')).toBeInTheDocument();
      expect(screen.queryByText('frontend-app')).not.toBeInTheDocument();
      expect(screen.queryByText('utils-library')).not.toBeInTheDocument();
    });

    it('filters components by description', async () => {
      const user = userEvent.setup();
      render(<CatalogPage components={mockComponents} />);
      
      const searchInput = screen.getByPlaceholderText(/search by name/i);
      await user.type(searchInput, 'react');
      
      expect(screen.getByText('frontend-app')).toBeInTheDocument();
      expect(screen.queryByText('api-service')).not.toBeInTheDocument();
    });

    it('filters components by tags', async () => {
      const user = userEvent.setup();
      render(<CatalogPage components={mockComponents} />);
      
      const searchInput = screen.getByPlaceholderText(/search by name/i);
      await user.type(searchInput, 'backend');
      
      expect(screen.getByText('api-service')).toBeInTheDocument();
      expect(screen.queryByText('frontend-app')).not.toBeInTheDocument();
    });

    it('search is case-insensitive', async () => {
      const user = userEvent.setup();
      render(<CatalogPage components={mockComponents} />);
      
      const searchInput = screen.getByPlaceholderText(/search by name/i);
      await user.type(searchInput, 'BACKEND');
      
      expect(screen.getByText('api-service')).toBeInTheDocument();
    });

    it('shows no results message when search has no matches', async () => {
      const user = userEvent.setup();
      render(<CatalogPage components={mockComponents} />);
      
      const searchInput = screen.getByPlaceholderText(/search by name/i);
      await user.type(searchInput, 'nonexistent');
      
      expect(screen.getByText(/no components match your filters/i)).toBeInTheDocument();
    });
  });

  describe('Type Filtering', () => {
    it('filters by service type', () => {
      render(<CatalogPage components={mockComponents} />);
      
      const serviceButton = screen.getByRole('button', { name: 'service' });
      fireEvent.click(serviceButton);
      
      expect(screen.getByText('api-service')).toBeInTheDocument();
      expect(screen.getByText('old-service')).toBeInTheDocument();
      expect(screen.queryByText('frontend-app')).not.toBeInTheDocument();
      expect(screen.queryByText('utils-library')).not.toBeInTheDocument();
    });

    it('filters by library type', () => {
      render(<CatalogPage components={mockComponents} />);
      
      const libraryButton = screen.getByRole('button', { name: 'library' });
      fireEvent.click(libraryButton);
      
      expect(screen.getByText('utils-library')).toBeInTheDocument();
      expect(screen.queryByText('api-service')).not.toBeInTheDocument();
    });

    it('supports multiple type selections', () => {
      render(<CatalogPage components={mockComponents} />);
      
      const serviceButton = screen.getByRole('button', { name: 'service' });
      const libraryButton = screen.getByRole('button', { name: 'library' });
      
      fireEvent.click(serviceButton);
      fireEvent.click(libraryButton);
      
      expect(screen.getByText('api-service')).toBeInTheDocument();
      expect(screen.getByText('old-service')).toBeInTheDocument();
      expect(screen.getByText('utils-library')).toBeInTheDocument();
      expect(screen.queryByText('frontend-app')).not.toBeInTheDocument();
    });

    it('toggles type filter off when clicked again', () => {
      render(<CatalogPage components={mockComponents} />);
      
      const serviceButton = screen.getByRole('button', { name: 'service' });
      
      fireEvent.click(serviceButton);
      expect(screen.queryByText('frontend-app')).not.toBeInTheDocument();
      
      fireEvent.click(serviceButton);
      expect(screen.getByText('frontend-app')).toBeInTheDocument();
    });
  });

  describe('Lifecycle Filtering', () => {
    it('filters by production lifecycle', () => {
      render(<CatalogPage components={mockComponents} />);
      
      const productionButton = screen.getByRole('button', { name: 'production' });
      fireEvent.click(productionButton);
      
      expect(screen.getByText('api-service')).toBeInTheDocument();
      expect(screen.getByText('frontend-app')).toBeInTheDocument();
      expect(screen.queryByText('utils-library')).not.toBeInTheDocument();
      expect(screen.queryByText('old-service')).not.toBeInTheDocument();
    });

    it('filters by experimental lifecycle', () => {
      render(<CatalogPage components={mockComponents} />);
      
      const experimentalButton = screen.getByRole('button', { name: 'experimental' });
      fireEvent.click(experimentalButton);
      
      expect(screen.getByText('utils-library')).toBeInTheDocument();
      expect(screen.queryByText('api-service')).not.toBeInTheDocument();
    });

    it('supports multiple lifecycle selections', () => {
      render(<CatalogPage components={mockComponents} />);
      
      const productionButton = screen.getByRole('button', { name: 'production' });
      const deprecatedButton = screen.getByRole('button', { name: 'deprecated' });
      
      fireEvent.click(productionButton);
      fireEvent.click(deprecatedButton);
      
      expect(screen.getByText('api-service')).toBeInTheDocument();
      expect(screen.getByText('frontend-app')).toBeInTheDocument();
      expect(screen.getByText('old-service')).toBeInTheDocument();
      expect(screen.queryByText('utils-library')).not.toBeInTheDocument();
    });
  });

  describe('Combined Filtering', () => {
    it('combines search and type filter', async () => {
      const user = userEvent.setup();
      render(<CatalogPage components={mockComponents} />);
      
      const searchInput = screen.getByPlaceholderText(/search by name/i);
      await user.type(searchInput, 'service');
      
      const libraryButton = screen.getByRole('button', { name: 'library' });
      fireEvent.click(libraryButton);
      
      expect(screen.getByText(/no components match your filters/i)).toBeInTheDocument();
    });

    it('combines type and lifecycle filters', () => {
      render(<CatalogPage components={mockComponents} />);
      
      const serviceButton = screen.getByRole('button', { name: 'service' });
      const productionButton = screen.getByRole('button', { name: 'production' });
      
      fireEvent.click(serviceButton);
      fireEvent.click(productionButton);
      
      expect(screen.getByText('api-service')).toBeInTheDocument();
      expect(screen.queryByText('old-service')).not.toBeInTheDocument();
      expect(screen.queryByText('frontend-app')).not.toBeInTheDocument();
    });
  });

  describe('Clear Filters', () => {
    it('shows clear filters button when filters are active', async () => {
      const user = userEvent.setup();
      render(<CatalogPage components={mockComponents} />);
      
      expect(screen.queryByText(/clear filters/i)).not.toBeInTheDocument();
      
      const searchInput = screen.getByPlaceholderText(/search by name/i);
      await user.type(searchInput, 'api');
      
      expect(screen.getByText(/clear filters/i)).toBeInTheDocument();
    });

    it('clears all filters when clicked', async () => {
      const user = userEvent.setup();
      render(<CatalogPage components={mockComponents} />);
      
      const searchInput = screen.getByPlaceholderText(/search by name/i);
      await user.type(searchInput, 'api');
      
      const serviceButton = screen.getByRole('button', { name: 'service' });
      fireEvent.click(serviceButton);
      
      expect(screen.queryByText('frontend-app')).not.toBeInTheDocument();
      
      const clearButton = screen.getByText(/clear filters/i);
      fireEvent.click(clearButton);
      
      expect(screen.getByText('frontend-app')).toBeInTheDocument();
      expect(searchInput).toHaveValue('');
    });

    it('updates result count correctly', async () => {
      const user = userEvent.setup();
      render(<CatalogPage components={mockComponents} />);
      
      expect(screen.getByText('4 components')).toBeInTheDocument();
      
      const searchInput = screen.getByPlaceholderText(/search by name/i);
      await user.type(searchInput, 'service');
      
      expect(screen.getByText(/2 components found/i)).toBeInTheDocument();
    });
  });

  describe('Empty States', () => {
    it('shows empty catalog message when no components exist', () => {
      render(<CatalogPage components={[]} />);
      
      expect(screen.getByText(/no components in the catalog yet/i)).toBeInTheDocument();
      expect(screen.queryByPlaceholderText(/search by name/i)).toBeInTheDocument();
    });

    it('shows no results message when filters match nothing', async () => {
      const user = userEvent.setup();
      render(<CatalogPage components={mockComponents} />);
      
      const searchInput = screen.getByPlaceholderText(/search by name/i);
      await user.type(searchInput, 'zzzzzzz');
      
      expect(screen.getByText(/no components match your filters/i)).toBeInTheDocument();
      expect(screen.getByText(/try adjusting your search/i)).toBeInTheDocument();
    });
  });

  describe('UI Elements', () => {
    it('displays filter labels', () => {
      render(<CatalogPage components={mockComponents} />);
      
      expect(screen.getByText('Type')).toBeInTheDocument();
      expect(screen.getByText('Lifecycle')).toBeInTheDocument();
    });

    it('renders all available type filters', () => {
      render(<CatalogPage components={mockComponents} />);
      
      expect(screen.getByRole('button', { name: 'service' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'library' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'website' })).toBeInTheDocument();
    });

    it('renders all available lifecycle filters', () => {
      render(<CatalogPage components={mockComponents} />);
      
      expect(screen.getByRole('button', { name: 'production' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'experimental' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'deprecated' })).toBeInTheDocument();
    });
  });
});

