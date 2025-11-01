import fs from 'fs';
import path from 'path';

export type FeatureFlag = 'gitActivityEnabled' | 'scoringEnabled';

interface FeaturesConfig {
  gitActivityEnabled: boolean;
  scoringEnabled: boolean;
  lastUpdated: string;
}

class FeaturesStore {
  private features: FeaturesConfig;
  private persistencePath: string;

  constructor() {
    this.persistencePath = path.join(process.cwd(), '.aperture', 'features.json');
    this.features = this.loadFromDisk();
  }

  private loadFromDisk(): FeaturesConfig {
    try {
      if (fs.existsSync(this.persistencePath)) {
        const data = fs.readFileSync(this.persistencePath, 'utf-8');
        const parsed = JSON.parse(data);
        return {
          gitActivityEnabled: parsed.gitActivityEnabled ?? true,
          scoringEnabled: parsed.scoringEnabled ?? true,
          lastUpdated: parsed.lastUpdated || new Date().toISOString(),
        };
      }
    } catch (error) {
      console.warn('Failed to load features from disk:', error);
    }
    
    return {
      gitActivityEnabled: true,
      scoringEnabled: true,
      lastUpdated: new Date().toISOString(),
    };
  }

  private saveToDisk(): void {
    try {
      const dir = path.dirname(this.persistencePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      this.features.lastUpdated = new Date().toISOString();
      fs.writeFileSync(this.persistencePath, JSON.stringify(this.features, null, 2), 'utf-8');
    } catch (error) {
      console.warn('Failed to save features to disk:', error);
    }
  }

  isFeatureEnabled(feature: FeatureFlag): boolean {
    this.features = this.loadFromDisk();
    return this.features[feature];
  }

  toggleFeature(feature: FeatureFlag): void {
    this.features = this.loadFromDisk();
    this.features[feature] = !this.features[feature];
    this.saveToDisk();
  }

  setFeature(feature: FeatureFlag, enabled: boolean): void {
    this.features = this.loadFromDisk();
    this.features[feature] = enabled;
    this.saveToDisk();
  }

  getAllFeatures(): FeaturesConfig {
    this.features = this.loadFromDisk();
    return { ...this.features };
  }
}

export const featuresStore = new FeaturesStore();
