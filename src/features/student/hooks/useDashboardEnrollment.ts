import { useCallback, useEffect, useState } from "react";
import type { DashboardEnrollmentState } from "../../../app/config/env";
import { useAuth } from "../../../app/providers/AuthProvider";
import type { StudentCourseItem } from "../api/studentCoursesApi";

export interface DashboardEnrollment {
  id: string;
}

export interface DashboardEnrollmentViewModel {
  status: DashboardEnrollmentState;
  enrolledCourses: DashboardEnrollment[];
  courses: StudentCourseItem[];
}

const STUDENT_DASHBOARD_BRAND = "elite" as const;

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

    void STUDENT_DASHBOARD_BRAND;
    void canOpenCourse; void toEnrollment;

    // [AUTH-MOCK] Mock enrolled courses for previewing DashboardBento:
    const mockCourse: StudentCourseItem = {
      courseId: "mock-course-1",
      title: "Introduction to Clinical Anatomy",
      code: "MED-101",
      brand: { code: "elite", name: "Elite Medical" },
      academicInstitution: { code: "MED", name: "Faculty of Medicine" },
      academicLevel: { levelNumber: 1, title: "Year 1" },
      academicSemester: { semesterNumber: 1, title: "Semester 1" },
      cataloguePresentation: "subject_based",
      unitLabel: "Subject",
      status: "published",
      chapterCount: 4,
      lessonCount: 16,
      mediaSummary: {
        totalLessons: 16,
        lessonsWithMedia: 14,
        pendingMediaLessons: 2,
      },
      access: {
        isEnrolled: true,
        canOpen: true,
        enrollmentStatus: "active",
      },
      updatedAt: new Date().toISOString(),
    };

    setViewModel({
      status: "enrolled",
      enrolledCourses: [{ id: mockCourse.courseId }],
      courses: [mockCourse],
    });
  }, [auth, auth.status, retryIndex]);

  return { ...viewModel, retry };
}
