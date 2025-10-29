import { render, screen } from '@testing-library/react';
import { DependencyGraph } from '../DependencyGraph';
import { Component } from '@/plugins/catalog/types';

// Mock ReactFlow
jest.mock('reactflow', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <div data-testid="reactflow">{children}</div>,
  Background: () => <div data-testid="background" />,
  Controls: () => <div data-testid="controls" />,
  MiniMap: () => <div data-testid="minimap" />,
  useNodesState: (nodes: unknown[]) => [nodes, jest.fn(), jest.fn()],
  useEdgesState: (edges: unknown[]) => [edges, jest.fn(), jest.fn()],
  MarkerType: { ArrowClosed: 'arrowclosed' },
  Position: { Left: 'left', Right: 'right' },
}));

const mockComponent: Component = {
  apiVersion: 'backstage.io/v1alpha1',
  kind: 'Component',
  metadata: {
    name: 'test-component',
    description: 'Test component',
    tags: ['test'],
  },
  spec: {
    type: 'service',
    lifecycle: 'production',
    owner: 'team-test',
    system: 'test-system',
  },
};

const mockDependency: Component = {
  apiVersion: 'backstage.io/v1alpha1',
  kind: 'Component',
  metadata: {
    name: 'dependency',
    description: 'Dependency component',
  },
  spec: {
    type: 'library',
    lifecycle: 'production',
    owner: 'team-lib',
  },
};

const mockDependent: Component = {
  apiVersion: 'backstage.io/v1alpha1',
  kind: 'Component',
  metadata: {
    name: 'dependent',
    description: 'Dependent component',
  },
  spec: {
    type: 'website',
    lifecycle: 'experimental',
    owner: 'team-web',
  },
};

describe('DependencyGraph', () => {
  it('should render ReactFlow components', () => {
    render(
      <DependencyGraph
        component={mockComponent}
        dependencies={[]}
        dependents={[]}
      />
    );

    expect(screen.getByTestId('reactflow')).toBeInTheDocument();
    expect(screen.getByTestId('background')).toBeInTheDocument();
    expect(screen.getByTestId('controls')).toBeInTheDocument();
    expect(screen.getByTestId('minimap')).toBeInTheDocument();
  });

  it('should render legend', () => {
    render(
      <DependencyGraph
        component={mockComponent}
        dependencies={[]}
        dependents={[]}
      />
    );

    expect(screen.getByText('Legend')).toBeInTheDocument();
    expect(screen.getByText('Dependencies (left)')).toBeInTheDocument();
    expect(screen.getByText('Dependents (right)')).toBeInTheDocument();
    expect(screen.getByText('Indirect')).toBeInTheDocument();
  });

  it('should render with dependencies and dependents', () => {
    const { container } = render(
      <DependencyGraph
        component={mockComponent}
        dependencies={[mockDependency]}
        dependents={[mockDependent]}
      />
    );

    expect(container).toBeInTheDocument();
    expect(screen.getByTestId('reactflow')).toBeInTheDocument();
  });

  it('should render with indirect dependencies', () => {
    const indirectDep: Component = {
      ...mockDependency,
      metadata: { ...mockDependency.metadata, name: 'indirect-dep' },
    };

    const { container } = render(
      <DependencyGraph
        component={mockComponent}
        dependencies={[mockDependency]}
        dependents={[]}
        indirectDependencies={[indirectDep]}
      />
    );

    expect(container).toBeInTheDocument();
  });

  it('should render empty state when no dependencies', () => {
    render(
      <DependencyGraph
        component={mockComponent}
        dependencies={[]}
        dependents={[]}
      />
    );

    expect(screen.getByTestId('reactflow')).toBeInTheDocument();
  });
});

