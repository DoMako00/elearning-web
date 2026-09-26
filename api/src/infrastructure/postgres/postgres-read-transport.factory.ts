import { Pool } from "pg";
import { resolveSupabaseBoundaryConfiguration, type SupabaseBoundaryEnvironment } from "../supabase/supabase-config";
import { PostgresReadTransport, type PgPoolLike } from "./postgres-read-transport";
import { resolvePostgresPoolConfiguration } from "./postgres-pool-config";
import { PostgresReadTransportError } from "./postgres-errors";

export type PostgresTransportBoundary =
  | { readonly kind: "mock-disabled"; readonly transport: undefined }
  | { readonly kind: "supabase-configured-not-wired"; readonly transport: PostgresReadTransport };

export type PostgresPoolFactory = (configuration: ConstructorParameters<typeof Pool>[0]) => PgPoolLike;

export function createPostgresReadTransportFromEnvironment(
  environment: SupabaseBoundaryEnvironment = process.env,
  poolFactory: PostgresPoolFactory = (configuration) => new Pool(configuration),
): PostgresTransportBoundary {
  const boundary = resolveSupabaseBoundaryConfiguration(environment);
  if (boundary.persistenceProvider === "mock") return { kind: "mock-disabled", transport: undefined };
  const configuration = resolvePostgresPoolConfiguration(environment);
  let pool: PgPoolLike;
  try {
    pool = poolFactory({
      host: configuration.host,
      port: configuration.port,
      ...(configuration.user ? { user: configuration.user } : {}),
      ...(configuration.password ? { password: configuration.password } : {}),
      database: configuration.database,
      max: configuration.max,
      idleTimeoutMillis: configuration.idleTimeoutMillis,
      connectionTimeoutMillis: configuration.connectionTimeoutMillis,
      ssl: { rejectUnauthorized: true, ...(configuration.trustedRootCertificate ? { ca: configuration.trustedRootCertificate } : {}) },
    });
  } catch {
    throw new PostgresReadTransportError("provider_unavailable", "The Postgres provider could not be initialized.");
  }
  return { kind: "supabase-configured-not-wired", transport: new PostgresReadTransport(pool) };
}
