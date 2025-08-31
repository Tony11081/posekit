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
  User, 
  UserProfile, 
  UserPreferences,
  UserRole,
  UserStatus,
  Permission 
} from '@posekit/types';

// Custom enums
export const userRoleEnum = pgEnum('user_role', ['super_admin', 'editor', 'viewer']);
export const userStatusEnum = pgEnum('user_status', ['active', 'inactive', 'suspended']);

// Users table definition
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  username: varchar('username', { length: 100 }).unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  role: userRoleEnum('role').notNull().default('viewer'),
  status: userStatusEnum('status').notNull().default('active'),
  
  // Profile information
  firstName: varchar('first_name', { length: 100 }),
  lastName: varchar('last_name', { length: 100 }),
  avatar: varchar('avatar', { length: 500 }), // URL to avatar image
  bio: text('bio'),
  timezone: varchar('timezone', { length: 50 }).default('UTC'),
  language: varchar('language', { length: 5 }).default('en'),
  
  // User preferences (JSONB for flexibility)
  preferences: jsonb('preferences').default(sql`'{}'::jsonb`).$type<UserPreferences>(),
  customPermissions: text('custom_permissions').array().default(sql`ARRAY[]::text[]`),
  
  // Authentication tracking
  emailVerified: boolean('email_verified').default(false),
  emailVerifiedAt: timestamp('email_verified_at', { withTimezone: true }),
  lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
  lastActiveAt: timestamp('last_active_at', { withTimezone: true }),
  loginCount: integer('login_count').default(0),
  
  // Metadata
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  createdBy: uuid('created_by').references(() => users.id),
}, (table) => ({
  // Indexes for performance
  emailIndex: unique('users_email_unique').on(table.email),
  usernameIndex: unique('users_username_unique').on(table.username),
  roleStatusIndex: index('users_role_status_idx').on(table.role, table.status),
  lastActiveIndex: index('users_last_active_idx').on(table.lastActiveAt),
}));

// User sessions table
export const userSessions = pgTable('user_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  tokenHash: varchar('token_hash', { length: 255 }).notNull().unique(),
  refreshTokenHash: varchar('refresh_token_hash', { length: 255 }).unique(),
  
  // Session metadata
  ipAddress: varchar('ip_address', { length: 45 }), // IPv6 compatible
  userAgent: text('user_agent'),
  deviceInfo: jsonb('device_info').default(sql`'{}'::jsonb`),
  
  // Timing
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  lastUsedAt: timestamp('last_used_at', { withTimezone: true }).defaultNow(),
  active: boolean('active').default(true),
}, (table) => ({
  userIdIndex: index('user_sessions_user_id_idx').on(table.userId),
  tokenHashIndex: index('user_sessions_token_hash_idx').on(table.tokenHash),
  expiresAtIndex: index('user_sessions_expires_at_idx').on(table.expiresAt),
}));

// User invitations table
export const userInvitations = pgTable('user_invitations', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull(),
  role: userRoleEnum('role').notNull(),
  customPermissions: text('custom_permissions').array().default(sql`ARRAY[]::text[]`),
  tokenHash: varchar('token_hash', { length: 255 }).notNull().unique(),
  
  // Status tracking
  acceptedAt: timestamp('accepted_at', { withTimezone: true }),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  
  // Metadata
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  invitedBy: uuid('invited_by').notNull().references(() => users.id),
}, (table) => ({
  emailIndex: index('user_invitations_email_idx').on(table.email),
  tokenHashIndex: index('user_invitations_token_hash_idx').on(table.tokenHash),
  invitedByIndex: index('user_invitations_invited_by_idx').on(table.invitedBy),
}));

// Audit logs table
export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id),
  action: varchar('action', { length: 100 }).notNull(),
  resourceType: varchar('resource_type', { length: 50 }),
  resourceId: uuid('resource_id'),
  
  // Change details
  oldValues: jsonb('old_values'),
  newValues: jsonb('new_values'),
  metadata: jsonb('metadata').default(sql`'{}'::jsonb`),
  
  // Request context
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  requestId: varchar('request_id', { length: 100 }),
  
  // Timing
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  userIdIndex: index('audit_logs_user_id_idx').on(table.userId),
  resourceIndex: index('audit_logs_resource_idx').on(table.resourceType, table.resourceId),
  createdAtIndex: index('audit_logs_created_at_idx').on(table.createdAt),
}));

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  createdByUser: one(users, {
    fields: [users.createdBy],
    references: [users.id],
    relationName: 'userCreatedBy',
  }),
  sessions: many(userSessions),
  auditLogs: many(auditLogs),
}));

export const userSessionsRelations = relations(userSessions, ({ one }) => ({
  user: one(users, {
    fields: [userSessions.userId],
    references: [users.id],
  }),
}));

export const userInvitationsRelations = relations(userInvitations, ({ one }) => ({
  invitedByUser: one(users, {
    fields: [userInvitations.invitedBy],
    references: [users.id],
  }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  user: one(users, {
    fields: [auditLogs.userId],
    references: [users.id],
  }),
}));

// Default user preferences schema
const defaultPreferencesSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']).default('light'),
  emailNotifications: z.boolean().default(true),
  itemsPerPage: z.number().int().min(10).max(100).default(20),
  defaultView: z.enum(['grid', 'list', 'masonry']).default('masonry'),
  autoSave: z.boolean().default(true),
  shortcuts: z.record(z.string()).default({}),
});

// Validation schemas
export const insertUserSchema = createInsertSchema(users, {
  email: z.string().email().max(255),
  username: z.string().min(3).max(100).regex(/^[a-zA-Z0-9_-]+$/).optional(),
  passwordHash: z.string().min(1),
  role: z.enum(['super_admin', 'editor', 'viewer']).default('viewer'),
  status: z.enum(['active', 'inactive', 'suspended']).default('active'),
  firstName: z.string().max(100).optional(),
  lastName: z.string().max(100).optional(),
  avatar: z.string().url().max(500).optional(),
  bio: z.string().max(1000).optional(),
  timezone: z.string().max(50).default('UTC'),
  language: z.string().length(2).default('en'),
  preferences: defaultPreferencesSchema.default({}),
  customPermissions: z.array(z.string()).default([]),
});

export const selectUserSchema = createSelectSchema(users);

export const updateUserSchema = insertUserSchema.partial().omit({
  id: true,
  createdAt: true,
  passwordHash: true, // Use separate password update endpoint
});

// Session schemas
export const insertUserSessionSchema = createInsertSchema(userSessions, {
  tokenHash: z.string().min(1),
  refreshTokenHash: z.string().min(1).optional(),
  ipAddress: z.string().ip().optional(),
  userAgent: z.string().optional(),
  deviceInfo: z.record(z.any()).default({}),
  expiresAt: z.date(),
});

export const selectUserSessionSchema = createSelectSchema(userSessions);

// Invitation schemas
export const insertUserInvitationSchema = createInsertSchema(userInvitations, {
  email: z.string().email(),
  role: z.enum(['super_admin', 'editor', 'viewer']),
  customPermissions: z.array(z.string()).default([]),
  tokenHash: z.string().min(1),
  expiresAt: z.date(),
});

// Filter schemas
export const userFiltersSchema = z.object({
  role: z.enum(['super_admin', 'editor', 'viewer']).optional(),
  status: z.enum(['active', 'inactive', 'suspended']).optional(),
  search: z.string().optional(), // Search by email, username, name
  createdAfter: z.date().optional(),
  createdBefore: z.date().optional(),
  lastActiveAfter: z.date().optional(),
  lastActiveBefore: z.date().optional(),
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
  sortBy: z.enum(['createdAt', 'lastActiveAt', 'email', 'role']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// Type exports
export type UserInsert = z.infer<typeof insertUserSchema>;
export type UserSelect = z.infer<typeof selectUserSchema>;
export type UserUpdate = z.infer<typeof updateUserSchema>;
export type UserFilters = z.infer<typeof userFiltersSchema>;
export type UserSessionInsert = z.infer<typeof insertUserSessionSchema>;
export type UserSessionSelect = z.infer<typeof selectUserSessionSchema>;
export type UserInvitationInsert = z.infer<typeof insertUserInvitationSchema>;

// User utilities
export const userUtils = {
  // Role hierarchy for permission checking
  roleHierarchy: {
    super_admin: 3,
    editor: 2,
    viewer: 1,
  } as Record<UserRole, number>,
  
  // Default permissions by role
  rolePermissions: {
    super_admin: [
      'poses:create', 'poses:read', 'poses:update', 'poses:delete', 'poses:publish', 'poses:bulk-edit',
      'assets:upload', 'assets:read', 'assets:update', 'assets:delete', 'assets:bulk-process',
      'themes:manage', 'tags:manage', 'collections:manage',
      'users:create', 'users:read', 'users:update', 'users:delete', 'users:manage-roles',
      'system:settings', 'system:export', 'system:cache', 'system:logs', 'system:analytics',
    ] as Permission[],
    
    editor: [
      'poses:create', 'poses:read', 'poses:update', 'poses:publish', 'poses:bulk-edit',
      'assets:upload', 'assets:read', 'assets:update', 'assets:bulk-process',
      'themes:manage', 'tags:manage', 'collections:manage',
      'users:read',
      'system:export',
    ] as Permission[],
    
    viewer: [
      'poses:read',
      'assets:read',
      'users:read',
    ] as Permission[],
  },
  
  // Get user's full name
  getFullName: (user: UserSelect): string => {
    const parts = [user.firstName, user.lastName].filter(Boolean);
    return parts.length > 0 ? parts.join(' ') : user.email;
  },
  
  // Get user's display name (username or full name)
  getDisplayName: (user: UserSelect): string => {
    return user.username || userUtils.getFullName(user);
  },
  
  // Check if user has specific permission
  hasPermission: (user: UserSelect, permission: Permission): boolean => {
    const rolePerms = userUtils.rolePermissions[user.role] || [];
    const customPerms = user.customPermissions || [];
    return rolePerms.includes(permission) || customPerms.includes(permission);
  },
  
  // Get all user permissions
  getAllPermissions: (user: UserSelect): Permission[] => {
    const rolePerms = userUtils.rolePermissions[user.role] || [];
    const customPerms = user.customPermissions || [];
    return [...new Set([...rolePerms, ...customPerms])];
  },
  
  // Check if user can perform action on resource
  canPerformAction: (user: UserSelect, action: string, resource: string): boolean => {
    const permission = `${resource}:${action}` as Permission;
    return userUtils.hasPermission(user, permission);
  },
  
  // Check if user is active
  isActive: (user: UserSelect): boolean => {
    return user.status === 'active';
  },
  
  // Check if user is admin
  isAdmin: (user: UserSelect): boolean => {
    return user.role === 'super_admin';
  },
  
  // Check if user can manage other users
  canManageUsers: (user: UserSelect): boolean => {
    return userUtils.hasPermission(user, 'users:manage-roles');
  },
  
  // Get user avatar URL with fallback
  getAvatarUrl: (user: UserSelect, fallbackUrl?: string): string => {
    if (user.avatar) return user.avatar;
    if (fallbackUrl) return fallbackUrl;
    
    // Generate gravatar-style fallback
    const email = user.email.toLowerCase().trim();
    const hash = Buffer.from(email).toString('base64').slice(0, 8);
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(userUtils.getDisplayName(user))}&background=random&color=fff&size=150`;
  },
  
  // Format user preferences with defaults
  getPreferences: (user: UserSelect): UserPreferences => {
    const defaults = defaultPreferencesSchema.parse({});
    return { ...defaults, ...user.preferences };
  },
  
  // Check if user has been active recently (within last 30 days)
  isRecentlyActive: (user: UserSelect): boolean => {
    if (!user.lastActiveAt) return false;
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return user.lastActiveAt > thirtyDaysAgo;
  },
  
  // Get user's role display name
  getRoleDisplayName: (role: UserRole): string => {
    const roleNames = {
      super_admin: 'Super Admin',
      editor: 'Editor',
      viewer: 'Viewer',
    };
    return roleNames[role] || role;
  },
  
  // Check if user can be assigned a role (hierarchy check)
  canAssignRole: (currentUser: UserSelect, targetRole: UserRole): boolean => {
    const currentLevel = userUtils.roleHierarchy[currentUser.role];
    const targetLevel = userUtils.roleHierarchy[targetRole];
    return currentLevel >= targetLevel;
  },
  
  // Build user profile object
  buildProfile: (user: UserSelect): UserProfile => ({
    firstName: user.firstName || '',
    lastName: user.lastName || '',
    avatar: user.avatar,
    bio: user.bio,
    timezone: user.timezone,
    language: user.language,
    preferences: userUtils.getPreferences(user),
  }),
};

export default users;