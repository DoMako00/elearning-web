/**
 * useInactivityPrompt - Hook for Inactivity Prompt with Web Worker Integration
 * Manages idle detection worker lifecycle and modal state.
 * The countdown lives here — InactivityModal is purely presentational.
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import type {
  UseInactivityPromptOptions,
  UseInactivityPromptReturn,
} from './types';

export function useInactivityPrompt(
  options: UseInactivityPromptOptions = {}
): UseInactivityPromptReturn {
  const {
    initialCountdown = 60,
    onTimeout,
    onResume,
  } = options;

  const [state, setState] = useState<'hidden' | 'countdown' | 'paused'>('hidden');
  const [countdown, setCountdown] = useState(initialCountdown);

  // Keep a stable ref to initialCountdown so openModal always uses the latest value
  const initialCountdownRef = useRef(initialCountdown);
  useEffect(() => { initialCountdownRef.current = initialCountdown; }, [initialCountdown]);

  const handleTimeout = useCallback(() => {
    setState('paused');
    onTimeout?.();
  }, [onTimeout]);

  const handleResume = useCallback(() => {
    setState('hidden');
    onResume?.();
  }, [onResume]);

  const openModal = useCallback(() => {
    setCountdown(initialCountdownRef.current);
    setState('countdown');
  }, []);

  const closeModal = useCallback(() => {
    setState('hidden');
  }, []);

  /** For testing: directly trigger idle timeout without waiting for the worker */
  const triggerIdleTimeout = useCallback(() => {
    openModal();
  }, [openModal]);

  /** Worker message handler */
  const handleWorkerMessage = useCallback((event: MessageEvent) => {
    const data = event.data as { type: string; payload?: unknown };
    if (data.type === 'IDLE_TIMEOUT_TRIGGERED') {
      openModal();
    }
  }, [openModal]);

  // ---------------------------------------------------------------------------
  // Web Worker lifecycle
  // ---------------------------------------------------------------------------
  useEffect(() => {
    let worker: Worker;
    try {
      worker = new Worker(
        new URL('../../../workers/inactivityTracker.worker.ts', import.meta.url),
        { type: 'module' }
      );

      worker.addEventListener('message', handleWorkerMessage);
      worker.addEventListener('error', (error) => {
        console.error('[InactivityPrompt] Worker error:', error);
      });

      worker.postMessage({
        type: 'INACTIVITY_INIT',
        payload: {
          userId: 'current-user',
          idleThresholdMs: 5 * 60 * 1000,
          heartbeatIntervalMs: 10_000,
          config: {
            enableVisibilityAPI: true,
            enableWakeLock: true,
            maxIdleEventsBeforeFlush: 10,
          },
        },
      });
    } catch (err) {
      console.warn('[InactivityPrompt] Worker could not be created:', err);
    }

    return () => {
      if (worker) {
        worker.removeEventListener('message', handleWorkerMessage);
        worker.terminate();
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // only mount/unmount — handleWorkerMessage is stable via useCallback

  // ---------------------------------------------------------------------------
  // Countdown timer — only ticks when state === 'countdown'
  // ✅ Fixed: no immediate tick() call on mount (was causing double-decrement)
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (state !== 'countdown') return;

    const interval = setInterval(() => {
      setCountdown((prev) => {
        const next = prev - 1;
        if (next <= 0) {
          // Schedule state change outside of setCountdown to avoid batching issues
          setTimeout(handleTimeout, 0);
          return 0;
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [state, handleTimeout]);

  return {
    state,
    countdown,
    openModal,
    closeModal,
    handleResume,
    handleWorkerMessage,
    triggerIdleTimeout,
  };
}

export type { InactivityModalProps } from './types';