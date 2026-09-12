/**
 * Local Camera & Pose (tracking source)
 * Ref: PoseFit_Local_Camera_Pose_Prompt.pdf, PoseFit_Skeleton_Tracking_RN_Prompt.pdf
 *
 * This file defines the interface the rest of the app expects from the live
 * keypoint stream. Right now it exports a MOCK generator so you can build and
 * test the Kinematics Engine, Overlay, and Capture Logic without wiring up
 * the real native MediaPipe frame processor first.
 *
 * TO GO LIVE: replace `useMockPoseStream` usage with a real hook that reads
 * from your native frame-processor plugin (see the RN Skeleton Tracking
 * prompt for the native iOS/Android implementation details), but keep the
 * same KeypointMap shape so nothing else needs to change.
 */

import { useEffect, useRef, useState } from 'react';
import { KeypointMap } from './kinematicsEngine';

const LANDMARK_NAMES = [
  'left_shoulder',
  'right_shoulder',
  'left_elbow',
  'right_elbow',
  'left_wrist',
  'right_wrist',
  'left_hip',
  'right_hip',
  'left_knee',
  'right_knee',
  'left_ankle',
  'right_ankle',
];

/** Generates slowly-drifting fake keypoints so the UI/logic can be tested without a camera. */
export function useMockPoseStream(fps = 20): KeypointMap {
  const [keypoints, setKeypoints] = useState<KeypointMap>({});
  const tRef = useRef(0);

  useEffect(() => {
    const interval = setInterval(() => {
      tRef.current += 1;
      const t = tRef.current;
      const next: KeypointMap = {};
      LANDMARK_NAMES.forEach((name, i) => {
        const baseX = 0.5 + Math.sin((t + i * 10) / 30) * 0.15;
        const baseY = 0.3 + i * 0.05 + Math.cos((t + i * 5) / 40) * 0.03;
        next[name] = { x: baseX, y: baseY, z: 0, visibility: 0.95 };
      });
      setKeypoints(next);
    }, 1000 / fps);
    return () => clearInterval(interval);
  }, [fps]);

  return keypoints;
}
