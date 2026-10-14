import type { StudentCourseItem } from "../../../features/student/api/studentCoursesApi";
import type { StudentProgressCourseDto } from "../../../features/student/api/studentLearningApi";
import type { CourseCardData } from "./CourseCard";

export function mapStudentCourseToCard(course: StudentCourseItem, progress?: StudentProgressCourseDto): CourseCardData {
  const completed = progress?.completedLessons ?? 0;
  const total = course.lessonCount;
  return {
    id: course.courseId,
    slug: course.courseId,
    title: course.title,
    subtitle: `${course.unitLabel} · ${course.academicInstitution.name} · ${course.academicLevel.title} · ${course.academicSemester.title}`,
    imageSrc: "",
    completedDocs: completed,
    totalDocs: total,
    status: course.access.enrollmentStatus === "completed" ? "COMPLETED" : course.access.canOpen ? "IN PROGRESS" : "ENROLLED",
    opened: progress?.lastActivityAt ? `Last activity ${new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(new Date(progress.lastActivityAt))}` : "No learning activity yet",
  };
}
