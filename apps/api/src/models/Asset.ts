import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  bigint,
  integer,
  boolean,
  jsonb,
  pgEnum,
  index,
} from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
import type { 
  Asset, 
  AssetVariant, 
  AssetMetadata,
  ImageDimensions,
  AssetType,
  ProcessingStatus 
} from '@posekit/types';

// Custom enums
export const assetTypeEnum = pgEnum('asset_type', ['image', 'skeleton', 'json', 'document']);
export const processingStatusEnum = pgEnum('processing_status', ['pending', 'processing', 'completed', 'failed']);

// Import related tables
import { users } from './User';

// Assets table definition
export const assets = pgTable('assets', {
  id: uuid('id').primaryKey().defaultRandom(),
  type: assetTypeEnum('type').notNull().default('image'),
  title: varchar('title', { length: 255 }),
  description: text('description'),
  
  // File metadata
  filename: varchar('filename', { length: 255 }).notNull(),
  originalName: varchar('original_name', { length: 255 }).notNull(),
  mimeType: varchar('mime_type', { length: 100 }).notNull(),
  fileSize: bigint('file_size', { mode: 'number' }).notNull(), // Size in bytes
  
  // Image-specific metadata (null for non-images)
  width: integer('width'),
  height: integer('height'),
  aspectRatio: varchar('aspect_ratio', { length: 10 }), // e.g., "4:5"
  colorSpace: varchar('color_space', { length: 20 }),
  hasAlpha: boolean('has_alpha').default(false),
  exifData: jsonb('exif_data'),
  
  // Storage information
  storageKey: varchar('storage_key', { length: 500 }).notNull(), // S3 key or file path
  url: varchar('url', { length: 1000 }).notNull(), // Primary URL (768px WebP)
  cdnUrl: varchar('cdn_url', { length: 1000 }), // CDN URL if different
  thumbnailUrl: varchar('thumbnail_url', { length: 1000 }), // Small preview
  
  // Processing status
  processingStatus: processingStatusEnum('processing_status').default('pending'),
  processingError: text('processing_error'),
  variants: jsonb('variants').default(sql`'[]'::jsonb`).$type<AssetVariant[]>(),
  
  // Categorization
  tags: text('tags').array().default(sql`ARRAY[]::text[]`),
  
  // Metadata
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  createdBy: uuid('created_by').notNull().references(() => users.id),
  updatedBy: uuid('updated_by').notNull().references(() => users.id),
}, (table) => ({
  // Indexes for performance
  typeStatusIndex: index('assets_type_status_idx').on(table.type, table.processingStatus),
  createdByIndex: index('assets_created_by_idx').on(table.createdBy),
  storageKeyIndex: index('assets_storage_key_idx').on(table.storageKey),
  createdAtIndex: index('assets_created_at_idx').on(table.createdAt),
  tagsIndex: index('assets_tags_idx').on(table.tags),
}));

// Relations
export const assetsRelations = relations(assets, ({ one }) => ({
  createdByUser: one(users, {
    fields: [assets.createdBy],
    references: [users.id],
    relationName: 'assetCreatedBy',
  }),
  updatedByUser: one(users, {
    fields: [assets.updatedBy],
    references: [users.id],
    relationName: 'assetUpdatedBy',
  }),
}));

// Validation schemas
const imageDimensionsSchema = z.object({
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  aspectRatio: z.string().optional(),
});

const assetVariantSchema = z.object({
  id: z.string(),
  assetId: z.string(),
  type: z.enum(['thumbnail', 'preview', 'full', 'og-image', 'original']),
  format: z.enum(['webp', 'png', 'jpg', 'svg']),
  dimensions: imageDimensionsSchema,
  size: z.number().int().positive(),
  url: z.string().url(),
  cdnUrl: z.string().url().optional(),
  createdAt: z.date(),
});

export const insertAssetSchema = createInsertSchema(assets, {
  type: z.enum(['image', 'skeleton', 'json', 'document']).default('image'),
  title: z.string().max(255).optional(),
  description: z.string().optional(),
  filename: z.string().min(1).max(255),
  originalName: z.string().min(1).max(255),
  mimeType: z.string().min(1).max(100),
  fileSize: z.number().int().positive(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  aspectRatio: z.string().max(10).optional(),
  colorSpace: z.string().max(20).optional(),
  hasAlpha: z.boolean().default(false),
  exifData: z.record(z.any()).optional(),
  storageKey: z.string().min(1).max(500),
  url: z.string().url().max(1000),
  cdnUrl: z.string().url().max(1000).optional(),
  thumbnailUrl: z.string().url().max(1000).optional(),
  processingStatus: z.enum(['pending', 'processing', 'completed', 'failed']).default('pending'),
  processingError: z.string().optional(),
  variants: z.array(assetVariantSchema).default([]),
  tags: z.array(z.string()).default([]),
});

export const selectAssetSchema = createSelectSchema(assets);

export const updateAssetSchema = insertAssetSchema.partial().omit({
  id: true,
  createdAt: true,
  createdBy: true,
});

// Filter and search schemas
export const assetFiltersSchema = z.object({
  type: z.enum(['image', 'skeleton', 'json', 'document']).optional(),
  processingStatus: z.enum(['pending', 'processing', 'completed', 'failed']).optional(),
  tags: z.array(z.string()).optional(),
  createdBy: z.string().uuid().optional(),
  search: z.string().optional(),
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
  sortBy: z.enum(['createdAt', 'fileSize', 'title', 'originalName']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// Type exports
export type AssetInsert = z.infer<typeof insertAssetSchema>;
export type AssetSelect = z.infer<typeof selectAssetSchema>;
export type AssetUpdate = z.infer<typeof updateAssetSchema>;
export type AssetFilters = z.infer<typeof assetFiltersSchema>;

// Asset utilities
export const assetUtils = {
  // Generate storage key from filename
  generateStorageKey: (filename: string, userId: string): string => {
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 8);
    const extension = filename.split('.').pop();
    return `assets/${userId}/${timestamp}_${randomId}.${extension}`;
  },
  
  // Calculate aspect ratio
  calculateAspectRatio: (width: number, height: number): string => {
    const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b);
    const divisor = gcd(width, height);
    return `${width / divisor}:${height / divisor}`;
  },
  
  // Format file size for display
  formatFileSize: (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  },
  
  // Check if asset is an image
  isImage: (asset: AssetSelect): boolean => {
    return asset.type === 'image' && asset.mimeType.startsWith('image/');
  },
  
  // Check if processing is complete
  isProcessed: (asset: AssetSelect): boolean => {
    return asset.processingStatus === 'completed';
  },
  
  // Check if processing failed
  hasFailed: (asset: AssetSelect): boolean => {
    return asset.processingStatus === 'failed';
  },
  
  // Get primary URL (CDN if available, otherwise regular URL)
  getPrimaryUrl: (asset: AssetSelect): string => {
    return asset.cdnUrl || asset.url;
  },
  
  // Get thumbnail URL with fallback
  getThumbnailUrl: (asset: AssetSelect): string => {
    return asset.thumbnailUrl || asset.cdnUrl || asset.url;
  },
  
  // Build asset metadata object
  buildMetadata: (asset: AssetSelect): AssetMetadata => ({
    filename: asset.filename,
    originalName: asset.originalName,
    mimeType: asset.mimeType,
    size: asset.fileSize,
    dimensions: asset.width && asset.height ? {
      width: asset.width,
      height: asset.height,
      aspectRatio: asset.aspectRatio,
    } : undefined,
    colorSpace: asset.colorSpace,
    hasAlpha: asset.hasAlpha,
    exif: asset.exifData as Record<string, any>,
    uploadedBy: asset.createdBy,
    uploadedAt: asset.createdAt,
  }),
  
  // Get supported image formats
  getSupportedFormats: (): string[] => {
    return ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
  },
  
  // Check if MIME type is supported
  isSupportedFormat: (mimeType: string): boolean => {
    return assetUtils.getSupportedFormats().includes(mimeType.toLowerCase());
  },
  
  // Generate variants configuration for processing
  getVariantsConfig: () => ({
    thumbnail: { width: 150, height: 150, fit: 'cover' as const },
    preview: { width: 400, height: 400, fit: 'inside' as const },
    full: { width: 768, fit: 'inside' as const }, // Our 768px standard
    'og-image': { width: 1200, height: 630, fit: 'cover' as const },
  }),
  
  // Filter assets by type
  filterByType: (assets: AssetSelect[], type: AssetType): AssetSelect[] => {
    return assets.filter(asset => asset.type === type);
  },
  
  // Get assets with processing errors
  getFailedAssets: (assets: AssetSelect[]): AssetSelect[] => {
    return assets.filter(asset => asset.processingStatus === 'failed');
  },
  
  // Calculate total storage usage
  calculateStorageUsage: (assets: AssetSelect[]): number => {
    return assets.reduce((total, asset) => total + asset.fileSize, 0);
  },
};

export default assets;