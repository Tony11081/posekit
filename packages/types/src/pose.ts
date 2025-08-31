// Safety levels for poses
export type SafetyLevel = 'normal' | 'caution' | 'restricted';

// Variant types
export type VariantType = 'mirror' | 'angle' | 'lens';

// Pose status in workflow
export type PoseStatus = 'draft' | 'review' | 'published' | 'archived';

// Keypoints structure for pose skeleton
export interface Keypoint {
  x: number;
  y: number;
  confidence?: number;
  visible?: boolean;
}

// OpenPose/Mediapipe compatible keypoints
export interface PoseKeypoints {
  nose: Keypoint;
  neck: Keypoint;
  rightShoulder: Keypoint;
  rightElbow: Keypoint;
  rightWrist: Keypoint;
  leftShoulder: Keypoint;
  leftElbow: Keypoint;
  leftWrist: Keypoint;
  rightHip: Keypoint;
  rightKnee: Keypoint;
  rightAnkle: Keypoint;
  leftHip: Keypoint;
  leftKnee: Keypoint;
  leftAnkle: Keypoint;
  rightEye: Keypoint;
  leftEye: Keypoint;
  rightEar: Keypoint;
  leftEar: Keypoint;
  [key: string]: Keypoint; // Allow custom keypoints
}

// AI model prompts
export interface PosePrompts {
  sdxl?: string;
  flux?: string;
  midjourney?: string;
  [model: string]: string | undefined;
}

// SEO metadata
export interface SEOMetadata {
  title: string;
  description: string;
  keywords: string[];
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  canonical?: string;
}

// Pose variant (mirror/angle/lens variations)
export interface PoseVariant {
  id: string;
  poseId: string;
  type: VariantType;
  title: string;
  description?: string;
  assetId: string;
  keypoints?: PoseKeypoints;
  prompts?: PosePrompts;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

// Main pose entity
export interface Pose {
  id: string;
  slug: string;
  title: string;
  description?: string;
  aliases: string[]; // Alternative names for search
  theme: string; // Wedding, Family, Newborn, etc.
  tags: string[]; // Standing, Eye Contact, 85mm, etc.
  skeleton: string; // SVG skeleton identifier
  keypoints: PoseKeypoints;
  previewAssetId: string; // Main preview image
  variantIds: string[]; // Related variants
  prompts: PosePrompts;
  safetyLevel: SafetyLevel;
  safetyNotes?: string;
  seo: SEOMetadata;
  status: PoseStatus;
  featured: boolean;
  viewCount: number;
  downloadCount: number;
  favoriteCount: number;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
  createdBy: string; // User ID
  updatedBy: string; // User ID
}

// Pose creation/update data
export interface CreatePoseData {
  title: string;
  description?: string;
  aliases?: string[];
  theme: string;
  tags?: string[];
  skeleton?: string;
  keypoints?: PoseKeypoints;
  prompts?: PosePrompts;
  safetyLevel?: SafetyLevel;
  safetyNotes?: string;
  seo?: Partial<SEOMetadata>;
  status?: PoseStatus;
  featured?: boolean;
}

export interface UpdatePoseData extends Partial<CreatePoseData> {
  id: string;
}

// Search and filtering
export interface PoseFilters {
  theme?: string;
  tags?: string[];
  safetyLevel?: SafetyLevel;
  status?: PoseStatus;
  featured?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'title' | 'createdAt' | 'viewCount' | 'favoriteCount';
  sortOrder?: 'asc' | 'desc';
}

// Search result
export interface PoseSearchResult {
  poses: Pose[];
  total: number;
  hasMore: boolean;
  nextOffset?: number;
}

// Theme/Category
export interface Theme {
  id: string;
  name: string;
  slug: string;
  description?: string;
  color?: string; // Hex color for UI
  icon?: string; // Icon identifier
  poseCount: number;
  featured: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

// Tag
export interface Tag {
  id: string;
  name: string;
  slug: string;
  description?: string;
  category?: string; // pose-type, lens, lighting, etc.
  poseCount: number;
  createdAt: Date;
  updatedAt: Date;
}

// Collection (curated pose groups)
export interface Collection {
  id: string;
  slug: string;
  title: string;
  description?: string;
  poseIds: string[];
  featured: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export default {
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
  PoseStatus
};