import type {
  AuthIdentityAdapter,
  AuthVerificationInput,
  AuthVerificationResult,
  VerifiedAuthIdentity,
} from "./auth-identity-adapter";
import type { AuthIdentityId } from "../persistence";
import { repositoryErr, repositoryOk } from "../persistence";

export interface InMemoryAuthIdentityFixture extends VerifiedAuthIdentity {
  readonly mockCredential: string;
}

const defaultFixtures: readonly InMemoryAuthIdentityFixture[] = [
  { authIdentityId: "auth-medway-admin-001" as AuthIdentityId, provider: "mock", subject: "mock-medway-admin-001", mockCredential: "mock-auth-medway-admin-001", verifiedAt: "2026-01-01T00:00:00.000Z" },
  { authIdentityId: "auth-medway-student-001" as AuthIdentityId, provider: "mock", subject: "mock-medway-student-001", mockCredential: "mock-auth-medway-student-001", verifiedAt: "2026-01-01T00:00:00.000Z" },
  { authIdentityId: "auth-elite-admin-001" as AuthIdentityId, provider: "mock", subject: "mock-elite-admin-001", mockCredential: "mock-auth-elite-admin-001", verifiedAt: "2026-01-01T00:00:00.000Z" },
  { authIdentityId: "auth-elite-student-001" as AuthIdentityId, provider: "mock", subject: "mock-elite-student-001", mockCredential: "mock-auth-elite-student-001", verifiedAt: "2026-01-01T00:00:00.000Z" },
];

export class InMemoryAuthIdentityAdapter implements AuthIdentityAdapter {
  constructor(private readonly fixtures: readonly InMemoryAuthIdentityFixture[] = defaultFixtures) {}

  async verifyRequestAuth(input: AuthVerificationInput): Promise<AuthVerificationResult> {
    if (!input.bearerToken) return repositoryErr({ code: "authentication_required", message: "Authentication is required.", correlationId: input.correlationId });
    const fixture = this.fixtures.find((candidate) => candidate.mockCredential === input.bearerToken);
    if (!fixture || (input.providerHint && input.providerHint !== fixture.provider)) {
      return repositoryErr({ code: "authentication_invalid", message: "Authentication could not be verified.", correlationId: input.correlationId });
    }
    return repositoryOk(fixture);
  }

  async getAuthIdentityById(input: { readonly authIdentityId: AuthIdentityId; readonly correlationId?: string }): Promise<AuthVerificationResult> {
    const fixture = this.fixtures.find((candidate) => candidate.authIdentityId === input.authIdentityId);
    return fixture
      ? repositoryOk(fixture)
      : repositoryErr({ code: "authentication_invalid", message: "Authentication identity could not be verified.", correlationId: input.correlationId });
  }
}
