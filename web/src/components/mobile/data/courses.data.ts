import { CourseCardData } from "../shared";
import type { DocumentItem } from "../shared";
import anatomyImage from "../../../Assets/course-library/human-anatomy.webp";
import histologyImage from "../../../Assets/course-library/histology-basics.webp";
import physiologyImage from "../../../Assets/course-library/medical-physiology.webp";
import biochemistryImage from "../../../Assets/course-library/biochemistry-essentials.webp";
import brainImage from "../../../Assets/Assingments/brain.webp";

export interface MobileCourseLesson {
  id: string;
  number: number;
  title: string;
  duration: string;
  isCompleted: boolean;
  documentTitle: string;
  documentPages?: number;
}

export interface MobileCourseModule {
  id: string;
  number: number;
  title: string;
  lessonCount: number;
  lessons: MobileCourseLesson[];
}

export interface MobileCourseInstructor {
  id: string;
  name: string;
  title: string;
  credentials: string;
  bioSnippet: string;
  avatarUrl?: string;
  initials: string;
  conversationId: string;
}

export interface MobileDiscussionPost {
  id: string;
  authorName: string;
  authorRole: string;
  authorAvatar?: string;
  authorInitials: string;
  title: string;
  content: string;
  timestamp: string;
  likesCount: number;
  repliesCount: number;
}

export interface ExtendedCourseData extends CourseCardData {
  instructor: MobileCourseInstructor;
  modules: MobileCourseModule[];
  resources: DocumentItem[];
  discussionPosts: MobileDiscussionPost[];
  isEnrolled: boolean;
}

// Canonical enrolled courses list (My Courses tab)
export const SHARED_COURSES_DATA: ExtendedCourseData[] = [
  {
    id: "course-1",
    title: "Human Anatomy I",
    subtitle: "Structure & Organization",
    imageSrc: anatomyImage,
    completedDocs: 6,
    totalDocs: 12,
    status: "IN PROGRESS",
    opened: "Last opened today",
    slug: "human-anatomy-i",
    isEnrolled: true,
    instructor: {
      id: "u_ahmed",
      name: "Dr. Ahmed Hassan",
      title: "Professor of Anatomy",
      credentials: "MD, PhD · Chair of Anatomical Sciences",
      bioSnippet:
        "Specialist in macroscopic human anatomy, neurovascular mapping, and surgical morphology with 15+ years teaching clinical medicine.",
      initials: "AH",
      conversationId: "c1",
    },
    modules: [
      {
        id: "m1",
        number: 1,
        title: "Introduction to Anatomy & Anatomical Terms",
        lessonCount: 3,
        lessons: [
          {
            id: "ha1-l1",
            number: 1,
            title: "Introduction to Anatomy & Anatomical Terms",
            duration: "24:35",
            isCompleted: true,
            documentTitle: "Human Anatomy Foundations Study Guide.pdf",
            documentPages: 18,
          },
          {
            id: "ha1-l2",
            number: 2,
            title: "Basic Anatomical Positions & Directional Terms",
            duration: "18:50",
            isCompleted: true,
            documentTitle: "Directional Anatomical Planes Reference.pdf",
            documentPages: 12,
          },
          {
            id: "ha1-l3",
            number: 3,
            title: "Body Cavities & Membranous Coverings",
            duration: "20:15",
            isCompleted: true,
            documentTitle: "Body Cavities Clinical Notes.pdf",
            documentPages: 14,
          },
        ],
      },
      {
        id: "m2",
        number: 2,
        title: "Upper Limb & Brachial Plexus",
        lessonCount: 3,
        lessons: [
          {
            id: "ha1-l4",
            number: 4,
            title: "Pectoral Region & Axillary Wall",
            duration: "22:10",
            isCompleted: true,
            documentTitle: "Axillary Anatomy & Dissection Guide.pdf",
            documentPages: 16,
          },
          {
            id: "ha1-l5",
            number: 5,
            title: "Brachial Plexus & Peripheral Nerves",
            duration: "31:40",
            isCompleted: true,
            documentTitle: "Brachial Plexus Comprehensive Chart.pdf",
            documentPages: 22,
          },
          {
            id: "ha1-l6",
            number: 6,
            title: "Arm & Cubital Fossa Anatomy",
            duration: "19:25",
            isCompleted: true,
            documentTitle: "Cubital Fossa Clinical Handbook.pdf",
            documentPages: 15,
          },
        ],
      },
      {
        id: "m3",
        number: 3,
        title: "Forearm, Wrist & Hand Spaces",
        lessonCount: 3,
        lessons: [
          {
            id: "ha1-l7",
            number: 7,
            title: "Anterior Forearm Flexor Compartments",
            duration: "25:15",
            isCompleted: false,
            documentTitle: "Flexor Compartments Breakdown.pdf",
            documentPages: 20,
          },
          {
            id: "ha1-l8",
            number: 8,
            title: "Posterior Extensor Muscles & Radial Nerve",
            duration: "21:30",
            isCompleted: false,
            documentTitle: "Extensor Retinaculum & Tendons.pdf",
            documentPages: 18,
          },
          {
            id: "ha1-l9",
            number: 9,
            title: "Carpal Tunnel & Intrinsic Hand Muscles",
            duration: "28:00",
            isCompleted: false,
            documentTitle: "Carpal Tunnel Syndrome Case Note.pdf",
            documentPages: 16,
          },
        ],
      },
      {
        id: "m4",
        number: 4,
        title: "Thorax, Pleura & Mediastinum",
        lessonCount: 3,
        lessons: [
          {
            id: "ha1-l10",
            number: 10,
            title: "Thoracic Cage & Intercostal Spaces",
            duration: "23:45",
            isCompleted: false,
            documentTitle: "Thoracic Cage Biomechanics.pdf",
            documentPages: 19,
          },
          {
            id: "ha1-l11",
            number: 11,
            title: "Lungs, Pleural Reflections & Bronchial Tree",
            duration: "27:10",
            isCompleted: false,
            documentTitle: "Bronchopulmonary Segments Atlas.pdf",
            documentPages: 25,
          },
          {
            id: "ha1-l12",
            number: 12,
            title: "Heart & Superior Mediastinum Relationships",
            duration: "33:20",
            isCompleted: false,
            documentTitle: "Mediastinal Anatomy Clinical Summary.pdf",
            documentPages: 28,
          },
        ],
      },
    ],
    resources: [
      {
        id: "res-1",
        filename: "Human Anatomy I Syllabus & Schedule.pdf",
        extension: "pdf",
        courseTitle: "Human Anatomy I",
        fileSize: "1.2 MB",
        timestamp: "Updated Sep 4",
      },
      {
        id: "res-2",
        filename: "Intro to Anatomy Lecture Slides.pptx",
        extension: "pptx",
        courseTitle: "Human Anatomy I",
        fileSize: "8.6 MB",
        timestamp: "Updated Sep 2",
      },
      {
        id: "res-3",
        filename: "Anatomical Directional Terms Checklist.pdf",
        extension: "pdf",
        courseTitle: "Human Anatomy I",
        fileSize: "420 KB",
        timestamp: "Aug 28",
      },
      {
        id: "res-4",
        filename: "Osteology & Dissection Atlas.pdf",
        extension: "pdf",
        courseTitle: "Human Anatomy I",
        fileSize: "12.4 MB",
        timestamp: "Aug 20",
      },
    ],
    discussionPosts: [
      {
        id: "post-1",
        authorName: "Marcus Chen",
        authorRole: "Student · Cohort A",
        authorInitials: "MC",
        title: "Tips for remembering the roots of the Brachial Plexus?",
        content:
          "Does anyone have a clean mnemonic for the 5 roots, 3 trunks, 6 divisions, 3 cords, and terminal branches? The diagram in module 2 was super helpful but trying to commit it to memory.",
        timestamp: "2 hours ago",
        likesCount: 14,
        repliesCount: 6,
      },
      {
        id: "post-2",
        authorName: "Dr. Ahmed Hassan",
        authorRole: "Professor of Anatomy",
        authorInitials: "AH",
        title: "Reminder: Review body cavity peritoneal reflections",
        content:
          "For everyone preparing for this week's clinical case assignment, pay special attention to the difference between retroperitoneal and intraperitoneal organs.",
        timestamp: "Yesterday",
        likesCount: 29,
        repliesCount: 4,
      },
      {
        id: "post-3",
        authorName: "Elena Rostova",
        authorRole: "Teaching Assistant",
        authorInitials: "ER",
        title: "Supplementary dissection reading uploaded",
        content:
          "I uploaded an annotated diagram set in the resources tab focusing on radial nerve entrapment sites. Check it out before the lab practical.",
        timestamp: "3 days ago",
        likesCount: 19,
        repliesCount: 2,
      },
    ],
  },
  {
    id: "course-2",
    title: "Histology Basics",
    subtitle: "Tissues of the Human Body",
    imageSrc: histologyImage,
    completedDocs: 4,
    totalDocs: 10,
    status: "IN PROGRESS",
    opened: "Last opened 3 days ago",
    slug: "histology-basics",
    isEnrolled: true,
    instructor: {
      id: "u_sarah",
      name: "Prof. Sarah Johnson",
      title: "Lead Histopathology Faculty",
      credentials: "MD, FRCPath · Department of Pathology",
      bioSnippet:
        "Specializes in tissue microarchitecture, cellular staining techniques, and pathological biopsies in pre-clinical medical curricula.",
      initials: "SJ",
      conversationId: "c2",
    },
    modules: [
      {
        id: "hb-m1",
        number: 1,
        title: "Epithelial & Connective Tissues",
        lessonCount: 2,
        lessons: [
          {
            id: "hb-l1",
            number: 1,
            title: "Simple & Stratified Epithelia",
            duration: "18:20",
            isCompleted: true,
            documentTitle: "Epithelial Micrographs.pdf",
            documentPages: 14,
          },
          {
            id: "hb-l2",
            number: 2,
            title: "Extracellular Matrix & Fibers",
            duration: "21:00",
            isCompleted: true,
            documentTitle: "Connective Tissue Staining.pdf",
            documentPages: 16,
          },
        ],
      },
      {
        id: "hb-m2",
        number: 2,
        title: "Muscle & Nervous Tissues",
        lessonCount: 2,
        lessons: [
          {
            id: "hb-l3",
            number: 3,
            title: "Skeletal, Smooth & Cardiac Fibers",
            duration: "25:40",
            isCompleted: true,
            documentTitle: "Striated Muscle Microarchitecture.pdf",
            documentPages: 19,
          },
          {
            id: "hb-l4",
            number: 4,
            title: "Neurons & Glial Supporting Cells",
            duration: "22:15",
            isCompleted: true,
            documentTitle: "Neurohistology Slide Deck.pdf",
            documentPages: 15,
          },
        ],
      },
    ],
    resources: [
      {
        id: "hb-res-1",
        filename: "Histology Stain Key & Color Guide.pdf",
        extension: "pdf",
        courseTitle: "Histology Basics",
        fileSize: "3.4 MB",
        timestamp: "Aug 30",
      },
    ],
    discussionPosts: [],
  },
  {
    id: "course-3",
    title: "Medical Physiology",
    subtitle: "Body Functions & Regulation",
    imageSrc: physiologyImage,
    completedDocs: 3,
    totalDocs: 12,
    status: "IN PROGRESS",
    opened: "Last opened 5 days ago",
    slug: "medical-physiology",
    isEnrolled: true,
    instructor: {
      id: "u_ahmed",
      name: "Dr. Ahmed Hassan",
      title: "Professor of Physiology",
      credentials: "MD, PhD",
      bioSnippet: "Clinical physiology mentor with focus on organ systems.",
      initials: "AH",
      conversationId: "c1",
    },
    modules: [],
    resources: [],
    discussionPosts: [],
  },
  {
    id: "course-4",
    title: "Biochemistry Essentials",
    subtitle: "Molecules of Life",
    imageSrc: biochemistryImage,
    completedDocs: 2,
    totalDocs: 11,
    status: "IN PROGRESS",
    opened: "Last opened 1 week ago",
    slug: "biochemistry-essentials",
    isEnrolled: true,
    instructor: {
      id: "u_sarah",
      name: "Prof. Sarah Johnson",
      title: "Biochemistry Lead",
      credentials: "MD, PhD",
      bioSnippet: "Metabolic pathways, enzymology, and genetics.",
      initials: "SJ",
      conversationId: "c2",
    },
    modules: [],
    resources: [],
    discussionPosts: [],
  },
  {
    id: "course-5",
    title: "Neuroscience Fundamentals",
    subtitle: "The Brain & Nervous System",
    imageSrc: brainImage,
    completedDocs: 1,
    totalDocs: 9,
    status: "IN PROGRESS",
    opened: "Last opened 1 week ago",
    slug: "neuroscience-fundamentals",
    isEnrolled: true,
    instructor: {
      id: "u_ahmed",
      name: "Dr. Ahmed Hassan",
      title: "Neuroanatomy Lead",
      credentials: "MD",
      bioSnippet: "Neurological mapping and central nervous system.",
      initials: "AH",
      conversationId: "c1",
    },
    modules: [],
    resources: [],
    discussionPosts: [],
  },
];

// Explore-only courses (NOT enrolled)
export const EXPLORE_CATALOG_COURSES: ExtendedCourseData[] = [
  {
    id: "course-explore-1",
    title: "Clinical Pharmacology",
    subtitle: "Drug Mechanisms & Therapy",
    imageSrc: biochemistryImage,
    completedDocs: 0,
    totalDocs: 14,
    status: "NOT ENROLLED",
    opened: "Browse catalog",
    slug: "clinical-pharmacology",
    isEnrolled: false,
    instructor: {
      id: "u_pharma",
      name: "Dr. Laila Mansour",
      title: "Associate Professor of Pharmacology",
      credentials: "PharmD, PhD · Clinical Therapeutics Lead",
      bioSnippet:
        "Specializes in pharmacokinetics, receptor binding dynamics, and antimicrobial stewardship.",
      initials: "LM",
      conversationId: "c6",
    },
    modules: [
      {
        id: "cp-m1",
        number: 1,
        title: "Pharmacokinetics & Drug Absorption",
        lessonCount: 4,
        lessons: [
          {
            id: "cp-l1",
            number: 1,
            title: "Drug Absorption Across Biological Membranes",
            duration: "26:10",
            isCompleted: false,
            documentTitle: "Bioavailability & Membrane Transport.pdf",
          },
          {
            id: "cp-l2",
            number: 2,
            title: "Volume of Distribution & Plasma Binding",
            duration: "21:40",
            isCompleted: false,
            documentTitle: "Volume of Distribution Calculations.pdf",
          },
        ],
      },
    ],
    resources: [
      {
        id: "cp-res-1",
        filename: "Clinical Pharmacology Syllabus.pdf",
        extension: "pdf",
        courseTitle: "Clinical Pharmacology",
        fileSize: "1.5 MB",
        timestamp: "Aug 15",
      },
    ],
    discussionPosts: [],
  },
  {
    id: "course-explore-2",
    title: "General Pathology",
    subtitle: "Disease & Injury Mechanisms",
    imageSrc: histologyImage,
    completedDocs: 0,
    totalDocs: 16,
    status: "NOT ENROLLED",
    opened: "Browse catalog",
    slug: "general-pathology",
    isEnrolled: false,
    instructor: {
      id: "u_path",
      name: "Dr. Khaled Fawzy",
      title: "Professor of Pathology",
      credentials: "MD · Forensic & Clinical Pathology",
      bioSnippet: "Cellular adaptations, necrosis, apoptosis, and inflammation.",
      initials: "KF",
      conversationId: "c6",
    },
    modules: [],
    resources: [],
    discussionPosts: [],
  },
];
