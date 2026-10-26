import { extractApiErrorMessage, requireApiClient } from "../../../app/api/client";
import type { AdminStudentListItem } from "./adminStudentsApi";
import type { SemesterOffering } from "./semesterOfferingsApi";
import type { CreateSemesterOfferingOrderInput, CreatedSemesterOfferingOrder, SemesterOfferingPaymentMethod } from "./adminCommercialApi";
import { toEnglishStudentName } from "./studentDisplay";

type Envelope<T> = { ok: true; correlationId: string; data: T };
const key = () => crypto.randomUUID();

async function unwrap<T>(request: Promise<{ data?: unknown; error?: unknown }>): Promise<T> {
  const response = await request;
  if (response.error) throw new Error(extractApiErrorMessage(response.error, "The Instructor request failed."));
  const payload = response.data as Envelope<T> | undefined;
  if (!payload?.data) throw new Error("The server returned an incomplete Instructor response.");
  return payload.data;
}

export interface InstructorStudentRecord extends AdminStudentListItem {
  createdByInstructor: boolean;
  courseIds: string[];
  courseTitles: string[];
}

interface InstructorStudentRow {
  id: string;
  createdAt: string;
  fullName: string | null;
  brandCode: string;
  brandName: string;
  academicInstitutionId: string | null;
  academicInstitution: string | null;
  academicLevelId: string | null;
  academicLevelNumber: number | null;
  academicLevel: string | null;
  academicSemesterId: string | null;
  academicSemesterNumber: number | null;
  academicSemester: string | null;
  status: AdminStudentListItem["status"];
  createdByInstructor: boolean;
  courseIds: string[];
  courseTitles: string[];
}

export async function listInstructorStudents(search?: string): Promise<InstructorStudentRecord[]> {
  const api = await requireApiClient();
  const payload = await unwrap<{ items: InstructorStudentRow[] }>(api.GET("/v1/admin/instructor/students" as never, {
    params: { query: search?.trim() ? { search: search.trim() } : {} },
  }));
  return payload.items.map((row) => ({
    id: row.id,
    createdAt: row.createdAt,
    displayName: toEnglishStudentName(row.fullName) || null,
    emailMasked: null,
    phoneMasked: null,
    academicInstitution: row.academicInstitution,
    academicInstitutionId: row.academicInstitutionId,
    academicLevel: row.academicLevel,
    academicLevelId: row.academicLevelId,
    academicSemester: row.academicSemester,
    academicSemesterId: row.academicSemesterId,
    academicTermOrYear: null,
    version: 1,
    status: row.status,
    activeDeviceCount: 0,
    activeSessionCount: 0,
    lastSeenAt: null,
    platform: { platformCode: row.brandCode, platformDisplayName: row.brandName },
    createdByInstructor: row.createdByInstructor,
    courseIds: row.courseIds ?? [],
    courseTitles: row.courseTitles ?? [],
  }));
}

export interface InstructorStudentCredentials {
  studentProfileId: string;
  accountIdentifier: string;
  setupCode: string;
  setupExpiresAt: string;
}

export async function createInstructorStudent(input: { courseId: string; fullName: string; phone?: string }) {
  const api = await requireApiClient();
  return unwrap<InstructorStudentCredentials>(api.POST("/v1/admin/instructor/students" as never, {
    headers: { "Idempotency-Key": key() },
    body: input,
  }));
}

export async function cancelInstructorStudent(studentProfileId: string, reason: string) {
  const api = await requireApiClient();
  return unwrap<{ studentProfileId: string; status: "disabled" }>(api.POST("/v1/admin/instructor/students/{studentProfileId}/cancel" as never, {
    params: { path: { studentProfileId } },
    headers: { "Idempotency-Key": key() },
    body: { reason },
  }));
}

export async function listInstructorSemesterOfferings() {
  const api = await requireApiClient();
  return unwrap<{ items: SemesterOffering[] }>(api.GET("/v1/admin/instructor/semester-offerings" as never));
}

export async function getInstructorSemesterOffering(offeringId: string) {
  const api = await requireApiClient();
  return unwrap<SemesterOffering>(api.GET("/v1/admin/instructor/semester-offerings/{offeringId}" as never, {
    params: { path: { offeringId } },
  }));
}

export interface InstructorPurchaseRequest {
  orderId: string;
  status: "pending_review" | "approved" | "rejected" | "cancelled";
  version: number;
  planCode: string;
  capacity: number;
  priceTotalMinor: number;
  currency: string;
  createdAt: string;
  reviewReason?: string | null;
  semesterOfferingId: string;
  semesterOfferingCode: string;
  semesterOfferingTitle: string;
  brandCode: "medway" | "elite" | "nexus";
  subscriptionId?: string | null;
  students: Array<{ studentProfileId: string; fullName: string }>;
}

export async function listInstructorPurchaseRequests() {
  const api = await requireApiClient();
  return unwrap<{ items: InstructorPurchaseRequest[] }>(api.GET("/v1/admin/instructor/subscriptions" as never));
}

export async function createInstructorPurchaseRequest(input: CreateSemesterOfferingOrderInput) {
  const api = await requireApiClient();
  return unwrap<CreatedSemesterOfferingOrder>(api.POST("/v1/admin/instructor/subscriptions" as never, {
    headers: { "Idempotency-Key": key() },
    body: input,
  }));
}

export type InstructorPaymentMethod = SemesterOfferingPaymentMethod;
