'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePWA } from '../../hooks/usePWA';

export function PWAInstallPrompt() {
  const { isInstallable, installApp, showIOSInstallPrompt, isInstalled } = usePWA();
  const [showPrompt, setShowPrompt] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if user has previously dismissed the prompt
    const hasBeenDismissed = localStorage.getItem('pwa-install-dismissed') === 'true';
    
    if (!hasBeenDismissed && (isInstallable || showIOSInstallPrompt) && !isInstalled) {
      // Show prompt after a delay
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [isInstallable, showIOSInstallPrompt, isInstalled]);

  const handleInstall = async () => {
    if (showIOSInstallPrompt) {
      // For iOS, just show instructions
      return;
    }
    
    const success = await installApp();
    if (success) {
      setShowPrompt(false);
    }
  };

  const handleDismiss = (permanent = false) => {
    setShowPrompt(false);
    setDismissed(true);
    
    if (permanent) {
      localStorage.setItem('pwa-install-dismissed', 'true');
    }
  };

  if (!showPrompt || isInstalled || dismissed) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50"
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 100 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      >
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4">
          <div className="flex items-start space-x-3">
            {/* App Icon */}
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-medium text-gray-900 mb-1">
                Install PoseKit
              </h3>
              
              {showIOSInstallPrompt ? (
                <div>
                  <p className="text-sm text-gray-600 mb-3">
                    Install this app for a better experience. Tap the share button and select "Add to Home Screen".
                  </p>
                  <div className="flex items-center text-xs text-gray-500 space-x-2 mb-3">
                    <span>1. Tap</span>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"
                      />
                    </svg>
                    <span>2. "Add to Home Screen"</span>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-600 mb-3">
                  Get quick access to poses with offline support, faster loading, and a native app experience.
                </p>
              )}

              <div className="flex space-x-2">
                {!showIOSInstallPrompt && (
                  <button
                    onClick={handleInstall}
                    className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700 transition-colors"
                  >
                    Install
                  </button>
                )}
                
                <button
                  onClick={() => handleDismiss(false)}
                  className="inline-flex items-center px-3 py-1.5 bg-gray-100 text-gray-700 text-xs font-medium rounded hover:bg-gray-200 transition-colors"
                >
                  Later
                </button>
                
                <button
                  onClick={() => handleDismiss(true)}
                  className="inline-flex items-center px-3 py-1.5 text-gray-500 text-xs font-medium hover:text-gray-700 transition-colors"
                >
                  Don't ask again
                </button>
              </div>
            </div>

            {/* Close button */}
            <button
              onClick={() => handleDismiss(false)}
              className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

export default PWAInstallPrompt;