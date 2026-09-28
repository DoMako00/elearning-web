import { env } from "../../../app/config/env";
import { getSupabaseAccessToken } from "../../auth/api/supabaseAuth";

export type ManualPlanCode = "single_course_manual" | "oct10_four_subjects_individual" | "oct10_four_subjects_group3" | "oct10_four_subjects_group5";
export interface ManualSubscriptionPlan { code: ManualPlanCode; title: string; description: string; currency: "EGP"; pricePerStudent: number | null; listPricePerStudent: number | null; studentCount: 1 | 3 | 5; subjectCount: number; promoEndsOn: string | null; requiresManualPrice: boolean; }
export interface ManualSubscriptionOrder { id: string; status: "pending_review" | "approved" | "rejected" | "cancelled"; planCode: ManualPlanCode; pricePerStudent: number; studentCount: number; subjectCount: number; paymentMethod: string; paymentReference: string | null; createdAt: string; reviewedAt: string | null; brandCode: string; studentName: string; studentEmail: string; }
export interface CreateStudentPayload { email: string; password: string; fullName: string; brandCode: "medway" | "elite" | "nexus"; academicInstitutionCode: "buc" | "delta"; academicLevelNumber: number; academicSemesterNumber: number; studentCode?: string; programLabel?: string; }
export interface CreateOrderPayload { studentProfileId: string; brandCode: "medway" | "elite" | "nexus"; planCode: ManualPlanCode; courseIds: string[]; pricePerStudent?: number; paymentMethod: "bank_transfer" | "cash" | "wallet" | "other"; paymentReference?: string; paymentEvidenceNote?: string; }
export interface BrandCourseOption { id: string; title: string; code: string; status: string; cataloguePresentation?: string | null; }

const id = () => typeof crypto !== "undefined" && typeof crypto.randomUUID === "function" ? crypto.randomUUID() : `admin-op-${Date.now()}-${Math.random().toString(36).slice(2)}`;
const base = () => {
  if (!env.apiBaseUrl) throw new Error("API base URL is not configured.");
  return env.apiBaseUrl;
};

async function request<T>(path: string, options: { method?: "GET" | "POST"; body?: unknown } = {}): Promise<T> {
  const token = await getSupabaseAccessToken();
  if (!token) throw new Error("Admin sign-in is required.");
  const response = await fetch(`${base()}${path}`, {
    method: options.method ?? "GET",
    headers: {
      authorization: `Bearer ${token}`,
      "x-correlation-id": id(),
      ...(options.body ? { "content-type": "application/json", "Idempotency-Key": id() } : {}),
    },
    ...(options.body ? { body: JSON.stringify(options.body) } : {}),
  });
  const payload = await response.json().catch(() => ({})) as { ok?: boolean; data?: unknown; error?: { message?: string } };
  if (!response.ok || payload.ok === false) throw new Error(payload.error?.message ?? "The admin operation failed.");
  return payload.data as T;
}

export async function listManualSubscriptionPlans(): Promise<readonly ManualSubscriptionPlan[]> {
  const data = await request<{ items: readonly ManualSubscriptionPlan[] }>("/v1/admin/subscription-plans");
  return data.items;
}

export async function listManualSubscriptionOrders(): Promise<readonly ManualSubscriptionOrder[]> {
  const data = await request<{ items: readonly ManualSubscriptionOrder[] }>("/v1/admin/subscription-orders");
  return data.items;
}

export async function createAdminStudent(payload: CreateStudentPayload): Promise<{ studentProfileId: string }> {
  return request<{ studentProfileId: string }>("/v1/admin/students", { method: "POST", body: payload });
}

export async function createManualSubscriptionOrder(payload: CreateOrderPayload): Promise<{ orderId: string }> {
  return request<{ orderId: string }>("/v1/admin/subscription-orders", { method: "POST", body: payload });
}

export async function approveManualSubscriptionOrder(orderId: string, reason: string): Promise<void> {
  await request(`/v1/admin/subscription-orders/${encodeURIComponent(orderId)}/approve`, { method: "POST", body: { reason } });
}

export async function rejectManualSubscriptionOrder(orderId: string, reason: string): Promise<void> {
  await request(`/v1/admin/subscription-orders/${encodeURIComponent(orderId)}/reject`, { method: "POST", body: { reason } });
}

export async function listBrandCourses(brandId: string): Promise<readonly BrandCourseOption[]> {
  const data = await request<{ data?: readonly BrandCourseOption[]; items?: readonly BrandCourseOption[] }>(`/v1/admin/brands/${encodeURIComponent(brandId)}/courses`);
  return data.data ?? data.items ?? [];
}
