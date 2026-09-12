import type {
  StudentProfileData,
  DeviceSession,
  SubscriptionPlan,
  PaymentMethod,
  SecuritySettings,
  NotificationPreferences,
  PrivacyPreferences,
  AppearancePreferences,
} from "../../../types/settings";

export const INITIAL_PROFILE_DATA: StudentProfileData = {
  fullName: "Juliana Ahmed",
  studentId: "2024-10567",
  email: "juliana.ahmed@student.edu",
  phoneCountryCode: "+20",
  phoneCountryFlag: "🇪🇬",
  phoneNumber: "112 345 6789",
  university: "Cairo University",
  academicYear: "Year 3",
  major: "Medicine",
  avatarUrl: "https://i.pravatar.cc/160?img=47",
};

export const INITIAL_DEVICES: DeviceSession[] = [
  {
    id: "dev-1",
    name: "Windows PC",
    os: "Windows 11",
    browser: "Chrome",
    location: "Cairo, Egypt",
    ipAddress: "197.35.120.45",
    lastActive: "Now",
    isCurrent: true,
    deviceType: "desktop",
  },
  {
    id: "dev-2",
    name: "iPhone 14",
    os: "iOS 17.5",
    browser: "Safari",
    location: "Cairo, Egypt",
    ipAddress: "156.204.88.19",
    lastActive: "Yesterday at 9:42 PM",
    isCurrent: false,
    deviceType: "mobile",
  },
  {
    id: "dev-3",
    name: "MacBook Pro",
    os: "macOS Sonoma",
    browser: "Edge",
    location: "Giza, Egypt",
    ipAddress: "197.35.120.89",
    lastActive: "3 days ago",
    isCurrent: false,
    deviceType: "desktop",
  },
];

export const INITIAL_SUBSCRIPTION: SubscriptionPlan = {
  name: "Individual Plan",
  status: "Active",
  seats: 1,
  duration: "3 months",
  renewDate: "Sep 30, 2026",
  planType: "individual",
};

export const INITIAL_PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: "pm-1",
    brand: "visa",
    last4: "4242",
    expMonth: 12,
    expYear: 2028,
    isDefault: true,
  },
];

export const INITIAL_SECURITY: SecuritySettings = {
  twoFactorEnabled: false,
  recoveryEmail: "recovery.juliana@gmail.com",
};

export const INITIAL_NOTIFICATIONS: NotificationPreferences = {
  learningAlerts: {
    assignmentDeadlines: true,
    lessonReminders: true,
    dailyStreakWarnings: true,
  },
  socialCommunity: {
    directMessages: true,
    mentionsInCommunity: true,
    repliesToPosts: false,
  },
  systemAlerts: {
    securityAlerts: true,
    billingUpdates: true,
  },
};

export const INITIAL_PRIVACY: PrivacyPreferences = {
  profileVisibility: "students",
  showOnlineStatus: true,
  allowTelemetry: true,
  allowPersonalization: false,
};

export const INITIAL_APPEARANCE: AppearancePreferences = {
  theme: "light",
  reduceMotion: false,
  fontSize: "standard",
};

export const UNIVERSITIES = [
  "Cairo University",
  "Ain Shams University",
  "Alexandria University",
  "Mansoura University",
  "Assiut University",
];

export const ACADEMIC_YEARS = [
  "Year 1",
  "Year 2",
  "Year 3",
  "Year 4",
  "Year 5",
  "Internship Year",
];

export const MAJORS = [
  "Medicine",
  "Dentistry",
  "Pharmacy",
  "Nursing",
  "Physical Therapy",
  "Biomedical Engineering",
];

export const COUNTRY_CODES = [
  { code: "+20", country: "Egypt", flag: "🇪🇬" },
  { code: "+966", country: "Saudi Arabia", flag: "🇸🇦" },
  { code: "+971", country: "United Arab Emirates", flag: "🇦🇪" },
  { code: "+1", country: "United States", flag: "🇺🇸" },
  { code: "+44", country: "United Kingdom", flag: "🇬🇧" },
];
