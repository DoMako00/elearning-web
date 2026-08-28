/**
 * useXPRewards - Custom Hook for XP Rewards Management
 * Handles XP tracking, level calculation, and reward modal state
 */

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import type {
  UseXPRewardsOptions,
  UseXPRewardsReturn,
  XPRewardData,
  LevelInfo,
  XPConfig,
} from './types';
import { DEFAULT_XP_CONFIG } from './types';

function calculateLevelInfo(xp: number, config: XPConfig): LevelInfo {
  let level = 1;
  let xpForCurrentLevel = 0;
  let xpForNextLevel = config.xpPerLevel(1);

  while (xp >= xpForNextLevel) {
    level++;
    xpForCurrentLevel = xpForNextLevel;
    xpForNextLevel += config.xpPerLevel(level);
  }

  const progressPercentage = xpForNextLevel > xpForCurrentLevel
    ? ((xp - xpForCurrentLevel) / (xpForNextLevel - xpForCurrentLevel)) * 100
    : 100;

  return {
    currentLevel: level,
    currentXP: xp,
    xpForCurrentLevel,
    xpForNextLevel,
    progressPercentage: Math.min(100, Math.max(0, progressPercentage)),
    xpNeededForNextLevel: Math.max(0, xpForNextLevel - xp),
  };
}

function generateRewardData(
  earnedXP: number,
  reason: XPRewardData['reason'],
  previousXP: number,
  newXP: number,
  config: XPConfig,
  customData?: Partial<XPRewardData>
): XPRewardData {
  const prevLevelInfo = calculateLevelInfo(previousXP, config);
  const newLevelInfo = calculateLevelInfo(newXP, config);

  const leveledUp = newLevelInfo.currentLevel > prevLevelInfo.currentLevel;

  return {
    earnedXP,
    reason,
    previousLevel: prevLevelInfo.currentLevel,
    newLevel: newLevelInfo.currentLevel,
    leveledUp,
    totalXP: newXP,
    ...customData,
  };
}

export function useXPRewards(options: UseXPRewardsOptions = {}): UseXPRewardsReturn {
  const {
    initialXP = 0,
    config = {},
    onLevelUp,
    onXPEarned,
  } = options;

  const mergedConfig = useMemo(
    () => ({ ...DEFAULT_XP_CONFIG, ...config }),
    [config]
  );

  const [currentXP, setCurrentXP] = useState(initialXP);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [rewardData, setRewardData] = useState<XPRewardData | null>(null);
  const pendingRewardsRef = useRef<XPRewardData[]>([]);
  const isProcessingRef = useRef(false);

  const levelInfo = useMemo(() => calculateLevelInfo(currentXP, mergedConfig), [currentXP, mergedConfig]);

  const processRewardQueue = useCallback(async () => {
    if (isProcessingRef.current || pendingRewardsRef.current.length === 0) return;

    isProcessingRef.current = true;

    while (pendingRewardsRef.current.length > 0) {
      const reward = pendingRewardsRef.current.shift()!;
      setRewardData(reward);
      setIsModalOpen(true);

      await new Promise<void>((resolve) => {
        const checkClosed = setInterval(() => {
          if (!isModalOpen) {
            clearInterval(checkClosed);
            resolve();
          }
        }, 100);
      });

      await new Promise((resolve) => setTimeout(resolve, 300));
    }

    isProcessingRef.current = false;
  }, [isModalOpen]);

  const earnXP = useCallback(
    (amount: number, reason: XPRewardData['reason'], customData?: Partial<XPRewardData>) => {
      if (amount <= 0) return;

      setCurrentXP((prevXP) => {
        const newXP = prevXP + amount;
        const reward = generateRewardData(amount, reason, prevXP, newXP, mergedConfig, customData);

        pendingRewardsRef.current.push(reward);

        onXPEarned?.(reward);

        if (reward.leveledUp) {
          onLevelUp?.(reward.newLevel, reward);
        }

        return newXP;
      });

      if (!isProcessingRef.current) {
        setTimeout(() => processRewardQueue(), 0);
      }
    },
    [mergedConfig, onLevelUp, onXPEarned, processRewardQueue]
  );

  const openRewardModal = useCallback((reward: XPRewardData) => {
    setRewardData(reward);
    setIsModalOpen(true);
  }, []);

  const closeRewardModal = useCallback(() => {
    setIsModalOpen(false);
    setTimeout(() => setRewardData(null), 300);
  }, []);

  const addXPSilently = useCallback((amount: number) => {
    if (amount <= 0) return;
    setCurrentXP((prev) => prev + amount);
  }, []);

  useEffect(() => {
    processRewardQueue();
  }, [processRewardQueue]);

  return {
    currentXP,
    currentLevel: levelInfo.currentLevel,
    levelInfo,
    isModalOpen,
    rewardData,
    earnXP,
    openRewardModal,
    closeRewardModal,
    addXPSilently,
  };
}