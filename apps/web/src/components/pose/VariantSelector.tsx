'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface PoseVariant {
  id: string;
  title: string;
  previewUrl?: string;
  isGenerated?: boolean;
}

interface VariantSelectorProps {
  variants: PoseVariant[];
  currentIndex: number;
  onVariantChange: (index: number) => void;
  onRegenerateVariants?: () => void;
  className?: string;
}

export function VariantSelector({
  variants,
  currentIndex,
  onVariantChange,
  onRegenerateVariants,
  className = '',
}: VariantSelectorProps) {
  const [showAllVariants, setShowAllVariants] = useState(false);
  
  if (variants.length <= 1) {
    return null;
  }

  const currentVariant = variants[currentIndex];
  const hasMultipleVariants = variants.length > 1;
  const maxVisibleVariants = 4;
  const shouldShowExpanded = variants.length > maxVisibleVariants;

  // Get visible variants for collapsed state
  const getVisibleVariants = () => {
    if (showAllVariants || variants.length <= maxVisibleVariants) {
      return variants;
    }

    // Always show current variant and a few others
    const startIndex = Math.max(0, currentIndex - Math.floor(maxVisibleVariants / 2));
    const endIndex = Math.min(variants.length, startIndex + maxVisibleVariants);
    
    return variants.slice(startIndex, endIndex);
  };

  const visibleVariants = getVisibleVariants();

  return (
    <div className={`${className}`}>
      {/* Variant Navigation */}
      <div className="flex items-center gap-2">
        {/* Previous Button */}
        <button
          onClick={() => onVariantChange(Math.max(0, currentIndex - 1))}
          disabled={currentIndex === 0}
          className="p-2 rounded-lg bg-white border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          title="Previous variant (A)"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Variant Thumbnails */}
        <div className="flex items-center gap-2 overflow-hidden">
          <AnimatePresence mode="popLayout">
            {visibleVariants.map((variant, index) => {
              const actualIndex = showAllVariants ? index : variants.indexOf(variant);
              const isActive = actualIndex === currentIndex;
              
              return (
                <motion.button
                  key={variant.id}
                  onClick={() => onVariantChange(actualIndex)}
                  className={`
                    relative flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden
                    border-2 transition-all duration-200
                    ${isActive 
                      ? 'border-blue-500 ring-2 ring-blue-200' 
                      : 'border-gray-300 hover:border-gray-400'
                    }
                  `}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  title={variant.title}
                >
                  {variant.previewUrl ? (
                    <img
                      src={variant.previewUrl}
                      alt={variant.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                      <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                    </div>
                  )}
                  
                  {/* Generated indicator */}
                  {variant.isGenerated && (
                    <div className="absolute top-0 right-0 w-2 h-2 bg-green-400 rounded-full"></div>
                  )}
                  
                  {/* Active indicator */}
                  {isActive && (
                    <div className="absolute inset-0 bg-blue-500 bg-opacity-20 flex items-center justify-center">
                      <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  )}
                </motion.button>
              );
            })}
          </AnimatePresence>
          
          {/* Expand/Collapse Button */}
          {shouldShowExpanded && (
            <motion.button
              onClick={() => setShowAllVariants(!showAllVariants)}
              className="flex-shrink-0 w-12 h-12 rounded-lg border-2 border-dashed border-gray-300 hover:border-gray-400 text-gray-400 hover:text-gray-600 transition-all flex items-center justify-center"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title={showAllVariants ? 'Show less' : `Show all ${variants.length} variants`}
            >
              {showAllVariants ? (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                </svg>
              ) : (
                <span className="text-xs font-medium">+{variants.length - maxVisibleVariants}</span>
              )}
            </motion.button>
          )}
        </div>

        {/* Next Button */}
        <button
          onClick={() => onVariantChange(Math.min(variants.length - 1, currentIndex + 1))}
          disabled={currentIndex === variants.length - 1}
          className="p-2 rounded-lg bg-white border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          title="Next variant (D)"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Variant Info */}
      <div className="mt-2 flex items-center justify-between text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <span className="font-medium">{currentVariant?.title}</span>
          {currentVariant?.isGenerated && (
            <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-green-100 text-green-800 rounded-full">
              Generated
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <span>{currentIndex + 1} of {variants.length}</span>
          
          {onRegenerateVariants && (
            <button
              onClick={onRegenerateVariants}
              className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
              title="Regenerate variants"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Keyboard Shortcuts Hint */}
      {hasMultipleVariants && (
        <div className="mt-2 text-xs text-gray-500 text-center">
          Use ← → or A/D keys to navigate variants
        </div>
      )}
    </div>
  );
}

export default VariantSelector;