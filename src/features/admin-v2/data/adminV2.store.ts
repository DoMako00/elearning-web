import { useSyncExternalStore } from "react";
import { emptyAdminV2Data } from "./adminV2.defaults";
import type { AdminV2Data, CourseEnrollment, StudentRecord, SubscriptionPlan, SubscriptionRecord } from "../types/adminV2.types";

const listeners = new Set<() => void>();
let snapshot: AdminV2Data = structuredClone(emptyAdminV2Data);

function clone<T>(value: T): T { return structuredClone(value); }
function commit(next: AdminV2Data) {
  snapshot = { ...next, ...clone(emptyAdminV2Data) };
  listeners.forEach((listener) => listener());
}

export function subscribeAdminV2(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
export function getAdminV2Snapshot() { return snapshot; }
export function useAdminV2Store() { return useSyncExternalStore(subscribeAdminV2, getAdminV2Snapshot, getAdminV2Snapshot); }
export function updateAdminV2(update: (data: AdminV2Data) => AdminV2Data) { commit(update(clone(snapshot))); }
export function resetAdminV2() { commit(clone(emptyAdminV2Data)); }
export function resetAdminV2ForTesting() { resetAdminV2(); }

export function enrollmentFor(data: AdminV2Data, studentId: string, courseId: string): CourseEnrollment | undefined {
  return data.enrollments.find((item) => item.studentId === studentId && item.courseId === courseId && item.status === "Active");
}

export function getStudentSubscription(data: AdminV2Data, studentId: string): SubscriptionRecord | undefined {
  return data.subscriptions.find((item) => item.studentIds.includes(studentId) && item.status === "Active");
}

export function getPlan(data: AdminV2Data, planId: SubscriptionPlan["id"]): SubscriptionPlan | undefined {
  return data.plans.find((item) => item.id === planId);
}

export function studentAccessBlock(data: AdminV2Data, studentId: string): string | null {
  const student = data.students.find((item: StudentRecord) => item.id === studentId);
  if (!student) return "Student record is unavailable.";
  if (student.status !== "Active") return "Student account is not active.";
  if (!getStudentSubscription(data, studentId)) return "No active subscription is linked to this Student.";
  return null;
}
