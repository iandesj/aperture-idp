import fs from 'fs';
import path from 'path';

class HiddenStore {
  private hiddenComponents: Set<string> = new Set();
  private persistencePath: string;

  constructor() {
    this.persistencePath = path.join(process.cwd(), '.aperture', 'hidden.json');
    this.loadFromDisk();
  }

  private loadFromDisk(): void {
    try {
      if (fs.existsSync(this.persistencePath)) {
        const data = fs.readFileSync(this.persistencePath, 'utf-8');
        const parsed = JSON.parse(data);
        this.hiddenComponents = new Set(parsed.hiddenComponents || []);
      }
    } catch (error) {
      console.warn('Failed to load hidden components from disk:', error);
    }
  }

  private saveToDisk(): void {
    try {
      const dir = path.dirname(this.persistencePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      const data = {
        hiddenComponents: Array.from(this.hiddenComponents),
        lastUpdated: new Date().toISOString(),
      };
      fs.writeFileSync(this.persistencePath, JSON.stringify(data, null, 2), 'utf-8');
    } catch (error) {
      console.warn('Failed to save hidden components to disk:', error);
    }
  }

  hideComponent(componentName: string): void {
    this.hiddenComponents.add(componentName);
    this.saveToDisk();
  }

  unhideComponent(componentName: string): void {
    this.hiddenComponents.delete(componentName);
    this.saveToDisk();
  }

  isHidden(componentName: string): boolean {
    this.loadFromDisk();
    return this.hiddenComponents.has(componentName);
  }

  getHiddenComponents(): string[] {
    this.loadFromDisk();
    return Array.from(this.hiddenComponents);
  }

  clear(): void {
    this.hiddenComponents.clear();
    this.saveToDisk();
  }

  getStats() {
    this.loadFromDisk();
    return {
      total: this.hiddenComponents.size,
      components: Array.from(this.hiddenComponents),
    };
  }
}

export const hiddenStore = new HiddenStore();

