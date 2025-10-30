import Link from "next/link";
import { getCatalogStats, getRecentComponents, getScorecardStats } from "@/lib/catalog";
import { ScoreBadge } from "@/components/ScoreBadge";
import { Award, TrendingUp, AlertCircle } from "lucide-react";

export default function Home() {
  const stats = getCatalogStats();
  const recentComponents = getRecentComponents(6);
  const scorecardStats = getScorecardStats();

  const lifecycleColors: Record<string, string> = {
    production: "bg-green-100 text-green-800",
    experimental: "bg-yellow-100 text-yellow-800",
    deprecated: "bg-red-100 text-red-800",
  };

  const typeColors: Record<string, string> = {
    service: "bg-blue-100 text-blue-800",
    library: "bg-purple-100 text-purple-800",
    website: "bg-indigo-100 text-indigo-800",
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">
          Welcome to Aperture IDP
        </h1>
        <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">
          Your internal developer portal for managing and discovering software components
        </p>
      </div>

      <div>
        <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
          Catalog Overview
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
            <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              {stats.total}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Total Components
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
            <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              By Type
            </div>
            <div className="space-y-2">
              {Object.entries(stats.byType).map(([type, count]) => (
                <div key={type} className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                    {type}
                  </span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {count}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
            <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              By Lifecycle
            </div>
            <div className="space-y-2">
              {Object.entries(stats.byLifecycle).map(([lifecycle, count]) => (
                <div key={lifecycle} className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                    {lifecycle}
                  </span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
          Quality Scorecard
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-2">
              <Award className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Average Score
              </div>
            </div>
            <div className="text-4xl font-bold text-gray-900 dark:text-gray-100">
              {scorecardStats.averageScore}
              <span className="text-lg text-gray-500 dark:text-gray-400 font-normal">/100</span>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
            <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Tier Distribution
            </div>
            <div className="space-y-2">
              {scorecardStats.tierDistribution.gold > 0 && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-yellow-700 dark:text-yellow-400">Gold</span>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">
                    {scorecardStats.tierDistribution.gold}
                  </span>
                </div>
              )}
              {scorecardStats.tierDistribution.silver > 0 && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Silver</span>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">
                    {scorecardStats.tierDistribution.silver}
                  </span>
                </div>
              )}
              {scorecardStats.tierDistribution.bronze > 0 && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-orange-700 dark:text-orange-400">Bronze</span>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">
                    {scorecardStats.tierDistribution.bronze}
                  </span>
                </div>
              )}
              {scorecardStats.tierDistribution['needs-improvement'] > 0 && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-red-700 dark:text-red-400">Needs Work</span>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">
                    {scorecardStats.tierDistribution['needs-improvement']}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
              <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Top Performers
              </div>
            </div>
            <div className="space-y-2">
              {scorecardStats.topPerformers.map((cws) => (
                <Link
                  key={cws.component.metadata.name}
                  href={`/catalog/${cws.component.metadata.name}`}
                  className="flex items-center justify-between text-sm hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  <span className="truncate">{cws.component.metadata.name}</span>
                  <span className="font-semibold text-gray-900 dark:text-gray-100 ml-2">
                    {cws.score.total}
                  </span>
                </Link>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
              <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Needs Attention
              </div>
            </div>
            <div className="space-y-2">
              {scorecardStats.needsAttention.map((cws) => (
                <Link
                  key={cws.component.metadata.name}
                  href={`/catalog/${cws.component.metadata.name}`}
                  className="flex items-center justify-between text-sm hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  <span className="truncate">{cws.component.metadata.name}</span>
                  <span className="font-semibold text-gray-900 dark:text-gray-100 ml-2">
                    {cws.score.total}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
            Components
          </h2>
          <Link
            href="/plugins/catalog"
            className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium"
          >
            View all →
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recentComponents.map((component) => (
            <Link
              key={component.metadata.name}
              href={`/catalog/${component.metadata.name}`}
              className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow cursor-pointer block"
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                {component.metadata.name}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                {component.metadata.description || "No description"}
              </p>
              <div className="flex flex-wrap gap-2 mb-3">
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    typeColors[component.spec.type] || "bg-gray-100 text-gray-800"
                  }`}
                >
                  {component.spec.type}
                </span>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    lifecycleColors[component.spec.lifecycle] || "bg-gray-100 text-gray-800"
                  }`}
                >
                  {component.spec.lifecycle}
                </span>
              </div>
              {component.metadata.tags && component.metadata.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {component.metadata.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
