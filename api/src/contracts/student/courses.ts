export type StudentCommercialBrand = "medway" | "elite" | "nexus";
export type CataloguePresentation = "subject_based" | "module_based";
export type LessonMediaStatus = "no_media" | "pending_media" | "ready";
export type StudentCourseEnrollmentStatus = "active" | "completed";

export interface StudentCourseAccess {
  readonly isEnrolled: boolean;
  readonly canOpen: boolean;
  readonly enrollmentStatus: StudentCourseEnrollmentStatus | null;
}

export interface StudentLessonItem {
  readonly lessonId: string;
  readonly chapterId: string;
  readonly title: string;
  readonly sortOrder: number;
  readonly status: "published";
  readonly mediaStatus: LessonMediaStatus;
  readonly resourceId: string | null;
  readonly playbackAvailable: false;
}

export interface StudentChapterItem {
  readonly chapterId: string;
  readonly title: string;
  readonly sortOrder: number;
  readonly status: "published";
  readonly lessons: readonly StudentLessonItem[];
}

export interface StudentCourseItem {
  readonly courseId: string;
  readonly title: string;
  readonly code: string;
  readonly brand: { readonly code: StudentCommercialBrand; readonly name: string };
  readonly academicInstitution: { readonly code: string; readonly name: string };
  readonly academicLevel: { readonly levelNumber: number; readonly title: string };
  readonly academicSemester: { readonly semesterNumber: number; readonly title: string };
  readonly cataloguePresentation: CataloguePresentation;
  readonly unitLabel: "Subject" | "Module";
  readonly status: "published";
  readonly chapterCount: number;
  readonly lessonCount: number;
  readonly mediaSummary: {
    readonly totalLessons: number;
    readonly lessonsWithMedia: number;
    readonly pendingMediaLessons: number;
  };
  readonly access: StudentCourseAccess;
  readonly updatedAt: string;
}

export interface StudentCourseDetail extends StudentCourseItem {
  readonly academicUnit: { readonly code: string; readonly label: string };
  readonly chapters: readonly StudentChapterItem[];
}

export interface StudentCourseList {
  readonly items: readonly StudentCourseItem[];
  readonly pagination: { readonly page: number; readonly pageSize: number; readonly totalItems: number };
}
