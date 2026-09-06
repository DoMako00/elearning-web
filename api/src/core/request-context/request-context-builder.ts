import type { AuthIdentityAdapter, VerifiedAuthIdentity } from "../auth";
import type { BrandResolver, BrandScope } from "../brand-scope";
import type {
  AdminProfileRepository,
  DeviceRepository,
  SessionRepository,
  StudentProfileRepository,
  UserRepository,
} from "../repositories";
import { repositoryErr, repositoryOk, type RepositoryErrorCode, type RepositoryResult } from "../persistence";
import type { RequestContext, ActorType } from "./request-context";
import type { RequestContextInput } from "./request-context-input";
import { brandInputFromRequest } from "./request-context-input";

export interface RequestContextBuilderDependencies {
  readonly authIdentityAdapter: AuthIdentityAdapter;
  readonly brandResolver: BrandResolver;
  readonly userRepository: UserRepository;
  readonly adminProfileRepository: AdminProfileRepository;
  readonly studentProfileRepository: StudentProfileRepository;
  readonly sessionRepository: SessionRepository;
  readonly deviceRepository: DeviceRepository;
}

function invalidInput(message: string, correlationId: string): RepositoryResult<never> {
  return repositoryErr({ code: "invalid_input", message, correlationId });
}

function mapFailure<T>(
  result: RepositoryResult<T>,
  fallbackCode: RepositoryErrorCode,
  message: string,
  correlationId: string,
): RepositoryResult<never> {
  if (result.ok) return invalidInput(message, correlationId);
  return repositoryErr({
    ...result.error,
    code: result.error.code === "not_found" ? fallbackCode : result.error.code,
    message: result.error.code === "not_found" ? message : result.error.message,
    correlationId,
  });
}

function buildAnonymousContext(input: RequestContextInput, brand: BrandScope): RepositoryResult<RequestContext> {
  const context: RequestContext = {
    requestId: input.requestId,
    correlationId: input.correlationId,
    actorAuthId: null,
    actorUserId: null,
    actorType: "anonymous",
    activeBrandCode: brand.brandCode,
    activeBrandId: brand.brandId,
    brand,
    roles: Object.freeze([]),
    permissions: Object.freeze([]),
    ip: input.ip,
    userAgent: input.userAgent,
  };
  return repositoryOk(Object.freeze(context));
}

export async function buildRequestContext(
  input: RequestContextInput,
  dependencies: RequestContextBuilderDependencies,
): Promise<RepositoryResult<RequestContext>> {
  if (!input.requestId.trim() || !input.correlationId.trim()) {
    return invalidInput("Request and correlation identifiers are required.", input.correlationId);
  }

  const authResult = input.verifiedIdentity
    ? repositoryOk(input.verifiedIdentity)
    : await dependencies.authIdentityAdapter.verifyRequestAuth(input.auth);
  if (!authResult.ok) {
    if (input.authenticationMode === "allow_anonymous" && authResult.error.code === "authentication_required") {
      const anonymousBrandResult = input.resolvedBrand
        ? repositoryOk(input.resolvedBrand)
        : await dependencies.brandResolver.resolveBrand(brandInputFromRequest(input));
      if (!anonymousBrandResult.ok) return anonymousBrandResult;
      if (input.targetBrandCode || input.targetBrandId) {
        const targetResult = await dependencies.brandResolver.resolveBrand({
          requestedBrandCode: input.targetBrandCode,
          requestedBrandId: input.targetBrandId,
          correlationId: input.correlationId,
        });
        if (!targetResult.ok) return targetResult;
        const targetCheck = dependencies.brandResolver.assertTargetBrand(anonymousBrandResult.value, targetResult.value);
        if (!targetCheck.ok) return repositoryErr({ ...targetCheck.error, code: "target_brand_mismatch", correlationId: input.correlationId });
      }
      return buildAnonymousContext(input, anonymousBrandResult.value);
    }
    return repositoryErr({ ...authResult.error, correlationId: input.correlationId });
  }
  const identity: VerifiedAuthIdentity = authResult.value;

  const brandResult = input.resolvedBrand
    ? repositoryOk(input.resolvedBrand)
    : await dependencies.brandResolver.resolveBrand(brandInputFromRequest(input));
  if (!brandResult.ok) return brandResult;
  const brand = brandResult.value;

  if (input.targetBrandCode || input.targetBrandId) {
    const targetResult = await dependencies.brandResolver.resolveBrand({
      requestedBrandCode: input.targetBrandCode,
      requestedBrandId: input.targetBrandId,
      correlationId: input.correlationId,
    });
    if (!targetResult.ok) return targetResult;
    const targetCheck = dependencies.brandResolver.assertTargetBrand(brand, targetResult.value);
    if (!targetCheck.ok) {
      return repositoryErr({ ...targetCheck.error, code: "target_brand_mismatch", correlationId: input.correlationId });
    }
  }

  const userResult = await dependencies.userRepository.findUserByAuthIdentity({
    authIdentityId: identity.authIdentityId,
    brand,
    correlationId: input.correlationId,
  });
  if (!userResult.ok) return mapFailure(userResult, "user_not_found", "Application user was not found for this brand.", input.correlationId);
  const user = userResult.value;
  if (user.status !== "active") {
    return repositoryErr({ code: "user_not_found", message: "Application user is not active.", correlationId: input.correlationId });
  }

  if (input.sessionId) {
    const sessionResult = await dependencies.sessionRepository.findSessionById({
      id: input.sessionId,
      brand,
      correlationId: input.correlationId,
    });
    if (!sessionResult.ok) return mapFailure(sessionResult, "session_not_found", "Session was not found.", input.correlationId);
    const session = sessionResult.value;
    if (session.platformId !== brand.brandId) return repositoryErr({ code: "session_brand_mismatch", message: "Session brand does not match the active brand.", correlationId: input.correlationId });
    if (session.userId !== user.id) return repositoryErr({ code: "session_user_mismatch", message: "Session does not belong to the resolved user.", correlationId: input.correlationId });
    if (session.status !== "active" || session.revokedAt) return repositoryErr({ code: "session_inactive", message: "Session is not active.", correlationId: input.correlationId });
  }

  if (input.deviceId) {
    const deviceResult = await dependencies.deviceRepository.findDeviceById({
      id: input.deviceId,
      brand,
      correlationId: input.correlationId,
    });
    if (!deviceResult.ok) return mapFailure(deviceResult, "device_not_found", "Device was not found.", input.correlationId);
    const device = deviceResult.value;
    if (device.platformId !== brand.brandId) return repositoryErr({ code: "device_user_mismatch", message: "Device brand does not match the active user.", correlationId: input.correlationId });
    if (device.userId !== user.id) return repositoryErr({ code: "device_user_mismatch", message: "Device does not belong to the resolved user.", correlationId: input.correlationId });
    if (device.trustStatus === "revoked" || device.revokedAt) return repositoryErr({ code: "device_revoked", message: "Device is revoked.", correlationId: input.correlationId });
  }

  const actorType: Exclude<ActorType, "anonymous"> | undefined = input.expectedActorType;
  if (!actorType) return invalidInput("An expected actor type is required for authenticated context construction.", input.correlationId);

  let adminProfileId = input.adminProfileId;
  let studentProfileId = input.studentProfileId;
  let roles: readonly string[] = [];
  let permissions: readonly string[] = [];

  if (actorType === "admin") {
    const profileResult = await dependencies.adminProfileRepository.findAdminProfileByUserId({
      id: user.id as never,
      brand,
      correlationId: input.correlationId,
    });
    if (!profileResult.ok) return mapFailure(profileResult, "admin_profile_not_found", "Admin profile was not found for this brand.", input.correlationId);
    if (profileResult.value.status !== "active") return repositoryErr({ code: "admin_profile_not_found", message: "Admin profile is not active.", correlationId: input.correlationId });
    adminProfileId = profileResult.value.id as typeof adminProfileId;
    const permissionResult = await dependencies.adminProfileRepository.findAdminPermissions({
      id: user.id as never,
      brand,
      correlationId: input.correlationId,
    });
    if (!permissionResult.ok) return permissionResult;
    roles = permissionResult.value.roleCodes;
    permissions = permissionResult.value.permissionCodes;
  } else if (actorType === "student") {
    const profileResult = await dependencies.studentProfileRepository.findStudentProfileByUserId({
      id: user.id as never,
      brand,
      correlationId: input.correlationId,
    });
    if (!profileResult.ok) return mapFailure(profileResult, "student_profile_not_found", "Student profile was not found for this brand.", input.correlationId);
    if (profileResult.value.status !== "active") return repositoryErr({ code: "student_profile_not_found", message: "Student profile is not active.", correlationId: input.correlationId });
    studentProfileId = profileResult.value.id as typeof studentProfileId;
  }

  const context: RequestContext = {
    requestId: input.requestId,
    correlationId: input.correlationId,
    actorAuthId: identity.authIdentityId,
    actorUserId: user.id as RequestContext["actorUserId"],
    actorType,
    activeBrandCode: brand.brandCode,
    activeBrandId: brand.brandId,
    brand,
    adminProfileId,
    studentProfileId,
    sessionId: input.sessionId,
    deviceId: input.deviceId,
    roles: Object.freeze([...roles]),
    permissions: Object.freeze([...permissions]),
    ip: input.ip,
    userAgent: input.userAgent,
    reason: input.reason,
    idempotencyKey: input.idempotencyKey,
  };
  return repositoryOk(Object.freeze(context));
}

export class RequestContextBuilder {
  constructor(private readonly dependencies: RequestContextBuilderDependencies) {}

  buildRequestContext(input: RequestContextInput): Promise<RepositoryResult<RequestContext>> {
    return buildRequestContext(input, this.dependencies);
  }
}
