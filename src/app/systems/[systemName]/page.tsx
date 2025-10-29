import { getAllSystems, getComponentsBySystem, getAllComponents } from "@/lib/catalog";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export async function generateStaticParams() {
  const systems = getAllSystems();
  const params = systems.map((system) => ({
    systemName: system,
  }));
  
  // Add uncategorized if there are components without a system
  const allComponents = getAllComponents();
  const hasUncategorized = allComponents.some((c) => !c.spec.system);
  if (hasUncategorized) {
    params.push({ systemName: 'uncategorized' });
  }
  
  return params;
}

export default async function SystemDetailPage({
  params,
}: {
  params: Promise<{ systemName: string }>;
}) {
  const { systemName } = await params;
  const displayName = systemName === 'uncategorized' ? 'Uncategorized' : systemName;
  
  let components;
  if (systemName === 'uncategorized') {
    const allComponents = getAllComponents();
    components = allComponents.filter((c) => !c.spec.system);
  } else {
    components = getComponentsBySystem(systemName);
  }

  if (components.length === 0 && systemName !== 'uncategorized') {
    notFound();
  }

  // Group components by type
  const componentsByType: Record<string, typeof components> = {};
  components.forEach((component) => {
    const type = component.spec.type;
    if (!componentsByType[type]) {
      componentsByType[type] = [];
    }
    componentsByType[type].push(component);
  });

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
      <Link
        href="/systems"
        className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Systems
      </Link>

      <div>
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          {displayName}
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          {components.length} component{components.length !== 1 ? 's' : ''} in this system
        </p>
      </div>

      {Object.entries(componentsByType).map(([type, typeComponents]) => (
        <div key={type}>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4 capitalize">
            {type}s
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {typeComponents.map((component) => (
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
                {component.metadata.tags && component.metadata.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {component.metadata.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs"
                      >
                        {tag}
                      </span>
                    ))}
                    {component.metadata.tags.length > 3 && (
                      <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs">
                        +{component.metadata.tags.length - 3}
                      </span>
                    )}
                  </div>
                )}
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

