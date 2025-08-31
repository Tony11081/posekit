// Re-export all models and their types
export * from './Pose';
export * from './PoseVariant';
export * from './Theme';
export * from './Asset';
export * from './User';

// Re-export tables for migrations and queries
export { 
  poses, 
  posesRelations,
  poseUtils,
  insertPoseSchema,
  selectPoseSchema,
  updatePoseSchema,
  poseFiltersSchema,
  type PoseInsert,
  type PoseSelect,
  type PoseUpdate,
  type PoseFilters,
} from './Pose';

export { 
  poseVariants, 
  poseVariantsRelations,
  poseVariantUtils,
  insertPoseVariantSchema,
  selectPoseVariantSchema,
  updatePoseVariantSchema,
  poseVariantFiltersSchema,
  type PoseVariantInsert,
  type PoseVariantSelect,
  type PoseVariantUpdate,
  type PoseVariantFilters,
} from './PoseVariant';

export { 
  themes, 
  themesRelations,
  themeUtils,
  insertThemeSchema,
  selectThemeSchema,
  updateThemeSchema,
  themeFiltersSchema,
  type ThemeInsert,
  type ThemeSelect,
  type ThemeUpdate,
  type ThemeFilters,
} from './Theme';

export { 
  assets, 
  assetsRelations,
  assetUtils,
  insertAssetSchema,
  selectAssetSchema,
  updateAssetSchema,
  assetFiltersSchema,
  type AssetInsert,
  type AssetSelect,
  type AssetUpdate,
  type AssetFilters,
} from './Asset';

export { 
  users, 
  userSessions,
  userInvitations,
  auditLogs,
  usersRelations,
  userSessionsRelations,
  userInvitationsRelations,
  auditLogsRelations,
  userUtils,
  insertUserSchema,
  selectUserSchema,
  updateUserSchema,
  insertUserSessionSchema,
  selectUserSessionSchema,
  insertUserInvitationSchema,
  userFiltersSchema,
  type UserInsert,
  type UserSelect,
  type UserUpdate,
  type UserFilters,
  type UserSessionInsert,
  type UserSessionSelect,
  type UserInvitationInsert,
} from './User';

// Export all enum types
export {
  safetyLevelEnum,
  poseStatusEnum,
} from './Pose';

export {
  variantTypeEnum,
} from './PoseVariant';

export {
  assetTypeEnum,
  processingStatusEnum,
} from './Asset';

export {
  userRoleEnum,
  userStatusEnum,
} from './User';

// Helper types for database operations
export type DbTransaction = Parameters<Parameters<typeof import('@/db/connection').db.transaction>[0]>[0];

// Common query result types
export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface SearchResult<T> extends PaginatedResult<T> {
  query: string;
  searchTime: number;
}

// Database utility functions
export const dbUtils = {
  // Build pagination object
  buildPagination: (
    total: number, 
    page: number, 
    limit: number
  ): Omit<PaginatedResult<any>, 'data'> => ({
    total,
    page,
    limit,
    hasNext: total > page * limit,
    hasPrev: page > 1,
  }),
  
  // Calculate offset from page and limit
  getOffset: (page: number, limit: number): number => {
    return Math.max(0, (page - 1) * limit);
  },
  
  // Validate pagination parameters
  validatePagination: (page: number = 1, limit: number = 20) => {
    const validatedPage = Math.max(1, Math.floor(page));
    const validatedLimit = Math.max(1, Math.min(100, Math.floor(limit)));
    return { page: validatedPage, limit: validatedLimit };
  },
  
  // Build search result with timing
  buildSearchResult: <T>(
    data: T[],
    total: number,
    page: number,
    limit: number,
    query: string,
    startTime: number
  ): SearchResult<T> => ({
    data,
    total,
    page,
    limit,
    hasNext: total > page * limit,
    hasPrev: page > 1,
    query,
    searchTime: Date.now() - startTime,
  }),
};

// Export common validation schemas
export const commonSchemas = {
  uuid: () => z.string().uuid('Invalid UUID format'),
  slug: () => z.string().min(1).max(200).regex(/^[a-z0-9-]+$/, 'Invalid slug format'),
  email: () => z.string().email('Invalid email format'),
  url: () => z.string().url('Invalid URL format'),
  pagination: () => z.object({
    page: z.number().int().min(1).default(1),
    limit: z.number().int().min(1).max(100).default(20),
  }),
  search: () => z.object({
    query: z.string().min(1).max(200),
    limit: z.number().int().min(1).max(100).default(20),
    offset: z.number().int().min(0).default(0),
  }),
  sortOrder: () => z.enum(['asc', 'desc']).default('desc'),
};

// Import zod for re-export
import { z } from 'zod';
export { z };

export default {
  poses,
  poseVariants,
  themes,
  assets,
  users,
  userSessions,
  userInvitations,
  auditLogs,
  dbUtils,
  commonSchemas,
};