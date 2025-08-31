'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { exportPosesWithProgress } from '../../utils/exportUtils';

interface BatchExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  poses: Array<{
    id: string;
    title: string;
    slug: string;
    theme: string;
    previewUrl?: string;
    keypoints?: any;
    metadata?: any;
  }>;
}

export function BatchExportDialog({ isOpen, onClose, poses }: BatchExportDialogProps) {
  const [exportFormat, setExportFormat] = useState<'json' | 'csv' | 'zip'>('json');
  const [includeImages, setIncludeImages] = useState(false);
  const [includeMetadata, setIncludeMetadata] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [currentItem, setCurrentItem] = useState('');

  const handleExport = async () => {
    if (poses.length === 0) return;

    setIsExporting(true);
    setExportProgress(0);
    setCurrentItem('');

    try {
      await exportPosesWithProgress(
        poses,
        {
          format: exportFormat,
          includeImages,
          includeMetadata,
        },
        (progress, item) => {
          setExportProgress(progress);
          setCurrentItem(item);
        }
      );

      // Brief delay to show completion
      setTimeout(() => {
        setIsExporting(false);
        onClose();
      }, 1000);
    } catch (error) {
      console.error('Export failed:', error);
      setIsExporting(false);
      // Could show an error toast here
    }
  };

  const getEstimatedSize = () => {
    let size = poses.length * 0.5; // Base metadata size in KB
    
    if (includeImages && exportFormat === 'zip') {
      size += poses.length * 150; // Estimated 150KB per image
    }
    
    if (size < 1024) {
      return `~${Math.round(size)} KB`;
    } else {
      return `~${Math.round(size / 1024)} MB`;
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="bg-white rounded-lg w-full max-w-md"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
        >
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Export {poses.length} Pose{poses.length !== 1 ? 's' : ''}
            </h3>

            {!isExporting ? (
              <div className="space-y-6">
                {/* Format Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Export Format
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { value: 'json', label: 'JSON', description: 'Structured data' },
                      { value: 'csv', label: 'CSV', description: 'Spreadsheet format' },
                      { value: 'zip', label: 'ZIP', description: 'Complete package' },
                    ].map((format) => (
                      <button
                        key={format.value}
                        onClick={() => setExportFormat(format.value as any)}
                        className={`p-3 text-center border rounded-lg transition-all ${
                          exportFormat === format.value
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <div className="font-medium">{format.label}</div>
                        <div className="text-xs text-gray-500 mt-1">{format.description}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Options */}
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Export Options
                  </label>
                  
                  <div className="space-y-3">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={includeMetadata}
                        onChange={(e) => setIncludeMetadata(e.target.checked)}
                        className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="ml-3 text-sm text-gray-700">Include pose metadata</span>
                    </label>
                    
                    {exportFormat === 'zip' && (
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={includeImages}
                          onChange={(e) => setIncludeImages(e.target.checked)}
                          className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="ml-3 text-sm text-gray-700">
                          Include preview images
                          <span className="text-gray-500 ml-1">(slower download)</span>
                        </span>
                      </label>
                    )}
                  </div>
                </div>

                {/* Estimated Size */}
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-sm text-gray-600">
                    <div className="flex justify-between">
                      <span>Estimated file size:</span>
                      <span className="font-medium">{getEstimatedSize()}</span>
                    </div>
                    <div className="flex justify-between mt-1">
                      <span>Items to export:</span>
                      <span className="font-medium">{poses.length}</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={onClose}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleExport}
                    className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Export
                  </button>
                </div>
              </div>
            ) : (
              /* Export Progress */
              <div className="space-y-6">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4">
                    <svg className="w-full h-full animate-spin text-blue-600" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </div>
                  <h4 className="text-lg font-medium text-gray-900 mb-2">
                    Exporting poses...
                  </h4>
                  <p className="text-sm text-gray-600">
                    This may take a few moments
                  </p>
                </div>

                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Progress</span>
                    <span>{Math.round(exportProgress)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <motion.div
                      className="bg-blue-600 h-2 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${exportProgress}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                  {currentItem && (
                    <p className="text-xs text-gray-500 truncate">
                      {currentItem}
                    </p>
                  )}
                </div>

                {exportProgress === 100 && (
                  <motion.div
                    className="text-center"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                  >
                    <div className="w-12 h-12 mx-auto mb-2 text-green-500">
                      <svg className="w-full h-full" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <p className="text-sm font-medium text-green-600">
                      Export complete!
                    </p>
                  </motion.div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default BatchExportDialog;