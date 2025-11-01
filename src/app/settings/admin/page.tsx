'use client';

import { useEffect, useState } from 'react';
import { ArrowLeft, Settings, GitBranch, Award } from 'lucide-react';
import Link from 'next/link';
import { FeatureFlag } from '@/lib/features/store';

interface Features {
  gitActivityEnabled: boolean;
  scoringEnabled: boolean;
}

export default function AdminSettingsPage() {
  const [features, setFeatures] = useState<Features | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    fetchFeatures();
  }, []);

  const fetchFeatures = async () => {
    try {
      const response = await fetch('/api/settings/features');
      if (response.ok) {
        const data = await response.json();
        setFeatures(data.features);
      }
    } catch (error) {
      console.error('Failed to fetch features:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleFeature = async (feature: FeatureFlag) => {
    if (!features) return;

    setUpdating(feature);
    try {
      const newValue = !features[feature];
      const response = await fetch('/api/settings/features', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          feature,
          enabled: newValue,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setFeatures(data.features);
      } else {
        console.error('Failed to update feature');
      }
    } catch (error) {
      console.error('Failed to update feature:', error);
    } finally {
      setUpdating(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-gray-600 dark:text-gray-400">Loading...</div>
      </div>
    );
  }

  if (!features) {
    return (
      <div className="space-y-6">
        <div className="text-red-600 dark:text-red-400">Failed to load settings</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link
        href="/settings/hidden"
        className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Settings
      </Link>

      <div>
        <div className="flex items-center gap-3 mb-2">
          <Settings className="w-8 h-8 text-gray-900 dark:text-gray-100" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Admin Settings
          </h1>
        </div>
        <p className="text-gray-600 dark:text-gray-400">
          Enable or disable features across the application.
        </p>
      </div>

      <div className="space-y-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <GitBranch className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Git Activity
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Show repository activity metrics, commit history, and related information for components.
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={features.gitActivityEnabled}
                onChange={() => toggleFeature('gitActivityEnabled')}
                disabled={updating === 'gitActivityEnabled'}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Award className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Component Scoring
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Calculate and display quality scores, tiers, and improvement suggestions for components.
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={features.scoringEnabled}
                onChange={() => toggleFeature('scoringEnabled')}
                disabled={updating === 'scoringEnabled'}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
