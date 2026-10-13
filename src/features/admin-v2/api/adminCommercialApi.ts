import { requireApiClient } from "../../../app/api/client";

type Envelope<T> = { ok: true; correlationId: string; data: T };
const key = () => crypto.randomUUID();

async function unwrap<T>(request: Promise<{ data?: unknown; error?: unknown }>): Promise<T> {
  const response = await request;
  if (response.error) throw response.error;
  const payload = response.data as Envelope<T> | undefined;
  if (!payload?.data) throw new Error("The server returned an incomplete response.");
  return payload.data;
}

export type ManualPaymentStatus = "pending_review" | "approved" | "rejected" | "cancelled";
export type BrandCode = "medway" | "elite" | "nexus";
export interface CommercialStudent { studentProfileId: string; fullName: string; }
export interface SemesterOfferingOrder {
  orderId: string; status: ManualPaymentStatus; version: number; planCode: string; capacity: number;
  pricePerStudentMinor: number; priceTotalMinor: number; currency: string; paymentMethod: string;
  paymentReference?: string | null; reviewReason?: string | null; createdAt: string; reviewedAt?: string | null;
  brandCode: BrandCode; semesterOfferingId: string; semesterOfferingCode: string; semesterOfferingTitle: string;
  institutionCode: string; academicLevelNumber: number; academicSemesterNumber: number;
  selectedStudentCount: number; students?: CommercialStudent[]; subscriptionId?: string | null; assignedSeatCount?: number;
}
export interface SubscriptionCourse { id: string; code: string; title: string; }
export interface Subscription {
  id: string; brandId: string; brandCode: BrandCode; studentProfileId: string; studentName: string;
  status: "active" | "cancelled" | "expired"; capacity: number; startsAt: string; endsAt: string | null;
  createdAt: string; sourceOrderId?: string | null; semesterOfferingId?: string | null; cancelledAt?: string | null;
  cancellationReason?: string | null; version: number; assignedSeatCount: number; availableSeatCount: number;
  activeGrantCount: number; revokedGrantCount: number; courses: SubscriptionCourse[];
}
export interface SubscriptionSeat {
  seatId: string; seatIndex: number; status: "available" | "assigned" | "released" | "revoked";
  version: number; replacementCount: number; assignedAt: string | null; releasedAt: string | null;
  student?: { studentProfileId: string; fullName: string; accountStatus: string | null } | null;
  access?: { includedCourseCount: number; activeEnrollmentCount: number; activeGrantCount: number };
}
export interface SubscriptionSeatList { subscriptionId: string; subscription?: Subscription; seats: SubscriptionSeat[]; }

export async function listSemesterOfferingOrders(filters: { brand?: string; status?: ManualPaymentStatus } = {}) {
  const api = await requireApiClient();
  return unwrap<{ items: SemesterOfferingOrder[] }>(api.GET("/v1/admin/semester-offering-orders" as never, { params: { query: filters } }));
}
export async function getSemesterOfferingOrder(orderId: string) {
  const api = await requireApiClient();
  return unwrap<SemesterOfferingOrder>(api.GET("/v1/admin/semester-offering-orders/{orderId}" as never, { params: { path: { orderId } } }));
}
export async function reviewSemesterOfferingOrder(orderId: string, action: "approve" | "reject", expectedVersion: number, reason: string) {
  const api = await requireApiClient();
  return unwrap<Record<string, unknown>>(api.POST(`/v1/admin/semester-offering-orders/{orderId}/${action}` as never, { params: { path: { orderId } }, headers: { "Idempotency-Key": key() }, body: { expectedVersion, reason } }));
}
export async function listSubscriptions(filters: { brand?: string; status?: string; studentProfileId?: string } = {}) {
  const api = await requireApiClient();
  return unwrap<{ items: Subscription[] }>(api.GET("/v1/admin/subscriptions" as never, { params: { query: filters } }));
}
export async function getSubscription(subscriptionId: string) {
  const api = await requireApiClient();
  return unwrap<Subscription>(api.GET("/v1/admin/subscriptions/{subscriptionId}" as never, { params: { path: { subscriptionId } } }));
}
export async function cancelSubscription(subscriptionId: string, reason: string) {
  const api = await requireApiClient();
  return unwrap<Record<string, unknown>>(api.POST("/v1/admin/subscriptions/{subscriptionId}/cancel" as never, { params: { path: { subscriptionId } }, headers: { "Idempotency-Key": key() }, body: { reason } }));
}
export async function listSubscriptionSeats(subscriptionId: string) {
  const api = await requireApiClient();
  return unwrap<SubscriptionSeatList>(api.GET("/v1/admin/subscriptions/{subscriptionId}/seats" as never, { params: { path: { subscriptionId } } }));
}
export async function mutateSeat(subscriptionId: string, seatId: string, action: "assign" | "release" | "replace" | "revoke", input: Record<string, unknown>) {
  const api = await requireApiClient();
  return unwrap<SubscriptionSeat>(api.POST(`/v1/admin/subscriptions/{subscriptionId}/seats/{seatId}/${action}` as never, { params: { path: { subscriptionId, seatId } }, headers: { "Idempotency-Key": key() }, body: input }));
}
