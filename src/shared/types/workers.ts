/**
 * Worker Message Types & Payloads for GreenLearn LMS
 * Background processing & offline resilience architecture
 */

/* ════════════════════════════════════════════════════════════════════
   COMMON BASE TYPES
════════════════════════════════════════════════════════════════════ */

export type WorkerMessageType =
  | 'WATCH_TRACKER_INIT'
  | 'WATCH_TRACKER_EVENT'
  | 'WATCH_TRACKER_TICK'
  | 'WATCH_TRACKER_FLUSH'
  | 'WATCH_TRACKER_DESTROY'
  | 'INACTIVITY_INIT'
  | 'INACTIVITY_USER_EVENT'
  | 'INACTIVITY_TICK'
  | 'INACTIVITY_IDLE_TIMEOUT'
  | 'INACTIVITY_RESUME'
  | 'INACTIVITY_DESTROY'
  | 'SYNC_QUEUE_PUSH'
  | 'SYNC_QUEUE_FLUSH'
  | 'SYNC_QUEUE_ONLINE'
  | 'SYNC_QUEUE_OFFLINE'
  | 'SYNC_STATUS_UPDATE';

export type VideoEventType =
  | 'play'
  | 'pause'
  | 'seeked'
  | 'timeupdate'
  | 'ended'
  | 'waiting'
  | 'playing';

export type UserInteractionType =
  | 'mousemove'
  | 'keydown'
  | 'click'
  | 'touchstart'
  | 'scroll'
  | 'focus'
  | 'blur'
  | 'visibilitychange';

export type SyncOperationType =
  | 'lesson_complete'
  | 'progress_update'
  | 'notes_update'
  | 'bookmark_toggle'
  | 'xp_award';

export type NetworkStatus = 'online' | 'offline';

/* ════════════════════════════════════════════════════════════════════
   WATCH TRACKER WORKER TYPES
════════════════════════════════════════════════════════════════════ */

export interface WatchTrackerInitPayload {
  lessonId: string;
  userId: string;
  videoDuration: number;
  currentTime: number;
  playbackRate: number;
  config: {
    batchIntervalMs: number;
    maxBatchSize: number;
    apiEndpoint: string;
    idleThresholdMs: number;
  };
}

export interface WatchTrackerEventPayload {
  eventType: VideoEventType;
  timestamp: number;
  currentTime: number;
  playbackRate: number;
  videoDuration: number;
  isSeeking?: boolean;
}

export interface WatchTrackerTickPayload {
  activeWatchTime: number;
  totalPausedTime: number;
  seekCount: number;
  lastEventTimestamp: number;
  currentTime: number;
}

export interface WatchTrackerFlushPayload {
  lessonId: string;
  userId: string;
  activeWatchTime: number;
  totalDuration: number;
  completionPercentage: number;
  sessionData: WatchSessionData;
}

export interface WatchSessionData {
  sessionStart: number;
  sessionEnd: number;
  playEvents: number;
  pauseEvents: number;
  seekEvents: number;
  bufferEvents: number;
  avgPlaybackRate: number;
  maxPosition: number;
}

export type WatchTrackerOutboundMessage =
  | { type: 'WATCH_TRACKER_TICK'; payload: WatchTrackerTickPayload }
  | { type: 'WATCH_TRACKER_FLUSH'; payload: WatchTrackerFlushPayload }
  | { type: 'WATCH_TRACKER_ERROR'; payload: { error: string; code: string } }
  | { type: 'WATCH_TRACKER_READY'; payload: { workerId: string } };

export type WatchTrackerInboundMessage =
  | { type: 'WATCH_TRACKER_INIT'; payload: WatchTrackerInitPayload }
  | { type: 'WATCH_TRACKER_EVENT'; payload: WatchTrackerEventPayload }
  | { type: 'WATCH_TRACKER_FLUSH'; payload: undefined }
  | { type: 'WATCH_TRACKER_DESTROY'; payload: undefined };

/* ════════════════════════════════════════════════════════════════════
   INACTIVITY TRACKER WORKER TYPES
════════════════════════════════════════════════════════════════════ */

export interface InactivityInitPayload {
  userId: string;
  idleThresholdMs: number;
  heartbeatIntervalMs: number;
  config: {
    enableVisibilityAPI: boolean;
    enableWakeLock: boolean;
    maxIdleEventsBeforeFlush: number;
  };
}

export interface InactivityUserEventPayload {
  eventType: UserInteractionType;
  timestamp: number;
  isVideoPlaying?: boolean;
  videoCurrentTime?: number;
}

export interface InactivityTickPayload {
  isIdle: boolean;
  idleDurationMs: number;
  lastActivityTimestamp: number;
  timeSinceLastHeartbeat: number;
}

export interface InactivityIdleTimeoutPayload {
  triggeredAt: number;
  idleDurationMs: number;
  lastKnownVideoState: {
    isPlaying: boolean;
    currentTime: number;
    lessonId: string | null;
  };
  reason: 'no_interaction' | 'tab_hidden' | 'video_paused_idle';
}

export type InactivityTrackerOutboundMessage =
  | { type: 'INACTIVITY_TICK'; payload: InactivityTickPayload }
  | { type: 'INACTIVITY_IDLE_TIMEOUT'; payload: InactivityIdleTimeoutPayload }
  | { type: 'INACTIVITY_RESUME'; payload: { resumedAt: number } }
  | { type: 'INACTIVITY_ERROR'; payload: { error: string; code: string } }
  | { type: 'INACTIVITY_READY'; payload: { workerId: string } };

export type InactivityTrackerInboundMessage =
  | { type: 'INACTIVITY_INIT'; payload: InactivityInitPayload }
  | { type: 'INACTIVITY_USER_EVENT'; payload: InactivityUserEventPayload }
  | { type: 'INACTIVITY_RESUME'; payload: undefined }
  | { type: 'INACTIVITY_DESTROY'; payload: undefined };

/* ════════════════════════════════════════════════════════════════════
   OFFLINE SYNC QUEUE TYPES
════════════════════════════════════════════════════════════════════ */

export interface SyncQueueItem {
  id: string;
  operation: SyncOperationType;
  payload: Record<string, unknown>;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
  priority: 'high' | 'normal' | 'low';
  metadata?: {
    lessonId?: string;
    courseId?: string;
    userId?: string;
  };
}

export interface SyncQueueConfig {
  dbName: string;
  storeName: string;
  maxQueueSize: number;
  retryDelayMs: number;
  maxRetries: number;
  batchSize: number;
  flushIntervalMs: number;
}

export interface SyncStatus {
  isOnline: boolean;
  queueLength: number;
  pendingHighPriority: number;
  lastSyncAttempt: number | null;
  lastSuccessfulSync: number | null;
  syncErrors: SyncError[];
}

export interface SyncError {
  itemId: string;
  error: string;
  timestamp: number;
  retryCount: number;
}

export type SyncQueueOutboundMessage =
  | { type: 'SYNC_STATUS_UPDATE'; payload: SyncStatus }
  | { type: 'SYNC_ITEM_PROCESSED'; payload: { itemId: string; success: boolean } }
  | { type: 'SYNC_QUEUE_FLUSHED'; payload: { processed: number; failed: number } }
  | { type: 'SYNC_ERROR'; payload: SyncError };

export type SyncQueueInboundMessage =
  | { type: 'SYNC_QUEUE_PUSH'; payload: Omit<SyncQueueItem, 'id' | 'timestamp' | 'retryCount'> }
  | { type: 'SYNC_QUEUE_FLUSH'; payload: undefined }
  | { type: 'SYNC_QUEUE_ONLINE'; payload: undefined }
  | { type: 'SYNC_QUEUE_OFFLINE'; payload: undefined }
  | { type: 'SYNC_QUEUE_CLEAR'; payload: { itemIds?: string[] } };

/* ════════════════════════════════════════════════════════════════════
   SERVICE WORKER CACHING TYPES
════════════════════════════════════════════════════════════════════ */

export interface CacheStrategy {
  name: string;
  patterns: RegExp[];
  strategy: 'cache-first' | 'network-first' | 'stale-while-revalidate' | 'network-only';
  maxAgeSeconds?: number;
  maxEntries?: number;
}

export interface OfflineAssetManifest {
  version: string;
  assets: OfflineAsset[];
  generatedAt: number;
}

export interface OfflineAsset {
  url: string;
  revision: string;
  type: 'document' | 'video' | 'image' | 'script' | 'style' | 'font' | 'other';
  size?: number;
  tags?: string[];
}

export interface BackgroundSyncRegistration {
  tag: string;
  minInterval?: number;
  oneTime?: boolean;
}

/* ════════════════════════════════════════════════════════════════════
   HOOK & INTEGRATION TYPES
════════════════════════════════════════════════════════════════════ */

export interface UseBackgroundLearningTrackerOptions {
  lessonId: string;
  userId: string;
  videoElement: HTMLVideoElement | null;
  apiEndpoint?: string;
  enableOfflineSync?: boolean;
  idleThresholdMs?: number;
  batchIntervalMs?: number;
}

export interface BackgroundTrackerState {
  isTracking: boolean;
  activeWatchTime: number;
  completionPercentage: number;
  isIdle: boolean;
  idleDurationMs: number;
  syncStatus: SyncStatus;
  networkStatus: NetworkStatus;
  lastError: string | null;
}

export interface BackgroundTrackerActions {
  startTracking: () => void;
  stopTracking: () => void;
  flushProgress: () => Promise<void>;
  forceSync: () => Promise<void>;
  pauseTracking: () => void;
  resumeTracking: () => void;
}

export type UseBackgroundLearningTrackerReturn = BackgroundTrackerState & BackgroundTrackerActions;

/* ════════════════════════════════════════════════════════════════════
   GENERIC WORKER MESSAGE WRAPPER
═════════════════════════════════════════════════════════════════════ */

export interface WorkerMessage<TType extends WorkerMessageType, TPayload> {
  type: TType;
  payload: TPayload;
  meta: {
    messageId: string;
    timestamp: number;
    source: 'main' | 'watch-tracker' | 'inactivity-tracker' | 'sync-queue';
    version: string;
  };
}

export function createWorkerMessage(type: string, payload: any, source?: string): any {
  return {
    type,
    payload,
    meta: {
      messageId: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      timestamp: Date.now(),
      source: source || 'main',
      version: '1.0.0',
    },
  };
}