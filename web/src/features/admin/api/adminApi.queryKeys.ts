import type { AdminPlatformCode } from "./adminApi.types";

type KeyFilters = Record<string, unknown> | undefined;
const stableFilters = (filters: KeyFilters) => filters ? Object.keys(filters).sort().reduce<Record<string, unknown>>((result, key) => { result[key] = filters[key]; return result; }, {}) : undefined;

export const adminKeys = {
  all: ["admin"] as const,
  platform: (platformCode: AdminPlatformCode) => ["admin", platformCode] as const,
  overview: (platformCode: AdminPlatformCode) => ["admin", platformCode, "overview"] as const,
  students: (platformCode: AdminPlatformCode, filters?: KeyFilters) => ["admin", platformCode, "students", stableFilters(filters)] as const,
  student: (platformCode: AdminPlatformCode, studentId: string) => ["admin", platformCode, "student", studentId] as const,
  payments: (platformCode: AdminPlatformCode, filters?: KeyFilters) => ["admin", platformCode, "payments", stableFilters(filters)] as const,
  payment: (platformCode: AdminPlatformCode, paymentId: string) => ["admin", platformCode, "payment", paymentId] as const,
  refunds: (platformCode: AdminPlatformCode, filters?: KeyFilters) => ["admin", platformCode, "refunds", stableFilters(filters)] as const,
  subscriptions: (platformCode: AdminPlatformCode, filters?: KeyFilters) => ["admin", platformCode, "subscriptions", stableFilters(filters)] as const,
  contentTree: (platformCode: AdminPlatformCode) => ["admin", platformCode, "content-tree"] as const,
  mediaAssets: (platformCode: AdminPlatformCode, filters?: KeyFilters) => ["admin", platformCode, "media-assets", stableFilters(filters)] as const,
  assessments: (platformCode: AdminPlatformCode, filters?: KeyFilters) => ["admin", platformCode, "assessments", stableFilters(filters)] as const,
  auditLogs: (platformCode: AdminPlatformCode, filters?: KeyFilters) => ["admin", platformCode, "audit-logs", stableFilters(filters)] as const,
};
