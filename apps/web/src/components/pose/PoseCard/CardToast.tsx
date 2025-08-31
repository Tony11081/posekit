'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface CardToastProps {
  message: string;
  onClose?: () => void;
  className?: string;
}

export function CardToast({ message, onClose, className = '' }: CardToastProps) {
  return (
    <motion.div
      className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none ${className}`}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ 
        type: 'spring', 
        stiffness: 400, 
        damping: 25 
      }}
    >
      <div className="bg-black/80 text-white px-4 py-2 rounded-lg shadow-lg text-sm font-medium whitespace-nowrap">
        {message}
      </div>
    </motion.div>
  );
}

export default CardToast;