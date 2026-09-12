import type {
  UserProfileData,
  EnrolledCourseItem,
  GoalItem,
  UpcomingEventItem,
  RecentActivityItem,
  CertificateItem,
  SavedItem,
  MilestoneBadgeItem,
  SubjectStudyDistribution,
  LearningTrendPoint,
  ProfileAnalyticsStats,
} from "../types/profile.types";
import anatomyImage from "../../../Assets/dashboard/human-anatomy.webp";
import physiologyImage from "../../../Assets/dashboard/medical-physiology.webp";
import histologyImage from "../../../Assets/dashboard/histology-basics.webp";
import biochemistryImage from "../../../Assets/dashboard/biochemistry-essentials.webp";

export const initialUserProfile: UserProfileData = {
  id: "juliana-silva-01",
  name: "Juliana Mohammed",
  avatarUrl: "https://i.pravatar.cc/112?img=47",
  role: "Medical Student",
  specialty: "Medical Student",
  institution: "BUC School of Medicine",
  bio: "Passionate about learning the human body and building a strong foundation for my future in medicine. 🌱",
  location: "Cairo, Egypt",
  joinedDate: "Jan 2024",
  xp: 2450,
  level: 8,
  rankTitle: "Clinical Resident Tier II",
  nextLevelXp: 3000,
  interests: [
    "Anatomy",
    "Physiology",
    "Pathology",
    "Neuroanatomy",
    "Clinical Skills",
    "Medical Research",
  ],
};

export const enrolledCoursesMock: EnrolledCourseItem[] = [
  {
    id: "course-anatomy-1",
    title: "Human Anatomy I",
    progressPercentage: 69,
    image: anatomyImage,
    route: "/my-courses/human-anatomy-i",
  },
  {
    id: "course-physio-1",
    title: "Medical Physiology",
    progressPercentage: 40,
    image: physiologyImage,
    route: "/my-courses",
  },
];

export const myGoalsMock: GoalItem[] = [
  { id: "goal-1", title: "Master Human Anatomy", completed: false },
  { id: "goal-2", title: "Prepare for clinical rotations", completed: false },
  { id: "goal-3", title: "Maintain a consistent study routine", completed: false },
  { id: "goal-4", title: "Get certified in key courses", completed: false },
];

export const upcomingEventsMock: UpcomingEventItem[] = [
  {
    id: "event-1",
    title: "Upper Limb Clinical Case Review",
    dateStr: "Due Aug 29, 2026 • 11:59 PM",
    type: "assignment",
    actionLabel: "Submit",
    actionRoute: "/assignments",
  },
  {
    id: "event-2",
    title: "Live Study Session: Neuroanatomy",
    dateStr: "Tomorrow • 4:00 PM",
    type: "session",
    actionLabel: "Join",
    actionRoute: "/calendar",
  },
];

export const recentActivitiesMock: RecentActivityItem[] = [
  {
    id: "act-1",
    title: 'Completed a quiz',
    detail: '"Upper Limb Nerves"',
    timeAgo: "2 days ago",
    type: "quiz",
  },
  {
    id: "act-2",
    title: 'Submitted an assignment',
    detail: '"Nerve Injuries Case Review"',
    timeAgo: "3 days ago",
    type: "assignment",
  },
  {
    id: "act-3",
    title: 'Earned a certificate',
    detail: '"Medical Terminology Basics"',
    timeAgo: "1 week ago",
    type: "certificate",
  },
];

export const milestoneBadgesMock: MilestoneBadgeItem[] = [
  {
    id: "badge-streak-7",
    title: "7-Day Streak Warrior",
    description: "Maintained a continuous 7-day active study streak.",
    category: "streak",
    tier: "bronze",
    earned: true,
    earnedDate: "Aug 2026",
    iconName: "Flame",
  },
  {
    id: "badge-anatomy-master",
    title: "Anatomy Master",
    description: "Completed all 14 dissection lab modules with 90%+ score.",
    category: "mastery",
    tier: "gold",
    earned: true,
    earnedDate: "Jul 2026",
    iconName: "Award",
  },
  {
    id: "badge-streak-30",
    title: "30-Day Scholar",
    description: "Achieve a continuous 30-day streak in medical courses.",
    category: "streak",
    tier: "silver",
    earned: false,
    progressCurrent: 14,
    progressTarget: 30,
    iconName: "Zap",
  },
  {
    id: "badge-histology-pro",
    title: "Histology Virtuoso",
    description: "Identify 100 microscopic tissue slides without hints.",
    category: "academic",
    tier: "silver",
    earned: true,
    earnedDate: "Jun 2026",
    iconName: "Microscope",
  },
  {
    id: "badge-quiz-ace",
    title: "Quiz Ace",
    description: "Score 100% on 10 consecutive clinical evaluations.",
    category: "academic",
    tier: "gold",
    earned: false,
    progressCurrent: 8,
    progressTarget: 10,
    iconName: "CheckCircle2",
  },
  {
    id: "badge-early-bird",
    title: "Clinical Rotation Pioneer",
    description: "Complete all first-year pre-clinical requirements early.",
    category: "mastery",
    tier: "diamond",
    earned: false,
    progressCurrent: 75,
    progressTarget: 100,
    iconName: "Sparkles",
  },
];

export const certificatesMock: CertificateItem[] = [
  {
    id: "cert-01",
    courseTitle: "Medical Terminology & Clinical Latin Basics",
    instructorName: "Dr. Alexander Ross, MD, FACS",
    issueDate: "August 14, 2026",
    credentialId: "GL-CERT-2026-MED-9941",
    grade: "Grade A+ (98%)",
    skills: ["Medical Terminology", "Clinical Documentation", "Anatomical Nomenclature"],
    pdfUrl: "#",
    verifyUrl: "https://greenlearn.org/verify/GL-CERT-2026-MED-9941",
    imageThumbnail: anatomyImage,
  },
  {
    id: "cert-02",
    courseTitle: "Histology & Tissue Cytology Essentials",
    instructorName: "Prof. Elena Rostova, PhD",
    issueDate: "June 28, 2026",
    credentialId: "GL-CERT-2026-HIST-8412",
    grade: "Grade A (94%)",
    skills: ["Staining Protocols", "Epithelial Tissue Analysis", "Microscopy"],
    pdfUrl: "#",
    verifyUrl: "https://greenlearn.org/verify/GL-CERT-2026-HIST-8412",
    imageThumbnail: histologyImage,
  },
  {
    id: "cert-03",
    courseTitle: "Foundations of Human Biochemical Pathways",
    instructorName: "Dr. Marcus Vance, MD",
    issueDate: "May 10, 2026",
    credentialId: "GL-CERT-2026-BIO-3190",
    grade: "Grade A- (91%)",
    skills: ["Enzyme Kinetics", "Metabolic Pathways", "Clinical Genetics"],
    pdfUrl: "#",
    verifyUrl: "https://greenlearn.org/verify/GL-CERT-2026-BIO-3190",
    imageThumbnail: biochemistryImage,
  },
];

export const savedItemsMock: SavedItem[] = [
  {
    id: "saved-1",
    title: "Human Anatomy I: Musculoskeletal System",
    subtitle: "Complete course module with 14 interactive video lectures & 3D models",
    category: "courses",
    dateSaved: "Saved 2 days ago",
    readTimeOrDuration: "6.5 hrs total",
    tags: ["Anatomy", "Core"],
    route: "/my-courses/human-anatomy-i",
    thumbnail: anatomyImage,
  },
  {
    id: "saved-2",
    title: "Brachial Plexus Topography & Innervation Traps",
    subtitle: "High-yield breakdown of cords, trunks, and peripheral nerve pathways",
    category: "lessons",
    dateSaved: "Saved 3 days ago",
    readTimeOrDuration: "24 min video",
    tags: ["Nerves", "High-Yield"],
    route: "/my-courses/human-anatomy-i/lessons/human-anatomy-i-lesson-1",
    thumbnail: anatomyImage,
  },
  {
    id: "saved-3",
    title: "Cardiac Cycle & Hemodynamics Lecture Notes (PDF)",
    subtitle: "Annotated summary with Wiggers diagrams, heart sounds, and pressure curves",
    category: "notes",
    dateSaved: "Saved 5 days ago",
    readTimeOrDuration: "14 pages • 3.2 MB",
    tags: ["Physiology", "PDF Guide"],
    route: "#",
    thumbnail: physiologyImage,
  },
  {
    id: "saved-4",
    title: "Histopathology of Chronic Granulomatous Diseases",
    subtitle: "Microscope slide atlas with differential diagnosis flashcards",
    category: "notes",
    dateSaved: "Saved 1 week ago",
    readTimeOrDuration: "8 pages • 5.1 MB",
    tags: ["Histology", "Pathology"],
    route: "#",
    thumbnail: histologyImage,
  },
  {
    id: "saved-5",
    title: "How do you memorize the cranial nerve exit foramina effectively?",
    subtitle: "Community Discussion • 42 replies • Top mnemonics & clinical correlations",
    category: "threads",
    dateSaved: "Saved Aug 18, 2026",
    meta: "Started by @Sarah_Med27",
    tags: ["Community", "Mnemonics"],
    route: "#",
  },
  {
    id: "saved-6",
    title: "ECG Interpretation: Rate, Rhythm, Axis, and Infarction Patterns",
    subtitle: "Step-by-step masterclass video with clinical emergency scenarios",
    category: "lessons",
    dateSaved: "Saved Aug 15, 2026",
    readTimeOrDuration: "42 min video",
    tags: ["Cardiology", "ECG"],
    route: "#",
    thumbnail: physiologyImage,
  },
];

export const studyDistributionMock: SubjectStudyDistribution[] = [
  { subject: "Human Anatomy", hours: 38.5, color: "#10B981", percentage: 42 },
  { subject: "Medical Physiology", hours: 26.0, color: "#059669", percentage: 28 },
  { subject: "Histology & Pathology", hours: 16.5, color: "#34D399", percentage: 18 },
  { subject: "Biochemistry", hours: 11.0, color: "#6EE7B7", percentage: 12 },
];

export const learningTrendsMock: LearningTrendPoint[] = [
  { period: "Week 1", currentHours: 9.5, previousHours: 7.0, completionVelocity: 82 },
  { period: "Week 2", currentHours: 12.0, previousHours: 8.5, completionVelocity: 88 },
  { period: "Week 3", currentHours: 11.2, previousHours: 10.0, completionVelocity: 91 },
  { period: "Week 4", currentHours: 14.5, previousHours: 11.0, completionVelocity: 94 },
  { period: "Week 5", currentHours: 13.8, previousHours: 12.5, completionVelocity: 93 },
  { period: "Week 6 (Current)", currentHours: 15.2, previousHours: 12.0, completionVelocity: 96 },
];

export const profileAnalyticsStatsMock: ProfileAnalyticsStats = {
  averageQuizAccuracy: 94,
  totalVideoWatchHours: 92.4,
  completedAssignments: 31,
  totalQuestionsAnswered: 580,
  weeklyStreakDays: 14,
  bestStreakRecord: 21,
  streakFreezePassesRemaining: 2,
  weeklyTargetHours: 12,
  weeklyCompletedHours: 9.5,
};
