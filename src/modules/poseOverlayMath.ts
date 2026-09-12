/**
 * AR Overlay & Math
 * Ref: PoseFit_AR_Overlay_Math_Prompt.pdf
 *
 * Pure rendering math: converts normalized (0-1) keypoints into actual screen
 * pixel coordinates, handles aspect-ratio letterboxing, front-camera mirroring,
 * and frame-to-frame interpolation smoothing. Does NOT calculate match scores
 * (that's kinematicsEngine.ts) — only visualizes what it's given.
 */

import { KeypointMap, Keypoint } from './kinematicsEngine';

export type ScreenPoint = { x: number; y: number };

export type TransformConfig = {
  screenWidth: number;
  screenHeight: number;
  cameraPreviewWidth: number;
  cameraPreviewHeight: number;
  isFrontCamera: boolean;
};

/** Step 2: compute scale + offset so overlay aligns with the real camera image */
function computeLetterbox(config: TransformConfig) {
  const screenAspect = config.screenWidth / config.screenHeight;
  const cameraAspect = config.cameraPreviewWidth / config.cameraPreviewHeight;

  let scale: number;
  let offsetX = 0;
  let offsetY = 0;

  if (cameraAspect > screenAspect) {
    // camera is relatively wider -> pillarbox (letterbox on left/right)
    scale = config.screenHeight / config.cameraPreviewHeight;
    const scaledWidth = config.cameraPreviewWidth * scale;
    offsetX = (config.screenWidth - scaledWidth) / 2;
  } else {
    // camera is relatively taller -> letterbox on top/bottom
    scale = config.screenWidth / config.cameraPreviewWidth;
    const scaledHeight = config.cameraPreviewHeight * scale;
    offsetY = (config.screenHeight - scaledHeight) / 2;
  }

  return { scale, offsetX, offsetY };
}

/** Steps 1-3: normalized keypoint -> screen pixel, with mirroring for front camera */
export function keypointToScreenPoint(kp: Keypoint, config: TransformConfig): ScreenPoint {
  const { scale, offsetX, offsetY } = computeLetterbox(config);

  let normX = kp.x;
  if (config.isFrontCamera) {
    normX = 1 - normX; // Step 3: mirror x-axis
  }

  const screenX = normX * config.cameraPreviewWidth * scale + offsetX;
  const screenY = kp.y * config.cameraPreviewHeight * scale + offsetY;

  return { x: screenX, y: screenY };
}

export function transformKeypoints(
  keypoints: KeypointMap,
  config: TransformConfig
): Record<string, ScreenPoint> {
  const result: Record<string, ScreenPoint> = {};
  for (const [name, kp] of Object.entries(keypoints)) {
    if (kp.visibility < 0.3) continue;
    result[name] = keypointToScreenPoint(kp, config);
  }
  return result;
}

/**
 * Step 6: Smoothing/Interpolation
 * Blends the previous drawn position with the new detected position so the
 * overlay animates smoothly instead of jittering frame to frame.
 */
export function smoothPoint(prev: ScreenPoint | undefined, next: ScreenPoint, blend = 0.4): ScreenPoint {
  if (!prev) return next;
  return {
    x: prev.x + (next.x - prev.x) * blend,
    y: prev.y + (next.y - prev.y) * blend,
  };
}

/** Match score -> color, used for the live user skeleton (Step 5 in the prompt) */
export function colorForScore(score: number): string {
  if (score >= 85) return '#3ddc73'; // green
  if (score >= 50) return '#f5c542'; // yellow
  return '#ff5c5c'; // red
}

// Skeleton connections used to draw both the target guide and the live skeleton
export const SKELETON_CONNECTIONS: [string, string][] = [
  ['left_shoulder', 'right_shoulder'],
  ['left_shoulder', 'left_elbow'],
  ['left_elbow', 'left_wrist'],
  ['right_shoulder', 'right_elbow'],
  ['right_elbow', 'right_wrist'],
  ['left_shoulder', 'left_hip'],
  ['right_shoulder', 'right_hip'],
  ['left_hip', 'right_hip'],
  ['left_hip', 'left_knee'],
  ['left_knee', 'left_ankle'],
  ['right_hip', 'right_knee'],
  ['right_knee', 'right_ankle'],
];
