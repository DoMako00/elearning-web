export type SettingsTabId =
  | "profile"
  | "account"
  | "security"
  | "devices"
  | "notifications"
  | "privacy"
  | "appearance";

export interface StudentProfileData {
  fullName: string;
  studentId: string;
  email: string;
  phoneCountryCode: string;
  phoneCountryFlag: string;
  phoneNumber: string;
  university: string;
  academicYear: string;
  major: string;
  avatarUrl: string;
}

export interface DeviceSession {
  id: string;
  name: string;
  os: string;
  browser: string;
  location: string;
  ipAddress: string;
  lastActive: string;
  isCurrent: boolean;
  deviceType: "desktop" | "mobile" | "tablet";
}

export interface SubscriptionPlan {
  name: string;
  status: "Active" | "Expired" | "Pending";
  seats: number;
  duration: string;
  renewDate: string;
  planType: "individual" | "friends" | "enterprise";
}

export interface PaymentMethod {
  id: string;
  brand: "visa" | "mastercard" | "amex";
  last4: string;
  expMonth: number;
  expYear: number;
  isDefault: boolean;
}

export interface SecuritySettings {
  twoFactorEnabled: boolean;
  recoveryEmail: string;
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
}

export interface LearningAlerts {
  assignmentDeadlines: boolean;
  lessonReminders: boolean;
  dailyStreakWarnings: boolean;
}

export interface SocialCommunityAlerts {
  directMessages: boolean;
  mentionsInCommunity: boolean;
  repliesToPosts: boolean;
}

export interface SystemAlerts {
  securityAlerts: boolean;
  billingUpdates: boolean;
}

export interface NotificationPreferences {
  learningAlerts: LearningAlerts;
  socialCommunity: SocialCommunityAlerts;
  systemAlerts: SystemAlerts;
}

export interface PrivacyPreferences {
  profileVisibility: "public" | "students" | "private";
  showOnlineStatus: boolean;
  allowTelemetry: boolean;
  allowPersonalization: boolean;
}

export interface AppearancePreferences {
  theme: "system" | "light" | "dark";
  reduceMotion: boolean;
  fontSize: "standard" | "large" | "extraLarge";
}
