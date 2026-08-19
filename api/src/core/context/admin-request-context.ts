import type { AdminPermissionCode, CorrelationId } from "../../contracts/admin";
import type { AdminResolvedPlatformContext } from "./platform-context";

export interface AdminAuthenticatedSubject { readonly providerSubjectId: string; readonly authProvider: "supabase" | "mock" | "test"; readonly emailMasked?: string; }
export interface AdminAppUserContext { readonly appUserId: string; readonly platformId: string; readonly platformCode: "medway" | "elite"; readonly status: "pending" | "active" | "disabled" | "suspended"; }
export interface AdminUserContext { readonly adminUserId: string; readonly appUserId: string; readonly platformId: string; readonly platformCode: "medway" | "elite"; readonly status: "active" | "suspended" | "revoked"; readonly roleIds: readonly string[]; readonly elevatedAccessExpiresAt?: string | null; }
export interface AdminSessionContext { readonly sessionId?: string; readonly deviceId?: string; readonly issuedAt?: string; readonly expiresAt?: string; }
/** This context is trusted only after backend resolution; client platform fields are never authority. */
export interface AdminRequestContext { readonly correlationId: CorrelationId; readonly requestId?: string; readonly platform: AdminResolvedPlatformContext; readonly subject: AdminAuthenticatedSubject; readonly appUser: AdminAppUserContext; readonly adminUser: AdminUserContext; readonly session?: AdminSessionContext; readonly permissions: readonly AdminPermissionCode[]; }

export interface CreateTestAdminRequestContextInput { readonly platformCode: "medway" | "elite"; readonly platformId?: string; readonly platformDisplayName?: string; readonly adminUserId?: string; readonly appUserId?: string; readonly providerSubjectId?: string; readonly correlationId?: string; readonly permissions?: readonly AdminPermissionCode[]; readonly status?: "active" | "suspended" | "revoked"; }
export function createTestAdminRequestContext(input: CreateTestAdminRequestContextInput): AdminRequestContext {
  const platformId = input.platformId ?? `platform-${input.platformCode}`;
  const platformDisplayName = input.platformDisplayName ?? (input.platformCode === "medway" ? "Medway" : "Elite");
  const adminUserId = input.adminUserId ?? `${input.platformCode}-admin-001`;
  const appUserId = input.appUserId ?? `${input.platformCode}-user-admin-001`;
  const now = "2026-01-01T00:00:00.000Z";
  const platform = { platformId, platformCode: input.platformCode, platformDisplayName, resolvedFrom: "test_fixture" as const, isActive: true };
  return { correlationId: input.correlationId ?? `${input.platformCode}-correlation-001`, platform, subject: { providerSubjectId: input.providerSubjectId ?? `${input.platformCode}-provider-subject-001`, authProvider: "test", emailMasked: "admin@redacted.example" }, appUser: { appUserId, platformId, platformCode: input.platformCode, status: "active" }, adminUser: { adminUserId, appUserId, platformId, platformCode: input.platformCode, status: input.status ?? "active", roleIds: [`${input.platformCode}-role-001`], elevatedAccessExpiresAt: null }, session: { sessionId: `${input.platformCode}-session-001`, deviceId: `${input.platformCode}-device-001`, issuedAt: now, expiresAt: "2027-01-01T00:00:00.000Z" }, permissions: input.permissions ?? [] };
}