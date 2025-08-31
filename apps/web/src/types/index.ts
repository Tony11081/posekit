// Local type definitions for PoseKit Web
// This replaces @posekit/types for Docker builds

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

// Asset/Image
export interface Asset {
  id: string;
  type: 'image' | 'skeleton' | 'json' | 'document';
  title?: string;
  description?: string;
  filename: string;
  originalName: string;
  mimeType: string;
  fileSize: number;
  width?: number;
  height?: number;
  url: string;
  cdnUrl?: string;
  thumbnailUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Theme/Category
export interface Theme {
  id: string;
  name: string;
  slug: string;
  description?: string;
  color?: string;
  icon?: string;
  poseCount: number;
  featured: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

// Pose variant
export interface PoseVariant {
  id: string;
  poseId: string;
  type: VariantType;
  title: string;
  description?: string;
  asset?: Asset;
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
  aliases?: string[];
  theme?: Theme;
  themeId: string;
  tags?: string[];
  skeleton?: string;
  keypoints: PoseKeypoints;
  previewAsset?: Asset;
  previewAssetId?: string;
  variants?: PoseVariant[];
  prompts?: PosePrompts;
  safetyLevel: SafetyLevel;
  safetyNotes?: string;
  status: PoseStatus;
  featured: boolean;
  viewCount: number;
  downloadCount: number;
  favoriteCount: number;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
  createdBy: string;
  updatedBy: string;
}