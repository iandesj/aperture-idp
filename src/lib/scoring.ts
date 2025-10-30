import { Component } from "@/plugins/catalog/types";

export type ScoreTier = 'gold' | 'silver' | 'bronze' | 'needs-improvement';

export interface ComponentScore {
  total: number;
  breakdown: {
    metadata: number;
    architecture: number;
    lifecycle: number;
  };
  tier: ScoreTier;
  details: {
    hasDescription: boolean;
    hasThreePlusTags: boolean;
    hasDocumentationLink: boolean;
    hasOwner: boolean;
    isPartOfSystem: boolean;
    hasDependencies: boolean;
    lifecycle: string;
  };
}

export function calculateComponentScore(component: Component): ComponentScore {
  let metadataScore = 0;
  let architectureScore = 0;
  let lifecycleScore = 0;

  const hasDescription = !!component.metadata.description;
  const hasThreePlusTags = (component.metadata.tags?.length ?? 0) >= 3;
  const hasDocumentationLink = (component.metadata.links?.length ?? 0) > 0;
  const hasOwner = !!component.spec.owner;
  const isPartOfSystem = !!component.spec.system;
  const hasDependencies = (component.spec.dependsOn?.length ?? 0) > 0;

  if (hasDescription) metadataScore += 10;
  if (hasThreePlusTags) metadataScore += 10;
  if (hasDocumentationLink) metadataScore += 10;
  if (hasOwner) metadataScore += 10;

  if (isPartOfSystem) architectureScore += 15;
  if (hasDependencies) architectureScore += 15;

  if (component.spec.lifecycle === 'production') {
    lifecycleScore = 30;
  } else if (component.spec.lifecycle === 'experimental') {
    lifecycleScore = 15;
  }

  const total = metadataScore + architectureScore + lifecycleScore;
  const tier = getScoreTier(total);

  return {
    total,
    breakdown: {
      metadata: metadataScore,
      architecture: architectureScore,
      lifecycle: lifecycleScore,
    },
    tier,
    details: {
      hasDescription,
      hasThreePlusTags,
      hasDocumentationLink,
      hasOwner,
      isPartOfSystem,
      hasDependencies,
      lifecycle: component.spec.lifecycle,
    },
  };
}

export function getScoreTier(score: number): ScoreTier {
  if (score >= 80) return 'gold';
  if (score >= 60) return 'silver';
  if (score >= 40) return 'bronze';
  return 'needs-improvement';
}

export function getScoreTierLabel(tier: ScoreTier): string {
  switch (tier) {
    case 'gold':
      return 'Gold';
    case 'silver':
      return 'Silver';
    case 'bronze':
      return 'Bronze';
    case 'needs-improvement':
      return 'Needs Improvement';
  }
}

export function getScoreTierColor(tier: ScoreTier): {
  bg: string;
  text: string;
  border: string;
} {
  switch (tier) {
    case 'gold':
      return {
        bg: 'bg-yellow-100 dark:bg-yellow-900/20',
        text: 'text-yellow-800 dark:text-yellow-400',
        border: 'border-yellow-300 dark:border-yellow-700',
      };
    case 'silver':
      return {
        bg: 'bg-gray-100 dark:bg-gray-700',
        text: 'text-gray-800 dark:text-gray-300',
        border: 'border-gray-300 dark:border-gray-600',
      };
    case 'bronze':
      return {
        bg: 'bg-orange-100 dark:bg-orange-900/20',
        text: 'text-orange-800 dark:text-orange-400',
        border: 'border-orange-300 dark:border-orange-700',
      };
    case 'needs-improvement':
      return {
        bg: 'bg-red-100 dark:bg-red-900/20',
        text: 'text-red-800 dark:text-red-400',
        border: 'border-red-300 dark:border-red-700',
      };
  }
}

export function getImprovementSuggestions(score: ComponentScore): string[] {
  const suggestions: string[] = [];

  if (!score.details.hasDescription) {
    suggestions.push('Add a description to explain what this component does');
  }
  if (!score.details.hasThreePlusTags) {
    suggestions.push('Add at least 3 tags to improve discoverability');
  }
  if (!score.details.hasDocumentationLink) {
    suggestions.push('Add a documentation link for reference');
  }
  if (!score.details.hasOwner) {
    suggestions.push('Specify an owner or team responsible for this component');
  }
  if (!score.details.isPartOfSystem) {
    suggestions.push('Associate this component with a system');
  }
  if (!score.details.hasDependencies) {
    suggestions.push('Document dependencies if this component depends on others');
  }
  if (score.details.lifecycle !== 'production') {
    suggestions.push('Move to production lifecycle when ready');
  }

  return suggestions;
}

