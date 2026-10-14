import { useCallback, useEffect, useState } from "react";
import type { DashboardEnrollmentState } from "../../../app/config/env";
import { useAuth } from "../../../app/providers/AuthProvider";
import { listAllStudentCourses, type StudentCourseItem } from "../api/studentCoursesApi";

export interface DashboardEnrollment {
  id: string;
}

export interface DashboardEnrollmentViewModel {
  status: DashboardEnrollmentState;
  enrolledCourses: DashboardEnrollment[];
  courses: StudentCourseItem[];
}

function canOpenCourse(course: StudentCourseItem): boolean {
  return course.access?.isEnrolled === true;
}

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
    void listAllStudentCourses({ view: "mine", signal: controller.signal })
      .then((courses) => {
        if (controller.signal.aborted) return;
        const enrolledCourses = courses.filter(canOpenCourse).map(toEnrollment);
        setViewModel({ status: enrolledCourses.length ? "enrolled" : "empty", enrolledCourses, courses });
      })
      .catch(() => {
        if (controller.signal.aborted) return;
        setViewModel({ status: "error", enrolledCourses: [], courses: [] });
      });
    return () => controller.abort();
  }, [auth, auth.status, retryIndex]);

  return { ...viewModel, retry };
}
