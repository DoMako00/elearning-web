import type { StudentCourseDetail } from "../../features/student/api/studentCoursesApi";

export interface LearningSpaceModuleSummary {
  id: string;
  number: number;
  title: string;
  lessonCount: number;
  firstLessonId: string | null;
}

export interface LearningSpaceResource {
  id: string;
  title: string;
  extension: "pdf" | "video";
  lessonId: string;
  chapterId: string;
  chapterTitle: string;
  available: boolean;
}

export function mapCourseModules(course: StudentCourseDetail): LearningSpaceModuleSummary[] {
  return course.chapters.map((chapter, index) => ({
    id: chapter.chapterId,
    number: index + 1,
    title: chapter.title,
    lessonCount: chapter.lessons.length,
    firstLessonId: chapter.lessons[0]?.lessonId ?? null,
  }));
}

export function mapCourseResources(course: StudentCourseDetail): LearningSpaceResource[] {
  return course.chapters.flatMap((chapter) => chapter.lessons.flatMap((lesson) => {
    if (!lesson.resourceId || !lesson.resourceType || lesson.mediaStatus !== "ready") return [];
    return [{
      id: lesson.resourceId,
      title: lesson.resourceTitle || lesson.title,
      extension: lesson.resourceType,
      lessonId: lesson.lessonId,
      chapterId: chapter.chapterId,
      chapterTitle: chapter.title,
      available: lesson.playbackAvailable,
    }];
  }));
}
