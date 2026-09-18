import type { AdminBrandCode, AdminPermissionCode, CorrelationId } from "../../contracts/admin";
import type { AdminResolvedBrandContext, AdminResolvedPlatformContext } from "./platform-context";

export interface AdminAuthenticatedSubject { readonly providerSubjectId: string; readonly authProvider: "supabase" | "mock" | "test"; readonly emailMasked?: string; }
export interface AdminAppUserContext { readonly appUserId: string; readonly brandId: string; readonly brandCode: AdminBrandCode; /** @deprecated Compatibility alias for brand scope. */ readonly platformId: string; /** @deprecated Compatibility alias for brand scope. */ readonly platformCode: AdminBrandCode; readonly status: "pending" | "active" | "disabled" | "suspended"; }
export interface AdminUserContext { readonly adminProfileId: string; /** @deprecated Compatibility alias for adminProfileId. */ readonly adminUserId: string; readonly appUserId: string; readonly brandId: string; readonly brandCode: AdminBrandCode; /** @deprecated Compatibility alias for brand scope. */ readonly platformId: string; /** @deprecated Compatibility alias for brand scope. */ readonly platformCode: AdminBrandCode; readonly status: "active" | "suspended" | "revoked"; readonly roleIds: readonly string[]; readonly elevatedAccessExpiresAt?: string | null; }
export interface AdminSessionContext { readonly sessionId?: string; readonly deviceId?: string; readonly issuedAt?: string; readonly expiresAt?: string; }
/** Context is trusted only after backend resolution. Exactly one active brand scope is resolved per request; frontend-provided brand is never authority. */
export interface AdminRequestContext { readonly correlationId: CorrelationId; readonly requestId?: string; readonly brand: AdminResolvedBrandContext; /** @deprecated Compatibility alias pointing to the same brand scope. */ readonly platform: AdminResolvedPlatformContext; readonly subject: AdminAuthenticatedSubject; readonly appUser: AdminAppUserContext; readonly adminUser: AdminUserContext; readonly session?: AdminSessionContext; readonly permissions: readonly AdminPermissionCode[]; }

export interface CreateTestAdminRequestContextInput { readonly platformCode?: AdminBrandCode; readonly brandCode?: AdminBrandCode; readonly platformId?: string; readonly brandId?: string; readonly platformDisplayName?: string; readonly brandDisplayName?: string; readonly adminProfileId?: string; readonly adminUserId?: string; readonly appUserId?: string; readonly providerSubjectId?: string; readonly correlationId?: string; readonly permissions?: readonly AdminPermissionCode[]; readonly status?: "active" | "suspended" | "revoked"; }
export function createTestAdminRequestContext(input: CreateTestAdminRequestContextInput): AdminRequestContext {
  const brandCode = input.brandCode ?? input.platformCode ?? "medway";
  const brandId = input.brandId ?? input.platformId ?? `platform-${brandCode}`;
  const brandDisplayName = input.brandDisplayName ?? input.platformDisplayName ?? (brandCode === "medway" ? "Medway" : "Elite");
  if (input.adminProfileId && input.adminUserId && input.adminProfileId !== input.adminUserId) throw new Error("Admin profile identity aliases must match.");
  const adminProfileId = input.adminProfileId ?? input.adminUserId ?? `${brandCode}-admin-001`;
  const appUserId = input.appUserId ?? `${brandCode}-user-admin-001`;
  const now = "2026-01-01T00:00:00.000Z";
  const brand: AdminResolvedBrandContext = { brandId, brandCode, brandDisplayName, resolvedFrom: "test_fixture", isActive: true };
  const platform: AdminResolvedPlatformContext = { ...brand, platformId: brandId, platformCode: brandCode, platformDisplayName: brandDisplayName };
  return { correlationId: input.correlationId ?? `${brandCode}-correlation-001`, brand, platform, subject: { providerSubjectId: input.providerSubjectId ?? `${brandCode}-provider-subject-001`, authProvider: "test", emailMasked: "admin@redacted.example" }, appUser: { appUserId, brandId, brandCode, platformId: brandId, platformCode: brandCode, status: "active" }, adminUser: { adminProfileId, adminUserId: adminProfileId, appUserId, brandId, brandCode, platformId: brandId, platformCode: brandCode, status: input.status ?? "active", roleIds: [`${brandCode}-role-001`], elevatedAccessExpiresAt: null }, session: { sessionId: `${brandCode}-session-001`, deviceId: `${brandCode}-device-001`, issuedAt: now, expiresAt: "2027-01-01T00:00:00.000Z" }, permissions: input.permissions ?? [] };
}
