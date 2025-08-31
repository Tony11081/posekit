'use client';

import React from 'react';
import { motion } from 'framer-motion';
import type { PoseVariant } from '@posekit/types';

interface VariantSelectorProps {
  variants: PoseVariant[];
  selectedVariant: PoseVariant | null;
  onSelect: (variant: PoseVariant | null) => void;
  className?: string;
}

export function VariantSelector({ 
  variants, 
  selectedVariant, 
  onSelect, 
  className = '' 
}: VariantSelectorProps) {
  if (variants.length === 0) return null;

  // Include "original" as the first option
  const allOptions = [
    { id: null, title: 'Original', type: 'original' as const },
    ...variants.map(v => ({ id: v.id, title: v.title, type: v.type }))
  ];

  const getVariantIcon = (type: string) => {
    switch (type) {
      case 'original':
        return '○';
      case 'mirror':
        return '⇄';
      case 'angle':
        return '↻';
      case 'lens':
        return '🔍';
      default:
        return '●';
    }
  };

  const getVariantTitle = (option: typeof allOptions[0]) => {
    if (option.type === 'original') return 'Original pose';
    const typeNames = {
      mirror: 'Mirrored version',
      angle: 'Different angle',
      lens: 'Different lens',
    };
    return typeNames[option.type] || option.title;
  };

  return (
    <motion.div
      className={`flex space-x-2 ${className}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      {allOptions.map((option, index) => {
        const isSelected = selectedVariant?.id === option.id || 
                          (option.id === null && selectedVariant === null);
        
        return (
          <motion.button
            key={option.id || 'original'}
            className={`group relative w-6 h-6 rounded-full transition-all duration-200 ${
              isSelected 
                ? 'bg-white scale-110 shadow-md' 
                : 'bg-white/60 hover:bg-white/80'
            }`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              const variant = option.id ? variants.find(v => v.id === option.id) : null;
              onSelect(variant || null);
            }}
            title={getVariantTitle(option)}
            whileHover={{ scale: isSelected ? 1.1 : 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {/* Variant Icon */}
            <span className={`absolute inset-0 flex items-center justify-center text-xs font-medium transition-colors ${
              isSelected ? 'text-gray-800' : 'text-gray-600'
            }`}>
              {getVariantIcon(option.type)}
            </span>
            
            {/* Selection indicator */}
            {isSelected && (
              <motion.div
                className="absolute inset-0 rounded-full border-2 border-blue-500"
                layoutId="selectedVariant"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
            
            {/* Hover tooltip */}
            <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
              <div className="bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                {option.title}
              </div>
              {/* Arrow */}
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 -translate-y-1/2 rotate-45 w-2 h-2 bg-gray-900"></div>
            </div>
          </motion.button>
        );
      })}
      
      {/* Keyboard navigation hint */}
      {variants.length > 1 && (
        <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
          <div className="bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
            ← → to switch variants
          </div>
        </div>
      )}
    </motion.div>
  );
}

export default VariantSelector;