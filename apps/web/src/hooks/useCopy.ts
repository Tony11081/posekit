'use client';

import { useState, useCallback } from 'react';

interface CopyResult {
  success: boolean;
  error?: string;
}

export function useCopy() {
  const [lastCopied, setLastCopied] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Copy text to clipboard
  const copyText = useCallback(async (text: string): Promise<CopyResult> => {
    if (!text) {
      return { success: false, error: 'No text provided' };
    }

    setIsLoading(true);
    
    try {
      // Try modern Clipboard API first
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        setLastCopied(text);
        setIsLoading(false);
        return { success: true };
      }
      
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      
      if (successful) {
        setLastCopied(text);
        setIsLoading(false);
        return { success: true };
      } else {
        setIsLoading(false);
        return { success: false, error: 'Copy command failed' };
      }
    } catch (error) {
      setIsLoading(false);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }, []);

  // Copy to clipboard (generic wrapper)
  const copyToClipboard = useCallback(async (content: string): Promise<void> => {
    const result = await copyText(content);
    if (!result.success) {
      throw new Error(result.error || 'Failed to copy to clipboard');
    }
  }, [copyText]);

  // Copy image URL (for PNG downloads)
  const copyImageUrl = useCallback(async (url: string): Promise<CopyResult> => {
    if (!url) {
      return { success: false, error: 'No URL provided' };
    }

    try {
      // For images, we can either copy the URL or trigger a download
      // Let's copy the URL for now - download can be handled separately
      return await copyText(url);
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to copy image URL' 
      };
    }
  }, [copyText]);

  // Download file from URL
  const downloadFile = useCallback(async (url: string, filename?: string): Promise<void> => {
    try {
      // Create a temporary anchor element to trigger download
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = filename || url.split('/').pop() || 'download';
      anchor.style.display = 'none';
      
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
    } catch (error) {
      throw new Error('Failed to download file');
    }
  }, []);

  // Copy JSON data (formatted)
  const copyJSON = useCallback(async (data: any): Promise<CopyResult> => {
    try {
      const jsonString = JSON.stringify(data, null, 2);
      return await copyText(jsonString);
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to serialize JSON' 
      };
    }
  }, [copyText]);

  // Copy pose data with metadata
  const copyPoseData = useCallback(async (
    pose: any, 
    format: 'url' | 'json' | 'prompt' = 'url'
  ): Promise<CopyResult> => {
    try {
      switch (format) {
        case 'url':
          if (pose.previewAsset?.url) {
            return await copyImageUrl(pose.previewAsset.url);
          } else {
            return { success: false, error: 'No image URL available' };
          }
        
        case 'json':
          const poseData = {
            id: pose.id,
            title: pose.title,
            keypoints: pose.keypoints,
            skeleton: pose.skeleton,
            safetyLevel: pose.safetyLevel,
            safetyNotes: pose.safetyNotes,
          };
          return await copyJSON(poseData);
        
        case 'prompt':
          const prompt = pose.prompts?.sdxl || pose.prompts?.flux || '';
          if (prompt) {
            return await copyText(prompt);
          } else {
            return { success: false, error: 'No prompt available' };
          }
        
        default:
          return { success: false, error: 'Invalid format specified' };
      }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to copy pose data' 
      };
    }
  }, [copyImageUrl, copyJSON, copyText]);

  // Check if clipboard is supported
  const isClipboardSupported = useCallback((): boolean => {
    return !!(navigator.clipboard || document.execCommand);
  }, []);

  // Clear last copied state
  const clearLastCopied = useCallback(() => {
    setLastCopied(null);
  }, []);

  return {
    // Core functions
    copyText,
    copyToClipboard,
    copyImageUrl,
    copyJSON,
    copyPoseData,
    downloadFile,
    
    // State
    lastCopied,
    isLoading,
    
    // Utilities
    isClipboardSupported,
    clearLastCopied,
  };
}

export default useCopy;