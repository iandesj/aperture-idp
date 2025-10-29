'use client';

import { useState, useMemo } from "react";
import Link from "next/link";
import { Component } from "../types";
import { Search, X } from "lucide-react";

interface CatalogPageProps {
  components: Component[];
}

export function CatalogPage({ components: allComponents }: CatalogPageProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedLifecycles, setSelectedLifecycles] = useState<string[]>([]);

  const availableTypes = useMemo(() => {
    return Array.from(new Set(allComponents.map((c) => c.spec.type))).sort();
  }, [allComponents]);

  const availableLifecycles = useMemo(() => {
    return Array.from(new Set(allComponents.map((c) => c.spec.lifecycle))).sort();
  }, [allComponents]);

  const filteredComponents = useMemo(() => {
    return allComponents.filter((component) => {
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

      return matchesSearch && matchesType && matchesLifecycle;
    });
  }, [allComponents, searchQuery, selectedTypes, selectedLifecycles]);

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

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedTypes([]);
    setSelectedLifecycles([]);
  };

  const hasActiveFilters =
    searchQuery !== "" || selectedTypes.length > 0 || selectedLifecycles.length > 0;

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
          {filteredComponents.map((component) => (
            <Link
              key={component.metadata.name}
              href={`/catalog/${component.metadata.name}`}
              className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow cursor-pointer block"
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                {component.metadata.name}
              </h3>
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
              <div className="text-xs text-gray-500 dark:text-gray-500">
                Owner: {component.spec.owner}
              </div>
              {component.metadata.links && component.metadata.links.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                  {component.metadata.links.map((link, idx) => (
                    <a
                      key={idx}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 block"
                    >
                      {link.title || link.url}
                    </a>
                  ))}
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
