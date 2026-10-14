import { listAllStudentCourses } from "../student/api/studentCoursesApi";
import { studentAssignmentsApi } from "../student/api/studentAssignmentsApi";
import { studentLearningApi } from "../student/api/studentLearningApi";

function localDateStamp(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Cairo" }).format(date);
}

/** Builds an owner-scoped export from existing API records; no browser domain cache is used. */
export async function downloadStudentAccountData(): Promise<void> {
  const [profile, progress, preferences, savedCourses, certificates, assignments, courses] = await Promise.all([
    studentLearningApi.getProfile(),
    studentLearningApi.getProgress(),
    studentLearningApi.getPreferences(),
    studentLearningApi.listSavedCourses(),
    studentLearningApi.listCertificates(),
    studentAssignmentsApi.list(),
    listAllStudentCourses({ view: "mine" }),
  ]);

  const exportData = {
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    profile: {
      fullName: profile.fullName,
      phone: profile.phone,
      verifiedEmail: profile.verifiedEmail,
      accountStatus: profile.accountStatus,
      claimStatus: profile.claimStatus,
      brand: profile.brand,
      institution: profile.institution,
      level: profile.level,
      semester: profile.semester,
      studentCode: profile.studentCode,
    },
    preferences,
    progress: {
      totalCompletedLessons: progress.totalCompletedLessons,
      totalLessons: progress.totalLessons,
      completionPercent: progress.completionPercent,
      currentStreakDays: progress.currentStreakDays,
      longestStreakDays: progress.longestStreakDays,
      totalActiveDays: progress.totalActiveDays,
      weeklyGoalLessons: progress.weeklyGoalLessons,
      weeklyCompletedLessons: progress.weeklyCompletedLessons,
      weekStartsAt: progress.weekStartsAt,
      weekDays: progress.weekDays,
      courses: progress.courses,
      recentActivity: progress.recentActivity,
    },
    savedCourses,
    courses: courses.map((course) => ({
      courseId: course.courseId,
      title: course.title,
      code: course.code,
      brand: course.brand,
      academicInstitution: course.academicInstitution,
      academicLevel: course.academicLevel,
      academicSemester: course.academicSemester,
      unitLabel: course.unitLabel,
      access: course.access,
      chapterCount: course.chapterCount,
      lessonCount: course.lessonCount,
      mediaSummary: course.mediaSummary,
    })),
    assignments: assignments.map((assignment) => ({
      id: assignment.id,
      title: assignment.title,
      courseId: assignment.courseId,
      courseTitle: assignment.courseTitle,
      availableFrom: assignment.availableFrom,
      dueAt: assignment.dueAt,
      status: assignment.status,
      submission: assignment.submission,
    })),
    issuedCertificates: certificates,
  };

  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json;charset=utf-8" });
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = `student-learning-data-${localDateStamp(new Date())}.json`;
  anchor.style.display = "none";
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1_000);
}
