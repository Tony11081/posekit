import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  boolean,
  integer,
  index,
  unique,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
import type { Theme } from '@posekit/types';

// Import related tables
import { poses } from './Pose';

// Themes table definition
export const themes = pgTable('themes', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull().unique(),
  slug: varchar('slug', { length: 100 }).notNull().unique(),
  description: text('description'),
  color: varchar('color', { length: 7 }), // Hex color code
  icon: varchar('icon', { length: 50 }), // Icon identifier
  poseCount: integer('pose_count').default(0),
  featured: boolean('featured').default(false),
  sortOrder: integer('sort_order').default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  // Indexes for performance
  nameIndex: unique('themes_name_unique').on(table.name),
  slugIndex: unique('themes_slug_unique').on(table.slug),
  featuredSortIndex: index('themes_featured_sort_idx').on(table.featured, table.sortOrder),
}));

// Relations
export const themesRelations = relations(themes, ({ many }) => ({
  poses: many(poses),
}));

// Validation schemas
export const insertThemeSchema = createInsertSchema(themes, {
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/, 'Invalid slug format'),
  description: z.string().optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Invalid hex color').optional(),
  icon: z.string().max(50).optional(),
  featured: z.boolean().default(false),
  sortOrder: z.number().int().default(0),
});

export const selectThemeSchema = createSelectSchema(themes);

export const updateThemeSchema = insertThemeSchema.partial().omit({
  id: true,
  createdAt: true,
  poseCount: true, // Auto-calculated
});

// Search and filter schemas
export const themeFiltersSchema = z.object({
  featured: z.boolean().optional(),
  search: z.string().optional(),
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
  sortBy: z.enum(['name', 'poseCount', 'sortOrder', 'createdAt']).default('sortOrder'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

// Type exports
export type ThemeInsert = z.infer<typeof insertThemeSchema>;
export type ThemeSelect = z.infer<typeof selectThemeSchema>;
export type ThemeUpdate = z.infer<typeof updateThemeSchema>;
export type ThemeFilters = z.infer<typeof themeFiltersSchema>;

// Theme utilities
export const themeUtils = {
  // Generate slug from name
  generateSlug: (name: string): string => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  },
  
  // Predefined theme colors
  defaultColors: {
    wedding: '#fdf2f8', // Pink
    family: '#fefce8',   // Yellow
    newborn: '#f0f9ff',  // Blue
    maternity: '#f0fdf4', // Green
    couple: '#faf5ff',   // Purple
    portrait: '#fef7ff', // Magenta
    friends: '#fff7ed',  // Orange
    business: '#f8fafc', // Gray
  } as Record<string, string>,
  
  // Predefined theme icons
  defaultIcons: {
    wedding: 'heart',
    family: 'users',
    newborn: 'baby',
    maternity: 'pregnant-woman',
    couple: 'couple',
    portrait: 'user-circle',
    friends: 'user-group',
    business: 'briefcase',
  } as Record<string, string>,
  
  // Get theme color with fallback
  getColor: (theme: ThemeSelect): string => {
    return theme.color || themeUtils.defaultColors[theme.slug] || '#f3f4f6';
  },
  
  // Get theme icon with fallback
  getIcon: (theme: ThemeSelect): string => {
    return theme.icon || themeUtils.defaultIcons[theme.slug] || 'folder';
  },
  
  // Check if theme is featured
  isFeatured: (theme: ThemeSelect): boolean => {
    return theme.featured;
  },
  
  // Build theme URL
  getThemeUrl: (theme: ThemeSelect, baseUrl: string = ''): string => {
    return `${baseUrl}/poses/${theme.slug}`;
  },
  
  // Format theme for display
  formatForDisplay: (theme: ThemeSelect) => ({
    ...theme,
    color: themeUtils.getColor(theme),
    icon: themeUtils.getIcon(theme),
    url: themeUtils.getThemeUrl(theme),
  }),
  
  // Sort themes by featured status and sort order
  sortThemes: (themes: ThemeSelect[]): ThemeSelect[] => {
    return themes.sort((a, b) => {
      // Featured themes first
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      
      // Then by sort order
      if (a.sortOrder !== b.sortOrder) {
        return a.sortOrder - b.sortOrder;
      }
      
      // Finally by name alphabetically
      return a.name.localeCompare(b.name);
    });
  },
};

export default themes;