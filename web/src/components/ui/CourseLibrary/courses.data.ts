import {
  Activity,
  Bone,
  FlaskConical,
  HeartPulse,
  Microscope,
  Stethoscope,
  type LucideIcon,
} from "lucide-react";
import anatomyOverlay from "../../../Assets/dashboard/my-courses-anatomy-overlay.png";
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
  progress: number;
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
  };
  summary: string;
  slug: string;
}

export interface CourseCategoryTab {
  id: string;
  label: string;
  icon?: LucideIcon;
}

export const COURSE_CATEGORY_TABS: CourseCategoryTab[] = [
  { id: "all", label: "All" },
  { id: "anatomy", label: "Anatomy", icon: Stethoscope },
  { id: "histology", label: "Histology", icon: Microscope },
  { id: "physiology", label: "Physiology", icon: HeartPulse },
  { id: "biochemistry", label: "Biochemistry", icon: FlaskConical },
  { id: "embryology", label: "Embryology", icon: Activity },
];

export const INITIAL_COURSES: StudentCourse[] = [
  {
    id: "course-1",
    title: "Human Anatomy I",
    subtitle: "Structure & Organization",
    category: "Anatomy",
    categoryId: "anatomy",
    level: "Intermediate",
    progress: 60,
    lessonText: "Lesson 6 of 12",
    completedLessons: 6,
    totalLessons: 12,
    opened: "Last opened today",
    art: "anatomy",
    image: anatomyImage,
    heroOverlay: anatomyOverlay,
    Icon: Bone,
    status: "in-progress",
    instructor: {
      initials: "AH",
      name: "Dr. Ahmed Hassan",
      role: "Professor of Anatomy",
    },
    summary: "Foundations of the human body",
    slug: "human-anatomy-i",
  },
  {
    id: "course-2",
    title: "Histology Basics",
    subtitle: "Tissues of the Human Body",
    category: "Histology",
    categoryId: "histology",
    level: "Beginner",
    progress: 35,
    lessonText: "Lesson 3 of 8",
    completedLessons: 3,
    totalLessons: 8,
    opened: "Last opened 3 days ago",
    art: "histology",
    image: histologyImage,
    heroOverlay: histologyOverlay,
    Icon: Microscope,
    status: "in-progress",
    instructor: {
      initials: "SA",
      name: "Dr. Sara Al-Mansoor",
      role: "Lead Histopathologist",
    },
    summary: "Microscopic structures & tissue types",
    slug: "human-anatomy-i",
  },
  {
    id: "course-3",
    title: "Medical Physiology",
    subtitle: "Body Functions & Regulation",
    category: "Physiology",
    categoryId: "physiology",
    level: "Intermediate",
    progress: 25,
    lessonText: "Lesson 4 of 16",
    completedLessons: 4,
    totalLessons: 16,
    opened: "Last opened 5 days ago",
    art: "physiology",
    image: physiologyImage,
    heroOverlay: physiologyOverlay,
    Icon: HeartPulse,
    status: "in-progress",
    instructor: {
      initials: "MK",
      name: "Dr. Mahmoud Khalil",
      role: "Physiology Specialist",
    },
    summary: "Homeostasis and vital systems",
    slug: "human-anatomy-i",
  },
  {
    id: "course-4",
    title: "Biochemistry Essentials",
    subtitle: "Molecules of Life",
    category: "Biochemistry",
    categoryId: "biochemistry",
    level: "Advanced",
    progress: 18,
    lessonText: "Lesson 2 of 10",
    completedLessons: 2,
    totalLessons: 10,
    opened: "Last opened 1 week ago",
    art: "biochemistry",
    image: biochemistryImage,
    heroOverlay: biochemistryOverlay,
    Icon: FlaskConical,
    status: "in-progress",
    instructor: {
      initials: "NR",
      name: "Dr. Nour Radwan",
      role: "Biochemistry Lecturer",
    },
    summary: "Metabolic pathways and enzyme kinetics",
    slug: "human-anatomy-i",
  },
  {
    id: "course-5",
    title: "Embryology Foundations",
    subtitle: "Development of Human Life",
    category: "Embryology",
    categoryId: "embryology",
    level: "Beginner",
    progress: 100,
    lessonText: "Completed (8 of 8)",
    completedLessons: 8,
    totalLessons: 8,
    opened: "Completed 2 weeks ago",
    art: "physiology",
    image: physiologyImage,
    heroOverlay: embryologyOverlay,
    Icon: Activity,
    status: "completed",
    instructor: {
      initials: "AH",
      name: "Dr. Ahmed Hassan",
      role: "Professor of Anatomy",
    },
    summary: "Embryonic stages and organogenesis",
    slug: "human-anatomy-i",
  },
  {
    id: "course-6",
    title: "Cell Biology & Genetics",
    subtitle: "Molecular Mechanisms",
    category: "Histology",
    categoryId: "histology",
    level: "Intermediate",
    progress: 100,
    lessonText: "Completed (10 of 10)",
    completedLessons: 10,
    totalLessons: 10,
    opened: "Completed last month",
    art: "histology",
    image: histologyImage,
    heroOverlay: histologyOverlay,
    Icon: Microscope,
    status: "completed",
    instructor: {
      initials: "SA",
      name: "Dr. Sara Al-Mansoor",
      role: "Lead Histopathologist",
    },
    summary: "Cellular structure and gene regulation",
    slug: "human-anatomy-i",
  },
];
