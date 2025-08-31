'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFavorites } from '../../hooks/useFavorites';
import { PoseCard } from '../pose/PoseCard';
import { MasonryGrid } from '../layout/MasonryGrid';
import { SearchBar } from '../search/SearchBar';

interface FavoritesManagerProps {
  className?: string;
}

export function FavoritesManager({ className = '' }: FavoritesManagerProps) {
  const {
    getAllFavorites,
    getFavoritesByTheme,
    searchFavorites,
    getStats,
    bulkRemove,
    exportFavorites,
    importFavorites,
    clearAllFavorites,
  } = useFavorites();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTheme, setSelectedTheme] = useState<string>('');
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [showImportDialog, setShowImportDialog] = useState(false);

  // Get all favorites and stats
  const allFavorites = getAllFavorites();
  const stats = getStats();

  // Filter favorites based on search and theme
  const filteredFavorites = useMemo(() => {
    let favorites = searchQuery ? searchFavorites(searchQuery) : allFavorites;
    
    if (selectedTheme) {
      favorites = favorites.filter(fav => fav.theme === selectedTheme);
    }
    
    return favorites;
  }, [allFavorites, searchQuery, selectedTheme, searchFavorites]);

  // Get unique themes for filtering
  const availableThemes = useMemo(() => {
    const themes = new Set(allFavorites.map(fav => fav.theme));
    return Array.from(themes).sort();
  }, [allFavorites]);

  // Selection handlers
  const toggleItemSelection = (id: string) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const selectAll = () => {
    setSelectedItems(new Set(filteredFavorites.map(fav => fav.id)));
  };

  const clearSelection = () => {
    setSelectedItems(new Set());
  };

  const toggleSelectionMode = () => {
    setSelectionMode(!selectionMode);
    clearSelection();
  };

  // Bulk actions
  const handleBulkRemove = () => {
    if (selectedItems.size > 0) {
      bulkRemove(Array.from(selectedItems));
      clearSelection();
      setSelectionMode(false);
    }
  };

  const handleBulkExport = async () => {
    if (selectedItems.size > 0) {
      const selectedFavorites = allFavorites.filter(fav => selectedItems.has(fav.id));
      const exportData = {
        poses: selectedFavorites.reduce((acc, fav) => {
          acc[fav.id] = fav;
          return acc;
        }, {} as any),
        count: selectedFavorites.length,
        lastUpdated: new Date().toISOString(),
        exportedAt: new Date().toISOString(),
        version: '1.0',
      };
      
      const jsonString = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `posekit-favorites-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      URL.revokeObjectURL(url);
      clearSelection();
      setSelectionMode(false);
    }
  };

  // Export all favorites
  const handleExportAll = () => {
    const jsonString = exportFavorites();
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `posekit-favorites-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    URL.revokeObjectURL(url);
  };

  // Import favorites
  const handleImportFavorites = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const success = importFavorites(content, true); // Merge with existing
        if (success) {
          setShowImportDialog(false);
          // Could show a success toast here
        } else {
          // Could show an error toast here
        }
      } catch (error) {
        console.error('Failed to import favorites:', error);
      }
    };
    reader.readAsText(file);
  };

  if (allFavorites.length === 0) {
    return (
      <div className={`text-center py-16 ${className}`}>
        <div className="text-gray-400 mb-4">
          <svg className="w-16 h-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No favorites yet</h3>
        <p className="text-gray-500 mb-6">
          Start adding poses to your favorites to see them here
        </p>
        <button
          onClick={() => setShowImportDialog(true)}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          Import favorites
        </button>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">My Favorites</h2>
            <p className="text-gray-600">
              {stats.total} pose{stats.total !== 1 ? 's' : ''} • 
              {Object.keys(stats.themes).length} theme{Object.keys(stats.themes).length !== 1 ? 's' : ''}
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={toggleSelectionMode}
              className={`px-4 py-2 text-sm font-medium rounded-lg border transition-colors ${
                selectionMode
                  ? 'bg-blue-50 border-blue-200 text-blue-700'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {selectionMode ? 'Cancel' : 'Select'}
            </button>
            
            <button
              onClick={handleExportAll}
              className="px-4 py-2 text-sm font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Export All
            </button>
            
            <button
              onClick={() => setShowImportDialog(true)}
              className="px-4 py-2 text-sm font-medium bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Import
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex items-center gap-4 mb-4">
          <div className="flex-1">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              onClear={() => setSearchQuery('')}
              placeholder="Search favorites..."
            />
          </div>
          
          <select
            value={selectedTheme}
            onChange={(e) => setSelectedTheme(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-sm"
          >
            <option value="">All themes</option>
            {availableThemes.map(theme => (
              <option key={theme} value={theme}>
                {theme} ({stats.themes[theme] || 0})
              </option>
            ))}
          </select>
        </div>

        {/* Selection Mode Bar */}
        <AnimatePresence>
          {selectionMode && (
            <motion.div
              className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg mb-4"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <div className="flex items-center gap-4">
                <span className="text-sm text-blue-700">
                  {selectedItems.size} selected
                </span>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={selectAll}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Select All
                  </button>
                  <button
                    onClick={clearSelection}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Clear
                  </button>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={handleBulkExport}
                  disabled={selectedItems.size === 0}
                  className="px-3 py-1 text-sm font-medium bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Export Selected
                </button>
                <button
                  onClick={handleBulkRemove}
                  disabled={selectedItems.size === 0}
                  className="px-3 py-1 text-sm font-medium bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Remove Selected
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Results */}
      {filteredFavorites.length === 0 ? (
        <div className="text-center py-16">
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
          <h3 className="text-lg font-medium text-gray-900 mb-2">No matching favorites</h3>
          <p className="text-gray-500">Try adjusting your search or filter</p>
        </div>
      ) : (
        <MasonryGrid columns={3} gap={20}>
          {filteredFavorites.map((favorite) => (
            <div key={favorite.id} className="relative">
              {selectionMode && (
                <div className="absolute top-2 left-2 z-10">
                  <button
                    onClick={() => toggleItemSelection(favorite.id)}
                    className={`w-6 h-6 rounded border-2 flex items-center justify-center ${
                      selectedItems.has(favorite.id)
                        ? 'bg-blue-500 border-blue-500 text-white'
                        : 'bg-white border-gray-300'
                    }`}
                  >
                    {selectedItems.has(favorite.id) && (
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </button>
                </div>
              )}
              
              <PoseCard
                pose={{
                  id: favorite.id,
                  title: favorite.title,
                  slug: favorite.slug,
                  theme: favorite.theme,
                  previewAsset: {
                    url: favorite.previewUrl,
                    width: 768,
                    height: 768,
                  },
                  safetyLevel: 'safe' as const,
                }}
                showVariants={false}
                showSafetyBadge={false}
              />
            </div>
          ))}
        </MasonryGrid>
      )}

      {/* Import Dialog */}
      <AnimatePresence>
        {showImportDialog && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-lg p-6 w-full max-w-md"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <h3 className="text-lg font-medium text-gray-900 mb-4">Import Favorites</h3>
              <p className="text-gray-600 mb-6">
                Select a JSON file to import your favorites. They will be merged with your existing favorites.
              </p>
              
              <input
                type="file"
                accept=".json"
                onChange={handleImportFavorites}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              
              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setShowImportDialog(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default FavoritesManager;