import { useCallback, useMemo, useState } from "react";
import { useAuth } from "../../../app/providers/AuthProvider";
import { useDashboardEnrollment } from "../../student/hooks/useDashboardEnrollment";
import { useStudentCalendar } from "../../student/api/useStudentCalendar";
import {
  useStudentLearningPreferences,
  useStudentProfile,
  useStudentProgress,
  useStudentAchievementAwards,
  useStudentCertificates,
  useStudentSavedCourses,
  useToggleStudentSavedCourse,
} from "../../student/api/useStudentLearning";
import type {
  ProfileTabId,
  UserProfileData,
  SavedCategory,
  SavedItem,
  EnrolledCourseItem,
  GoalItem,
  UpcomingEventItem,
  RecentActivityItem,
  ProfileAnalyticsStats,
} from "../types/profile.types";

function dateRange() {
  const from = new Date();
  from.setUTCDate(from.getUTCDate() - 7);
  const to = new Date();
  to.setUTCDate(to.getUTCDate() + 90);
  return { from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10) };
}

function relativeTime(value: string): string {
  const elapsed = Math.max(0, Date.now() - new Date(value).getTime());
  const minutes = Math.floor(elapsed / 60_000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export interface UseProfileTabsReturn {
  activeTab: ProfileTabId;
  setActiveTab: (tab: ProfileTabId) => void;
  profile: UserProfileData;
  enrolledCourses: EnrolledCourseItem[];
  goals: GoalItem[];
  toggleGoal: (goalId: string) => void;
  addGoal: (title: string) => void;
  upcomingEvents: UpcomingEventItem[];
  recentActivities: RecentActivityItem[];
  milestoneBadges: import("../types/profile.types").MilestoneBadgeItem[];
  certificates: import("../../student/api/studentLearningApi").StudentCertificateSummaryDto[];
  savedItems: SavedItem[];
  savedCategory: SavedCategory | "all";
  setSavedCategory: (cat: SavedCategory | "all") => void;
  filteredSavedItems: SavedItem[];
  toggleSaveItem: (itemId: string) => void;
  studyDistribution: [];
  learningTrends: [];
  analyticsStats: ProfileAnalyticsStats;
  activityDays: Array<{ date: string; completedLessons: number }>;
  isLoading: boolean;
  error: Error | null;
  retry: () => void;
}

export function useProfileTabs(defaultTab: ProfileTabId = "overview"): UseProfileTabsReturn {
  const auth = useAuth();
  const [activeTab, setActiveTab] = useState<ProfileTabId>(defaultTab);
  const [savedCategory, setSavedCategory] = useState<SavedCategory | "all">("all");
  const profileQuery = useStudentProfile();
  const progressQuery = useStudentProgress();
  const preferencesQuery = useStudentLearningPreferences();
  const awardsQuery = useStudentAchievementAwards();
  const certificatesQuery = useStudentCertificates();
  const savedQuery = useStudentSavedCourses();
  const savedMutation = useToggleStudentSavedCourse();
  const enrollment = useDashboardEnrollment();
  const { from, to } = useMemo(dateRange, []);
  const calendarQuery = useStudentCalendar(from, to);

  const profileDto = profileQuery.data;
  const profile: UserProfileData = useMemo(() => ({
    id: profileDto?.studentProfileId ?? "",
    name: profileDto?.fullName ?? "",
    avatarUrl: "",
    role: "Student",
    specialty: profileDto?.level.title ?? "",
    institution: [profileDto?.brand.name, profileDto?.institution.name, profileDto?.semester.title].filter(Boolean).join(" · "),
    bio: "",
    location: "",
    joinedDate: "",
    xp: null,
    level: null,
    rankTitle: "",
    nextLevelXp: null,
    interests: [],
  }), [profileDto]);

  const enrolledCourses = useMemo(() => {
    const progressByCourse = new Map((progressQuery.data?.courses ?? []).map((item) => [item.courseId, item]));
    return enrollment.courses
      .filter((course) => course.access.isEnrolled)
      .map((course) => ({
        id: course.courseId,
        title: course.title,
        progressPercentage: progressByCourse.get(course.courseId)?.completionPercent ?? 0,
        image: "",
        route: `/my-courses/${encodeURIComponent(course.courseId)}`,
      }));
  }, [enrollment.courses, progressQuery.data]);

  const weeklyGoal = preferencesQuery.data?.weeklyLessonGoal ?? progressQuery.data?.weeklyGoalLessons ?? null;
  const goals: GoalItem[] = weeklyGoal === null ? [] : [{
    id: "weekly-lesson-goal",
    title: `Complete ${weeklyGoal} lessons this week`,
    completed: (progressQuery.data?.weeklyCompletedLessons ?? 0) >= weeklyGoal,
  }];

  const upcomingEvents = useMemo(() => (calendarQuery.data ?? [])
    .filter((event) => event.status === "active" && new Date(event.startsAt).getTime() >= Date.now())
    .slice(0, 4)
    .map((event): UpcomingEventItem => {
      const type = event.type === "assignment" ? "assignment" : event.type === "quiz" || event.type === "exam" ? "quiz" : "session";
      const actionRoute = event.type === "assignment" ? "/assignments" : event.type === "quiz" || event.type === "exam" ? "/assessments" : "/calendar";
      return {
        id: event.id,
        title: event.title,
        dateStr: new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(event.startsAt)),
        type,
        actionLabel: "View",
        actionRoute,
      };
    }), [calendarQuery.data]);

  const recentActivities = useMemo(() => (progressQuery.data?.recentActivity ?? []).slice(0, 5).map((item): RecentActivityItem => ({
    id: `${item.lessonId}:${item.occurredAt}`,
    title: item.status === "completed" ? "Completed a lesson" : "Continued a lesson",
    detail: `${item.courseTitle} · ${item.lessonTitle}`,
    timeAgo: relativeTime(item.occurredAt),
    type: "lesson",
  })), [progressQuery.data]);

  const savedItems: SavedItem[] = useMemo(() => (savedQuery.data ?? []).map((item) => ({
    id: item.courseId,
    title: item.title,
    subtitle: item.code,
    category: "courses",
    dateSaved: `Saved ${new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(item.savedAt))}`,
    tags: [],
    route: `/my-courses/${encodeURIComponent(item.courseId)}`,
  })), [savedQuery.data]);

  const milestoneBadges = useMemo(() => (awardsQuery.data ?? []).map((award) => ({
    id: award.id,
    title: award.title,
    description: award.description,
    category: null,
    tier: null,
    earned: true,
    earnedDate: new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(award.awardedAt)),
    iconName: "award",
  })), [awardsQuery.data]);

  const filteredSavedItems = useMemo(() => savedCategory === "all"
    ? savedItems
    : savedItems.filter((item) => item.category === savedCategory), [savedItems, savedCategory]);

  const toggleSaveItem = useCallback((courseId: string) => {
    return savedMutation.mutateAsync({ courseId, saved: false }).then(() => undefined);
  }, [savedMutation]);
  const noOp = useCallback((_id: string) => undefined, []);
  const noOpText = useCallback((_title: string) => undefined, []);
  const retry = useCallback(() => {
    void Promise.all([profileQuery.refetch(), progressQuery.refetch(), preferencesQuery.refetch(), awardsQuery.refetch(), certificatesQuery.refetch(), savedQuery.refetch(), calendarQuery.refetch()]);
    enrollment.retry();
  }, [profileQuery, progressQuery, preferencesQuery, awardsQuery, certificatesQuery, savedQuery, calendarQuery, enrollment]);

  const errorQuery = [profileQuery, progressQuery, preferencesQuery, awardsQuery, certificatesQuery, savedQuery, calendarQuery].find((query) => query.isError);
  const progress = progressQuery.data;
  const analyticsStats: ProfileAnalyticsStats = {
    averageQuizAccuracy: null,
    totalVideoWatchHours: null,
    completedAssignments: null,
    totalQuestionsAnswered: null,
    currentStreakDays: progress?.currentStreakDays ?? null,
    bestStreakRecord: progress?.longestStreakDays ?? null,
    streakFreezePassesRemaining: null,
    weeklyTargetLessons: weeklyGoal,
    weeklyCompletedLessons: progress?.weeklyCompletedLessons ?? null,
  };

  return {
    activeTab,
    setActiveTab,
    profile,
    enrolledCourses,
    goals,
    toggleGoal: noOp,
    addGoal: noOpText,
    upcomingEvents,
    recentActivities,
    milestoneBadges,
    certificates: certificatesQuery.data ?? [],
    savedItems,
    savedCategory,
    setSavedCategory,
    filteredSavedItems,
    toggleSaveItem,
    studyDistribution: [],
    learningTrends: [],
    analyticsStats,
    activityDays: progress?.weekDays.map((day) => ({ date: day.date, completedLessons: day.completedLessons })) ?? [],
    isLoading: auth.status === "loading" || (auth.status === "authenticated" && (profileQuery.isLoading || progressQuery.isLoading || preferencesQuery.isLoading || awardsQuery.isLoading || certificatesQuery.isLoading || savedQuery.isLoading || calendarQuery.isLoading || enrollment.status === "loading")),
    error: errorQuery?.error instanceof Error ? errorQuery.error : enrollment.status === "error" ? new Error("Courses could not be loaded.") : null,
    retry,
  };
}
