import type { EntityId, IdempotencyKey, PolicySetId, CorrelationId } from "./common";
import type { AdminPlatformContext } from "./platform";

export interface AdminCommandMetadata {
  platform: AdminPlatformContext;
  reason: string;
  correlationId: CorrelationId;
  idempotencyKey?: IdempotencyKey;
  policySetId?: PolicySetId;
  expectedVersion?: string | number;
}

export interface AdminSensitiveCommandMetadata extends AdminCommandMetadata {
  reason: string;
  idempotencyKey: IdempotencyKey;
}

export interface AdminTargetRef {
  targetType: string;
  targetId: EntityId;
  targetLabel?: string;
}

/** Command intent is not execution; future handlers must validate all authority and workflow rules. */
export interface AdminCommandIntent<TPayload = Record<string, unknown>> {
  metadata: AdminSensitiveCommandMetadata;
  target: AdminTargetRef;
  payload: TPayload;
}
