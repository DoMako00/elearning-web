import type {
  AuthIdentityId,
  RepositoryRequestMetadata,
} from "../persistence/common";
import type { RepositoryResult } from "../persistence/repository-result";

export type { AuthIdentityId };

export type AuthProviderName = "mock" | "supabase";

export interface VerifiedAuthIdentity {
  readonly authIdentityId: AuthIdentityId;
  readonly provider: AuthProviderName;
  readonly subject: string;
  readonly email?: string;
  readonly verifiedAt: string;
}

export interface AuthVerificationInput extends RepositoryRequestMetadata {
  readonly bearerToken?: string;
  readonly providerHint?: AuthProviderName;
}

export type AuthVerificationResult = RepositoryResult<VerifiedAuthIdentity>;

export interface AuthIdentityAdapter {
  verifyRequestAuth(input: AuthVerificationInput): Promise<AuthVerificationResult>;
  getAuthIdentityById(input: {
    readonly authIdentityId: AuthIdentityId;
    readonly correlationId?: string;
  }): Promise<AuthVerificationResult>;
}

