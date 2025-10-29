'use client';

import { useState, useEffect } from 'react';
import { RefreshCw, Check, AlertCircle, Download } from 'lucide-react';

interface ImportStats {
  total: number;
  repositories: number;
  lastSync: string | null;
}

interface ImportResult {
  success: number;
  failed: number;
  skipped: number;
  total: number;
  errors: Array<{
    repository: string;
    error: string;
  }>;
}

export function CatalogImport() {
  const [isImporting, setIsImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [stats, setStats] = useState<ImportStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/catalog/import');
      const data = await response.json();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (err) {
      console.error('Failed to fetch import stats:', err);
    }
  };

  const handleImport = async () => {
    setIsImporting(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/catalog/import', {
        method: 'POST',
      });

      const data = await response.json();

      if (data.success) {
        setResult(data.result);
        setStats(data.stats);
      } else {
        setError(data.error || 'Import failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import');
    } finally {
      setIsImporting(false);
    }
  };

  // Fetch stats on mount
  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <button
          onClick={handleImport}
          disabled={isImporting}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors text-sm font-medium"
        >
          {isImporting ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              Importing...
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              Import from GitHub
            </>
          )}
        </button>

        {stats && stats.lastSync && (
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Last synced: {new Date(stats.lastSync).toLocaleString()}
          </span>
        )}
      </div>

      {stats && stats.total > 0 && (
        <div className="flex gap-4 text-sm">
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
            <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
            <span>
              {stats.total} imported component{stats.total !== 1 ? 's' : ''} from{' '}
              {stats.repositories} {stats.repositories !== 1 ? 'repositories' : 'repository'}
            </span>
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-red-900 dark:text-red-200">Import Error</p>
              <p className="text-sm text-red-700 dark:text-red-300 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {result && (
        <div className="p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-medium text-gray-900 dark:text-gray-100">
              Import Results
            </span>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {result.total} {result.total !== 1 ? 'repositories' : 'repository'} processed
            </span>
          </div>

          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {result.success}
              </div>
              <div className="text-gray-600 dark:text-gray-400">Success</div>
            </div>
            <div className="text-center p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
              <div className="text-2xl font-bold text-gray-600 dark:text-gray-400">
                {result.skipped}
              </div>
              <div className="text-gray-600 dark:text-gray-400">Skipped</div>
            </div>
            <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                {result.failed}
              </div>
              <div className="text-gray-600 dark:text-gray-400">Failed</div>
            </div>
          </div>

          {result.errors.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Errors:</p>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {result.errors.map((err, idx) => (
                  <div
                    key={idx}
                    className="text-xs p-2 bg-white dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700"
                  >
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {err.repository}:
                    </span>{' '}
                    <span className="text-gray-600 dark:text-gray-400">{err.error}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

