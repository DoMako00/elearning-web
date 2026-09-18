import type { RepositoryResult } from "../../../core/persistence";
import type { AdminOverviewSnapshot } from "../in-memory-admin-read-models";

/**
 * Provider-neutral, read-only boundary for the existing admin overview contract.
 * A future Postgres/Supabase adapter must preserve this output shape.
 */
export interface AdminOverviewReadModelInput {
  readonly brandCode: string;
  readonly brandId?: string;
  readonly requestId?: string;
  readonly correlationId?: string;
}

export type AdminOverviewReadModelOutput = AdminOverviewSnapshot;

export interface AdminOverviewReadModel {
  getOverview(input: AdminOverviewReadModelInput): Promise<RepositoryResult<AdminOverviewReadModelOutput>>;
}
