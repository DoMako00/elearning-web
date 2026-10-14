import { extractApiErrorMessage, requireApiClient } from "../../../app/api/client";

interface Envelope<T> { ok: true; correlationId: string; data: T }
export interface AdminAssignmentDto {
  id: string; brandCode: string; title: string; status: "draft" | "published" | "closed" | "archived";
  availableFrom: string | null; dueAt: string | null; maxScore: number | null; version: number;
  academicInstitutionId: string; academicLevelId: string; academicSemesterId: string;
  brandCourseId: string | null; courseTitle: string | null; submissionCount: number; needsReviewCount: number;
}
export interface AdminAssignmentSubmissionDto {
  id: string; studentProfileId: string; studentName: string | null; responseText: string;
  status: "submitted" | "reviewed" | "returned"; submittedAt: string; score: number | null;
  feedback: string | null; version: number; reviewedAt: string | null;
  attachments: Array<{ id: string; originalFilename: string; contentType: string; size: number; status: "verified" }>;
}
export interface AdminAssignmentSubmissionsDto {
  assignment: { id: string; title: string; maxScore: number | null };
  items: AdminAssignmentSubmissionDto[];
}

async function request<T>(method: "GET" | "POST", path: string, body?: unknown, headers?: Record<string, string>, signal?: AbortSignal): Promise<T> {
  const api = await requireApiClient();
  const result = method === "GET"
    ? await api.getJson<Envelope<T>>(path, { signal })
    : await api.writeJson<Envelope<T>>(method, path, body, { headers });
  if (result.error) throw new Error(extractApiErrorMessage(result.error, "Assignment review request failed."));
  if (!result.data) throw new Error("The Assignment API returned an incomplete response.");
  return result.data.data;
}

export const adminAssignmentsApi = {
  list: (signal?: AbortSignal) => request<{ items: AdminAssignmentDto[] }>("GET", "/v1/admin/assignments", undefined, undefined, signal),
  submissions: (assignmentId: string, signal?: AbortSignal) => request<AdminAssignmentSubmissionsDto>("GET", `/v1/admin/assignments/${encodeURIComponent(assignmentId)}/submissions`, undefined, undefined, signal),
  async openAttachment(assignmentId: string, submissionId: string, attachmentId: string): Promise<string> {
    const api = await requireApiClient();
    const result = await api.getJson<Envelope<{ attachment: { id: string }; delivery: { url: string } }>>(`/v1/admin/assignments/${encodeURIComponent(assignmentId)}/submissions/${encodeURIComponent(submissionId)}/attachments/${encodeURIComponent(attachmentId)}`);
    if (result.error) throw new Error(extractApiErrorMessage(result.error, "The protected submission attachment could not be opened."));
    const url = result.data?.data.delivery.url;
    if (!url || !url.startsWith("https://")) throw new Error("The protected attachment response was invalid.");
    return url;
  },
  review: (assignmentId: string, submissionId: string, input: { expectedVersion: number; status: "reviewed" | "returned"; score: number | null; feedback: string | null; reason: string }) => request<{ assignmentId: string; submissionId: string; status: "reviewed" | "returned"; score: number | null; feedback: string | null; version: number }>("POST", `/v1/admin/assignments/${encodeURIComponent(assignmentId)}/submissions/${encodeURIComponent(submissionId)}/review`, input, { "Idempotency-Key": crypto.randomUUID() }),
};
