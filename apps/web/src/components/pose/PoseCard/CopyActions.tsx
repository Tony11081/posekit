'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface CopyActionsProps {
  onCopy: (type: 'png' | 'json' | 'prompt', emoji: string) => void;
  className?: string;
}

export function CopyActions({ onCopy, className = '' }: CopyActionsProps) {
  const actions = [
    { type: 'png' as const, emoji: '🖼', label: 'Copy PNG', shortcut: '↵' },
    { type: 'json' as const, emoji: '{}', label: 'Copy JSON', shortcut: 'C' },
    { type: 'prompt' as const, emoji: '✍️', label: 'Copy Prompt', shortcut: 'P' },
  ];

  return (
    <motion.div
      className={`flex space-x-1 ${className}`}
      initial={{ opacity: 0, scale: 0.8, y: -10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.8, y: -10 }}
      transition={{ 
        type: 'spring', 
        stiffness: 400, 
        damping: 25,
        staggerChildren: 0.05,
      }}
    >
      {actions.map((action, index) => (
        <motion.button
          key={action.type}
          className="group relative w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white hover:scale-110 transition-all duration-200 shadow-sm"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onCopy(action.type, action.emoji);
          }}
          title={`${action.label} (${action.shortcut})`}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
        >
          <span className="text-sm select-none">
            {action.emoji}
          </span>
          
          {/* Keyboard shortcut hint */}
          <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
            <div className="bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
              {action.shortcut}
            </div>
            {/* Arrow */}
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rotate-45 w-2 h-2 bg-gray-900"></div>
          </div>
        </motion.button>
      ))}
    </motion.div>
  );
}

export default CopyActions;