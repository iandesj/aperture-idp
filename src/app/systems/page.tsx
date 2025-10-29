import { getAllSystems, getSystemStats } from "@/lib/catalog";
import Link from "next/link";
import { Box, Layers } from "lucide-react";

export default function SystemsPage() {
  const systems = getAllSystems();
  const stats = getSystemStats();

  const typeColors: Record<string, string> = {
    service: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    library: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
    website: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
  };

  const allSystemNames = [...systems];
  if (stats['uncategorized']) {
    allSystemNames.push('uncategorized');
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Systems
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          View your software architecture organized by system
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {allSystemNames.map((system) => {
          const systemStat = stats[system];
          const displayName = system === 'uncategorized' ? 'Uncategorized' : system;
          const href = system === 'uncategorized' ? '/systems/uncategorized' : `/systems/${system}`;

          return (
            <Link
              key={system}
              href={href}
              className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow cursor-pointer block"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                    <Layers className="w-6 h-6 text-blue-600 dark:text-blue-300" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {displayName}
                    </h3>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Box className="w-4 h-4" />
                  <span>
                    {systemStat.count} component{systemStat.count !== 1 ? 's' : ''}
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {Object.entries(systemStat.types).map(([type, count]) => (
                    <span
                      key={type}
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        typeColors[type] || "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                      }`}
                    >
                      {count} {type}
                    </span>
                  ))}
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {allSystemNames.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            No systems found in the catalog.
          </p>
          <p className="text-gray-500 dark:text-gray-500 text-sm mt-2">
            Add a system field to your component YAML files to organize them.
          </p>
        </div>
      )}
    </div>
  );
}

