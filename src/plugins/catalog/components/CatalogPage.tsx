'use client';

import { useState, useMemo } from "react";
import Link from "next/link";
import { Component } from "../types";
import { Search, X, Github, HardDrive, GitlabIcon as Gitlab, ArrowUpDown } from "lucide-react";
import { CatalogImport } from "@/components/CatalogImport";
import { ScoreBadge } from "@/components/ScoreBadge";
import { calculateComponentScore, ScoreTier } from "@/lib/scoring";

interface ComponentWithSource extends Component {
  _source?: 'local' | 'github' | 'gitlab';
}

interface CatalogPageProps {
  components: ComponentWithSource[];
  scoringEnabled?: boolean;
}

export function CatalogPage({ components: allComponents, scoringEnabled = true }: CatalogPageProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedLifecycles, setSelectedLifecycles] = useState<string[]>([]);
  const [selectedTiers, setSelectedTiers] = useState<ScoreTier[]>([]);
  const [sortBy, setSortBy] = useState<'name' | 'score-high' | 'score-low'>('name');

  const availableTypes = useMemo(() => {
    return Array.from(new Set(allComponents.map((c) => c.spec.type))).sort();
  }, [allComponents]);

  const availableLifecycles = useMemo(() => {
    return Array.from(new Set(allComponents.map((c) => c.spec.lifecycle))).sort();
  }, [allComponents]);

  const filteredComponents = useMemo(() => {
    const withScores = allComponents.map((component) => ({
      component,
      score: calculateComponentScore(component, undefined, {
        scoringEnabled,
        gitActivityEnabled: true,
      }),
    }));

    let filtered = withScores.filter(({ component, score }) => {
      const matchesSearch =
        searchQuery === "" ||
        component.metadata.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        component.metadata.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        component.metadata.tags?.some((tag) =>
          tag.toLowerCase().includes(searchQuery.toLowerCase())
        );

      const matchesType =
        selectedTypes.length === 0 || selectedTypes.includes(component.spec.type);

      const matchesLifecycle =
        selectedLifecycles.length === 0 ||
        selectedLifecycles.includes(component.spec.lifecycle);

      const matchesTier =
        !scoringEnabled || selectedTiers.length === 0 || selectedTiers.includes(score.tier);

      return matchesSearch && matchesType && matchesLifecycle && matchesTier;
    });

    if (scoringEnabled) {
      if (sortBy === 'score-high') {
        filtered = filtered.sort((a, b) => b.score.total - a.score.total);
      } else if (sortBy === 'score-low') {
        filtered = filtered.sort((a, b) => a.score.total - b.score.total);
      } else {
        filtered = filtered.sort((a, b) =>
          a.component.metadata.name.localeCompare(b.component.metadata.name)
        );
      }
    } else {
      filtered = filtered.sort((a, b) =>
        a.component.metadata.name.localeCompare(b.component.metadata.name)
      );
    }

    return filtered;
  }, [allComponents, searchQuery, selectedTypes, selectedLifecycles, selectedTiers, sortBy, scoringEnabled]);

  const toggleType = (type: string) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const toggleLifecycle = (lifecycle: string) => {
    setSelectedLifecycles((prev) =>
      prev.includes(lifecycle) ? prev.filter((l) => l !== lifecycle) : [...prev, lifecycle]
    );
  };

  const toggleTier = (tier: ScoreTier) => {
    setSelectedTiers((prev) =>
      prev.includes(tier) ? prev.filter((t) => t !== tier) : [...prev, tier]
    );
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedTypes([]);
    setSelectedLifecycles([]);
    setSelectedTiers([]);
    setSortBy('name');
  };

  const hasActiveFilters =
    searchQuery !== "" || selectedTypes.length > 0 || selectedLifecycles.length > 0 || selectedTiers.length > 0 || sortBy !== 'name';

  const lifecycleColors: Record<string, string> = {
    production: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    experimental: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    deprecated: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  };

  const typeColors: Record<string, string> = {
    service: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    library: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
    website: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Software Catalog
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Browse and discover all software components
        </p>
      </div>

      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by name, description, or tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          />
        </div>

        <div className="flex flex-wrap gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Type
            </label>
            <div className="flex flex-wrap gap-2">
              {availableTypes.map((type) => (
                <button
                  key={type}
                  onClick={() => toggleType(type)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    selectedTypes.includes(type)
                      ? typeColors[type] || "bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Lifecycle
            </label>
            <div className="flex flex-wrap gap-2">
              {availableLifecycles.map((lifecycle) => (
                <button
                  key={lifecycle}
                  onClick={() => toggleLifecycle(lifecycle)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    selectedLifecycles.includes(lifecycle)
                      ? lifecycleColors[lifecycle] || "bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
                  }`}
                >
                  {lifecycle}
                </button>
              ))}
            </div>
          </div>

          {scoringEnabled && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Quality Tier
              </label>
              <div className="flex flex-wrap gap-2">
                {(['gold', 'silver', 'bronze', 'needs-improvement'] as ScoreTier[]).map((tier) => {
                const tierColors = {
                  gold: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
                  silver: 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
                  bronze: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
                  'needs-improvement': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
                };
                const tierLabels = {
                  gold: 'Gold',
                  silver: 'Silver',
                  bronze: 'Bronze',
                  'needs-improvement': 'Needs Work',
                };
                return (
                  <button
                    key={tier}
                    onClick={() => toggleTier(tier)}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                      selectedTiers.includes(tier)
                        ? tierColors[tier]
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
                    }`}
                  >
                    {tierLabels[tier]}
                  </button>
                );
              })}
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Sort By
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSortBy('name')}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors flex items-center gap-1 ${
                  sortBy === 'name'
                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'
                }`}
              >
                Name
              </button>
              {scoringEnabled && (
                <>
                  <button
                    onClick={() => setSortBy('score-high')}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors flex items-center gap-1 ${
                      sortBy === 'score-high'
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'
                    }`}
                  >
                    <ArrowUpDown className="w-3 h-3" />
                    Score: High
                  </button>
                  <button
                    onClick={() => setSortBy('score-low')}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors flex items-center gap-1 ${
                      sortBy === 'score-low'
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'
                    }`}
                  >
                    <ArrowUpDown className="w-3 h-3" />
                    Score: Low
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
          <CatalogImport />
        </div>

        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {filteredComponents.length} component{filteredComponents.length !== 1 ? "s" : ""}{" "}
            {hasActiveFilters && "found"}
          </p>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            >
              <X className="w-4 h-4" />
              Clear filters
            </button>
          )}
        </div>
      </div>

      {allComponents.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            No components in the catalog yet.
          </p>
          <p className="text-gray-500 dark:text-gray-500 text-sm mt-2">
            Add component YAML files to the catalog-data directory to get started.
          </p>
        </div>
      ) : filteredComponents.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            No components match your filters.
          </p>
          <p className="text-gray-500 dark:text-gray-500 text-sm mt-2">
            Try adjusting your search or clearing filters.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredComponents.map(({ component, score }) => {
            const source = component._source;
            return (
              <Link
                key={component.metadata.name}
                href={`/catalog/${component.metadata.name}`}
                className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow cursor-pointer block"
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {component.metadata.name}
                  </h3>
                  <div className="flex items-center gap-2">
                    {scoringEnabled && <ScoreBadge score={score} size="sm" />}
                    {source === 'github' && (
                      <div className="flex items-center gap-1 px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs text-gray-600 dark:text-gray-400">
                        <Github className="w-3 h-3" />
                        <span>GitHub</span>
                      </div>
                    )}
                    {source === 'gitlab' && (
                      <div className="flex items-center gap-1 px-2 py-0.5 bg-orange-100 dark:bg-orange-900/20 rounded text-xs text-orange-700 dark:text-orange-400">
                        <Gitlab className="w-3 h-3" />
                        <span>GitLab</span>
                      </div>
                    )}
                    {source === 'local' && (
                      <div className="flex items-center gap-1 px-2 py-0.5 bg-blue-100 dark:bg-blue-900/20 rounded text-xs text-blue-700 dark:text-blue-400">
                        <HardDrive className="w-3 h-3" />
                        <span>Local</span>
                      </div>
                    )}
                  </div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  {component.metadata.description || "No description"}
                </p>
                <div className="flex flex-wrap gap-2 mb-3">
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      typeColors[component.spec.type] || "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                    }`}
                  >
                    {component.spec.type}
                  </span>
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      lifecycleColors[component.spec.lifecycle] || "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                    }`}
                  >
                    {component.spec.lifecycle}
                  </span>
                </div>
                {component.metadata.tags && component.metadata.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {component.metadata.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                <div className="text-xs text-gray-500 dark:text-gray-500 mt-3">
                  Owner: {component.spec.owner}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
