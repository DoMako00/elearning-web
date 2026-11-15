import type { StudentCourseDetail } from "../api/studentCoursesApi";

export function courseBreadcrumb(course: StudentCourseDetail | undefined, lessonId?: string) {
  const courseTitle = course ? `${course.unitLabel} ${course.title}` : "Course";
  const chapter = lessonId ? course?.chapters.find(item => item.lessons.some(lesson => lesson.lessonId === lessonId)) : undefined;
  return { courseTitle, selectionTitle: chapter?.title ?? "Lesson" };
}
