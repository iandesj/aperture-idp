import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { getGroupByRef, normalizeGroupRef } from "@/lib/groups";
import { getComponentsByGroupRef, getGroupAverageScore, getGroupStats } from "@/lib/catalog";
import { ScoreBadge } from "@/components/ScoreBadge";
import { calculateComponentScore } from "@/lib/scoring";

interface Params {
  params: Promise<{ groupName: string }>;
}

export default async function TeamDetailPage({ params }: Params) {
  const { groupName: name } = await params;
  const ref = normalizeGroupRef(`group:${name}`);
  const group = getGroupByRef(ref);
  if (!group) return notFound();

  const stats = getGroupStats(ref);
  const avg = getGroupAverageScore(ref);
  const components = getComponentsByGroupRef(ref);

  return (
    <div className="space-y-6">
      <Link
        href="/teams"
        className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Teams
      </Link>
      <div>
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">{group.metadata.name}</h1>
        {group.metadata.description && (
          <p className="text-lg text-gray-600 dark:text-gray-400">{group.metadata.description}</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
          <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Components</div>
          <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">{stats.total}</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
          <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Average Score</div>
          <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">{avg}<span className="text-lg text-gray-500 dark:text-gray-400 font-normal">/100</span></div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
          <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">By Type</div>
          <div className="flex flex-wrap gap-2">
            {Object.entries(stats.byType).map(([type, count]) => (
              <span key={type} className="px-2 py-1 rounded text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                {count} {type}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Owned Components</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {components.map((component) => (
            <Link
              key={component.metadata.name}
              href={`/catalog/${component.metadata.name}`}
              className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow cursor-pointer block"
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{component.metadata.name}</h3>
                <ScoreBadge score={calculateComponentScore(component)} size="sm" />
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{component.metadata.description || "No description"}</p>
              <div className="flex flex-wrap gap-2 mb-3">
                <span className="px-2 py-1 rounded text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">{component.spec.type}</span>
                <span className="px-2 py-1 rounded text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">{component.spec.lifecycle}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}


