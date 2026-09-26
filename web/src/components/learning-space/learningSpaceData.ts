export interface CourseModuleSummary {
  id: string;
  number: number;
  title: string;
  lessonCount: number;
}

export interface ReferencedFile {
  id: string;
  title: string;
  extension: "pdf" | "pptx" | "docx" | "csv";
  size: string;
}

export interface CourseResource {
  id: string;
  title: string;
  description: string;
  extension: "pdf" | "pptx" | "docx" | "csv";
  module: number;
  size: string;
  added: string;
}

export interface DiscussionPost {
  id: string;
  author: string;
  role: "Instructor" | "Student";
  avatar: string;
  time: string;
  body: string;
  replies: number;
  likes: number;
}

export const COURSE_MODULE_SUMMARIES: CourseModuleSummary[] = [
  { id: "module-1", number: 1, title: "Introduction to Anatomy", lessonCount: 3 },
  { id: "module-2", number: 2, title: "Upper Limb", lessonCount: 5 },
  { id: "module-3", number: 3, title: "Thorax", lessonCount: 4 },
  { id: "module-4", number: 4, title: "Abdomen & Pelvis", lessonCount: 5 },
  { id: "module-5", number: 5, title: "Lower Limb", lessonCount: 4 },
  { id: "module-6", number: 6, title: "Neuroanatomy Foundations", lessonCount: 3 },
];

export const KEY_TERMS = [
  { term: "Superior", definition: "Toward the head; above" },
  { term: "Inferior", definition: "Toward the feet; below" },
  { term: "Anterior", definition: "Toward the front" },
  { term: "Posterior", definition: "Toward the back" },
  { term: "Medial", definition: "Toward the midline" },
  { term: "Lateral", definition: "Away from the midline" },
  { term: "Proximal", definition: "Closer to the trunk" },
  { term: "Distal", definition: "Farther from the trunk" },
] as const;

export const REFERENCED_LESSON_FILES: ReferencedFile[] = [
  { id: "terms-checklist", title: "Anatomical Terms Checklist.pdf", extension: "pdf", size: "420 KB" },
  { id: "intro-slides", title: "Intro to Anatomy Slides.pptx", extension: "pptx", size: "8.6 MB" },
  { id: "position-guide", title: "Anatomical Position Guide.pdf", extension: "pdf", size: "1.1 MB" },
  { id: "planes-diagram", title: "Body Planes Diagram.pdf", extension: "pdf", size: "960 KB" },
];

export const COURSE_RESOURCES: CourseResource[] = [
  {
    id: "terms-checklist",
    title: "Anatomical Terms Checklist.pdf",
    description: "Printable checklist for directional terms and planes.",
    extension: "pdf",
    module: 1,
    size: "420 KB",
    added: "12 Mar 2026",
  },
  {
    id: "intro-slides",
    title: "Intro to Anatomy Slides.pptx",
    description: "Lecture slides covering anatomical position, planes, and regions.",
    extension: "pptx",
    module: 1,
    size: "8.6 MB",
    added: "10 Mar 2026",
  },
  {
    id: "osteology-atlas",
    title: "Basic Osteology Atlas.pdf",
    description: "Illustrated atlas of major bones introduced in Module 2.",
    extension: "pdf",
    module: 2,
    size: "12.4 MB",
    added: "8 Mar 2026",
  },
  {
    id: "syllabus",
    title: "Human Anatomy I Syllabus.pdf",
    description: "Course outline, assessment dates, and lab schedule.",
    extension: "pdf",
    module: 1,
    size: "1.2 MB",
    added: "2 Mar 2026",
  },
  {
    id: "surface-anatomy",
    title: "Upper Limb Surface Anatomy.docx",
    description: "Landmarks used in the upper limb practical session.",
    extension: "docx",
    module: 2,
    size: "640 KB",
    added: "18 Mar 2026",
  },
  {
    id: "lab-attendance",
    title: "Lab Attendance Sheet.csv",
    description: "Session roster for anatomy lab groups A–D.",
    extension: "csv",
    module: 2,
    size: "48 KB",
    added: "20 Mar 2026",
  },
];

export const PINNED_RESOURCES = [COURSE_RESOURCES[0], COURSE_RESOURCES[3]] as const;

export const RECENT_DOWNLOADS = [
  { ...COURSE_RESOURCES[1], downloaded: "Today" },
  { ...COURSE_RESOURCES[2], downloaded: "Yesterday" },
] as const;

export const DISCUSSION_POSTS: DiscussionPost[] = [
  {
    id: "post-1",
    author: "Dr. Ahmed Hassan",
    role: "Instructor",
    avatar: "https://i.pravatar.cc/72?img=12",
    time: "2h ago",
    body: "Before Friday’s lab, review anatomical position and the three planes. Be ready to point them out on the model without notes.",
    replies: 8,
    likes: 21,
  },
  {
    id: "post-2",
    author: "Lina Farouk",
    role: "Student",
    avatar: "https://i.pravatar.cc/72?img=32",
    time: "4h ago",
    body: "Is “anterior” always the same as “ventral” in the limbs, or only in the trunk? The slides used both.",
    replies: 5,
    likes: 12,
  },
  {
    id: "post-3",
    author: "Omar Khaled",
    role: "Student",
    avatar: "https://i.pravatar.cc/72?img=15",
    time: "Yesterday",
    body: "Sharing a mnemonic for directional terms that helped me: SAP-ML — Superior, Anterior, Proximal, Medial, Lateral.",
    replies: 3,
    likes: 17,
  },
];
