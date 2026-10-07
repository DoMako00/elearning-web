import { env } from "../../../app/config/env";
import { getSupabaseAccessToken } from "../../auth/api/supabaseAuth";

export type AdminBrandCode = "medway" | "elite" | "nexus";
export type ManualPlanCode =
  | "single_course_manual"
  | "oct10_four_subjects_individual"
  | "oct10_four_subjects_group3"
  | "oct10_four_subjects_group5";

export interface ManualSubscriptionPlan {
  readonly code: ManualPlanCode;
  readonly title: string;
  readonly description: string;
  readonly currency: "EGP";
  readonly pricePerStudent: number | null;
  readonly listPricePerStudent: number | null;
  readonly studentCount: 1 | 3 | 5;
  readonly subjectCount: number;
  readonly promoEndsOn: string | null;
  readonly requiresManualPrice: boolean;
}

export interface ManualSubscriptionOrder {
  readonly id: string;
  readonly status:
    | "pending_review"
    | "approved"
    | "rejected"
    | "cancelled"
    | "active"
    | "expired";
  readonly planCode: ManualPlanCode;
  readonly capacity: 1 | 3 | 5;
  readonly courseCount: number;
  readonly brandCode: AdminBrandCode;
  readonly studentProfileId: string;
  readonly studentName: string | null;
  readonly courses?: readonly {
    readonly id: string;
    readonly code: string;
    readonly title: string;
  }[];
  readonly paymentMethod?: string;
  readonly createdAt: string;
  readonly reviewedAt: string | null;
  readonly reviewReason?: string | null;
  readonly subscriptionCount: number;
}

export interface AdminSubscription {
  readonly id: string;
  readonly brandId: string;
  readonly brandCode: AdminBrandCode;
  readonly studentProfileId: string;
  readonly studentName: string | null;
  readonly status: "active" | "cancelled" | "expired";
  readonly capacity: 1 | 3 | 5;
  readonly startsAt: string;
  readonly endsAt: string | null;
  readonly sourceOrderId: string;
  readonly activeGrantCount: number;
  readonly revokedGrantCount: number;
  readonly courses: readonly {
    readonly id: string;
    readonly code: string;
    readonly title: string;
  }[];
  readonly createdAt?: string;
  readonly cancelledAt?: string | null;
  readonly cancellationReason?: string | null;
  readonly version?: number;
}

export interface CreateStudentPayload {
  readonly email: string;
  readonly fullName: string;
  readonly brandCode: AdminBrandCode;
  readonly academicInstitutionCode: "buc" | "delta";
  readonly academicLevelNumber: number;
  readonly academicSemesterNumber: number;
  readonly studentCode?: string;
}

export interface CreatedAdminStudent {
  readonly studentProfileId: string;
  readonly appUserId?: string;
  readonly brandCode?: AdminBrandCode;
  readonly academicInstitutionCode?: "buc" | "delta";
  readonly accountIdentifier?: string;
  readonly setupCode?: string;
  readonly setupExpiresAt?: string;
  readonly replayed?: boolean;
  readonly claimCredentialDelivery?: string;
}

export interface CreateOrderPayload {
  readonly studentProfileId: string;
  readonly brandCode: AdminBrandCode;
  readonly planCode: ManualPlanCode;
  readonly courseIds: readonly string[];
  readonly pricePerStudent: number;
  readonly paymentMethod: "bank_transfer" | "cash" | "wallet" | "other";
  readonly paymentReference: string;
  readonly paymentEvidenceNote: string;
}

export interface BrandCourseOption {
  readonly id: string;
  readonly title: string;
  readonly code: string;
  readonly status: "draft" | "published" | "archived";
  readonly cataloguePresentation?: "subject_based" | "module_based" | null;
}

export interface AdminStudentProvisioningRecord {
  readonly id: string;
  readonly platform: {
    readonly brandId: string;
    readonly brandCode: AdminBrandCode;
    readonly brandDisplayName: string;
  };
  readonly displayName: string | null;
  readonly emailMasked: string | null;
  readonly studentIdMasked: string | null;
  readonly academicInstitution: string | null;
  readonly academicLevel: string | null;
  readonly academicSemester: string | null;
  readonly status: "active" | "pending" | "disabled" | "suspended";
  readonly activeSubscriptionCount: number;
  readonly activeGrantCount: number;
  readonly activeDeviceCount: number;
  readonly activeSessionCount: number;
}

export interface AdminStudentPage {
  readonly items: readonly AdminStudentProvisioningRecord[];
  readonly page: number;
  readonly pageSize: number;
  readonly totalItems: number;
}

interface ApiEnvelope<T> {
  readonly ok?: boolean;
  readonly data?: T;
  readonly error?: { readonly message?: unknown };
}

interface RequestOptions {
  readonly method?: "GET" | "POST" | "PATCH";
  readonly body?: unknown;
  readonly idempotencyKey?: string;
  readonly signal?: AbortSignal;
}

export class AdminOperationError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "AdminOperationError";
  }
}

function createRequestId(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }
  return `admin-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function apiBaseUrl(): string {
  const baseUrl = env.apiBaseUrl.trim().replace(/\/$/, "");
  if (!baseUrl)
    throw new AdminOperationError("The Admin API is not configured.", 503);
  return baseUrl;
}

function messageForStatus(status: number): string {
  switch (status) {
    case 400:
      return "The request was not accepted. Check the required fields and try again.";
    case 401:
      return "Your sign-in has expired. Sign in again to continue.";
    case 403:
      return "Your Admin account cannot perform this action for the selected brand.";
    case 404:
      return "The requested record is no longer available.";
    case 409:
      return "This record changed or the operation was already completed. Refresh and review its current state.";
    case 426:
      return "This operation is temporarily unavailable while the service is updated.";
    default:
      return status >= 500
        ? "The Admin service is unavailable. Try again shortly."
        : "The Admin operation failed.";
  }
}

async function request<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  if (env.adminDataSource !== "api") {
    throw new AdminOperationError(
      "This operation is available only when Admin data source is set to API.",
      503,
    );
  }

  const token = await getSupabaseAccessToken();
  if (!token) throw new AdminOperationError("Admin sign-in is required.", 401);

  const headers: Record<string, string> = {
    authorization: `Bearer ${token}`,
    "x-correlation-id": createRequestId(),
    accept: "application/json",
  };

  if (options.body !== undefined) {
    headers["content-type"] = "application/json";
    headers["Idempotency-Key"] = options.idempotencyKey ?? createRequestId();
  }

  let response: Response;
  try {
    response = await fetch(`${apiBaseUrl()}${path}`, {
      method: options.method ?? "GET",
      signal: options.signal,
      headers,
      ...(options.body !== undefined
        ? { body: JSON.stringify(options.body) }
        : {}),
    });
  } catch {
    throw new AdminOperationError(
      "The Admin service could not be reached. Check your connection and retry.",
      503,
    );
  }

  const envelope = (await response
    .json()
    .catch(() => null)) as ApiEnvelope<T> | null;
  if (!response.ok || envelope?.ok !== true || envelope.data === undefined) {
    throw new AdminOperationError(
      messageForStatus(response.status),
      response.status,
    );
  }

  return envelope.data;
}

export async function listManualSubscriptionPlans(): Promise<
  readonly ManualSubscriptionPlan[]
> {
  const data = await request<{
    readonly items: readonly ManualSubscriptionPlan[];
  }>("/v1/admin/subscription-plans");
  return data.items;
}

export async function listManualSubscriptionOrders(
  brandCode: AdminBrandCode,
): Promise<readonly ManualSubscriptionOrder[]> {
  const query = new URLSearchParams({ brand: brandCode });
  const data = await request<{
    readonly items: readonly ManualSubscriptionOrder[];
  }>(`/v1/admin/subscription-orders?${query.toString()}`);
  return data.items;
}

export async function createAdminStudent(
  payload: CreateStudentPayload,
  idempotencyKey?: string,
): Promise<CreatedAdminStudent> {
  return request("/v1/admin/students", {
    method: "POST",
    body: payload,
    idempotencyKey,
  });
}

export async function listAdminStudents(
  input: Readonly<{
    brand: AdminBrandCode | "all";
    search?: string;
    status?: AdminStudentProvisioningRecord["status"];
    page: number;
    pageSize: number;
  }>,
): Promise<AdminStudentPage> {
  const query = new URLSearchParams({
    brand: input.brand,
    page: String(input.page),
    pageSize: String(input.pageSize),
  });
  if (input.search?.trim()) query.set("search", input.search.trim());
  if (input.status) query.set("status", input.status);

  const data = await request<{
    readonly data: readonly AdminStudentProvisioningRecord[];
    readonly pagination: {
      readonly page: number;
      readonly pageSize: number;
      readonly totalItems: number;
    };
  }>(`/v1/admin/students?${query.toString()}`);

  return {
    items: data.data,
    page: data.pagination.page,
    pageSize: data.pagination.pageSize,
    totalItems: data.pagination.totalItems,
  };
}

export async function changeAdminStudentStatus(
  studentId: string,
  status: "active" | "suspended" | "disabled",
  reason: string,
  idempotencyKey?: string,
): Promise<void> {
  await request(`/v1/admin/students/${encodeURIComponent(studentId)}/status`, {
    method: "PATCH",
    body: { status, reason },
    idempotencyKey,
  });
}

export async function revokeAdminStudentSession(
  input: Readonly<{
    brandId: string;
    appUserId: string;
    sessionId: string;
    reason: string;
  }>,
  idempotencyKey?: string,
): Promise<void> {
  await request(
    `/v1/admin/brands/${encodeURIComponent(input.brandId)}/users/${encodeURIComponent(input.appUserId)}/sessions/${encodeURIComponent(input.sessionId)}/revoke`,
    {
      method: "POST",
      body: { reason: input.reason },
      idempotencyKey,
    },
  );
}

export async function revokeAdminStudentDevice(
  input: Readonly<{
    brandId: string;
    appUserId: string;
    deviceId: string;
    reason: string;
  }>,
  idempotencyKey?: string,
): Promise<void> {
  await request(
    `/v1/admin/brands/${encodeURIComponent(input.brandId)}/users/${encodeURIComponent(input.appUserId)}/devices/${encodeURIComponent(input.deviceId)}/revoke`,
    {
      method: "POST",
      body: { reason: input.reason },
      idempotencyKey,
    },
  );
}

export async function createManualSubscriptionOrder(
  payload: CreateOrderPayload,
  idempotencyKey?: string,
): Promise<{ readonly orderId: string }> {
  return request("/v1/admin/subscription-orders", {
    method: "POST",
    body: payload,
    idempotencyKey,
  });
}

export async function approveManualSubscriptionOrder(
  orderId: string,
  reason: string,
  idempotencyKey?: string,
): Promise<void> {
  await request(
    `/v1/admin/subscription-orders/${encodeURIComponent(orderId)}/approve`,
    {
      method: "POST",
      body: { reason },
      idempotencyKey,
    },
  );
}

export async function rejectManualSubscriptionOrder(
  orderId: string,
  reason: string,
  idempotencyKey?: string,
): Promise<void> {
  await request(
    `/v1/admin/subscription-orders/${encodeURIComponent(orderId)}/reject`,
    {
      method: "POST",
      body: { reason },
      idempotencyKey,
    },
  );
}

export async function listAdminSubscriptions(
  brandCode: AdminBrandCode,
  status?: AdminSubscription["status"],
  studentProfileId?: string,
): Promise<readonly AdminSubscription[]> {
  const query = new URLSearchParams({ brand: brandCode });
  if (status) query.set("status", status);
  if (studentProfileId) query.set("studentProfileId", studentProfileId);
  const data = await request<{ readonly items: readonly AdminSubscription[] }>(
    `/v1/admin/subscriptions?${query.toString()}`,
  );
  return data.items;
}

export async function getAdminSubscription(
  subscriptionId: string,
  signal?: AbortSignal,
): Promise<AdminSubscription> {
  return request(
    `/v1/admin/subscriptions/${encodeURIComponent(subscriptionId)}`,
    {
      signal,
    },
  );
}

export async function cancelAdminSubscription(
  subscriptionId: string,
  reason: string,
  idempotencyKey?: string,
): Promise<void> {
  await request(
    `/v1/admin/subscriptions/${encodeURIComponent(subscriptionId)}/cancel`,
    {
      method: "POST",
      body: { reason },
      idempotencyKey,
    },
  );
}

export async function listBrandCourses(
  brandId: string,
): Promise<readonly BrandCourseOption[]> {
  const courses = await request<readonly BrandCourseOption[]>(
    `/v1/admin/brands/${encodeURIComponent(brandId)}/courses`,
  );
  return courses;
}
