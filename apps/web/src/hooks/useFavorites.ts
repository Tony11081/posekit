'use client';

import { useState, useCallback, useEffect } from 'react';
import { useLocalStorage } from './useLocalStorage';

export interface FavoriteItem {
  id: string;
  title: string;
  slug: string;
  previewUrl: string;
  theme: string;
  addedAt: string;
}

interface FavoritesData {
  poses: Record<string, FavoriteItem>;
  count: number;
  lastUpdated: string;
}

export function useFavorites(poseId?: string) {
  const [favorites, setFavorites] = useLocalStorage<FavoritesData>('posekit-favorites', {
    poses: {},
    count: 0,
    lastUpdated: new Date().toISOString(),
  });

  // Check if a specific pose is favorited
  const isFavorited = useCallback((id: string): boolean => {
    return !!favorites.poses[id];
  }, [favorites.poses]);

  // Add pose to favorites
  const addFavorite = useCallback((pose: Partial<FavoriteItem> & { id: string }) => {
    setFavorites(prev => {
      const newFavorite: FavoriteItem = {
        id: pose.id,
        title: pose.title || 'Untitled Pose',
        slug: pose.slug || pose.id,
        previewUrl: pose.previewUrl || '',
        theme: pose.theme || 'Unknown',
        addedAt: new Date().toISOString(),
      };

      return {
        poses: {
          ...prev.poses,
          [pose.id]: newFavorite,
        },
        count: Object.keys(prev.poses).length + (prev.poses[pose.id] ? 0 : 1),
        lastUpdated: new Date().toISOString(),
      };
    });
  }, [setFavorites]);

  // Remove pose from favorites
  const removeFavorite = useCallback((id: string) => {
    setFavorites(prev => {
      const { [id]: removed, ...remaining } = prev.poses;
      
      return {
        poses: remaining,
        count: Object.keys(remaining).length,
        lastUpdated: new Date().toISOString(),
      };
    });
  }, [setFavorites]);

  // Toggle favorite status
  const toggleFavorite = useCallback((pose?: Partial<FavoriteItem> & { id: string }) => {
    const id = pose?.id || poseId;
    if (!id) return false;

    if (isFavorited(id)) {
      removeFavorite(id);
      return false;
    } else {
      if (pose) {
        addFavorite(pose);
      }
      return true;
    }
  }, [poseId, isFavorited, addFavorite, removeFavorite]);

  // Get all favorites as array
  const getAllFavorites = useCallback((): FavoriteItem[] => {
    return Object.values(favorites.poses).sort((a, b) => 
      new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime()
    );
  }, [favorites.poses]);

  // Get favorites by theme
  const getFavoritesByTheme = useCallback((theme: string): FavoriteItem[] => {
    return getAllFavorites().filter(fav => 
      fav.theme.toLowerCase() === theme.toLowerCase()
    );
  }, [getAllFavorites]);

  // Clear all favorites
  const clearAllFavorites = useCallback(() => {
    setFavorites({
      poses: {},
      count: 0,
      lastUpdated: new Date().toISOString(),
    });
  }, [setFavorites]);

  // Export favorites as JSON
  const exportFavorites = useCallback((): string => {
    const exportData = {
      ...favorites,
      exportedAt: new Date().toISOString(),
      version: '1.0',
    };
    return JSON.stringify(exportData, null, 2);
  }, [favorites]);

  // Import favorites from JSON
  const importFavorites = useCallback((jsonData: string, merge = true): boolean => {
    try {
      const data = JSON.parse(jsonData);
      
      if (!data.poses || typeof data.poses !== 'object') {
        throw new Error('Invalid favorites data format');
      }

      setFavorites(prev => {
        if (merge) {
          // Merge with existing favorites
          const mergedPoses = { ...prev.poses, ...data.poses };
          return {
            poses: mergedPoses,
            count: Object.keys(mergedPoses).length,
            lastUpdated: new Date().toISOString(),
          };
        } else {
          // Replace all favorites
          return {
            poses: data.poses,
            count: Object.keys(data.poses).length,
            lastUpdated: new Date().toISOString(),
          };
        }
      });

      return true;
    } catch (error) {
      console.error('Failed to import favorites:', error);
      return false;
    }
  }, [setFavorites]);

  // Get favorites statistics
  const getStats = useCallback(() => {
    const allFavorites = getAllFavorites();
    const themes = allFavorites.reduce((acc, fav) => {
      acc[fav.theme] = (acc[fav.theme] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const oldestFavorite = allFavorites[allFavorites.length - 1];
    const newestFavorite = allFavorites[0];

    return {
      total: favorites.count,
      themes,
      oldestDate: oldestFavorite?.addedAt,
      newestDate: newestFavorite?.addedAt,
      lastUpdated: favorites.lastUpdated,
    };
  }, [favorites, getAllFavorites]);

  // Search within favorites
  const searchFavorites = useCallback((query: string): FavoriteItem[] => {
    if (!query.trim()) return getAllFavorites();

    const searchTerm = query.toLowerCase().trim();
    return getAllFavorites().filter(fav =>
      fav.title.toLowerCase().includes(searchTerm) ||
      fav.theme.toLowerCase().includes(searchTerm)
    );
  }, [getAllFavorites]);

  // Bulk operations
  const bulkRemove = useCallback((ids: string[]) => {
    setFavorites(prev => {
      const newPoses = { ...prev.poses };
      ids.forEach(id => delete newPoses[id]);

      return {
        poses: newPoses,
        count: Object.keys(newPoses).length,
        lastUpdated: new Date().toISOString(),
      };
    });
  }, [setFavorites]);

  const bulkAdd = useCallback((poses: FavoriteItem[]) => {
    setFavorites(prev => {
      const newPoses = { ...prev.poses };
      poses.forEach(pose => {
        newPoses[pose.id] = {
          ...pose,
          addedAt: pose.addedAt || new Date().toISOString(),
        };
      });

      return {
        poses: newPoses,
        count: Object.keys(newPoses).length,
        lastUpdated: new Date().toISOString(),
      };
    });
  }, [setFavorites]);

  // For single pose usage (if poseId provided)
  const currentPoseIsFavorited = poseId ? isFavorited(poseId) : false;
  const toggleCurrentPose = useCallback(() => {
    if (poseId) {
      return toggleFavorite();
    }
    return false;
  }, [poseId, toggleFavorite]);

  return {
    // Single pose utilities (when poseId provided)
    isFavorited: currentPoseIsFavorited,
    toggleFavorite: toggleCurrentPose,

    // General utilities
    favorites: favorites.poses,
    count: favorites.count,
    lastUpdated: favorites.lastUpdated,
    
    // Operations
    addFavorite,
    removeFavorite,
    toggleFavoriteById: toggleFavorite,
    isFavoritedById: isFavorited,
    
    // Data access
    getAllFavorites,
    getFavoritesByTheme,
    searchFavorites,
    getStats,
    
    // Bulk operations
    bulkAdd,
    bulkRemove,
    clearAllFavorites,
    
    // Import/Export
    exportFavorites,
    importFavorites,
  };
}

export default useFavorites;