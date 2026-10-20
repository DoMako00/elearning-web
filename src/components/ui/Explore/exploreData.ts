import type { CourseArtworkKey } from "../CourseLibrary/courses.data";

export interface ExploreCourse {
  id: string;
  title: string;
  code: string;
  category: "SUBJECT" | "MODULE";
  categoryId: "subject" | "module";
  level: string;
  semester: string;
  semesterNumber: number;
  lessonCount: number;
  updatedAt: string;
  canOpen: boolean;
  artType: CourseArtworkKey;
}

export interface ExploreDirection {
  id: string;
  title: string;
  subtitle: string;
  semesterNumber: number;
  colorTheme: "green" | "purple" | "blue";
}

export interface ExploreCategory {
  id: "all" | "subject" | "module";
  label: string;
}
