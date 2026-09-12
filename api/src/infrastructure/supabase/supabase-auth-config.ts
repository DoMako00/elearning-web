import type { SupabaseBoundaryEnvironment } from "./supabase-config";

export interface SupabaseAuthConfiguration {
  readonly projectRef: string;
  readonly issuer: string;
  readonly jwksUrl: string;
  readonly audience: "authenticated";
  readonly timeoutMs: number;
}

export type SupabaseAuthConfigurationErrorCode = "missing" | "invalid";

export class SupabaseAuthConfigurationError extends Error {
  readonly name = "SupabaseAuthConfigurationError";
  constructor(readonly code: SupabaseAuthConfigurationErrorCode, message: string) {
    super(message);
  }
}

const PROJECT_REF = /^[a-z0-9]{20}$/;
const DEFAULT_TIMEOUT_MS = 5000;
const MIN_TIMEOUT_MS = 1000;
const MAX_TIMEOUT_MS = 10000;

function required(environment: SupabaseBoundaryEnvironment, name: string): string {
  const value = environment[name]?.trim();
  if (!value) throw new SupabaseAuthConfigurationError("missing", `${name} is required for Supabase authentication.`);
  return value;
}

function canonicalHttps(value: string, name: string): string {
  let url: URL;
  try { url = new URL(value); } catch { throw new SupabaseAuthConfigurationError("invalid", `${name} must be a valid HTTPS URL.`); }
  if (url.protocol !== "https:" || url.username || url.password || url.search || url.hash) {
    throw new SupabaseAuthConfigurationError("invalid", `${name} must be an HTTPS URL without credentials, query, or fragment.`);
  }
  url.pathname = url.pathname.replace(/\/$/, "");
  return url.toString().replace(/\/$/, "");
}

export function resolveSupabaseAuthConfiguration(environment: SupabaseBoundaryEnvironment = process.env): SupabaseAuthConfiguration {
  const projectRef = required(environment, "SUPABASE_PROJECT_REF");
  if (!PROJECT_REF.test(projectRef)) throw new SupabaseAuthConfigurationError("invalid", "SUPABASE_PROJECT_REF is invalid.");
  const issuer = `https://${projectRef}.supabase.co/auth/v1`;
  const jwksUrl = `${issuer}/.well-known/jwks.json`;
  if (environment.SUPABASE_AUTH_ISSUER?.trim() && canonicalHttps(environment.SUPABASE_AUTH_ISSUER.trim(), "SUPABASE_AUTH_ISSUER") !== issuer) {
    throw new SupabaseAuthConfigurationError("invalid", "SUPABASE_AUTH_ISSUER does not match the project issuer.");
  }
  if (environment.SUPABASE_AUTH_JWKS_URL?.trim() && canonicalHttps(environment.SUPABASE_AUTH_JWKS_URL.trim(), "SUPABASE_AUTH_JWKS_URL") !== jwksUrl) {
    throw new SupabaseAuthConfigurationError("invalid", "SUPABASE_AUTH_JWKS_URL does not match the project JWKS URL.");
  }
  const audience = environment.SUPABASE_AUTH_AUDIENCE?.trim() || "authenticated";
  if (audience !== "authenticated") throw new SupabaseAuthConfigurationError("invalid", "SUPABASE_AUTH_AUDIENCE must be authenticated.");
  const timeoutText = environment.SUPABASE_AUTH_JWKS_TIMEOUT_MS?.trim();
  const timeoutMs = timeoutText ? Number(timeoutText) : DEFAULT_TIMEOUT_MS;
  if (!Number.isInteger(timeoutMs) || timeoutMs < MIN_TIMEOUT_MS || timeoutMs > MAX_TIMEOUT_MS) {
    throw new SupabaseAuthConfigurationError("invalid", "SUPABASE_AUTH_JWKS_TIMEOUT_MS must be an integer from 1000 through 10000.");
  }
  return { projectRef, issuer, jwksUrl, audience: "authenticated", timeoutMs };
}
