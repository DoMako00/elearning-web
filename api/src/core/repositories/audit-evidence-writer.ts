import type { BrandCode, BrandId } from "../brand-scope";
import type { EvidenceId, RepositoryActorReference, RepositoryRequestMetadata, RepositoryTargetReference } from "../persistence";
import type { RepositoryResult } from "../persistence";

export type EvidenceCategory =
  | "admin_action"
  | "security_event"
  | "access_decision"
  | "payment_event"
  | "subscription_event"
  | "device_event"
  | "media_event"
  | "assessment_event";

export interface EvidenceInput extends RepositoryRequestMetadata {
  readonly category: EvidenceCategory;
  readonly actor?: RepositoryActorReference;
  readonly brandId?: BrandId;
  readonly brandCode?: BrandCode;
  readonly target?: RepositoryTargetReference;
  readonly decision: string;
  readonly reason?: string;
  readonly metadata?: Readonly<Record<string, unknown>>;
}

export interface WrittenEvidence {
  readonly evidenceId: EvidenceId;
  readonly writtenAt: string;
  readonly correlationId?: string;
}

export interface AuditEvidenceWriter {
  writeEvidence(input: EvidenceInput): Promise<RepositoryResult<WrittenEvidence>>;
  writeAdminActionEvidence(input: Omit<EvidenceInput, "category">): Promise<RepositoryResult<WrittenEvidence>>;
  writeAccessDecisionEvidence(input: Omit<EvidenceInput, "category">): Promise<RepositoryResult<WrittenEvidence>>;
  writeSecurityEventEvidence(input: Omit<EvidenceInput, "category">): Promise<RepositoryResult<WrittenEvidence>>;
}

