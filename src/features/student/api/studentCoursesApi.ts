import { ApiClientUnauthenticatedError, extractApiErrorMessage, requireApiClient } from "../../../app/api/client";

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
  readonly resourceType: "video" | "pdf" | null;
  readonly resourceTitle: string | null;
  readonly resourceId: string | null;
  readonly playbackAvailable: boolean;
  readonly progressStatus: "not_started" | "in_progress" | "completed";
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

export interface StudentProtectedMediaDelivery {
  readonly assetId: string;
  readonly delivery: { readonly url: string; readonly expiresAt: string };
  readonly policy: { readonly documentDeliveryMode?: "inline" | "attachment" | null; readonly watermarkRequired: boolean };
  readonly watermark: { readonly required: boolean; readonly resourceReference: string; readonly sessionReference?: string };
}

export interface StudentVideoPlaybackState {
  readonly playbackSessionId: string;
  readonly durationSeconds: number;
  readonly completedViews: number;
  readonly maxCompletedViews: number;
  readonly viewsRemaining: number;
  readonly furthestPositionSeconds: number;
  readonly completed: boolean;
}

export interface StudentVideoPlaybackStart extends Omit<StudentProtectedMediaDelivery, "policy"> {
  readonly playback: StudentVideoPlaybackState;
  readonly policy: { readonly watermarkRequired: boolean };
}

interface ApiEnvelope<T> {
  readonly ok?: boolean;
  readonly correlationId?: unknown;
  readonly data?: T;
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

async function studentRequest<T>(path: string, signal?: AbortSignal): Promise<T> {
  let client;
  try {
    client = await requireApiClient();
  } catch (error) {
    if (error instanceof ApiClientUnauthenticatedError) throw new StudentCoursesApiError("Sign in to view your courses.", 401, "unauthenticated");
    throw new StudentCoursesApiError("The learning API could not be reached.", 0, "network_error");
  }

  let result;
  try {
    result = await client.getJson<ApiEnvelope<T>>(path, { signal });
  } catch {
    throw new StudentCoursesApiError("The learning API could not be reached.", 0, "network_error");
  }

  const envelope = result.data;
  if (result.error || !envelope?.ok || envelope.data === undefined) {
    const error = result.error as { error?: { code?: unknown } } | undefined;
    const code = typeof error?.error?.code === "string" ? error.error.code : "unknown_error";
    throw new StudentCoursesApiError(
      extractApiErrorMessage(result.error, "The learning API request failed."),
      result.response.status,
      code,
    );
  }

  return envelope.data;
}

async function studentWrite<T>(path: string, body: unknown, options: Readonly<{ signal?: AbortSignal; idempotencyKey?: string }> = {}): Promise<T> {
  let client;
  try { client = await requireApiClient(); }
  catch (error) {
    if (error instanceof ApiClientUnauthenticatedError) throw new StudentCoursesApiError("Sign in to continue.", 401, "unauthenticated");
    throw new StudentCoursesApiError("The learning API could not be reached.", 0, "network_error");
  }
  let result;
  try {
    result = await client.writeJson<ApiEnvelope<T>>("POST", path, body, {
      signal: options.signal,
      headers: options.idempotencyKey ? { "Idempotency-Key": options.idempotencyKey } : undefined,
    });
  } catch { throw new StudentCoursesApiError("The learning API could not be reached.", 0, "network_error"); }
  const envelope = result.data;
  if (result.error || !envelope?.ok || envelope.data === undefined) {
    const error = result.error as { error?: { code?: unknown } } | undefined;
    const code = typeof error?.error?.code === "string" ? error.error.code : "unknown_error";
    throw new StudentCoursesApiError(extractApiErrorMessage(result.error, "The learning API request failed."), result.response.status, code);
  }
  return envelope.data;
}

export function listStudentCourses(input: Readonly<{ brand?: StudentCommercialBrand; view?: "explore" | "mine"; page?: number; pageSize?: number; signal?: AbortSignal }>) {
  const query = new URLSearchParams({
    page: String(input.page ?? 1),
    pageSize: String(input.pageSize ?? 25),
  });
  if (input.brand) query.set("brand", input.brand);
  if (input.view) query.set("view", input.view);
  return studentRequest<StudentCourseList>(`/v1/student/courses?${query}`, input.signal);
}

export async function listAllStudentCourses(input: Readonly<{ brand?: StudentCommercialBrand; view?: "explore" | "mine"; signal?: AbortSignal }>) {
  const first = await listStudentCourses({ ...input, page: 1, pageSize: 100 });
  const pageCount = Math.max(1, Math.ceil(first.pagination.totalItems / first.pagination.pageSize));
  const remaining = await Promise.all(Array.from({ length: pageCount - 1 }, (_, index) =>
    listStudentCourses({ ...input, page: index + 2, pageSize: 100 }),
  ));
  return [...first.items, ...remaining.flatMap((page) => page.items)];
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

/** Returns a short-lived URL only after the backend rechecks Student session, device, Seat, grant, and release state. */
export function getStudentProtectedMedia(input: Readonly<{ assetId: string; signal?: AbortSignal }>) {
  return studentRequest<StudentProtectedMediaDelivery>(`/v1/student/media/${encodeURIComponent(input.assetId)}`, input.signal);
}

export function startStudentVideoPlayback(input: Readonly<{ assetId: string; signal?: AbortSignal }>) {
  return studentWrite<StudentVideoPlaybackStart>(
    `/v1/student/media/${encodeURIComponent(input.assetId)}/playback`,
    {},
    { signal: input.signal, idempotencyKey: crypto.randomUUID() },
  );
}

export function reportStudentVideoPlaybackHeartbeat(input: Readonly<{ assetId: string; playbackSessionId: string; positionSeconds: number; signal?: AbortSignal }>) {
  return studentWrite<{ playback: StudentVideoPlaybackState }>(
    `/v1/student/media/${encodeURIComponent(input.assetId)}/playback/${encodeURIComponent(input.playbackSessionId)}/heartbeat`,
    { positionSeconds: input.positionSeconds },
    { signal: input.signal },
  );
}

export function completeStudentVideoPlayback(input: Readonly<{ assetId: string; playbackSessionId: string; signal?: AbortSignal }>) {
  return studentWrite<{ playback: StudentVideoPlaybackState }>(
    `/v1/student/media/${encodeURIComponent(input.assetId)}/playback/${encodeURIComponent(input.playbackSessionId)}/complete`,
    {},
    { signal: input.signal },
  );
}
