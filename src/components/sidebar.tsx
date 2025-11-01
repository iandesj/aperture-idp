'use client';

import { useSession, signOut } from "next-auth/react";
import { LogOut, User } from "lucide-react";
import { SidebarContent } from "./sidebar-content";

export function Sidebar() {
  const { data: session } = useSession();

  return (
    <aside className="w-64 flex-shrink-0 border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-4 flex flex-col">
      <SidebarContent />
      {session?.user && (
        <div className="mt-auto pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-3 text-sm text-gray-700 dark:text-gray-300">
            <User className="w-4 h-4" />
            <span className="truncate">{session.user.name || session.user.email}</span>
          </div>
          <button
            onClick={async () => {
              // Invalidate the token before signing out
              try {
                await fetch('/api/auth/invalidate-token', {
                  method: 'POST',
                  credentials: 'include',
                });
              } catch (error) {
                // Continue with signout even if invalidation fails
                console.error('Failed to invalidate token:', error);
              }
              // Always sign out regardless of invalidation result
              await signOut({ callbackUrl: '/login' });
            }}
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
