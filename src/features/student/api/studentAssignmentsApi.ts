import { extractApiErrorMessage, requireApiClient } from "../../../app/api/client";

export interface StudentAssignmentDto {
  id: string;
  title: string;
  instructions: string;
  courseId: string | null;
  courseTitle: string | null;
  availableFrom: string | null;
  dueAt: string | null;
  maxScore: number | null;
  status: "open" | "closed";
  submission: null | {
    id: string;
    status: "submitted" | "reviewed" | "returned";
    submittedAt: string;
    score: number | null;
    feedback: string | null;
    version: number;
    attachments: StudentAssignmentAttachmentDto[];
  };
}

export interface StudentAssignmentAttachmentDto {
  id: string;
  originalFilename: string;
  contentType: "application/pdf" | "image/jpeg" | "image/png" | "image/webp";
  size: number;
  status: "pending_upload" | "verified";
}

interface Envelope<T> { ok: true; correlationId: string; data: T; }

async function request<T>(method: "GET" | "POST", path: string, body?: unknown, signal?: AbortSignal): Promise<T> {
  const client = await requireApiClient();
  const result = method === "GET"
    ? await client.getJson<Envelope<T>>(path, { signal })
    : await client.writeJson<Envelope<T>>(method, path, body, { signal });
  if (result.error) throw new Error(extractApiErrorMessage(result.error, "Assignments could not be loaded."));
  if (!result.data) throw new Error("The assignment API returned an incomplete response.");
  return result.data.data;
}

export const studentAssignmentsApi = {
  list(signal?: AbortSignal) {
    return request<StudentAssignmentDto[]>("GET", "/v1/student/assignments", undefined, signal);
  },
  async uploadAttachment(assignmentId: string, file: File, idempotencyKey: string): Promise<StudentAssignmentAttachmentDto> {
    const client = await requireApiClient();
    const created = await client.writeJson<Envelope<{ attachment: StudentAssignmentAttachmentDto }>>(
      "POST",
      `/v1/student/assignments/${encodeURIComponent(assignmentId)}/attachments`,
      { originalFilename: file.name, contentType: file.type, expectedSize: file.size },
      { headers: { "Idempotency-Key": idempotencyKey } },
    );
    if (created.error) throw new Error(extractApiErrorMessage(created.error, "Attachment upload could not be started."));
    const asset = created.data?.data.attachment;
    if (!asset) throw new Error("The attachment API returned incomplete metadata.");

    const upload = await client.writeJson<Envelope<{ attachment: StudentAssignmentAttachmentDto; upload: { url: string }; requiredHeaders: Record<string, string> }>>(
      "POST",
      `/v1/student/assignments/${encodeURIComponent(assignmentId)}/attachments/${encodeURIComponent(asset.id)}/upload`,
    );
    if (upload.error) throw new Error(extractApiErrorMessage(upload.error, "A secure upload could not be prepared."));
    const uploadData = upload.data?.data;
    if (!uploadData?.upload?.url || !uploadData.requiredHeaders) throw new Error("The private upload response was incomplete.");

    const sent = await client.putSignedObject(uploadData.upload.url, file, uploadData.requiredHeaders);
    if (sent.error) throw new Error(extractApiErrorMessage(sent.error, "The private file upload failed."));

    const verified = await client.writeJson<Envelope<{ attachment: StudentAssignmentAttachmentDto }>>(
      "POST",
      `/v1/student/assignments/${encodeURIComponent(assignmentId)}/attachments/${encodeURIComponent(asset.id)}/verify`,
    );
    if (verified.error) throw new Error(extractApiErrorMessage(verified.error, "The uploaded file could not be verified."));
    const result = verified.data?.data.attachment;
    if (!result || result.status !== "verified") throw new Error("The backend did not verify the uploaded file.");
    return result;
  },
  async openAttachment(assignmentId: string, attachmentId: string): Promise<string> {
    const client = await requireApiClient();
    const result = await client.getJson<Envelope<{ delivery: { url: string } }>>(
      `/v1/student/assignments/${encodeURIComponent(assignmentId)}/attachments/${encodeURIComponent(attachmentId)}`,
    );
    if (result.error) throw new Error(extractApiErrorMessage(result.error, "The protected attachment could not be opened."));
    const url = result.data?.data.delivery.url;
    if (!url || !url.startsWith("https://")) throw new Error("The protected attachment response was invalid.");
    return url;
  },
  submit(assignmentId: string, input: { submissionId: string; responseText: string; expectedVersion: number | null; attachmentIds: string[] }, signal?: AbortSignal) {
    return request<StudentAssignmentDto>("POST", `/v1/student/assignments/${encodeURIComponent(assignmentId)}/submissions`, input, signal);
  },
};
