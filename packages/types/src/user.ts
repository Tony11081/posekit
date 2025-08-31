// User roles and permissions
export type UserRole = 'super_admin' | 'editor' | 'viewer';
export type UserStatus = 'active' | 'inactive' | 'suspended';

// Permission types
export type Permission = 
  // Pose management
  | 'poses:create'
  | 'poses:read'
  | 'poses:update'
  | 'poses:delete'
  | 'poses:publish'
  | 'poses:bulk-edit'
  
  // Asset management
  | 'assets:upload'
  | 'assets:read'
  | 'assets:update'
  | 'assets:delete'
  | 'assets:bulk-process'
  
  // Content management
  | 'themes:manage'
  | 'tags:manage'
  | 'collections:manage'
  
  // User management
  | 'users:create'
  | 'users:read'
  | 'users:update'
  | 'users:delete'
  | 'users:manage-roles'
  
  // System management
  | 'system:settings'
  | 'system:export'
  | 'system:cache'
  | 'system:logs'
  | 'system:analytics';

// Role permission mapping
export interface RolePermissions {
  super_admin: Permission[];
  editor: Permission[];
  viewer: Permission[];
}

// User profile information
export interface UserProfile {
  firstName: string;
  lastName: string;
  avatar?: string;
  bio?: string;
  timezone?: string;
  language?: string;
  preferences: UserPreferences;
}

// User preferences
export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  emailNotifications: boolean;
  itemsPerPage: number;
  defaultView: 'grid' | 'list' | 'masonry';
  autoSave: boolean;
  shortcuts: Record<string, string>;
}

// Main user entity
export interface User {
  id: string;
  email: string;
  username?: string;
  role: UserRole;
  status: UserStatus;
  profile: UserProfile;
  emailVerified: boolean;
  emailVerifiedAt?: Date;
  lastLoginAt?: Date;
  lastActiveAt?: Date;
  loginCount: number;
  permissions: Permission[]; // Computed from role + custom permissions
  customPermissions?: Permission[]; // Additional permissions beyond role
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string; // Admin who created this user
}

// User creation data
export interface CreateUserData {
  email: string;
  username?: string;
  password: string;
  role: UserRole;
  profile: Partial<UserProfile>;
  customPermissions?: Permission[];
}

// User update data
export interface UpdateUserData {
  id: string;
  email?: string;
  username?: string;
  role?: UserRole;
  status?: UserStatus;
  profile?: Partial<UserProfile>;
  customPermissions?: Permission[];
}

// Authentication data
export interface AuthCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

// JWT token payload
export interface TokenPayload {
  userId: string;
  email: string;
  role: UserRole;
  permissions: Permission[];
  iat: number;
  exp: number;
}

// Login response
export interface LoginResponse {
  user: User;
  token: string;
  refreshToken?: string;
  expiresAt: Date;
}

// Password reset
export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetData {
  token: string;
  password: string;
}

// User activity/audit log
export interface UserActivity {
  id: string;
  userId: string;
  action: string; // 'login', 'logout', 'create_pose', 'update_pose', etc.
  resource?: string; // Resource type (pose, asset, user)
  resourceId?: string; // Resource ID
  details?: Record<string, any>; // Additional context
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
}

// User filters for search/listing
export interface UserFilters {
  role?: UserRole;
  status?: UserStatus;
  search?: string; // Search by email, username, name
  createdAfter?: Date;
  createdBefore?: Date;
  lastActiveAfter?: Date;
  lastActiveBefore?: Date;
  limit?: number;
  offset?: number;
  sortBy?: 'createdAt' | 'lastActiveAt' | 'email' | 'role';
  sortOrder?: 'asc' | 'desc';
}

// User search result
export interface UserSearchResult {
  users: User[];
  total: number;
  hasMore: boolean;
  nextOffset?: number;
}

// Session management
export interface UserSession {
  id: string;
  userId: string;
  token: string;
  refreshToken?: string;
  ipAddress: string;
  userAgent: string;
  createdAt: Date;
  expiresAt: Date;
  lastUsedAt: Date;
  active: boolean;
}

// Invitation system (for team collaboration)
export interface UserInvitation {
  id: string;
  email: string;
  role: UserRole;
  customPermissions?: Permission[];
  invitedBy: string; // User ID
  token: string;
  acceptedAt?: Date;
  expiresAt: Date;
  createdAt: Date;
}

export default {
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
  RolePermissions
};