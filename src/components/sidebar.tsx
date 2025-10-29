import Link from "next/link";
import { getPlugins } from "@/lib/plugins";

export function Sidebar() {
  const plugins = getPlugins();

  return (
    <aside className="w-64 flex-shrink-0 border-r border-gray-200 bg-gray-50 p-4">
      <Link href="/" className="text-2xl font-bold text-gray-900 dark:text-gray-100">
        Aperture
      </Link>
      <nav className="mt-8">
        <div className="mb-6">
          <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
            Navigation
          </h3>
          <ul>
            <li>
              <Link
                href="/systems"
                className="block py-2 text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100"
              >
                Systems
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
            Plugins
          </h3>
          <ul>
            {plugins.map((plugin) => (
              <li key={plugin.id}>
                <Link
                  href={`/plugins/${plugin.id}`}
                  className="block py-2 text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100"
                >
                  {plugin.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </nav>
    </aside>
  );
}
