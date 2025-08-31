'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface FilterOption {
  value: string;
  label: string;
  count?: number;
}

interface FilterGroup {
  key: string;
  label: string;
  options: FilterOption[];
  isMultiSelect?: boolean;
}

interface FilterBarProps {
  filterGroups: FilterGroup[];
  activeFilters: Record<string, string[]>;
  onFilterChange: (filterKey: string, value: string) => void;
  onClearFilters: () => void;
  isSticky?: boolean;
  className?: string;
}

export function FilterBar({
  filterGroups,
  activeFilters,
  onFilterChange,
  onClearFilters,
  isSticky = true,
  className = '',
}: FilterBarProps) {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  
  const totalActiveFilters = Object.values(activeFilters).flat().length;

  // Handle dropdown toggle
  const toggleDropdown = (filterKey: string) => {
    setOpenDropdown(openDropdown === filterKey ? null : filterKey);
  };

  // Handle filter selection
  const handleFilterSelect = (filterKey: string, value: string) => {
    onFilterChange(filterKey, value);
    
    // Close dropdown for single-select filters
    const filterGroup = filterGroups.find(g => g.key === filterKey);
    if (!filterGroup?.isMultiSelect) {
      setOpenDropdown(null);
    }
  };

  // Check if filter is active
  const isFilterActive = (filterKey: string, value: string) => {
    return activeFilters[filterKey]?.includes(value) || false;
  };

  // Get active count for filter group
  const getActiveCount = (filterKey: string) => {
    return activeFilters[filterKey]?.length || 0;
  };

  return (
    <div
      className={`
        bg-white border-b border-gray-200 z-40
        ${isSticky ? 'sticky top-0' : ''}
        ${className}
      `}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            {/* Filter Buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              {filterGroups.map((group) => {
                const activeCount = getActiveCount(group.key);
                
                return (
                  <div key={group.key} className="relative">
                    <button
                      onClick={() => toggleDropdown(group.key)}
                      className={`
                        inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg
                        border transition-all duration-200
                        ${activeCount > 0
                          ? 'bg-blue-50 border-blue-200 text-blue-700'
                          : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                        }
                        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                      `}
                    >
                      <span>{group.label}</span>
                      {activeCount > 0 && (
                        <span className="ml-2 inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold bg-blue-100 text-blue-800 rounded-full">
                          {activeCount}
                        </span>
                      )}
                      <svg
                        className={`ml-2 h-4 w-4 transition-transform ${
                          openDropdown === group.key ? 'rotate-180' : ''
                        }`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </button>

                    {/* Dropdown */}
                    <AnimatePresence>
                      {openDropdown === group.key && (
                        <motion.div
                          className="absolute top-full left-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50"
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.15 }}
                        >
                          <div className="max-h-60 overflow-y-auto py-2">
                            {group.options.map((option) => {
                              const isActive = isFilterActive(group.key, option.value);
                              
                              return (
                                <button
                                  key={option.value}
                                  onClick={() => handleFilterSelect(group.key, option.value)}
                                  className={`
                                    w-full px-4 py-2 text-sm text-left transition-colors
                                    hover:bg-gray-50 focus:bg-gray-50 focus:outline-none
                                    ${isActive ? 'text-blue-700 bg-blue-50' : 'text-gray-900'}
                                  `}
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center">
                                      {group.isMultiSelect && (
                                        <div className={`
                                          w-4 h-4 mr-3 border-2 rounded flex items-center justify-center
                                          ${isActive 
                                            ? 'border-blue-500 bg-blue-500' 
                                            : 'border-gray-300'
                                          }
                                        `}>
                                          {isActive && (
                                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                              <path
                                                fillRule="evenodd"
                                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                                clipRule="evenodd"
                                              />
                                            </svg>
                                          )}
                                        </div>
                                      )}
                                      <span className="flex-1">{option.label}</span>
                                    </div>
                                    {option.count !== undefined && (
                                      <span className="text-xs text-gray-500">
                                        {option.count}
                                      </span>
                                    )}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>

            {/* Clear Filters Button */}
            {totalActiveFilters > 0 && (
              <motion.button
                onClick={onClearFilters}
                className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
              >
                <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
                Clear filters ({totalActiveFilters})
              </motion.button>
            )}
          </div>

          {/* Active Filters Pills */}
          {totalActiveFilters > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {Object.entries(activeFilters).map(([filterKey, values]) =>
                values.map((value) => {
                  const group = filterGroups.find(g => g.key === filterKey);
                  const option = group?.options.find(o => o.value === value);
                  
                  return (
                    <motion.span
                      key={`${filterKey}-${value}`}
                      className="inline-flex items-center px-3 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                    >
                      <span className="mr-1 text-blue-600">{group?.label}:</span>
                      {option?.label || value}
                      <button
                        onClick={() => handleFilterSelect(filterKey, value)}
                        className="ml-2 inline-flex items-center justify-center w-4 h-4 text-blue-400 hover:text-blue-600"
                      >
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                    </motion.span>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>

      {/* Click outside to close dropdowns */}
      {openDropdown && (
        <div
          className="fixed inset-0 z-30"
          onClick={() => setOpenDropdown(null)}
        />
      )}
    </div>
  );
}

export default FilterBar;