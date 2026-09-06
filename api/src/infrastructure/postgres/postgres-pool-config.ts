import { resolveSupabaseBoundaryConfiguration, type SupabaseBoundaryEnvironment } from "../supabase/supabase-config";
import { PostgresReadTransportError } from "./postgres-errors";
import { X509Certificate } from "node:crypto";

export interface PostgresPoolConfiguration {
  readonly host: string;
  readonly port: number;
  readonly user?: string;
  readonly password?: string;
  readonly database: string;
  readonly trustedRootCertificate?: string;
  readonly max: number;
  readonly idleTimeoutMillis: number;
  readonly connectionTimeoutMillis: number;
}

function trustedRootCertificate(environment: SupabaseBoundaryEnvironment): string | undefined {
  const configured = nonEmpty(environment.PGSSLROOTCERT);
  const encoded = nonEmpty(environment.PGSSLROOTCERT_BASE64);
  if (configured && encoded) {
    throw new PostgresReadTransportError("invalid_configuration", "Configure either PGSSLROOTCERT or PGSSLROOTCERT_BASE64, not both.");
  }
  if (!configured && !encoded) return undefined;
  let certificate: string;
  if (encoded) {
    if (!/^[A-Za-z0-9+/]+={0,2}$/.test(encoded)) {
      throw new PostgresReadTransportError("invalid_configuration", "PGSSLROOTCERT_BASE64 must be base64-encoded PEM data.");
    }
    certificate = Buffer.from(encoded, "base64").toString("utf8");
  } else {
    certificate = configured!.includes("\\n") ? configured!.replace(/\\n/g, "\n") : configured!;
  }
  try {
    new X509Certificate(certificate);
  } catch {
    throw new PostgresReadTransportError("invalid_configuration", "The configured Postgres root certificate must contain one valid PEM X.509 certificate.");
  }
  return certificate;
}

function decodedUrlPart(value: string, variableName: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    throw new PostgresReadTransportError("invalid_configuration", `${variableName} contains invalid URL encoding.`);
  }
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

  const host = parsed.hostname;
  const port = parsed.port ? Number(parsed.port) : 5432;
  const user = parsed.username ? decodedUrlPart(parsed.username, "SUPABASE_DB_URL user") : undefined;
  const password = parsed.password ? decodedUrlPart(parsed.password, "SUPABASE_DB_URL password") : undefined;
  const database = decodedUrlPart(parsed.pathname.replace(/^\//, ""), "SUPABASE_DB_URL database");
  if (!host || !Number.isInteger(port) || port < 1 || port > 65535 || !database) {
    throw new PostgresReadTransportError("invalid_configuration", "SUPABASE_DB_URL must include a host, port, and database.");
  }

  return {
    host,
    port,
    user,
    password,
    database,
    trustedRootCertificate: trustedRootCertificate(environment),
    max: boundedInteger("POSTGRES_POOL_MAX", environment.POSTGRES_POOL_MAX, 5, 1, 50),
    idleTimeoutMillis: boundedInteger("POSTGRES_IDLE_TIMEOUT_MS", environment.POSTGRES_IDLE_TIMEOUT_MS, 30_000, 0, 300_000),
    connectionTimeoutMillis: boundedInteger("POSTGRES_CONNECTION_TIMEOUT_MS", environment.POSTGRES_CONNECTION_TIMEOUT_MS, 5_000, 100, 120_000),
  };
}
