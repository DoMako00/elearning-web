/**
 * Student Feature Public API (Modular Monolith)
 *
 * Exposes all student domain operations, components, hooks, and types
 * through a single, clean module boundary.
 */

// Student API
export * from "./api/studentCoursesApi";

// Student Hooks
export { useDashboardEnrollment } from "./hooks/useDashboardEnrollment";
export type {
  DashboardEnrollment,
  DashboardEnrollmentViewModel,
} from "./hooks/useDashboardEnrollment";

// Student Domain Components
export { DashboardBento } from "./components/DashboardBento";
export { WeeklyGoalCard } from "./components/WeeklyGoalCard";
export { YourStreak } from "./components/YourStreak";
export { default as ContinueLearning } from "./components/Continue_Learning/continue_learning";
export { MyProgress } from "./components/MyProgress";
export { Upcoming } from "./components/Upcoming";
export { AILearningGuide } from "./components/AILearningGuide";
export { CourseLibrary } from "./components/CourseLibrary";
export { EmptyLearningState } from "./components/EmptyLearningState";
export { RecommendedCourses } from "./components/RecommendedCourses";
export { StreakAnalytics } from "./components/StreakAnalytics";
export { XPRewardModal, useXPRewards } from "./components/XPRewards";
export { InactivityModal, useInactivityPrompt } from "./components/InactivityPrompt";

// Student Pages
export { HomePage } from "./pages/HomePage";
export { MyCoursesPage } from "./pages/MyCoursesPage";
export { CourseOverviewPage } from "./pages/CourseOverviewPage";
export { LessonPlayerPage } from "./pages/LessonPlayerPage";
export { ExplorePage } from "./pages/ExplorePage";
export { CalendarPage } from "./pages/CalendarPage";
export { AssignmentsPage } from "./pages/AssignmentsPage";
export { MessagesPage } from "./pages/MessagesPage";
export { CommunityPage } from "./pages/CommunityPage";
export { HelpCenterPage } from "./pages/HelpCenterPage";
export { SettingsPage } from "./pages/SettingsPage";
export { ProfilePage } from "./pages/ProfilePage";
export { InstructorProfilePage } from "./pages/InstructorProfilePage";
export { StudentLayout } from "./pages/StudentLayout";
