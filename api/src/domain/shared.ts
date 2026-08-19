export type EntityId = string;
export type Instant = string;
export type PlatformCode = "medway" | "elite";

export interface AuditedEntity {
  readonly id: EntityId;
  readonly createdAt: Instant;
  readonly updatedAt?: Instant;
}

/** Required on every persisted record except Platform itself. */
export interface PlatformScopedEntity {
  readonly platformId: EntityId;
}

export interface VersionedPolicyReference {
  readonly policySetId: EntityId;
  readonly policyVersion: number;
  readonly policyKey: string;
}

export type LifecycleStatus = "draft" | "active" | "suspended" | "inactive" | "archived";

export class DomainRuleViolation extends Error {
  constructor(readonly code: string, message: string) {
    super(message);
    this.name = "DomainRuleViolation";
  }
}

export function assertRule(condition: unknown, code: string, message: string): asserts condition {
  if (!condition) throw new DomainRuleViolation(code, message);
}

export function assertSamePlatform(
  expectedPlatformId: EntityId,
  entity: PlatformScopedEntity,
  relation: string,
) {
  assertRule(entity.platformId === expectedPlatformId, "cross_platform_reference", `${relation} must belong to the same platform.`);
}

export function isActiveDuring(startsAt: Instant, endsAt: Instant | null, at: Instant) {
  return startsAt <= at && (!endsAt || at < endsAt);
}
