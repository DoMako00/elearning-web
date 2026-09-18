export interface YourStreakProps {
  streakDays?: number;
  completedMilestones?: number;
  totalMilestones?: number;
  message?: string;
  trophySrc?: string;
  onViewBadges?: () => void;
}
