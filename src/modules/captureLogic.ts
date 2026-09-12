/**
 * Capture Logic
 * Ref: PoseFit_Capture_Logic_Prompt.pdf
 *
 * Decides when/how to take the final photo once the live pose matches the
 * target closely enough. Pure state machine — no UI, no camera calls itself;
 * exposes callbacks that the Camera screen wires up to actual capture + audio.
 */

export type CaptureMode = 'auto' | 'manual';

export type CaptureState =
  | { status: 'tracking' }
  | { status: 'countdown'; secondsLeft: number }
  | { status: 'ready_to_capture' } // manual mode, button enabled
  | { status: 'captured' };

type Listener = (state: CaptureState) => void;

const STABILITY_WINDOW_MS = 600;
const COUNTDOWN_SECONDS = 3;

export class CaptureController {
  private mode: CaptureMode;
  private listeners: Listener[] = [];
  private state: CaptureState = { status: 'tracking' };
  private matchedSinceMs: number | null = null;
  private countdownTimer: ReturnType<typeof setInterval> | null = null;
  private onCaptureRequested: () => void;

  constructor(mode: CaptureMode, onCaptureRequested: () => void) {
    this.mode = mode;
    this.onCaptureRequested = onCaptureRequested;
  }

  subscribe(listener: Listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private emit() {
    this.listeners.forEach((l) => l(this.state));
  }

  private setState(state: CaptureState) {
    this.state = state;
    this.emit();
  }

  /** Call this every frame with the latest isMatched flag from the Kinematics Engine */
  onMatchUpdate(isMatched: boolean) {
    if (this.state.status === 'captured') return;

    if (!isMatched) {
      // Step 3: cancel countdown if match drops before it finishes
      this.matchedSinceMs = null;
      if (this.countdownTimer) {
        clearInterval(this.countdownTimer);
        this.countdownTimer = null;
      }
      if (this.state.status !== 'tracking') {
        this.setState({ status: 'tracking' });
      }
      return;
    }

    // Step 1: threshold detection with stability window
    if (this.matchedSinceMs === null) {
      this.matchedSinceMs = Date.now();
      return;
    }
    const stableFor = Date.now() - this.matchedSinceMs;
    if (stableFor < STABILITY_WINDOW_MS) return;

    // Step 2: mode decision
    if (this.mode === 'manual') {
      if (this.state.status !== 'ready_to_capture') {
        this.setState({ status: 'ready_to_capture' });
      }
    } else {
      if (this.state.status !== 'countdown') {
        this.startCountdown();
      }
    }
  }

  private startCountdown() {
    let secondsLeft = COUNTDOWN_SECONDS;
    this.setState({ status: 'countdown', secondsLeft });
    this.countdownTimer = setInterval(() => {
      secondsLeft -= 1;
      if (secondsLeft <= 0) {
        if (this.countdownTimer) clearInterval(this.countdownTimer);
        this.countdownTimer = null;
        this.capture();
      } else {
        this.setState({ status: 'countdown', secondsLeft });
      }
    }, 1000);
  }

  /** Manual capture button handler, or called automatically after countdown */
  capture() {
    this.setState({ status: 'captured' });
    this.onCaptureRequested();
  }

  /** Step 6: retake handling — resume tracking with the same pose still selected */
  reset() {
    this.matchedSinceMs = null;
    if (this.countdownTimer) clearInterval(this.countdownTimer);
    this.countdownTimer = null;
    this.setState({ status: 'tracking' });
  }
}
