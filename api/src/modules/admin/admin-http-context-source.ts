import { InMemoryAuthIdentityAdapter, medwayAdminVerificationAuthIdentityId, type AuthIdentityAdapter } from "../../core/auth";
import { DefaultAdminHttpRequestContextResolver, type AdminHttpRequestContextResolver } from "../../core/context";
import { repositoryErr, repositoryOk, type PersistenceRuntimeComposition } from "../../core/persistence";
import type { M1AdminAuthorizationSnapshot, M1AdminProfile, M1AdminProfileReadRepository, M1EducationalBrand, M1EducationalBrandReadRepository } from "../../core/repositories";
import type { SupabaseBoundaryEnvironment } from "../../infrastructure/supabase/supabase-config";
import { resolveSupabaseBoundaryConfiguration } from "../../infrastructure/supabase/supabase-config";
import { resolveSupabaseAuthConfiguration, SupabaseAuthConfigurationError } from "../../infrastructure/supabase/supabase-auth-config";
import { SupabaseJwtJwksAuthIdentityAdapter } from "../../infrastructure/supabase/supabase-jwt-adapter";

export class AdminHttpContextConfigurationError extends Error {
  constructor(message: string) { super(message); this.name = "AdminHttpContextConfigurationError"; }
}

const now = "2026-01-01T00:00:00.000Z";
const mockBrands: readonly M1EducationalBrand[] = [
  { id: "10000000-0000-4000-8000-000000000001", code: "medway", name: "Medway", slug: "medway", status: "active", createdAt: now, updatedAt: now },
  { id: "10000000-0000-4000-8000-000000000003", code: "elite", name: "Elite", slug: "elite", status: "active", createdAt: now, updatedAt: now },
];

class MockEducationalBrands implements M1EducationalBrandReadRepository {
  async findEducationalBrandById(input: { readonly id: string; readonly correlationId?: string }) {
    const record = mockBrands.find((brand) => brand.id === input.id);
    return record ? repositoryOk(record) : repositoryErr({ code: "not_found", message: "Requested record was not found.", correlationId: input.correlationId });
  }
  async findEducationalBrandByCode(input: { readonly code: "medway" | "elite"; readonly correlationId?: string }) {
    const record = mockBrands.find((brand) => brand.code === input.code);
    return record ? repositoryOk(record) : repositoryErr({ code: "not_found", message: "Requested record was not found.", correlationId: input.correlationId });
  }
}

class MockAdminProfiles implements M1AdminProfileReadRepository {
  private profile(input: { readonly appUserId: string; readonly brandId: string }): M1AdminProfile | undefined {
    const brand = mockBrands.find((item) => item.id === input.brandId);
    if (!brand) return undefined;
    const expected = brand.code === "medway" ? medwayAdminVerificationAuthIdentityId : "auth-elite-admin-001";
    if (input.appUserId !== expected) return undefined;
    return { id: brand.code === "medway" ? "10000000-0000-4000-8000-000000000002" : "10000000-0000-4000-8000-000000000004", brandId: brand.id, appUserId: input.appUserId, displayName: `${brand.name} Admin`, status: "active", createdAt: now, updatedAt: now };
  }
  async findAdminProfileById(input: { readonly id: string; readonly brand: { readonly brandId: string }; readonly correlationId?: string }) {
    const profile = this.profile({ appUserId: input.brand.brandId === mockBrands[0]?.id ? medwayAdminVerificationAuthIdentityId : "auth-elite-admin-001", brandId: input.brand.brandId });
    return profile?.id === input.id ? repositoryOk(profile) : repositoryErr({ code: "not_found", message: "Requested record was not found.", correlationId: input.correlationId });
  }
  async findAdminProfileByUserId(input: { readonly appUserId: string; readonly brand: { readonly brandId: string }; readonly correlationId?: string }) {
    const profile = this.profile({ appUserId: input.appUserId, brandId: input.brand.brandId });
    return profile ? repositoryOk(profile) : repositoryErr({ code: "not_found", message: "Requested record was not found.", correlationId: input.correlationId });
  }
  async resolveAdminAuthorizationByAuthUserId(input: { readonly authUserId: string; readonly brand: { readonly brandId: string }; readonly correlationId?: string }) {
    const profile = this.profile({ appUserId: input.authUserId, brandId: input.brand.brandId });
    if (!profile) return repositoryErr({ code: "not_found", message: "Requested record was not found.", correlationId: input.correlationId });
    const snapshot: M1AdminAuthorizationSnapshot = {
      appUser: { id: profile.appUserId, authUserId: input.authUserId, primaryEmail: null, primaryPhone: null, status: "active", createdAt: now, updatedAt: now },
      adminProfile: profile,
      roleCodes: ["admin.support"],
      // The mock principal is intentionally permitted to reach the disabled
      // command-source boundary in deterministic HTTP tests. It cannot mutate:
      // mock command composition never supplies an executor.
      permissionCodes: ["admin.students.read", "admin.audit.read", "admin.security.read", "admin.instructors.create", "admin.instructors.update", "admin.brand_instructors.assign", "admin.brand_instructors.update", "admin.brand_courses.create", "admin.brand_courses.update", "admin.course_instructors.assign", "admin.course_instructors.update"],
    };
    return repositoryOk(snapshot);
  }
}

export function createAdminHttpRequestContextResolver(input: {
  readonly persistence: PersistenceRuntimeComposition;
  readonly environment?: SupabaseBoundaryEnvironment;
  readonly authIdentityAdapter?: AuthIdentityAdapter;
}): AdminHttpRequestContextResolver {
  const configuration = resolveSupabaseBoundaryConfiguration(input.environment);
  if (configuration.authProvider === "supabase") {
    try {
      const authConfiguration = resolveSupabaseAuthConfiguration(input.environment);
      const authIdentityAdapter = input.authIdentityAdapter ?? new SupabaseJwtJwksAuthIdentityAdapter(authConfiguration);
      if (input.persistence.provider === "mock") {
        return new DefaultAdminHttpRequestContextResolver({ authIdentityAdapter, educationalBrands: new MockEducationalBrands(), adminProfiles: new MockAdminProfiles() });
      }
      if (!input.persistence.m1Repositories) throw new AdminHttpContextConfigurationError("Administrative context persistence is unavailable.");
      return new DefaultAdminHttpRequestContextResolver({ authIdentityAdapter, educationalBrands: input.persistence.m1Repositories.educationalBrands, adminProfiles: input.persistence.m1Repositories.adminProfiles });
    } catch (error) {
      if (error instanceof SupabaseAuthConfigurationError) throw new AdminHttpContextConfigurationError("Supabase authentication configuration is invalid.");
      throw error;
    }
  }
  const authIdentityAdapter = input.authIdentityAdapter ?? new InMemoryAuthIdentityAdapter();
  if (input.persistence.provider === "mock") {
    return new DefaultAdminHttpRequestContextResolver({ authIdentityAdapter, educationalBrands: new MockEducationalBrands(), adminProfiles: new MockAdminProfiles() });
  }
  if (!input.persistence.m1Repositories) {
    throw new AdminHttpContextConfigurationError("Administrative context persistence is unavailable.");
  }
  return new DefaultAdminHttpRequestContextResolver({ authIdentityAdapter, educationalBrands: input.persistence.m1Repositories.educationalBrands, adminProfiles: input.persistence.m1Repositories.adminProfiles });
}
