'use client';

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCopy } from '@/hooks/useCopy';
import { useFavorites } from '@/hooks/useFavorites';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { PoseImage } from './PoseImage';
import { SkeletonOverlay } from './SkeletonOverlay';
import { CopyActions } from './CopyActions';
import { VariantSelector } from './VariantSelector';
import { SafetyBadge } from './SafetyBadge';
import { CardToast } from './CardToast';
import type { Pose, PoseVariant } from '@posekit/types';

interface PoseCardProps {
  pose: Pose;
  variants?: PoseVariant[];
  className?: string;
  priority?: boolean; // For image loading priority
  onView?: (poseId: string) => void;
  onFavorite?: (poseId: string, isFavorited: boolean) => void;
}

export function PoseCard({ 
  pose, 
  variants = [], 
  className = '',
  priority = false,
  onView,
  onFavorite,
}: PoseCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [selectedVariant, setSelectedVariant] = useState<PoseVariant | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  
  const { copyText, copyToClipboard } = useCopy();
  const { isFavorited, toggleFavorite } = useFavorites(pose.id);

  // Get current pose data (base pose or selected variant)
  const currentPose = selectedVariant || pose;
  const currentAsset = selectedVariant ? selectedVariant.asset : pose.previewAsset;
  const currentKeypoints = selectedVariant?.keypoints || pose.keypoints;
  const currentPrompts = selectedVariant ? 
    { ...pose.prompts, ...selectedVariant.prompts } : 
    pose.prompts;

  // Handle copy actions with toast feedback
  const handleCopy = async (type: 'png' | 'json' | 'prompt', emoji: string) => {
    let success = false;
    let message = '';

    try {
      switch (type) {
        case 'png':
          if (currentAsset?.url) {
            // Copy image URL or trigger download
            await copyToClipboard(currentAsset.url);
            success = true;
            message = `${emoji} PNG Copied!`;
          }
          break;
        
        case 'json':
          await copyToClipboard(JSON.stringify(currentKeypoints, null, 2));
          success = true;
          message = `${emoji} JSON Copied!`;
          break;
        
        case 'prompt':
          const prompt = currentPrompts.sdxl || currentPrompts.flux || '';
          if (prompt) {
            await copyToClipboard(prompt);
            success = true;
            message = `${emoji} Prompt Copied!`;
          }
          break;
      }

      if (success) {
        showToast(message);
        onView?.(pose.id);
      }
    } catch (error) {
      console.error('Copy failed:', error);
      showToast('❌ Copy failed');
    }
  };

  // Show card-level toast
  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 1500);
  };

  // Handle favorite toggle
  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite();
    onFavorite?.(pose.id, !isFavorited);
    showToast(isFavorited ? '💔 Removed from favorites' : '❤️ Added to favorites');
  };

  // Handle card click (default: copy PNG)
  const handleCardClick = () => {
    if (!selectedVariant && variants.length === 0) {
      handleCopy('png', '🖼');
    }
  };

  // Handle variant selection
  const handleVariantSelect = (variant: PoseVariant | null) => {
    setSelectedVariant(variant);
    if (variant) {
      showToast(`🔄 Switched to ${variant.title}`);
    }
  };

  // Handle right-click context menu
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    // Show context menu with PNG/JSON/Prompt options
    // This would open a small menu component
  };

  // Keyboard shortcuts
  useKeyboardShortcuts(cardRef, {
    'Enter': () => handleCopy('png', '🖼'),
    'KeyC': () => handleCopy('json', '{}'),
    'KeyP': () => handleCopy('prompt', '✍️'),
    'KeyF': handleFavoriteClick,
    'ArrowLeft': () => {
      if (variants.length > 0) {
        const currentIndex = selectedVariant 
          ? variants.findIndex(v => v.id === selectedVariant.id)
          : -1;
        const prevIndex = currentIndex > 0 ? currentIndex - 1 : variants.length - 1;
        handleVariantSelect(variants[prevIndex]);
      }
    },
    'ArrowRight': () => {
      if (variants.length > 0) {
        const currentIndex = selectedVariant 
          ? variants.findIndex(v => v.id === selectedVariant.id)
          : -1;
        const nextIndex = currentIndex < variants.length - 1 ? currentIndex + 1 : 0;
        handleVariantSelect(variants[nextIndex]);
      }
    },
  });

  return (
    <motion.div
      ref={cardRef}
      className={`pose-card relative bg-white rounded-xl overflow-hidden shadow-sm border border-gray-200 cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
      onClick={handleCardClick}
      onContextMenu={handleContextMenu}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      tabIndex={0}
      role="button"
      aria-label={`Pose: ${pose.title}. Press Enter to copy PNG, C for JSON, P for Prompt.`}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Image Container */}
      <div className="relative aspect-[4/5] overflow-hidden">
        {/* Background gradient based on theme */}
        <div 
          className="absolute inset-0 opacity-20"
          style={{ 
            background: pose.theme?.color ? 
              `linear-gradient(135deg, ${pose.theme.color}, ${pose.theme.color}88)` :
              'linear-gradient(135deg, #f3f4f6, #e5e7eb)'
          }}
        />
        
        {/* Skeleton Overlay */}
        <SkeletonOverlay 
          skeleton={pose.skeleton}
          keypoints={currentKeypoints}
          visible={isHovered}
        />
        
        {/* Main Image */}
        <PoseImage
          src={currentAsset?.url}
          alt={currentPose.title}
          priority={priority}
          className="absolute inset-0 w-full h-full object-cover"
        />
        
        {/* Safety Badge */}
        {pose.safetyLevel !== 'normal' && (
          <SafetyBadge 
            level={pose.safetyLevel}
            className="absolute top-2 left-2"
          />
        )}
        
        {/* Copy Actions */}
        <AnimatePresence>
          {isHovered && (
            <CopyActions
              onCopy={handleCopy}
              className="absolute top-3 right-3"
            />
          )}
        </AnimatePresence>
        
        {/* Variant Selector */}
        {variants.length > 0 && (
          <VariantSelector
            variants={variants}
            selectedVariant={selectedVariant}
            onSelect={handleVariantSelect}
            className="absolute bottom-3 left-1/2 transform -translate-x-1/2"
          />
        )}
        
        {/* Favorite Button */}
        <motion.button
          className="absolute top-3 left-3 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-colors"
          onClick={handleFavoriteClick}
          whileTap={{ scale: 0.9 }}
          aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
        >
          <motion.div
            initial={false}
            animate={{ scale: isFavorited ? 1.2 : 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
          >
            {isFavorited ? '❤️' : '🤍'}
          </motion.div>
        </motion.button>
      </div>
      
      {/* Card Content */}
      <div className="p-4">
        {/* Title */}
        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
          {currentPose.title}
        </h3>
        
        {/* Tags */}
        <div className="flex flex-wrap gap-1 mb-2">
          {pose.tags?.slice(0, 3).map((tag, index) => (
            <span
              key={tag}
              className={`px-2 py-1 text-xs rounded font-medium ${
                index === 0 ? 'bg-blue-100 text-blue-800' :
                index === 1 ? 'bg-purple-100 text-purple-800' :
                'bg-green-100 text-green-800'
              }`}
            >
              {tag}
            </span>
          ))}
          {pose.tags?.length > 3 && (
            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded font-medium">
              +{pose.tags.length - 3}
            </span>
          )}
        </div>
        
        {/* Collection Info */}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>{pose.theme?.name} Collection</span>
          <div className="flex items-center space-x-3">
            <span className="flex items-center">
              👁 {pose.viewCount?.toLocaleString() || 0}
            </span>
            <span className="flex items-center">
              📥 {pose.downloadCount?.toLocaleString() || 0}
            </span>
          </div>
        </div>
      </div>
      
      {/* Card Toast */}
      <AnimatePresence>
        {toastMessage && (
          <CardToast 
            message={toastMessage}
            onClose={() => setToastMessage(null)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default PoseCard;