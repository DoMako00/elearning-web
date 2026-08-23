import type { AdminPermissionCode, CorrelationId } from "../../contracts/admin";
import type { AuthIdentityAdapter } from "../auth";
import type { BrandScope } from "../brand-scope";
import { repositoryErr, repositoryOk, type RepositoryResult } from "../persistence";
import type { M1AdminProfileReadRepository, M1EducationalBrandReadRepository } from "../repositories";
import type { AdminRequestContext } from "./admin-request-context";
import type { AdminResolvedBrandContext, AdminResolvedPlatformContext } from "./platform-context";

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export interface AdminHttpRequestContextInput {
  readonly requestId: string;
  readonly correlationId: CorrelationId;
  readonly bearerToken?: string;
  /** Untrusted route-match selector. It is never an authorization decision. */
  readonly requestedBrandId: string;
}

export interface AdminHttpRequestContextResolverDependencies {
  readonly authIdentityAdapter: AuthIdentityAdapter;
  readonly educationalBrands: M1EducationalBrandReadRepository;
  readonly adminProfiles: M1AdminProfileReadRepository;
}

export interface AdminHttpRequestContextResolver {
  resolve(input: AdminHttpRequestContextInput): Promise<RepositoryResult<AdminRequestContext>>;
}

function failure(code: "invalid_input" | "brand_not_found" | "permission_denied" | "persistence_data_invalid", message: string, correlationId: string): RepositoryResult<never> {
  return repositoryErr({ code, message, correlationId });
}

function maskEmail(value: string | null): string | undefined {
  if (!value) return undefined;
  const [local, domain] = value.split("@");
  if (!local || !domain) return undefined;
  return `${local.slice(0, 1)}***@${domain}`;
}

function asPermissionCodes(values: readonly string[], correlationId: string): RepositoryResult<readonly AdminPermissionCode[]> {
  const allowed: readonly AdminPermissionCode[] = [
    "admin.students.read", "admin.students.suspend", "admin.students.restore", "admin.sessions.revoke", "admin.devices.revoke", "admin.payments.read", "admin.payments.review", "admin.refunds.read", "admin.refunds.decide", "admin.subscriptions.read", "admin.seats.manage", "admin.grants.read", "admin.grants.issue_exception", "admin.grants.revoke", "admin.content.read", "admin.content.publish", "admin.content.withdraw", "admin.media.read", "admin.media.manage", "admin.assessments.read", "admin.assessments.review", "admin.audit.read", "admin.security.read", "admin.roles.read", "admin.roles.manage", "admin.policies.read", "admin.policies.manage", "admin.instructors.create", "admin.instructors.update", "admin.brand_instructors.assign", "admin.brand_instructors.update", "admin.brand_courses.create", "admin.brand_courses.update", "admin.course_instructors.assign", "admin.course_instructors.update",
  ];
  if (values.some((value) => !allowed.includes(value as AdminPermissionCode))) {
    return failure("persistence_data_invalid", "Persisted administrative authority is malformed.", correlationId);
  }
  return repositoryOk(Object.freeze([...new Set(values as readonly AdminPermissionCode[])].sort((left, right) => left.localeCompare(right))));
}

function asBrandScope(id: string, code: "medway" | "elite", name: string): BrandScope {
  return { brandId: id as BrandScope["brandId"], brandCode: code, brandDisplayName: name, isActive: true };
}

/**
 * Provider-neutral bridge from a verified principal and M1 authority state to
 * the Prompt 53 AdminRequestContext. No client identity or permission value is
 * accepted as trusted input.
 */
export class DefaultAdminHttpRequestContextResolver implements AdminHttpRequestContextResolver {
  constructor(private readonly dependencies: AdminHttpRequestContextResolverDependencies) {}

  async resolve(input: AdminHttpRequestContextInput): Promise<RepositoryResult<AdminRequestContext>> {
    if (!input.requestId.trim() || !input.correlationId.trim() || !uuid.test(input.requestedBrandId)) {
      return failure("invalid_input", "A valid request context is required.", input.correlationId);
    }
    const identity = await this.dependencies.authIdentityAdapter.verifyRequestAuth({ bearerToken: input.bearerToken, correlationId: input.correlationId });
    if (!identity.ok) return identity;
    const brandResult = await this.dependencies.educationalBrands.findEducationalBrandById({ id: input.requestedBrandId, correlationId: input.correlationId });
    if (!brandResult.ok) return brandResult;
    if (brandResult.value.status !== "active") return failure("permission_denied", "The requested administrative scope is unavailable.", input.correlationId);
    const brand = asBrandScope(brandResult.value.id, brandResult.value.code, brandResult.value.name);
    const authority = await this.dependencies.adminProfiles.resolveAdminAuthorizationByAuthUserId({ authUserId: identity.value.authIdentityId, brand, correlationId: input.correlationId });
    if (!authority.ok) {
      return authority.error.code === "not_found"
        ? failure("permission_denied", "Administrative access is not available.", input.correlationId)
        : authority;
    }
    if (authority.value.appUser.status !== "active" || authority.value.adminProfile.status !== "active") {
      return failure("permission_denied", "Administrative access is not available.", input.correlationId);
    }
    if (authority.value.adminProfile.brandId !== brand.brandId || authority.value.adminProfile.appUserId !== authority.value.appUser.id) {
      return failure("persistence_data_invalid", "Persisted administrative authority is malformed.", input.correlationId);
    }
    const permissions = asPermissionCodes(authority.value.permissionCodes, input.correlationId);
    if (!permissions.ok) return permissions;
    const appUserStatus: "active" | "disabled" = authority.value.appUser.status === "active" ? "active" : "disabled";
    const resolvedBrand: AdminResolvedBrandContext = { brandId: brand.brandId, brandCode: brand.brandCode, brandDisplayName: brand.brandDisplayName, resolvedFrom: "route_scope", isActive: true };
    const platform: AdminResolvedPlatformContext = { ...resolvedBrand, platformId: brand.brandId, platformCode: brand.brandCode, platformDisplayName: brand.brandDisplayName };
    return repositoryOk(Object.freeze({
      correlationId: input.correlationId,
      requestId: input.requestId,
      brand: resolvedBrand,
      platform,
      subject: { providerSubjectId: identity.value.subject, authProvider: identity.value.provider, emailMasked: maskEmail(identity.value.email ?? authority.value.appUser.primaryEmail) },
      appUser: { appUserId: authority.value.appUser.id, brandId: brand.brandId, brandCode: brand.brandCode, platformId: brand.brandId, platformCode: brand.brandCode, status: appUserStatus },
      adminUser: { adminProfileId: authority.value.adminProfile.id, adminUserId: authority.value.adminProfile.id, appUserId: authority.value.appUser.id, brandId: brand.brandId, brandCode: brand.brandCode, platformId: brand.brandId, platformCode: brand.brandCode, status: authority.value.adminProfile.status, roleIds: Object.freeze([...authority.value.roleCodes]), elevatedAccessExpiresAt: null },
      permissions: permissions.value,
    }));
  }
}
