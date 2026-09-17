/**
 * Inactivity Prompt Types - GreenLearn Inactivity Warning System
 */

export type InactivityModalState = 'hidden' | 'countdown' | 'paused';

export interface InactivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onResume: () => void;
  /** Current seconds remaining (counts down from totalCountdown to 0) */
  countdown?: number;
  /** Total countdown duration in seconds — used to compute ring percentage */
  totalCountdown?: number;
}

export interface InactivityWorkerMessage {
  type: 'IDLE_TIMEOUT_TRIGGERED';
  payload: {
    triggeredAt: number;
    idleDurationMs: number;
    lastKnownVideoState: {
      isPlaying: boolean;
      currentTime: number;
      lessonId: string | null;
    };
    reason: 'no_interaction' | 'tab_hidden' | 'video_paused_idle';
  };
}

export interface UseInactivityPromptOptions {
  initialCountdown?: number; // default 60 seconds
  onTimeout?: () => void;
  onResume?: () => void;
}

export interface UseInactivityPromptReturn {
  state: 'hidden' | 'countdown' | 'paused';
  countdown: number;
  openModal: () => void;
  /** Dismiss path: modal closes but tracking stays paused. */
  handleDismiss: () => void;
  /** Confirm path: "I'm still here" \u2014 resumes tracking, returns to 'hidden'. */
  handleResume: () => void;
  /** Passive re-engagement: worker noticed real activity, silently returns to 'hidden'. */
  handlePassiveResume: () => void;
  handleWorkerMessage: (message: MessageEvent) => void;
  triggerIdleTimeout: () => void;
}