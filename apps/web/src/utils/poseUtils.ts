'use client';

interface Keypoint {
  x: number;
  y: number;
  confidence: number;
  label: string;
}

interface PoseData {
  keypoints: Keypoint[];
  skeleton: Array<[number, number]>;
  width: number;
  height: number;
}

// Standard COCO pose keypoint indices
export const COCO_KEYPOINTS = {
  NOSE: 0,
  LEFT_EYE: 1,
  RIGHT_EYE: 2,
  LEFT_EAR: 3,
  RIGHT_EAR: 4,
  LEFT_SHOULDER: 5,
  RIGHT_SHOULDER: 6,
  LEFT_ELBOW: 7,
  RIGHT_ELBOW: 8,
  LEFT_WRIST: 9,
  RIGHT_WRIST: 10,
  LEFT_HIP: 11,
  RIGHT_HIP: 12,
  LEFT_KNEE: 13,
  RIGHT_KNEE: 14,
  LEFT_ANKLE: 15,
  RIGHT_ANKLE: 16,
} as const;

// Mirror mapping for left-right keypoints
const MIRROR_MAPPING = new Map([
  [COCO_KEYPOINTS.LEFT_EYE, COCO_KEYPOINTS.RIGHT_EYE],
  [COCO_KEYPOINTS.RIGHT_EYE, COCO_KEYPOINTS.LEFT_EYE],
  [COCO_KEYPOINTS.LEFT_EAR, COCO_KEYPOINTS.RIGHT_EAR],
  [COCO_KEYPOINTS.RIGHT_EAR, COCO_KEYPOINTS.LEFT_EAR],
  [COCO_KEYPOINTS.LEFT_SHOULDER, COCO_KEYPOINTS.RIGHT_SHOULDER],
  [COCO_KEYPOINTS.RIGHT_SHOULDER, COCO_KEYPOINTS.LEFT_SHOULDER],
  [COCO_KEYPOINTS.LEFT_ELBOW, COCO_KEYPOINTS.RIGHT_ELBOW],
  [COCO_KEYPOINTS.RIGHT_ELBOW, COCO_KEYPOINTS.LEFT_ELBOW],
  [COCO_KEYPOINTS.LEFT_WRIST, COCO_KEYPOINTS.RIGHT_WRIST],
  [COCO_KEYPOINTS.RIGHT_WRIST, COCO_KEYPOINTS.LEFT_WRIST],
  [COCO_KEYPOINTS.LEFT_HIP, COCO_KEYPOINTS.RIGHT_HIP],
  [COCO_KEYPOINTS.RIGHT_HIP, COCO_KEYPOINTS.LEFT_HIP],
  [COCO_KEYPOINTS.LEFT_KNEE, COCO_KEYPOINTS.RIGHT_KNEE],
  [COCO_KEYPOINTS.RIGHT_KNEE, COCO_KEYPOINTS.LEFT_KNEE],
  [COCO_KEYPOINTS.LEFT_ANKLE, COCO_KEYPOINTS.RIGHT_ANKLE],
  [COCO_KEYPOINTS.RIGHT_ANKLE, COCO_KEYPOINTS.LEFT_ANKLE],
]);

/**
 * Mirror a pose horizontally
 */
export function mirrorPose(poseData: PoseData): PoseData {
  const { keypoints, skeleton, width, height } = poseData;
  
  // Mirror keypoints
  const mirroredKeypoints = keypoints.map((keypoint, index) => {
    const mirroredIndex = MIRROR_MAPPING.get(index);
    const sourceKeypoint = mirroredIndex !== undefined ? keypoints[mirroredIndex] : keypoint;
    
    return {
      ...sourceKeypoint,
      x: width - sourceKeypoint.x, // Flip X coordinate
      label: keypoint.label, // Keep original label for consistency
    };
  });
  
  return {
    keypoints: mirroredKeypoints,
    skeleton,
    width,
    height,
  };
}

/**
 * Scale pose keypoints to fit new dimensions
 */
export function scalePose(poseData: PoseData, newWidth: number, newHeight: number): PoseData {
  const { keypoints, skeleton, width, height } = poseData;
  
  const scaleX = newWidth / width;
  const scaleY = newHeight / height;
  
  const scaledKeypoints = keypoints.map(keypoint => ({
    ...keypoint,
    x: keypoint.x * scaleX,
    y: keypoint.y * scaleY,
  }));
  
  return {
    keypoints: scaledKeypoints,
    skeleton,
    width: newWidth,
    height: newHeight,
  };
}

/**
 * Rotate pose by angle in degrees
 */
export function rotatePose(poseData: PoseData, angle: number): PoseData {
  const { keypoints, skeleton, width, height } = poseData;
  
  const centerX = width / 2;
  const centerY = height / 2;
  const radians = (angle * Math.PI) / 180;
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);
  
  const rotatedKeypoints = keypoints.map(keypoint => {
    const relativeX = keypoint.x - centerX;
    const relativeY = keypoint.y - centerY;
    
    const rotatedX = relativeX * cos - relativeY * sin;
    const rotatedY = relativeX * sin + relativeY * cos;
    
    return {
      ...keypoint,
      x: rotatedX + centerX,
      y: rotatedY + centerY,
    };
  });
  
  return {
    keypoints: rotatedKeypoints,
    skeleton,
    width,
    height,
  };
}

/**
 * Apply multiple transformations to a pose
 */
export function transformPose(
  poseData: PoseData,
  transformations: {
    mirror?: boolean;
    scale?: { width: number; height: number };
    rotation?: number;
  }
): PoseData {
  let result = { ...poseData };
  
  if (transformations.mirror) {
    result = mirrorPose(result);
  }
  
  if (transformations.scale) {
    result = scalePose(result, transformations.scale.width, transformations.scale.height);
  }
  
  if (transformations.rotation) {
    result = rotatePose(result, transformations.rotation);
  }
  
  return result;
}

/**
 * Calculate pose similarity score (0-1, where 1 is identical)
 */
export function calculatePoseSimilarity(pose1: PoseData, pose2: PoseData): number {
  if (pose1.keypoints.length !== pose2.keypoints.length) {
    return 0;
  }
  
  let totalDistance = 0;
  let validPoints = 0;
  
  for (let i = 0; i < pose1.keypoints.length; i++) {
    const kp1 = pose1.keypoints[i];
    const kp2 = pose2.keypoints[i];
    
    // Only compare points with sufficient confidence
    if (kp1.confidence > 0.5 && kp2.confidence > 0.5) {
      const dx = kp1.x - kp2.x;
      const dy = kp1.y - kp2.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // Normalize distance by image dimensions
      const normalizedDistance = distance / Math.sqrt(pose1.width * pose1.width + pose1.height * pose1.height);
      totalDistance += normalizedDistance;
      validPoints++;
    }
  }
  
  if (validPoints === 0) return 0;
  
  const avgDistance = totalDistance / validPoints;
  return Math.max(0, 1 - avgDistance * 5); // Scale factor for sensitivity
}

/**
 * Find similar poses from a collection
 */
export function findSimilarPoses(
  targetPose: PoseData,
  poses: Array<PoseData & { id: string }>,
  threshold: number = 0.7,
  maxResults: number = 5
): Array<{ pose: PoseData & { id: string }; similarity: number }> {
  const similarities = poses
    .map(pose => ({
      pose,
      similarity: calculatePoseSimilarity(targetPose, pose),
    }))
    .filter(item => item.similarity >= threshold)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, maxResults);
  
  return similarities;
}

/**
 * Generate pose variations
 */
export function generatePoseVariations(poseData: PoseData): Array<{
  id: string;
  title: string;
  poseData: PoseData;
  transformation: string;
}> {
  const variations = [];
  
  // Original
  variations.push({
    id: 'original',
    title: 'Original',
    poseData,
    transformation: 'none',
  });
  
  // Mirrored
  variations.push({
    id: 'mirrored',
    title: 'Mirrored',
    poseData: mirrorPose(poseData),
    transformation: 'mirror',
  });
  
  // Scaled variations
  const scaledSmall = scalePose(poseData, poseData.width * 0.8, poseData.height * 0.8);
  variations.push({
    id: 'scaled-small',
    title: 'Scaled 80%',
    poseData: scaledSmall,
    transformation: 'scale-0.8',
  });
  
  const scaledLarge = scalePose(poseData, poseData.width * 1.2, poseData.height * 1.2);
  variations.push({
    id: 'scaled-large',
    title: 'Scaled 120%',
    poseData: scaledLarge,
    transformation: 'scale-1.2',
  });
  
  // Rotated variations
  const rotated15 = rotatePose(poseData, 15);
  variations.push({
    id: 'rotated-15',
    title: 'Rotated 15°',
    poseData: rotated15,
    transformation: 'rotate-15',
  });
  
  const rotatedMinus15 = rotatePose(poseData, -15);
  variations.push({
    id: 'rotated-minus-15',
    title: 'Rotated -15°',
    poseData: rotatedMinus15,
    transformation: 'rotate--15',
  });
  
  return variations;
}

/**
 * Validate pose data structure
 */
export function validatePoseData(poseData: any): poseData is PoseData {
  return (
    poseData &&
    Array.isArray(poseData.keypoints) &&
    Array.isArray(poseData.skeleton) &&
    typeof poseData.width === 'number' &&
    typeof poseData.height === 'number' &&
    poseData.keypoints.every((kp: any) =>
      typeof kp.x === 'number' &&
      typeof kp.y === 'number' &&
      typeof kp.confidence === 'number' &&
      typeof kp.label === 'string'
    )
  );
}

/**
 * Convert pose data to OpenPose format
 */
export function toPoseOpenPoseFormat(poseData: PoseData) {
  return {
    version: 1.3,
    people: [
      {
        person_id: [-1],
        pose_keypoints_2d: poseData.keypoints.flatMap(kp => [kp.x, kp.y, kp.confidence]),
        face_keypoints_2d: [],
        hand_left_keypoints_2d: [],
        hand_right_keypoints_2d: [],
        pose_keypoints_3d: [],
        face_keypoints_3d: [],
        hand_left_keypoints_3d: [],
        hand_right_keypoints_3d: [],
      }
    ]
  };
}

/**
 * Convert pose data from OpenPose format
 */
export function fromOpenPoseFormat(openPoseData: any): PoseData | null {
  if (!openPoseData.people || openPoseData.people.length === 0) {
    return null;
  }
  
  const person = openPoseData.people[0];
  const poseKeypoints = person.pose_keypoints_2d;
  
  if (!poseKeypoints || poseKeypoints.length < 51) { // 17 keypoints * 3 values
    return null;
  }
  
  const keypoints: Keypoint[] = [];
  for (let i = 0; i < poseKeypoints.length; i += 3) {
    keypoints.push({
      x: poseKeypoints[i],
      y: poseKeypoints[i + 1],
      confidence: poseKeypoints[i + 2],
      label: Object.keys(COCO_KEYPOINTS)[keypoints.length] || `keypoint_${keypoints.length}`,
    });
  }
  
  // Standard COCO skeleton connections
  const skeleton: Array<[number, number]> = [
    [0, 1], [0, 2], [1, 3], [2, 4], // Head
    [5, 6], [5, 7], [7, 9], [6, 8], [8, 10], // Arms
    [5, 11], [6, 12], [11, 12], // Torso
    [11, 13], [13, 15], [12, 14], [14, 16], // Legs
  ];
  
  return {
    keypoints,
    skeleton,
    width: 768, // Default size
    height: 768,
  };
}