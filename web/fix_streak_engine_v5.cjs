const fs = require('fs');
const path = 'C:\\\\Users\\\\shehab\\\\OneDrive\\\\Desktop\\\\E-learning stage\\\\elearning-web\\\\web\\\\src\\\\shared\\\\utils\\\\streakEngine.ts';

const content = `/**
 * Streak Engine Types - GreenLearn LMS
 * Type definitions for streak calculation engine
 */

/**
 * Configuration for streak calculation
 */
export interface StreakConfig {
  /** Minimum daily activity required to count as "active" (in minutes) */
  minDailyActivityMinutes: number;
  /** Number of freeze passes available */
  streakFreezePasses: number;
  /** User's timezone (IANA timezone string) */
  userTimezone: string;
}

/**
 * Represents a single day's activity log
 */
export interface DailyActivityLog {
  /** ISO date string (YYYY-MM-DD) in user's local timezone */
  date: string;
  /** Minutes of learning activity on this day */
  minutes: number;
  /** Whether a lesson was completed on this day */
  lessonCompleted?: boolean;
  /** Whether a quiz was completed on this day */
  quizCompleted?: boolean;
}

/**
 * Result of streak calculation
 */
export interface StreakResult {
  /** Current active streak count */
  currentStreak: number;
  /** Longest streak ever achieved */
  longestStreak: number;
  /** Total number of active days across all time */
  totalActiveDays: number;
  /** Number of freeze passes remaining */
  freezePassesRemaining: number;
  /** Whether the streak was preserved by a freeze pass today */
  streakPreservedByFreeze: boolean;
  /** Date of the last activity (ISO string) */
  lastActiveDate: string | null;
  /** Whether the user is active today */
  isActiveToday: boolean;
}

/**
 * Milestone definitions for streak achievements
 */
export interface StreakMilestone {
  id: string;
  label: string;
  description: string;
  requiredDays: number;
  icon: string;
  color: 'bronze' | 'silver' | 'gold';
}

/**
 * Represents a milestone status for UI display
 */
export interface MilestoneStatus {
  milestone: StreakMilestone;
  isUnlocked: boolean;
  progress: number; // 0-100
  daysRemaining: number;
}

/**
 * Activity matrix cell for heatmap rendering
 */
export interface ActivityHeatmapCell {
  date: Date;
  dateStr: string;
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  activityLevel: 0 | 1 | 2 | 3 | 4; // 0 = no activity, 1-4 = intensity levels
  minutes: number;
}

/**
 * Complete streak analytics data for profile dashboard
 */
export interface StreakAnalyticsData {
  streak: StreakResult;
  milestones: MilestoneStatus[];
  heatmap: ActivityHeatmapCell[];
  weeklyActivity: { day: string; minutes: number }[];
  monthlyStats: {
    activeDays: number;
    totalMinutes: number;
    averageMinutesPerActiveDay: number;
  };
}

/**
 * Default configuration
 */
export const DEFAULT_STREAK_CONFIG = {
  minDailyActivityMinutes: 5,
  streakFreezePasses: 3,
  userTimezone: 'UTC',
};

/**
 * Default streak milestones
 */
export const DEFAULT_STREAK_MILESTONES = [
  {
    id: 'rookie',
    label: '7-Day Rookie',
    description: 'Maintain a 7-day learning streak',
    requiredDays: 7,
    icon: '🥉',
    color: 'bronze' as const,
  },
  {
    id: 'scholar',
    label: '30-Day Bronze Scholar',
    description: 'Maintain a 30-day learning streak',
    requiredDays: 30,
    icon: '🥈',
    color: 'silver' as const,
  },
  {
    id: 'master',
    label: '100-Day Master Learner',
    description: 'Maintain a 100-day learning streak',
    requiredDays: 100,
    icon: '🥇',
    color: 'gold' as const,
  },
];

export type ActivityHeatmapCell = {
  date: Date;
  dateStr: string;
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  activityLevel: 0 | 1 | 2 | 3 | 4;
  minutes: number;
};

export type MilestoneStatus = {
  milestone: {
    id: string;
    label: string;
    description: string;
    requiredDays: number;
    icon: string;
    color: 'bronze' | 'silver' | 'gold';
  };
  isUnlocked: boolean;
  progress: number;
  daysRemaining: number;
};

export interface StreakResult {
  currentStreak: number;
  longestStreak: number;
  totalActiveDays: number;
  freezePassesRemaining: number;
  streakPreservedByFreeze: boolean;
  lastActiveDate: string | null;
  isActiveToday: boolean;
}

export interface StreakConfig {
  minDailyActivityMinutes: number;
  streakFreezePasses: number;
  userTimezone: string;
}

export interface DailyActivityLog {
  date: string;
  minutes: number;
  lessonCompleted?: boolean;
  quizCompleted?: boolean;
}

export interface StreakResult {
  currentStreak: number;
  longestStreak: number;
  totalActiveDays: number;
  freezePassesRemaining: number;
  streakPreservedByFreeze: boolean;
  lastActiveDate: string | null;
  isActiveToday: boolean;
}

export interface StreakConfig {
  minDailyActivityMinutes: number;
  streakFreezePasses: number;
  userTimezone: string;
}

export interface DailyActivityLog {
  date: string;
  minutes: number;
  lessonCompleted?: boolean;
  quizCompleted?: boolean;
}

export interface StreakResult {
  currentStreak: number;
  longestStreak: number;
  totalActiveDays: number;
  freezePassesRemaining: number;
  streakPreservedByFreeze: boolean;
  lastActiveDate: string | null;
  isActiveToday: boolean;
}

export interface StreakMilestone {
  id: string;
  label: string;
  description: string;
  requiredDays: number;
  icon: string;
  color: 'bronze' | 'silver' | 'gold';
}

export interface MilestoneStatus {
  milestone: StreakMilestone;
  isUnlocked: boolean;
  progress: number;
  daysRemaining: number;
}

export interface ActivityHeatmapCell {
  date: Date;
  dateStr: string;
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  activityLevel: 0 | 1 | 2 | 3 | 4;
  minutes: number;
}

export interface StreakAnalyticsData {
  streak: StreakResult;
  milestones: MilestoneStatus[];
  heatmap: ActivityHeatmapCell[];
  weeklyActivity: { day: string; minutes: number }[];
  monthlyStats: {
    activeDays: number;
    totalMinutes: number;
    averageMinutesPerActiveDay: number;
  };
}
`;

const fs = require('fs');
const path = 'C:\\Users\\shehab\\OneDrive\\Desktop\\E-learning stage\\elearning-web\\web\\src\\shared\\utils\\streakEngine.ts';
fs.writeFileSync(path, content, 'utf8');
console.log('File written successfully');