import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../../app/providers/AuthProvider";
import { belongsToStudentScope, useStudentScope, type StudentScope } from "../scope/StudentScopeProvider";
import {
  getStudentCourse,
  listAllStudentCourses,
  listStudentCourseLessons,
  StudentCoursesApiError,
  type StudentCourseItem,
} from "./studentCoursesApi";

export type StudentCourseView = "mine" | "explore";

/** Every course key carries the active Brand, so a response fetched for one
 * scope can never be served from cache for another. */
export const studentCourseKeys = {
  all: ["student", "courses"] as const,
  list: (view: StudentCourseView, brand: string) => ["student", "courses", view, brand] as const,
  detail: (courseId: string, brand: string) => ["student", "course", courseId, brand] as const,
  lessons: (courseId: string, brand: string) => ["student", "course", courseId, brand, "lessons"] as const,
};

/** Drops any course that does not belong to the student's verified
 * Brand/Institution. The server is the authority on scope; this guarantees
 * a mismatched record can never be displayed as part of this membership. */
export function keepInStudentScope<T extends Pick<StudentCourseItem, "brand" | "academicInstitution">>(scope: StudentScope, items: readonly T[]): T[] {
  const kept = items.filter((item) => belongsToStudentScope(scope, item));
  if (kept.length !== items.length && import.meta.env.DEV) {
    console.warn(`[student-scope] Dropped ${items.length - kept.length} course(s) outside ${scope.brand}/${scope.institutionCode}.`);
  }
  return kept;
}

export function fetchScopedCourseList(scope: StudentScope, view: StudentCourseView, signal?: AbortSignal) {
  return listAllStudentCourses({ view, brand: scope.brand, signal }).then((items) => keepInStudentScope(scope, items));
}

export async function fetchScopedCourseDetail(scope: StudentScope, courseId: string, signal?: AbortSignal) {
  const course = await getStudentCourse({ courseId, brand: scope.brand, signal });
  if (!belongsToStudentScope(scope, course)) {
    throw new StudentCoursesApiError("This course is not part of your learning membership.", 404, "scope_mismatch");
  }
  return course;
}

export function fetchScopedCourseLessons(scope: StudentScope, courseId: string, signal?: AbortSignal) {
  return listStudentCourseLessons({ courseId, brand: scope.brand, signal });
}

export function useStudentCourseList(view: StudentCourseView) {
  const auth = useAuth();
  const scope = useStudentScope();
  return useQuery({
    queryKey: studentCourseKeys.list(view, scope.brand),
    queryFn: ({ signal }) => fetchScopedCourseList(scope, view, signal),
    enabled: auth.status === "authenticated",
  });
}

export function useStudentCourseDetail(courseId: string | undefined) {
  const auth = useAuth();
  const scope = useStudentScope();
  return useQuery({
    queryKey: studentCourseKeys.detail(courseId ?? "", scope.brand),
    queryFn: ({ signal }) => fetchScopedCourseDetail(scope, courseId!, signal),
    enabled: auth.status === "authenticated" && Boolean(courseId),
  });
}
