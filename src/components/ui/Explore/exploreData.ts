import {
  Activity,
  Brain,
  FlaskConical,
  Heart,
  Microscope,
  Stethoscope,
  type LucideIcon,
} from "lucide-react";

export interface HeroPath {
  badge1: string;
  badge2: string;
  title: string;
  description: string;
  level: string;
  rating: number;
  learners: string;
  instructorsCount: string;
  avatars: string[];
}

export interface TrendingItem {
  id: string;
  rank: string;
  title: string;
  level: string;
  duration: string;
  rating: number;
  iconType: "anatomy" | "microscope" | "heart";
  bgClass: string;
}

export interface DirectionItem {
  id: string;
  title: string;
  subtitle: string;
  categoryId: string;
  colorTheme: "green" | "purple" | "blue";
  icon: LucideIcon;
}

export interface CategoryTab {
  id: string;
  label: string;
  icon?: LucideIcon;
}

export interface ExploreCourse {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  categoryId: string;
  level: string;
  duration: string;
  rating: number;
  learners: string;
  artType: "anatomy" | "histology" | "physiology" | "biochemistry" | "neuroscience" | "pharmacology" | "pathology";
}

export const HERO_PATH: HeroPath = {
  badge1: "EDITOR'S PICK",
  badge2: "12-WEEK PATH",
  title: "Master Human Anatomy",
  description:
    "Build a complete understanding of the human body — from skeletal structure to organ systems — for clinical excellence.",
  level: "Intermediate",
  rating: 4.9,
  learners: "18.7k learners",
  instructorsCount: "+8 instructors",
  avatars: [
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80",
  ],
};

export const TRENDING_ITEMS: TrendingItem[] = [
  {
    id: "trending-1",
    rank: "01",
    title: "Human Anatomy I",
    level: "Intermediate",
    duration: "8h",
    rating: 4.8,
    iconType: "anatomy",
    bgClass: "trending-icon--green",
  },
  {
    id: "trending-2",
    rank: "02",
    title: "Histology Basics",
    level: "Beginner",
    duration: "6h",
    rating: 4.9,
    iconType: "microscope",
    bgClass: "trending-icon--purple",
  },
  {
    id: "trending-3",
    rank: "03",
    title: "Medical Physiology",
    level: "Intermediate",
    duration: "10h",
    rating: 4.7,
    iconType: "heart",
    bgClass: "trending-icon--yellow",
  },
];

export const DIRECTION_ITEMS: DirectionItem[] = [
  {
    id: "dir-anatomy",
    title: "Anatomy",
    subtitle: "Structure of the body",
    categoryId: "anatomy",
    colorTheme: "green",
    icon: Stethoscope,
  },
  {
    id: "dir-physiology",
    title: "Physiology",
    subtitle: "How the body works",
    categoryId: "physiology",
    colorTheme: "purple",
    icon: Activity,
  },
  {
    id: "dir-pathology",
    title: "Pathology",
    subtitle: "Disease mechanisms",
    categoryId: "pathology",
    colorTheme: "blue",
    icon: FlaskConical,
  },
];

export const CATEGORY_TABS: CategoryTab[] = [
  { id: "all", label: "All" },
  { id: "anatomy", label: "Anatomy", icon: Stethoscope },
  { id: "physiology", label: "Physiology", icon: Heart },
  { id: "histology", label: "Histology", icon: Microscope },
  { id: "neuroscience", label: "Neuroscience", icon: Brain },
  { id: "pharmacology", label: "Pharmacology", icon: FlaskConical },
];

export const EXPLORE_COURSES: ExploreCourse[] = [
  {
    id: "course-anatomy",
    title: "Human Anatomy I",
    subtitle: "Structure & Organization",
    category: "ANATOMY",
    categoryId: "anatomy",
    level: "Intermediate",
    duration: "8h 30m",
    rating: 4.8,
    learners: "15.2k learners",
    artType: "anatomy",
  },
  {
    id: "course-histology",
    title: "Histology Basics",
    subtitle: "Tissues of the Human Body",
    category: "HISTOLOGY",
    categoryId: "histology",
    level: "Beginner",
    duration: "6h",
    rating: 4.9,
    learners: "22.1k learners",
    artType: "histology",
  },
  {
    id: "course-physiology",
    title: "Medical Physiology",
    subtitle: "Body Functions & Regulation",
    category: "PHYSIOLOGY",
    categoryId: "physiology",
    level: "Intermediate",
    duration: "10h",
    rating: 4.7,
    learners: "9.8k learners",
    artType: "physiology",
  },
  {
    id: "course-biochemistry",
    title: "Biochemistry Essentials",
    subtitle: "Molecules of Life",
    category: "BIOCHEMISTRY",
    categoryId: "physiology",
    level: "Intermediate",
    duration: "7h 15m",
    rating: 4.6,
    learners: "13.4k learners",
    artType: "biochemistry",
  },
  {
    id: "course-neuroscience",
    title: "Neuroscience Fundamentals",
    subtitle: "The Brain & Nervous System",
    category: "NEUROSCIENCE",
    categoryId: "neuroscience",
    level: "Advanced",
    duration: "9h 30m",
    rating: 4.8,
    learners: "11.3k learners",
    artType: "neuroscience",
  },
  {
    id: "course-pharmacology",
    title: "Clinical Pharmacology",
    subtitle: "Drug Mechanisms & Therapy",
    category: "PHARMACOLOGY",
    categoryId: "pharmacology",
    level: "Advanced",
    duration: "11h",
    rating: 4.9,
    learners: "8.7k learners",
    artType: "pharmacology",
  },
  {
    id: "course-pathology",
    title: "General Pathology",
    subtitle: "Disease & Injury Mechanisms",
    category: "PATHOLOGY",
    categoryId: "pathology",
    level: "Intermediate",
    duration: "12h",
    rating: 4.9,
    learners: "19.5k learners",
    artType: "pathology",
  },
];
