export interface GitActivityMetrics {
  lastCommitDate: string | null;
  openIssuesCount: number;
  openPullRequestsCount: number;
  source: 'github' | 'gitlab';
}

export interface CachedActivityMetrics extends GitActivityMetrics {
  cachedAt: string;
}

export function isStale(lastCommitDate: string | null, staleThresholdDays: number = 90): boolean {
  if (!lastCommitDate) return true;
  const commitDate = new Date(lastCommitDate);
  const thresholdDate = new Date();
  thresholdDate.setDate(thresholdDate.getDate() - staleThresholdDays);
  return commitDate < thresholdDate;
}

export function getDaysSinceLastCommit(lastCommitDate: string | null): number | null {
  if (!lastCommitDate) return null;
  const commitDate = new Date(lastCommitDate);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - commitDate.getTime());
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

