'use client';

import Link from "next/link";
import { useSession } from "next-auth/react";

const pluginMetadata = [
  { id: "catalog", name: "Software Catalog" },
  { id: "systems", name: "Systems" },
  { id: "teams", name: "Teams" },
] as const;

export function SidebarContent() {
  const { data: session } = useSession();
  const isAuthenticated = !!session?.user;

  return (
    <>
      <Link href="/" className="text-2xl font-bold text-gray-900 dark:text-gray-100">
        Aperture
      </Link>
      {isAuthenticated ? (
        <nav className="mt-8 flex-1">
          <div className="mb-6">
            <h3 className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-2">
              Navigation
            </h3>
            <ul>
              <li>
                <Link
                  href="/systems"
                  className="block py-2 text-gray-900 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 font-medium"
                >
                  Systems
                </Link>
              </li>
              <li>
                <Link
                  href="/teams"
                  className="block py-2 text-gray-900 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 font-medium"
                >
                  Teams
                </Link>
              </li>
            </ul>
          </div>
          <div className="mb-6">
            <h3 className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-2">
              Plugins
            </h3>
            <ul>
              {pluginMetadata.map((plugin) => (
                <li key={plugin.id}>
                  <Link
                    href={`/plugins/${plugin.id}`}
                    className="block py-2 text-gray-900 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 font-medium"
                  >
                    {plugin.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-2">
              Settings
            </h3>
            <ul>
              <li>
                <Link
                  href="/settings/hidden"
                  className="block py-2 text-gray-900 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 font-medium"
                >
                  Hidden Components
                </Link>
              </li>
            </ul>
          </div>
        </nav>
      ) : (
        <div className="mt-8">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Your internal developer portal for managing and discovering software components.
          </p>
        </div>
      )}
    </>
  );
}

