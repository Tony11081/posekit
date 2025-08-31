'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import Fuse from 'fuse.js';

interface SearchableItem {
  id: string;
  title: string;
  theme: string;
  category?: string;
  tags?: string[];
  description?: string;
  safetyLevel?: 'safe' | 'moderate' | 'adult';
}

interface SearchFilters {
  themes: string[];
  categories: string[];
  safetyLevels: string[];
  tags: string[];
}

interface SearchOptions {
  enableFuzzy?: boolean;
  threshold?: number;
  includeScore?: boolean;
  minMatchCharLength?: number;
}

export function useSearch<T extends SearchableItem>(
  items: T[],
  options: SearchOptions = {}
) {
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<SearchFilters>({
    themes: [],
    categories: [],
    safetyLevels: [],
    tags: [],
  });
  const [isSearching, setIsSearching] = useState(false);

  const {
    enableFuzzy = true,
    threshold = 0.3,
    includeScore = false,
    minMatchCharLength = 2,
  } = options;

  // Configure Fuse.js
  const fuseOptions = useMemo(() => ({
    keys: [
      { name: 'title', weight: 0.4 },
      { name: 'theme', weight: 0.3 },
      { name: 'category', weight: 0.2 },
      { name: 'tags', weight: 0.3 },
      { name: 'description', weight: 0.1 },
    ],
    threshold,
    includeScore,
    minMatchCharLength,
    ignoreLocation: true,
    findAllMatches: true,
    shouldSort: true,
  }), [threshold, includeScore, minMatchCharLength]);

  // Initialize Fuse instance
  const fuse = useMemo(() => {
    if (!enableFuzzy || items.length === 0) return null;
    return new Fuse(items, fuseOptions);
  }, [items, fuseOptions, enableFuzzy]);

  // Filter items by criteria
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      // Theme filter
      if (filters.themes.length > 0 && !filters.themes.includes(item.theme)) {
        return false;
      }
      
      // Category filter
      if (filters.categories.length > 0 && item.category && !filters.categories.includes(item.category)) {
        return false;
      }
      
      // Safety level filter
      if (filters.safetyLevels.length > 0 && item.safetyLevel && !filters.safetyLevels.includes(item.safetyLevel)) {
        return false;
      }
      
      // Tags filter (any tag match)
      if (filters.tags.length > 0 && item.tags) {
        const hasMatchingTag = filters.tags.some(tag => 
          item.tags?.some(itemTag => 
            itemTag.toLowerCase().includes(tag.toLowerCase())
          )
        );
        if (!hasMatchingTag) return false;
      }
      
      return true;
    });
  }, [items, filters]);

  // Perform search
  const searchResults = useMemo(() => {
    if (!query.trim()) {
      return filteredItems;
    }

    if (enableFuzzy && fuse) {
      const results = fuse.search(query, { limit: 100 });
      const filteredResults = results
        .map(result => result.item)
        .filter(item => filteredItems.includes(item));
      
      return filteredResults;
    } else {
      // Simple text search fallback
      const lowerQuery = query.toLowerCase();
      return filteredItems.filter(item =>
        item.title.toLowerCase().includes(lowerQuery) ||
        item.theme.toLowerCase().includes(lowerQuery) ||
        item.category?.toLowerCase().includes(lowerQuery) ||
        item.tags?.some(tag => tag.toLowerCase().includes(lowerQuery)) ||
        item.description?.toLowerCase().includes(lowerQuery)
      );
    }
  }, [query, filteredItems, fuse, enableFuzzy]);

  // Search with debounce
  const searchWithDebounce = useCallback((searchQuery: string) => {
    setIsSearching(true);
    setQuery(searchQuery);
    
    // Simulate search delay for UX
    const timer = setTimeout(() => {
      setIsSearching(false);
    }, 200);
    
    return () => clearTimeout(timer);
  }, []);

  // Clear search
  const clearSearch = useCallback(() => {
    setQuery('');
    setIsSearching(false);
  }, []);

  // Filter management
  const addFilter = useCallback((type: keyof SearchFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [type]: [...prev[type], value],
    }));
  }, []);

  const removeFilter = useCallback((type: keyof SearchFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [type]: prev[type].filter(item => item !== value),
    }));
  }, []);

  const toggleFilter = useCallback((type: keyof SearchFilters, value: string) => {
    setFilters(prev => {
      const currentValues = prev[type];
      const isActive = currentValues.includes(value);
      
      return {
        ...prev,
        [type]: isActive
          ? currentValues.filter(item => item !== value)
          : [...currentValues, value],
      };
    });
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({
      themes: [],
      categories: [],
      safetyLevels: [],
      tags: [],
    });
  }, []);

  const clearAllFilters = useCallback(() => {
    setFilters({
      themes: [],
      categories: [],
      safetyLevels: [],
      tags: [],
    });
  }, []);

  // Get available filter options from items
  const availableFilters = useMemo(() => {
    const themes = new Set<string>();
    const categories = new Set<string>();
    const safetyLevels = new Set<string>();
    const tags = new Set<string>();

    items.forEach(item => {
      themes.add(item.theme);
      if (item.category) categories.add(item.category);
      if (item.safetyLevel) safetyLevels.add(item.safetyLevel);
      if (item.tags) item.tags.forEach(tag => tags.add(tag));
    });

    return {
      themes: Array.from(themes).sort(),
      categories: Array.from(categories).sort(),
      safetyLevels: Array.from(safetyLevels).sort(),
      tags: Array.from(tags).sort(),
    };
  }, [items]);

  // Search suggestions
  const getSearchSuggestions = useCallback((partial: string): string[] => {
    if (!partial.trim() || partial.length < 2) return [];
    
    const suggestions = new Set<string>();
    const lowerPartial = partial.toLowerCase();
    
    items.forEach(item => {
      // Title suggestions
      if (item.title.toLowerCase().includes(lowerPartial)) {
        suggestions.add(item.title);
      }
      
      // Theme suggestions
      if (item.theme.toLowerCase().includes(lowerPartial)) {
        suggestions.add(item.theme);
      }
      
      // Tag suggestions
      item.tags?.forEach(tag => {
        if (tag.toLowerCase().includes(lowerPartial)) {
          suggestions.add(tag);
        }
      });
    });
    
    return Array.from(suggestions).slice(0, 8);
  }, [items]);

  // Statistics
  const searchStats = useMemo(() => ({
    totalItems: items.length,
    filteredItems: filteredItems.length,
    searchResults: searchResults.length,
    activeFilters: Object.values(filters).flat().length,
    hasQuery: Boolean(query.trim()),
  }), [items.length, filteredItems.length, searchResults.length, filters, query]);

  return {
    // Search state
    query,
    isSearching,
    searchResults,
    
    // Search actions
    search: searchWithDebounce,
    setQuery,
    clearSearch,
    
    // Filter state
    filters,
    availableFilters,
    
    // Filter actions
    addFilter,
    removeFilter,
    toggleFilter,
    clearFilters,
    clearAllFilters,
    
    // Utilities
    getSearchSuggestions,
    searchStats,
    
    // Raw data
    filteredItems,
    allItems: items,
  };
}

export default useSearch;