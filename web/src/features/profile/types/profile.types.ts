export type ProfileTabId =
  | "overview"
  | "achievements"
  | "saved"
  | "activity"
  | "settings";

export interface UserProfileData {
  id: string;
  name: string;
  avatarUrl: string;
  coverUrl?: string;
  role: string;
  specialty: string;
  institution: string;
  bio: string;
  location: string;
  joinedDate: string;
  xp: number;
  level: number;
  rankTitle: string;
  nextLevelXp: number;
  interests: string[];
}

export interface EnrolledCourseItem {
  id: string;
  title: string;
  progressPercentage: number;
  image: string;
  route: string;
}

export interface GoalItem {
  id: string;
  title: string;
  completed: boolean;
}

export interface UpcomingEventItem {
  id: string;
  title: string;
  dateStr: string;
  type: "assignment" | "session" | "quiz";
  actionLabel: string;
  actionRoute?: string;
}

export interface RecentActivityItem {
  id: string;
  title: string;
  detail: string;
  timeAgo: string;
  type: "quiz" | "assignment" | "certificate" | "lesson";
}

export interface CertificateItem {
  id: string;
  courseTitle: string;
  instructorName: string;
  issueDate: string;
  credentialId: string;
  grade: string;
  skills: string[];
  pdfUrl: string;
  verifyUrl: string;
  imageThumbnail: string;
}

export type SavedCategory = "courses" | "lessons" | "notes" | "threads";

export interface SavedItem {
  id: string;
  title: string;
  subtitle: string;
  category: SavedCategory;
  dateSaved: string;
  readTimeOrDuration?: string;
  tags?: string[];
  route: string;
  thumbnail?: string;
  meta?: string;
}

export interface MilestoneBadgeItem {
  id: string;
  title: string;
  description: string;
  category: "streak" | "academic" | "engagement" | "mastery";
  tier: "bronze" | "silver" | "gold" | "diamond";
  earned: boolean;
  earnedDate?: string;
  progressCurrent?: number;
  progressTarget?: number;
  iconName: string;
}

export interface SubjectStudyDistribution {
  subject: string;
  hours: number;
  color: string;
  percentage: number;
}

export interface LearningTrendPoint {
  period: string;
  currentHours: number;
  previousHours: number;
  completionVelocity: number; // % rate
}

export interface ProfileAnalyticsStats {
  averageQuizAccuracy: number; // e.g. 92%
  totalVideoWatchHours: number; // e.g. 84.5 hrs
  completedAssignments: number; // e.g. 28
  totalQuestionsAnswered: number; // e.g. 450
  weeklyStreakDays: number;
  bestStreakRecord: number;
  streakFreezePassesRemaining: number;
  weeklyTargetHours: number;
  weeklyCompletedHours: number;
}
