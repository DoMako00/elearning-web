/**
 * XPRewardModal - Animated XP Reward & Level Up Notification
 * Light theme matching GreenLearn design system
 */

import { useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Star, Trophy, CheckCircle2, X } from 'lucide-react';
import type { XPRewardModalProps, XPRewardData } from './types';
import './XPRewardModal.css';

const LEVEL_UP_SOUND_FREQUENCIES = [523.25, 659.25, 783.99, 1046.50];
const XP_EARNED_SOUND_FREQUENCIES = [659.25, 783.99, 987.77];

function playToneSequence(frequencies: number[], baseDuration = 120): void {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const now = audioContext.currentTime;

    frequencies.forEach((freq, index) => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.type = 'sine';
      oscillator.frequency.value = freq;
      gainNode.gain.value = 0.06;

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      const startTime = now + index * (baseDuration / 1000);
      oscillator.start(startTime);
      oscillator.stop(startTime + baseDuration / 1000);

      gainNode.gain.setValueAtTime(0.06, startTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + baseDuration / 1000);
    });
  } catch {
    // Audio not supported or blocked
  }
}

function launchConfetti(colors?: string[], particleCount = 80): void {
  const canvas = document.createElement('canvas');
  canvas.style.position = 'fixed';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.style.pointerEvents = 'none';
  canvas.style.zIndex = '9999';
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  document.body.appendChild(canvas);

  const myConfetti = confetti.create(canvas as HTMLCanvasElement, { resize: true, useWorker: true });

  myConfetti({
    particleCount,
    spread: 70,
    origin: { y: 0.4 },
    colors: colors || ['#20a862', '#16a34a', '#fbbf24', '#ffffff', '#60a5fa'],
    shapes: ['circle', 'square'],
    scalar: 1.2,
    zIndex: 9999,
  });

  setTimeout(() => {
    canvas.remove();
  }, 3000);
}

function launchLevelUpConfetti(): void {
  launchConfetti(['#20a862', '#16a34a', '#fbbf24', '#ffffff', '#60a5fa'], 120);
  setTimeout(() => launchConfetti(['#20a862', '#ffffff'], 60), 200);
  setTimeout(() => launchConfetti(['#16a34a', '#22c55e'], 60), 400);
}

function launchXPConfetti(): void {
  launchConfetti(['#20a862', '#60a5fa', '#ffffff', '#fbbf24'], 60);
}

interface ProgressBarProps {
  percentage: number;
  animated?: boolean;
  delay?: number;
}

function ProgressBar({ percentage, animated = true, delay = 0 }: ProgressBarProps) {
  const clampedPercentage = Math.min(100, Math.max(0, percentage));
  
  return (
    <div className="xp-reward-progress-container">
      <div
        className="xp-reward-progress-track"
        role="progressbar"
        aria-valuenow={Math.round(clampedPercentage)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Level progress: ${Math.round(clampedPercentage)}%`}
      >
        <motion.div
          className="xp-reward-progress-fill"
          initial={{ width: '0%' }}
          animate={{ width: `${clampedPercentage}%` }}
          transition={
            animated
              ? { duration: 1.2, delay, ease: [0.25, 0.46, 0.45, 0.94] }
              : { duration: 0 }
          }
          style={{ willChange: 'width' }}
        >
          <div className="xp-reward-progress-shine" />
        </motion.div>
      </div>
      <div className="xp-reward-progress-labels">
        <span>{Math.round(clampedPercentage)}%</span>
        <span>to Level {clampedPercentage >= 100 ? 'MAX' : 'Next'}</span>
      </div>
    </div>
  );
}

interface LevelBadgeProps {
  level: number;
  isNew?: boolean;
  pulse?: boolean;
}

function LevelBadge({ level, isNew, pulse = false }: LevelBadgeProps) {
  return (
    <motion.div
      className={`xp-reward-level-badge ${isNew ? 'is-new' : ''} ${pulse ? 'pulse' : ''}`}
      initial={{ scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1], delay: 0.2 }}
      whileHover={{ scale: 1.05 }}
    >
      <span className="xp-reward-level-label">LEVEL</span>
      <span className="xp-reward-level-number">{level}</span>
      {isNew && (
        <motion.span
          className="xp-reward-level-up-label"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.3 }}
        >
          LEVEL UP!
        </motion.span>
      )}
    </motion.div>
  );
}

interface XPEarnedDisplayProps {
  xp: number;
  reason: XPRewardData['reason'];
}

function XPEarnedDisplay({ xp, reason }: XPEarnedDisplayProps) {
  const reasonLabels: Record<XPRewardData['reason'], string> = {
    lesson_complete: 'Lesson Completed',
    module_complete: 'Module Completed',
    streak_bonus: 'Streak Bonus',
    perfect_score: 'Perfect Score',
    custom: 'Bonus',
  };

  return (
    <motion.div
      className="xp-reward-xp-display"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.34, 1.56, 0.64, 1], delay: 0.1 }}
    >
      <motion.div
        className="xp-reward-xp-amount"
        initial={{ scale: 0.5 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1], delay: 0.15 }}
      >
        <span className="xp-reward-plus">+</span>
        <span className="xp-reward-number">{xp.toLocaleString()}</span>
        <span className="xp-reward-xp-label">XP</span>
      </motion.div>
      <div className="xp-reward-reason">{reasonLabels[reason]}</div>
    </motion.div>
  );
}

interface ParticleBurstProps {
  isActive: boolean;
}

function ParticleBurst({ isActive }: ParticleBurstProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const particlesRef = useRef<
    Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      color: string;
      life: number;
      maxLife: number;
    }>
  >([]);

  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = canvas.offsetWidth * window.devicePixelRatio;
    canvas.height = canvas.offsetHeight * window.devicePixelRatio;
  }, []);

  useEffect(() => {
    if (!isActive) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    initCanvas();

    particlesRef.current = Array.from({ length: 25 }, () => ({
      x: canvas.width / 2,
      y: canvas.height / 2,
      vx: (Math.random() - 0.5) * 6,
      vy: (Math.random() - 0.5) * 6 - 1.5,
      size: Math.random() * 3 + 1.5,
      color: ['#20a862', '#16a34a', '#fbbf24', '#60a5fa', '#a855f7', '#ffffff'][
        Math.floor(Math.random() * 6)
      ],
      life: 1,
      maxLife: 1,
    }));

    const animate = () => {
      if (!ctx || !canvasRef.current) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particlesRef.current.forEach((p, index) => {
        p.life -= 0.012;
        if (p.life <= 0) {
          particlesRef.current.splice(index, 1);
          return;
        }

        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.06;

        ctx.globalAlpha = p.life;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();
      });

      if (particlesRef.current.length > 0) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animate();

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isActive]);

  return (
    <canvas
      ref={canvasRef}
      className="xp-reward-particle-canvas"
      style={{ display: isActive ? 'block' : 'none' }}
      aria-hidden="true"
    />
  );
}

export function XPRewardModal({
  isOpen,
  onClose,
  rewardData,
  onKeepLearning,
}: XPRewardModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const hasPlayedSound = useRef(false);
  const hasLaunchedConfetti = useRef(false);

  useEffect(() => {
    if (isOpen && rewardData) {
      hasPlayedSound.current = false;
      hasLaunchedConfetti.current = false;

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          onClose();
        }
      };

      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';

      return () => {
        document.removeEventListener('keydown', handleKeyDown);
        document.body.style.overflow = '';
      };
    }
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen && rewardData && !hasPlayedSound.current) {
      hasPlayedSound.current = true;

      if (rewardData.leveledUp) {
        playToneSequence(LEVEL_UP_SOUND_FREQUENCIES);
        launchLevelUpConfetti();
      } else {
        playToneSequence(XP_EARNED_SOUND_FREQUENCIES);
        launchXPConfetti();
      }
    }
  }, [isOpen, rewardData]);

  useEffect(() => {
    if (isOpen && rewardData && !hasLaunchedConfetti.current) {
      hasLaunchedConfetti.current = true;
    }
  }, [isOpen, rewardData]);

  if (!isOpen || !rewardData) return null;

  const isLevelUp = rewardData.leveledUp;
  const earnedXP = rewardData.earnedXP;
  const reason = rewardData.reason;

  const currentLevelInfo = {
    currentXP: rewardData.totalXP,
    xpForCurrentLevel: 0,
    xpForNextLevel: 1000,
    progressPercentage: 0,
    xpNeededForNextLevel: 0,
  };

  return (
    <AnimatePresence>
      <motion.div
        className="xp-reward-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-labelledby="xp-reward-title"
      >
        <ParticleBurst isActive={isOpen} />

        <motion.div
          ref={modalRef}
          className={`xp-reward-modal ${isLevelUp ? 'level-up' : ''}`}
          initial={{ opacity: 0, scale: 0.92, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -8 }}
          transition={{
            type: 'spring',
            damping: 28,
            stiffness: 320,
            duration: 0.35,
          }}
          onClick={(e) => e.stopPropagation()}
          role="document"
        >
          <div className="xp-reward-modal-header">
            <motion.div
              className="xp-reward-icon-container"
              initial={{ scale: 0, rotate: -90 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1], delay: 0.1 }}
            >
              {isLevelUp ? (
                <Trophy className="xp-reward-icon trophy" size={44} aria-hidden="true" />
              ) : (
                <Star className="xp-reward-icon star" size={44} aria-hidden="true" />
              )}
              <motion.div
                className="xp-reward-glow"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: [0, 1.15, 1], opacity: [0, 0.25, 0] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut' }}
              />
            </motion.div>

            <motion.h2
              id="xp-reward-title"
              className="xp-reward-title"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: 0.15 }}
            >
              {isLevelUp ? 'LEVEL UP!' : 'XP EARNED!'}
            </motion.h2>
          </div>

          <div className="xp-reward-content">
            <XPEarnedDisplay xp={earnedXP} reason={reason} />

            <div className="xp-reward-divider">
              <motion.div
                className="xp-reward-divider-line"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.4, delay: 0.25 }}
              />
            </div>

            <div className="xp-reward-level-section">
              <LevelBadge
                level={rewardData.newLevel}
                isNew={isLevelUp}
                pulse={isLevelUp}
              />

              <motion.div
                className="xp-reward-progress-section"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.4 }}
              >
                <div className="xp-reward-progress-labels-top">
                  <span>Level {rewardData.newLevel}</span>
                  <span>
                    {rewardData.totalXP.toLocaleString()} /{' '}
                    {rewardData.totalXP + currentLevelInfo.xpNeededForNextLevel} XP
                  </span>
                </div>
                <ProgressBar
                  percentage={currentLevelInfo.progressPercentage}
                  animated={true}
                  delay={0.5}
                />
                <div className="xp-reward-xp-breakdown">
                  <span>Current XP: <strong>{rewardData.totalXP.toLocaleString()}</strong></span>
                  <span>XP to next level: <strong>{currentLevelInfo.xpNeededForNextLevel.toLocaleString()}</strong></span>
                </div>
              </motion.div>
            </div>
          </div>

          <motion.div
            className="xp-reward-actions"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.6 }}
          >
            <button
              className="xp-reward-btn-primary"
              onClick={() => {
                onKeepLearning?.();
                onClose();
              }}
              autoFocus
            >
              <CheckCircle2 className="xp-reward-btn-icon" size={18} aria-hidden="true" />
              Keep Learning
            </button>
            <motion.button
              className="xp-reward-btn-secondary"
              onClick={onClose}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <X className="xp-reward-btn-icon" size={18} aria-hidden="true" />
              Dismiss
            </motion.button>
          </motion.div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export { launchConfetti, launchLevelUpConfetti, launchXPConfetti };