import { env } from "../../../app/config/env";
import { getSupabaseAccessToken } from "../../auth/api/supabaseAuth";

export type StudentCommercialBrand = "medway" | "elite" | "nexus";
export type CataloguePresentation = "subject_based" | "module_based";
export type LessonMediaStatus = "no_media" | "pending_media" | "ready";
export type StudentCourseEnrollmentStatus = "active" | "completed";

export interface StudentCourseAccess {
  readonly isEnrolled: boolean;
  readonly canOpen: boolean;
  readonly enrollmentStatus: StudentCourseEnrollmentStatus | null;
}

export interface StudentLessonItem {
  readonly lessonId: string;
  readonly chapterId: string;
  readonly title: string;
  readonly sortOrder: number;
  readonly status: "published";
  readonly mediaStatus: LessonMediaStatus;
  readonly resourceId: string | null;
  readonly playbackAvailable: false;
}

export interface StudentChapterItem {
  readonly chapterId: string;
  readonly title: string;
  readonly sortOrder: number;
  readonly status: "published";
  readonly lessons: readonly StudentLessonItem[];
}

export interface StudentCourseItem {
  readonly courseId: string;
  readonly title: string;
  readonly code: string;
  readonly brand: { readonly code: StudentCommercialBrand; readonly name: string };
  readonly academicInstitution: { readonly code: string; readonly name: string };
  readonly academicLevel: { readonly levelNumber: number; readonly title: string };
  readonly academicSemester: { readonly semesterNumber: number; readonly title: string };
  readonly cataloguePresentation: CataloguePresentation;
  readonly unitLabel: "Subject" | "Module";
  readonly status: "published";
  readonly chapterCount: number;
  readonly lessonCount: number;
  readonly mediaSummary: {
    readonly totalLessons: number;
    readonly lessonsWithMedia: number;
    readonly pendingMediaLessons: number;
  };
  readonly access: StudentCourseAccess;
  readonly updatedAt: string;
}

export interface StudentCourseDetail extends StudentCourseItem {
  readonly academicUnit: { readonly code: string; readonly label: string };
  readonly chapters: readonly StudentChapterItem[];
}

export interface StudentCourseList {
  readonly items: readonly StudentCourseItem[];
  readonly pagination: { readonly page: number; readonly pageSize: number; readonly totalItems: number };
}

export interface StudentLessonsResponse {
  readonly courseId: string;
  readonly cataloguePresentation: CataloguePresentation;
  readonly unitLabel: "Subject" | "Module";
  readonly lessons: readonly StudentLessonItem[];
}

interface ApiEnvelope {
  readonly ok?: boolean;
  readonly correlationId?: unknown;
  readonly data?: unknown;
  readonly error?: { readonly code?: unknown; readonly message?: unknown };
}

export class StudentCoursesApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(message: string, status: number, code = "unknown_error") {
    super(message);
    this.name = "StudentCoursesApiError";
    this.status = status;
    this.code = code;
  }
}

function apiBaseUrl() {
  const baseUrl = env.apiBaseUrl.trim().replace(/\/$/, "");
  if (!baseUrl) throw new StudentCoursesApiError("The learning API is not configured.", 0, "not_configured");
  return baseUrl;
}

async function studentRequest<T>(path: string, signal?: AbortSignal): Promise<T> {
  const token = await getSupabaseAccessToken();
  if (!token) throw new StudentCoursesApiError("Sign in to view your courses.", 401, "unauthenticated");

  let response: Response;
  try {
    response = await fetch(`${apiBaseUrl()}${path}`, {
      method: "GET",
      signal,
      headers: {
        accept: "application/json",
        authorization: `Bearer ${token}`,
      },
    });
  } catch {
    throw new StudentCoursesApiError("The learning API could not be reached.", 0, "network_error");
  }

  const body = (await response.json().catch(() => ({}))) as ApiEnvelope;
  if (!response.ok || !body.ok || body.data === undefined) {
    const message = typeof body.error?.message === "string" ? body.error.message : "The learning API request failed.";
    const code = typeof body.error?.code === "string" ? body.error.code : "unknown_error";
    throw new StudentCoursesApiError(message, response.status, code);
  }

  return body.data as T;
}

export function listStudentCourses(input: Readonly<{ brand?: StudentCommercialBrand; page?: number; pageSize?: number; signal?: AbortSignal }>) {
  const query = new URLSearchParams({
    page: String(input.page ?? 1),
    pageSize: String(input.pageSize ?? 25),
  });
  if (input.brand) query.set("brand", input.brand);
  return studentRequest<StudentCourseList>(`/v1/student/courses?${query}`, input.signal);
}

export function getStudentCourse(input: Readonly<{ courseId: string; brand?: StudentCommercialBrand; signal?: AbortSignal }>) {
  const query = new URLSearchParams();
  if (input.brand) query.set("brand", input.brand);
  const suffix = query.size > 0 ? `?${query}` : "";
  return studentRequest<StudentCourseDetail>(`/v1/student/courses/${encodeURIComponent(input.courseId)}${suffix}`, input.signal);
}

export function listStudentCourseLessons(input: Readonly<{ courseId: string; brand?: StudentCommercialBrand; signal?: AbortSignal }>) {
  const query = new URLSearchParams();
  if (input.brand) query.set("brand", input.brand);
  const suffix = query.size > 0 ? `?${query}` : "";
  return studentRequest<StudentLessonsResponse>(`/v1/student/courses/${encodeURIComponent(input.courseId)}/lessons${suffix}`, input.signal);
}
