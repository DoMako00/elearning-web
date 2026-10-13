import { useSyncExternalStore } from "react";
import { brandName, initialAdminV2Data } from "./adminV2.fixtures";
import type { AdminV2Data, BrandCode, CourseEnrollment, CourseRecord, PaymentRecord, StudentDraft, StudentRecord, SubscriptionPlan } from "../types/adminV2.types";
import { courseLevel, courseMatchesStudentPlacement, unitForCourse } from "./adminV2.selectors";

const STORAGE_KEY = "greenlearn.admin-v2.local.v1";
const listeners = new Set<() => void>();
let snapshot: AdminV2Data | null = null;

function clone<T>(value: T): T { return structuredClone(value); }
function isRecord(value: unknown): value is Record<string, unknown> { return typeof value === "object" && value !== null; }
function withoutServerDomainFixtures(data: AdminV2Data): AdminV2Data { return { ...data, courses: [], students: [], plans: [], subscriptions: [], payments: [], enrollments: [], devices: [], sessions: [], institutions: [], curricula: [], academicYears: [], semesters: [], curriculumUnits: [], chapters: [], lessons: [], contentResources: [], auditEvents: [], instructors: [], instructorBrandAssignments: [] }; }
function hasCoreCollections(value: unknown): value is Partial<AdminV2Data> {
  if (!isRecord(value)) return false;
  return ["courses", "students", "plans", "subscriptions", "payments", "enrollments", "devices", "sessions"].every((key) => Array.isArray(value[key]));
}
function normalizeStore(parsed: Partial<AdminV2Data>): AdminV2Data {
  const defaults = clone(initialAdminV2Data);
  const data: AdminV2Data = {
    ...defaults, ...parsed,
    institutions: [],
    curricula: [],
    academicYears: [],
    semesters: [],
    curriculumUnits: [],
    chapters: [],
    lessons: [],
    contentResources: [],
    auditEvents: [],
    instructors: [],
    instructorBrandAssignments: [],
    students: [],
    courses: [],
    plans: [], subscriptions: [], payments: [], enrollments: [], devices: [], sessions: [],
  };
  const legacyCourses: (CourseRecord & { module?: string; level?: string; semester?: string })[] = [];
  data.courses = legacyCourses.map(({ module, level, semester, ...course }) => {
    const mapped = course.curriculumUnitId ? data.curriculumUnits.some((unit) => unit.id === course.curriculumUnitId) : false;
    const [code, ...titleParts] = (module ?? "").split(" ");
    const legacyUnit = data.curriculumUnits.find((unit) => unit.code === code && unit.title === titleParts.join(" "));
    return {
      ...course,
      curriculumUnitId: mapped ? course.curriculumUnitId : legacyUnit?.id ?? null,
      instructors: (course.instructors ?? []).map((assignment) => ({
        ...assignment,
        instructorId: assignment.instructorId ?? data.instructors.find((instructor) => instructor.fullName === assignment.name)?.id,
      })),
    };
  });
  if (!data.instructorBrandAssignments.length) {
    data.instructorBrandAssignments = data.instructors.flatMap((instructor) => {
      const brands = [...new Set(data.courses.filter((course) => course.instructors.some((assignment) => assignment.instructorId === instructor.id || assignment.name === instructor.fullName)).map((course) => course.brand))];
      return brands.map((brand) => ({ id: `iba-${instructor.id}-${brand}`, instructorId: instructor.id, brand, createdAt: instructor.createdAt }));
    });
  }
  return data;
}
function readStore(): AdminV2Data {
  if (typeof window === "undefined") return withoutServerDomainFixtures(clone(initialAdminV2Data));
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as unknown;
      if (hasCoreCollections(parsed)) return normalizeStore(parsed);
    }
  } catch { /* Keep the preview usable when local storage is unavailable. */ }
  return withoutServerDomainFixtures(clone(initialAdminV2Data));
}
function commit(next: AdminV2Data) {
  snapshot = withoutServerDomainFixtures(next);
  try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot)); } catch { /* The in-memory preview still works in restricted storage contexts. */ }
  listeners.forEach((listener) => listener());
}
function current(): AdminV2Data { return snapshot ??= readStore(); }
function id(prefix: string) { return `${prefix}-${typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID().slice(0, 8) : Date.now().toString(36)}`; }
function dateLabel(date: Date) { return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }); }

export function subscribeAdminV2(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
export function getAdminV2Snapshot() { return current(); }
export function useAdminV2Store() { return useSyncExternalStore(subscribeAdminV2, getAdminV2Snapshot, getAdminV2Snapshot); }
export function updateAdminV2(update: (data: AdminV2Data) => AdminV2Data) { commit(update(clone(current()))); }
export function resetAdminV2() { snapshot = null; commit(withoutServerDomainFixtures(clone(initialAdminV2Data))); }

export function makeStudent(data: AdminV2Data, draft: StudentDraft, status: StudentRecord["status"]) {
  const preferred = draft.accountIdentifier.trim().toLowerCase().replace(/[^a-z0-9._-]+/g, ".").replace(/^\.+|\.+$/g, "");
  const base = preferred || draft.fullName.trim().toLowerCase().replace(/[^a-z0-9]+/g, ".").replace(/^\.+|\.+$/g, "") || "student";
  const used = new Set(data.students.map((student) => student.accountIdentifier.toLowerCase()));
  let accountIdentifier = base;
  let suffix = 1;
  while (used.has(accountIdentifier.toLowerCase())) accountIdentifier = `${base}${suffix++}`;
  const setupCode = `GL-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  const student: StudentRecord = {
    id: id("stu"), accountIdentifier, setupCode, fullName: draft.fullName.trim(), email: draft.email.trim().toLowerCase(), phone: draft.phone?.trim() ?? "", brand: draft.brand,
    institution: draft.institution, academicLevel: draft.academicLevel, semester: draft.semester, program: draft.program.trim(),
    status, createdAt: dateLabel(new Date()), lastActivity: "Never",
  };
  return { student, setupCode };
}

export function getStudentSubscription(data: AdminV2Data, studentId: string) {
  return data.subscriptions.find((subscription) => subscription.studentIds.includes(studentId));
}
export function getPlan(data: AdminV2Data, planId?: string) { return data.plans.find((plan) => plan.id === planId); }
export function studentAccessBlock(data: AdminV2Data, studentId: string): string | null {
  const student = data.students.find((item) => item.id === studentId);
  if (!student) return "Student record is unavailable.";
  if (student.status === "Suspended") return "Restore this Student's account before granting course access.";
  if (student.status === "Pending Payment" || student.status === "Payment Rejected") return "Approve this Student's related payment before granting course access.";
  const subscription = getStudentSubscription(data, studentId);
  if (subscription && subscription.status !== "Active" && subscription.status !== "Expiring Soon") return "Activate this Student's subscription before granting course access.";
  return null;
}
export function enrollmentFor(data: AdminV2Data, studentId: string, courseId: string) {
  return data.enrollments.find((item) => item.studentId === studentId && item.courseId === courseId && item.status === "Active");
}
export function addEnrollment(data: AdminV2Data, studentId: string, courseId: string): CourseEnrollment | null {
  const course = data.courses.find((item) => item.id === courseId);
  const student = data.students.find((item) => item.id === studentId);
  const unit = course ? unitForCourse(data, course) : undefined;
  if (!course || !student || course.status === "Archived" || (course.scope === "Curriculum" && (!unit || unit.status !== "Approved")) || studentAccessBlock(data, studentId) || course.brand !== student.brand || (course.scope === "Curriculum" && student.academicLevel !== courseLevel(data, course)) || !courseMatchesStudentPlacement(data, course, student) || enrollmentFor(data, studentId, courseId)) return null;
  const subscription = getStudentSubscription(data, studentId);
  return { id: id("enr"), studentId, courseId, source: subscription ? "Subscription" : "Admin grant", subscriptionId: subscription?.id ?? null, createdAt: dateLabel(new Date()), expiryDate: subscription?.expiryDate ?? null, status: "Active" };
}

export function createPurchase(data: AdminV2Data, plan: SubscriptionPlan, brand: BrandCode, students: StudentRecord[], method: PaymentRecord["method"]): AdminV2Data {
  const subscriptionId = id("sub");
  const paymentId = id("pay");
  const createdAt = dateLabel(new Date());
  const subscription = { id: subscriptionId, planId: plan.id, brand, studentIds: students.map((student) => student.id), status: "Pending Payment" as const, startDate: null, expiryDate: null, renewal: "Manual renewal" as const, amount: plan.amount, currency: plan.currency, paymentId, createdAt };
  const payment: PaymentRecord = { id: paymentId, orderId: id("ord").toUpperCase(), subscriptionId, brand, studentIds: students.map((student) => student.id), planId: plan.id, seatCount: plan.capacity, amount: plan.amount, currency: plan.currency, method, submittedAt: createdAt, status: "Pending Verification" };
  return { ...data, subscriptions: [subscription, ...data.subscriptions], payments: [payment, ...data.payments], students: data.students.map((student) => students.some((item) => item.id === student.id) ? { ...student, status: "Pending Payment" } : student) };
}

export function approvePaymentData(data: AdminV2Data, paymentId: string): AdminV2Data {
  const payment = data.payments.find((item) => item.id === paymentId);
  if (!payment || payment.status !== "Pending Verification") return data;
  const now = new Date(); const expiry = new Date(now); expiry.setMonth(expiry.getMonth() + 12);
  return {
    ...data,
    payments: data.payments.map((item) => item.id === paymentId ? { ...item, status: "Approved" } : item),
    subscriptions: data.subscriptions.map((item) => item.id === payment.subscriptionId ? { ...item, status: "Active", startDate: dateLabel(now), expiryDate: dateLabel(expiry) } : item),
    students: data.students.map((student) => payment.studentIds.includes(student.id) && student.status === "Pending Payment" ? { ...student, status: "Active" } : student),
  };
}
export function rejectPaymentData(data: AdminV2Data, paymentId: string): AdminV2Data {
  const payment = data.payments.find((item) => item.id === paymentId);
  if (!payment || payment.status !== "Pending Verification") return data;
  return {
    ...data,
    payments: data.payments.map((item) => item.id === paymentId ? { ...item, status: "Rejected" } : item),
    subscriptions: data.subscriptions.map((item) => item.id === payment.subscriptionId ? { ...item, status: "Payment Rejected", renewal: "Not renewing" } : item),
    students: data.students.map((student) => payment.studentIds.includes(student.id) && student.status === "Pending Payment" ? { ...student, status: "Payment Rejected" } : student),
  };
}

export function resetAdminV2ForTesting() { resetAdminV2(); }
export { brandName };
