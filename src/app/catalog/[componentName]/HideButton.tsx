'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { EyeOff } from 'lucide-react';

interface HideButtonProps {
  componentName: string;
}

export function HideButton({ componentName }: HideButtonProps) {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleHide = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/catalog/hide', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ componentName }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to hide component');
      }

      router.push('/plugins/catalog');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setIsLoading(false);
    }
  };

  if (!isConfirmOpen) {
    return (
      <button
        onClick={() => setIsConfirmOpen(true)}
        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-700 bg-red-50 border border-red-300 rounded-lg hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-900/30 transition-colors"
      >
        <EyeOff className="w-4 h-4" />
        Hide Component
      </button>
    );
  }

  return (
    <div className="inline-flex items-center gap-3 p-4 bg-red-50 border border-red-300 rounded-lg dark:bg-red-900/20 dark:border-red-800">
      <div className="flex-1">
        <p className="text-sm font-medium text-red-900 dark:text-red-200">
          Are you sure you want to hide this component?
        </p>
        <p className="text-xs text-red-700 dark:text-red-300 mt-1">
          It will be removed from the catalog but can be restored later from the hidden components page.
        </p>
        {error && (
          <p className="text-xs text-red-600 dark:text-red-400 mt-2 font-medium">
            {error}
          </p>
        )}
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => {
            setIsConfirmOpen(false);
            setError(null);
          }}
          disabled={isLoading}
          className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          onClick={handleHide}
          disabled={isLoading}
          className="px-3 py-1.5 text-sm font-medium text-white bg-red-600 rounded hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 transition-colors disabled:opacity-50"
        >
          {isLoading ? 'Hiding...' : 'Yes, Hide'}
        </button>
      </div>
    </div>
  );
}

