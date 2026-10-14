import { extractApiErrorMessage, requireApiClient } from "../../../app/api/client";

export interface StudentAssessmentQuestionDto {
  id: string;
  questionType: "single_choice" | "multiple_choice" | "true_false" | "free_text";
  prompt: string;
  options: unknown[];
  points: number;
  sortOrder: number;
}
export interface StudentAssessmentAttemptDto {
  id: string;
  attemptNumber: number;
  status: "in_progress" | "submitted" | "scored" | "expired";
  startedAt: string;
  submittedAt: string | null;
  score: number | null;
  version: number;
}
export interface StudentAssessmentDto {
  id: string;
  title: string;
  kind: "quiz" | "exam";
  courseId: string | null;
  courseTitle: string | null;
  availableFrom: string | null;
  availableUntil: string | null;
  attemptsAllowed: number;
  attemptsUsed: number;
  timeLimitSeconds: number | null;
  status: "upcoming" | "available" | "closed";
  latestAttempt: StudentAssessmentAttemptDto | null;
}
export interface StudentAssessmentDetailDto {
  assessment: StudentAssessmentDto;
  questions: StudentAssessmentQuestionDto[];
}
export interface StudentAssessmentAttemptDetailDto {
  attempt: StudentAssessmentAttemptDto;
  questions: StudentAssessmentQuestionDto[];
}
interface Envelope<T> { ok: true; data: T; }

async function request<T>(method: "GET" | "POST", path: string, body?: unknown, signal?: AbortSignal): Promise<T> {
  const client = await requireApiClient();
  const result = method === "GET"
    ? await client.getJson<Envelope<T>>(path, { signal })
    : await client.writeJson<Envelope<T>>("POST", path, body, { signal });
  if (result.error) throw new Error(extractApiErrorMessage(result.error, "Assessment data could not be loaded."));
  if (!result.data) throw new Error("The assessment API returned an incomplete response.");
  return result.data.data;
}

export const studentAssessmentApi = {
  list: (signal?: AbortSignal) => request<StudentAssessmentDto[]>("GET", "/v1/student/assessments", undefined, signal),
  detail: (assessmentId: string, signal?: AbortSignal) => request<StudentAssessmentDetailDto>("GET", `/v1/student/assessments/${encodeURIComponent(assessmentId)}`, undefined, signal),
  start: (assessmentId: string, attemptId: string, signal?: AbortSignal) => request<StudentAssessmentAttemptDetailDto>("POST", `/v1/student/assessments/${encodeURIComponent(assessmentId)}/attempts`, { attemptId }, signal),
  submit: (assessmentId: string, attemptId: string, expectedVersion: number, answers: Array<{ questionId: string; answer: unknown }>, signal?: AbortSignal) => request<StudentAssessmentAttemptDto>("POST", `/v1/student/assessments/${encodeURIComponent(assessmentId)}/attempts/${encodeURIComponent(attemptId)}/submit`, { expectedVersion, answers }, signal),
};
