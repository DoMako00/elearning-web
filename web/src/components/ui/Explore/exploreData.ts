import {
  BarChart3,
  Code2,
  Infinity as InfinityIcon,
  Palette,
  Pencil,
  Sparkles,
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
  iconType: "js" | "cube" | "sparkles";
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
  category: string;
  categoryId: string;
  level: string;
  duration: string;
  rating: number;
  learners: string;
  artType: "javascript" | "react" | "design" | "node" | "data" | "devops" | "ai";
}

export const HERO_PATH: HeroPath = {
  badge1: "EDITOR'S PICK",
  badge2: "12-WEEK PATH",
  title: "Build Modern React Systems",
  description:
    "Master scalable React architecture, data flows, and performance for production-grade apps.",
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
    title: "JavaScript Mastery",
    level: "Beginner",
    duration: "6h",
    rating: 4.8,
    iconType: "js",
    bgClass: "trending-icon--yellow",
  },
  {
    id: "trending-2",
    rank: "02",
    title: "Product Design Systems",
    level: "Intermediate",
    duration: "8h",
    rating: 4.9,
    iconType: "cube",
    bgClass: "trending-icon--green",
  },
  {
    id: "trending-3",
    rank: "03",
    title: "AI for Developers",
    level: "Intermediate",
    duration: "7h",
    rating: 4.7,
    iconType: "sparkles",
    bgClass: "trending-icon--purple",
  },
];

export const DIRECTION_ITEMS: DirectionItem[] = [
  {
    id: "dir-frontend",
    title: "Frontend",
    subtitle: "Build for the web",
    categoryId: "web-dev",
    colorTheme: "green",
    icon: Code2,
  },
  {
    id: "dir-design",
    title: "Design",
    subtitle: "Create experiences",
    categoryId: "design",
    colorTheme: "purple",
    icon: Pencil,
  },
  {
    id: "dir-data",
    title: "Data",
    subtitle: "Make sense of data",
    categoryId: "data-science",
    colorTheme: "blue",
    icon: BarChart3,
  },
];

export const CATEGORY_TABS: CategoryTab[] = [
  { id: "all", label: "All" },
  { id: "web-dev", label: "Web Development", icon: Code2 },
  { id: "design", label: "Design", icon: Palette },
  { id: "data-science", label: "Data Science", icon: BarChart3 },
  { id: "ai-ml", label: "AI & ML", icon: Sparkles },
  { id: "devops", label: "DevOps", icon: InfinityIcon },
];

export const EXPLORE_COURSES: ExploreCourse[] = [
  {
    id: "course-js",
    title: "JavaScript Mastery",
    category: "WEB DEVELOPMENT",
    categoryId: "web-dev",
    level: "Beginner",
    duration: "6h 30m",
    rating: 4.8,
    learners: "15.2k learners",
    artType: "javascript",
  },
  {
    id: "course-react",
    title: "React Complete Guide",
    category: "WEB DEVELOPMENT",
    categoryId: "web-dev",
    level: "Intermediate",
    duration: "10h",
    rating: 4.9,
    learners: "22.1k learners",
    artType: "react",
  },
  {
    id: "course-design",
    title: "UI/UX Design Principles",
    category: "DESIGN",
    categoryId: "design",
    level: "Intermediate",
    duration: "7h",
    rating: 4.7,
    learners: "9.8k learners",
    artType: "design",
  },
  {
    id: "course-node",
    title: "Node.js Backend Dev",
    category: "WEB DEVELOPMENT",
    categoryId: "web-dev",
    level: "Intermediate",
    duration: "9h",
    rating: 4.6,
    learners: "13.4k learners",
    artType: "node",
  },
  {
    id: "course-data",
    title: "Data Science Foundations",
    category: "DATA SCIENCE",
    categoryId: "data-science",
    level: "Intermediate",
    duration: "8h 15m",
    rating: 4.8,
    learners: "11.3k learners",
    artType: "data",
  },
  {
    id: "course-devops",
    title: "DevOps & Cloud Architecture",
    category: "DEVOPS",
    categoryId: "devops",
    level: "Advanced",
    duration: "11h",
    rating: 4.9,
    learners: "8.7k learners",
    artType: "devops",
  },
  {
    id: "course-ai",
    title: "AI & Neural Networks",
    category: "AI & ML",
    categoryId: "ai-ml",
    level: "Advanced",
    duration: "12h 45m",
    rating: 4.9,
    learners: "19.5k learners",
    artType: "ai",
  },
];
