import { Component } from '@/plugins/catalog/types';
import fs from 'fs';
import path from 'path';

export type SourceType = 'github' | 'gitlab';

export interface ImportedComponent {
  component: Component;
  source: {
    type: SourceType;
    repository: string;
    url: string;
  };
  lastSynced: string;
}

class ImportStore {
  private components: Map<string, ImportedComponent> = new Map();
  private persistencePath: string;

  constructor() {
    this.persistencePath = path.join(process.cwd(), '.aperture', 'imported.json');
    this.loadFromDisk();
  }

  private loadFromDisk(): void {
    try {
      if (fs.existsSync(this.persistencePath)) {
        const data = fs.readFileSync(this.persistencePath, 'utf-8');
        const parsed = JSON.parse(data);
        this.components = new Map(Object.entries(parsed));
      }
    } catch (error) {
      console.warn('Failed to load imported components from disk:', error);
    }
  }

  private saveToDisk(): void {
    try {
      const dir = path.dirname(this.persistencePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      const data = Object.fromEntries(this.components);
      fs.writeFileSync(this.persistencePath, JSON.stringify(data, null, 2), 'utf-8');
    } catch (error) {
      console.warn('Failed to save imported components to disk:', error);
    }
  }

  addImportedComponent(
    sourceType: SourceType,
    repository: string,
    component: Component,
    url: string
  ): void {
    const key = `${sourceType}:${repository}:${component.metadata.name}`;
    
    this.components.set(key, {
      component,
      source: {
        type: sourceType,
        repository,
        url,
      },
      lastSynced: new Date().toISOString(),
    });

    this.saveToDisk();
  }

  getImportedComponents(): ImportedComponent[] {
    // Always reload from disk to ensure fresh data
    this.loadFromDisk();
    return Array.from(this.components.values());
  }

  getImportedComponent(sourceType: SourceType, repository: string, name: string): ImportedComponent | undefined {
    // Always reload from disk to ensure fresh data
    this.loadFromDisk();
    const key = `${sourceType}:${repository}:${name}`;
    return this.components.get(key);
  }

  clearImported(): void {
    this.components.clear();
    this.saveToDisk();
  }

  clearRepository(sourceType: SourceType, repository: string): void {
    const keysToDelete: string[] = [];
    
    for (const [key] of this.components) {
      if (key.startsWith(`${sourceType}:${repository}:`)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach((key) => this.components.delete(key));
    this.saveToDisk();
  }

  getStats() {
    // getImportedComponents() already reloads from disk
    const imported = this.getImportedComponents();
    const repositories = new Set(imported.map((ic) => ic.source.repository));
    const bySource = imported.reduce((acc, ic) => {
      acc[ic.source.type] = (acc[ic.source.type] || 0) + 1;
      return acc;
    }, {} as Record<SourceType, number>);

    return {
      total: imported.length,
      repositories: repositories.size,
      bySource,
      lastSync: imported.length > 0
        ? new Date(
            Math.max(...imported.map((ic) => new Date(ic.lastSynced).getTime()))
          ).toISOString()
        : null,
    };
  }
}

// Singleton instance
export const importStore = new ImportStore();

