import { Component } from "@/plugins/catalog/types";
import { GitActivityMetrics, getDaysSinceLastCommit } from "@/lib/git-activity/types";

export type ScoreTier = 'gold' | 'silver' | 'bronze' | 'needs-improvement';

export interface ComponentScore {
  total: number;
  breakdown: {
    metadata: number;
    architecture: number;
    lifecycle: number;
    activity: number;
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
    activity?: {
      lastCommitDaysAgo: number | null;
      openIssuesCount: number;
      openPullRequestsCount: number;
      isStale: boolean;
    };
  };
}

export function calculateComponentScore(
  component: Component,
  activityMetrics?: GitActivityMetrics | null,
  options?: {
    scoringEnabled?: boolean;
    gitActivityEnabled?: boolean;
  }
): ComponentScore {
  const scoringEnabled = options?.scoringEnabled ?? true;
  const gitActivityEnabled = options?.gitActivityEnabled ?? true;
  
  if (!scoringEnabled) {
    return {
      total: 0,
      breakdown: {
        metadata: 0,
        architecture: 0,
        lifecycle: 0,
        activity: 0,
      },
      tier: 'needs-improvement',
      details: {
        hasDescription: !!component.metadata.description,
        hasThreePlusTags: (component.metadata.tags?.length ?? 0) >= 3,
        hasDocumentationLink: (component.metadata.links?.length ?? 0) > 0,
        hasOwner: !!component.spec.owner,
        isPartOfSystem: !!component.spec.system,
        hasDependencies: (component.spec.dependsOn?.length ?? 0) > 0,
        lifecycle: component.spec.lifecycle,
      },
    };
  }

  let metadataScore = 0;
  let architectureScore = 0;
  let lifecycleScore = 0;
  let activityScore = 0;

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

  let activityDetails: ComponentScore['details']['activity'] | undefined;
  if (gitActivityEnabled && activityMetrics) {
    const daysSinceLastCommit = getDaysSinceLastCommit(activityMetrics.lastCommitDate);
    
    if (daysSinceLastCommit !== null) {
      if (daysSinceLastCommit < 30) {
        activityScore = 25;
      } else if (daysSinceLastCommit < 90) {
        activityScore = 15;
      } else {
        activityScore = 0;
      }
    }

    const totalOpenItems = activityMetrics.openIssuesCount + activityMetrics.openPullRequestsCount;
    if (totalOpenItems > 10) {
      activityScore = Math.max(0, activityScore - 5);
    }

    activityDetails = {
      lastCommitDaysAgo: daysSinceLastCommit,
      openIssuesCount: activityMetrics.openIssuesCount,
      openPullRequestsCount: activityMetrics.openPullRequestsCount,
      isStale: daysSinceLastCommit !== null && daysSinceLastCommit > 90,
    };
  }

  const total = metadataScore + architectureScore + lifecycleScore + activityScore;
  const tier = getScoreTier(total);

  return {
    total,
    breakdown: {
      metadata: metadataScore,
      architecture: architectureScore,
      lifecycle: lifecycleScore,
      activity: activityScore,
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
      activity: activityDetails,
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
  
  if (score.details.activity) {
    if (score.details.activity.isStale) {
      suggestions.push('Repository has not been updated in over 90 days - consider reviewing or archiving');
    }
    if (score.details.activity.openIssuesCount + score.details.activity.openPullRequestsCount > 10) {
      suggestions.push('High number of open issues/PRs - consider prioritizing resolution to reduce tech debt');
    }
  }

  return suggestions;
}

