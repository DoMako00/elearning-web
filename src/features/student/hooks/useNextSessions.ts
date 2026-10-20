import { useQueries } from "@tanstack/react-query";
import { useAuth } from "../../../app/providers/AuthProvider";
import { useStudentScope } from "../scope/StudentScopeProvider";
import { canViewCourseDetails, type StudentCourseDetail, type StudentCourseItem } from "../api/studentCoursesApi";
import { fetchScopedCourseDetail, studentCourseKeys } from "../api/useStudentCourses";

export function nextSession(course: StudentCourseDetail) {
  const lessons = [...course.chapters].sort((a,b) => a.sortOrder-b.sortOrder)
    .flatMap(chapter => [...chapter.lessons].sort((a,b) => a.sortOrder-b.sortOrder));
  const index = lessons.findIndex(lesson => lesson.progressStatus !== "completed");
  return { lesson: index < 0 ? null : lessons[index], number: index + 1, allCompleted: lessons.length > 0 && index < 0 };
}

/** One shared detail query per assigned module; progress mutations invalidate these keys. */
export function useNextSessions(courses: readonly StudentCourseItem[]) {
  const scope = useStudentScope();
  const auth = useAuth();
  const assigned = courses.filter(canViewCourseDetails);
  const queries = useQueries({queries: assigned.map(course => ({
    queryKey: studentCourseKeys.detail(course.courseId, scope.brand),
    queryFn: ({signal}: {signal: AbortSignal}) => fetchScopedCourseDetail(scope, course.courseId, signal),
    enabled: auth.status === "authenticated",
  }))});
  return assigned.map((course,index) => ({course, query: queries[index], next: queries[index].data ? nextSession(queries[index].data) : null}));
}
