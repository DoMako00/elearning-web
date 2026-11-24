import {
  Activity,
  Baby,
  Bone,
  Brain,
  BookOpen,
  ClipboardCheck,
  ClipboardList,
  Dna,
  FlaskConical,
  GraduationCap,
  HeartHandshake,
  HeartPulse,
  Layers,
  Languages,
  Microscope,
  Pill,
  ScanEye,
  ShieldCheck,
  Stethoscope,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import dashboardGeneral from "../../../Assets/course-library/general-course.jpg";
import generalCutout from "../../../Assets/course-library/general-course-cutout.png";
import anatomyImage from "../../../Assets/subjects/global/anatomy.webp";
import biochemistryImage from "../../../Assets/subjects/global/biochemistry.webp";
import cellBiologyGeneticsImage from "../../../Assets/subjects/global/cell-biology-genetics.webp";
import earlyClinicalExposureImage from "../../../Assets/subjects/global/early-clinical-exposure.webp";
import embryologyImage from "../../../Assets/subjects/global/embryology.webp";
import englishImage from "../../../Assets/subjects/global/english.webp";
import histologyImage from "../../../Assets/subjects/global/histology.webp";
import immunologyImage from "../../../Assets/subjects/global/immunology.webp";
import interprofessionalCommunicationImage from "../../../Assets/subjects/global/interprofessional-communication.webp";
import medicalCommunicationEthicsImage from "../../../Assets/subjects/global/medical-communication-ethics.webp";
import microbiologyImage from "../../../Assets/subjects/global/microbiology.webp";
import pathologyImage from "../../../Assets/subjects/global/pathology.webp";
import pharmacologyImage from "../../../Assets/subjects/global/pharmacology.webp";
import professionalMedicalDevelopmentImage from "../../../Assets/subjects/global/professional-medical-development.webp";
import physiologyClinicalPharmacologyImage from "../../../Assets/subjects/global/physiology-clinical-pharmacology.webp";
import physiologyImage from "../../../Assets/subjects/global/physiology.webp";
import simulationImage from "../../../Assets/subjects/global/simulation.webp";
import socialBehaviouralSciencesImage from "../../../Assets/subjects/global/social-behavioural-sciences.webp";
import tissueStructureFunctionImage from "../../../Assets/subjects/global/tissue-structure-function.webp";
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
  | "cell-biology-genetics"
  | "early-clinical-exposure"
  | "immunology"
  | "physiology-clinical-pharmacology"
  | "microbiology"
  | "pathology"
  | "pharmacology"
  | "professional-medical-development"
  | "simulation"
  | "social-behavioural-sciences"
  | "tissue-structure-function"
  | "interprofessional-communication"
  | "medical-communication-ethics"
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
  subjectId?: string;
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
  { key: "anatomy", category: "Anatomy", categoryId: "anatomy", art: "anatomy", image: anatomyImage, dashboardImage: anatomyImage, heroOverlay: anatomyImage, imagePosition: "50% 28%", accentColor: "#22c55e", Icon: Bone },
  { key: "histology", category: "Histology", categoryId: "histology", art: "histology", image: histologyImage, dashboardImage: histologyImage, heroOverlay: histologyImage, imagePosition: "center", accentColor: "#8b5cf6", Icon: Microscope },
  { key: "physiology", category: "Physiology", categoryId: "physiology", art: "physiology", image: physiologyImage, dashboardImage: physiologyImage, heroOverlay: physiologyImage, imagePosition: "center", accentColor: "#ef4444", Icon: HeartPulse },
  { key: "biochemistry", category: "Biochemistry", categoryId: "biochemistry", art: "biochemistry", image: biochemistryImage, dashboardImage: biochemistryImage, heroOverlay: biochemistryImage, imagePosition: "center", accentColor: "#f59e0b", Icon: FlaskConical },
  { key: "embryology", category: "Embryology", categoryId: "embryology", art: "embryology", image: embryologyImage, dashboardImage: embryologyImage, heroOverlay: embryologyImage, imagePosition: "center", accentColor: "#10b981", Icon: Baby },
  { key: "cell-biology-genetics", category: "Cell Biology & Genetics", categoryId: "cell-biology-genetics", art: "cell-biology-genetics", image: cellBiologyGeneticsImage, dashboardImage: cellBiologyGeneticsImage, heroOverlay: cellBiologyGeneticsImage, imagePosition: "center", accentColor: "#10b981", Icon: Dna },
  { key: "early-clinical-exposure", category: "Early Clinical Exposure", categoryId: "early-clinical-exposure", art: "early-clinical-exposure", image: earlyClinicalExposureImage, dashboardImage: earlyClinicalExposureImage, heroOverlay: earlyClinicalExposureImage, imagePosition: "center", accentColor: "#10b981", Icon: Stethoscope },
  { key: "immunology", category: "Immunology", categoryId: "immunology", art: "immunology", image: immunologyImage, dashboardImage: immunologyImage, heroOverlay: immunologyImage, imagePosition: "center", accentColor: "#10b981", Icon: ShieldCheck },
  { key: "physiology-clinical-pharmacology", category: "Introduction to Physiology & Clinical Pharmacology", categoryId: "physiology-clinical-pharmacology", art: "physiology-clinical-pharmacology", image: physiologyClinicalPharmacologyImage, dashboardImage: physiologyClinicalPharmacologyImage, heroOverlay: physiologyClinicalPharmacologyImage, imagePosition: "center", accentColor: "#10b981", Icon: HeartPulse },
  { key: "microbiology", category: "Microbiology", categoryId: "microbiology", art: "microbiology", image: microbiologyImage, dashboardImage: microbiologyImage, heroOverlay: microbiologyImage, imagePosition: "center", accentColor: "#10b981", Icon: Microscope },
  { key: "pathology", category: "Pathology", categoryId: "pathology", art: "pathology", image: pathologyImage, dashboardImage: pathologyImage, heroOverlay: pathologyImage, imagePosition: "center", accentColor: "#10b981", Icon: ScanEye },
  { key: "pharmacology", category: "Pharmacology", categoryId: "pharmacology", art: "pharmacology", image: pharmacologyImage, dashboardImage: pharmacologyImage, heroOverlay: pharmacologyImage, imagePosition: "center", accentColor: "#10b981", Icon: Pill },
  { key: "professional-medical-development", category: "Professional Medical Development", categoryId: "professional-medical-development", art: "professional-medical-development", image: professionalMedicalDevelopmentImage, dashboardImage: professionalMedicalDevelopmentImage, heroOverlay: professionalMedicalDevelopmentImage, imagePosition: "center", accentColor: "#10b981", Icon: GraduationCap },
  { key: "simulation", category: "Simulation", categoryId: "simulation", art: "simulation", image: simulationImage, dashboardImage: simulationImage, heroOverlay: simulationImage, imagePosition: "center", accentColor: "#10b981", Icon: ClipboardList },
  { key: "social-behavioural-sciences", category: "Social & Behavioural Sciences", categoryId: "social-behavioural-sciences", art: "social-behavioural-sciences", image: socialBehaviouralSciencesImage, dashboardImage: socialBehaviouralSciencesImage, heroOverlay: socialBehaviouralSciencesImage, imagePosition: "center", accentColor: "#10b981", Icon: UsersRound },
  { key: "tissue-structure-function", category: "Tissue Structure & Function", categoryId: "tissue-structure-function", art: "tissue-structure-function", image: tissueStructureFunctionImage, dashboardImage: tissueStructureFunctionImage, heroOverlay: tissueStructureFunctionImage, imagePosition: "center", accentColor: "#10b981", Icon: Layers },
  { key: "interprofessional-communication", category: "Interprofessional Communication", categoryId: "interprofessional-communication", art: "interprofessional-communication", image: interprofessionalCommunicationImage, dashboardImage: interprofessionalCommunicationImage, heroOverlay: interprofessionalCommunicationImage, imagePosition: "center", accentColor: "#10b981", Icon: HeartHandshake },
  { key: "medical-communication-ethics", category: "Medical Communication and Ethics", categoryId: "medical-communication-ethics", art: "medical-communication-ethics", image: medicalCommunicationEthicsImage, dashboardImage: medicalCommunicationEthicsImage, heroOverlay: medicalCommunicationEthicsImage, imagePosition: "center", accentColor: "#10b981", Icon: ClipboardCheck },
  { key: "neuroscience", category: "Neuroscience", categoryId: "neuroscience", art: "neuroscience", image: brainImage, dashboardImage: brainImage, heroOverlay: brainImage, imagePosition: "center", accentColor: "#06b6d4", Icon: Brain },
  { key: "cardiology", category: "Cardiology", categoryId: "cardiology", art: "cardiology", image: heartImage, dashboardImage: heartImage, heroOverlay: heartImage, imagePosition: "center", accentColor: "#ef4444", Icon: HeartPulse },
  { key: "respiratory", category: "Respiratory", categoryId: "respiratory", art: "respiratory", image: lungsImage, dashboardImage: lungsImage, heroOverlay: lungsImage, imagePosition: "center", accentColor: "#22c55e", Icon: Activity },
  { key: "orthopedics", category: "Orthopedics", categoryId: "orthopedics", art: "orthopedics", image: boneImage, dashboardImage: boneImage, heroOverlay: boneImage, imagePosition: "center", accentColor: "#10b981", Icon: Bone },
  { key: "digestive", category: "Digestive system", categoryId: "digestive", art: "digestive", image: stomachImage, dashboardImage: stomachImage, heroOverlay: stomachImage, imagePosition: "center", accentColor: "#f59e0b", Icon: Activity },
  { key: "english", category: "English", categoryId: "english", art: "english", image: englishImage, dashboardImage: englishImage, heroOverlay: englishImage, imagePosition: "center", accentColor: "#10b981", Icon: Languages },
  { key: "general", category: "General", categoryId: "general", art: "general", image: dashboardGeneral, dashboardImage: dashboardGeneral, heroOverlay: generalCutout, imagePosition: "center", accentColor: "#10b981", Icon: BookOpen },
];

type CourseVisualIdentity = Readonly<{ title: string; code?: string }>;

const COURSE_VISUAL_MATCHERS: ReadonlyArray<Readonly<{ key: CourseArtworkKey; title: RegExp; code: RegExp; aliases?: readonly string[] }>> = [
  { key: "english", title: /\b(english|language|communication skills)\b/i, code: /^(ENG|ELT|ESL|EFL|ESP)\d*$/i, aliases: ["انجليزي", "اللغة الانجليزية"] },
  { key: "medical-communication-ethics", title: /\b(medical communication|medical ethics|communication and ethics)\b/i, code: /^(MCE|MEDCOMM)\d*$/i },
  { key: "interprofessional-communication", title: /\b(interprofessional communication|interprofessionalism)\b/i, code: /^(IPC|IPCOMM)\d*$/i },
  { key: "early-clinical-exposure", title: /\b(early clinical exposure|clinical skills introduction)\b/i, code: /^(ECX|ECE)\d*$/i },
  { key: "cell-biology-genetics", title: /\b(cell biology|cellular biology|genetics)\b/i, code: /^(CBG|GEN|CELL)\d*$/i },
  { key: "tissue-structure-function", title: /\b(tissue structure|tissue function|structure and function of tissues)\b/i, code: /^(TSF|TISSUE)\d*$/i },
  { key: "embryology", title: /\b(embryology|embryonic development)\b/i, code: /^(EMB|EMBR|EMBRYO)\d*$/i },
  { key: "histology", title: /\b(histology|histological|histology foundations|tissue microscopy)\b/i, code: /^(HIS|HIST|HISTO)\d*$/i, aliases: ["histology foundations"] },
  { key: "biochemistry", title: /\b(biochemistry|biochem|biochemical)\b/i, code: /^(BCH|BCHEM|BIOC|BIO)\d*$/i, aliases: ["biochemistry fundamentals"] },
  { key: "immunology", title: /\b(immunology|immune system)\b/i, code: /^(IMM|IMMU)\d*$/i },
  { key: "microbiology", title: /\b(microbiology|microbiological)\b/i, code: /^(MIC|MICRO)\d*$/i },
  { key: "pathology", title: /\b(pathology|pathological)\b/i, code: /^(PAT|PATH)\d*$/i },
  { key: "physiology-clinical-pharmacology", title: /\b(introduction to physiology|clinical pharmacology)\b/i, code: /^(IPP|PHCLIN)\d*$/i },
  { key: "pharmacology", title: /\b(pharmacology|pharmacological)\b/i, code: /^(PHE|PHAR|PHARM)\d*$/i },
  { key: "professional-medical-development", title: /\bprofessional medical development\b/i, code: /^(PMD|PRODEV)\d*$/i },
  { key: "simulation", title: /\b(simulation|clinical simulation)\b/i, code: /^(SIM)\d*$/i },
  { key: "social-behavioural-sciences", title: /\b(social.*(behavioural|behavioral)|(behavioural|behavioral)) sciences\b/i, code: /^(SBS|SOCIAL)\d*$/i },
  { key: "physiology", title: /\b(physiology|physiological)\b/i, code: /^(PHS|PHYSIO)\d*$/i },
  { key: "neuroscience", title: /\b(neuroscience|neurology|neuroanatomy|neuro)\b/i, code: /^(NEU|NEUR|NRS)\d*$/i },
  { key: "cardiology", title: /\b(cardiology|cardiac|cardiovascular)\b/i, code: /^(CAR|CARD|CARDIO)\d*$/i },
  { key: "respiratory", title: /\b(respiratory|pulmonary|pulmonology)\b/i, code: /^(RES|RESP|PULM)\d*$/i },
  { key: "orthopedics", title: /\b(orthopedics|orthopaedics|musculoskeletal|fracture)\b/i, code: /^(ORT|ORTH|ORTHO)\d*$/i },
  { key: "digestive", title: /\b(gastroenterology|digestive|gastrointestinal|stomach)\b/i, code: /^(GAS|GAST|GI)\d*$/i },
  { key: "anatomy", title: /\b(anatomy|anatomical|skeletal system|bones|joints|muscles)\b/i, code: /^(ANA|ANAT|ANATOMY)\d*$/i, aliases: ["anatomy foundations", "skeletal system", "الهيكل العظمي", "التشريح"] },
];

function normalizeTitle(value: string) {
  return value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^\p{L}\p{N}]+/gu, " ").trim();
}

export function getCourseVisualPreset(course: CourseVisualIdentity): CourseVisualPreset {
  const title = normalizeTitle(course.title).toLowerCase();
  const codeTokens = (course.code ?? "").toUpperCase().split(/[^A-Z0-9]+/).filter(Boolean);
  const matchByTitle = COURSE_VISUAL_MATCHERS.find((matcher) => matcher.title.test(title)
    || matcher.aliases?.some((alias) => title.includes(alias)));
  const match = matchByTitle ?? COURSE_VISUAL_MATCHERS.find((matcher) =>
    codeTokens.some((token) => matcher.code.test(token)));
  return COURSE_VISUAL_PRESETS.find((preset) => preset.key === match?.key)
    ?? COURSE_VISUAL_PRESETS.find((preset) => preset.key === "general")!;
}
