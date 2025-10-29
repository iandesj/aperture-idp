import { render, screen } from '@testing-library/react';
import SystemsPage from '../page';
import * as catalogLib from '@/lib/catalog';

jest.mock('@/lib/catalog');

const mockCatalogLib = catalogLib as jest.Mocked<typeof catalogLib>;

describe('SystemsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render systems overview with system cards', () => {
    mockCatalogLib.getAllSystems.mockReturnValue(['system-a', 'system-b']);
    mockCatalogLib.getSystemStats.mockReturnValue({
      'system-a': {
        count: 3,
        types: { service: 2, library: 1 },
      },
      'system-b': {
        count: 2,
        types: { website: 2 },
      },
    });

    render(<SystemsPage />);

    expect(screen.getByText('Systems')).toBeInTheDocument();
    expect(screen.getByText('View your software architecture organized by system')).toBeInTheDocument();
    expect(screen.getByText('system-a')).toBeInTheDocument();
    expect(screen.getByText('system-b')).toBeInTheDocument();
    expect(screen.getByText('3 components')).toBeInTheDocument();
    expect(screen.getByText('2 components')).toBeInTheDocument();
  });

  it('should display component types in system cards', () => {
    mockCatalogLib.getAllSystems.mockReturnValue(['test-system']);
    mockCatalogLib.getSystemStats.mockReturnValue({
      'test-system': {
        count: 3,
        types: { service: 2, library: 1 },
      },
    });

    render(<SystemsPage />);

    expect(screen.getByText('2 service')).toBeInTheDocument();
    expect(screen.getByText('1 library')).toBeInTheDocument();
  });

  it('should display uncategorized system if it exists', () => {
    mockCatalogLib.getAllSystems.mockReturnValue(['system-a']);
    mockCatalogLib.getSystemStats.mockReturnValue({
      'system-a': {
        count: 2,
        types: { service: 2 },
      },
      'uncategorized': {
        count: 1,
        types: { service: 1 },
      },
    });

    render(<SystemsPage />);

    expect(screen.getByText('Uncategorized')).toBeInTheDocument();
    expect(screen.getByText('1 component')).toBeInTheDocument();
  });

  it('should render empty state when no systems exist', () => {
    mockCatalogLib.getAllSystems.mockReturnValue([]);
    mockCatalogLib.getSystemStats.mockReturnValue({});

    render(<SystemsPage />);

    expect(screen.getByText('No systems found in the catalog.')).toBeInTheDocument();
    expect(screen.getByText('Add a system field to your component YAML files to organize them.')).toBeInTheDocument();
  });

  it('should have correct links to system detail pages', () => {
    mockCatalogLib.getAllSystems.mockReturnValue(['my-system']);
    mockCatalogLib.getSystemStats.mockReturnValue({
      'my-system': {
        count: 1,
        types: { service: 1 },
      },
    });

    render(<SystemsPage />);

    const links = screen.getAllByRole('link');
    const systemLink = links.find((link) => link.getAttribute('href') === '/systems/my-system');
    expect(systemLink).toBeInTheDocument();
  });

  it('should use singular form for single component', () => {
    mockCatalogLib.getAllSystems.mockReturnValue(['single-system']);
    mockCatalogLib.getSystemStats.mockReturnValue({
      'single-system': {
        count: 1,
        types: { service: 1 },
      },
    });

    render(<SystemsPage />);

    expect(screen.getByText('1 component')).toBeInTheDocument();
  });
});

