export { ActivityHeatmap } from './ActivityHeatmap';
export { MetricCards } from './MetricCards';
export { MilestoneBadges, MilestoneBadge } from './MilestoneBadges';
export { StreakAnalytics } from './StreakAnalytics';
export { StreakMilestoneModal } from './StreakMilestoneModal';
export type { StreakMilestoneModalProps } from './StreakMilestoneModal';
export {
  calculateStreak,
  calculateMilestones,
  generateHeatmapCells,
  getStreakAnalyticsData,
  isDayActive,
  formatDateString,
  DEFAULT_STREAK_CONFIG,
  DEFAULT_STREAK_MILESTONES,
} from '../../../shared/utils/streakEngine';
export type {
  StreakConfig,
  DailyActivityLog,
  StreakResult,
  StreakMilestone,
  MilestoneStatus,
  ActivityHeatmapCell,
  StreakAnalyticsData,
} from '../../../shared/utils/streakEngine';