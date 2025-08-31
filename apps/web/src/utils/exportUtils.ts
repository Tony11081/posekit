'use client';

import JSZip from 'jszip';

interface ExportOptions {
  format: 'json' | 'zip' | 'csv';
  includeImages?: boolean;
  includeMetadata?: boolean;
}

interface PoseExportData {
  id: string;
  title: string;
  slug: string;
  theme: string;
  previewUrl?: string;
  keypoints?: any;
  metadata?: any;
}

// Export poses to JSON
export async function exportPosesToJSON(poses: PoseExportData[]): Promise<Blob> {
  const exportData = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    count: poses.length,
    poses: poses.map(pose => ({
      id: pose.id,
      title: pose.title,
      slug: pose.slug,
      theme: pose.theme,
      previewUrl: pose.previewUrl,
      keypoints: pose.keypoints,
      metadata: pose.metadata,
    })),
  };

  return new Blob([JSON.stringify(exportData, null, 2)], {
    type: 'application/json',
  });
}

// Export poses to CSV
export async function exportPosesToCSV(poses: PoseExportData[]): Promise<Blob> {
  const headers = ['ID', 'Title', 'Slug', 'Theme', 'Preview URL'];
  const rows = poses.map(pose => [
    pose.id,
    pose.title,
    pose.slug,
    pose.theme,
    pose.previewUrl || '',
  ]);

  const csvContent = [headers, ...rows]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n');

  return new Blob([csvContent], { type: 'text/csv' });
}

// Export poses to ZIP with images
export async function exportPosesToZIP(
  poses: PoseExportData[],
  options: { includeImages?: boolean; includeMetadata?: boolean } = {}
): Promise<Blob> {
  const zip = new JSZip();

  // Add metadata JSON
  if (options.includeMetadata !== false) {
    const metadata = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      count: poses.length,
      poses: poses.map(pose => ({
        id: pose.id,
        title: pose.title,
        slug: pose.slug,
        theme: pose.theme,
        keypoints: pose.keypoints,
        metadata: pose.metadata,
      })),
    };
    zip.file('metadata.json', JSON.stringify(metadata, null, 2));
  }

  // Add CSV for easy viewing
  const csvBlob = await exportPosesToCSV(poses);
  const csvContent = await csvBlob.text();
  zip.file('poses.csv', csvContent);

  // Add images if requested
  if (options.includeImages) {
    const imagePromises = poses
      .filter(pose => pose.previewUrl)
      .map(async (pose) => {
        try {
          const response = await fetch(pose.previewUrl!, { mode: 'cors' });
          if (!response.ok) throw new Error(`Failed to fetch ${pose.previewUrl}`);
          
          const arrayBuffer = await response.arrayBuffer();
          const extension = pose.previewUrl!.split('.').pop() || 'jpg';
          const filename = `images/${pose.slug || pose.id}.${extension}`;
          
          zip.file(filename, arrayBuffer);
        } catch (error) {
          console.warn(`Failed to download image for pose ${pose.id}:`, error);
        }
      });

    await Promise.allSettled(imagePromises);
  }

  return zip.generateAsync({ type: 'blob' });
}

// Download blob as file
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Main export function
export async function exportPoses(
  poses: PoseExportData[],
  options: ExportOptions
): Promise<void> {
  const timestamp = new Date().toISOString().split('T')[0];
  
  try {
    switch (options.format) {
      case 'json': {
        const blob = await exportPosesToJSON(poses);
        downloadBlob(blob, `posekit-export-${timestamp}.json`);
        break;
      }
      
      case 'csv': {
        const blob = await exportPosesToCSV(poses);
        downloadBlob(blob, `posekit-export-${timestamp}.csv`);
        break;
      }
      
      case 'zip': {
        const blob = await exportPosesToZIP(poses, {
          includeImages: options.includeImages,
          includeMetadata: options.includeMetadata,
        });
        downloadBlob(blob, `posekit-export-${timestamp}.zip`);
        break;
      }
      
      default:
        throw new Error(`Unsupported export format: ${options.format}`);
    }
  } catch (error) {
    console.error('Export failed:', error);
    throw new Error('Failed to export poses. Please try again.');
  }
}

// Export individual pose with all variants
export async function exportSinglePose(
  pose: PoseExportData & { variants?: any[] },
  format: 'json' | 'zip' = 'json'
): Promise<void> {
  const exportData = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    pose: {
      id: pose.id,
      title: pose.title,
      slug: pose.slug,
      theme: pose.theme,
      previewUrl: pose.previewUrl,
      keypoints: pose.keypoints,
      metadata: pose.metadata,
      variants: pose.variants || [],
    },
  };

  const timestamp = new Date().toISOString().split('T')[0];
  const filename = `${pose.slug || pose.id}-${timestamp}`;

  if (format === 'json') {
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });
    downloadBlob(blob, `${filename}.json`);
  } else if (format === 'zip') {
    const zip = new JSZip();
    
    // Add pose data
    zip.file('pose.json', JSON.stringify(exportData, null, 2));
    
    // Add main image
    if (pose.previewUrl) {
      try {
        const response = await fetch(pose.previewUrl, { mode: 'cors' });
        if (response.ok) {
          const arrayBuffer = await response.arrayBuffer();
          const extension = pose.previewUrl.split('.').pop() || 'jpg';
          zip.file(`preview.${extension}`, arrayBuffer);
        }
      } catch (error) {
        console.warn('Failed to download preview image:', error);
      }
    }
    
    // Add variant images
    if (pose.variants) {
      const variantPromises = pose.variants
        .filter(variant => variant.previewUrl)
        .map(async (variant, index) => {
          try {
            const response = await fetch(variant.previewUrl, { mode: 'cors' });
            if (!response.ok) return;
            
            const arrayBuffer = await response.arrayBuffer();
            const extension = variant.previewUrl.split('.').pop() || 'jpg';
            zip.file(`variants/variant-${index + 1}.${extension}`, arrayBuffer);
          } catch (error) {
            console.warn(`Failed to download variant ${index + 1} image:`, error);
          }
        });
      
      await Promise.allSettled(variantPromises);
    }
    
    const blob = await zip.generateAsync({ type: 'blob' });
    downloadBlob(blob, `${filename}.zip`);
  }
}

// Batch export with progress tracking
export async function exportPosesWithProgress(
  poses: PoseExportData[],
  options: ExportOptions,
  onProgress?: (progress: number, currentItem: string) => void
): Promise<void> {
  const total = poses.length;
  let completed = 0;

  if (options.format === 'zip' && options.includeImages) {
    const zip = new JSZip();
    
    // Add metadata
    const metadata = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      count: poses.length,
      poses: poses.map(pose => ({
        id: pose.id,
        title: pose.title,
        slug: pose.slug,
        theme: pose.theme,
        keypoints: pose.keypoints,
        metadata: pose.metadata,
      })),
    };
    zip.file('metadata.json', JSON.stringify(metadata, null, 2));

    // Add CSV
    const csvBlob = await exportPosesToCSV(poses);
    const csvContent = await csvBlob.text();
    zip.file('poses.csv', csvContent);

    // Process images with progress
    for (const pose of poses) {
      if (onProgress) {
        onProgress((completed / total) * 100, pose.title);
      }

      if (pose.previewUrl) {
        try {
          const response = await fetch(pose.previewUrl, { mode: 'cors' });
          if (response.ok) {
            const arrayBuffer = await response.arrayBuffer();
            const extension = pose.previewUrl.split('.').pop() || 'jpg';
            const filename = `images/${pose.slug || pose.id}.${extension}`;
            zip.file(filename, arrayBuffer);
          }
        } catch (error) {
          console.warn(`Failed to download image for pose ${pose.id}:`, error);
        }
      }

      completed++;
    }

    if (onProgress) {
      onProgress(100, 'Generating ZIP file...');
    }

    const blob = await zip.generateAsync({ type: 'blob' });
    const timestamp = new Date().toISOString().split('T')[0];
    downloadBlob(blob, `posekit-export-${timestamp}.zip`);
  } else {
    // For non-image exports, use the regular method
    await exportPoses(poses, options);
  }

  if (onProgress) {
    onProgress(100, 'Export complete');
  }
}