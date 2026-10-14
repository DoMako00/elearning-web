import {
  Activity,
  FlaskConical,
  HeartPulse,
  Microscope,
  Stethoscope,
  type LucideIcon,
} from "lucide-react";

export interface StudentCourse {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  categoryId: string;
  level: string;
  progress: number | null;
  lessonText: string;
  totalLessons: number;
  completedLessons: number;
  opened: string;
  art: string;
  image: string;
  heroOverlay: string;
  Icon: LucideIcon;
  status: "in-progress" | "completed";
  instructor: {
    initials: string;
    name: string;
    role: string;
  } | null;
  summary: string;
  slug: string;
  access?: {
    isEnrolled: boolean;
    canOpen: boolean;
    enrollmentStatus: "active" | "completed" | null;
  };
}

export interface CourseCategoryTab {
  id: string;
  label: string;
  icon?: LucideIcon;
}

// Category tabs are presentation filters only; course records come from the API.
export const COURSE_CATEGORY_TABS: CourseCategoryTab[] = [
  { id: "all", label: "All" },
  { id: "anatomy", label: "Anatomy", icon: Stethoscope },
  { id: "histology", label: "Histology", icon: Microscope },
  { id: "physiology", label: "Physiology", icon: HeartPulse },
  { id: "biochemistry", label: "Biochemistry", icon: FlaskConical },
  { id: "embryology", label: "Embryology", icon: Activity },
];
