import {
  calculateComponentScore,
  getScoreTier,
  getScoreTierLabel,
  getScoreTierColor,
  getImprovementSuggestions,
} from '../scoring';
import { Component } from '@/plugins/catalog/types';

describe('Scoring Logic', () => {
  const createComponent = (overrides: Partial<Component> = {}): Component => ({
    apiVersion: 'backstage.io/v1alpha1',
    kind: 'Component',
    metadata: {
      name: 'test-component',
      ...overrides.metadata,
    },
    spec: {
      type: 'service',
      lifecycle: 'production',
      owner: 'team-test',
      ...overrides.spec,
    },
  });

  describe('calculateComponentScore', () => {
    it('should calculate a perfect score of 100 for a fully complete component', () => {
      const component = createComponent({
        metadata: {
          name: 'perfect-component',
          description: 'A perfect component',
          tags: ['tag1', 'tag2', 'tag3'],
          links: [{ url: 'https://example.com' }],
        },
        spec: {
          type: 'service',
          lifecycle: 'production',
          owner: 'team-test',
          system: 'test-system',
          dependsOn: ['other-component'],
        },
      });

      const score = calculateComponentScore(component);

      expect(score.total).toBe(100);
      expect(score.breakdown.metadata).toBe(40);
      expect(score.breakdown.architecture).toBe(30);
      expect(score.breakdown.lifecycle).toBe(30);
      expect(score.tier).toBe('gold');
      expect(score.details.hasDescription).toBe(true);
      expect(score.details.hasThreePlusTags).toBe(true);
      expect(score.details.hasDocumentationLink).toBe(true);
      expect(score.details.hasOwner).toBe(true);
      expect(score.details.isPartOfSystem).toBe(true);
      expect(score.details.hasDependencies).toBe(true);
    });

    it('should calculate a minimal score for an empty component', () => {
      const component = createComponent({
        metadata: {
          name: 'minimal-component',
        },
        spec: {
          type: 'service',
          lifecycle: 'deprecated',
          owner: 'team-test',
        },
      });

      const score = calculateComponentScore(component);

      expect(score.total).toBe(10);
      expect(score.breakdown.metadata).toBe(10);
      expect(score.breakdown.architecture).toBe(0);
      expect(score.breakdown.lifecycle).toBe(0);
      expect(score.tier).toBe('needs-improvement');
    });

    it('should award metadata points correctly', () => {
      const withDescription = createComponent({
        metadata: { name: 'test', description: 'A description' },
        spec: { type: 'service', lifecycle: 'deprecated', owner: 'team' },
      });
      expect(calculateComponentScore(withDescription).breakdown.metadata).toBe(20);

      const withTags = createComponent({
        metadata: { name: 'test', tags: ['a', 'b', 'c'] },
        spec: { type: 'service', lifecycle: 'deprecated', owner: 'team' },
      });
      expect(calculateComponentScore(withTags).breakdown.metadata).toBe(20);

      const withLink = createComponent({
        metadata: { name: 'test', links: [{ url: 'https://example.com' }] },
        spec: { type: 'service', lifecycle: 'deprecated', owner: 'team' },
      });
      expect(calculateComponentScore(withLink).breakdown.metadata).toBe(20);
    });

    it('should not award points for fewer than 3 tags', () => {
      const component = createComponent({
        metadata: { name: 'test', tags: ['a', 'b'] },
        spec: { type: 'service', lifecycle: 'deprecated', owner: 'team' },
      });
      expect(calculateComponentScore(component).details.hasThreePlusTags).toBe(false);
    });

    it('should award architecture points correctly', () => {
      const withSystem = createComponent({
        metadata: { name: 'test' },
        spec: {
          type: 'service',
          lifecycle: 'deprecated',
          owner: 'team',
          system: 'test-system',
        },
      });
      expect(calculateComponentScore(withSystem).breakdown.architecture).toBe(15);

      const withDependencies = createComponent({
        metadata: { name: 'test' },
        spec: {
          type: 'service',
          lifecycle: 'deprecated',
          owner: 'team',
          dependsOn: ['other-component'],
        },
      });
      expect(calculateComponentScore(withDependencies).breakdown.architecture).toBe(15);

      const withBoth = createComponent({
        metadata: { name: 'test' },
        spec: {
          type: 'service',
          lifecycle: 'deprecated',
          owner: 'team',
          system: 'test-system',
          dependsOn: ['other-component'],
        },
      });
      expect(calculateComponentScore(withBoth).breakdown.architecture).toBe(30);
    });

    it('should award lifecycle points correctly', () => {
      const production = createComponent({
        spec: { type: 'service', lifecycle: 'production', owner: 'team' },
      });
      expect(calculateComponentScore(production).breakdown.lifecycle).toBe(30);

      const experimental = createComponent({
        spec: { type: 'service', lifecycle: 'experimental', owner: 'team' },
      });
      expect(calculateComponentScore(experimental).breakdown.lifecycle).toBe(15);

      const deprecated = createComponent({
        spec: { type: 'service', lifecycle: 'deprecated', owner: 'team' },
      });
      expect(calculateComponentScore(deprecated).breakdown.lifecycle).toBe(0);
    });
  });

  describe('getScoreTier', () => {
    it('should return correct tier for each score range', () => {
      expect(getScoreTier(100)).toBe('gold');
      expect(getScoreTier(80)).toBe('gold');
      expect(getScoreTier(79)).toBe('silver');
      expect(getScoreTier(60)).toBe('silver');
      expect(getScoreTier(59)).toBe('bronze');
      expect(getScoreTier(40)).toBe('bronze');
      expect(getScoreTier(39)).toBe('needs-improvement');
      expect(getScoreTier(0)).toBe('needs-improvement');
    });
  });

  describe('getScoreTierLabel', () => {
    it('should return correct label for each tier', () => {
      expect(getScoreTierLabel('gold')).toBe('Gold');
      expect(getScoreTierLabel('silver')).toBe('Silver');
      expect(getScoreTierLabel('bronze')).toBe('Bronze');
      expect(getScoreTierLabel('needs-improvement')).toBe('Needs Improvement');
    });
  });

  describe('getScoreTierColor', () => {
    it('should return correct colors for each tier', () => {
      const gold = getScoreTierColor('gold');
      expect(gold.bg).toContain('yellow');
      expect(gold.text).toContain('yellow');
      expect(gold.border).toContain('yellow');

      const silver = getScoreTierColor('silver');
      expect(silver.bg).toContain('gray');

      const bronze = getScoreTierColor('bronze');
      expect(bronze.bg).toContain('orange');

      const needsImprovement = getScoreTierColor('needs-improvement');
      expect(needsImprovement.bg).toContain('red');
    });
  });

  describe('getImprovementSuggestions', () => {
    it('should return all suggestions for a minimal component', () => {
      const component = createComponent({
        metadata: { name: 'minimal' },
        spec: { type: 'service', lifecycle: 'deprecated', owner: 'team' },
      });
      const score = calculateComponentScore(component);
      const suggestions = getImprovementSuggestions(score);

      expect(suggestions).toHaveLength(6);
      expect(suggestions).toContain('Add a description to explain what this component does');
      expect(suggestions).toContain('Add at least 3 tags to improve discoverability');
      expect(suggestions).toContain('Add a documentation link for reference');
      expect(suggestions).toContain('Associate this component with a system');
      expect(suggestions).toContain('Document dependencies if this component depends on others');
      expect(suggestions).toContain('Move to production lifecycle when ready');
    });

    it('should return no suggestions for a perfect component', () => {
      const component = createComponent({
        metadata: {
          name: 'perfect',
          description: 'Perfect component',
          tags: ['a', 'b', 'c'],
          links: [{ url: 'https://example.com' }],
        },
        spec: {
          type: 'service',
          lifecycle: 'production',
          owner: 'team',
          system: 'test-system',
          dependsOn: ['other'],
        },
      });
      const score = calculateComponentScore(component);
      const suggestions = getImprovementSuggestions(score);

      expect(suggestions).toHaveLength(0);
    });

    it('should provide targeted suggestions based on missing criteria', () => {
      const component = createComponent({
        metadata: {
          name: 'partial',
          description: 'Has description',
        },
        spec: {
          type: 'service',
          lifecycle: 'production',
          owner: 'team',
        },
      });
      const score = calculateComponentScore(component);
      const suggestions = getImprovementSuggestions(score);

      expect(suggestions).toHaveLength(4);
      expect(suggestions).toContain('Add at least 3 tags to improve discoverability');
      expect(suggestions).toContain('Add a documentation link for reference');
      expect(suggestions).toContain('Associate this component with a system');
      expect(suggestions).toContain('Document dependencies if this component depends on others');
      expect(suggestions).not.toContain('Add a description to explain what this component does');
      expect(suggestions).not.toContain('Move to production lifecycle when ready');
    });
  });
});

