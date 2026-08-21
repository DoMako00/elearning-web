/**
 * This self-test is exported for future test tooling and is not executed automatically.
 * It verifies brand-scope boundaries inside the single application platform.
 */

import type {
  AdminAdminActionItem,
  AdminAuditLogItem,
  AdminBrandContext,
  AdminPlatformContext,
  AdminSecurityEventItem,
  AdminSensitiveCommandMetadata,
} from "../../contracts/admin";
import { createTestAdminRequestContext, type AdminRequestContext } from "../../core/context";
import { notImplementedError } from "../../core/errors";
import { requireAdminPermission, InMemoryAdminPermissionResolver } from "../../core/permissions";
import { InMemoryAdminPolicyValidator } from "../../core/policies";
import { InMemoryAdminEvidenceWriter } from "../../core/logging";
import { fail, ok, type Result } from "../../shared";
import { executeAdminCommandBoundary, type AdminCommandBoundaryDependencies } from "./admin-command-boundary";
import { createAdminModule } from "./admin.module";
import { InMemoryAdminReadModels, type AdminOverviewSnapshot } from "./in-memory-admin-read-models";

export type SelfTestCaseResult = { name: string; passed: boolean; details?: Record<string, unknown> };
export type SelfTestRunResult = { passed: boolean; cases: SelfTestCaseResult[] };

function assertEqual(actual: unknown, expected: unknown, message: string): void {
  if (actual !== expected) throw new Error(`${message}: expected ${String(expected)}, received ${String(actual)}`);
}
function assertTruthy(value: unknown, message: string): void { if (!value) throw new Error(message); }
function assertOkResult<T, E>(result: Result<T, E>, message: string): T { if (!result.ok) throw new Error(message); return result.value; }
function assertFailResult<T, E extends { code: string }>(result: Result<T, E>, expectedCodeOrCodes: string | readonly string[], message: string): E {
  if (result.ok) throw new Error(`${message}: expected failure`);
  const expectedCodes = Array.isArray(expectedCodeOrCodes) ? expectedCodeOrCodes : [expectedCodeOrCodes];
  if (!expectedCodes.includes(result.error.code)) throw new Error(`${message}: received ${result.error.code}`);
  return result.error;
}
async function recordCase(name: string, fn: () => void | Promise<void>): Promise<SelfTestCaseResult> {
  try { await fn(); return { name, passed: true }; }
  catch (error) { return { name, passed: false, details: { message: error instanceof Error ? error.message : "Unexpected self-test failure." } }; }
}

const medwayPermissions = ["admin.students.read", "admin.students.suspend", "admin.audit.read", "admin.security.read"] as const;
const elitePermissions = ["admin.students.read", "admin.students.suspend", "admin.audit.read", "admin.security.read"] as const;
type TestPermission = (typeof medwayPermissions)[number];

function createContext(input: { brandCode: "medway" | "elite"; brandId: string; brandDisplayName: string; adminUserId: string; appUserId: string; providerSubjectId: string; correlationId: string; permissions: readonly TestPermission[] }): AdminRequestContext {
  return createTestAdminRequestContext({ ...input, platformId: input.brandId, platformCode: input.brandCode });
}
const medwayContext = createContext({ brandCode: "medway", brandId: "brand-medway", brandDisplayName: "Medway", adminUserId: "admin-medway-001", appUserId: "app-user-medway-001", providerSubjectId: "provider-medway-001", correlationId: "test-correlation-medway-brand-001", permissions: medwayPermissions });
const eliteContext = createContext({ brandCode: "elite", brandId: "brand-elite", brandDisplayName: "Elite", adminUserId: "admin-elite-001", appUserId: "app-user-elite-001", providerSubjectId: "provider-elite-001", correlationId: "test-correlation-elite-brand-001", permissions: elitePermissions });
const noPermissionMedwayContext = createContext({ brandCode: "medway", brandId: "brand-medway", brandDisplayName: "Medway", adminUserId: "admin-medway-no-permission", appUserId: "app-user-medway-no-permission", providerSubjectId: "provider-medway-no-permission", correlationId: "test-correlation-medway-brand-001", permissions: [] });

function platform(brand: AdminBrandContext): AdminPlatformContext { return { platformId: brand.brandId, platformCode: brand.brandCode, platformDisplayName: brand.brandDisplayName }; }
function overviewModel(brand: AdminBrandContext, prefix: string, multiplier: number): AdminOverviewSnapshot {
  const compatibilityPlatform = platform(brand);
  const auditLogs: AdminAuditLogItem[] = [{ id: `${prefix}-audit-001`, platform: compatibilityPlatform, occurredAt: "2026-01-01T10:00:00.000Z", actorType: "admin", actorId: `${prefix}-admin-001`, action: "overview_read", entityType: "brand", entityId: brand.brandId, correlationId: `${prefix}-correlation-001` }];
  const adminActions: AdminAdminActionItem[] = [{ id: `${prefix}-action-001`, platform: compatibilityPlatform, adminUserId: `${prefix}-admin-001`, actionType: "read_overview", targetEntityType: "brand", targetEntityId: brand.brandId, authorizationReference: `${prefix}-authorization-redacted-001`, occurredAt: "2026-01-01T10:00:00.000Z", outcome: "succeeded" }];
  const securityEvents: AdminSecurityEventItem[] = [{ id: `${prefix}-security-001`, platform: compatibilityPlatform, eventType: "admin_security", occurredAt: "2026-01-01T10:00:00.000Z", userId: `${prefix}-user-001`, sessionId: null, severity: "info", metadataReference: `${prefix}-security-redacted-001` }];
  return { brand, platform: compatibilityPlatform, counts: { pendingPaymentReviews: multiplier, pendingRefunds: multiplier, suspiciousSecurityEvents: multiplier, activeSubscriptions: multiplier, expiredSubscriptions: multiplier, activeGrants: multiplier, revokedGrants: multiplier, contentAwaitingRelease: multiplier, assessmentsAwaitingReview: multiplier }, recent: { auditLogs, adminActions, securityEvents } };
}
function createBrandScopedReadModels(): InMemoryAdminReadModels {
  const medwayBrand: AdminBrandContext = { brandId: "brand-medway", brandCode: "medway", brandDisplayName: "Medway" };
  const eliteBrand: AdminBrandContext = { brandId: "brand-elite", brandCode: "elite", brandDisplayName: "Elite" };
  return new InMemoryAdminReadModels(new Map([[medwayBrand.brandId, overviewModel(medwayBrand, "med", 2)], [eliteBrand.brandId, overviewModel(eliteBrand, "elite", 1)]]));
}
function metadata(context: AdminRequestContext, reason: string, idempotencyKey: string): AdminSensitiveCommandMetadata { return { platform: context.platform, reason, correlationId: context.correlationId, idempotencyKey }; }
function commandTarget(targetId: string, targetBrandId: string) { return { targetType: "student", targetId, targetBrandId, targetPlatformId: targetBrandId }; }
function dependencies(writer: InMemoryAdminEvidenceWriter, contexts: readonly AdminRequestContext[]): AdminCommandBoundaryDependencies {
  const permissions = Object.fromEntries(contexts.map((context) => [context.adminUser.adminUserId, context.permissions]));
  return { permissionResolver: new InMemoryAdminPermissionResolver(permissions), policyValidator: new InMemoryAdminPolicyValidator(), evidenceWriter: writer };
}

export async function runAdminBrandScopeSelfTest(): Promise<SelfTestRunResult> {
  const cases: SelfTestCaseResult[] = [];
  const overview = createAdminModule({ permissionResolver: new InMemoryAdminPermissionResolver(), policyValidator: new InMemoryAdminPolicyValidator(), evidenceWriter: new InMemoryAdminEvidenceWriter(), readModels: createBrandScopedReadModels() });
  cases.push(await recordCase("overview is brand scoped", async () => {
    const medway = assertOkResult(await overview.queries.getAdminOverview(medwayContext), "Medway overview should succeed");
    const elite = assertOkResult(await overview.queries.getAdminOverview(eliteContext), "Elite overview should succeed");
    assertEqual(medway.brand.brandCode, "medway", "Medway brand code"); assertEqual(elite.brand.brandCode, "elite", "Elite brand code");
    assertEqual(medway.platform.platformCode, "medway", "Medway compatibility code"); assertEqual(elite.platform.platformCode, "elite", "Elite compatibility code");
    assertTruthy(medway.counts.activeSubscriptions !== elite.counts.activeSubscriptions, "Brand counts should differ");
    assertTruthy(!JSON.stringify(medway.recent).includes("elite-"), "Medway evidence must not contain Elite IDs");
    assertTruthy(!JSON.stringify(elite.recent).includes("med-"), "Elite evidence must not contain Medway IDs");
  }));
  const runBoundary = async (context: AdminRequestContext, writer: InMemoryAdminEvidenceWriter, targetBrandId: string, commandMetadata: AdminSensitiveCommandMetadata, run: () => Promise<Result<unknown, ReturnType<typeof notImplementedError>>>, writeAudit = false) => executeAdminCommandBoundary({ context, requiredPermission: "admin.students.suspend", commandName: "suspendStudentBrandScopeSelfTest", target: commandTarget("selftest-student", targetBrandId), metadata: commandMetadata, run, writeAudit }, dependencies(writer, [medwayContext, eliteContext, noPermissionMedwayContext]));
  cases.push(await recordCase("missing permission returns permission_denied", async () => {
    let executed = false; const writer = new InMemoryAdminEvidenceWriter();
    const result = await runBoundary(noPermissionMedwayContext, writer, "brand-medway", metadata(noPermissionMedwayContext, "Self-test permission denial", "idem-brand-selftest-001"), async () => { executed = true; return ok({ shouldNotRun: true }); });
    assertFailResult(result, "permission_denied", "Missing permission"); assertEqual(executed, false, "Denied command body execution"); assertTruthy(writer.getAdminActions().some((item) => item.outcome === "denied"), "Denied admin action evidence");
  }));
  cases.push(await recordCase("missing reason returns reason_required", async () => {
    let executed = false; const writer = new InMemoryAdminEvidenceWriter();
    const result = await runBoundary(medwayContext, writer, "brand-medway", metadata(medwayContext, "", "idem-brand-selftest-002"), async () => { executed = true; return ok({}); });
    assertFailResult(result, "reason_required", "Missing reason"); assertEqual(executed, false, "Reason validation command body execution");
  }));
  cases.push(await recordCase("missing idempotency key returns idempotency_key_required", async () => {
    let executed = false; const writer = new InMemoryAdminEvidenceWriter();
    const incomplete = { platform: medwayContext.platform, reason: "Self-test missing idempotency key", correlationId: medwayContext.correlationId } as unknown as AdminSensitiveCommandMetadata;
    const result = await runBoundary(medwayContext, writer, "brand-medway", incomplete, async () => { executed = true; return ok({}); });
    assertFailResult(result, "idempotency_key_required", "Missing idempotency key"); assertEqual(executed, false, "Idempotency validation command body execution");
  }));
  for (const [name, context, targetBrandId, suffix] of [["medway brand admin cannot target elite brand", medwayContext, "brand-elite", "003"], ["elite brand admin cannot target medway brand", eliteContext, "brand-medway", "004"]] as const) {
    cases.push(await recordCase(name, async () => {
      let executed = false; const writer = new InMemoryAdminEvidenceWriter();
      const result = await runBoundary(context, writer, targetBrandId, metadata(context, "Self-test cross-brand denial", `idem-brand-selftest-${suffix}`), async () => { executed = true; return ok({}); });
      assertFailResult(result, ["target_brand_mismatch", "brand_mismatch", "target_platform_mismatch", "platform_mismatch"], "Cross-brand command"); assertEqual(executed, false, "Cross-brand command body execution"); assertTruthy(writer.getAdminActions().every((item) => typeof item.targetId === "string" && typeof item.targetType === "string"), "Evidence must remain redaction-safe");
    }));
  }
  cases.push(await recordCase("successful command writes admin action and audit evidence", async () => {
    let executionCount = 0; const writer = new InMemoryAdminEvidenceWriter(); const successContext = { ...medwayContext, correlationId: "test-correlation-medway-brand-success-001" };
    const result = await runBoundary(successContext, writer, "brand-medway", metadata(successContext, "Self-test successful command", "idem-brand-selftest-success-001"), async () => { executionCount += 1; return ok({ updated: true }); }, true);
    const value = assertOkResult(result, "Successful command"); assertEqual(executionCount, 1, "Successful command body execution count"); assertTruthy(value.adminActionId, "Successful admin action ID"); assertTruthy(value.auditEventId, "Successful audit event ID"); assertEqual(value.correlationId, successContext.correlationId, "Successful correlation ID"); assertEqual(writer.getAdminActions().at(-1)?.outcome, "succeeded", "Successful admin action outcome"); assertEqual(writer.getAdminActions().at(-1)?.correlationId, successContext.correlationId, "Evidence correlation ID");
  }));
  cases.push(await recordCase("failed command body writes failed admin action", async () => {
    let executionCount = 0; const writer = new InMemoryAdminEvidenceWriter(); const failedContext = { ...medwayContext, correlationId: "test-correlation-medway-brand-failed-001" };
    const result = await runBoundary(failedContext, writer, "brand-medway", metadata(failedContext, "Self-test failed command body", "idem-brand-selftest-failed-001"), async () => { executionCount += 1; return fail(notImplementedError(failedContext.correlationId)); });
    assertFailResult(result, "not_implemented", "Failed command body"); assertEqual(executionCount, 1, "Failed command body execution count"); assertEqual(writer.getAdminActions().at(-1)?.outcome, "failed", "Failed admin action outcome"); assertEqual(writer.getAdminActions().at(-1)?.correlationId, failedContext.correlationId, "Failed evidence correlation ID");
  }));
  cases.push(await recordCase("permission checker accepts and denies correctly", () => { assertOkResult(requireAdminPermission(medwayContext, "admin.students.suspend"), "Permitted Medway permission"); assertFailResult(requireAdminPermission(noPermissionMedwayContext, "admin.students.suspend"), "permission_denied", "Denied Medway permission"); }));
  cases.push(await recordCase("brand compatibility aliases remain available", () => { assertTruthy(medwayContext.brand, "Canonical brand context"); assertTruthy(medwayContext.platform, "Compatibility platform context"); assertEqual(medwayContext.brand.brandCode, "medway", "Canonical brand code"); assertEqual(medwayContext.platform.platformCode, "medway", "Compatibility brand code"); assertEqual(medwayContext.appUser.brandId, "brand-medway", "App-user brand ID"); assertEqual(medwayContext.adminUser.brandCode, "medway", "Admin-user brand code"); assertEqual(medwayContext.appUser.platformId, "brand-medway", "Compatibility app-user scope ID"); assertEqual(medwayContext.adminUser.platformCode, "medway", "Compatibility admin-user scope code"); }));
  return { passed: cases.every((testCase) => testCase.passed), cases };
}
