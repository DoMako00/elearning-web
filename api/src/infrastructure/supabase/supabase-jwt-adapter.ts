import type { AuthIdentityAdapter, AuthVerificationInput, AuthVerificationResult } from "../../core/auth";
import type { AuthIdentityId } from "../../core/persistence";
import { repositoryErr, repositoryOk } from "../../core/persistence";
import type { SupabaseAuthConfiguration } from "./supabase-auth-config";

type JoseModule = typeof import("jose", { with: { "resolution-mode": "import" } });
type JoseKeySet = ReturnType<JoseModule["createRemoteJWKSet"]>;
type LocalKeySet = ReturnType<JoseModule["createLocalJWKSet"]>;

export interface SupabaseJwtAdapterOptions {
  readonly joseLoader?: () => Promise<JoseModule>;
  readonly keySet?: JoseKeySet | LocalKeySet;
  readonly now?: () => number;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ALGORITHMS = ["ES256", "RS256"] as const;
const CLOCK_TOLERANCE_SECONDS = 60;
const MAX_IAT_FUTURE_SECONDS = 60;

function invalid(input: AuthVerificationInput, code: "authentication_required" | "authentication_invalid" | "provider_unavailable", message: string): AuthVerificationResult {
  return repositoryErr({ code, message, correlationId: input.correlationId });
}

function defaultJoseLoader(): Promise<JoseModule> {
  return import("jose");
}

/** Provider adapter: only a verified Supabase UUID crosses into core auth. */
export class SupabaseJwtJwksAuthIdentityAdapter implements AuthIdentityAdapter {
  private readonly loadJose: () => Promise<JoseModule>;
  private readonly now: () => number;
  private keySetPromise: Promise<JoseKeySet | LocalKeySet> | undefined;

  constructor(private readonly configuration: SupabaseAuthConfiguration, options: SupabaseJwtAdapterOptions = {}) {
    this.loadJose = options.joseLoader ?? defaultJoseLoader;
    this.now = options.now ?? (() => Date.now());
    if (options.keySet) this.keySetPromise = Promise.resolve(options.keySet);
  }

  private async keySet(): Promise<JoseKeySet | LocalKeySet> {
    if (!this.keySetPromise) {
      this.keySetPromise = this.loadJose().then(({ createRemoteJWKSet }) => createRemoteJWKSet(new URL(this.configuration.jwksUrl), {
        timeoutDuration: this.configuration.timeoutMs,
        cacheMaxAge: 600000,
        cooldownDuration: 30000,
      }));
    }
    return this.keySetPromise;
  }

  async verifyRequestAuth(input: AuthVerificationInput): Promise<AuthVerificationResult> {
    if (!input.bearerToken) return invalid(input, "authentication_required", "Authentication is required.");
    try {
      const jose = await this.loadJose();
      const header = jose.decodeProtectedHeader(input.bearerToken);
      if (!header.kid || typeof header.kid !== "string" || !ALGORITHMS.includes(header.alg as (typeof ALGORITHMS)[number])) {
        return invalid(input, "authentication_invalid", "Authentication could not be verified.");
      }
      const verified = await jose.jwtVerify(input.bearerToken, await this.keySet(), {
        issuer: this.configuration.issuer,
        audience: this.configuration.audience,
        algorithms: [...ALGORITHMS],
        clockTolerance: CLOCK_TOLERANCE_SECONDS,
      });
      const payload = verified.payload;
      if (typeof payload.exp !== "number" || !Number.isFinite(payload.exp) || typeof payload.iat !== "number" || !Number.isFinite(payload.iat)) {
        return invalid(input, "authentication_invalid", "Authentication could not be verified.");
      }
      if (typeof payload.nbf !== "undefined" && (typeof payload.nbf !== "number" || !Number.isFinite(payload.nbf))) {
        return invalid(input, "authentication_invalid", "Authentication could not be verified.");
      }
      if (payload.iat > (this.now() / 1000) + MAX_IAT_FUTURE_SECONDS || typeof payload.sub !== "string" || !UUID.test(payload.sub)) {
        return invalid(input, "authentication_invalid", "Authentication could not be verified.");
      }
      const subject = payload.sub as AuthIdentityId;
      return repositoryOk({ provider: "supabase", authIdentityId: subject, subject, verifiedAt: new Date(this.now()).toISOString() });
    } catch (error) {
      const name = error instanceof Error ? error.name : "";
      const providerFailure = ["JWKSTimeout", "JWKSError", "JWKSNoMatchingKey", "JOSEError"].includes(name) && (name === "JWKSTimeout" || name === "JWKSError");
      return invalid(input, providerFailure ? "provider_unavailable" : "authentication_invalid", providerFailure ? "Authentication provider is temporarily unavailable." : "Authentication could not be verified.");
    }
  }

  async getAuthIdentityById(input: { readonly authIdentityId: AuthIdentityId; readonly correlationId?: string }): Promise<AuthVerificationResult> {
    return repositoryErr({ code: "authentication_invalid", message: "Authentication identity could not be verified.", correlationId: input.correlationId });
  }
}
