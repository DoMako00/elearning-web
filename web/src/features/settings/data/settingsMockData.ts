import type {
  StudentProfileData,
  DeviceSession,
  SubscriptionPlan,
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
    name: "iPhone 15 Pro",
    os: "iOS 17.5",
    browser: "Safari Mobile",
    location: "Giza, Egypt",
    ipAddress: "156.204.88.19",
    lastActive: "Yesterday at 9:42 PM",
    isCurrent: false,
    deviceType: "mobile",
  },
  {
    id: "dev-3",
    name: "iPad Air",
    os: "iPadOS 16.4",
    browser: "GreenLearn App",
    location: "Cairo, Egypt",
    ipAddress: "197.35.120.89",
    lastActive: "3 days ago",
    isCurrent: false,
    deviceType: "tablet",
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

export const INITIAL_NOTIFICATIONS: NotificationPreferences = {
  courseUpdates: { email: true, push: true, sms: false },
  assignments: { email: true, push: true, sms: true },
  directMessages: { email: false, push: true, sms: false },
  communityReplies: { email: true, push: false, sms: false },
};

export const INITIAL_PRIVACY: PrivacyPreferences = {
  profileVisibility: "students",
  showActivityStatus: true,
  shareLearningStats: true,
  allowDirectMessages: true,
};

export const INITIAL_APPEARANCE: AppearancePreferences = {
  theme: "light",
  highContrast: false,
  fontSize: "normal",
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
