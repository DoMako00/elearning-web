import { requireApiClient, extractApiErrorMessage } from "../../../app/api/client";

export type StudentCalendarType = "study_block" | "reminder" | "academic_event" | "course_release" | "assignment" | "quiz" | "exam" | "holiday";

export interface StudentCalendarItemDto {
  id: string;
  source: "academic" | "assignment" | "assessment" | "personal";
  type: StudentCalendarType;
  title: string;
  startsAt: string;
  endsAt: string | null;
  description: string | null;
  courseTitle: string | null;
  status: string;
  version: number | null;
  editable: boolean;
}

interface Envelope<T> { ok: true; correlationId: string; data: T; }

async function getData<T>(path: string, signal?: AbortSignal): Promise<T> {
  const client = await requireApiClient();
  const result = await client.getJson<Envelope<T>>(path, { signal });
  if (result.error) throw new Error(extractApiErrorMessage(result.error, "Calendar could not be loaded."));
  if (!result.data) throw new Error("The calendar API returned an incomplete response.");
  return result.data.data;
}

async function writeData<T>(method: "POST" | "PATCH", path: string, body: unknown, signal?: AbortSignal): Promise<T> {
  const client = await requireApiClient();
  const result = await client.writeJson<Envelope<T>>(method, path, body, { signal });
  if (result.error) throw new Error(extractApiErrorMessage(result.error, "Calendar change could not be saved."));
  if (!result.data) throw new Error("The calendar API returned an incomplete response.");
  return result.data.data;
}

export const studentCalendarApi = {
  list(from: string, to: string, signal?: AbortSignal) {
    const query = new URLSearchParams({ from, to });
    return getData<StudentCalendarItemDto[]>(`/v1/student/calendar?${query.toString()}`, signal);
  },
  create(input: { id: string; itemType: "study_block" | "reminder"; title: string; description: string | null; startsAt: string; endsAt: string | null }, signal?: AbortSignal) {
    return writeData<StudentCalendarItemDto>("POST", "/v1/student/calendar/items", input, signal);
  },
  update(id: string, input: { expectedVersion: number; title?: string; description?: string | null; startsAt?: string; endsAt?: string | null; status?: "active" | "completed" | "cancelled" }, signal?: AbortSignal) {
    return writeData<StudentCalendarItemDto>("PATCH", `/v1/student/calendar/items/${encodeURIComponent(id)}`, input, signal);
  },
};
