// HTTP methods
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

// API response status
export type ApiStatus = 'success' | 'error' | 'loading';

// Standard API response structure
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
  message?: string;
  timestamp: string;
  requestId: string;
}

// Paginated response
export interface PaginatedResponse<T = any> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  error?: ApiError;
  message?: string;
  timestamp: string;
  requestId: string;
}

// API error structure
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
  statusCode: number;
  timestamp: string;
  path: string;
  validation?: ValidationError[];
}

// Validation error details
export interface ValidationError {
  field: string;
  message: string;
  value?: any;
  code?: string;
}

// Request options
export interface RequestOptions {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  headers?: Record<string, string>;
  params?: Record<string, any>;
  signal?: AbortSignal;
}

// Upload options
export interface UploadOptions extends RequestOptions {
  onProgress?: (progress: number) => void;
  chunked?: boolean;
  chunkSize?: number;
}

// API endpoints enum
export enum ApiEndpoints {
  // Auth endpoints
  LOGIN = '/auth/login',
  LOGOUT = '/auth/logout',
  REFRESH = '/auth/refresh',
  REGISTER = '/auth/register',
  FORGOT_PASSWORD = '/auth/forgot-password',
  RESET_PASSWORD = '/auth/reset-password',
  PROFILE = '/auth/profile',

  // Pose endpoints
  POSES = '/poses',
  POSE_DETAIL = '/poses/:id',
  POSE_SEARCH = '/poses/search',
  POSE_VARIANTS = '/poses/:id/variants',
  POSE_PUBLISH = '/poses/:id/publish',
  POSE_BULK = '/poses/bulk',

  // Asset endpoints
  ASSETS = '/assets',
  ASSET_DETAIL = '/assets/:id',
  ASSET_UPLOAD = '/assets/upload',
  ASSET_BULK_UPLOAD = '/assets/upload/bulk',
  ASSET_PROCESS = '/assets/:id/process',
  ASSET_VARIANTS = '/assets/:id/variants',

  // Theme endpoints
  THEMES = '/themes',
  THEME_DETAIL = '/themes/:id',
  THEME_POSES = '/themes/:id/poses',

  // Tag endpoints
  TAGS = '/tags',
  TAG_DETAIL = '/tags/:id',
  TAG_POSES = '/tags/:id/poses',

  // Collection endpoints
  COLLECTIONS = '/collections',
  COLLECTION_DETAIL = '/collections/:id',
  COLLECTION_POSES = '/collections/:id/poses',

  // User endpoints
  USERS = '/users',
  USER_DETAIL = '/users/:id',
  USER_ACTIVITIES = '/users/:id/activities',
  USER_SESSIONS = '/users/:id/sessions',

  // System endpoints
  HEALTH = '/health',
  VERSION = '/version',
  EXPORT = '/system/export',
  CACHE = '/system/cache',
  SITEMAP = '/system/sitemap',
  SEARCH_SUGGESTIONS = '/system/search/suggestions',

  // Analytics endpoints
  ANALYTICS_OVERVIEW = '/analytics/overview',
  ANALYTICS_POSES = '/analytics/poses',
  ANALYTICS_USERS = '/analytics/users',
  ANALYTICS_SEARCH = '/analytics/search'
}

// Query parameters for different endpoints
export interface PoseQueryParams {
  theme?: string;
  tags?: string[];
  status?: string;
  featured?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
  page?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface AssetQueryParams {
  type?: string;
  tags?: string[];
  status?: string;
  search?: string;
  limit?: number;
  offset?: number;
  page?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface UserQueryParams {
  role?: string;
  status?: string;
  search?: string;
  limit?: number;
  offset?: number;
  page?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

// API client configuration
export interface ApiClientConfig {
  baseUrl: string;
  timeout: number;
  retries: number;
  retryDelay: number;
  headers: Record<string, string>;
  auth?: {
    type: 'bearer' | 'basic';
    token: string;
  };
}

// Request/Response interceptors
export interface RequestInterceptor {
  (config: RequestOptions): RequestOptions | Promise<RequestOptions>;
}

export interface ResponseInterceptor {
  (response: ApiResponse): ApiResponse | Promise<ApiResponse>;
}

export interface ErrorInterceptor {
  (error: ApiError): ApiError | Promise<ApiError>;
}

// WebSocket message types
export type WebSocketMessageType = 
  | 'pose_updated'
  | 'asset_processed'
  | 'export_completed'
  | 'user_activity'
  | 'system_notification';

export interface WebSocketMessage {
  type: WebSocketMessageType;
  data: any;
  timestamp: string;
  userId?: string;
}

// Real-time updates
export interface RealtimeEvent {
  type: WebSocketMessageType;
  resource: string;
  resourceId: string;
  action: 'created' | 'updated' | 'deleted';
  data: any;
  userId: string;
  timestamp: string;
}

// Batch request support
export interface BatchRequest {
  id: string;
  method: HttpMethod;
  url: string;
  body?: any;
  headers?: Record<string, string>;
}

export interface BatchResponse {
  id: string;
  status: number;
  body: ApiResponse;
}

// Export/Import structures
export interface ExportRequest {
  type: 'poses' | 'assets' | 'users' | 'full';
  format: 'json' | 'csv' | 'zip';
  filters?: Record<string, any>;
  options?: {
    includeAssets?: boolean;
    includeVariants?: boolean;
    compression?: boolean;
  };
}

export interface ExportStatus {
  id: string;
  type: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  downloadUrl?: string;
  error?: string;
  createdAt: string;
  completedAt?: string;
}

export default {
  ApiResponse,
  PaginatedResponse,
  ApiError,
  ValidationError,
  RequestOptions,
  UploadOptions,
  ApiEndpoints,
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
};