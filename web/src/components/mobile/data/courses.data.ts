import { CourseCardData } from "../shared";
import anatomyImage from "../../../Assets/course-library/human-anatomy.webp";
import histologyImage from "../../../Assets/course-library/histology-basics.webp";
import physiologyImage from "../../../Assets/course-library/medical-physiology.webp";
import biochemistryImage from "../../../Assets/course-library/biochemistry-essentials.webp";
import brainImage from "../../../Assets/Assingments/brain.webp";

// Canonical enrolled courses list (My Courses tab)
export const SHARED_COURSES_DATA: CourseCardData[] = [
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
  },
];
