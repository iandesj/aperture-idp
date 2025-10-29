'use client';

import { useCallback, useMemo } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  MarkerType,
  Position,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Component } from '@/plugins/catalog/types';
import Link from 'next/link';

interface DependencyGraphProps {
  component: Component;
  dependencies: Component[];
  dependents: Component[];
  indirectDependencies?: Component[];
  indirectDependents?: Component[];
}

const lifecycleColors: Record<string, string> = {
  production: '#10b981',
  experimental: '#f59e0b',
  deprecated: '#ef4444',
};

const typeColors: Record<string, { bg: string; border: string }> = {
  service: { bg: '#dbeafe', border: '#3b82f6' },
  library: { bg: '#e9d5ff', border: '#a855f7' },
  website: { bg: '#e0e7ff', border: '#6366f1' },
};

function ComponentNode({ data }: { data: Component & { isCenter?: boolean } }) {
  const typeColor = typeColors[data.spec.type] || { bg: '#f3f4f6', border: '#9ca3af' };
  const lifecycleColor = lifecycleColors[data.spec.lifecycle] || '#6b7280';

  return (
    <Link
      href={`/catalog/${data.metadata.name}`}
      className="block"
      style={{ pointerEvents: 'auto' }}
    >
      <div
        style={{
          backgroundColor: typeColor.bg,
          borderColor: typeColor.border,
          borderWidth: data.isCenter ? '3px' : '2px',
        }}
        className="rounded-lg p-3 shadow-md hover:shadow-lg transition-shadow min-w-[200px]"
      >
        <div className="text-sm font-semibold text-gray-900 mb-1 truncate">
          {data.metadata.name}
        </div>
        <div className="flex gap-1 mb-1">
          <span
            style={{
              backgroundColor: typeColor.bg,
              borderColor: typeColor.border,
            }}
            className="text-xs px-2 py-0.5 rounded border font-medium text-gray-700"
          >
            {data.spec.type}
          </span>
          <span
            style={{ backgroundColor: lifecycleColor }}
            className="text-xs px-2 py-0.5 rounded text-white font-medium"
          >
            {data.spec.lifecycle}
          </span>
        </div>
        {data.spec.system && (
          <div className="text-xs text-gray-600 truncate">
            {data.spec.system}
          </div>
        )}
      </div>
    </Link>
  );
}

const nodeTypes = {
  component: ComponentNode,
};

export function DependencyGraph({
  component,
  dependencies,
  dependents,
  indirectDependencies = [],
  indirectDependents = [],
}: DependencyGraphProps) {
  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];

    // Track node IDs to avoid duplicates
    const nodeIds = new Set<string>();
    
    // Center node (current component)
    nodes.push({
      id: component.metadata.name,
      type: 'component',
      position: { x: 400, y: 300 },
      data: { ...component, isCenter: true },
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
    });
    nodeIds.add(component.metadata.name);

    // Direct dependencies (left side)
    dependencies.forEach((dep, index) => {
      if (!nodeIds.has(dep.metadata.name)) {
        const y = 150 + index * 120;
        nodes.push({
          id: dep.metadata.name,
          type: 'component',
          position: { x: 50, y },
          data: dep,
          sourcePosition: Position.Right,
          targetPosition: Position.Left,
        });
        nodeIds.add(dep.metadata.name);
      }

      edges.push({
        id: `${dep.metadata.name}-${component.metadata.name}`,
        source: dep.metadata.name,
        target: component.metadata.name,
        type: 'smoothstep',
        animated: false,
        style: { stroke: '#3b82f6', strokeWidth: 2 },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: '#3b82f6',
        },
      });
    });

    // Indirect dependencies (far left)
    indirectDependencies.forEach((dep, index) => {
      if (!nodeIds.has(dep.metadata.name)) {
        const y = 100 + index * 100;
        nodes.push({
          id: dep.metadata.name,
          type: 'component',
          position: { x: -300, y },
          data: dep,
          sourcePosition: Position.Right,
          targetPosition: Position.Left,
        });
        nodeIds.add(dep.metadata.name);
      }

      // Find which direct dependency this connects to
      const directDep = dependencies.find((d) =>
        d.spec.dependsOn?.includes(dep.metadata.name)
      );
      if (directDep && nodeIds.has(directDep.metadata.name)) {
        edges.push({
          id: `${dep.metadata.name}-${directDep.metadata.name}`,
          source: dep.metadata.name,
          target: directDep.metadata.name,
          type: 'smoothstep',
          animated: false,
          style: { stroke: '#9ca3af', strokeWidth: 1, strokeDasharray: '5,5' },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: '#9ca3af',
          },
        });
      }
    });

    // Direct dependents (right side)
    dependents.forEach((dep, index) => {
      if (!nodeIds.has(dep.metadata.name)) {
        const y = 150 + index * 120;
        nodes.push({
          id: dep.metadata.name,
          type: 'component',
          position: { x: 750, y },
          data: dep,
          sourcePosition: Position.Right,
          targetPosition: Position.Left,
        });
        nodeIds.add(dep.metadata.name);
      }

      edges.push({
        id: `${component.metadata.name}-${dep.metadata.name}`,
        source: component.metadata.name,
        target: dep.metadata.name,
        type: 'smoothstep',
        animated: false,
        style: { stroke: '#10b981', strokeWidth: 2 },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: '#10b981',
        },
      });
    });

    // Indirect dependents (far right)
    indirectDependents.forEach((dep, index) => {
      if (!nodeIds.has(dep.metadata.name)) {
        const y = 100 + index * 100;
        nodes.push({
          id: dep.metadata.name,
          type: 'component',
          position: { x: 1100, y },
          data: dep,
          sourcePosition: Position.Right,
          targetPosition: Position.Left,
        });
        nodeIds.add(dep.metadata.name);
      }

      // Find which direct dependent this connects from
      const directDep = dependents.find((d) =>
        dep.spec.dependsOn?.includes(d.metadata.name)
      );
      if (directDep && nodeIds.has(directDep.metadata.name)) {
        edges.push({
          id: `${directDep.metadata.name}-${dep.metadata.name}`,
          source: directDep.metadata.name,
          target: dep.metadata.name,
          type: 'smoothstep',
          animated: false,
          style: { stroke: '#9ca3af', strokeWidth: 1, strokeDasharray: '5,5' },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: '#9ca3af',
          },
        });
      }
    });

    return { nodes, edges };
  }, [component, dependencies, dependents, indirectDependencies, indirectDependents]);

  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);

  return (
    <div className="w-full h-[600px] bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.5}
        maxZoom={1.5}
        defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
      >
        <Background />
        <Controls />
        <MiniMap nodeColor={(node) => {
          const data = node.data as Component & { isCenter?: boolean };
          if (data.isCenter) return '#3b82f6';
          const typeColor = typeColors[data.spec.type];
          return typeColor?.border || '#9ca3af';
        }} />
      </ReactFlow>
      
      <div className="absolute bottom-4 left-4 bg-white dark:bg-gray-800 rounded-lg shadow p-3 text-xs space-y-1 border border-gray-200 dark:border-gray-700">
        <div className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Legend</div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-0.5 bg-blue-500"></div>
          <span className="text-gray-700 dark:text-gray-300">Dependencies (left)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-0.5 bg-green-500"></div>
          <span className="text-gray-700 dark:text-gray-300">Dependents (right)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-0.5 bg-gray-400" style={{ borderTop: '1px dashed' }}></div>
          <span className="text-gray-700 dark:text-gray-300">Indirect</span>
        </div>
      </div>
    </div>
  );
}

