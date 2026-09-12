import type { AuditedEntity, EntityId, Instant, PlatformScopedEntity } from "./shared";

/** Immutable record of a consequential domain or administrative state change. */
export interface AuditLog extends AuditedEntity, PlatformScopedEntity {
  readonly occurredAt: Instant;
  readonly actorType: "user" | "admin" | "system" | "integration";
  readonly actorId: EntityId | null;
  readonly action: string;
  readonly entityType: string;
  readonly entityId: EntityId;
  readonly beforeReference: string | null;
  readonly afterReference: string | null;
  readonly correlationId: string;
}

export interface AnalyticsEvent extends AuditedEntity, PlatformScopedEntity {
  readonly eventName: string;
  readonly occurredAt: Instant;
  readonly userId: EntityId | null;
  readonly resourceType: string | null;
  readonly resourceId: EntityId | null;
  readonly payloadReference: string | null;
}

export interface SecurityEvent extends AuditedEntity, PlatformScopedEntity {
  readonly eventType: "authentication" | "otp" | "device" | "session" | "access_denied" | "admin_security";
  readonly occurredAt: Instant;
  readonly userId: EntityId | null;
  readonly sessionId: EntityId | null;
  readonly severity: "info" | "warning" | "critical";
  readonly metadataReference: string | null;
}

export interface AdminAction extends AuditedEntity, PlatformScopedEntity {
  readonly adminUserId: EntityId;
  readonly actionType: string;
  readonly targetEntityType: string;
  readonly targetEntityId: EntityId;
  readonly authorizationReference: string;
  readonly occurredAt: Instant;
  readonly outcome: "succeeded" | "denied" | "failed";
}
