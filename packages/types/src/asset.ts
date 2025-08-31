// Asset types
export type AssetType = 'image' | 'skeleton' | 'json' | 'document';

// Image formats and processing status
export type ImageFormat = 'webp' | 'png' | 'jpg' | 'svg';
export type ProcessingStatus = 'pending' | 'processing' | 'completed' | 'failed';

// Image dimensions and metadata
export interface ImageDimensions {
  width: number;
  height: number;
  aspectRatio?: string; // e.g., "4:5", "16:9"
}

// Image processing options
export interface ImageProcessingOptions {
  format: ImageFormat;
  quality: number;
  alphaQuality?: number; // For WebP with transparency
  width?: number;
  height?: number;
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
  position?: 'center' | 'top' | 'bottom' | 'left' | 'right';
}

// CDN/Storage configuration
export interface StorageConfig {
  provider: 'aws-s3' | 'cloudflare-r2' | 'ali-oss' | 'local';
  bucket: string;
  region?: string;
  endpoint?: string;
  publicUrl: string;
}

// Asset metadata
export interface AssetMetadata {
  filename: string;
  originalName: string;
  mimeType: string;
  size: number; // File size in bytes
  dimensions?: ImageDimensions;
  colorSpace?: string;
  hasAlpha?: boolean;
  exif?: Record<string, any>;
  uploadedBy: string; // User ID
  uploadedAt: Date;
}

// Processed asset variants
export interface AssetVariant {
  id: string;
  assetId: string;
  type: 'thumbnail' | 'preview' | 'full' | 'og-image' | 'original';
  format: ImageFormat;
  dimensions: ImageDimensions;
  size: number;
  url: string;
  cdnUrl?: string;
  processing: ProcessingOptions;
  createdAt: Date;
}

// Main asset entity
export interface Asset {
  id: string;
  type: AssetType;
  title?: string;
  description?: string;
  metadata: AssetMetadata;
  variants: AssetVariant[];
  url: string; // Primary URL (768px WebP)
  cdnUrl?: string; // CDN URL
  thumbnailUrl?: string; // Small preview URL
  storageKey: string; // Storage path/key
  processingStatus: ProcessingStatus;
  processingError?: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
}

// Asset upload data
export interface CreateAssetData {
  file: File | Buffer;
  type: AssetType;
  title?: string;
  description?: string;
  tags?: string[];
  processingOptions?: ImageProcessingOptions;
}

// Asset update data
export interface UpdateAssetData {
  id: string;
  title?: string;
  description?: string;
  tags?: string[];
}

// Asset search/filter options
export interface AssetFilters {
  type?: AssetType;
  tags?: string[];
  uploadedBy?: string;
  processingStatus?: ProcessingStatus;
  search?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'createdAt' | 'size' | 'title';
  sortOrder?: 'asc' | 'desc';
}

// Asset search result
export interface AssetSearchResult {
  assets: Asset[];
  total: number;
  hasMore: boolean;
  nextOffset?: number;
}

// Bulk operation types
export interface BulkAssetOperation {
  operation: 'delete' | 'reprocess' | 'update-tags' | 'move';
  assetIds: string[];
  options?: {
    tags?: string[];
    processingOptions?: ImageProcessingOptions;
    destination?: string;
  };
}

// Upload progress tracking
export interface UploadProgress {
  id: string;
  filename: string;
  progress: number; // 0-100
  status: 'uploading' | 'processing' | 'completed' | 'error';
  error?: string;
  result?: Asset;
}

// Processing job for background tasks
export interface ProcessingJob {
  id: string;
  assetId: string;
  type: 'resize' | 'format-convert' | 'optimize' | 'generate-variants';
  options: ImageProcessingOptions;
  status: ProcessingStatus;
  progress: number;
  error?: string;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
}

export default {
  Asset,
  AssetVariant,
  AssetMetadata,
  CreateAssetData,
  UpdateAssetData,
  AssetFilters,
  AssetSearchResult,
  BulkAssetOperation,
  UploadProgress,
  ProcessingJob,
  ImageDimensions,
  ImageProcessingOptions,
  StorageConfig,
  AssetType,
  ImageFormat,
  ProcessingStatus
};