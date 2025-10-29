import { getComponentByName, getAllComponents } from "@/lib/catalog";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";

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
    <div className="max-w-4xl space-y-6">
      <Link
        href="/plugins/catalog"
        className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Catalog
      </Link>

      <div>
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          {component.metadata.name}
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          {component.metadata.description || "No description provided"}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Component Details
          </h2>
          <dl className="space-y-3">
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Type</dt>
              <dd className="mt-1">
                <span
                  className={`inline-flex px-2 py-1 rounded text-xs font-medium ${
                    typeColors[component.spec.type] || "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                  }`}
                >
                  {component.spec.type}
                </span>
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Lifecycle</dt>
              <dd className="mt-1">
                <span
                  className={`inline-flex px-2 py-1 rounded text-xs font-medium ${
                    lifecycleColors[component.spec.lifecycle] || "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                  }`}
                >
                  {component.spec.lifecycle}
                </span>
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Owner</dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                {component.spec.owner}
              </dd>
            </div>
            {component.spec.system && (
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">System</dt>
                <dd className="mt-1">
                  <Link
                    href={`/systems/${component.spec.system}`}
                    className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
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
                  className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-sm"
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
          <div className="space-y-2">
            {component.metadata.links.map((link, idx) => (
              <a
                key={idx}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm"
              >
                <ExternalLink className="w-4 h-4" />
                {link.title || link.url}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

