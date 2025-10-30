"use client";

import Link from "next/link";
import { Users, Award } from "lucide-react";

interface TeamItem {
  name: string;
  description: string;
  ref: string;
  stats: { total: number; byType: Record<string, number>; byLifecycle: Record<string, number> };
  averageScore: number;
  href: string;
}

export function TeamsPage({ items }: { items: TeamItem[] }) {
  const displayGroups = items;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">Teams</h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">Browse teams and their owned components</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {displayGroups.map((group) => {
          return (
            <Link
              key={group.ref}
              href={group.href}
              className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow cursor-pointer block"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-100 dark:bg-indigo-900 rounded-lg">
                    <Users className="w-6 h-6 text-indigo-600 dark:text-indigo-300" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {group.name}
                    </h3>
                    {group.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{group.description}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Users className="w-4 h-4" />
                  <span>{group.stats.total} component{group.stats.total !== 1 ? 's' : ''}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Award className="w-4 h-4" />
                  <span>Avg score: <span className="font-semibold text-gray-900 dark:text-gray-100">{group.averageScore}</span></span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {displayGroups.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400 text-lg">No teams found.</p>
          <p className="text-gray-500 dark:text-gray-500 text-sm mt-2">Add Backstage Group entities to your catalog-data to get started.</p>
        </div>
      )}
    </div>
  );
}


