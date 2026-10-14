import React, { createContext, useContext, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import type { StreakResult } from "../../shared/utils/streakEngine";
import { useAuth } from "./AuthProvider";
import { studentLearningApi } from "../../features/student/api/studentLearningApi";

export interface ActivityEvent {
  id: string;
  type: "video_watch" | "quiz_complete" | "lesson_complete" | "assignment_submit";
  timestamp: string;
  xpAwarded?: number;
  metadata?: Record<string, unknown>;
}

export interface GamificationState {
  xpTotal: number;
  activityLog: ActivityEvent[];
  streakFreezePasses: number;
}

export interface GamificationContextType extends GamificationState {
  currentStreak: number | null;
  longestStreak: number | null;
  totalActiveDays: number | null;
  streakResult: StreakResult | null;
  addXP: (amount: number, activityType: ActivityEvent["type"], metadata?: Record<string, unknown>) => void;
  logActivity: (event: Omit<ActivityEvent, "id" | "timestamp">) => void;
  consumeStreakFreeze: () => void;
}

export const GamificationContext = createContext<GamificationContextType | null>(null);

const noOp = () => undefined;

/**
 * Learning activity is read from persisted progress. XP and streak-freeze mechanics
 * are not part of the current product contract, so no browser-local business state
 * is created and the old demo reward actions cannot change production totals.
 */
export const GamificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const auth = useAuth();
  const progress = useQuery({
    queryKey: ["student", "learning", "progress"],
    queryFn: ({ signal }) => studentLearningApi.getProgress(signal),
    enabled: auth.status === "authenticated",
  });
  const snapshot = progress.data;
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "UTC" }).format(new Date());
  const dayRows = snapshot?.weekDays ?? [];
  const currentStreak = snapshot?.currentStreakDays ?? null;
  const longestStreak = snapshot?.longestStreakDays ?? null;
  const totalActiveDays = snapshot?.totalActiveDays ?? null;
  const streakResult = useMemo<StreakResult | null>(() => snapshot ? ({
    currentStreak: snapshot.currentStreakDays,
    longestStreak: snapshot.longestStreakDays,
    totalActiveDays: snapshot.totalActiveDays,
    freezePassesRemaining: 0,
    streakPreservedByFreeze: false,
    lastActiveDate: [...dayRows].reverse().find((day) => day.completedLessons > 0)?.date ?? null,
    isActiveToday: dayRows.some((day) => day.date === today && day.completedLessons > 0),
  }) : null, [dayRows, snapshot, today]);

  const value = useMemo<GamificationContextType>(() => ({
    xpTotal: 0,
    activityLog: [],
    streakFreezePasses: 0,
    currentStreak,
    longestStreak,
    totalActiveDays,
    streakResult,
    addXP: noOp,
    logActivity: noOp,
    consumeStreakFreeze: noOp,
  }), [currentStreak, longestStreak, totalActiveDays, streakResult]);

  return <GamificationContext.Provider value={value}>{children}</GamificationContext.Provider>;
};

export function useGamification(): GamificationContextType {
  const context = useContext(GamificationContext);
  if (!context) throw new Error("useGamification must be used within a GamificationProvider");
  return context;
}
