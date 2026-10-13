// Forwarded to canonical location in the student feature module.
export { ActivityHeatmap } from '../../../features/student/components/StreakAnalytics/ActivityHeatmap';
export { MetricCards } from '../../../features/student/components/StreakAnalytics/MetricCards';
export { MilestoneBadges, MilestoneBadge } from '../../../features/student/components/StreakAnalytics/MilestoneBadges';
export { StreakAnalytics } from '../../../features/student/components/StreakAnalytics/StreakAnalytics';
export { StreakMilestoneModal } from '../../../features/student/components/StreakAnalytics/StreakMilestoneModal';
export type { StreakMilestoneModalProps } from '../../../features/student/components/StreakAnalytics/StreakMilestoneModal';
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