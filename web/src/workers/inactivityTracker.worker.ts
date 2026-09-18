/**
 * Inactivity Tracker Worker - Idle Detection & Heartbeat Monitoring
 * Detects user inactivity and pauses progress tracking when user is away
 */

import type {
  InactivityInitPayload,
  InactivityUserEventPayload,
  InactivityIdleTimeoutPayload,
  InactivityTrackerInboundMessage,
  InactivityTrackerOutboundMessage,
} from '../shared/types/workers';

/* ════════════════════════════════════════════════════════════════════
   INTERNAL STATE
════════════════════════════════════════════════════════════════════ */

interface InactivityState {
  userId: string;
  idleThresholdMs: number;
  heartbeatIntervalMs: number;

  lastActivityTimestamp: number;
  idleTimer: ReturnType<typeof setTimeout> | null;
  heartbeatTimer: ReturnType<typeof setInterval> | null;

  isIdle: boolean;
  idleTriggeredAt: number | null;

  videoState: {
    isPlaying: boolean;
    currentTime: number;
    lessonId: string | null;
  };

  config: {
    enableVisibilityAPI: boolean;
    enableWakeLock: boolean;
    maxIdleEventsBeforeFlush: number;
  };

  wakeLock: WakeLockSentinel | null;
}

let state: InactivityState | null = null;

/* ════════════════════════════════════════════════════════════════════
   UTILITY FUNCTIONS
════════════════════════════════════════════════════════════════════ */

function postMessage(message: InactivityTrackerOutboundMessage): void {
  self.postMessage(message);
}

function emitTick(): void {
  if (!state) return;

  const now = Date.now();
  const idleDurationMs = state.isIdle ? now - (state.idleTriggeredAt || now) : 0;
  const timeSinceLastHeartbeat = now - state.lastActivityTimestamp;

  postMessage({
    type: 'INACTIVITY_TICK',
    payload: {
      isIdle: state.isIdle,
      idleDurationMs,
      lastActivityTimestamp: state.lastActivityTimestamp,
      timeSinceLastHeartbeat,
    },
  });
}

function triggerIdleTimeout(reason: InactivityIdleTimeoutPayload['reason']): void {
  if (!state || state.isIdle) return;

  state.isIdle = true;
  state.idleTriggeredAt = Date.now();

  const payload: InactivityIdleTimeoutPayload = {
    triggeredAt: state.idleTriggeredAt,
    idleDurationMs: state.idleTriggeredAt - state.lastActivityTimestamp,
    lastKnownVideoState: { ...state.videoState },
    reason,
  };

  if (state.heartbeatTimer) {
    clearInterval(state.heartbeatTimer);
    state.heartbeatTimer = null;
  }

  releaseWakeLock();

  postMessage({ type: 'INACTIVITY_IDLE_TIMEOUT', payload });
}

function resetIdleTimer(): void {
  if (!state) return;

  const now = Date.now();
  const wasIdle = state.isIdle;

  state.lastActivityTimestamp = now;

  if (state.idleTimer) {
    clearTimeout(state.idleTimer);
  }

  state.idleTimer = setTimeout(() => {
    triggerIdleTimeout('no_interaction');
  }, state.idleThresholdMs);

  if (wasIdle) {
    state.isIdle = false;
    state.idleTriggeredAt = null;
    postMessage({
      type: 'INACTIVITY_RESUME',
      payload: { resumedAt: now },
    });

    startHeartbeat();
    acquireWakeLock();
  }
}

function startHeartbeat(): void {
  if (!state || state.heartbeatTimer) return;

  state.heartbeatTimer = setInterval(emitTick, state.heartbeatIntervalMs);
  emitTick();
}

async function acquireWakeLock(): Promise<void> {
  if (!state || !state.config.enableWakeLock) return;

  try {
    if ('wakeLock' in navigator) {
      const wakeLock = await (navigator as any).wakeLock.request('screen');
      state.wakeLock = wakeLock;
      wakeLock.addEventListener('release', () => {
        if (state) state.wakeLock = null;
      });
    }
  } catch {
    // Wake Lock not supported or denied
  }
}

function releaseWakeLock(): void {
  if (state && state.wakeLock) {
    state.wakeLock.release();
    state.wakeLock = null;
  }
}

function handleVisibilityChange(): void {
  if (!state || !state.config.enableVisibilityAPI) return;

  if (document.hidden) {
    if (state.videoState.isPlaying) {
      triggerIdleTimeout('tab_hidden');
    }
  } else {
    resetIdleTimer();
  }
}

/* ════════════════════════════════════════════════════════════════════
   EVENT HANDLERS
════════════════════════════════════════════════════════════════════ */

function handleInit(payload: InactivityInitPayload): void {
  const now = Date.now();

  state = {
    userId: payload.userId,
    idleThresholdMs: payload.idleThresholdMs,
    heartbeatIntervalMs: payload.heartbeatIntervalMs,

    lastActivityTimestamp: now,
    idleTimer: null,
    heartbeatTimer: null,

    isIdle: false,
    idleTriggeredAt: null,

    videoState: {
      isPlaying: false,
      currentTime: 0,
      lessonId: null,
    },

    config: payload.config,
    wakeLock: null,
  };

  state.idleTimer = setTimeout(() => {
    triggerIdleTimeout('no_interaction');
  }, state.idleThresholdMs);

  startHeartbeat();
  acquireWakeLock();

  if (state.config.enableVisibilityAPI && typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', handleVisibilityChange);
  }

  postMessage({ type: 'INACTIVITY_READY', payload: { workerId: `it-${now}` } });
}

function handleUserEvent(payload: InactivityUserEventPayload): void {
  if (!state) return;

  if (payload.isVideoPlaying !== undefined) {
    state.videoState.isPlaying = payload.isVideoPlaying;
  }
  if (payload.videoCurrentTime !== undefined) {
    state.videoState.currentTime = payload.videoCurrentTime;
  }

  const isVideoPlaying = payload.isVideoPlaying ?? state.videoState.isPlaying;

  // Handle video-specific events (play/pause) from video player
  const eventType = payload.eventType as string;
  if (eventType === 'play' && isVideoPlaying) {
    resetIdleTimer();
  } else if (eventType === 'pause' && !isVideoPlaying) {
    // Video paused - start idle countdown
    if (state.idleTimer) clearTimeout(state.idleTimer);
    state.idleTimer = setTimeout(() => {
      triggerIdleTimeout('video_paused_idle');
    }, state.idleThresholdMs);
  } else {
    resetIdleTimer();
  }
}

function handleResume(): void {
  if (!state) return;
  resetIdleTimer();
}

function handleDestroy(): void {
  if (state) {
    if (state.idleTimer) clearTimeout(state.idleTimer);
    if (state.heartbeatTimer) clearInterval(state.heartbeatTimer);
    releaseWakeLock();

    if (state.config.enableVisibilityAPI && typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    }

    state = null;
  }
}

/* ════════════════════════════════════════════════════════════════════
   MESSAGE ROUTER
════════════════════════════════════════════════════════════════════ */

self.addEventListener('message', (event: MessageEvent<InactivityTrackerInboundMessage>) => {
  const { type, payload } = event.data;

  try {
    switch (type) {
      case 'INACTIVITY_INIT':
        handleInit(payload);
        break;
      case 'INACTIVITY_USER_EVENT':
        handleUserEvent(payload);
        break;
      case 'INACTIVITY_RESUME':
        handleResume();
        break;
      case 'INACTIVITY_DESTROY':
        handleDestroy();
        break;
    }
  } catch (error) {
    postMessage({
      type: 'INACTIVITY_ERROR',
      payload: {
        error: error instanceof Error ? error.message : 'Unknown error',
        code: 'WORKER_ERROR',
      },
    });
  }
});

self.addEventListener('error', (event) => {
  postMessage({
    type: 'INACTIVITY_ERROR',
    payload: {
      error: event.message,
      code: 'WORKER_RUNTIME_ERROR',
    },
  });
});

export type { InactivityState };