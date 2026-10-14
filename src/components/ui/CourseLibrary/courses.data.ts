import {
  Activity,
  Bone,
  FlaskConical,
  HeartPulse,
  Microscope,
  Stethoscope,
  type LucideIcon,
} from "lucide-react";
import anatomyOverlay from "../../../Assets/dashboard/my-courses-anatomy-overlay.webp";
import histologyOverlay from "../../../Assets/dashboard/histology-basics.webp";
import physiologyOverlay from "../../../Assets/dashboard/medical-physiology.webp";
import biochemistryOverlay from "../../../Assets/dashboard/biochemistry-essentials.webp";
import embryologyOverlay from "../../../Assets/dashboard/embryology-foundations.webp";
import anatomyImage from "../../../Assets/course-library/human-anatomy.webp";
import biochemistryImage from "../../../Assets/course-library/biochemistry-essentials.webp";
import histologyImage from "../../../Assets/course-library/histology-basics.webp";
import physiologyImage from "../../../Assets/course-library/medical-physiology.webp";

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

export interface CourseVisualPreset {
  readonly category: string;
  readonly categoryId: string;
  readonly keywords: readonly string[];
  readonly art: string;
  readonly image: string;
  readonly heroOverlay: string;
  readonly Icon: LucideIcon;
}

export const COURSE_CATEGORY_TABS: CourseCategoryTab[] = [
  { id: "all", label: "All" },
  { id: "anatomy", label: "Anatomy", icon: Stethoscope },
  { id: "histology", label: "Histology", icon: Microscope },
  { id: "physiology", label: "Physiology", icon: HeartPulse },
  { id: "biochemistry", label: "Biochemistry", icon: FlaskConical },
  { id: "embryology", label: "Embryology", icon: Activity },
];

// These are presentation assets only. Course names, progress, lesson counts,
// enrollment state, and instructors always come from the authenticated API.
export const COURSE_VISUAL_PRESETS: readonly CourseVisualPreset[] = [
  { category: "Anatomy", categoryId: "anatomy", keywords: ["anatomy", "basics"], art: "anatomy", image: anatomyImage, heroOverlay: anatomyOverlay, Icon: Bone },
  { category: "Histology", categoryId: "histology", keywords: ["histology", "genetic", "cellular"], art: "histology", image: histologyImage, heroOverlay: histologyOverlay, Icon: Microscope },
  { category: "Physiology", categoryId: "physiology", keywords: ["physiology"], art: "physiology", image: physiologyImage, heroOverlay: physiologyOverlay, Icon: HeartPulse },
  { category: "Biochemistry", categoryId: "biochemistry", keywords: ["biochemistry", "biochem"], art: "biochemistry", image: biochemistryImage, heroOverlay: biochemistryOverlay, Icon: FlaskConical },
  { category: "Embryology", categoryId: "embryology", keywords: ["embryology"], art: "embryology", image: anatomyImage, heroOverlay: embryologyOverlay, Icon: Activity },
];
