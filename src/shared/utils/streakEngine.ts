/**
 * Streak Calculation Engine - GreenLearn LMS
 * Logic and helper utilities for calculating streaks, grace freeze mechanics,
 * milestone progress, and matrix generation for the profile analytics dashboard.
 */

/**
 * Configuration for streak calculation
 */
export interface StreakConfig {
  /** Minimum daily activity required to count as "active" (in minutes, default: 5) */
  minDailyActivityMinutes: number;
  /** Number of freeze passes available (default: 3) */
  streakFreezePasses: number;
  /** User's timezone (IANA timezone string, default: 'UTC' or user local) */
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
  /** Whether the streak was preserved by a freeze pass today/yesterday */
  streakPreservedByFreeze: boolean;
  /** Date of the last activity (ISO string YYYY-MM-DD) */
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
  dateStr: string; // YYYY-MM-DD
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
export const DEFAULT_STREAK_CONFIG: StreakConfig = {
  minDailyActivityMinutes: 5,
  streakFreezePasses: 3,
  userTimezone: 'UTC',
};

/**
 * Default streak milestones
 */
export const DEFAULT_STREAK_MILESTONES: StreakMilestone[] = [
  {
    id: 'rookie',
    label: '7-Day Rookie',
    description: 'Maintain a 7-day learning streak',
    requiredDays: 7,
    icon: '🥉',
    color: 'bronze',
  },
  {
    id: 'scholar',
    label: '30-Day Bronze Scholar',
    description: 'Maintain a 30-day learning streak',
    requiredDays: 30,
    icon: '🥈',
    color: 'silver',
  },
  {
    id: 'master',
    label: '100-Day Master Learner',
    description: 'Maintain a 100-day learning streak',
    requiredDays: 100,
    icon: '🥇',
    color: 'gold',
  },
];

/**
 * Formats a Date object to YYYY-MM-DD in the given timezone (or local if none specified)
 */
export function formatDateString(date: Date, timezone?: string): string {
  try {
    if (timezone) {
      const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
      return formatter.format(date);
    }
  } catch {
    // Fallback to standard local formatting
  }
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Checks whether an activity log meets the active day threshold:
 * ≥ minDailyActivityMinutes (default 5 min) OR completed quiz OR completed lesson
 */
export function isDayActive(
  log?: DailyActivityLog,
  minMinutes: number = DEFAULT_STREAK_CONFIG.minDailyActivityMinutes
): boolean {
  if (!log) return false;
  return (log.minutes >= minMinutes) || Boolean(log.quizCompleted) || Boolean(log.lessonCompleted);
}

/**
 * Determines the activity level (0-4) based on minutes
 */
export function getActivityLevel(minutes: number): 0 | 1 | 2 | 3 | 4 {
  if (minutes <= 0) return 0;
  if (minutes < 15) return 1;
  if (minutes < 30) return 2;
  if (minutes < 60) return 3;
  return 4;
}

/**
 * Adds or subtracts days from a YYYY-MM-DD date string
 */
export function offsetDateString(dateStr: string, daysOffset: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + daysOffset);
  const nextY = date.getFullYear();
  const nextM = String(date.getMonth() + 1).padStart(2, '0');
  const nextD = String(date.getDate()).padStart(2, '0');
  return `${nextY}-${nextM}-${nextD}`;
}

/**
 * Calculates current streak, longest streak, total active days, and freeze pass usage.
 * 
 * Logic:
 * - Active Threshold: ≥ 5 mins or 1 completed quiz/lesson.
 * - Missed Day Logic: When scanning backward from yesterday:
 *   If yesterday was missed and streakFreezePasses > 0, consumes 1 freeze pass to preserve streak.
 *   Otherwise, resets streak.
 */
export function calculateStreak(
  activityLogs: DailyActivityLog[],
  config: Partial<StreakConfig> = {},
  now: Date = new Date()
): StreakResult {
  const fullConfig: StreakConfig = { ...DEFAULT_STREAK_CONFIG, ...config };
  const todayStr = formatDateString(now, fullConfig.userTimezone);
  const yesterdayStr = offsetDateString(todayStr, -1);

  // Index logs by date
  const logMap = new Map<string, DailyActivityLog>();
  activityLogs.forEach((log) => {
    logMap.set(log.date, log);
  });

  // Calculate Total Active Days & Last Active Date
  let totalActiveDays = 0;
  let lastActiveDate: string | null = null;
  const sortedLogs = [...activityLogs].sort((a, b) => a.date.localeCompare(b.date));

  sortedLogs.forEach((log) => {
    if (isDayActive(log, fullConfig.minDailyActivityMinutes)) {
      totalActiveDays += 1;
      if (!lastActiveDate || log.date > lastActiveDate) {
        lastActiveDate = log.date;
      }
    }
  });

  const isActiveToday = isDayActive(logMap.get(todayStr), fullConfig.minDailyActivityMinutes);

  // Calculate Current Streak & Freeze Pass consumption
  let freezePassesRemaining = fullConfig.streakFreezePasses;
  let streakPreservedByFreeze = false;
  let currentStreak = 0;

  if (isActiveToday) {
    currentStreak = 1;
  }

  // Iterate backward starting from yesterday
  let checkDate = yesterdayStr;
  let consecutiveGracePasses = 0;

  while (true) {
    const log = logMap.get(checkDate);
    const active = isDayActive(log, fullConfig.minDailyActivityMinutes);

    if (active) {
      currentStreak += 1;
      consecutiveGracePasses = 0;
    } else {
      // Missed day: check if we can consume a freeze pass
      if (freezePassesRemaining > 0 && consecutiveGracePasses === 0) {
        freezePassesRemaining -= 1;
        streakPreservedByFreeze = true;
        consecutiveGracePasses += 1;
        // Streak count stays preserved through the freeze day
      } else {
        // No freeze pass available or multiple consecutive missed days
        break;
      }
    }

    checkDate = offsetDateString(checkDate, -1);
  }

  // Calculate Longest Streak historically
  let longestStreak = 0;
  let runningStreak = 0;
  if (sortedLogs.length > 0) {
    const earliestDate = sortedLogs[0].date;
    let scanDate = earliestDate;
    const endDate = todayStr;

    while (scanDate <= endDate) {
      const log = logMap.get(scanDate);
      if (isDayActive(log, fullConfig.minDailyActivityMinutes)) {
        runningStreak += 1;
        if (runningStreak > longestStreak) {
          longestStreak = runningStreak;
        }
      } else {
        runningStreak = 0;
      }
      scanDate = offsetDateString(scanDate, 1);
    }
  }

  longestStreak = Math.max(longestStreak, currentStreak);

  return {
    currentStreak,
    longestStreak,
    totalActiveDays,
    freezePassesRemaining,
    streakPreservedByFreeze,
    lastActiveDate,
    isActiveToday,
  };
}

/**
 * Calculates milestone progress and unlocked status
 */
export function calculateMilestones(
  currentStreak: number,
  milestones: StreakMilestone[] = DEFAULT_STREAK_MILESTONES
): MilestoneStatus[] {
  return milestones.map((milestone) => {
    const isUnlocked = currentStreak >= milestone.requiredDays;
    const progress = Math.min(100, Math.round((currentStreak / milestone.requiredDays) * 100));
    const daysRemaining = Math.max(0, milestone.requiredDays - currentStreak);

    return {
      milestone,
      isUnlocked,
      progress,
      daysRemaining,
    };
  });
}

/**
 * Generates an activity heatmap matrix (e.g. 30 days, 365 days / 12 months)
 */
export function generateHeatmapCells(
  activityLogs: DailyActivityLog[],
  monthsCount: number = 12,
  now: Date = new Date(),
  timezone: string = 'UTC'
): ActivityHeatmapCell[] {
  const logMap = new Map<string, DailyActivityLog>();
  activityLogs.forEach((log) => logMap.set(log.date, log));

  const todayStr = formatDateString(now, timezone);
  const cells: ActivityHeatmapCell[] = [];

  // Generate cells for the given range
  const daysTotal = monthsCount === 1 ? 30 : 365;
  for (let i = daysTotal - 1; i >= 0; i--) {
    const dateStr = offsetDateString(todayStr, -i);
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    const log = logMap.get(dateStr);
    const minutes = log ? log.minutes : 0;

    cells.push({
      date,
      dateStr,
      dayNumber: d,
      isCurrentMonth: date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear(),
      isToday: dateStr === todayStr,
      activityLevel: getActivityLevel(minutes),
      minutes,
    });
  }

  return cells;
}

/**
 * Builds the full StreakAnalyticsData payload
 */
export function getStreakAnalyticsData(
  activityLogs: DailyActivityLog[],
  config: Partial<StreakConfig> = {},
  now: Date = new Date()
): StreakAnalyticsData {
  const streak = calculateStreak(activityLogs, config, now);
  const milestones = calculateMilestones(streak.currentStreak);
  const heatmap = generateHeatmapCells(activityLogs, 12, now, config.userTimezone || 'UTC');

  // Calculate weekly activity (last 7 days: Mon-Sun)
  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const todayStr = formatDateString(now, config.userTimezone);
  const weeklyActivity: { day: string; minutes: number }[] = [];
  const logMap = new Map<string, DailyActivityLog>();
  activityLogs.forEach((log) => logMap.set(log.date, log));

  for (let i = 6; i >= 0; i--) {
    const dateStr = offsetDateString(todayStr, -i);
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    const log = logMap.get(dateStr);
    weeklyActivity.push({
      day: weekdays[date.getDay()],
      minutes: log ? log.minutes : 0,
    });
  }

  // Monthly stats for current month
  const currentMonthPrefix = todayStr.substring(0, 7); // YYYY-MM
  let activeDaysInMonth = 0;
  let totalMinutesInMonth = 0;

  activityLogs.forEach((log) => {
    if (log.date.startsWith(currentMonthPrefix)) {
      if (isDayActive(log, config.minDailyActivityMinutes || DEFAULT_STREAK_CONFIG.minDailyActivityMinutes)) {
        activeDaysInMonth += 1;
      }
      totalMinutesInMonth += log.minutes || 0;
    }
  });

  const averageMinutesPerActiveDay = activeDaysInMonth > 0 
    ? Math.round(totalMinutesInMonth / activeDaysInMonth) 
    : 0;

  return {
    streak,
    milestones,
    heatmap,
    weeklyActivity,
    monthlyStats: {
      activeDays: activeDaysInMonth,
      totalMinutes: totalMinutesInMonth,
      averageMinutesPerActiveDay,
    },
  };
}
