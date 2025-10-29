import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { getAllComponents, getCatalogStats, getRecentComponents } from '../catalog';
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
});

