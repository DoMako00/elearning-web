import { useState, useCallback, useMemo } from "react";
import type {
  ProfileTabId,
  UserProfileData,
  SavedCategory,
  SavedItem,
} from "../types/profile.types";
import {
  initialUserProfile,
  enrolledCoursesMock,
  myGoalsMock,
  upcomingEventsMock,
  recentActivitiesMock,
  milestoneBadgesMock,
  certificatesMock,
  savedItemsMock,
  studyDistributionMock,
  learningTrendsMock,
  profileAnalyticsStatsMock,
} from "../data/profileMockData";

export interface UseProfileTabsReturn {
  activeTab: ProfileTabId;
  setActiveTab: (tab: ProfileTabId) => void;
  profile: UserProfileData;
  updateProfile: (updates: Partial<UserProfileData>) => void;
  enrolledCourses: typeof enrolledCoursesMock;
  goals: typeof myGoalsMock;
  toggleGoal: (goalId: string) => void;
  addGoal: (title: string) => void;
  upcomingEvents: typeof upcomingEventsMock;
  recentActivities: typeof recentActivitiesMock;
  milestoneBadges: typeof milestoneBadgesMock;
  certificates: typeof certificatesMock;
  savedItems: SavedItem[];
  savedCategory: SavedCategory | "all";
  setSavedCategory: (cat: SavedCategory | "all") => void;
  filteredSavedItems: SavedItem[];
  toggleSaveItem: (itemId: string) => void;
  studyDistribution: typeof studyDistributionMock;
  learningTrends: typeof learningTrendsMock;
  analyticsStats: typeof profileAnalyticsStatsMock;
}

export function useProfileTabs(defaultTab: ProfileTabId = "overview"): UseProfileTabsReturn {
  const [activeTab, setActiveTab] = useState<ProfileTabId>(defaultTab);
  const [profile, setProfile] = useState<UserProfileData>(initialUserProfile);
  const [goals, setGoals] = useState(myGoalsMock);
  const [savedItems, setSavedItems] = useState<SavedItem[]>(savedItemsMock);
  const [savedCategory, setSavedCategory] = useState<SavedCategory | "all">("all");

  const updateProfile = useCallback((updates: Partial<UserProfileData>) => {
    setProfile((prev) => ({ ...prev, ...updates }));
  }, []);

  const toggleGoal = useCallback((goalId: string) => {
    setGoals((prev) =>
      prev.map((g) => (g.id === goalId ? { ...g, completed: !g.completed } : g))
    );
  }, []);

  const addGoal = useCallback((title: string) => {
    if (!title.trim()) return;
    setGoals((prev) => [
      ...prev,
      { id: `goal-${Date.now()}`, title: title.trim(), completed: false },
    ]);
  }, []);

  const toggleSaveItem = useCallback((itemId: string) => {
    setSavedItems((prev) => prev.filter((item) => item.id !== itemId));
  }, []);

  const filteredSavedItems = useMemo(() => {
    if (savedCategory === "all") return savedItems;
    return savedItems.filter((item) => item.category === savedCategory);
  }, [savedItems, savedCategory]);

  return {
    activeTab,
    setActiveTab,
    profile,
    updateProfile,
    enrolledCourses: enrolledCoursesMock,
    goals,
    toggleGoal,
    addGoal,
    upcomingEvents: upcomingEventsMock,
    recentActivities: recentActivitiesMock,
    milestoneBadges: milestoneBadgesMock,
    certificates: certificatesMock,
    savedItems,
    savedCategory,
    setSavedCategory,
    filteredSavedItems,
    toggleSaveItem,
    studyDistribution: studyDistributionMock,
    learningTrends: learningTrendsMock,
    analyticsStats: profileAnalyticsStatsMock,
  };
}
