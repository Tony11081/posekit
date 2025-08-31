import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  integer,
  jsonb,
  pgEnum,
  index,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
import type { 
  PoseVariant, 
  PoseKeypoints, 
  PosePrompts,
  VariantType 
} from '@posekit/types';

// Custom enums
export const variantTypeEnum = pgEnum('variant_type', ['mirror', 'angle', 'lens']);

// Import related tables
import { poses } from './Pose';
import { assets } from './Asset';

// Pose variants table definition
export const poseVariants = pgTable('pose_variants', {
  id: uuid('id').primaryKey().defaultRandom(),
  poseId: uuid('pose_id').notNull().references(() => poses.id, { onDelete: 'cascade' }),
  type: variantTypeEnum('type').notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  
  // Variant-specific data
  assetId: uuid('asset_id').notNull().references(() => assets.id),
  keypoints: jsonb('keypoints').$type<PoseKeypoints>(), // Override keypoints if different
  prompts: jsonb('prompts').default({}).$type<PosePrompts>(), // Variant-specific prompts
  
  // Metadata
  sortOrder: integer('sort_order').default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  // Indexes for performance
  poseIdIndex: index('pose_variants_pose_id_idx').on(table.poseId),
  assetIdIndex: index('pose_variants_asset_id_idx').on(table.assetId),
  typeIndex: index('pose_variants_type_idx').on(table.type),
  sortOrderIndex: index('pose_variants_sort_order_idx').on(table.poseId, table.sortOrder),
}));

// Relations
export const poseVariantsRelations = relations(poseVariants, ({ one }) => ({
  pose: one(poses, {
    fields: [poseVariants.poseId],
    references: [poses.id],
  }),
  asset: one(assets, {
    fields: [poseVariants.assetId],
    references: [assets.id],
  }),
}));

// Validation schemas
export const insertPoseVariantSchema = createInsertSchema(poseVariants, {
  poseId: z.string().uuid(),
  type: z.enum(['mirror', 'angle', 'lens']),
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  assetId: z.string().uuid(),
  keypoints: z.object({}).passthrough().optional(), // Flexible keypoints validation
  prompts: z.object({
    sdxl: z.string().optional(),
    flux: z.string().optional(),
    midjourney: z.string().optional(),
  }).passthrough().default({}),
  sortOrder: z.number().int().default(0),
});

export const selectPoseVariantSchema = createSelectSchema(poseVariants);

export const updatePoseVariantSchema = insertPoseVariantSchema.partial().omit({
  id: true,
  createdAt: true,
  poseId: true, // Don't allow changing parent pose
});

// Filter schemas
export const poseVariantFiltersSchema = z.object({
  poseId: z.string().uuid().optional(),
  type: z.enum(['mirror', 'angle', 'lens']).optional(),
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
  sortBy: z.enum(['title', 'type', 'sortOrder', 'createdAt']).default('sortOrder'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

// Type exports
export type PoseVariantInsert = z.infer<typeof insertPoseVariantSchema>;
export type PoseVariantSelect = z.infer<typeof selectPoseVariantSchema>;
export type PoseVariantUpdate = z.infer<typeof updatePoseVariantSchema>;
export type PoseVariantFilters = z.infer<typeof poseVariantFiltersSchema>;

// Pose variant utilities
export const poseVariantUtils = {
  // Variant type display names
  getTypeDisplayName: (type: VariantType): string => {
    const typeNames = {
      mirror: 'Mirrored',
      angle: 'Different Angle',
      lens: 'Different Lens',
    };
    return typeNames[type] || type;
  },
  
  // Variant type descriptions
  getTypeDescription: (type: VariantType): string => {
    const descriptions = {
      mirror: 'Horizontally flipped version of the original pose',
      angle: 'Same pose captured from a different camera angle',
      lens: 'Same pose captured with a different lens focal length',
    };
    return descriptions[type] || '';
  },
  
  // Generate variant title based on type and base pose title
  generateVariantTitle: (basePoseTitle: string, type: VariantType, details?: string): string => {
    const typeLabels = {
      mirror: 'Mirrored',
      angle: details || 'Alt Angle',
      lens: details || 'Alt Lens',
    };
    
    return `${basePoseTitle} (${typeLabels[type]})`;
  },
  
  // Check if variant is a mirror (algorithmic)
  isMirrorVariant: (variant: PoseVariantSelect): boolean => {
    return variant.type === 'mirror';
  },
  
  // Check if variant has custom keypoints
  hasCustomKeypoints: (variant: PoseVariantSelect): boolean => {
    return variant.keypoints !== null && variant.keypoints !== undefined;
  },
  
  // Check if variant has custom prompts
  hasCustomPrompts: (variant: PoseVariantSelect): boolean => {
    const prompts = variant.prompts || {};
    return Object.keys(prompts).length > 0 && Object.values(prompts).some(p => p && p.trim().length > 0);
  },
  
  // Sort variants by type and sort order
  sortVariants: (variants: PoseVariantSelect[]): PoseVariantSelect[] => {
    const typeOrder = { mirror: 1, angle: 2, lens: 3 };
    
    return variants.sort((a, b) => {
      // First by type
      const typeComparison = typeOrder[a.type] - typeOrder[b.type];
      if (typeComparison !== 0) return typeComparison;
      
      // Then by sort order
      if (a.sortOrder !== b.sortOrder) {
        return a.sortOrder - b.sortOrder;
      }
      
      // Finally by creation date
      return a.createdAt.getTime() - b.createdAt.getTime();
    });
  },
  
  // Group variants by type
  groupByType: (variants: PoseVariantSelect[]): Record<VariantType, PoseVariantSelect[]> => {
    return variants.reduce((groups, variant) => {
      const type = variant.type;
      if (!groups[type]) {
        groups[type] = [];
      }
      groups[type].push(variant);
      return groups;
    }, {} as Record<VariantType, PoseVariantSelect[]>);
  },
  
  // Get variant URL slug
  getVariantSlug: (variant: PoseVariantSelect): string => {
    return variant.title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  },
  
  // Build variant display data
  formatForDisplay: (variant: PoseVariantSelect, baseUrl: string = '') => ({
    ...variant,
    typeDisplayName: poseVariantUtils.getTypeDisplayName(variant.type),
    typeDescription: poseVariantUtils.getTypeDescription(variant.type),
    slug: poseVariantUtils.getVariantSlug(variant),
    hasCustomKeypoints: poseVariantUtils.hasCustomKeypoints(variant),
    hasCustomPrompts: poseVariantUtils.hasCustomPrompts(variant),
  }),
  
  // Validate variant compatibility with pose
  isCompatibleWithPose: (variant: PoseVariantSelect, poseKeypoints: PoseKeypoints): boolean => {
    if (!variant.keypoints) return true; // No custom keypoints, always compatible
    
    // Check if variant keypoints have same structure as pose keypoints
    const poseKeys = Object.keys(poseKeypoints);
    const variantKeys = Object.keys(variant.keypoints);
    
    // Variant should have subset or same keys as pose
    return variantKeys.every(key => poseKeys.includes(key));
  },
  
  // Get effective keypoints (variant-specific or inherited from pose)
  getEffectiveKeypoints: (variant: PoseVariantSelect, poseKeypoints: PoseKeypoints): PoseKeypoints => {
    if (variant.keypoints && poseVariantUtils.hasCustomKeypoints(variant)) {
      return { ...poseKeypoints, ...variant.keypoints };
    }
    return poseKeypoints;
  },
  
  // Get effective prompts (variant-specific or inherited from pose)
  getEffectivePrompts: (variant: PoseVariantSelect, posePrompts: PosePrompts): PosePrompts => {
    if (variant.prompts && poseVariantUtils.hasCustomPrompts(variant)) {
      return { ...posePrompts, ...variant.prompts };
    }
    return posePrompts;
  },
  
  // Create mirror variant keypoints (flip X coordinates)
  createMirrorKeypoints: (originalKeypoints: PoseKeypoints, imageWidth: number = 768): PoseKeypoints => {
    const mirrored = { ...originalKeypoints };
    
    // Flip X coordinates for all keypoints
    Object.keys(mirrored).forEach(key => {
      if (mirrored[key] && typeof mirrored[key].x === 'number') {
        mirrored[key] = {
          ...mirrored[key],
          x: imageWidth - mirrored[key].x,
        };
      }
    });
    
    // Swap left/right keypoints
    const leftRightPairs = [
      ['leftEye', 'rightEye'],
      ['leftEar', 'rightEar'],
      ['leftShoulder', 'rightShoulder'],
      ['leftElbow', 'rightElbow'],
      ['leftWrist', 'rightWrist'],
      ['leftHip', 'rightHip'],
      ['leftKnee', 'rightKnee'],
      ['leftAnkle', 'rightAnkle'],
    ];
    
    leftRightPairs.forEach(([leftKey, rightKey]) => {
      if (mirrored[leftKey] && mirrored[rightKey]) {
        const temp = mirrored[leftKey];
        mirrored[leftKey] = mirrored[rightKey];
        mirrored[rightKey] = temp;
      }
    });
    
    return mirrored;
  },
};

export default poseVariants;