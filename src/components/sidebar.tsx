import Link from "next/link";
import { getPlugins } from "@/lib/plugins";

export function Sidebar() {
  const plugins = getPlugins();

  return (
    <aside className="w-64 flex-shrink-0 border-r border-gray-200 bg-gray-50 p-4">
      <Link href="/" className="text-2xl font-bold text-gray-900">
        Aperture
      </Link>
      <nav className="mt-8">
        <ul>
          {plugins.map((plugin) => (
            <li key={plugin.id}>
              <Link
                href={`/plugins/${plugin.id}`}
                className="block py-2 text-gray-700 hover:text-gray-900"
              >
                {plugin.name}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
