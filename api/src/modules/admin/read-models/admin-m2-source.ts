import type { PersistenceRuntimeComposition } from "../../../core/persistence";
import { InMemoryAdminM2ReadModel } from "./in-memory-admin-m2-read-model";
import { PostgresAdminM2ReadModel } from "./postgres-admin-m2-read-model";
import type { AdminM2ReadModel } from "./admin-m2-read-model";
export type AdminM2ReadModelSource = "mock" | "postgres";
export class AdminM2ReadModelConfigurationError extends Error { readonly name = "AdminM2ReadModelConfigurationError"; }
export function resolveAdminM2ReadModelSource(environment: Readonly<Record<string,string|undefined>> = process.env): AdminM2ReadModelSource { const source=environment.ADMIN_M2_READ_MODEL_SOURCE?.trim() || "mock"; if(source === "mock" || source === "postgres") return source; throw new AdminM2ReadModelConfigurationError("ADMIN_M2_READ_MODEL_SOURCE must be mock or postgres."); }
export function createAdminM2ReadModel(source: AdminM2ReadModelSource, persistence: PersistenceRuntimeComposition): AdminM2ReadModel { if(source === "mock") return new InMemoryAdminM2ReadModel(); if(persistence.provider !== "supabase" || !persistence.m1Repositories || !persistence.m2Repositories) throw new AdminM2ReadModelConfigurationError("ADMIN_M2_READ_MODEL_SOURCE=postgres requires PERSISTENCE_PROVIDER=supabase."); return new PostgresAdminM2ReadModel(persistence.m1Repositories.educationalBrands,persistence.m2Repositories); }
