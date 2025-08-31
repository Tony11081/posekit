'use client';

import { useState, useCallback, useMemo } from 'react';
import { generatePoseVariations, transformPose, validatePoseData } from '../utils/poseUtils';

interface PoseVariant {
  id: string;
  title: string;
  previewUrl?: string;
  poseData?: any;
  transformation?: string;
  isGenerated?: boolean;
}

interface UseVariantsOptions {
  autoGenerateVariants?: boolean;
  maxVariants?: number;
}

export function useVariants(
  initialVariants: PoseVariant[] = [],
  basePoseData?: any,
  options: UseVariantsOptions = {}
) {
  const { autoGenerateVariants = true, maxVariants = 8 } = options;
  
  const [currentVariantIndex, setCurrentVariantIndex] = useState(0);
  const [variants, setVariants] = useState<PoseVariant[]>(() => {
    // Auto-generate variants if enabled and we have pose data
    if (autoGenerateVariants && basePoseData && validatePoseData(basePoseData)) {
      const generated = generatePoseVariations(basePoseData).map(variation => ({
        id: variation.id,
        title: variation.title,
        poseData: variation.poseData,
        transformation: variation.transformation,
        isGenerated: true,
      }));
      
      // Combine provided variants with generated ones
      const combined = [...initialVariants, ...generated];
      return combined.slice(0, maxVariants);
    }
    
    return initialVariants;
  });

  // Current variant
  const currentVariant = useMemo(() => {
    return variants[currentVariantIndex] || variants[0] || null;
  }, [variants, currentVariantIndex]);

  // Navigation functions
  const goToVariant = useCallback((index: number) => {
    if (index >= 0 && index < variants.length) {
      setCurrentVariantIndex(index);
    }
  }, [variants.length]);

  const nextVariant = useCallback(() => {
    if (variants.length > 0) {
      setCurrentVariantIndex(prev => (prev + 1) % variants.length);
    }
  }, [variants.length]);

  const previousVariant = useCallback(() => {
    if (variants.length > 0) {
      setCurrentVariantIndex(prev => (prev - 1 + variants.length) % variants.length);
    }
  }, [variants.length]);

  const goToFirstVariant = useCallback(() => {
    setCurrentVariantIndex(0);
  }, []);

  const goToLastVariant = useCallback(() => {
    setCurrentVariantIndex(Math.max(0, variants.length - 1));
  }, [variants.length]);

  // Variant management
  const addVariant = useCallback((variant: PoseVariant) => {
    setVariants(prev => [...prev, variant].slice(0, maxVariants));
  }, [maxVariants]);

  const removeVariant = useCallback((variantId: string) => {
    setVariants(prev => {
      const filtered = prev.filter(v => v.id !== variantId);
      
      // Adjust current index if necessary
      if (currentVariantIndex >= filtered.length) {
        setCurrentVariantIndex(Math.max(0, filtered.length - 1));
      }
      
      return filtered;
    });
  }, [currentVariantIndex]);

  const updateVariant = useCallback((variantId: string, updates: Partial<PoseVariant>) => {
    setVariants(prev =>
      prev.map(variant =>
        variant.id === variantId ? { ...variant, ...updates } : variant
      )
    );
  }, []);

  // Generate new variants from current pose data
  const regenerateVariants = useCallback((newBasePoseData?: any) => {
    const poseData = newBasePoseData || basePoseData;
    
    if (!poseData || !validatePoseData(poseData)) {
      console.warn('Invalid pose data provided for variant generation');
      return;
    }

    const generated = generatePoseVariations(poseData).map(variation => ({
      id: `generated_${variation.id}_${Date.now()}`,
      title: variation.title,
      poseData: variation.poseData,
      transformation: variation.transformation,
      isGenerated: true,
    }));

    setVariants(prev => {
      // Keep non-generated variants and add new generated ones
      const nonGenerated = prev.filter(v => !v.isGenerated);
      return [...nonGenerated, ...generated].slice(0, maxVariants);
    });

    setCurrentVariantIndex(0);
  }, [basePoseData, maxVariants]);

  // Create custom variant with specific transformations
  const createCustomVariant = useCallback((
    transformations: {
      mirror?: boolean;
      scale?: { width: number; height: number };
      rotation?: number;
    },
    title?: string
  ) => {
    if (!basePoseData || !validatePoseData(basePoseData)) {
      console.warn('No valid base pose data available for custom variant');
      return null;
    }

    const transformedPoseData = transformPose(basePoseData, transformations);
    const transformationStr = Object.entries(transformations)
      .filter(([, value]) => value !== undefined)
      .map(([key, value]) => `${key}:${typeof value === 'object' ? JSON.stringify(value) : value}`)
      .join(',');

    const customVariant: PoseVariant = {
      id: `custom_${Date.now()}`,
      title: title || `Custom (${transformationStr})`,
      poseData: transformedPoseData,
      transformation: transformationStr,
      isGenerated: true,
    };

    addVariant(customVariant);
    return customVariant;
  }, [basePoseData, addVariant]);

  // Get available transformation options
  const getTransformationOptions = useCallback(() => {
    return [
      { id: 'mirror', label: 'Mirror Horizontally', type: 'boolean' },
      { id: 'scale', label: 'Scale', type: 'scale', min: 0.5, max: 2.0, step: 0.1 },
      { id: 'rotation', label: 'Rotate', type: 'number', min: -180, max: 180, step: 15, unit: '°' },
    ];
  }, []);

  // Navigation state
  const navigation = useMemo(() => ({
    canGoPrevious: variants.length > 1,
    canGoNext: variants.length > 1,
    currentIndex: currentVariantIndex,
    totalVariants: variants.length,
    currentVariant,
  }), [variants.length, currentVariantIndex, currentVariant]);

  // Keyboard navigation support
  const handleKeyboardNavigation = useCallback((key: string) => {
    switch (key) {
      case 'ArrowLeft':
      case 'KeyA':
        previousVariant();
        break;
      case 'ArrowRight':
      case 'KeyD':
        nextVariant();
        break;
      case 'Home':
        goToFirstVariant();
        break;
      case 'End':
        goToLastVariant();
        break;
      default:
        // Check for number keys (1-9) to jump to specific variant
        if (/^Digit[1-9]$/.test(key)) {
          const index = parseInt(key.replace('Digit', '')) - 1;
          if (index < variants.length) {
            goToVariant(index);
          }
        }
    }
  }, [previousVariant, nextVariant, goToFirstVariant, goToLastVariant, goToVariant, variants.length]);

  return {
    // State
    variants,
    currentVariant,
    currentVariantIndex,
    navigation,

    // Navigation
    goToVariant,
    nextVariant,
    previousVariant,
    goToFirstVariant,
    goToLastVariant,

    // Management
    addVariant,
    removeVariant,
    updateVariant,
    regenerateVariants,
    createCustomVariant,

    // Utilities
    getTransformationOptions,
    handleKeyboardNavigation,

    // Stats
    hasVariants: variants.length > 0,
    variantCount: variants.length,
    hasMultipleVariants: variants.length > 1,
  };
}

export default useVariants;