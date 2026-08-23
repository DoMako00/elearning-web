import type { AdminUser, AppSession, Device, StudentProfile, User } from "../../domain";
import type { BrandScope } from "../brand-scope";
import { medwayAdminVerificationAuthIdentityId } from "../auth";
import {
  repositoryErr,
  repositoryOk,
  type AdminProfileId,
  type AppUserId,
  type AuthIdentityId,
  type BrandScopedLookup,
  type BrandScopedQuery,
  type DeviceId,
  type SessionId,
  type StudentProfileId,
} from "../persistence";
import type { RepositoryResult } from "../persistence";
import type { AdminPermissionSnapshot, AdminProfileRepository } from "./admin-profile-repository";
import type { DeviceRepository } from "./device-repository";
import type { SessionRepository } from "./session-repository";
import type { StudentProfileRepository } from "./student-profile-repository";
import type { UserRepository } from "./user-repository";

const now = "2026-01-01T00:00:00.000Z";
const later = "2027-01-01T00:00:00.000Z";

const asAppUserId = (value: string) => value as AppUserId;
const asAdminProfileId = (value: string) => value as AdminProfileId;
const asStudentProfileId = (value: string) => value as StudentProfileId;
const asSessionId = (value: string) => value as SessionId;
const asDeviceId = (value: string) => value as DeviceId;

function notFound(message: string, correlationId?: string): RepositoryResult<never> {
  return repositoryErr({ code: "not_found", message, correlationId });
}

function brandMatches(entity: { readonly platformId: string }, brand: BrandScope): boolean {
  return entity.platformId === brand.brandId;
}

export const inMemoryContextUsers: readonly User[] = [
  { id: asAppUserId("user-medway-admin-001"), platformId: "brand-medway", email: "medway-admin@example.test", displayName: "Medway Admin", status: "active", locale: "en", disabledAt: null, createdAt: now },
  { id: asAppUserId("user-medway-student-001"), platformId: "brand-medway", email: "medway-student@example.test", displayName: "Medway Student", status: "active", locale: "en", disabledAt: null, createdAt: now },
  { id: asAppUserId("user-elite-admin-001"), platformId: "brand-elite", email: "elite-admin@example.test", displayName: "Elite Admin", status: "active", locale: "en", disabledAt: null, createdAt: now },
  { id: asAppUserId("user-elite-student-001"), platformId: "brand-elite", email: "elite-student@example.test", displayName: "Elite Student", status: "active", locale: "en", disabledAt: null, createdAt: now },
];

const authToUser = new Map<AuthIdentityId, AppUserId>([
  [medwayAdminVerificationAuthIdentityId, asAppUserId("user-medway-admin-001")],
  ["auth-medway-student-001" as AuthIdentityId, asAppUserId("user-medway-student-001")],
  ["auth-elite-admin-001" as AuthIdentityId, asAppUserId("user-elite-admin-001")],
  ["auth-elite-student-001" as AuthIdentityId, asAppUserId("user-elite-student-001")],
]);

export class InMemoryUserRepository implements UserRepository {
  constructor(
    private readonly users: readonly User[] = inMemoryContextUsers,
    private readonly authUsers: ReadonlyMap<AuthIdentityId, AppUserId> = authToUser,
  ) {}

  async findUserById(input: BrandScopedLookup<AppUserId>): Promise<RepositoryResult<User>> {
    const user = this.users.find((candidate) => candidate.id === input.id && brandMatches(candidate, input.brand));
    return user ? repositoryOk(user) : notFound("Application user was not found.", input.correlationId);
  }

  async findUserByAuthIdentity(input: { readonly authIdentityId: AuthIdentityId; readonly brand: BrandScope; readonly correlationId?: string }): Promise<RepositoryResult<User>> {
    const userId = this.authUsers.get(input.authIdentityId);
    const user = userId ? this.users.find((candidate) => candidate.id === userId && brandMatches(candidate, input.brand)) : undefined;
    return user ? repositoryOk(user) : notFound("Application user was not found for this authentication identity and brand.", input.correlationId);
  }

  async findUsersByBrandScope(input: BrandScopedQuery): Promise<RepositoryResult<readonly User[]>> {
    return repositoryOk(this.users.filter((candidate) => brandMatches(candidate, input.brand)));
  }
}

const adminProfiles: readonly AdminUser[] = [
  { id: asAdminProfileId("admin-medway-001"), platformId: "brand-medway", userId: asAppUserId("user-medway-admin-001"), roleIds: ["admin-medway-role-001"], status: "active", elevatedAccessExpiresAt: null, createdAt: now },
  { id: asAdminProfileId("admin-elite-001"), platformId: "brand-elite", userId: asAppUserId("user-elite-admin-001"), roleIds: ["admin-elite-role-001"], status: "active", elevatedAccessExpiresAt: null, createdAt: now },
];

const adminPermissions = new Map<AppUserId, AdminPermissionSnapshot>([
  [asAppUserId("user-medway-admin-001"), { roleCodes: ["admin.support"], permissionCodes: ["admin.students.read", "admin.audit.read", "admin.security.read"], isGlobalRole: false }],
  [asAppUserId("user-elite-admin-001"), { roleCodes: ["admin.support"], permissionCodes: ["admin.students.read", "admin.audit.read", "admin.security.read"], isGlobalRole: false }],
]);

export class InMemoryAdminProfileRepository implements AdminProfileRepository {
  constructor(private readonly profiles: readonly AdminUser[] = adminProfiles) {}

  async findAdminProfileByUserId(input: BrandScopedLookup<AppUserId>): Promise<RepositoryResult<AdminUser>> {
    const profile = this.profiles.find((candidate) => candidate.userId === input.id && brandMatches(candidate, input.brand));
    return profile ? repositoryOk(profile) : notFound("Admin profile was not found.", input.correlationId);
  }

  async findAdminProfileById(input: BrandScopedLookup<AdminProfileId>): Promise<RepositoryResult<AdminUser>> {
    const profile = this.profiles.find((candidate) => candidate.id === input.id && brandMatches(candidate, input.brand));
    return profile ? repositoryOk(profile) : notFound("Admin profile was not found.", input.correlationId);
  }

  async findAdminBrandScopes(input: { readonly userId: AppUserId; readonly correlationId?: string }): Promise<RepositoryResult<readonly BrandScope[]>> {
    const profiles = this.profiles.filter((candidate) => candidate.userId === input.userId);
    return repositoryOk(profiles.map((profile) => ({
      brandId: profile.platformId as BrandScope["brandId"],
      brandCode: profile.platformId === "brand-medway" ? "medway" : "elite",
      brandDisplayName: profile.platformId === "brand-medway" ? "Medway" : "Elite",
      isActive: profile.status === "active",
    })));
  }

  async findAdminPermissions(input: BrandScopedLookup<AppUserId>): Promise<RepositoryResult<AdminPermissionSnapshot>> {
    const profile = await this.findAdminProfileByUserId(input);
    if (!profile.ok) return profile;
    return repositoryOk(adminPermissions.get(profile.value.userId as AppUserId) ?? { roleCodes: [], permissionCodes: [], isGlobalRole: false });
  }
}

const studentProfiles: readonly StudentProfile[] = [
  { id: asStudentProfileId("student-medway-001"), platformId: "brand-medway", userId: asAppUserId("user-medway-student-001"), status: "active", academicProfileReference: "academic-medway-001", createdAt: now },
  { id: asStudentProfileId("student-elite-001"), platformId: "brand-elite", userId: asAppUserId("user-elite-student-001"), status: "active", academicProfileReference: "academic-elite-001", createdAt: now },
];

export class InMemoryStudentProfileRepository implements StudentProfileRepository {
  constructor(private readonly profiles: readonly StudentProfile[] = studentProfiles) {}

  async findStudentProfileByUserId(input: BrandScopedLookup<AppUserId>): Promise<RepositoryResult<StudentProfile>> {
    const profile = this.profiles.find((candidate) => candidate.userId === input.id && brandMatches(candidate, input.brand));
    return profile ? repositoryOk(profile) : notFound("Student profile was not found.", input.correlationId);
  }

  async findStudentProfileByBrand(input: BrandScopedQuery): Promise<RepositoryResult<readonly StudentProfile[]>> {
    return repositoryOk(this.profiles.filter((candidate) => brandMatches(candidate, input.brand)));
  }

  async findStudentAcademicProfile(input: BrandScopedLookup<StudentProfileId>): Promise<RepositoryResult<{ readonly profileId: StudentProfileId; readonly summaryReference?: string }>> {
    const profile = this.profiles.find((candidate) => candidate.id === input.id && brandMatches(candidate, input.brand));
    return profile ? repositoryOk({ profileId: profile.id as StudentProfileId, summaryReference: profile.academicProfileReference ?? undefined }) : notFound("Student academic profile was not found.", input.correlationId);
  }
}

const sessions: readonly AppSession[] = [
  { id: asSessionId("session-medway-admin-001"), platformId: "brand-medway", userId: asAppUserId("user-medway-admin-001"), deviceId: asDeviceId("device-medway-admin-001"), issuedAt: now, expiresAt: later, revokedAt: null, status: "active", createdAt: now },
  { id: asSessionId("session-medway-student-001"), platformId: "brand-medway", userId: asAppUserId("user-medway-student-001"), deviceId: asDeviceId("device-medway-student-001"), issuedAt: now, expiresAt: later, revokedAt: null, status: "active", createdAt: now },
  { id: asSessionId("session-elite-admin-001"), platformId: "brand-elite", userId: asAppUserId("user-elite-admin-001"), deviceId: asDeviceId("device-elite-admin-001"), issuedAt: now, expiresAt: later, revokedAt: null, status: "active", createdAt: now },
  { id: asSessionId("session-elite-student-001"), platformId: "brand-elite", userId: asAppUserId("user-elite-student-001"), deviceId: asDeviceId("device-elite-student-001"), issuedAt: now, expiresAt: later, revokedAt: null, status: "active", createdAt: now },
];

export class InMemorySessionRepository implements SessionRepository {
  constructor(private readonly records: readonly AppSession[] = sessions) {}

  async findSessionById(input: BrandScopedLookup<SessionId>): Promise<RepositoryResult<AppSession>> {
    // Return the identified record so the context builder can distinguish a brand mismatch from absence.
    const session = this.records.find((candidate) => candidate.id === input.id);
    return session ? repositoryOk(session) : notFound("Session was not found.", input.correlationId);
  }

  async findActiveSessionsForUser(input: BrandScopedLookup<AppUserId>): Promise<RepositoryResult<readonly AppSession[]>> {
    return repositoryOk(this.records.filter((candidate) => candidate.userId === input.id && candidate.status === "active" && brandMatches(candidate, input.brand)));
  }

  async revokeSession(): Promise<RepositoryResult<void>> {
    return repositoryOk(undefined);
  }

  async recordSessionEvent(): Promise<RepositoryResult<void>> {
    return repositoryOk(undefined);
  }
}

const devices: readonly Device[] = [
  { id: asDeviceId("device-medway-admin-001"), platformId: "brand-medway", userId: asAppUserId("user-medway-admin-001"), fingerprintReference: "opaque-medway-admin", deviceType: "browser", trustStatus: "recognized", firstSeenAt: now, lastSeenAt: now, revokedAt: null, createdAt: now },
  { id: asDeviceId("device-medway-student-001"), platformId: "brand-medway", userId: asAppUserId("user-medway-student-001"), fingerprintReference: "opaque-medway-student", deviceType: "browser", trustStatus: "recognized", firstSeenAt: now, lastSeenAt: now, revokedAt: null, createdAt: now },
  { id: asDeviceId("device-medway-revoked-001"), platformId: "brand-medway", userId: asAppUserId("user-medway-admin-001"), fingerprintReference: "opaque-medway-revoked", deviceType: "browser", trustStatus: "revoked", firstSeenAt: now, lastSeenAt: now, revokedAt: now, createdAt: now },
  { id: asDeviceId("device-elite-admin-001"), platformId: "brand-elite", userId: asAppUserId("user-elite-admin-001"), fingerprintReference: "opaque-elite-admin", deviceType: "browser", trustStatus: "recognized", firstSeenAt: now, lastSeenAt: now, revokedAt: null, createdAt: now },
  { id: asDeviceId("device-elite-student-001"), platformId: "brand-elite", userId: asAppUserId("user-elite-student-001"), fingerprintReference: "opaque-elite-student", deviceType: "browser", trustStatus: "recognized", firstSeenAt: now, lastSeenAt: now, revokedAt: null, createdAt: now },
];

export class InMemoryDeviceRepository implements DeviceRepository {
  constructor(private readonly records: readonly Device[] = devices) {}

  async findDeviceById(input: BrandScopedLookup<DeviceId>): Promise<RepositoryResult<Device>> {
    // Return the identified record so the context builder can distinguish a brand mismatch from absence.
    const device = this.records.find((candidate) => candidate.id === input.id);
    return device ? repositoryOk(device) : notFound("Device was not found.", input.correlationId);
  }

  async findDevicesForUser(input: BrandScopedLookup<AppUserId>): Promise<RepositoryResult<readonly Device[]>> {
    return repositoryOk(this.records.filter((candidate) => candidate.userId === input.id && brandMatches(candidate, input.brand)));
  }

  async findActiveDevicesForUser(input: BrandScopedLookup<AppUserId>): Promise<RepositoryResult<readonly Device[]>> {
    return repositoryOk(this.records.filter((candidate) => candidate.userId === input.id && candidate.trustStatus !== "revoked" && !candidate.revokedAt && brandMatches(candidate, input.brand)));
  }

  async recordDeviceSeen(): Promise<RepositoryResult<void>> {
    return repositoryOk(undefined);
  }

  async revokeDevice(): Promise<RepositoryResult<void>> {
    return repositoryOk(undefined);
  }

  async recordDeviceEvent(): Promise<RepositoryResult<void>> {
    return repositoryOk(undefined);
  }
}
