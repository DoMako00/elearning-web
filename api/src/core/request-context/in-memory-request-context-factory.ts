import { InMemoryAuthIdentityAdapter } from "../auth";
import { InMemoryBrandResolver } from "../brand-scope";
import {
  InMemoryAdminProfileRepository,
  InMemoryDeviceRepository,
  InMemorySessionRepository,
  InMemoryStudentProfileRepository,
  InMemoryUserRepository,
} from "../repositories/in-memory-request-context-repositories";
import type { RequestContextFactory } from "./request-context-factory";
import { buildRequestContext, type RequestContextBuilderDependencies } from "./request-context-builder";
import type { RequestContextInput } from "./request-context-input";
import type { RequestContext } from "./request-context";
import type { BrandScope } from "../brand-scope";
import type { VerifiedAuthIdentity } from "../auth";
import type { RepositoryResult } from "../persistence";

export type InMemoryRequestContextDependencies = RequestContextBuilderDependencies;

export function createInMemoryRequestContextDependencies(): InMemoryRequestContextDependencies {
  return {
    authIdentityAdapter: new InMemoryAuthIdentityAdapter(),
    brandResolver: new InMemoryBrandResolver(),
    userRepository: new InMemoryUserRepository(),
    adminProfileRepository: new InMemoryAdminProfileRepository(),
    studentProfileRepository: new InMemoryStudentProfileRepository(),
    sessionRepository: new InMemorySessionRepository(),
    deviceRepository: new InMemoryDeviceRepository(),
  };
}

export class InMemoryRequestContextFactory implements RequestContextFactory {
  constructor(private readonly dependencies: InMemoryRequestContextDependencies = createInMemoryRequestContextDependencies()) {}

  create(input: RequestContextInput): Promise<RepositoryResult<RequestContext>> {
    return buildRequestContext(input, this.dependencies);
  }

  createFromVerifiedIdentity(input: Omit<RequestContextInput, "verifiedIdentity"> & {
    readonly verifiedIdentity: VerifiedAuthIdentity;
    readonly resolvedBrand: BrandScope;
  }): Promise<RepositoryResult<RequestContext>> {
    return buildRequestContext(input, this.dependencies);
  }
}

export function createInMemoryRequestContextFactory(): InMemoryRequestContextFactory {
  return new InMemoryRequestContextFactory();
}
