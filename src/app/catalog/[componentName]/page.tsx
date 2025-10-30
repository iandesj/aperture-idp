import { getComponentByName, getAllComponents, getDependencyGraph } from "@/lib/catalog";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ExternalLink, Network, CheckCircle2, XCircle, Award, GitBranch, AlertCircle, Activity } from "lucide-react";
import { DependencyGraph } from "@/components/DependencyGraph";
import { ScoreBadge } from "@/components/ScoreBadge";
import { calculateComponentScore, getImprovementSuggestions } from "@/lib/scoring";
import { getActivityMetrics } from "@/lib/git-activity/service";
import { HideButton } from "./HideButton";
import { normalizeGroupRef, getGroupByRef } from "@/lib/groups";

export async function generateStaticParams() {
  const components = getAllComponents();
  return components.map((component) => ({
    componentName: component.metadata.name,
  }));
}

export default async function ComponentDetailPage({
  params,
}: {
  params: Promise<{ componentName: string }>;
}) {
  const { componentName } = await params;
  const component = getComponentByName(componentName);

  if (!component) {
    notFound();
  }

  const dependencyData = getDependencyGraph(componentName, 1);
  const hasDependencies = dependencyData.dependencies.length > 0 || 
                         dependencyData.dependents.length > 0 ||
                         dependencyData.indirectDependencies.length > 0 ||
                         dependencyData.indirectDependents.length > 0;
  
  const activityMetrics = await getActivityMetrics(component);
  console.log('activityMetrics', activityMetrics);
  const score = calculateComponentScore(component, activityMetrics);
  const suggestions = getImprovementSuggestions(score);

  const lifecycleColors: Record<string, string> = {
    production: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    experimental: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    deprecated: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  };

  const typeColors: Record<string, string> = {
    service: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    library: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
    website: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/plugins/catalog"
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Catalog
        </Link>
        <HideButton componentName={componentName} />
      </div>

      <div>
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          {component.metadata.name}
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          {component.metadata.description || "No description provided"}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">
            Component Details
          </h2>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Type</dt>
              <dd>
                <span
                  className={`inline-flex px-3 py-1.5 rounded text-sm font-medium ${
                    typeColors[component.spec.type] || "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                  }`}
                >
                  {component.spec.type}
                </span>
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Lifecycle</dt>
              <dd>
                <span
                  className={`inline-flex px-3 py-1.5 rounded text-sm font-medium ${
                    lifecycleColors[component.spec.lifecycle] || "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                  }`}
                >
                  {component.spec.lifecycle}
                </span>
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Owner</dt>
              <dd className="text-sm text-gray-900 dark:text-gray-100">
                {(() => {
                  const owner = component.spec.owner;
                  const isUserOwner = owner?.toLowerCase().startsWith('user:');
                  if (!owner || isUserOwner) {
                    return owner || "";
                  }
                  const normalized = normalizeGroupRef(owner);
                  const group = getGroupByRef(normalized);
                  if (!group) {
                    return owner;
                  }
                  const nsAndName = normalized.split(":")[1] || ""; // default/name
                  const groupName = nsAndName.split("/")[1] || group.metadata.name;
                  return (
                    <Link
                      href={`/teams/${groupName}`}
                      className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:underline transition-colors"
                    >
                      {group.metadata.name}
                    </Link>
                  );
                })()}
              </dd>
            </div>
            {component.spec.system && (
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">System</dt>
                <dd>
                  <Link
                    href={`/systems/${component.spec.system}`}
                    className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:underline transition-colors"
                  >
                    {component.spec.system}
                  </Link>
                </dd>
              </div>
            )}
          </dl>
        </div>

        {component.metadata.tags && component.metadata.tags.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Tags</h2>
            <div className="flex flex-wrap gap-2">
              {component.metadata.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-sm font-medium"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {component.metadata.links && component.metadata.links.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Links</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {component.metadata.links.map((link, idx) => (
              <a
                key={idx}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm hover:underline transition-colors p-2 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20"
              >
                <ExternalLink className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{link.title || link.url}</span>
              </a>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-gray-900 dark:text-gray-100" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Quality Scorecard
            </h2>
          </div>
          <ScoreBadge score={score} size="lg" showLabel />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
              Metadata
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              {score.breakdown.metadata}
              <span className="text-base text-gray-500 dark:text-gray-400 font-normal">/40</span>
            </div>
          </div>
          <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
              Architecture
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              {score.breakdown.architecture}
              <span className="text-base text-gray-500 dark:text-gray-400 font-normal">/30</span>
            </div>
          </div>
          <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
              Lifecycle
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              {score.breakdown.lifecycle}
              <span className="text-base text-gray-500 dark:text-gray-400 font-normal">/30</span>
            </div>
          </div>
          <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
              Activity
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              {score.breakdown.activity}
              <span className="text-base text-gray-500 dark:text-gray-400 font-normal">/25</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Completed Criteria
            </h3>
            <div className="space-y-2">
              {score.details.hasDescription && (
                <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Has description</span>
                </div>
              )}
              {score.details.hasThreePlusTags && (
                <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Has 3+ tags</span>
                </div>
              )}
              {score.details.hasDocumentationLink && (
                <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Has documentation link</span>
                </div>
              )}
              {score.details.hasOwner && (
                <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Has owner</span>
                </div>
              )}
              {score.details.isPartOfSystem && (
                <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Part of a system</span>
                </div>
              )}
              {score.details.hasDependencies && (
                <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Has dependencies defined</span>
                </div>
              )}
              {score.details.lifecycle === 'production' && (
                <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Production lifecycle</span>
                </div>
              )}
              {Object.values(score.details).filter(v => v === true).length === 0 && score.details.lifecycle !== 'production' && (
                <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                  No criteria completed yet
                </p>
              )}
            </div>
          </div>

          {suggestions.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                Improvement Suggestions
              </h3>
              <div className="space-y-2">
                {suggestions.map((suggestion, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <XCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-gray-400 dark:text-gray-500" />
                    <span>{suggestion}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {score.total === 100 && (
          <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <p className="text-sm text-yellow-800 dark:text-yellow-300 font-medium">
              🎉 Perfect score! This component meets all quality criteria.
            </p>
          </div>
        )}
      </div>

      {activityMetrics && score.details.activity && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-6">
            <Activity className="w-5 h-5 text-gray-900 dark:text-gray-100" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Repository Activity
            </h2>
            <span className={`ml-auto px-2.5 py-1 rounded text-xs font-medium ${
              score.details.activity.isStale
                ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                : score.details.activity.lastCommitDaysAgo !== null && score.details.activity.lastCommitDaysAgo < 30
                ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
            }`}>
              {score.details.activity.isStale ? 'Stale' : score.details.activity.lastCommitDaysAgo !== null && score.details.activity.lastCommitDaysAgo < 30 ? 'Active' : 'Moderate'}
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                <GitBranch className="w-4 h-4" />
                Last Commit
              </div>
              <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {score.details.activity.lastCommitDaysAgo !== null ? (
                  score.details.activity.lastCommitDaysAgo === 0
                    ? 'Today'
                    : score.details.activity.lastCommitDaysAgo === 1
                    ? '1 day ago'
                    : `${score.details.activity.lastCommitDaysAgo} days ago`
                ) : (
                  <span className="text-gray-500 dark:text-gray-400">No commits found</span>
                )}
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                <AlertCircle className="w-4 h-4" />
                Open Issues
              </div>
              <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {score.details.activity.openIssuesCount}
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                <GitBranch className="w-4 h-4" />
                Open {activityMetrics.source === 'github' ? 'Pull Requests' : 'Merge Requests'}
              </div>
              <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {score.details.activity.openPullRequestsCount}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2 mb-6">
          <Network className="w-5 h-5 text-gray-900 dark:text-gray-100" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Dependencies
          </h2>
        </div>
        {hasDependencies ? (
          <div className="space-y-6">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              <div className="flex flex-wrap gap-6">
                {dependencyData.dependencies.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {dependencyData.dependencies.length}
                    </span>
                    <span>
                      direct {dependencyData.dependencies.length === 1 ? 'dependency' : 'dependencies'}
                    </span>
                  </div>
                )}
                {dependencyData.dependents.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {dependencyData.dependents.length}
                    </span>
                    <span>
                      direct {dependencyData.dependents.length === 1 ? 'dependent' : 'dependents'}
                    </span>
                  </div>
                )}
              </div>
            </div>
            <DependencyGraph
              component={component}
              dependencies={dependencyData.dependencies}
              dependents={dependencyData.dependents}
              indirectDependencies={dependencyData.indirectDependencies}
              indirectDependents={dependencyData.indirectDependents}
            />
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <Network className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <p className="text-base font-medium">No dependencies or dependents found</p>
            <p className="text-sm mt-2">
              This component operates independently
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

