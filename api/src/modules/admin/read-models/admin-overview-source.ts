import type { PersistenceRuntimeComposition } from "../../../core/persistence";
import { InMemoryAdminOverviewReadModel } from "./in-memory-admin-overview-read-model";
import { PostgresAdminOverviewReadModel } from "./postgres-admin-overview-read-model";
import type { AdminOverviewReadModel } from "./admin-overview-read-model";
import { createInMemoryAdminReadModels } from "../in-memory-admin-read-models";

export type AdminOverviewReadModelSource = "mock" | "postgres";

export class AdminOverviewReadModelConfigurationError extends Error {
  readonly name = "AdminOverviewReadModelConfigurationError";
}

export function resolveAdminOverviewReadModelSource(
  environment: Readonly<Record<string, string | undefined>> = process.env,
): AdminOverviewReadModelSource {
  const source = environment.ADMIN_READ_MODEL_SOURCE?.trim() || "mock";
  if (source === "mock" || source === "postgres") return source;
  throw new AdminOverviewReadModelConfigurationError("ADMIN_READ_MODEL_SOURCE must be mock or postgres.");
}

export function createAdminOverviewReadModel(
  source: AdminOverviewReadModelSource,
  persistence: PersistenceRuntimeComposition,
): AdminOverviewReadModel {
  if (source === "mock") return new InMemoryAdminOverviewReadModel(createInMemoryAdminReadModels());
  if (persistence.provider !== "supabase" || !persistence.m1Repositories) {
    throw new AdminOverviewReadModelConfigurationError(
      "ADMIN_READ_MODEL_SOURCE=postgres requires PERSISTENCE_PROVIDER=supabase.",
    );
  }
  return new PostgresAdminOverviewReadModel(persistence.m1Repositories.educationalBrands);
}
