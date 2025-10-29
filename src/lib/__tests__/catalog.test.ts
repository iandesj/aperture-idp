import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { 
  getAllComponents, 
  getCatalogStats, 
  getRecentComponents, 
  getComponentByName,
  getAllSystems,
  getSystemStats,
  getComponentsBySystem
} from '../catalog';
import { Component } from '@/plugins/catalog/types';

jest.mock('fs');
jest.mock('js-yaml');

const mockFs = fs as jest.Mocked<typeof fs>;
const mockYaml = yaml as jest.Mocked<typeof yaml>;

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
      mockFs.readdirSync.mockReturnValue(['component-1.yaml', 'component-2.yaml'] as any);
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
      mockFs.readdirSync.mockReturnValue([] as any);

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
      ] as any);
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
      mockFs.readdirSync.mockReturnValue([] as any);

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
      ] as any);
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
      mockFs.readdirSync.mockReturnValue(
        Array.from({ length: 10 }, (_, i) => `component-${i}.yaml`) as any
      );
      mockFs.readFileSync.mockReturnValue('yaml content');
      mockYaml.load.mockReturnValue(mockComponent1);

      const result = getRecentComponents();

      expect(result).toHaveLength(6);
    });
  });

  describe('getComponentByName', () => {
    beforeEach(() => {
      mockFs.readdirSync.mockReturnValue([
        'component-1.yaml',
        'component-2.yaml',
        'component-3.yaml',
      ] as any);
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
      mockFs.readdirSync.mockReturnValue(['c1.yaml', 'c2.yaml', 'c3.yaml'] as any);
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
      mockFs.readdirSync.mockReturnValue(['c1.yaml'] as any);
      mockFs.readFileSync.mockReturnValue('yaml');
      mockYaml.load.mockReturnValueOnce(mockComponent1);

      const result = getAllSystems();

      expect(result).toEqual([]);
    });

    it('should return sorted list', () => {
      const mockWithZ = { ...mockComponent1, spec: { ...mockComponent1.spec, system: 'z-system' } };
      const mockWithA = { ...mockComponent2, spec: { ...mockComponent2.spec, system: 'a-system' } };

      mockFs.readdirSync.mockReturnValue(['c1.yaml', 'c2.yaml'] as any);
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

      mockFs.readdirSync.mockReturnValue(['c1.yaml', 'c2.yaml', 'c3.yaml'] as any);
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
      mockFs.readdirSync.mockReturnValue(['c1.yaml'] as any);
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

      mockFs.readdirSync.mockReturnValue(['c1.yaml', 'c2.yaml', 'c3.yaml'] as any);
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

      mockFs.readdirSync.mockReturnValue(['c1.yaml', 'c2.yaml', 'c3.yaml'] as any);
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
      mockFs.readdirSync.mockReturnValue(['c1.yaml'] as any);
      mockFs.readFileSync.mockReturnValue('yaml');
      mockYaml.load.mockReturnValueOnce(mockComponent1);

      const result = getComponentsBySystem('nonexistent');

      expect(result).toEqual([]);
    });
  });
});

