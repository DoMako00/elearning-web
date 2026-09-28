import type { AuditedEntity, EntityId, Instant, PlatformScopedEntity } from "./shared";

export interface Platform extends AuditedEntity {
  readonly code: "medway" | "elite";
  readonly displayName: string;
  readonly status: "active" | "suspended" | "archived";
  readonly legalEntityReference: string | null;
  readonly defaultTimeZone: string;
}

/** A separate account exists for each platform, even where email strings match. */
export interface User extends AuditedEntity, PlatformScopedEntity {
  readonly email: string;
  readonly displayName: string;
  readonly status: "pending" | "active" | "disabled";
  readonly locale: string | null;
  readonly disabledAt: Instant | null;
}

export interface StudentProfile extends AuditedEntity, PlatformScopedEntity {
  readonly userId: EntityId;
  readonly status: "active" | "inactive";
  readonly academicProfileReference: string | null;
}

export interface OTPChallenge extends AuditedEntity, PlatformScopedEntity {
  readonly userId: EntityId | null;
  readonly destinationReference: string;
  readonly purpose: "registration" | "sign_in" | "device_replacement" | "sensitive_action";
  readonly status: "pending" | "verified" | "expired" | "cancelled";
  readonly expiresAt: Instant;
  readonly verifiedAt: Instant | null;
}

export interface Permission extends AuditedEntity, PlatformScopedEntity {
  readonly code: string;
  readonly description: string;
  readonly status: "active" | "inactive";
}

export interface Role extends AuditedEntity, PlatformScopedEntity {
  readonly code: string;
  readonly name: string;
  readonly permissionIds: readonly EntityId[];
  readonly status: "active" | "inactive";
}

export interface AdminUser extends AuditedEntity, PlatformScopedEntity {
  readonly userId: EntityId;
  readonly roleIds: readonly EntityId[];
  readonly status: "active" | "suspended" | "revoked";
  readonly elevatedAccessExpiresAt: Instant | null;
}

/** Organization or administrative affiliation; it never grants commercial access. */
export interface PlatformMembership extends AuditedEntity, PlatformScopedEntity {
  readonly userId: EntityId;
  readonly organizationReference: string | null;
  readonly membershipType: "student" | "organization_member" | "organization_admin" | "staff";
  readonly status: "invited" | "active" | "ended";
  readonly joinedAt: Instant | null;
  readonly endedAt: Instant | null;
}
