/**
 * useBackgroundLearningTracker - React Hook for Background Learning Tracking
 * Manages worker lifecycle, communication, and state synchronization
 */

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import type {
  UseBackgroundLearningTrackerOptions,
  UseBackgroundLearningTrackerReturn,
  BackgroundTrackerState,
  BackgroundTrackerActions,
  SyncQueueOutboundMessage,
  WatchTrackerInitPayload,
  InactivityInitPayload,
  VideoEventType,
  UserInteractionType,
  WatchTrackerOutboundMessage,
  InactivityTrackerOutboundMessage,
} from '../shared/types/workers';
import { createWorkerMessage } from '../shared/types/workers';

interface WorkerInstance {
  worker: Worker;
  messageHandlers: Map<string, (payload: any) => void>;
  pendingRequests: Map<string, { resolve: (value: any) => void; reject: (error: Error) => void }>;
}

function createWorker(
  workerPath: string,
  onMessage: (message: any) => void
): WorkerInstance {
  const worker = new Worker(new URL(workerPath, import.meta.url), { type: 'module' });
  const messageHandlers = new Map<string, (payload: any) => void>();
  const pendingRequests = new Map<string, { resolve: (value: any) => void; reject: (error: Error) => void }>();

  worker.addEventListener('message', (event: MessageEvent<any>) => {
    const { type, payload, meta } = event.data;

    if (meta?.messageId && pendingRequests.has(meta.messageId)) {
      const { resolve } = pendingRequests.get(meta.messageId)!;
      pendingRequests.delete(meta.messageId);
      resolve(payload);
      return;
    }

    const handler = messageHandlers.get(type);
    if (handler) {
      handler(payload);
    } else {
      onMessage(event.data);
    }
  });

  worker.addEventListener('error', (error) => {
    console.error('[BackgroundTracker] Worker error:', error);
  });

  return { worker, messageHandlers, pendingRequests };
}

function sendMessage(
  instance: WorkerInstance,
  type: string,
  payload: any
): Promise<any> {
  return new Promise((resolve, reject) => {
    const messageId = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    instance.pendingRequests.set(messageId, { resolve, reject });

    const message = createWorkerMessage(type, payload, 'main');
    (message.meta as any).messageId = messageId;

    instance.worker.postMessage(message);

    setTimeout(() => {
      if (instance.pendingRequests.has(messageId)) {
        instance.pendingRequests.delete(messageId);
        reject(new Error(`Worker message timeout: ${type}`));
      }
    }, 10000);
  });
}

export function useBackgroundLearningTracker(
  options: UseBackgroundLearningTrackerOptions
): UseBackgroundLearningTrackerReturn {
  const {
    lessonId,
    userId,
    videoElement,
    apiEndpoint = '/api/progress',
    enableOfflineSync = true,
    idleThresholdMs = 5 * 60 * 1000,
    batchIntervalMs = 30000,
  } = options;

  const [state, setState] = useState<BackgroundTrackerState>({
    isTracking: false,
    activeWatchTime: 0,
    completionPercentage: 0,
    isIdle: false,
    idleDurationMs: 0,
    syncStatus: {
      isOnline: navigator.onLine,
      queueLength: 0,
      pendingHighPriority: 0,
      lastSyncAttempt: null,
      lastSuccessfulSync: null,
      syncErrors: [],
    },
    networkStatus: navigator.onLine ? 'online' : 'offline',
    lastError: null,
  });

  const watchTrackerRef = useRef<WorkerInstance | null>(null);
  const inactivityTrackerRef = useRef<WorkerInstance | null>(null);
  const syncWorkerRef = useRef<ServiceWorker | null>(null);
  const videoEventListenersRef = useRef<Record<VideoEventType, (e: Event) => void>>({} as any);
  const interactionListenersRef = useRef<Record<UserInteractionType, (e: Event) => void>>({} as any);
  const isInitializedRef = useRef(false);

  const updateState = useCallback((partial: Partial<BackgroundTrackerState>) => {
    setState(prev => ({ ...prev, ...partial }));
  }, []);

  const handleWatchTrackerMessage = useCallback((message: WatchTrackerOutboundMessage) => {
    switch (message.type) {
      case 'WATCH_TRACKER_TICK':
        updateState({
          activeWatchTime: message.payload.activeWatchTime,
          completionPercentage: Math.min(100, (message.payload.currentTime / message.payload.lastEventTimestamp) * 100 || 0),
        });
        break;
      case 'WATCH_TRACKER_FLUSH':
        updateState({
          activeWatchTime: message.payload.activeWatchTime,
          completionPercentage: message.payload.completionPercentage,
        });
        break;
      case 'WATCH_TRACKER_ERROR':
        updateState({ lastError: message.payload.error });
        break;
    }
  }, [updateState]);

  const handleInactivityMessage = useCallback((message: InactivityTrackerOutboundMessage) => {
    switch (message.type) {
      case 'INACTIVITY_TICK':
        updateState({
          isIdle: message.payload.isIdle,
          idleDurationMs: message.payload.idleDurationMs,
        });
        break;
      case 'INACTIVITY_IDLE_TIMEOUT':
        updateState({
          isIdle: true,
          idleDurationMs: message.payload.idleDurationMs,
        });
        break;
      case 'INACTIVITY_RESUME':
        updateState({
          isIdle: false,
          idleDurationMs: 0,
        });
        break;
      case 'INACTIVITY_ERROR':
        updateState({ lastError: message.payload.error });
        break;
    }
  }, [updateState]);

  const handleSyncMessage = useCallback((message: SyncQueueOutboundMessage) => {
    switch (message.type) {
      case 'SYNC_STATUS_UPDATE':
        updateState({
          syncStatus: message.payload,
          networkStatus: message.payload.isOnline ? 'online' : 'offline',
        });
        break;
      case 'SYNC_ERROR':
        updateState({ lastError: message.payload.error });
        break;
    }
  }, [updateState]);

  const initializeWorkers = useCallback(async () => {
    if (isInitializedRef.current) return;

    watchTrackerRef.current = createWorker(
      '../workers/watchTracker.worker.ts',
      handleWatchTrackerMessage
    );

    inactivityTrackerRef.current = createWorker(
      '../workers/inactivityTracker.worker.ts',
      handleInactivityMessage
    );

    if (enableOfflineSync && 'serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw-learning-cache.js', {
          scope: '/',
        });
        syncWorkerRef.current = registration.active;

        navigator.serviceWorker.addEventListener('message', (event) => {
          handleSyncMessage(event.data);
        });

        navigator.serviceWorker.addEventListener('controllerchange', () => {
          syncWorkerRef.current = navigator.serviceWorker.controller;
        });
      } catch (error) {
        console.warn('[BackgroundTracker] Service Worker registration failed:', error);
      }
    }

    const watchInitPayload: WatchTrackerInitPayload = {
      lessonId,
      userId,
      videoDuration: videoElement?.duration || 0,
      currentTime: videoElement?.currentTime || 0,
      playbackRate: videoElement?.playbackRate || 1,
      config: {
        batchIntervalMs,
        maxBatchSize: 50,
        apiEndpoint,
        idleThresholdMs,
      },
    };

    const inactivityInitPayload: InactivityInitPayload = {
      userId,
      idleThresholdMs,
      heartbeatIntervalMs: 10000,
      config: {
        enableVisibilityAPI: true,
        enableWakeLock: true,
        maxIdleEventsBeforeFlush: 10,
      },
    };

    await sendMessage(watchTrackerRef.current, 'WATCH_TRACKER_INIT', watchInitPayload);
    await sendMessage(inactivityTrackerRef.current, 'INACTIVITY_INIT', inactivityInitPayload);

    isInitializedRef.current = true;
    updateState({ isTracking: true });
  }, [
    lessonId,
    userId,
    videoElement,
    apiEndpoint,
    enableOfflineSync,
    idleThresholdMs,
    batchIntervalMs,
    handleWatchTrackerMessage,
    handleInactivityMessage,
    handleSyncMessage,
    updateState,
  ]);

  const attachVideoListeners = useCallback(() => {
    if (!videoElement) return;

    const handleVideoEvent = (eventType: VideoEventType) => (e: Event) => {
      if (!watchTrackerRef.current) return;

      const video = e.target as HTMLVideoElement;
      sendMessage(watchTrackerRef.current, 'WATCH_TRACKER_EVENT', {
        eventType,
        timestamp: Date.now(),
        currentTime: video.currentTime,
        playbackRate: video.playbackRate,
        videoDuration: video.duration,
        isSeeking: eventType === 'seeked',
      });

      if (!inactivityTrackerRef.current) return;
      sendMessage(inactivityTrackerRef.current, 'INACTIVITY_USER_EVENT', {
        eventType: eventType === 'play' ? 'click' : eventType === 'pause' ? 'click' : 'mousemove',
        timestamp: Date.now(),
        isVideoPlaying: !video.paused,
        videoCurrentTime: video.currentTime,
      });
    };

    const events: VideoEventType[] = ['play', 'pause', 'seeked', 'timeupdate', 'ended', 'waiting', 'playing'];
    events.forEach(eventType => {
      const handler = handleVideoEvent(eventType);
      videoEventListenersRef.current[eventType] = handler;
      videoElement.addEventListener(eventType, handler, { passive: true });
    });
  }, [videoElement]);

  const detachVideoListeners = useCallback(() => {
    if (!videoElement) return;

    Object.entries(videoEventListenersRef.current).forEach(([eventType, handler]) => {
      videoElement.removeEventListener(eventType as keyof HTMLVideoElementEventMap, handler);
    });
    videoEventListenersRef.current = {} as any;
  }, [videoElement]);

  const attachInteractionListeners = useCallback(() => {
    const handleInteraction = (eventType: UserInteractionType) => (_e: Event) => {
      if (!inactivityTrackerRef.current) return;

      sendMessage(inactivityTrackerRef.current, 'INACTIVITY_USER_EVENT', {
        eventType,
        timestamp: Date.now(),
      });
    };

    const events: UserInteractionType[] = ['mousemove', 'keydown', 'click', 'touchstart', 'scroll'];
    events.forEach(eventType => {
      const handler = handleInteraction(eventType);
      interactionListenersRef.current[eventType] = handler;
      document.addEventListener(eventType, handler, { passive: true });
    });

    const handleVisibilityChange = () => {
      if (!inactivityTrackerRef.current) return;
      sendMessage(inactivityTrackerRef.current, 'INACTIVITY_USER_EVENT', {
        eventType: document.hidden ? 'blur' : 'focus',
        timestamp: Date.now(),
      });
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    interactionListenersRef.current.visibilitychange = handleVisibilityChange;
  }, []);

  const detachInteractionListeners = useCallback(() => {
    Object.entries(interactionListenersRef.current).forEach(([eventType, handler]) => {
      if (eventType === 'visibilitychange') {
        document.removeEventListener('visibilitychange', handler);
      } else {
        document.removeEventListener(eventType as keyof DocumentEventMap, handler);
      }
    });
    interactionListenersRef.current = {} as any;
  }, []);

  const startTracking = useCallback(() => {
    if (!isInitializedRef.current) {
      initializeWorkers();
    }
    attachVideoListeners();
    attachInteractionListeners();
    updateState({ isTracking: true });
  }, [initializeWorkers, attachVideoListeners, attachInteractionListeners, updateState]);

  const stopTracking = useCallback(() => {
    detachVideoListeners();
    detachInteractionListeners();

    if (watchTrackerRef.current) {
      sendMessage(watchTrackerRef.current, 'WATCH_TRACKER_DESTROY', undefined);
      watchTrackerRef.current.worker.terminate();
      watchTrackerRef.current = null;
    }

    if (inactivityTrackerRef.current) {
      sendMessage(inactivityTrackerRef.current, 'INACTIVITY_DESTROY', undefined);
      inactivityTrackerRef.current.worker.terminate();
      inactivityTrackerRef.current = null;
    }

    isInitializedRef.current = false;
    updateState({ isTracking: false });
  }, [detachVideoListeners, detachInteractionListeners, updateState]);

  const flushProgress = useCallback(async () => {
    if (watchTrackerRef.current) {
      await sendMessage(watchTrackerRef.current, 'WATCH_TRACKER_FLUSH', undefined);
    }
  }, []);

  const forceSync = useCallback(async () => {
    if (syncWorkerRef.current) {
      syncWorkerRef.current.postMessage({ type: 'SYNC_QUEUE_FLUSH', payload: undefined });
    }
  }, []);

  const pauseTracking = useCallback(() => {
    detachVideoListeners();
    updateState({ isTracking: false });
  }, [detachVideoListeners, updateState]);

  const resumeTracking = useCallback(() => {
    attachVideoListeners();
    if (inactivityTrackerRef.current) {
      sendMessage(inactivityTrackerRef.current, 'INACTIVITY_RESUME', undefined);
    }
    updateState({ isTracking: true });
  }, [attachVideoListeners, updateState]);

  useEffect(() => {
    if (videoElement) {
      attachVideoListeners();
      attachInteractionListeners();
      initializeWorkers();

      return () => {
        stopTracking();
      };
    }
  }, [videoElement, lessonId, userId]);

  useEffect(() => {
    const handleOnline = () => updateState({ networkStatus: 'online' });
    const handleOffline = () => updateState({ networkStatus: 'offline' });

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [updateState]);

  const actions: BackgroundTrackerActions = useMemo(() => ({
    startTracking,
    stopTracking,
    flushProgress,
    forceSync,
    pauseTracking,
    resumeTracking,
  }), [
    startTracking,
    stopTracking,
    flushProgress,
    forceSync,
    pauseTracking,
    resumeTracking,
  ]);

  return { ...state, ...actions };
}

export type { BackgroundTrackerState, BackgroundTrackerActions, UseBackgroundLearningTrackerOptions, UseBackgroundLearningTrackerReturn };