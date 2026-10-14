import { extractApiErrorMessage, requireApiClient } from "../../../app/api/client";
import { getAdminStudent, listAdminStudents, type AdminStudentDetail, type AdminStudentListItem } from "./adminStudentsApi";
import type { BrandFilter } from "../types/adminV2.types";

type Envelope<T> = { ok: true; correlationId: string; data: T };
export interface AdminOverviewSnapshot {
  brand: { brandId: string; brandCode: string; brandDisplayName: string };
  counts: { pendingPaymentReviews: number; pendingRefunds: number; suspiciousSecurityEvents: number; activeSubscriptions: number; expiredSubscriptions: number; activeGrants: number; revokedGrants: number; contentAwaitingRelease: number; assessmentsAwaitingReview: number };
  recent: { auditLogs: Array<Record<string, unknown>>; adminActions: Array<Record<string, unknown>>; securityEvents: Array<Record<string, unknown>> };
}
export interface AdminSecurityEventDto {
  id: string; action: string; result: "allowed" | "denied"; targetId: string | null; reason: string | null;
  correlationId: string; createdAt: string; brandCode: string | null; actorName: string;
}
export interface AdminSecurityEventPage { items: AdminSecurityEventDto[]; pagination: { page: number; pageSize: number; totalItems: number }; }

function unwrap<T>(result: { data?: unknown; error?: unknown; response?: Response }): T {
  if (result.error) {
    const raw = result.error as { error?: { code?: unknown; correlationId?: unknown } };
    const error = new Error(extractApiErrorMessage(result.error, "The Admin request failed.")) as Error & { status?: number; code?: string; correlationId?: string };
    error.status = result.response?.status;
    if (typeof raw.error?.code === "string") error.code = raw.error.code;
    if (typeof raw.error?.correlationId === "string") error.correlationId = raw.error.correlationId;
    throw error;
  }
  const payload = result.data as Envelope<T> | undefined;
  if (!payload || !payload.data) throw new Error("The server returned an incomplete Admin response.");
  return payload.data;
}
async function request<T>(make: (api: Awaited<ReturnType<typeof requireApiClient>>) => Promise<any>): Promise<T> { return unwrap<T>(await make(await requireApiClient())); }

export async function getAdminOverview(brand: Exclude<BrandFilter, "all">) {
  return request<AdminOverviewSnapshot>((api) => api.GET("/v1/admin/overview" as never, { params: { query: { brand } } }));
}

export async function listAdminSecurityEvents(brand: BrandFilter, page = 1, pageSize = 100) {
  return request<AdminSecurityEventPage>((api) => api.GET("/v1/admin/security/events" as never, { params: { query: { brand, page, pageSize } } }));
}

export async function listAllAdminStudents(brand: BrandFilter): Promise<AdminStudentListItem[]> {
  const first = await listAdminStudents({ brand, page: 1, pageSize: 100 });
  const pages = Math.max(1, Math.ceil(first.pagination.totalItems / first.pagination.pageSize));
  const rest = await Promise.all(Array.from({ length: pages - 1 }, (_, index) => listAdminStudents({ brand, page: index + 2, pageSize: 100 })));
  return [...first.data, ...rest.flatMap((page) => page.data)];
}

export async function loadAdminStudentDetails(students: readonly AdminStudentListItem[], brand: BrandFilter): Promise<AdminStudentDetail[]> {
  const details: AdminStudentDetail[] = [];
  for (let start = 0; start < students.length; start += 8) {
    const chunk = students.slice(start, start + 8);
    details.push(...await Promise.all(chunk.map((student) => getAdminStudent(student.id, brand === "all" ? student.platform?.platformCode : brand))));
  }
  return details;
}

