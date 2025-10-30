import { getHiddenComponentsWithData, getComponentSource } from "@/lib/catalog";
import { Eye, EyeOff, ArrowLeft, Package } from "lucide-react";
import Link from "next/link";
import { UnhideButton } from "./UnhideButton";

export default async function HiddenComponentsPage() {
  const hiddenComponents = getHiddenComponentsWithData();

  return (
    <div className="space-y-6">
      <Link
        href="/plugins/catalog"
        className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Catalog
      </Link>

      <div>
        <div className="flex items-center gap-3 mb-2">
          <EyeOff className="w-8 h-8 text-gray-900 dark:text-gray-100" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Hidden Components
          </h1>
        </div>
        <p className="text-gray-600 dark:text-gray-400">
          Components that have been hidden from the catalog. You can restore them at any time.
        </p>
      </div>

      {hiddenComponents.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 border border-gray-200 dark:border-gray-700 text-center">
          <Package className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            No Hidden Components
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            All components are currently visible in the catalog.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {hiddenComponents.length} hidden {hiddenComponents.length === 1 ? 'component' : 'components'}
          </div>

          <div className="grid grid-cols-1 gap-4">
            {hiddenComponents.map((component) => {
              const source = getComponentSource(component.metadata.name);
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
                <div
                  key={component.metadata.name}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                          {component.metadata.name}
                        </h3>
                        {source && (
                          <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded text-xs font-medium">
                            {source}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        {component.metadata.description || "No description"}
                      </p>
                      <div className="flex flex-wrap gap-2 mb-3">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            typeColors[component.spec.type] || "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                          }`}
                        >
                          {component.spec.type}
                        </span>
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            lifecycleColors[component.spec.lifecycle] || "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                          }`}
                        >
                          {component.spec.lifecycle}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-500">
                        Owner: {component.spec.owner}
                      </div>
                    </div>
                    <UnhideButton componentName={component.metadata.name} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

