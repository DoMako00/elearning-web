/**
 * Watch Tracker Worker - Video Progress & Active Time Tracking
 * Runs off-main-thread to calculate precise watch time without blocking UI
 */

import type {
  WatchTrackerInitPayload,
  WatchTrackerEventPayload,
  WatchTrackerFlushPayload,
  WatchTrackerInboundMessage,
  WatchTrackerOutboundMessage,
  WatchSessionData,
} from '../shared/types/workers';

/* ════════════════════════════════════════════════════════════════════
   INTERNAL STATE
════════════════════════════════════════════════════════════════════ */

interface WatchTrackerState {
  lessonId: string;
  userId: string;
  videoDuration: number;
  currentTime: number;
  playbackRate: number;

  sessionStart: number;
  lastEventTimestamp: number;
  lastTickTimestamp: number;

  activeWatchTime: number;
  totalPausedTime: number;
  seekCount: number;
  bufferCount: number;

  playEvents: number;
  pauseEvents: number;
  seekEvents: number;

  isPlaying: boolean;
  isSeeking: boolean;
  wasPlayingBeforeSeek: boolean;

  batchIntervalMs: number;
  maxBatchSize: number;
  apiEndpoint: string;
  idleThresholdMs: number;

  tickTimer: ReturnType<typeof setInterval> | null;
  flushTimer: ReturnType<typeof setTimeout> | null;

  positionHistory: Array<{ time: number; position: number }>;
  playbackRates: number[];
}

let state: WatchTrackerState | null = null;

/* ════════════════════════════════════════════════════════════════════
   UTILITY FUNCTIONS
════════════════════════════════════════════════════════════════════ */

function postMessage(message: WatchTrackerOutboundMessage): void {
  self.postMessage(message);
}

function generateSessionData(): WatchSessionData {
  if (!state) throw new Error('State not initialized');

  const avgRate = state.playbackRates.length > 0
    ? state.playbackRates.reduce((a, b) => a + b, 0) / state.playbackRates.length
    : 1;

  return {
    sessionStart: state.sessionStart,
    sessionEnd: Date.now(),
    playEvents: state.playEvents,
    pauseEvents: state.pauseEvents,
    seekEvents: state.seekEvents,
    bufferEvents: state.bufferCount,
    avgPlaybackRate: avgRate,
    maxPosition: Math.max(...state.positionHistory.map(p => p.position), 0),
  };
}

function calculateCompletionPercentage(): number {
  if (!state || state.videoDuration <= 0) return 0;
  return Math.min(100, (state.currentTime / state.videoDuration) * 100);
}

function scheduleFlush(): void {
  if (!state) return;

  if (state.flushTimer) {
    clearTimeout(state.flushTimer);
  }

  state.flushTimer = setTimeout(() => {
    flushProgress();
  }, state.batchIntervalMs);
}

async function flushProgress(): Promise<void> {
  if (!state) return;

  const payload: WatchTrackerFlushPayload = {
    lessonId: state.lessonId,
    userId: state.userId,
    activeWatchTime: state.activeWatchTime,
    totalDuration: state.videoDuration,
    completionPercentage: calculateCompletionPercentage(),
    sessionData: generateSessionData(),
  };

  postMessage({ type: 'WATCH_TRACKER_FLUSH', payload });

  try {
    const response = await fetch(state.apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      keepalive: true,
    });

    if (!response.ok) {
      console.warn('[WatchTracker] Flush failed:', response.status);
    }
  } catch (error) {
    console.warn('[WatchTracker] Network error during flush:', error);
  }
}

function emitTick(): void {
  if (!state) return;

  postMessage({
    type: 'WATCH_TRACKER_TICK',
    payload: {
      activeWatchTime: state.activeWatchTime,
      totalPausedTime: state.totalPausedTime,
      seekCount: state.seekCount,
      lastEventTimestamp: state.lastEventTimestamp,
      currentTime: state.currentTime,
    },
  });
}

/* ════════════════════════════════════════════════════════════════════
   EVENT HANDLERS
════════════════════════════════════════════════════════════════════ */

function handleInit(payload: WatchTrackerInitPayload): void {
  const now = Date.now();

  state = {
    lessonId: payload.lessonId,
    userId: payload.userId,
    videoDuration: payload.videoDuration,
    currentTime: payload.currentTime,
    playbackRate: payload.playbackRate,

    sessionStart: now,
    lastEventTimestamp: now,
    lastTickTimestamp: now,

    activeWatchTime: 0,
    totalPausedTime: 0,
    seekCount: 0,
    bufferCount: 0,

    playEvents: 0,
    pauseEvents: 0,
    seekEvents: 0,

    isPlaying: false,
    isSeeking: false,
    wasPlayingBeforeSeek: false,

    batchIntervalMs: payload.config.batchIntervalMs,
    maxBatchSize: payload.config.maxBatchSize,
    apiEndpoint: payload.config.apiEndpoint,
    idleThresholdMs: payload.config.idleThresholdMs,

    tickTimer: null,
    flushTimer: null,

    positionHistory: [{ time: now, position: payload.currentTime }],
    playbackRates: [payload.playbackRate],
  };

  state.tickTimer = setInterval(emitTick, 1000);
  scheduleFlush();

  postMessage({ type: 'WATCH_TRACKER_READY', payload: { workerId: `wt-${now}` } });
}

function handleVideoEvent(payload: WatchTrackerEventPayload): void {
  if (!state) return;

  const now = Date.now();
  const timeSinceLastEvent = now - state.lastEventTimestamp;

  state.currentTime = payload.currentTime;
  state.playbackRate = payload.playbackRate;
  state.videoDuration = payload.videoDuration;
  state.lastEventTimestamp = now;

  state.positionHistory.push({ time: now, position: payload.currentTime });
  state.playbackRates.push(payload.playbackRate);

  if (state.positionHistory.length > 100) {
    state.positionHistory = state.positionHistory.slice(-100);
  }
  if (state.playbackRates.length > 100) {
    state.playbackRates = state.playbackRates.slice(-100);
  }

  switch (payload.eventType) {
    case 'play':
      if (!state.isPlaying) {
        state.isPlaying = true;
        state.playEvents++;
        state.lastEventTimestamp = now;
      }
      break;

    case 'pause':
      if (state.isPlaying) {
        state.isPlaying = false;
        state.pauseEvents++;
        state.totalPausedTime += timeSinceLastEvent;
        state.lastEventTimestamp = now;
      }
      break;

    case 'seeked':
      if (!state.isSeeking) {
        state.isSeeking = true;
        state.wasPlayingBeforeSeek = state.isPlaying;
        state.seekCount++;
        state.seekEvents++;
      }
      break;

    case 'playing':
      if (state.isSeeking) {
        state.isSeeking = false;
        if (state.wasPlayingBeforeSeek) {
          state.isPlaying = true;
        }
      } else if (!state.isPlaying) {
        state.isPlaying = true;
        state.playEvents++;
      }
      break;

    case 'waiting':
      state.bufferCount++;
      break;

    case 'ended':
      state.isPlaying = false;
      state.totalPausedTime += timeSinceLastEvent;
      flushProgress();
      break;

    case 'timeupdate':
      break;
  }

  if (state.isPlaying && !state.isSeeking) {
    state.activeWatchTime += timeSinceLastEvent * state.playbackRate;
  }
}

function handleFlush(): void {
  flushProgress();
}

function handleDestroy(): void {
  if (state) {
    if (state.tickTimer) clearInterval(state.tickTimer);
    if (state.flushTimer) clearTimeout(state.flushTimer);
    flushProgress();
    state = null;
  }
}

/* ════════════════════════════════════════════════════════════════════
   MESSAGE ROUTER
════════════════════════════════════════════════════════════════════ */

self.addEventListener('message', (event: MessageEvent<WatchTrackerInboundMessage>) => {
  const { type, payload } = event.data;

  try {
    switch (type) {
      case 'WATCH_TRACKER_INIT':
        handleInit(payload);
        break;
      case 'WATCH_TRACKER_EVENT':
        handleVideoEvent(payload);
        break;
      case 'WATCH_TRACKER_FLUSH':
        handleFlush();
        break;
      case 'WATCH_TRACKER_DESTROY':
        handleDestroy();
        break;
    }
  } catch (error) {
    postMessage({
      type: 'WATCH_TRACKER_ERROR',
      payload: {
        error: error instanceof Error ? error.message : 'Unknown error',
        code: 'WORKER_ERROR',
      },
    });
  }
});

self.addEventListener('error', (event) => {
  postMessage({
    type: 'WATCH_TRACKER_ERROR',
    payload: {
      error: event.message,
      code: 'WORKER_RUNTIME_ERROR',
    },
  });
});