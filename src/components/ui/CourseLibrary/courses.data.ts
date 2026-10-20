import {
  Activity,
  Baby,
  Bone,
  Brain,
  BookOpen,
  FlaskConical,
  HeartPulse,
  Languages,
  Microscope,
  Stethoscope,
  type LucideIcon,
} from "lucide-react";
import anatomyOverlay from "../../../Assets/dashboard/my-courses-anatomy-overlay.webp";
import histologyOverlay from "../../../Assets/dashboard/histology-basics.webp";
import physiologyOverlay from "../../../Assets/dashboard/medical-physiology.webp";
import biochemistryOverlay from "../../../Assets/dashboard/biochemistry-essentials.webp";
import embryologyOverlay from "../../../Assets/dashboard/embryology-foundations.webp";
import dashboardAnatomy from "../../../Assets/dashboard/human-anatomy.webp";
import dashboardEnglish from "../../../Assets/course-library/english-language.jpg";
import dashboardGeneral from "../../../Assets/course-library/general-course.jpg";
import englishCutout from "../../../Assets/course-library/english-language-cutout.png";
import generalCutout from "../../../Assets/course-library/general-course-cutout.png";
import anatomyImage from "../../../Assets/course-library/human-anatomy.webp";
import biochemistryImage from "../../../Assets/course-library/biochemistry-essentials.webp";
import histologyImage from "../../../Assets/course-library/histology-basics.webp";
import physiologyImage from "../../../Assets/course-library/medical-physiology.webp";
import embryologyImage from "../../../Assets/dashboard/embryology-foundations.webp";
import brainImage from "../../../Assets/Assingments/brain.webp";
import heartImage from "../../../Assets/Assingments/heart.webp";
import lungsImage from "../../../Assets/Assingments/lunges.webp";
import boneImage from "../../../Assets/Assingments/bone.webp";
import stomachImage from "../../../Assets/Assingments/stomach.webp";

export type CourseArtworkKey =
  | "anatomy"
  | "histology"
  | "physiology"
  | "biochemistry"
  | "embryology"
  | "neuroscience"
  | "cardiology"
  | "respiratory"
  | "orthopedics"
  | "digestive"
  | "english"
  | "general";

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
  readonly key: CourseArtworkKey;
  readonly category: string;
  readonly categoryId: string;
  readonly art: string;
  readonly image: string;
  readonly dashboardImage: string;
  readonly heroOverlay: string;
  readonly imagePosition: string;
  readonly accentColor: string;
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
  { key: "anatomy", category: "Anatomy", categoryId: "anatomy", art: "anatomy", image: anatomyImage, dashboardImage: dashboardAnatomy, heroOverlay: anatomyOverlay, imagePosition: "50% 28%", accentColor: "#22c55e", Icon: Bone },
  { key: "histology", category: "Histology", categoryId: "histology", art: "histology", image: histologyImage, dashboardImage: histologyOverlay, heroOverlay: histologyOverlay, imagePosition: "center", accentColor: "#8b5cf6", Icon: Microscope },
  { key: "physiology", category: "Physiology", categoryId: "physiology", art: "physiology", image: physiologyImage, dashboardImage: physiologyOverlay, heroOverlay: physiologyOverlay, imagePosition: "center", accentColor: "#ef4444", Icon: HeartPulse },
  { key: "biochemistry", category: "Biochemistry", categoryId: "biochemistry", art: "biochemistry", image: biochemistryImage, dashboardImage: biochemistryOverlay, heroOverlay: biochemistryOverlay, imagePosition: "center", accentColor: "#f59e0b", Icon: FlaskConical },
  { key: "embryology", category: "Embryology", categoryId: "embryology", art: "embryology", image: embryologyImage, dashboardImage: embryologyOverlay, heroOverlay: embryologyOverlay, imagePosition: "center", accentColor: "#10b981", Icon: Baby },
  { key: "neuroscience", category: "Neuroscience", categoryId: "neuroscience", art: "neuroscience", image: brainImage, dashboardImage: brainImage, heroOverlay: brainImage, imagePosition: "center", accentColor: "#06b6d4", Icon: Brain },
  { key: "cardiology", category: "Cardiology", categoryId: "cardiology", art: "cardiology", image: heartImage, dashboardImage: heartImage, heroOverlay: heartImage, imagePosition: "center", accentColor: "#ef4444", Icon: HeartPulse },
  { key: "respiratory", category: "Respiratory", categoryId: "respiratory", art: "respiratory", image: lungsImage, dashboardImage: lungsImage, heroOverlay: lungsImage, imagePosition: "center", accentColor: "#22c55e", Icon: Activity },
  { key: "orthopedics", category: "Orthopedics", categoryId: "orthopedics", art: "orthopedics", image: boneImage, dashboardImage: boneImage, heroOverlay: boneImage, imagePosition: "center", accentColor: "#10b981", Icon: Bone },
  { key: "digestive", category: "Digestive system", categoryId: "digestive", art: "digestive", image: stomachImage, dashboardImage: stomachImage, heroOverlay: stomachImage, imagePosition: "center", accentColor: "#f59e0b", Icon: Activity },
  { key: "english", category: "English", categoryId: "english", art: "english", image: dashboardEnglish, dashboardImage: dashboardEnglish, heroOverlay: englishCutout, imagePosition: "center", accentColor: "#10b981", Icon: Languages },
  { key: "general", category: "General", categoryId: "general", art: "general", image: dashboardGeneral, dashboardImage: dashboardGeneral, heroOverlay: generalCutout, imagePosition: "center", accentColor: "#10b981", Icon: BookOpen },
];

type CourseVisualIdentity = Readonly<{ title: string; code?: string }>;

const COURSE_VISUAL_MATCHERS: ReadonlyArray<Readonly<{ key: CourseArtworkKey; title: RegExp; code: RegExp; aliases?: readonly string[] }>> = [
  { key: "english", title: /\b(english|language|communication skills)\b/i, code: /^(ENG|ELT|ESL|EFL|ESP)\d*$/i, aliases: ["انجليزي", "اللغة الانجليزية"] },
  { key: "embryology", title: /\b(embryology|embryonic development)\b/i, code: /^(EMB|EMBR|EMBRYO)\d*$/i },
  { key: "histology", title: /\b(histology|histological|cellular biology|tissues?)\b/i, code: /^(HIS|HIST|HISTO)\d*$/i },
  { key: "biochemistry", title: /\b(biochemistry|biochem|biochemical)\b/i, code: /^(BCH|BCHEM|BIOC)\d*$/i },
  { key: "physiology", title: /\b(physiology|physiological)\b/i, code: /^(PHS|PHYSIO)\d*$/i },
  { key: "neuroscience", title: /\b(neuroscience|neurology|neuroanatomy|neuro)\b/i, code: /^(NEU|NEUR|NRS)\d*$/i },
  { key: "cardiology", title: /\b(cardiology|cardiac|cardiovascular)\b/i, code: /^(CAR|CARD|CARDIO)\d*$/i },
  { key: "respiratory", title: /\b(respiratory|pulmonary|pulmonology)\b/i, code: /^(RES|RESP|PULM)\d*$/i },
  { key: "orthopedics", title: /\b(orthopedics|orthopaedics|musculoskeletal|fracture)\b/i, code: /^(ORT|ORTH|ORTHO)\d*$/i },
  { key: "digestive", title: /\b(gastroenterology|digestive|gastrointestinal|stomach)\b/i, code: /^(GAS|GAST|GI)\d*$/i },
  { key: "anatomy", title: /\b(anatomy|anatomical)\b/i, code: /^(ANA|ANAT|ANATOMY)\d*$/i },
];

function normalizeTitle(value: string) {
  return value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^\p{L}\p{N}]+/gu, " ").trim();
}

export function getCourseVisualPreset(course: CourseVisualIdentity): CourseVisualPreset {
  const title = normalizeTitle(course.title).toLowerCase();
  const codeTokens = (course.code ?? "").toUpperCase().split(/[^A-Z0-9]+/).filter(Boolean);
  const match = COURSE_VISUAL_MATCHERS.find((matcher) => matcher.title.test(title)
    || matcher.aliases?.some((alias) => title.includes(alias))
    || codeTokens.some((token) => matcher.code.test(token)));
  return COURSE_VISUAL_PRESETS.find((preset) => preset.key === match?.key)
    ?? COURSE_VISUAL_PRESETS.find((preset) => preset.key === "general")!;
}
