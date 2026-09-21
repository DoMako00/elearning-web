import { useCallback, useEffect, useState } from "react";
import type { DashboardEnrollmentState } from "../config/env";
import { useAuth } from "../providers/AuthProvider";
import {
  listStudentCourses,
  StudentCoursesApiError,
  type StudentCourseItem,
} from "../../features/student/api/studentCoursesApi";

export interface DashboardEnrollment {
  id: string;
}

export interface DashboardEnrollmentViewModel {
  status: DashboardEnrollmentState;
  enrolledCourses: DashboardEnrollment[];
  courses: StudentCourseItem[];
}

const STUDENT_DASHBOARD_BRAND = "elite" as const;

function toEnrollment(course: StudentCourseItem): DashboardEnrollment {
  return { id: course.courseId };
}

export function useDashboardEnrollment() {
  const auth = useAuth();
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

    listStudentCourses({ brand: STUDENT_DASHBOARD_BRAND, page: 1, pageSize: 25, signal: controller.signal })
      .then((payload) => {
        if (controller.signal.aborted) return;
        const courses = [...payload.items];
        const enrolledCourses = courses.map(toEnrollment);
        setViewModel({
          status: enrolledCourses.length > 0 ? "enrolled" : "empty",
          enrolledCourses,
          courses,
        });
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;

        if (error instanceof StudentCoursesApiError && error.status === 401) {
          auth.signOut();
          setViewModel({ status: "empty", enrolledCourses: [], courses: [] });
          return;
        }

        setViewModel({ status: "error", enrolledCourses: [], courses: [] });
      });

    return () => controller.abort();
  }, [auth, auth.status, retryIndex]);

  return { ...viewModel, retry };
}
