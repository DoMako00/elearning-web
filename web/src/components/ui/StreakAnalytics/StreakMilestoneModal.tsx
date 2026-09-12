/**
 * StreakMilestoneModal - Milestone Unlocked / Streak Level Up Popup
 * Light theme matching GreenLearn design system with animated flame, badge rewards, and confetti
 */

import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, CheckCircle2, X, Sparkles, Award, ShieldCheck } from 'lucide-react';
import confetti from 'canvas-confetti';
import type { StreakMilestone } from '../../../shared/utils/streakEngine';
import './StreakMilestoneModal.css';

export interface StreakMilestoneModalProps {
  isOpen: boolean;
  onClose: () => void;
  milestone: StreakMilestone | null;
  currentStreak: number;
  bonusFreezePasses?: number;
  onContinue?: () => void;
}

function launchStreakConfetti(): void {
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
    particleCount: 100,
    spread: 80,
    origin: { y: 0.45 },
    colors: ['#20a862', '#f59e0b', '#10b981', '#ffffff', '#fbbf24'],
    shapes: ['circle', 'square'],
    scalar: 1.2,
    zIndex: 9999,
  });

  setTimeout(() => {
    canvas.remove();
  }, 3000);
}

function playStreakChime(): void {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const now = audioContext.currentTime;
    const freqs = [440, 554.37, 659.25, 880];

    freqs.forEach((freq, idx) => {
      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();

      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.value = 0.08;

      osc.connect(gain);
      gain.connect(audioContext.destination);

      const start = now + idx * 0.1;
      osc.start(start);
      osc.stop(start + 0.18);

      gain.gain.setValueAtTime(0.08, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.18);
    });
  } catch {
    // Audio unsupported or blocked
  }
}

export function StreakMilestoneModal({
  isOpen,
  onClose,
  milestone,
  currentStreak,
  bonusFreezePasses = 1,
  onContinue,
}: StreakMilestoneModalProps) {
  const hasTriggeredRef = useRef(false);

  useEffect(() => {
    if (isOpen && milestone) {
      if (!hasTriggeredRef.current) {
        hasTriggeredRef.current = true;
        playStreakChime();
        launchStreakConfetti();
      }

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
    } else {
      hasTriggeredRef.current = false;
    }
  }, [isOpen, milestone, onClose]);

  if (!milestone) return null;

  const colorScheme = {
    bronze: { border: '#d69e2e', bg: 'linear-gradient(135deg, #fef3c7 0%, #ffffff 100%)', badge: '🥉 Bronze Tier' },
    silver: { border: '#9ca3af', bg: 'linear-gradient(135deg, #f3f4f6 0%, #ffffff 100%)', badge: '🥈 Silver Tier' },
    gold: { border: '#f59e0b', bg: 'linear-gradient(135deg, #fef3c7 0%, #ffffff 100%)', badge: '🥇 Gold Tier' },
  }[milestone.color] || { border: '#20a862', bg: '#ffffff', badge: 'Achievement' };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="streak-milestone-overlay"
          className="streak-milestone-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-labelledby="streak-milestone-title"
        >
          <motion.div
            key="streak-milestone-modal-box"
            className="streak-milestone-modal"
            initial={{ opacity: 0, scale: 0.85, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -16 }}
            transition={{
              type: 'spring',
              damping: 25,
              stiffness: 300,
              duration: 0.4,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              className="streak-milestone-close-btn"
              onClick={onClose}
              aria-label="Close milestone popup"
            >
              <X size={18} />
            </button>

            {/* Top Flame / Icon presentation */}
            <div className="streak-milestone-header">
              <div className="streak-milestone-icon-wrapper" style={{ borderColor: colorScheme.border, background: colorScheme.bg }}>
                <motion.div
                  className="streak-milestone-halo"
                  animate={{ scale: [1, 1.25, 1], opacity: [0.35, 0.75, 0.35] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                />
                <span className="streak-milestone-emoji">{milestone.icon}</span>
                <div className="streak-milestone-flame-badge">
                  <Flame size={14} />
                </div>
              </div>

              <div className="streak-milestone-tag">
                <Sparkles size={14} /> STREAK MILESTONE UNLOCKED!
              </div>

              <h2 id="streak-milestone-title" className="streak-milestone-title">
                {milestone.label}
              </h2>
              <p className="streak-milestone-description">
                {milestone.description}
              </p>
            </div>

            {/* Streak achievement counter card */}
            <div className="streak-milestone-stat-card">
              <div className="stat-flame-row">
                <Flame size={28} className="flame-icon-glow" />
                <span className="stat-days-count">{currentStreak} Days</span>
              </div>
              <span className="stat-tier-label">{colorScheme.badge} Achieved!</span>
            </div>

            {/* Unlocked rewards list */}
            <div className="streak-milestone-rewards-section">
              <h3 className="rewards-section-title">
                <Award size={15} /> Streak Rewards Earned
              </h3>
              <ul className="rewards-list">
                <motion.li
                  className="reward-item"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <CheckCircle2 size={16} className="reward-check-icon" />
                  <span>Unlocked <strong>{milestone.label}</strong> Profile Badge</span>
                </motion.li>
                <motion.li
                  className="reward-item"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <ShieldCheck size={16} className="reward-check-icon" />
                  <span>+{bonusFreezePasses} Grace Streak Freeze Pass added</span>
                </motion.li>
              </ul>
            </div>

            {/* Actions */}
            <div className="streak-milestone-actions">
              <button
                className="streak-milestone-primary-btn"
                onClick={() => {
                  onContinue?.();
                  onClose();
                }}
                autoFocus
              >
                <Flame size={18} />
                Keep My Streak Going!
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
