import { importStore } from '../store';
import fs from 'fs';
import path from 'path';
import { Component } from '@/plugins/catalog/types';

jest.mock('fs');

describe('ImportStore', () => {
  const mockComponent1: Component = {
    apiVersion: 'backstage.io/v1alpha1',
    kind: 'Component',
    metadata: {
      name: 'service-1',
      description: 'Service 1',
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
      name: 'service-2',
      description: 'Service 2',
    },
    spec: {
      type: 'service',
      lifecycle: 'production',
      owner: 'team-b',
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Clear the store state by simulating empty disk
    (fs.existsSync as jest.Mock).mockReturnValue(false);
    (fs.readFileSync as jest.Mock).mockReturnValue('{}');
    (fs.mkdirSync as jest.Mock).mockReturnValue(undefined);
    (fs.writeFileSync as jest.Mock).mockReturnValue(undefined);
    
    // Clear the store
    importStore.clearImported();
  });

  describe('addImportedComponent', () => {
    it('should add a GitHub component to the store', () => {
      const writeData: string[] = [];
      (fs.writeFileSync as jest.Mock).mockImplementation((filePath, data) => {
        writeData.push(data);
      });

      importStore.addImportedComponent(
        'github',
        'org/repo-1',
        mockComponent1,
        'https://github.com/org/repo-1/blob/main/catalog-info.yaml'
      );

      expect(fs.writeFileSync).toHaveBeenCalled();
      const savedData = JSON.parse(writeData[0]);
      expect(savedData['github:org/repo-1:service-1']).toBeDefined();
      expect(savedData['github:org/repo-1:service-1'].component).toEqual(mockComponent1);
      expect(savedData['github:org/repo-1:service-1'].source.type).toBe('github');
    });

    it('should add a GitLab component to the store', () => {
      const writeData: string[] = [];
      (fs.writeFileSync as jest.Mock).mockImplementation((filePath, data) => {
        writeData.push(data);
      });

      importStore.addImportedComponent(
        'gitlab',
        'group/project-1',
        mockComponent2,
        'https://gitlab.com/group/project-1/-/blob/main/catalog-info.yaml'
      );

      expect(fs.writeFileSync).toHaveBeenCalled();
      const savedData = JSON.parse(writeData[0]);
      expect(savedData['gitlab:group/project-1:service-2']).toBeDefined();
      expect(savedData['gitlab:group/project-1:service-2'].source.type).toBe('gitlab');
    });

    it('should create .aperture directory if it does not exist', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      importStore.addImportedComponent(
        'github',
        'org/repo-1',
        mockComponent1,
        'https://github.com/org/repo-1'
      );

      expect(fs.mkdirSync).toHaveBeenCalledWith(
        expect.stringContaining('.aperture'),
        { recursive: true }
      );
    });
  });

  describe('getImportedComponents', () => {
    it('should return all imported components', () => {
      const mockData = {
        'github:org/repo-1:service-1': {
          component: mockComponent1,
          source: {
            type: 'github',
            repository: 'org/repo-1',
            url: 'https://github.com/org/repo-1',
          },
          lastSynced: '2025-10-29T12:00:00Z',
        },
        'gitlab:group/project-1:service-2': {
          component: mockComponent2,
          source: {
            type: 'gitlab',
            repository: 'group/project-1',
            url: 'https://gitlab.com/group/project-1',
          },
          lastSynced: '2025-10-29T12:00:00Z',
        },
      };

      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(mockData));

      const result = importStore.getImportedComponents();

      expect(result).toHaveLength(2);
      expect(result[0].component).toEqual(mockComponent1);
      expect(result[0].source.type).toBe('github');
      expect(result[1].component).toEqual(mockComponent2);
      expect(result[1].source.type).toBe('gitlab');
    });

    it('should return empty array when no data exists', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      const result = importStore.getImportedComponents();

      expect(result).toEqual([]);
    });

    it('should handle corrupted data gracefully', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readFileSync as jest.Mock).mockReturnValue('invalid json');

      const result = importStore.getImportedComponents();

      expect(result).toEqual([]);
    });

    it('should reload from disk on each call', () => {
      const mockData = {
        'github:org/repo-1:service-1': {
          component: mockComponent1,
          source: {
            type: 'github',
            repository: 'org/repo-1',
            url: 'https://github.com/org/repo-1',
          },
          lastSynced: '2025-10-29T12:00:00Z',
        },
      };

      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(mockData));

      // First call
      const result1 = importStore.getImportedComponents();
      expect(result1).toHaveLength(1);

      // Update mock data
      const updatedData = {
        ...mockData,
        'gitlab:group/project-1:service-2': {
          component: mockComponent2,
          source: {
            type: 'gitlab',
            repository: 'group/project-1',
            url: 'https://gitlab.com/group/project-1',
          },
          lastSynced: '2025-10-29T12:00:00Z',
        },
      };
      (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(updatedData));

      // Second call should reload from disk
      const result2 = importStore.getImportedComponents();
      expect(result2).toHaveLength(2);
      expect(fs.readFileSync).toHaveBeenCalledTimes(2);
    });
  });

  describe('getImportedComponent', () => {
    it('should return a specific GitHub component', () => {
      const mockData = {
        'github:org/repo-1:service-1': {
          component: mockComponent1,
          source: {
            type: 'github',
            repository: 'org/repo-1',
            url: 'https://github.com/org/repo-1',
          },
          lastSynced: '2025-10-29T12:00:00Z',
        },
      };

      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(mockData));

      const result = importStore.getImportedComponent('github', 'org/repo-1', 'service-1');

      expect(result).toBeDefined();
      expect(result?.component).toEqual(mockComponent1);
    });

    it('should return a specific GitLab component', () => {
      const mockData = {
        'gitlab:group/project-1:service-2': {
          component: mockComponent2,
          source: {
            type: 'gitlab',
            repository: 'group/project-1',
            url: 'https://gitlab.com/group/project-1',
          },
          lastSynced: '2025-10-29T12:00:00Z',
        },
      };

      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(mockData));

      const result = importStore.getImportedComponent('gitlab', 'group/project-1', 'service-2');

      expect(result).toBeDefined();
      expect(result?.component).toEqual(mockComponent2);
    });

    it('should return undefined for non-existent component', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readFileSync as jest.Mock).mockReturnValue('{}');

      const result = importStore.getImportedComponent('github', 'org/repo-1', 'non-existent');

      expect(result).toBeUndefined();
    });
  });

  describe('clearImported', () => {
    it('should clear all imported components', () => {
      const writeData: string[] = [];
      (fs.writeFileSync as jest.Mock).mockImplementation((filePath, data) => {
        writeData.push(data);
      });

      importStore.clearImported();

      expect(fs.writeFileSync).toHaveBeenCalled();
      const savedData = JSON.parse(writeData[0]);
      expect(savedData).toEqual({});
    });
  });

  describe('clearRepository', () => {
    it('should clear components from a specific GitHub repository', () => {
      // First add components to the store
      importStore.addImportedComponent(
        'github',
        'org/repo-1',
        mockComponent1,
        'https://github.com/org/repo-1'
      );
      importStore.addImportedComponent(
        'github',
        'org/repo-2',
        mockComponent2,
        'https://github.com/org/repo-2'
      );

      // Clear repository
      const writeData: string[] = [];
      (fs.writeFileSync as jest.Mock).mockImplementation((filePath, data) => {
        writeData.push(data);
      });

      importStore.clearRepository('github', 'org/repo-1');

      expect(fs.writeFileSync).toHaveBeenCalled();
      // Get the most recent write
      const savedData = JSON.parse(writeData[writeData.length - 1]);
      expect(savedData['github:org/repo-1:service-1']).toBeUndefined();
      expect(savedData['github:org/repo-2:service-2']).toBeDefined();
    });

    it('should clear components from a specific GitLab project', () => {
      // First add components to the store
      importStore.addImportedComponent(
        'gitlab',
        'group/project-1',
        mockComponent1,
        'https://gitlab.com/group/project-1'
      );
      importStore.addImportedComponent(
        'gitlab',
        'group/project-2',
        mockComponent2,
        'https://gitlab.com/group/project-2'
      );

      // Clear project
      const writeData: string[] = [];
      (fs.writeFileSync as jest.Mock).mockImplementation((filePath, data) => {
        writeData.push(data);
      });

      importStore.clearRepository('gitlab', 'group/project-1');

      expect(fs.writeFileSync).toHaveBeenCalled();
      // Get the most recent write
      const savedData = JSON.parse(writeData[writeData.length - 1]);
      expect(savedData['gitlab:group/project-1:service-1']).toBeUndefined();
      expect(savedData['gitlab:group/project-2:service-2']).toBeDefined();
    });
  });

  describe('getStats', () => {
    it('should return statistics for imported components', () => {
      const mockData = {
        'github:org/repo-1:service-1': {
          component: mockComponent1,
          source: { type: 'github', repository: 'org/repo-1', url: '' },
          lastSynced: '2025-10-29T12:00:00Z',
        },
        'github:org/repo-2:service-2': {
          component: mockComponent2,
          source: { type: 'github', repository: 'org/repo-2', url: '' },
          lastSynced: '2025-10-29T13:00:00Z',
        },
        'gitlab:group/project-1:service-3': {
          component: { ...mockComponent1, metadata: { name: 'service-3' } },
          source: { type: 'gitlab', repository: 'group/project-1', url: '' },
          lastSynced: '2025-10-29T14:00:00Z',
        },
      };

      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(mockData));

      const stats = importStore.getStats();

      expect(stats.total).toBe(3);
      expect(stats.repositories).toBe(3);
      expect(stats.bySource.github).toBe(2);
      expect(stats.bySource.gitlab).toBe(1);
      expect(stats.lastSync).toMatch(/2025-10-29T14:00:00/);
    });

    it('should return correct stats for empty store', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);
      (fs.readFileSync as jest.Mock).mockReturnValue('{}');

      const stats = importStore.getStats();

      expect(stats.total).toBe(0);
      expect(stats.repositories).toBe(0);
      expect(stats.bySource).toEqual({});
      expect(stats.lastSync).toBeNull();
    });

    it('should count unique repositories', () => {
      const mockData = {
        'github:org/repo-1:service-1': {
          component: mockComponent1,
          source: { type: 'github', repository: 'org/repo-1', url: '' },
          lastSynced: '2025-10-29T12:00:00Z',
        },
        'github:org/repo-1:service-2': {
          component: mockComponent2,
          source: { type: 'github', repository: 'org/repo-1', url: '' },
          lastSynced: '2025-10-29T12:00:00Z',
        },
      };

      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(mockData));

      const stats = importStore.getStats();

      expect(stats.total).toBe(2);
      expect(stats.repositories).toBe(1);
    });
  });
});

