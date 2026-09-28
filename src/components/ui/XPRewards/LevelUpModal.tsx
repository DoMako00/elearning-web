/**
 * LevelUpModal - Dedicated Level Upgrade Popup Window
 * Light theme matching GreenLearn design system with animated badges, unlocks, and confetti
 */

import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Sparkles, CheckCircle2, X, ArrowUpRight, Award, Zap } from 'lucide-react';
import { launchLevelUpConfetti } from './XPRewardModal';
import './LevelUpModal.css';

export interface LevelUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  previousLevel: number;
  newLevel: number;
  totalXP: number;
  unlockedPerks?: string[];
  onKeepLearning?: () => void;
}

const LEVEL_UP_SOUND_FREQUENCIES = [523.25, 659.25, 783.99, 1046.50];

function playLevelUpTone(): void {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const now = audioContext.currentTime;

    LEVEL_UP_SOUND_FREQUENCIES.forEach((freq, index) => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.type = 'sine';
      oscillator.frequency.value = freq;
      gainNode.gain.value = 0.08;

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      const startTime = now + index * 0.12;
      oscillator.start(startTime);
      oscillator.stop(startTime + 0.16);

      gainNode.gain.setValueAtTime(0.08, startTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + 0.16);
    });
  } catch {
    // Audio context not allowed or supported
  }
}

export function LevelUpModal({
  isOpen,
  onClose,
  previousLevel,
  newLevel,
  totalXP,
  unlockedPerks,
  onKeepLearning,
}: LevelUpModalProps) {
  const hasTriggeredAnimation = useRef(false);

  useEffect(() => {
    if (isOpen) {
      if (!hasTriggeredAnimation.current) {
        hasTriggeredAnimation.current = true;
        playLevelUpTone();
        launchLevelUpConfetti();
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
      hasTriggeredAnimation.current = false;
    }
  }, [isOpen, onClose]);

  const perks = unlockedPerks || [
    `Unlocked Level ${newLevel} Scholar Badge`,
    '+1 Streak Freeze Pass bonus',
    'Access to Advanced Quiz Challenges',
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="level-up-modal-overlay"
          className="level-up-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-labelledby="level-up-title"
        >
          <motion.div
            key="level-up-modal-box"
            className="level-up-modal"
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
              className="level-up-close-btn"
              onClick={onClose}
              aria-label="Close level up popup"
            >
              <X size={18} />
            </button>

            {/* Top Banner / Celebration Glow */}
            <div className="level-up-header">
              <div className="level-up-trophy-container">
                <motion.div
                  className="level-up-trophy-halo"
                  animate={{ scale: [1, 1.25, 1], opacity: [0.4, 0.8, 0.4] }}
                  transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
                />
                <motion.div
                  className="level-up-trophy-icon"
                  initial={{ scale: 0, rotate: -25 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', damping: 14, stiffness: 220, delay: 0.1 }}
                >
                  <Trophy size={48} />
                </motion.div>
              </div>

              <motion.div
                className="level-up-tag"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Sparkles size={14} /> LEVEL UPGRADE
              </motion.div>

              <motion.h2
                id="level-up-title"
                className="level-up-title"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
              >
                Level {newLevel} Reached!
              </motion.h2>
              <p className="level-up-subtitle">
                Congratulations! Your consistent learning just unlocked a new stage.
              </p>
            </div>

            {/* Level Transition Indicator */}
            <motion.div
              className="level-up-transition-card"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
            >
              <div className="level-node previous">
                <span className="level-node-label">Previous</span>
                <span className="level-node-num">{previousLevel}</span>
              </div>
              <div className="level-node-arrow">
                <ArrowUpRight size={24} />
              </div>
              <div className="level-node current">
                <span className="level-node-label">Current</span>
                <span className="level-node-num">Lvl {newLevel}</span>
                <span className="level-node-badge">NEW</span>
              </div>
            </motion.div>

            {/* Stats Bar */}
            <div className="level-up-stats">
              <div className="level-up-stat-item">
                <Zap size={16} className="stat-icon-xp" />
                <span>Total XP: <strong>{totalXP.toLocaleString()} XP</strong></span>
              </div>
            </div>

            {/* Unlocked Perks Section */}
            <div className="level-up-perks-section">
              <h3 className="level-up-perks-title">
                <Award size={16} /> Unlocked Rewards & Perks
              </h3>
              <ul className="level-up-perks-list">
                {perks.map((perk, index) => (
                  <motion.li
                    key={index}
                    className="level-up-perk-item"
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + index * 0.1 }}
                  >
                    <CheckCircle2 size={16} className="perk-check-icon" />
                    <span>{perk}</span>
                  </motion.li>
                ))}
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="level-up-actions">
              <button
                className="level-up-primary-btn"
                onClick={() => {
                  onKeepLearning?.();
                  onClose();
                }}
                autoFocus
              >
                <CheckCircle2 size={18} />
                Continue Learning
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
