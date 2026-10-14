import { extractApiErrorMessage, requireApiClient } from "../../../app/api/client";

export type AssessmentKind = "quiz" | "exam";
export type AssessmentStatus = "draft" | "published" | "closed" | "archived";
export type AssessmentQuestionType = "single_choice" | "multiple_choice" | "true_false" | "free_text";
export interface AdminAssessmentDto { id: string; brandCode: string; title: string; kind: AssessmentKind; status: AssessmentStatus; availableFrom: string | null; availableUntil: string | null; attemptsAllowed: number; timeLimitSeconds: number | null; version: number; academicInstitutionId: string; academicLevelId: string; academicSemesterId: string; brandCourseId: string | null; courseTitle: string | null; questionCount?: number; attemptCount?: number; }
export interface AdminAssessmentQuestionDto { id: string; questionType: AssessmentQuestionType; prompt: string; options: unknown[]; answerKey: unknown; points: number; sortOrder: number; version: number; }
export interface AdminAssessmentAttemptDto { id: string; studentProfileId: string; studentName: string | null; attemptNumber: number; status: "in_progress" | "submitted" | "scored" | "expired"; startedAt: string; submittedAt: string | null; originalScore: number | null; score: number | null; overrideReason: string | null; overriddenAt: string | null; version: number; answerCount: number; }
export interface AdminAssessmentDetailDto { assessment: AdminAssessmentDto; questions: AdminAssessmentQuestionDto[]; }
type Envelope<T> = { ok: true; correlationId: string; data: T };
const key = () => crypto.randomUUID();
async function request<T>(make: (api: Awaited<ReturnType<typeof requireApiClient>>) => Promise<any>): Promise<T> {
  const result = await make(await requireApiClient());
  if (result.error) throw new Error(extractApiErrorMessage(result.error, "The Admin assessment request failed."));
  const envelope = result.data as Envelope<T> | undefined;
  if (!envelope?.data) throw new Error("The assessment API returned an incomplete response.");
  return envelope.data;
}

export const adminAssessmentApi = {
  list: (signal?: AbortSignal) => request<{ items: AdminAssessmentDto[] }>((api) => api.GET("/v1/admin/assessments" as never, { signal } as never)),
  detail: (id: string, signal?: AbortSignal) => request<AdminAssessmentDetailDto>((api) => api.GET("/v1/admin/assessments/{assessmentId}" as never, { params: { path: { assessmentId: id } }, signal } as never)),
  attempts: (id: string, signal?: AbortSignal) => request<{ items: AdminAssessmentAttemptDto[] }>((api) => api.GET("/v1/admin/assessments/{assessmentId}/attempts" as never, { params: { path: { assessmentId: id } }, signal } as never)),
  create: (brandId: string, body: { assessmentId: string; brandCourseId: string | null; academicInstitutionId: string; academicLevelId: string; academicSemesterId: string; title: string; kind: AssessmentKind; availableFrom: string | null; availableUntil: string | null; attemptsAllowed: number; timeLimitSeconds: number | null }) => request<{ assessmentId: string; status: "draft"; version: number }>((api) => api.POST(`/v1/admin/assessments?brandId=${encodeURIComponent(brandId)}` as never, { headers: { "Idempotency-Key": key() }, body } as never)),
  update: (id: string, body: { expectedVersion: number; title?: string; kind?: AssessmentKind; availableFrom?: string | null; availableUntil?: string | null; attemptsAllowed?: number; timeLimitSeconds?: number | null; status?: AssessmentStatus }) => request<{ assessmentId: string; status: AssessmentStatus; version: number }>((api) => api.PATCH("/v1/admin/assessments/{assessmentId}" as never, { params: { path: { assessmentId: id } }, headers: { "Idempotency-Key": key() }, body } as never)),
  replaceQuestions: (id: string, expectedVersion: number, questions: Array<Omit<AdminAssessmentQuestionDto, "version">>) => request<{ assessmentId: string; questionCount: number; version: number }>((api) => api.writeJson("PUT", `/v1/admin/assessments/${encodeURIComponent(id)}/questions`, { expectedVersion, questions }, { headers: { "Idempotency-Key": key() } })),
  overrideScore: (assessmentId: string, attemptId: string, body: { expectedVersion: number; score: number; reason: string }) => request<{ assessmentId: string; attemptId: string; originalScore: number; score: number; reason: string; overriddenAt: string; version: number }>((api) => api.writeJson("POST", `/v1/admin/assessments/${encodeURIComponent(assessmentId)}/attempts/${encodeURIComponent(attemptId)}/score-override`, body, { headers: { "Idempotency-Key": key() } })),
};
