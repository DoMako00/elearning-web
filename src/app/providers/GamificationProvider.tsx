import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from "react";
import {
  calculateStreak,
  DailyActivityLog,
  StreakResult,
  formatDateString,
} from "../../shared/utils/streakEngine";

export interface ActivityEvent {
  id: string;
  type: "video_watch" | "quiz_complete" | "lesson_complete" | "assignment_submit";
  timestamp: string; // ISO
  xpAwarded?: number;
  metadata?: Record<string, unknown>;
}

export interface GamificationState {
  xpTotal: number;
  activityLog: ActivityEvent[];
  streakFreezePasses: number;
}

export interface GamificationContextType {
  xpTotal: number;
  activityLog: ActivityEvent[];
  streakFreezePasses: number;
  currentStreak: number;
  longestStreak: number;
  totalActiveDays: number;
  streakResult: StreakResult;
  addXP: (amount: number, activityType: ActivityEvent["type"], metadata?: Record<string, unknown>) => void;
  logActivity: (event: Omit<ActivityEvent, "id" | "timestamp">) => void;
  consumeStreakFreeze: () => void;
}

const STORAGE_KEY = "greenlearn_gamification_state";

// Generate realistic baseline seed history leading up to today so streak is initialized
function generateInitialState(): GamificationState {
  const today = new Date();
  const logs: ActivityEvent[] = [];

  // Seed previous 4 consecutive days to form an active streak
  for (let i = 4; i >= 1; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    logs.push({
      id: `seed-activity-${i}`,
      type: "lesson_complete",
      timestamp: d.toISOString(),
      xpAwarded: 50,
      metadata: { lessonId: `seed-lesson-${i}` },
    });
  }

  // Activity for today so streak is currently 5
  logs.push({
    id: "seed-activity-today",
    type: "video_watch",
    timestamp: today.toISOString(),
    xpAwarded: 25,
    metadata: { durationMinutes: 15 },
  });

  return {
    xpTotal: 1250,
    activityLog: logs,
    streakFreezePasses: 3,
  };
}

export const GamificationContext = createContext<GamificationContextType | null>(null);

export const GamificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<GamificationState>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // Fallback
    }
    return generateInitialState();
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignore storage write errors
    }
  }, [state]);

  // Aggregate activityLog into DailyActivityLog[] for streakEngine
  const dailyActivityLogs = useMemo<DailyActivityLog[]>(() => {
    const dayMap = new Map<string, DailyActivityLog>();

    state.activityLog.forEach((event) => {
      const date = formatDateString(new Date(event.timestamp));
      const existing = dayMap.get(date) || {
        date,
        minutes: 0,
        lessonCompleted: false,
        quizCompleted: false,
      };

      if (event.type === "video_watch") {
        const mins = typeof event.metadata?.durationMinutes === "number" ? event.metadata.durationMinutes : 5;
        existing.minutes += mins;
      } else if (event.type === "lesson_complete") {
        existing.lessonCompleted = true;
        existing.minutes += 10;
      } else if (event.type === "quiz_complete") {
        existing.quizCompleted = true;
        existing.minutes += 5;
      } else if (event.type === "assignment_submit") {
        existing.minutes += 15;
      }

      dayMap.set(date, existing);
    });

    return Array.from(dayMap.values());
  }, [state.activityLog]);

  // Compute streak metrics dynamically using streakEngine
  const streakResult = useMemo<StreakResult>(() => {
    return calculateStreak(dailyActivityLogs, {
      streakFreezePasses: state.streakFreezePasses,
    });
  }, [dailyActivityLogs, state.streakFreezePasses]);

  const addXP = useCallback(
    (amount: number, activityType: ActivityEvent["type"], metadata?: Record<string, unknown>) => {
      const newEvent: ActivityEvent = {
        id: `activity-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        type: activityType,
        timestamp: new Date().toISOString(),
        xpAwarded: amount,
        metadata,
      };

      setState((prev) => ({
        ...prev,
        xpTotal: Math.max(0, prev.xpTotal + amount),
        activityLog: [...prev.activityLog, newEvent],
      }));
    },
    []
  );

  const logActivity = useCallback((event: Omit<ActivityEvent, "id" | "timestamp">) => {
    const newEvent: ActivityEvent = {
      ...event,
      id: `activity-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
    };

    setState((prev) => ({
      ...prev,
      xpTotal: Math.max(0, prev.xpTotal + (event.xpAwarded || 0)),
      activityLog: [...prev.activityLog, newEvent],
    }));
  }, []);

  const consumeStreakFreeze = useCallback(() => {
    setState((prev) => ({
      ...prev,
      streakFreezePasses: Math.max(0, prev.streakFreezePasses - 1),
    }));
  }, []);

  const contextValue = useMemo<GamificationContextType>(
    () => ({
      xpTotal: state.xpTotal,
      activityLog: state.activityLog,
      streakFreezePasses: state.streakFreezePasses,
      currentStreak: streakResult.currentStreak,
      longestStreak: streakResult.longestStreak,
      totalActiveDays: streakResult.totalActiveDays,
      streakResult,
      addXP,
      logActivity,
      consumeStreakFreeze,
    }),
    [state.xpTotal, state.activityLog, state.streakFreezePasses, streakResult, addXP, logActivity, consumeStreakFreeze]
  );

  return (
    <GamificationContext.Provider value={contextValue}>
      {children}
    </GamificationContext.Provider>
  );
};

export function useGamification(): GamificationContextType {
  const context = useContext(GamificationContext);
  if (!context) {
    throw new Error("useGamification must be used within a GamificationProvider");
  }
  return context;
}
