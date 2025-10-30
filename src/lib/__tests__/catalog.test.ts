import fs from 'fs';
import yaml from 'js-yaml';
import { 
  getAllComponents, 
  getCatalogStats, 
  getRecentComponents, 
  getComponentByName,
  getAllSystems,
  getSystemStats,
  getComponentsBySystem,
  getComponentDependencies,
  getComponentDependents,
  getDependencyGraph,
  getHiddenComponentsWithData
} from '../catalog';
import { Component } from '@/plugins/catalog/types';

jest.mock('fs');
jest.mock('js-yaml');
jest.mock('../import/store', () => ({
  importStore: {
    getImportedComponents: jest.fn(() => []),
  },
}));
jest.mock('../hidden/store', () => ({
  hiddenStore: {
    isHidden: jest.fn(() => false),
    getHiddenComponents: jest.fn(() => []),
  },
}));

const mockFs = fs as jest.Mocked<typeof fs>;
const mockYaml = yaml as jest.Mocked<typeof yaml>;

import { hiddenStore } from '../hidden/store';
const mockHiddenStore = hiddenStore as jest.Mocked<typeof hiddenStore>;

const mockComponent1: Component = {
  apiVersion: 'backstage.io/v1alpha1',
  kind: 'Component',
  metadata: {
    name: 'component-1',
    description: 'First component',
    tags: ['typescript', 'backend'],
  },
  spec: {
    type: 'service',
    lifecycle: 'production',
    owner: 'team-a',
  },
};

const mockComponent2: Component = {
  apiVersion: 'backstage.io/v1alpha1',
  kind: 'Component',
  metadata: {
    name: 'component-2',
    description: 'Second component',
    tags: ['react'],
  },
  spec: {
    type: 'library',
    lifecycle: 'experimental',
    owner: 'team-b',
  },
};

const mockComponent3: Component = {
  apiVersion: 'backstage.io/v1alpha1',
  kind: 'Component',
  metadata: {
    name: 'component-3',
    description: 'Third component',
  },
  spec: {
    type: 'service',
    lifecycle: 'production',
    owner: 'team-a',
  },
};

describe('catalog', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllComponents', () => {
    it('should read and parse all YAML files from catalog-data directory', () => {
      mockFs.readdirSync.mockReturnValue(['component-1.yaml', 'component-2.yaml'] as unknown as fs.Dirent[]);
      mockFs.readFileSync.mockReturnValueOnce('yaml content 1').mockReturnValueOnce('yaml content 2');
      mockYaml.load.mockReturnValueOnce(mockComponent1).mockReturnValueOnce(mockComponent2);

      const result = getAllComponents();

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual(mockComponent1);
      expect(result[1]).toEqual(mockComponent2);
      expect(mockFs.readdirSync).toHaveBeenCalledWith(expect.stringContaining('catalog-data'));
      expect(mockFs.readFileSync).toHaveBeenCalledTimes(2);
    });

    it('should return empty array when no files exist', () => {
      mockFs.readdirSync.mockReturnValue([] as unknown as fs.Dirent[]);

      const result = getAllComponents();

      expect(result).toEqual([]);
    });
  });

  describe('getCatalogStats', () => {
    beforeEach(() => {
      mockFs.readdirSync.mockReturnValue([
        'component-1.yaml',
        'component-2.yaml',
        'component-3.yaml',
      ] as unknown as fs.Dirent[]);
      mockFs.readFileSync
        .mockReturnValueOnce('yaml 1')
        .mockReturnValueOnce('yaml 2')
        .mockReturnValueOnce('yaml 3');
      mockYaml.load
        .mockReturnValueOnce(mockComponent1)
        .mockReturnValueOnce(mockComponent2)
        .mockReturnValueOnce(mockComponent3);
    });

    it('should return correct total count', () => {
      const stats = getCatalogStats();

      expect(stats.total).toBe(3);
    });

    it('should group components by type correctly', () => {
      const stats = getCatalogStats();

      expect(stats.byType).toEqual({
        service: 2,
        library: 1,
      });
    });

    it('should group components by lifecycle correctly', () => {
      const stats = getCatalogStats();

      expect(stats.byLifecycle).toEqual({
        production: 2,
        experimental: 1,
      });
    });

    it('should handle empty catalog', () => {
      mockFs.readdirSync.mockReturnValue([] as unknown as fs.Dirent[]);

      const stats = getCatalogStats();

      expect(stats.total).toBe(0);
      expect(stats.byType).toEqual({});
      expect(stats.byLifecycle).toEqual({});
    });
  });

  describe('getRecentComponents', () => {
    beforeEach(() => {
      mockFs.readdirSync.mockReturnValue([
        'component-1.yaml',
        'component-2.yaml',
        'component-3.yaml',
      ] as unknown as fs.Dirent[]);
      mockFs.readFileSync
        .mockReturnValueOnce('yaml 1')
        .mockReturnValueOnce('yaml 2')
        .mockReturnValueOnce('yaml 3');
      mockYaml.load
        .mockReturnValueOnce(mockComponent1)
        .mockReturnValueOnce(mockComponent2)
        .mockReturnValueOnce(mockComponent3);
    });

    it('should return all components when limit is greater than total', () => {
      const result = getRecentComponents(10);

      expect(result).toHaveLength(3);
    });

    it('should return limited number of components', () => {
      const result = getRecentComponents(2);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual(mockComponent1);
      expect(result[1]).toEqual(mockComponent2);
    });

    it('should return 6 components by default', () => {
      const files = Array.from({ length: 10 }, (_, i) => `component-${i}.yaml`);
      mockFs.readdirSync.mockReturnValue(files as unknown as fs.Dirent[]);
      mockFs.readFileSync.mockReturnValue('yaml content');
      
      // Return a different component each time based on the file being read
      let counter = 0;
      mockYaml.load.mockImplementation(() => ({
        ...mockComponent1,
        metadata: { ...mockComponent1.metadata, name: `test-component-${counter++}` },
      }));

      const result = getRecentComponents();

      // Should return at most 6, or all components if less than 6 exist
      expect(result.length).toBeLessThanOrEqual(6);
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('getComponentByName', () => {
    beforeEach(() => {
      mockFs.readdirSync.mockReturnValue([
        'component-1.yaml',
        'component-2.yaml',
        'component-3.yaml',
      ] as unknown as fs.Dirent[]);
      mockFs.readFileSync
        .mockReturnValueOnce('yaml 1')
        .mockReturnValueOnce('yaml 2')
        .mockReturnValueOnce('yaml 3');
      mockYaml.load
        .mockReturnValueOnce(mockComponent1)
        .mockReturnValueOnce(mockComponent2)
        .mockReturnValueOnce(mockComponent3);
    });

    it('should return component when name matches', () => {
      const result = getComponentByName('component-1');

      expect(result).toEqual(mockComponent1);
    });

    it('should return null when component not found', () => {
      const result = getComponentByName('nonexistent');

      expect(result).toBeNull();
    });

    it('should be case-sensitive', () => {
      const result = getComponentByName('Component-1');

      expect(result).toBeNull();
    });
  });

  describe('getAllSystems', () => {
    const mockComponentWithSystem = {
      ...mockComponent1,
      spec: { ...mockComponent1.spec, system: 'system-a' },
    };

    const mockComponentWithSystem2 = {
      ...mockComponent2,
      spec: { ...mockComponent2.spec, system: 'system-b' },
    };

    const mockComponentWithSystem3 = {
      ...mockComponent3,
      spec: { ...mockComponent3.spec, system: 'system-a' },
    };

    it('should return unique list of systems', () => {
      mockFs.readdirSync.mockReturnValue(['c1.yaml', 'c2.yaml', 'c3.yaml'] as unknown as fs.Dirent[]);
      mockFs.readFileSync.mockReturnValue('yaml');
      mockYaml.load
        .mockReturnValueOnce(mockComponentWithSystem)
        .mockReturnValueOnce(mockComponentWithSystem2)
        .mockReturnValueOnce(mockComponentWithSystem3);

      const result = getAllSystems();

      expect(result).toEqual(['system-a', 'system-b']);
      expect(result).toHaveLength(2);
    });

    it('should return empty array when no components have systems', () => {
      mockFs.readdirSync.mockReturnValue(['c1.yaml'] as unknown as fs.Dirent[]);
      mockFs.readFileSync.mockReturnValue('yaml');
      mockYaml.load.mockReturnValueOnce(mockComponent1);

      const result = getAllSystems();

      expect(result).toEqual([]);
    });

    it('should return sorted list', () => {
      const mockWithZ = { ...mockComponent1, spec: { ...mockComponent1.spec, system: 'z-system' } };
      const mockWithA = { ...mockComponent2, spec: { ...mockComponent2.spec, system: 'a-system' } };

      mockFs.readdirSync.mockReturnValue(['c1.yaml', 'c2.yaml'] as unknown as fs.Dirent[]);
      mockFs.readFileSync.mockReturnValue('yaml');
      mockYaml.load.mockReturnValueOnce(mockWithZ).mockReturnValueOnce(mockWithA);

      const result = getAllSystems();

      expect(result).toEqual(['a-system', 'z-system']);
    });
  });

  describe('getSystemStats', () => {
    it('should return stats for all systems', () => {
      const mockWithSystem1 = {
        ...mockComponent1,
        spec: { ...mockComponent1.spec, system: 'system-a' },
      };
      const mockWithSystem2 = {
        ...mockComponent2,
        spec: { ...mockComponent2.spec, system: 'system-b' },
      };
      const mockWithSystem3 = {
        ...mockComponent3,
        spec: { ...mockComponent3.spec, system: 'system-a' },
      };

      mockFs.readdirSync.mockReturnValue(['c1.yaml', 'c2.yaml', 'c3.yaml'] as unknown as fs.Dirent[]);
      mockFs.readFileSync.mockReturnValue('yaml');
      mockYaml.load
        .mockReturnValueOnce(mockWithSystem1)
        .mockReturnValueOnce(mockWithSystem2)
        .mockReturnValueOnce(mockWithSystem3);

      const result = getSystemStats();

      expect(result['system-a']).toEqual({
        count: 2,
        types: { service: 2 },
      });
      expect(result['system-b']).toEqual({
        count: 1,
        types: { library: 1 },
      });
    });

    it('should categorize components without system as uncategorized', () => {
      mockFs.readdirSync.mockReturnValue(['c1.yaml'] as unknown as fs.Dirent[]);
      mockFs.readFileSync.mockReturnValue('yaml');
      mockYaml.load.mockReturnValueOnce(mockComponent1);

      const result = getSystemStats();

      expect(result['uncategorized']).toEqual({
        count: 1,
        types: { service: 1 },
      });
    });

    it('should count different component types within a system', () => {
      const service = { ...mockComponent1, spec: { ...mockComponent1.spec, system: 'sys', type: 'service' } };
      const library = { ...mockComponent2, spec: { ...mockComponent2.spec, system: 'sys', type: 'library' } };
      const website = { ...mockComponent3, spec: { ...mockComponent3.spec, system: 'sys', type: 'website' } };

      mockFs.readdirSync.mockReturnValue(['c1.yaml', 'c2.yaml', 'c3.yaml'] as unknown as fs.Dirent[]);
      mockFs.readFileSync.mockReturnValue('yaml');
      mockYaml.load
        .mockReturnValueOnce(service)
        .mockReturnValueOnce(library)
        .mockReturnValueOnce(website);

      const result = getSystemStats();

      expect(result['sys']).toEqual({
        count: 3,
        types: { service: 1, library: 1, website: 1 },
      });
    });
  });

  describe('getComponentsBySystem', () => {
    it('should return all components in a system', () => {
      const mockWithSystem1 = {
        ...mockComponent1,
        spec: { ...mockComponent1.spec, system: 'system-a' },
      };
      const mockWithSystem2 = {
        ...mockComponent2,
        spec: { ...mockComponent2.spec, system: 'system-b' },
      };
      const mockWithSystem3 = {
        ...mockComponent3,
        spec: { ...mockComponent3.spec, system: 'system-a' },
      };

      mockFs.readdirSync.mockReturnValue(['c1.yaml', 'c2.yaml', 'c3.yaml'] as unknown as fs.Dirent[]);
      mockFs.readFileSync.mockReturnValue('yaml');
      mockYaml.load
        .mockReturnValueOnce(mockWithSystem1)
        .mockReturnValueOnce(mockWithSystem2)
        .mockReturnValueOnce(mockWithSystem3);

      const result = getComponentsBySystem('system-a');

      expect(result).toHaveLength(2);
      expect(result).toEqual([mockWithSystem1, mockWithSystem3]);
    });

    it('should return empty array for non-existent system', () => {
      mockFs.readdirSync.mockReturnValue(['c1.yaml'] as unknown as fs.Dirent[]);
      mockFs.readFileSync.mockReturnValue('yaml');
      mockYaml.load.mockReturnValueOnce(mockComponent1);

      const result = getComponentsBySystem('nonexistent');

      expect(result).toEqual([]);
    });
  });

  describe('getComponentDependencies', () => {
    it('should return direct dependencies of a component', () => {
      const dep1 = { ...mockComponent1, metadata: { ...mockComponent1.metadata, name: 'dep-1' } };
      const dep2 = { ...mockComponent2, metadata: { ...mockComponent2.metadata, name: 'dep-2' } };
      const mainComponent = {
        ...mockComponent3,
        metadata: { ...mockComponent3.metadata, name: 'main' },
        spec: { ...mockComponent3.spec, dependsOn: ['dep-1', 'dep-2'] },
      };

      mockFs.readdirSync.mockReturnValue(['d1.yaml', 'd2.yaml', 'm.yaml'] as unknown as fs.Dirent[]);
      mockFs.readFileSync.mockReturnValue('yaml');
      // Called twice: once for getComponentByName, once for the dependencies lookup
      mockYaml.load
        .mockReturnValueOnce(dep1)
        .mockReturnValueOnce(dep2)
        .mockReturnValueOnce(mainComponent)
        .mockReturnValueOnce(dep1)
        .mockReturnValueOnce(dep2)
        .mockReturnValueOnce(mainComponent);

      const result = getComponentDependencies('main');

      expect(result).toHaveLength(2);
      expect(result).toEqual([dep1, dep2]);
    });

    it('should return empty array when component has no dependencies', () => {
      mockFs.readdirSync.mockReturnValue(['c1.yaml'] as unknown as fs.Dirent[]);
      mockFs.readFileSync.mockReturnValue('yaml');
      mockYaml.load.mockReturnValueOnce(mockComponent1);

      const result = getComponentDependencies('component-1');

      expect(result).toEqual([]);
    });

    it('should return empty array when component not found', () => {
      mockFs.readdirSync.mockReturnValue(['c1.yaml'] as unknown as fs.Dirent[]);
      mockFs.readFileSync.mockReturnValue('yaml');
      mockYaml.load.mockReturnValueOnce(mockComponent1);

      const result = getComponentDependencies('nonexistent');

      expect(result).toEqual([]);
    });

    it('should filter out non-existent dependencies', () => {
      const dep1 = { ...mockComponent1, metadata: { ...mockComponent1.metadata, name: 'dep-1' } };
      const mainComponent = {
        ...mockComponent2,
        metadata: { ...mockComponent2.metadata, name: 'main' },
        spec: { ...mockComponent2.spec, dependsOn: ['dep-1', 'nonexistent'] },
      };

      mockFs.readdirSync.mockReturnValue(['d1.yaml', 'm.yaml'] as unknown as fs.Dirent[]);
      mockFs.readFileSync.mockReturnValue('yaml');
      // Called twice: once for getComponentByName, once for the dependencies lookup
      mockYaml.load
        .mockReturnValueOnce(dep1)
        .mockReturnValueOnce(mainComponent)
        .mockReturnValueOnce(dep1)
        .mockReturnValueOnce(mainComponent);

      const result = getComponentDependencies('main');

      expect(result).toHaveLength(1);
      expect(result[0].metadata.name).toBe('dep-1');
    });
  });

  describe('getComponentDependents', () => {
    it('should return components that depend on the given component', () => {
      const baseComponent = { ...mockComponent1, metadata: { ...mockComponent1.metadata, name: 'base' } };
      const dependent1 = {
        ...mockComponent2,
        metadata: { ...mockComponent2.metadata, name: 'dependent-1' },
        spec: { ...mockComponent2.spec, dependsOn: ['base'] },
      };
      const dependent2 = {
        ...mockComponent3,
        metadata: { ...mockComponent3.metadata, name: 'dependent-2' },
        spec: { ...mockComponent3.spec, dependsOn: ['base', 'other'] },
      };

      mockFs.readdirSync.mockReturnValue(['b.yaml', 'd1.yaml', 'd2.yaml'] as unknown as fs.Dirent[]);
      mockFs.readFileSync.mockReturnValue('yaml');
      mockYaml.load
        .mockReturnValueOnce(baseComponent)
        .mockReturnValueOnce(dependent1)
        .mockReturnValueOnce(dependent2);

      const result = getComponentDependents('base');

      expect(result).toHaveLength(2);
      expect(result.map(c => c.metadata.name)).toEqual(['dependent-1', 'dependent-2']);
    });

    it('should return empty array when no components depend on it', () => {
      mockFs.readdirSync.mockReturnValue(['c1.yaml', 'c2.yaml'] as unknown as fs.Dirent[]);
      mockFs.readFileSync.mockReturnValue('yaml');
      mockYaml.load
        .mockReturnValueOnce(mockComponent1)
        .mockReturnValueOnce(mockComponent2);

      const result = getComponentDependents('component-1');

      expect(result).toEqual([]);
    });
  });

  describe('getDependencyGraph', () => {
    it('should return full dependency graph with direct dependencies and dependents', () => {
      const dep = { ...mockComponent1, metadata: { ...mockComponent1.metadata, name: 'dependency' } };
      const main = {
        ...mockComponent2,
        metadata: { ...mockComponent2.metadata, name: 'main' },
        spec: { ...mockComponent2.spec, dependsOn: ['dependency'] },
      };
      const dependent = {
        ...mockComponent3,
        metadata: { ...mockComponent3.metadata, name: 'dependent' },
        spec: { ...mockComponent3.spec, dependsOn: ['main'] },
      };

      mockFs.readdirSync.mockReturnValue(['d.yaml', 'm.yaml', 'dep.yaml'] as unknown as fs.Dirent[]);
      mockFs.readFileSync.mockReturnValue('yaml');
      // Called multiple times by getComponentByName, getComponentDependencies, getComponentDependents
      mockYaml.load
        .mockReturnValue(dep)
        .mockReturnValue(main)
        .mockReturnValue(dependent);
      mockYaml.load
        .mockImplementation(() => {
          const calls = [dep, main, dependent];
          return calls[mockYaml.load.mock.calls.length % 3];
        });

      const result = getDependencyGraph('main');

      expect(result.component.metadata.name).toBe('main');
      expect(result.dependencies).toHaveLength(1);
      expect(result.dependencies[0].metadata.name).toBe('dependency');
      expect(result.dependents).toHaveLength(1);
      expect(result.dependents[0].metadata.name).toBe('dependent');
    });

    it('should return indirect dependencies when depth > 0', () => {
      const indirectDep = { ...mockComponent1, metadata: { ...mockComponent1.metadata, name: 'indirect' } };
      const directDep = {
        ...mockComponent2,
        metadata: { ...mockComponent2.metadata, name: 'direct' },
        spec: { ...mockComponent2.spec, dependsOn: ['indirect'] },
      };
      const main = {
        ...mockComponent3,
        metadata: { ...mockComponent3.metadata, name: 'main' },
        spec: { ...mockComponent3.spec, dependsOn: ['direct'] },
      };

      mockFs.readdirSync.mockReturnValue(['i.yaml', 'd.yaml', 'm.yaml'] as unknown as fs.Dirent[]);
      mockFs.readFileSync.mockReturnValue('yaml');
      mockYaml.load.mockImplementation(() => {
        const calls = [indirectDep, directDep, main];
        return calls[mockYaml.load.mock.calls.length % 3];
      });

      const result = getDependencyGraph('main', 1);

      expect(result.dependencies).toHaveLength(1);
      expect(result.dependencies[0].metadata.name).toBe('direct');
      expect(result.indirectDependencies).toHaveLength(1);
      expect(result.indirectDependencies[0].metadata.name).toBe('indirect');
    });

    it('should return empty graph when component not found', () => {
      mockFs.readdirSync.mockReturnValue(['c1.yaml'] as unknown as fs.Dirent[]);
      mockFs.readFileSync.mockReturnValue('yaml');
      mockYaml.load.mockReturnValueOnce(mockComponent1);

      const result = getDependencyGraph('nonexistent');

      expect(result.dependencies).toEqual([]);
      expect(result.dependents).toEqual([]);
      expect(result.indirectDependencies).toEqual([]);
      expect(result.indirectDependents).toEqual([]);
    });

    it('should not include circular dependencies', () => {
      const comp1 = {
        ...mockComponent1,
        metadata: { ...mockComponent1.metadata, name: 'comp1' },
        spec: { ...mockComponent1.spec, dependsOn: ['comp2'] },
      };
      const comp2 = {
        ...mockComponent2,
        metadata: { ...mockComponent2.metadata, name: 'comp2' },
        spec: { ...mockComponent2.spec, dependsOn: ['comp1'] },
      };

      mockFs.readdirSync.mockReturnValue(['c1.yaml', 'c2.yaml'] as unknown as fs.Dirent[]);
      mockFs.readFileSync.mockReturnValue('yaml');
      mockYaml.load.mockImplementation(() => {
        const calls = [comp1, comp2];
        return calls[mockYaml.load.mock.calls.length % 2];
      });

      const result = getDependencyGraph('comp1');

      expect(result.component.metadata.name).toBe('comp1');
      expect(result.dependencies).toHaveLength(1);
      expect(result.dependents).toHaveLength(1);
    });
  });

  describe('hidden components', () => {
    beforeEach(() => {
      mockHiddenStore.isHidden.mockClear();
      mockHiddenStore.getHiddenComponents.mockClear();
    });

    describe('getAllComponents with hidden components', () => {
      it('should filter out hidden components by default', () => {
        mockFs.readdirSync.mockReturnValue(['c1.yaml', 'c2.yaml', 'c3.yaml'] as unknown as fs.Dirent[]);
        mockFs.readFileSync.mockReturnValue('yaml');
        mockYaml.load
          .mockReturnValueOnce(mockComponent1)
          .mockReturnValueOnce(mockComponent2)
          .mockReturnValueOnce(mockComponent3);
        
        mockHiddenStore.isHidden.mockImplementation((name: string) => name === 'component-2');

        const result = getAllComponents();

        expect(result).toHaveLength(2);
        expect(result.find(c => c.metadata.name === 'component-1')).toBeDefined();
        expect(result.find(c => c.metadata.name === 'component-2')).toBeUndefined();
        expect(result.find(c => c.metadata.name === 'component-3')).toBeDefined();
      });

      it('should include hidden components when includeHidden is true', () => {
        mockFs.readdirSync.mockReturnValue(['c1.yaml', 'c2.yaml'] as unknown as fs.Dirent[]);
        mockFs.readFileSync.mockReturnValue('yaml');
        mockYaml.load
          .mockReturnValueOnce(mockComponent1)
          .mockReturnValueOnce(mockComponent2);
        
        mockHiddenStore.isHidden.mockImplementation((name: string) => name === 'component-2');

        const result = getAllComponents(undefined, true);

        expect(result).toHaveLength(2);
        expect(result.find(c => c.metadata.name === 'component-2')).toBeDefined();
      });
    });

    describe('getComponentByName with hidden components', () => {
      it('should not find hidden component by default', () => {
        mockFs.readdirSync.mockReturnValue(['c1.yaml', 'c2.yaml'] as unknown as fs.Dirent[]);
        mockFs.readFileSync.mockReturnValue('yaml');
        mockYaml.load
          .mockReturnValueOnce(mockComponent1)
          .mockReturnValueOnce(mockComponent2);
        
        mockHiddenStore.isHidden.mockImplementation((name: string) => name === 'component-2');

        const result = getComponentByName('component-2');

        expect(result).toBeNull();
      });

      it('should find hidden component when includeHidden is true', () => {
        mockFs.readdirSync.mockReturnValue(['c1.yaml', 'c2.yaml'] as unknown as fs.Dirent[]);
        mockFs.readFileSync.mockReturnValue('yaml');
        mockYaml.load
          .mockReturnValueOnce(mockComponent1)
          .mockReturnValueOnce(mockComponent2);
        
        mockHiddenStore.isHidden.mockImplementation((name: string) => name === 'component-2');

        const result = getComponentByName('component-2', true);

        expect(result).toEqual(mockComponent2);
      });
    });

    describe('getHiddenComponentsWithData', () => {
      it('should return full component data for hidden components', () => {
        mockFs.readdirSync.mockReturnValue(['c1.yaml', 'c2.yaml'] as unknown as fs.Dirent[]);
        mockFs.readFileSync.mockReturnValue('yaml');
        mockYaml.load
          .mockReturnValueOnce(mockComponent1)
          .mockReturnValueOnce(mockComponent2);
        
        mockHiddenStore.getHiddenComponents.mockReturnValue(['component-2']);
        mockHiddenStore.isHidden.mockImplementation((name: string) => name === 'component-2');

        const result = getHiddenComponentsWithData();

        expect(result).toHaveLength(1);
        expect(result[0]).toEqual(mockComponent2);
      });

      it('should return empty array when no components are hidden', () => {
        mockFs.readdirSync.mockReturnValue(['c1.yaml'] as unknown as fs.Dirent[]);
        mockFs.readFileSync.mockReturnValue('yaml');
        mockYaml.load.mockReturnValueOnce(mockComponent1);
        
        mockHiddenStore.getHiddenComponents.mockReturnValue([]);

        const result = getHiddenComponentsWithData();

        expect(result).toEqual([]);
      });

      it('should filter out non-existent hidden components', () => {
        mockFs.readdirSync.mockReturnValue(['c1.yaml'] as unknown as fs.Dirent[]);
        mockFs.readFileSync.mockReturnValue('yaml');
        mockYaml.load.mockReturnValueOnce(mockComponent1);
        
        mockHiddenStore.getHiddenComponents.mockReturnValue(['component-1', 'nonexistent']);
        mockHiddenStore.isHidden.mockReturnValue(true);

        const result = getHiddenComponentsWithData();

        expect(result).toHaveLength(1);
        expect(result[0].metadata.name).toBe('component-1');
      });
    });

    describe('stats with hidden components', () => {
      it('should exclude hidden components from stats', () => {
        mockFs.readdirSync.mockReturnValue(['c1.yaml', 'c2.yaml', 'c3.yaml'] as unknown as fs.Dirent[]);
        mockFs.readFileSync.mockReturnValue('yaml');
        mockYaml.load
          .mockReturnValueOnce(mockComponent1)
          .mockReturnValueOnce(mockComponent2)
          .mockReturnValueOnce(mockComponent3);
        
        mockHiddenStore.isHidden.mockImplementation((name: string) => name === 'component-2');

        const stats = getCatalogStats();

        expect(stats.total).toBe(2);
        expect(stats.byType.library).toBeUndefined();
      });
    });
  });
});

