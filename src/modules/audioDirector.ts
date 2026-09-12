/**
 * Hands-Free Audio Director Engine
 * Ref: PoseFit_Audio_Director_TTS_Prompt.pdf
 *
 * Gives short spoken guidance based on Kinematics Engine output. Debounced so
 * it doesn't speak every frame. Fully independent/removable — app works fine
 * with voice toggled off (see `enabled` flag).
 */

import Tts from 'react-native-tts';
import { CaptureState } from './captureLogic';

const MIN_INTERVAL_MS = 3500;
const MATCH_MILESTONE_STEP = 20;

const JOINT_PHRASES: Record<string, string> = {
  left_elbow: 'Adjust your left elbow',
  right_elbow: 'Adjust your right elbow',
  left_shoulder: 'Relax your left shoulder',
  right_shoulder: 'Relax your right shoulder',
  left_hip: 'Straighten your hips a little',
  right_hip: 'Straighten your hips a little',
  left_knee: 'Adjust your left knee',
  right_knee: 'Adjust your right knee',
};

export class AudioDirector {
  private enabled: boolean;
  private lastSpokenAt = 0;
  private lastWorstJoint: string | null = null;
  private lastMilestone = 0;

  constructor(enabled: boolean = true) {
    this.enabled = enabled;
    Tts.setDefaultRate(0.5);
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  private speak(text: string) {
    if (!this.enabled) return;
    Tts.stop();
    Tts.speak(text);
    this.lastSpokenAt = Date.now();
  }

  announceStart() {
    this.speak('Get into position');
    this.lastMilestone = 0;
    this.lastWorstJoint = null;
  }

  /** Step 3-4: debounced per-frame update from Kinematics Engine */
  onMatchUpdate(matchPercentage: number, worstJointName: string | null) {
    const now = Date.now();
    const milestone = Math.floor(matchPercentage / MATCH_MILESTONE_STEP) * MATCH_MILESTONE_STEP;

    const jointChanged = worstJointName !== this.lastWorstJoint;
    const enoughTimePassed = now - this.lastSpokenAt >= MIN_INTERVAL_MS;
    const milestoneCrossed = milestone > this.lastMilestone;

    if (!jointChanged && !enoughTimePassed && !milestoneCrossed) return;

    if (matchPercentage >= 70 && matchPercentage < 85) {
      this.speak('Almost there, hold steady');
    } else if (worstJointName && JOINT_PHRASES[worstJointName] && enoughTimePassed) {
      this.speak(JOINT_PHRASES[worstJointName]);
    }

    this.lastWorstJoint = worstJointName;
    this.lastMilestone = milestone;
  }

  /** Step 5: integrate with Capture Logic events without modifying that module */
  onCaptureStateChange(state: CaptureState) {
    if (state.status === 'countdown') {
      this.speak(String(state.secondsLeft));
    } else if (state.status === 'captured') {
      this.speak('Got it!');
    } else if (state.status === 'ready_to_capture') {
      this.speak('Perfect! Hold still');
    }
  }
}
