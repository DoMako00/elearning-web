export type SettingsTabId =
  | "profile"
  | "account"
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

export interface NotificationPreferences {
  courseUpdates: { email: boolean; push: boolean; sms: boolean };
  assignments: { email: boolean; push: boolean; sms: boolean };
  directMessages: { email: boolean; push: boolean; sms: boolean };
  communityReplies: { email: boolean; push: boolean; sms: boolean };
}

export interface PrivacyPreferences {
  profileVisibility: "public" | "students" | "private";
  showActivityStatus: boolean;
  shareLearningStats: boolean;
  allowDirectMessages: boolean;
}

export interface AppearancePreferences {
  theme: "system" | "light" | "dark";
  highContrast: boolean;
  fontSize: "normal" | "compact" | "large";
}
