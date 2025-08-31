'use client';

import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { PoseCard } from './PoseCard';
import { MasonryGrid } from '../layout/MasonryGrid';
import { useSearch } from '../../hooks/useSearch';
import { SearchBar } from '../search/SearchBar';
import { FilterBar } from '../search/FilterBar';

interface Pose {
  id: string;
  title: string;
  slug: string;
  theme: string;
  category?: string;
  tags?: string[];
  description?: string;
  safetyLevel: 'safe' | 'moderate' | 'adult';
  previewAsset?: {
    url: string;
    width: number;
    height: number;
  };
  variants?: Array<{
    id: string;
    title: string;
    previewUrl: string;
  }>;
  prompts?: {
    sdxl?: string;
    flux?: string;
  };
}

interface PoseGridProps {
  poses: Pose[];
  columns?: number;
  gap?: number;
  className?: string;
}

export function PoseGrid({ 
  poses, 
  columns = 3, 
  gap = 20, 
  className = '' 
}: PoseGridProps) {
  const [selectedSafetyLevels, setSelectedSafetyLevels] = useState<string[]>(['safe', 'moderate']);

  // Filter poses by safety level first
  const filteredPoses = useMemo(() => {
    return poses.filter(pose => 
      selectedSafetyLevels.includes(pose.safetyLevel)
    );
  }, [poses, selectedSafetyLevels]);

  // Initialize search hook
  const {
    query,
    searchResults,
    filters,
    availableFilters,
    search,
    clearSearch,
    toggleFilter,
    clearFilters,
    getSearchSuggestions,
    searchStats,
  } = useSearch(filteredPoses, {
    enableFuzzy: true,
    threshold: 0.3,
    minMatchCharLength: 2,
  });

  // Generate search suggestions
  const suggestions = useMemo(() => {
    return getSearchSuggestions(query);
  }, [query, getSearchSuggestions]);

  // Prepare filter groups for FilterBar
  const filterGroups = useMemo(() => [
    {
      key: 'themes',
      label: 'Theme',
      options: availableFilters.themes.map(theme => ({
        value: theme,
        label: theme,
        count: filteredPoses.filter(p => p.theme === theme).length,
      })),
      isMultiSelect: true,
    },
    {
      key: 'categories',
      label: 'Category',
      options: availableFilters.categories.map(category => ({
        value: category,
        label: category,
        count: filteredPoses.filter(p => p.category === category).length,
      })),
      isMultiSelect: true,
    },
    {
      key: 'safetyLevels',
      label: 'Safety',
      options: [
        { value: 'safe', label: 'Safe', count: poses.filter(p => p.safetyLevel === 'safe').length },
        { value: 'moderate', label: 'Moderate', count: poses.filter(p => p.safetyLevel === 'moderate').length },
        { value: 'adult', label: 'Adult', count: poses.filter(p => p.safetyLevel === 'adult').length },
      ],
      isMultiSelect: true,
    },
    {
      key: 'tags',
      label: 'Tags',
      options: availableFilters.tags.slice(0, 20).map(tag => ({
        value: tag,
        label: tag,
        count: filteredPoses.filter(p => p.tags?.includes(tag)).length,
      })),
      isMultiSelect: true,
    },
  ], [availableFilters, filteredPoses, poses]);

  // Handle safety level filter changes
  const handleSafetyFilterChange = (value: string) => {
    setSelectedSafetyLevels(prev => 
      prev.includes(value)
        ? prev.filter(level => level !== value)
        : [...prev, value]
    );
  };

  // Handle other filter changes
  const handleFilterChange = (filterKey: string, value: string) => {
    if (filterKey === 'safetyLevels') {
      handleSafetyFilterChange(value);
    } else {
      toggleFilter(filterKey as any, value);
    }
  };

  // Combine all active filters for display
  const allActiveFilters = {
    ...filters,
    safetyLevels: selectedSafetyLevels,
  };

  // Handle clear all filters
  const handleClearAllFilters = () => {
    clearFilters();
    setSelectedSafetyLevels(['safe', 'moderate']);
  };

  return (
    <div className={`w-full ${className}`}>
      {/* Search Bar */}
      <div className="mb-6">
        <SearchBar
          value={query}
          onChange={search}
          onClear={clearSearch}
          suggestions={suggestions}
          placeholder={`Search ${poses.length} poses...`}
          className="max-w-2xl mx-auto"
        />
      </div>

      {/* Filter Bar */}
      <FilterBar
        filterGroups={filterGroups}
        activeFilters={allActiveFilters}
        onFilterChange={handleFilterChange}
        onClearFilters={handleClearAllFilters}
        isSticky={true}
        className="mb-6"
      />

      {/* Results Summary */}
      <div className="mb-6 text-sm text-gray-600 text-center">
        {searchStats.hasQuery ? (
          <>
            Showing {searchStats.searchResults} of {searchStats.totalItems} poses
            {query && (
              <> for <span className="font-medium">"{query}"</span></>
            )}
          </>
        ) : (
          <>
            Showing {searchStats.searchResults} poses
            {searchStats.activeFilters > 0 && (
              <> with {searchStats.activeFilters} filter{searchStats.activeFilters > 1 ? 's' : ''} applied</>
            )}
          </>
        )}
      </div>

      {/* No Results */}
      {searchResults.length === 0 ? (
        <motion.div
          className="text-center py-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="text-gray-400 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No poses found</h3>
          <p className="text-gray-500 mb-6">
            {query 
              ? `Try adjusting your search term or filters` 
              : `Try adjusting your filters`
            }
          </p>
          {(query || searchStats.activeFilters > 0) && (
            <button
              onClick={() => {
                clearSearch();
                handleClearAllFilters();
              }}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              Clear all filters
            </button>
          )}
        </motion.div>
      ) : (
        /* Pose Grid */
        <MasonryGrid columns={columns} gap={gap}>
          {searchResults.map((pose) => (
            <PoseCard
              key={pose.id}
              pose={pose}
              showVariants={true}
              showSafetyBadge={true}
            />
          ))}
        </MasonryGrid>
      )}
    </div>
  );
}

export default PoseGrid;