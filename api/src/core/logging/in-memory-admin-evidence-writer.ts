import { fail, ok, type Result } from "../../shared";
import { targetPlatformMismatchError, type AdminCoreError } from "../errors";
import type { AdminActionEvidenceInput, AdminAuditEvidenceInput, AdminEvidenceWriteResult, AdminSecurityEvidenceInput, AdminEvidenceWriter } from "./admin-evidence-writer";

type EvidenceRecord = AdminEvidenceWriteResult & Readonly<Record<string, unknown>>;
export class InMemoryAdminEvidenceWriter implements AdminEvidenceWriter {
  private readonly auditLogs: EvidenceRecord[] = [];
  private readonly adminActions: EvidenceRecord[] = [];
  private readonly securityEvents: EvidenceRecord[] = [];
  private sequence = 0;
  private write(input: { context: { platform: { platformId: string }; correlationId: string }; targetPlatformId: string }, prefix: string, data: Readonly<Record<string, unknown>>): Result<AdminEvidenceWriteResult, AdminCoreError> { if (input.context.platform.platformId !== input.targetPlatformId) return fail(targetPlatformMismatchError(input.context.correlationId)); this.sequence += 1; const result = { id: `${prefix}-${String(this.sequence).padStart(4, "0")}`, correlationId: input.context.correlationId, writtenAt: new Date().toISOString() }; const record = { ...result, ...data }; if (prefix.startsWith("audit")) this.auditLogs.push(record); else if (prefix.startsWith("admin-action")) this.adminActions.push(record); else this.securityEvents.push(record); return ok(result); }
  async writeAuditLog(input: AdminAuditEvidenceInput) { return this.write(input, "audit-test", { action: input.action, targetType: input.targetType, targetId: input.targetId, reason: input.reason, metadata: input.metadata }); }
  async writeAdminAction(input: AdminActionEvidenceInput) { return this.write(input, "admin-action-test", { commandName: input.commandName, targetType: input.targetType, targetId: input.targetId, outcome: input.outcome, reason: input.reason, metadata: input.metadata }); }
  async writeSecurityEvent(input: AdminSecurityEvidenceInput) { return this.write(input, "security-event-test", { eventType: input.eventType, severity: input.severity, targetType: input.targetType, targetId: input.targetId, reason: input.reason, metadata: input.metadata }); }
  getAuditLogs(): readonly EvidenceRecord[] { return [...this.auditLogs]; }
  getAdminActions(): readonly EvidenceRecord[] { return [...this.adminActions]; }
  getSecurityEvents(): readonly EvidenceRecord[] { return [...this.securityEvents]; }
}