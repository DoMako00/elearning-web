/**
 * XP Rewards Types - GreenLearn Gamification System
 */

export interface XPConfig {
  baseXPPerLesson: number;
  baseXPPerModule: number;
  xpPerLevel: (level: number) => number;
}

export const DEFAULT_XP_CONFIG: XPConfig = {
  baseXPPerLesson: 50,
  baseXPPerModule: 200,
  xpPerLevel: (level) => Math.floor(1000 * Math.pow(1.15, level - 1)),
};

export interface LevelInfo {
  currentLevel: number;
  currentXP: number;
  xpForCurrentLevel: number;
  xpForNextLevel: number;
  progressPercentage: number;
  xpNeededForNextLevel: number;
}

export interface XPRewardData {
  earnedXP: number;
  reason: 'lesson_complete' | 'module_complete' | 'streak_bonus' | 'perfect_score' | 'custom';
  previousLevel: number;
  newLevel: number;
  leveledUp: boolean;
  totalXP: number;
}

export interface XPRewardModalProps {
  isOpen: boolean;
  onClose: () => void;
  rewardData: XPRewardData | null;
  onKeepLearning?: () => void;
}

export interface UseXPRewardsOptions {
  initialXP?: number;
  initialLevel?: number;
  config?: Partial<XPConfig>;
  onLevelUp?: (newLevel: number, reward: XPRewardData) => void;
  onXPEarned?: (reward: XPRewardData) => void;
}

export interface UseXPRewardsReturn {
  currentXP: number;
  currentLevel: number;
  levelInfo: LevelInfo;
  isModalOpen: boolean;
  rewardData: XPRewardData | null;
  earnXP: (amount: number, reason: XPRewardData['reason'], customData?: Partial<XPRewardData>) => void;
  openRewardModal: (reward: XPRewardData) => void;
  closeRewardModal: () => void;
  addXPSilently: (amount: number) => void;
}

// CanvasConfettiOptions type removed - using inline configuration instead