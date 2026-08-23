import { InMemoryAuthIdentityAdapter } from "../auth";
import { repositoryErr, repositoryOk } from "../persistence";
import type { M1AdminAuthorizationSnapshot, M1AdminProfileReadRepository, M1EducationalBrand, M1EducationalBrandReadRepository } from "../repositories";
import { DefaultAdminHttpRequestContextResolver } from "./admin-http-request-context";

const brandId = "10000000-0000-4000-8000-000000000001";
const now = "2026-01-01T00:00:00.000Z";
const brand: M1EducationalBrand = { id: brandId, code: "medway", name: "Medway", slug: "medway", status: "active", createdAt: now, updatedAt: now };

function assert(condition: unknown, message: string): asserts condition { if (!condition) throw new Error(message); }

function snapshot(overrides: Partial<M1AdminAuthorizationSnapshot> = {}): M1AdminAuthorizationSnapshot {
  return {
    appUser: { id: "10000000-0000-4000-8000-000000000010", authUserId: "auth-medway-admin-001", primaryEmail: "admin@example.test", primaryPhone: null, status: "active", createdAt: now, updatedAt: now },
    adminProfile: { id: "10000000-0000-4000-8000-000000000011", brandId, appUserId: "10000000-0000-4000-8000-000000000010", displayName: "Medway Admin", status: "active", createdAt: now, updatedAt: now },
    roleCodes: ["admin.m2"],
    permissionCodes: ["admin.instructors.create", "admin.brand_courses.update"],
    ...overrides,
  };
}

class Brands implements M1EducationalBrandReadRepository {
  constructor(private readonly record: M1EducationalBrand | undefined = brand) {}
  async findEducationalBrandById(input: { readonly id: string; readonly correlationId?: string }) { return this.record?.id === input.id ? repositoryOk(this.record) : repositoryErr({ code: "not_found", message: "not found", correlationId: input.correlationId }); }
  async findEducationalBrandByCode(input: { readonly code: "medway" | "elite"; readonly correlationId?: string }) { return this.record?.code === input.code ? repositoryOk(this.record) : repositoryErr({ code: "not_found", message: "not found", correlationId: input.correlationId }); }
}
class Profiles implements M1AdminProfileReadRepository {
  constructor(private readonly record: M1AdminAuthorizationSnapshot | null = snapshot()) {}
  async findAdminProfileById() { return repositoryErr({ code: "not_found", message: "unused" }); }
  async findAdminProfileByUserId() { return repositoryErr({ code: "not_found", message: "unused" }); }
  async resolveAdminAuthorizationByAuthUserId(input: { readonly correlationId?: string }) { return this.record ? repositoryOk(this.record) : repositoryErr({ code: "not_found", message: "not found", correlationId: input.correlationId }); }
}

export async function runAdminHttpRequestContextSelfTest(): Promise<void> {
  const resolver = new DefaultAdminHttpRequestContextResolver({ authIdentityAdapter: new InMemoryAuthIdentityAdapter(), educationalBrands: new Brands(), adminProfiles: new Profiles() });
  const base = { requestId: "req-selftest", correlationId: "corr-selftest", bearerToken: "mock-auth-medway-admin-001", requestedBrandId: brandId };
  const context = await resolver.resolve({ ...base, adminProfileId: "attacker", permissions: ["admin.roles.manage"], roles: ["owner"] } as typeof base);
  assert(context.ok, "valid backend-derived context must resolve");
  if (context.ok) {
    assert(context.value.adminUser.adminProfileId === "10000000-0000-4000-8000-000000000011", "profile ID must come from M1 state");
    assert(context.value.adminUser.adminProfileId === context.value.adminUser.adminUserId, "compatibility aliases must agree");
    assert(context.value.permissions.includes("admin.instructors.create") && !context.value.permissions.includes("admin.roles.manage"), "client permission injection must be ignored");
    assert(context.value.requestId === base.requestId && context.value.correlationId === base.correlationId, "server request identifiers must be preserved");
    assert(!JSON.stringify(context.value).includes(base.bearerToken), "raw bearer credential must not enter context");
  }
  const missingAuth = await resolver.resolve({ ...base, bearerToken: undefined });
  assert(!missingAuth.ok && missingAuth.error.code === "authentication_required", "missing principal must fail safely");
  const malformedBrand = await resolver.resolve({ ...base, requestedBrandId: "bad" });
  assert(!malformedBrand.ok && malformedBrand.error.code === "invalid_input", "malformed route brand must fail before reads");
  const noProfile = await new DefaultAdminHttpRequestContextResolver({ authIdentityAdapter: new InMemoryAuthIdentityAdapter(), educationalBrands: new Brands(), adminProfiles: new Profiles(null) }).resolve(base);
  assert(!noProfile.ok && noProfile.error.code === "permission_denied", "missing admin profile must be forbidden");
  const inactiveBrand = await new DefaultAdminHttpRequestContextResolver({ authIdentityAdapter: new InMemoryAuthIdentityAdapter(), educationalBrands: new Brands({ ...brand, status: "inactive" }), adminProfiles: new Profiles() }).resolve(base);
  assert(!inactiveBrand.ok && inactiveBrand.error.code === "permission_denied", "inactive brand must be forbidden");
  const malformedPermissions = await new DefaultAdminHttpRequestContextResolver({ authIdentityAdapter: new InMemoryAuthIdentityAdapter(), educationalBrands: new Brands(), adminProfiles: new Profiles(snapshot({ permissionCodes: ["admin.unreviewed"] })) }).resolve(base);
  assert(!malformedPermissions.ok && malformedPermissions.error.code === "persistence_data_invalid", "unknown persisted permission must fail closed");
}

if (process.argv[1]?.endsWith("admin-http-request-context.selftest.js")) {
  runAdminHttpRequestContextSelfTest().then(() => console.log("admin HTTP request context selftest passed"));
}
