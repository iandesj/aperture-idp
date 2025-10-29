import Link from "next/link";
import { getPlugins } from "@/lib/plugins";

export function Sidebar() {
  const plugins = getPlugins();

  return (
    <aside className="w-64 flex-shrink-0 border-r border-gray-200 bg-gray-50 p-4">
      <Link href="/" className="text-2xl font-bold">
        Aperture
      </Link>
      <nav className="mt-8">
        <ul>
          {plugins.map((plugin) => (
            <li key={plugin.id}>
              <Link href={`/plugins/${plugin.id}`} className="block py-2">
                {plugin.name}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
