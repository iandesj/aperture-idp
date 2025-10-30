import { Component } from '@/plugins/catalog/types';
import { GitActivityMetrics } from './types';
import { gitActivityCache } from './cache';
import { GitHubClient } from '@/lib/github/client';
import { GitLabClient } from '@/lib/gitlab/client';
import { importStore } from '@/lib/import/store';
import config from '@/lib/aperture.config';

export async function getActivityMetrics(component: Component): Promise<GitActivityMetrics | null> {
  const componentName = component.metadata.name;

  const importedComponents = importStore.getImportedComponents();
  const importedComponent = importedComponents.find(
    (ic) => ic.component.metadata.name === componentName
  );

  if (!importedComponent) {
    return null;
  }

  const sourceType = importedComponent.source.type;
  const repository = importedComponent.source.repository;

  if (!sourceType || !repository) {
    return null;
  }

  const cached = gitActivityCache.get(sourceType, repository, componentName);
  if (cached) {
    return cached;
  }

  try {
    let metrics: GitActivityMetrics | null = null;

    if (sourceType === 'github') {
      if (!config.github.enabled || !config.github.token) {
        return null;
      }
      const client = new GitHubClient(config.github.token);
      const [owner, repo] = repository.split('/');
      if (!owner || !repo) {
        return null;
      }
      metrics = await client.getRepositoryActivity(owner, repo);
    } else if (sourceType === 'gitlab') {
      if (!config.gitlab.enabled || !config.gitlab.token) {
        return null;
      }
      const client = new GitLabClient(config.gitlab.token);
      metrics = await client.getRepositoryActivity(repository);
    }

    if (metrics) {
      gitActivityCache.set(sourceType, repository, componentName, metrics);
      return metrics;
    }
  } catch (error) {
    console.warn(`Failed to fetch git activity for ${componentName}:`, error);
    return null;
  }

  return null;
}

