'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDropzone } from 'react-dropzone';

interface UploadedFile {
  file: File;
  id: string;
  preview: string;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
}

interface ImageUploaderProps {
  onUploadComplete?: (assets: any[]) => void;
  maxFiles?: number;
  targetSize?: number;
  className?: string;
}

export function ImageUploader({
  onUploadComplete,
  maxFiles = 10,
  targetSize = 768,
  className = '',
}: ImageUploaderProps) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [overallProgress, setOverallProgress] = useState(0);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles: UploadedFile[] = acceptedFiles.map(file => ({
      file,
      id: Math.random().toString(36).substr(2, 9),
      preview: URL.createObjectURL(file),
      progress: 0,
      status: 'pending',
    }));

    setFiles(prev => [...prev, ...newFiles].slice(0, maxFiles));
  }, [maxFiles]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp', '.gif'],
    },
    maxFiles: maxFiles - files.length,
    disabled: isUploading,
  });

  const removeFile = (id: string) => {
    setFiles(prev => {
      const file = prev.find(f => f.id === id);
      if (file?.preview) {
        URL.revokeObjectURL(file.preview);
      }
      return prev.filter(f => f.id !== id);
    });
  };

  const uploadFiles = async () => {
    if (files.length === 0 || isUploading) return;

    setIsUploading(true);
    const uploadedAssets = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const fileItem = files[i];
        
        // Update file status
        setFiles(prev => 
          prev.map(f => 
            f.id === fileItem.id 
              ? { ...f, status: 'uploading', progress: 0 }
              : f
          )
        );

        try {
          const formData = new FormData();
          formData.append('image', fileItem.file);

          const response = await fetch('/api/assets/upload', {
            method: 'POST',
            body: formData,
            headers: {
              // Don't set Content-Type, let browser set it with boundary
            },
          });

          if (!response.ok) {
            throw new Error(`Upload failed: ${response.statusText}`);
          }

          const result = await response.json();
          
          // Update file status to success
          setFiles(prev => 
            prev.map(f => 
              f.id === fileItem.id 
                ? { ...f, status: 'success', progress: 100 }
                : f
            )
          );

          uploadedAssets.push(result.asset);

        } catch (error) {
          // Update file status to error
          setFiles(prev => 
            prev.map(f => 
              f.id === fileItem.id 
                ? { 
                    ...f, 
                    status: 'error', 
                    error: error instanceof Error ? error.message : 'Upload failed'
                  }
                : f
            )
          );
        }

        // Update overall progress
        setOverallProgress(((i + 1) / files.length) * 100);
      }

      if (uploadedAssets.length > 0 && onUploadComplete) {
        onUploadComplete(uploadedAssets);
      }

    } finally {
      setIsUploading(false);
      setOverallProgress(0);
    }
  };

  const clearAll = () => {
    files.forEach(file => {
      if (file.preview) {
        URL.revokeObjectURL(file.preview);
      }
    });
    setFiles([]);
  };

  const retryFailed = async () => {
    const failedFiles = files.filter(f => f.status === 'error');
    if (failedFiles.length === 0) return;

    for (const fileItem of failedFiles) {
      setFiles(prev => 
        prev.map(f => 
          f.id === fileItem.id 
            ? { ...f, status: 'pending', error: undefined }
            : f
        )
      );
    }

    await uploadFiles();
  };

  // Stats
  const stats = {
    total: files.length,
    pending: files.filter(f => f.status === 'pending').length,
    uploading: files.filter(f => f.status === 'uploading').length,
    success: files.filter(f => f.status === 'success').length,
    error: files.filter(f => f.status === 'error').length,
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Upload Area */}
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
          ${isDragActive 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
          }
          ${isUploading ? 'pointer-events-none opacity-50' : ''}
        `}
      >
        <input {...getInputProps()} />
        
        <div className="space-y-4">
          <div className="text-gray-400">
            <svg className="w-12 h-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
          </div>
          
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {isDragActive ? 'Drop images here' : 'Upload pose images'}
            </h3>
            <p className="text-gray-600">
              Drop images here or click to browse. Images will be automatically resized to {targetSize}px and converted to WebP.
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Supports JPEG, PNG, WebP, GIF • Max {maxFiles} files • Up to 10MB each
            </p>
          </div>
        </div>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-4">
          {/* Controls */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {stats.total} file{stats.total !== 1 ? 's' : ''} selected
              {stats.success > 0 && (
                <span className="ml-2 text-green-600">
                  • {stats.success} uploaded
                </span>
              )}
              {stats.error > 0 && (
                <span className="ml-2 text-red-600">
                  • {stats.error} failed
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              {stats.error > 0 && !isUploading && (
                <button
                  onClick={retryFailed}
                  className="px-3 py-1 text-sm bg-orange-100 text-orange-700 rounded hover:bg-orange-200 transition-colors"
                >
                  Retry Failed
                </button>
              )}
              
              <button
                onClick={clearAll}
                disabled={isUploading}
                className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50 transition-colors"
              >
                Clear All
              </button>
              
              <button
                onClick={uploadFiles}
                disabled={isUploading || stats.pending === 0}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {isUploading ? 'Uploading...' : `Upload ${stats.pending} Files`}
              </button>
            </div>
          </div>

          {/* Overall Progress */}
          {isUploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Overall Progress</span>
                <span>{Math.round(overallProgress)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <motion.div
                  className="bg-blue-600 h-2 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${overallProgress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>
          )}

          {/* File Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <AnimatePresence>
              {files.map((fileItem) => (
                <motion.div
                  key={fileItem.id}
                  className="relative border border-gray-200 rounded-lg overflow-hidden"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                >
                  {/* Image Preview */}
                  <div className="aspect-square bg-gray-100">
                    <img
                      src={fileItem.preview}
                      alt={fileItem.file.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Status Overlay */}
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    {fileItem.status === 'pending' && (
                      <div className="text-white text-center">
                        <div className="w-8 h-8 mx-auto mb-2">
                          <svg fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <p className="text-xs">Pending</p>
                      </div>
                    )}

                    {fileItem.status === 'uploading' && (
                      <div className="text-white text-center">
                        <div className="w-8 h-8 mx-auto mb-2 animate-spin">
                          <svg fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        </div>
                        <p className="text-xs">Uploading...</p>
                      </div>
                    )}

                    {fileItem.status === 'success' && (
                      <div className="text-green-400 text-center">
                        <div className="w-8 h-8 mx-auto mb-2">
                          <svg fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <p className="text-xs">Uploaded</p>
                      </div>
                    )}

                    {fileItem.status === 'error' && (
                      <div className="text-red-400 text-center">
                        <div className="w-8 h-8 mx-auto mb-2">
                          <svg fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <p className="text-xs">Failed</p>
                      </div>
                    )}
                  </div>

                  {/* Remove Button */}
                  {!isUploading && (
                    <button
                      onClick={() => removeFile(fileItem.id)}
                      className="absolute top-2 right-2 w-6 h-6 bg-red-600 text-white rounded-full flex items-center justify-center hover:bg-red-700 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}

                  {/* File Info */}
                  <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 text-white p-2">
                    <p className="text-xs truncate" title={fileItem.file.name}>
                      {fileItem.file.name}
                    </p>
                    <p className="text-xs text-gray-300">
                      {(fileItem.file.size / 1024 / 1024).toFixed(1)} MB
                    </p>
                    {fileItem.error && (
                      <p className="text-xs text-red-400 mt-1" title={fileItem.error}>
                        {fileItem.error}
                      </p>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
}

export default ImageUploader;