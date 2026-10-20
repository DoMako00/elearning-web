import { requireApiClient, extractApiErrorMessage } from "../../../app/api/client";

export interface StudentProgressCourseDto {
  courseId: string;
  title: string;
  completedLessons: number;
  totalLessons: number;
  completionPercent: number;
  lastActivityAt: string | null;
}

export interface StudentProgressSnapshotDto {
  studentProfileId: string;
  totalCompletedLessons: number;
  totalLessons: number;
  completionPercent: number;
  currentStreakDays: number;
  longestStreakDays: number;
  totalActiveDays: number;
  weeklyGoalLessons: number | null;
  weeklyCompletedLessons: number;
  weekStartsAt: string;
  weekDays: Array<{ date: string; completedLessons: number }>;
  courses: StudentProgressCourseDto[];
  recentActivity: Array<{
    courseId: string;
    courseTitle: string;
    lessonId: string;
    lessonTitle: string;
    status: "in_progress" | "completed";
    occurredAt: string;
  }>;
}

export interface StudentProfileDto {
  studentProfileId: string;
  fullName: string;
  phone: string | null;
  verifiedEmail: string | null;
  accountStatus: "active" | "pending" | "disabled" | "suspended";
  claimStatus: "not_issued" | "unclaimed" | "claimed";
  brand: { id: string; code: string; name: string };
  institution: { id: string; code: string; name: string };
  level: { id: string; levelNumber: number; title: string };
  semester: { id: string; semesterNumber: number; title: string };
  studentCode: string | null;
  version: number;
}

export interface StudentLearningPreferencesDto {
  weeklyLessonGoal: number | null;
  notificationPreferences: StudentNotificationPreferencesDto;
  version: number | null;
}

export interface StudentNotificationPreferencesDto {
  assignmentDeadlines: boolean;
  lessonReminders: boolean;
  dailyStreakWarnings: boolean;
  directMessages: boolean;
  mentionsInCommunity: boolean;
  repliesToPosts: boolean;
  securityAlerts: boolean;
  billingUpdates: boolean;
}

export interface StudentLearningPathDto {
  id: string;
  title: string;
  description: string;
  levelTitle: string;
  courseCount: number;
  updatedAt: string;
}

export interface StudentLearningPathDetailDto {
  path: StudentLearningPathDto;
  courses: Array<{ courseId: string; title: string; code: string; semesterNumber: number; semesterTitle: string; unitLabel: "Subject" | "Module" }>;
}

export interface StudentAchievementAwardDto { id: string; code: string; title: string; description: string; awardedAt: string }
export interface StudentCertificateSummaryDto { id: string; courseId: string; courseTitle: string; credentialCode: string; issuedAt: string; status: "issued" | "revoked" }
export interface StudentLessonNoteDto { lessonId: string; body: string; version: number | null; updatedAt: string | null }

interface StudentApiEnvelope<T> {
  ok: true;
  correlationId: string;
  data: T;
}

/** Carries the HTTP status and backend error code so callers can tell a
 * membership/scope rejection apart from a connectivity failure. */
export class StudentLearningApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(message: string, status: number, code = "unknown_error") {
    super(message);
    this.name = "StudentLearningApiError";
    this.status = status;
    this.code = code;
  }
}

function apiErrorCode(error: unknown): string {
  const nested = (error as { error?: { code?: unknown } } | null | undefined)?.error?.code;
  return typeof nested === "string" ? nested : "unknown_error";
}

async function getData<T>(path: string, signal?: AbortSignal): Promise<T> {
  const client = await requireApiClient();
  const result = await client.getJson<StudentApiEnvelope<T>>(path, { signal });
  if (result.error) throw new StudentLearningApiError(extractApiErrorMessage(result.error, "Student data could not be loaded."), result.response.status, apiErrorCode(result.error));
  if (!result.data) throw new Error("The learning API returned an incomplete response.");
  return result.data.data;
}

async function writeData<T>(method: "POST" | "PATCH" | "PUT" | "DELETE", path: string, body?: unknown, signal?: AbortSignal): Promise<T> {
  const client = await requireApiClient();
  const result = await client.writeJson<StudentApiEnvelope<T>>(method, path, body, { signal });
  if (result.error) throw new StudentLearningApiError(extractApiErrorMessage(result.error, "Student data could not be saved."), result.response.status, apiErrorCode(result.error));
  if (!result.data) throw new Error("The learning API returned an incomplete response.");
  return result.data.data;
}

export const studentLearningApi = {
  getProfile(signal?: AbortSignal) {
    return getData<StudentProfileDto>("/v1/student/me", signal);
  },
  updateProfile(input: { fullName: string; phone: string | null; expectedVersion: number }, signal?: AbortSignal) {
    return writeData<{ fullName: string; phone: string | null; version: number }>("PATCH", "/v1/student/me", input, signal);
  },
  getProgress(signal?: AbortSignal) {
    return getData<StudentProgressSnapshotDto>("/v1/student/progress", signal);
  },
  getPreferences(signal?: AbortSignal) {
    return getData<StudentLearningPreferencesDto>("/v1/student/preferences", signal);
  },
  setWeeklyLessonGoal(input: { weeklyLessonGoal: number | null; expectedVersion: number | null }, signal?: AbortSignal) {
    return writeData<StudentLearningPreferencesDto>("PATCH", "/v1/student/preferences", input, signal);
  },
  setNotificationPreferences(input: { notificationPreferences: StudentNotificationPreferencesDto; expectedVersion: number | null }, signal?: AbortSignal) {
    return writeData<StudentLearningPreferencesDto>("PATCH", "/v1/student/preferences", input, signal);
  },
  updateLessonProgress(lessonId: string, status: "in_progress" | "completed", signal?: AbortSignal) {
    return writeData<{ lessonId: string; courseId: string; status: "in_progress" | "completed"; startedAt: string; completedAt: string | null; version: number }>("PUT", `/v1/student/lessons/${encodeURIComponent(lessonId)}/progress`, { status }, signal);
  },
  getLessonNote(lessonId: string, signal?: AbortSignal) {
    return getData<StudentLessonNoteDto>(`/v1/student/lessons/${encodeURIComponent(lessonId)}/notes`, signal);
  },
  saveLessonNote(input: { lessonId: string; body: string; expectedVersion: number | null }, signal?: AbortSignal) {
    return writeData<StudentLessonNoteDto>("PUT", `/v1/student/lessons/${encodeURIComponent(input.lessonId)}/notes`, { body: input.body, expectedVersion: input.expectedVersion }, signal);
  },
  listSavedCourses(signal?: AbortSignal) {
    return getData<Array<{ courseId: string; title: string; code: string; savedAt: string }>>("/v1/student/saved-courses", signal);
  },
  listLearningPaths(signal?: AbortSignal) {
    return getData<StudentLearningPathDto[]>("/v1/student/learning-paths", signal);
  },
  getLearningPath(learningPathId: string, signal?: AbortSignal) {
    return getData<StudentLearningPathDetailDto>(`/v1/student/learning-paths/${encodeURIComponent(learningPathId)}`, signal);
  },
  listAchievementAwards(signal?: AbortSignal) {
    return getData<StudentAchievementAwardDto[]>("/v1/student/achievements", signal);
  },
  listCertificates(signal?: AbortSignal) {
    return getData<StudentCertificateSummaryDto[]>("/v1/student/certificates", signal);
  },
  async getCertificateDocument(certificateId: string, signal?: AbortSignal): Promise<Blob> {
    const client = await requireApiClient();
    const result = await client.getBlob(`/v1/student/certificates/${encodeURIComponent(certificateId)}/document`, { signal });
    if (result.error) throw new Error(extractApiErrorMessage(result.error, "The issued certificate could not be opened."));
    if (!result.data || result.response.headers.get("content-type")?.split(";")[0]?.trim() !== "image/svg+xml") {
      throw new Error("The certificate document response was invalid.");
    }
    return result.data;
  },
  saveCourse(courseId: string, signal?: AbortSignal) {
    return writeData<{ courseId: string; saved: true }>("PUT", `/v1/student/saved-courses/${encodeURIComponent(courseId)}`, {}, signal);
  },
  unsaveCourse(courseId: string, signal?: AbortSignal) {
    return writeData<{ courseId: string; saved: false }>("DELETE", `/v1/student/saved-courses/${encodeURIComponent(courseId)}`, undefined, signal);
  },
};
