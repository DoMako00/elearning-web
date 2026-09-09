export interface ScheduleItem {
  id: string;
  day: string;
  time: string;
  type: "Office Hours" | "Course Meetings" | "Student Consultations" | "Research Supervision";
  location?: string;
  maxSlots?: number;
  availableSlots?: number;
}

export interface CourseTaught {
  id: string;
  title: string;
  category: string;
  type: "Core subject" | "Elective" | "Advanced";
  studentsCount: number;
  progressPercentage: number;
  imageSrc: string;
  rating?: number;
  route?: string;
}

export interface StudentReview {
  id: string;
  studentName: string;
  studentRole: string;
  studentAvatar: string;
  rating: number;
  date: string;
  quote: string;
}

export interface Achievement {
  id: string;
  title: string;
  organization: string;
  year: number;
  type: "fellowship" | "award" | "certificate";
}

export interface ResearchPublication {
  id: string;
  title: string;
  journal: string;
  year: number;
  linkUrl?: string;
  doi?: string;
}

export interface InstructorStats {
  coursesTaught: number;
  studentsMentored: number;
  publishedResources: number;
  averageRating: number;
  yearsTeaching: string;
  responseRate: number;
  studentCompletion: number;
}

export interface InstructorProfile {
  id: string;
  name: string;
  title: string;
  department: string;
  institution: string;
  yearsOfExperience: string;
  medicalSpecialization: string;
  location: string;
  email: string;
  phone: string;
  officeLocation: string;
  officeHours: string;
  bioSummary: string;
  detailedBio: string;
  inspirationalQuote: string;
  joinDate: string;
  linkedin: string;
  avatarUrl: string;
  bannerArtworkUrl: string;
  isVerified: boolean;
  specialties: string[];
  stats: InstructorStats;
  schedule: ScheduleItem[];
  coursesTaught: CourseTaught[];
  reviews: StudentReview[];
  achievements: Achievement[];
  publications: ResearchPublication[];
}
