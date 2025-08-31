import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  boolean,
  integer,
  jsonb,
  pgEnum,
  index,
  unique,
} from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
import type { 
  Pose, 
  PoseKeypoints, 
  PosePrompts, 
  SEOMetadata,
  SafetyLevel,
  PoseStatus 
} from '@posekit/types';

// Custom types
export const safetyLevelEnum = pgEnum('safety_level', ['normal', 'caution', 'restricted']);
export const poseStatusEnum = pgEnum('pose_status', ['draft', 'review', 'published', 'archived']);

// Import related tables
import { themes } from './Theme';
import { assets } from './Asset';
import { users } from './User';
import { poseVariants } from './PoseVariant';

// Poses table definition
export const poses = pgTable('poses', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: varchar('slug', { length: 200 }).notNull().unique(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  aliases: text('aliases').array().default(sql`ARRAY[]::text[]`),
  
  // Categorization
  themeId: uuid('theme_id').notNull().references(() => themes.id),
  tagIds: uuid('tag_ids').array().default(sql`ARRAY[]::uuid[]`),
  
  // Pose structure
  skeleton: varchar('skeleton', { length: 100 }),
  keypoints: jsonb('keypoints').notNull().$type<PoseKeypoints>(),
  previewAssetId: uuid('preview_asset_id').references(() => assets.id),
  variantIds: uuid('variant_ids').array().default(sql`ARRAY[]::uuid[]`),
  
  // AI prompts
  prompts: jsonb('prompts').default({}).$type<PosePrompts>(),
  
  // Safety information
  safetyLevel: safetyLevelEnum('safety_level').default('normal'),
  safetyNotes: text('safety_notes'),
  
  // SEO metadata
  seoTitle: varchar('seo_title', { length: 255 }),
  seoDescription: text('seo_description'),
  seoKeywords: text('seo_keywords').array().default(sql`ARRAY[]::text[]`),
  ogTitle: varchar('og_title', { length: 255 }),
  ogDescription: text('og_description'),
  ogImage: varchar('og_image', { length: 500 }),
  canonicalUrl: varchar('canonical_url', { length: 500 }),
  
  // Status and workflow
  status: poseStatusEnum('status').default('draft'),
  featured: boolean('featured').default(false),
  sortOrder: integer('sort_order').default(0),
  
  // Analytics
  viewCount: integer('view_count').default(0),
  downloadCount: integer('download_count').default(0),
  favoriteCount: integer('favorite_count').default(0),
  
  // Search vector for full-text search
  searchVector: text('search_vector'), // tsvector stored as text for Drizzle compatibility
  
  // Metadata
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  publishedAt: timestamp('published_at', { withTimezone: true }),
  createdBy: uuid('created_by').notNull().references(() => users.id),
  updatedBy: uuid('updated_by').notNull().references(() => users.id),
}, (table) => ({
  // Indexes for performance
  slugIndex: unique('poses_slug_unique').on(table.slug),
  themeIdIndex: index('poses_theme_id_idx').on(table.themeId),
  statusFeaturedIndex: index('poses_status_featured_idx').on(table.status, table.featured),
  createdAtIndex: index('poses_created_at_idx').on(table.createdAt),
  tagIdsIndex: index('poses_tag_ids_idx').on(table.tagIds),
  variantIdsIndex: index('poses_variant_ids_idx').on(table.variantIds),
}));

// Relations
export const posesRelations = relations(poses, ({ one, many }) => ({
  // One-to-one relations
  theme: one(themes, {
    fields: [poses.themeId],
    references: [themes.id],
  }),
  previewAsset: one(assets, {
    fields: [poses.previewAssetId],
    references: [assets.id],
  }),
  createdByUser: one(users, {
    fields: [poses.createdBy],
    references: [users.id],
    relationName: 'poseCreatedBy',
  }),
  updatedByUser: one(users, {
    fields: [poses.updatedBy],
    references: [users.id],
    relationName: 'poseUpdatedBy',
  }),
  
  // One-to-many relations
  variants: many(poseVariants),
}));

// Zod schemas for validation
export const insertPoseSchema = createInsertSchema(poses, {
  title: z.string().min(1).max(255),
  slug: z.string().min(1).max(200).regex(/^[a-z0-9-]+$/, 'Invalid slug format'),
  description: z.string().optional(),
  aliases: z.array(z.string()).default([]),
  keypoints: z.object({}).passthrough(), // Flexible keypoints validation
  prompts: z.object({
    sdxl: z.string().optional(),
    flux: z.string().optional(),
    midjourney: z.string().optional(),
  }).passthrough().default({}),
  safetyLevel: z.enum(['normal', 'caution', 'restricted']).default('normal'),
  status: z.enum(['draft', 'review', 'published', 'archived']).default('draft'),
  featured: z.boolean().default(false),
  sortOrder: z.number().int().default(0),
});

export const selectPoseSchema = createSelectSchema(poses);

// Partial schemas for updates
export const updatePoseSchema = insertPoseSchema.partial().omit({
  id: true,
  createdAt: true,
  createdBy: true,
});

// Search and filter schemas
export const poseFiltersSchema = z.object({
  themeId: z.string().uuid().optional(),
  tagIds: z.array(z.string().uuid()).optional(),
  status: z.enum(['draft', 'review', 'published', 'archived']).optional(),
  safetyLevel: z.enum(['normal', 'caution', 'restricted']).optional(),
  featured: z.boolean().optional(),
  search: z.string().optional(),
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
  sortBy: z.enum(['title', 'createdAt', 'viewCount', 'favoriteCount', 'updatedAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// Type exports
export type PoseInsert = z.infer<typeof insertPoseSchema>;
export type PoseSelect = z.infer<typeof selectPoseSchema>;
export type PoseUpdate = z.infer<typeof updatePoseSchema>;
export type PoseFilters = z.infer<typeof poseFiltersSchema>;

// Utility functions for working with poses
export const poseUtils = {
  // Generate slug from title
  generateSlug: (title: string): string => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
  },
  
  // Build SEO metadata from pose data
  buildSEOMetadata: (pose: PoseSelect): SEOMetadata => ({
    title: pose.seoTitle || `${pose.title} - Pose Reference | PoseKit`,
    description: pose.seoDescription || pose.description || `Professional photography pose reference: ${pose.title}`,
    keywords: pose.seoKeywords || [pose.title, ...(pose.aliases || [])],
    ogTitle: pose.ogTitle || pose.title,
    ogDescription: pose.ogDescription || pose.description,
    ogImage: pose.ogImage,
    canonical: pose.canonicalUrl,
  }),
  
  // Check if pose is published and visible
  isPublished: (pose: PoseSelect): boolean => {
    return pose.status === 'published' && !!pose.publishedAt;
  },
  
  // Get computed full-text search terms
  getSearchTerms: (pose: PoseSelect): string[] => {
    return [
      pose.title,
      ...(pose.aliases || []),
      pose.description || '',
      ...(pose.seoKeywords || []),
    ].filter(Boolean);
  },
  
  // Build pose preview URL
  getPreviewUrl: (pose: PoseSelect, baseUrl: string = ''): string => {
    return `${baseUrl}/poses/${pose.slug}`;
  },
  
  // Check safety level requirements
  requiresWarning: (pose: PoseSelect): boolean => {
    return pose.safetyLevel === 'caution' || pose.safetyLevel === 'restricted';
  },
  
  // Get display tags (computed from tagIds)
  async getDisplayTags(pose: PoseSelect, tagLookup: Record<string, string>): Promise<string[]> {
    return (pose.tagIds || []).map(id => tagLookup[id] || id).filter(Boolean);
  },
};

export default poses;