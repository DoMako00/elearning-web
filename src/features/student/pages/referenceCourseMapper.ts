import { BookOpen } from "lucide-react";
import { COURSE_VISUAL_PRESETS, type StudentCourse } from "../../../components/ui/CourseLibrary/courses.data";
import type { StudentCourseItem } from "../api/studentCoursesApi";
import type { StudentProgressSnapshotDto } from "../api/studentLearningApi";

export function toReferenceCourse(course: StudentCourseItem, progress?: StudentProgressSnapshotDto): StudentCourse {
  const record = progress?.courses.find((item) => item.courseId === course.courseId);
  const activity = progress?.recentActivity.find((item) => item.courseId === course.courseId);
  const visual = COURSE_VISUAL_PRESETS.find((preset) => preset.keywords.some((keyword) => keyword !== "basics" && course.title.toLowerCase().includes(keyword)));
  const completed = course.access.enrollmentStatus === "completed" || (record?.completionPercent ?? 0) >= 100;
  return {
    id: course.courseId, slug: course.courseId, title: course.title,
    subtitle: `${course.academicInstitution.name} · ${course.academicLevel.title} · ${course.academicSemester.title}`,
    category: course.unitLabel, categoryId: course.unitLabel.toLowerCase(), level: course.academicLevel.title,
    progress: progress ? record?.completionPercent ?? 0 : null,
    completedLessons: record?.completedLessons ?? 0, totalLessons: record?.totalLessons ?? course.lessonCount,
    lessonText: activity?.lessonTitle ?? `${course.lessonCount} lessons`,
    opened: activity ? `Last studied ${new Intl.DateTimeFormat(undefined, {dateStyle: "medium"}).format(new Date(activity.occurredAt))}` : "No lesson activity yet",
    art: visual?.art ?? "generic", image: visual?.image ?? "", heroOverlay: visual?.heroOverlay ?? "", Icon: visual?.Icon ?? BookOpen,
    status: completed ? "completed" : "in-progress", instructor: null,
    summary: course.code, access: course.access,
  };
}
