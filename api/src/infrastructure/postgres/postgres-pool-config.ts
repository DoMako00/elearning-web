import { resolveSupabaseBoundaryConfiguration, type SupabaseBoundaryEnvironment } from "../supabase/supabase-config";
import { PostgresReadTransportError } from "./postgres-errors";
import { X509Certificate } from "node:crypto";

export interface PostgresPoolConfiguration {
  readonly connectionString: string;
  readonly trustedRootCertificate?: string;
  readonly max: number;
  readonly idleTimeoutMillis: number;
  readonly connectionTimeoutMillis: number;
}

function trustedRootCertificate(environment: SupabaseBoundaryEnvironment): string | undefined {
  const configured = nonEmpty(environment.PGSSLROOTCERT);
  if (!configured) return undefined;
  const certificate = configured.includes("\\n") ? configured.replace(/\\n/g, "\n") : configured;
  try {
    new X509Certificate(certificate);
  } catch {
    throw new PostgresReadTransportError("invalid_configuration", "PGSSLROOTCERT must contain one valid PEM X.509 certificate.");
  }
  return certificate;
}

const nonEmpty = (value: string | undefined): string | undefined => {
  const normalized = value?.trim();
  return normalized || undefined;
};

function boundedInteger(variableName: string, value: string | undefined, fallback: number, min: number, max: number): number {
  const normalized = nonEmpty(value);
  if (!normalized) return fallback;
  if (!/^\d+$/.test(normalized)) {
    throw new PostgresReadTransportError("invalid_configuration", `${variableName} must be an integer between ${min} and ${max}.`);
  }
  const parsed = Number(normalized);
  if (!Number.isSafeInteger(parsed) || parsed < min || parsed > max) {
    throw new PostgresReadTransportError("invalid_configuration", `${variableName} must be an integer between ${min} and ${max}.`);
  }
  return parsed;
}

export function resolvePostgresPoolConfiguration(
  environment: SupabaseBoundaryEnvironment = process.env,
): PostgresPoolConfiguration {
  const boundary = resolveSupabaseBoundaryConfiguration(environment);
  if (boundary.persistenceProvider !== "supabase") {
    throw new PostgresReadTransportError("provider_not_configured", "Postgres transport requires PERSISTENCE_PROVIDER=supabase.");
  }

  const connectionString = nonEmpty(environment.SUPABASE_DB_URL);
  if (!connectionString) {
    throw new PostgresReadTransportError("provider_not_configured", "SUPABASE_DB_URL is required for the Postgres transport.");
  }

  let parsed: URL;
  try {
    parsed = new URL(connectionString);
  } catch {
    throw new PostgresReadTransportError("invalid_configuration", "SUPABASE_DB_URL must be a valid PostgreSQL URL.");
  }
  if (parsed.protocol !== "postgres:" && parsed.protocol !== "postgresql:") {
    throw new PostgresReadTransportError("invalid_configuration", "SUPABASE_DB_URL must use postgres or postgresql.");
  }
  if (parsed.searchParams.get("sslmode") !== "verify-full") {
    throw new PostgresReadTransportError("invalid_configuration", "SUPABASE_DB_URL must set sslmode=verify-full.");
  }

  return {
    connectionString,
    trustedRootCertificate: trustedRootCertificate(environment),
    max: boundedInteger("POSTGRES_POOL_MAX", environment.POSTGRES_POOL_MAX, 5, 1, 50),
    idleTimeoutMillis: boundedInteger("POSTGRES_IDLE_TIMEOUT_MS", environment.POSTGRES_IDLE_TIMEOUT_MS, 30_000, 0, 300_000),
    connectionTimeoutMillis: boundedInteger("POSTGRES_CONNECTION_TIMEOUT_MS", environment.POSTGRES_CONNECTION_TIMEOUT_MS, 5_000, 100, 120_000),
  };
}
