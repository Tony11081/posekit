// Re-export all types for easy importing
export * from './pose';
export * from './asset';
export * from './user';
export * from './api';

// Convenience re-exports of main interfaces
export type {
  // Pose types
  Pose,
  PoseVariant,
  Theme,
  Tag,
  Collection,
  PoseKeypoints,
  PosePrompts,
  SEOMetadata,
  CreatePoseData,
  UpdatePoseData,
  PoseFilters,
  PoseSearchResult,
  SafetyLevel,
  VariantType,
  PoseStatus,

  // Asset types
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
  ProcessingStatus,

  // User types
  User,
  UserProfile,
  UserPreferences,
  CreateUserData,
  UpdateUserData,
  AuthCredentials,
  TokenPayload,
  LoginResponse,
  PasswordResetRequest,
  PasswordResetData,
  UserActivity,
  UserFilters,
  UserSearchResult,
  UserSession,
  UserInvitation,
  UserRole,
  UserStatus,
  Permission,
  RolePermissions,

  // API types
  ApiResponse,
  PaginatedResponse,
  ApiError,
  ValidationError,
  RequestOptions,
  UploadOptions,
  PoseQueryParams,
  AssetQueryParams,
  UserQueryParams,
  ApiClientConfig,
  RequestInterceptor,
  ResponseInterceptor,
  ErrorInterceptor,
  WebSocketMessage,
  RealtimeEvent,
  BatchRequest,
  BatchResponse,
  ExportRequest,
  ExportStatus,
  HttpMethod,
  ApiStatus,
  WebSocketMessageType
} from './pose';

// Common utility types
export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TimestampedEntity extends BaseEntity {
  createdBy: string;
  updatedBy: string;
}

export interface SortableEntity {
  sortOrder: number;
}

export interface FeaturableEntity {
  featured: boolean;
}

export interface SlugEntity {
  slug: string;
}

export interface SearchableEntity {
  title: string;
  description?: string;
  tags: string[];
}

// Generic list response
export interface ListResponse<T> {
  items: T[];
  total: number;
  hasMore: boolean;
  nextOffset?: number;
}

// Generic filters
export interface BaseFilters {
  search?: string;
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Environment configuration
export interface EnvironmentConfig {
  NODE_ENV: 'development' | 'production' | 'test';
  API_URL: string;
  CDN_URL: string;
  UPLOAD_URL: string;
  WS_URL?: string;
  SENTRY_DSN?: string;
  GOOGLE_ANALYTICS_ID?: string;
}

// Feature flags
export interface FeatureFlags {
  enableOfflineMode: boolean;
  enableRealtimeUpdates: boolean;
  enableAdvancedSearch: boolean;
  enableBulkOperations: boolean;
  enableUserInvitations: boolean;
  enableAnalytics: boolean;
  enableExperimentalFeatures: boolean;
}

export default {
  BaseEntity,
  TimestampedEntity,
  SortableEntity,
  FeaturableEntity,
  SlugEntity,
  SearchableEntity,
  ListResponse,
  BaseFilters,
  EnvironmentConfig,
  FeatureFlags
};