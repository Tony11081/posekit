'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePWA } from '../../hooks/usePWA';

export function UpdatePrompt() {
  const { updateAvailable, applyUpdate } = usePWA();

  const handleUpdate = () => {
    applyUpdate();
  };

  if (!updateAvailable) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        className="fixed top-4 left-4 right-4 md:left-1/2 md:transform md:-translate-x-1/2 md:w-96 z-50"
        initial={{ opacity: 0, y: -100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -100 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      >
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 shadow-lg">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </div>
            
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-blue-800">
                Update Available
              </h3>
              <p className="mt-1 text-sm text-blue-700">
                A new version of PoseKit is ready to install.
              </p>
            </div>
            
            <div className="ml-4 flex space-x-2">
              <button
                onClick={handleUpdate}
                className="bg-blue-600 text-white px-3 py-1.5 rounded text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                Update
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

export default UpdatePrompt;