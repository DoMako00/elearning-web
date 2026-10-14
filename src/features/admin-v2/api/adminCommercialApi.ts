import { requireApiClient } from "../../../app/api/client";
import { toEnglishStudentName } from "./studentDisplay";

type Envelope<T> = { ok: true; correlationId: string; data: T };
const key = () => crypto.randomUUID();

async function unwrap<T>(request: Promise<{ data?: unknown; error?: unknown }>): Promise<T> {
  const response = await request;
  if (response.error) throw response.error;
  const payload = response.data as Envelope<T> | undefined;
  if (!payload?.data) throw new Error("The server returned an incomplete response.");
  return payload.data;
}

const mapOrderNames = (order: SemesterOfferingOrder): SemesterOfferingOrder => ({
  ...order,
  students: order.students?.map((student) => ({ ...student, fullName: toEnglishStudentName(student.fullName) })),
});

const mapSubscriptionName = (subscription: Subscription): Subscription => ({
  ...subscription,
  studentName: toEnglishStudentName(subscription.studentName),
});

const mapSeatNames = (seat: SubscriptionSeat): SubscriptionSeat => ({
  ...seat,
  student: seat.student ? { ...seat.student, fullName: toEnglishStudentName(seat.student.fullName) } : seat.student,
});

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
export type SemesterOfferingPaymentMethod = "instapay" | "wallet" | "bank_transfer" | "cash" | "other";
export interface CreateSemesterOfferingOrderInput {
  semesterOfferingId: string;
  planCode: "semester_offering_1" | "semester_offering_3" | "semester_offering_5";
  selectedStudentProfileIds: string[];
  paymentMethod: SemesterOfferingPaymentMethod;
  paymentReference?: string;
  paymentEvidenceNote?: string;
}
export interface CreatedSemesterOfferingOrder {
  orderId: string;
  status: "pending_review";
  version: number;
  semesterOfferingId: string;
  planCode: CreateSemesterOfferingOrderInput["planCode"];
  capacity: 1 | 3 | 5;
  selectedStudentCount: number;
  pricePerStudentMinor: number;
  priceTotalMinor: number;
  currency: string;
}
export interface ReviewedSemesterOfferingOrder {
  orderId: string;
  status: "approved" | "rejected";
  version?: number;
  orderVersion?: number;
  subscriptionId?: string;
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
  const result = await unwrap<{ items: SemesterOfferingOrder[] }>(api.GET("/v1/admin/semester-offering-orders" as never, { params: { query: filters } }));
  return { ...result, items: result.items.map(mapOrderNames) };
}
export async function getSemesterOfferingOrder(orderId: string) {
  const api = await requireApiClient();
  return mapOrderNames(await unwrap<SemesterOfferingOrder>(api.GET("/v1/admin/semester-offering-orders/{orderId}" as never, { params: { path: { orderId } } })));
}
export async function createSemesterOfferingOrder(input: CreateSemesterOfferingOrderInput) {
  const api = await requireApiClient();
  return unwrap<CreatedSemesterOfferingOrder>(api.POST("/v1/admin/semester-offering-orders" as never, {
    headers: { "Idempotency-Key": key() },
    body: input,
  }));
}
export async function reviewSemesterOfferingOrder(orderId: string, action: "approve" | "reject", expectedVersion: number, reason: string) {
  const api = await requireApiClient();
  return unwrap<ReviewedSemesterOfferingOrder>(api.POST(`/v1/admin/semester-offering-orders/{orderId}/${action}` as never, { params: { path: { orderId } }, headers: { "Idempotency-Key": key() }, body: { expectedVersion, reason } }));
}
export async function listSubscriptions(filters: { brand?: string; status?: string; studentProfileId?: string } = {}) {
  const api = await requireApiClient();
  const result = await unwrap<{ items: Subscription[] }>(api.GET("/v1/admin/subscriptions" as never, { params: { query: filters } }));
  return { ...result, items: result.items.map(mapSubscriptionName) };
}
export async function getSubscription(subscriptionId: string) {
  const api = await requireApiClient();
  return mapSubscriptionName(await unwrap<Subscription>(api.GET("/v1/admin/subscriptions/{subscriptionId}" as never, { params: { path: { subscriptionId } } })));
}
export async function cancelSubscription(subscriptionId: string, reason: string) {
  const api = await requireApiClient();
  return unwrap<Record<string, unknown>>(api.POST("/v1/admin/subscriptions/{subscriptionId}/cancel" as never, { params: { path: { subscriptionId } }, headers: { "Idempotency-Key": key() }, body: { reason } }));
}
export async function listSubscriptionSeats(subscriptionId: string) {
  const api = await requireApiClient();
  const result = await unwrap<SubscriptionSeatList>(api.GET("/v1/admin/subscriptions/{subscriptionId}/seats" as never, { params: { path: { subscriptionId } } }));
  return {
    ...result,
    ...(result.subscription ? { subscription: mapSubscriptionName(result.subscription) } : {}),
    seats: result.seats.map(mapSeatNames),
  };
}
export async function mutateSeat(subscriptionId: string, seatId: string, action: "assign" | "release" | "replace" | "revoke", input: Record<string, unknown>) {
  const api = await requireApiClient();
  return mapSeatNames(await unwrap<SubscriptionSeat>(api.POST(`/v1/admin/subscriptions/{subscriptionId}/seats/{seatId}/${action}` as never, { params: { path: { subscriptionId, seatId } }, headers: { "Idempotency-Key": key() }, body: input })));
}
