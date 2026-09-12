/**
 * Kinematics Engine
 * Ref: PoseFit_Kinematics_Engine_Prompt.pdf
 *
 * Converts raw MediaPipe keypoints into joint angles, compares them against
 * a target pose's stored angles, and produces a smoothed match percentage.
 * Runs fully on-device, no API calls, every frame.
 */

export type Keypoint = { x: number; y: number; z: number; visibility: number };
export type KeypointMap = Record<string, Keypoint>; // e.g. "left_shoulder", "left_elbow", ...

export type JointAngles = Record<string, number>; // e.g. { left_elbow: 143.2, ... }

export type MatchResult = {
  overallMatchPercentage: number;
  perJointScores: Record<string, number>;
  worstJointName: string | null;
  isMatched: boolean;
};

const MATCH_THRESHOLD = 85;
const TOLERANCE_DEGREES = 15; // full score within this range
const MAX_DIFF_DEGREES = 45; // score hits 0 beyond this range
const VISIBILITY_THRESHOLD = 0.5;
const SMOOTHING_WINDOW = 6;

// Joint definition: middle point is the vertex, the other two form the angle
const JOINTS: Record<string, [string, string, string]> = {
  left_elbow: ['left_shoulder', 'left_elbow', 'left_wrist'],
  right_elbow: ['right_shoulder', 'right_elbow', 'right_wrist'],
  left_shoulder: ['left_elbow', 'left_shoulder', 'left_hip'],
  right_shoulder: ['right_elbow', 'right_shoulder', 'right_hip'],
  left_hip: ['left_shoulder', 'left_hip', 'left_knee'],
  right_hip: ['right_shoulder', 'right_hip', 'right_knee'],
  left_knee: ['left_hip', 'left_knee', 'left_ankle'],
  right_knee: ['right_hip', 'right_knee', 'right_ankle'],
};

function vector(a: Keypoint, b: Keypoint) {
  return { x: b.x - a.x, y: b.y - a.y };
}

function angleBetween(v1: { x: number; y: number }, v2: { x: number; y: number }): number {
  const dot = v1.x * v2.x + v1.y * v2.y;
  const mag1 = Math.sqrt(v1.x ** 2 + v1.y ** 2);
  const mag2 = Math.sqrt(v2.x ** 2 + v2.y ** 2);
  if (mag1 === 0 || mag2 === 0) return 0;
  const cos = Math.max(-1, Math.min(1, dot / (mag1 * mag2)));
  return (Math.acos(cos) * 180) / Math.PI;
}

/** Step 1: Angle Calculation */
export function calculateJointAngles(keypoints: KeypointMap): JointAngles {
  const angles: JointAngles = {};
  for (const [jointName, [a, vertex, b]] of Object.entries(JOINTS)) {
    const pA = keypoints[a];
    const pVertex = keypoints[vertex];
    const pB = keypoints[b];
    if (!pA || !pVertex || !pB) continue;
    if (
      pA.visibility < VISIBILITY_THRESHOLD ||
      pVertex.visibility < VISIBILITY_THRESHOLD ||
      pB.visibility < VISIBILITY_THRESHOLD
    ) {
      continue; // skip low-confidence joints (Step: filter by visibility)
    }
    const v1 = vector(pVertex, pA);
    const v2 = vector(pVertex, pB);
    angles[jointName] = angleBetween(v1, v2);
  }
  return angles;
}

/** Step 4: angle difference -> 0-100 score with tolerance band */
function scoreFromDiff(diffDegrees: number): number {
  if (diffDegrees <= TOLERANCE_DEGREES) return 100;
  if (diffDegrees >= MAX_DIFF_DEGREES) return 0;
  const range = MAX_DIFF_DEGREES - TOLERANCE_DEGREES;
  const over = diffDegrees - TOLERANCE_DEGREES;
  return 100 - (over / range) * 100;
}

// Simple moving-average buffer for smoothing (Step 5)
let recentScores: number[] = [];

export function resetSmoothing() {
  recentScores = [];
}

/** Steps 3-6: compare, score, smooth, find worst joint */
export function calculateMatch(liveKeypoints: KeypointMap, targetAngles: JointAngles): MatchResult {
  const liveAngles = calculateJointAngles(liveKeypoints);
  const perJointScores: Record<string, number> = {};
  let worstJointName: string | null = null;
  let worstScore = 101;

  for (const jointName of Object.keys(targetAngles)) {
    const liveAngle = liveAngles[jointName];
    if (liveAngle === undefined) continue; // joint not visible this frame
    const diff = Math.abs(liveAngle - targetAngles[jointName]);
    const score = scoreFromDiff(diff);
    perJointScores[jointName] = score;
    if (score < worstScore) {
      worstScore = score;
      worstJointName = jointName;
    }
  }

  const scores = Object.values(perJointScores);
  const rawAverage = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;

  // Smooth over recent frames
  recentScores.push(rawAverage);
  if (recentScores.length > SMOOTHING_WINDOW) recentScores.shift();
  const smoothed = recentScores.reduce((a, b) => a + b, 0) / recentScores.length;

  return {
    overallMatchPercentage: Math.round(smoothed),
    perJointScores,
    worstJointName,
    isMatched: smoothed >= MATCH_THRESHOLD,
  };
}
