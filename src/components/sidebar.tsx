'use client';

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { getPlugins } from "@/lib/plugins";
import { LogOut, User } from "lucide-react";

export function Sidebar() {
  const { data: session } = useSession();
  const plugins = getPlugins();

  return (
    <aside className="w-64 flex-shrink-0 border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-4 flex flex-col">
      <Link href="/" className="text-2xl font-bold text-gray-900 dark:text-gray-100">
        Aperture
      </Link>
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
            {plugins.map((plugin) => (
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
      {session?.user && (
        <div className="mt-auto pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-3 text-sm text-gray-700 dark:text-gray-300">
            <User className="w-4 h-4" />
            <span className="truncate">{session.user.name || session.user.email}</span>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      )}
    </aside>
  );
}
