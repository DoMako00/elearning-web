/**
 * InactivityModal - Inactivity Warning Countdown Modal
 * Light theme matching GreenLearn design system
 * Purely presentational - receives countdown as prop, NO internal timer
 */

import { useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, PlayCircle, X } from 'lucide-react';
import type { InactivityModalProps } from './types';
import './InactivityModal.css';

interface CircularProgressProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
}

function CircularProgress({ percentage, size = 100, strokeWidth = 8 }: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - percentage / 100);

  return (
    <svg
      className="inactivity-circular-progress"
      width={size}
      height={size}
      role="progressbar"
      aria-valuenow={Math.round(percentage)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`Time remaining: ${Math.round(percentage)}%`}
    >
      {/* SVG gradient definition */}
      <defs>
        <linearGradient id="inactivity-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#20a862" />
        </linearGradient>
      </defs>
      <circle
        className="inactivity-progress-bg"
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        strokeWidth={strokeWidth}
      />
      <motion.circle
        className="inactivity-progress-fill"
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        style={{
          strokeDasharray: circumference,
          rotate: '-90deg',
          transformOrigin: 'center',
        }}
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 0.9, ease: 'linear' }}
      />
    </svg>
  );
}

export function InactivityModal({
  isOpen,
  onClose,
  onResume,
  countdown = 60,
  totalCountdown = 60,
}: InactivityModalProps) {
  const hasPlayedWarningSound = useRef(false);

  // Sound functions — defined unconditionally (Rules of Hooks)
  const playTickSound = useCallback(() => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.type = 'sine';
      oscillator.frequency.value = 880;
      gainNode.gain.value = 0.04;

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      const now = audioContext.currentTime;
      oscillator.start(now);
      oscillator.stop(now + 0.08);
      gainNode.gain.setValueAtTime(0.04, now);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    } catch {
      // Audio not supported or blocked
    }
  }, []);

  const playWarningSound = useCallback(() => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const now = audioContext.currentTime;

      [440, 349.23, 329.63].forEach((freq, index) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.type = 'sine';
        oscillator.frequency.value = freq;
        gainNode.gain.value = 0.05;

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        const startTime = now + index * 0.15;
        oscillator.start(startTime);
        oscillator.stop(startTime + 0.25);
        gainNode.gain.setValueAtTime(0.05, startTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + 0.25);
      });
    } catch {
      // Audio not supported or blocked
    }
  }, []);

  // Play tick sound on every countdown change when modal is open
  useEffect(() => {
    if (!isOpen) return;
    playTickSound();
  }, [isOpen, countdown, playTickSound]);

  // Play warning sound at 10s
  useEffect(() => {
    if (!isOpen) return;
    if (countdown === 10 && !hasPlayedWarningSound.current) {
      hasPlayedWarningSound.current = true;
      playWarningSound();
    }
    if (countdown > 10) {
      hasPlayedWarningSound.current = false;
    }
  }, [isOpen, countdown, playWarningSound]);

  // Reset warning sound flag when modal closes
  useEffect(() => {
    if (!isOpen) {
      hasPlayedWarningSound.current = false;
    }
  }, [isOpen]);

  // Keyboard handler — defined unconditionally
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onResume();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose, onResume]);

  // ✅ Early return AFTER all hooks — fixes the "Rendered more hooks" error
  const percentage = (countdown / totalCountdown) * 100;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="inactivity-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-labelledby="inactivity-title"
          aria-describedby="inactivity-desc"
        >
          <motion.div
            className="inactivity-modal"
            initial={{ opacity: 0, scale: 0.92, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -8 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            onClick={(e) => e.stopPropagation()}
            role="document"
          >
            {/* Header */}
            <div className="inactivity-modal-header">
              <motion.div
                className="inactivity-icon-wrapper"
                initial={{ scale: 0, rotate: -90 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1], delay: 0.1 }}
              >
                <AlertCircle className="inactivity-icon alert" size={40} aria-hidden="true" />
                <motion.div
                  className="inactivity-icon-glow"
                  animate={{ scale: [0, 1.2, 1], opacity: [0, 0.2, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: 'easeOut' }}
                />
              </motion.div>

              <motion.h2
                id="inactivity-title"
                className="inactivity-title"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: 0.15 }}
              >
                Are you still learning?
              </motion.h2>

              <motion.p
                id="inactivity-desc"
                className="inactivity-description"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: 0.2 }}
              >
                We haven&apos;t detected any activity. Your session will be paused in:
              </motion.p>
            </div>

            {/* Countdown */}
            <div className="inactivity-countdown-section">
              <CircularProgress
                percentage={percentage}
                size={100}
                strokeWidth={8}
              />
              <motion.div
                className="inactivity-countdown-display"
                key={countdown}
                initial={{ opacity: 0.6, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2, ease: [0.34, 1.56, 0.64, 1] }}
              >
                <span className="inactivity-countdown-number">{countdown}</span>
                <span className="inactivity-countdown-label">seconds</span>
              </motion.div>
            </div>

            {/* Actions */}
            <motion.div
              className="inactivity-actions"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.35 }}
            >
              <button
                className="inactivity-btn-primary"
                onClick={onResume}
                autoFocus
                aria-label="I'm still here — resume session"
              >
                <PlayCircle className="inactivity-btn-icon" size={18} aria-hidden="true" />
                I&apos;m still here
              </button>
              <button
                className="inactivity-btn-secondary"
                onClick={onClose}
                aria-label="End session"
              >
                <X className="inactivity-btn-icon" size={16} aria-hidden="true" />
                End Session
              </button>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
