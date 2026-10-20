import { useCallback, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { DashboardEnrollmentState } from "../../../app/config/env";
import { useAuth } from "../../../app/providers/AuthProvider";
import { canViewCourseDetails, type StudentCourseItem } from "../api/studentCoursesApi";
import { fetchScopedCourseList, studentCourseKeys } from "../api/useStudentCourses";
import { classifyStudentApiError, type ClassifiedStudentApiError } from "../api/studentApiErrors";
import { useStudentScope } from "../scope/StudentScopeProvider";

export interface DashboardEnrollment {
  id: string;
}

export interface DashboardEnrollmentViewModel {
  status: DashboardEnrollmentState;
  enrolledCourses: DashboardEnrollment[];
  courses: StudentCourseItem[];
  error?: ClassifiedStudentApiError;
}

function isEnrolledCourse(course: StudentCourseItem): boolean {
  return canViewCourseDetails(course);
}

function toEnrollment(course: StudentCourseItem): DashboardEnrollment {
  return { id: course.courseId };
}

export function useDashboardEnrollment() {
  const auth = useAuth();
  const scope = useStudentScope();
  const [retryIndex, setRetryIndex] = useState(0);
  const [viewModel, setViewModel] = useState<DashboardEnrollmentViewModel>({
    status: "loading",
    enrolledCourses: [],
    courses: [],
  });

  const retry = useCallback(() => {
    setRetryIndex((current) => current + 1);
  }, []);

  useEffect(() => {
    if (auth.status === "loading") {
      setViewModel({ status: "loading", enrolledCourses: [], courses: [] });
      return;
    }

    if (auth.status !== "authenticated") {
      setViewModel({ status: "empty", enrolledCourses: [], courses: [] });
      return;
    }

    const controller = new AbortController();
    setViewModel({ status: "loading", enrolledCourses: [], courses: [] });
    void fetchScopedCourseList(scope, "mine", controller.signal)
      .then((courses) => {
        if (controller.signal.aborted) return;
        const enrolledCourses = courses.filter(isEnrolledCourse).map(toEnrollment);
        setViewModel({ status: enrolledCourses.length ? "enrolled" : "empty", enrolledCourses, courses });
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setViewModel({ status: "error", enrolledCourses: [], courses: [], error: classifyStudentApiError(error) });
      });
    return () => controller.abort();
  }, [auth.status, scope, retryIndex]);

  return { ...viewModel, retry };
}

/** Explore is a separate real catalogue read: the enrolled-course list cannot supply recommendations. */
export function useStudentExploreCourses() {
  const auth = useAuth();
  const scope = useStudentScope();
  return useQuery({
    queryKey: studentCourseKeys.list("explore", scope.brand),
    queryFn: ({ signal }) => fetchScopedCourseList(scope, "explore", signal),
    enabled: auth.status === "authenticated",
  });
}
