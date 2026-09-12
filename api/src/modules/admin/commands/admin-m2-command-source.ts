import type { PersistenceRuntimeComposition } from "../../../core/persistence";
import type { AdminPermissionResolver } from "../../../core/permissions";
import { createPostgresAdminM2WriteTransactionRunner, type PostgresWritePoolFactory } from "../../../infrastructure/postgres";
import type { SupabaseBoundaryEnvironment } from "../../../infrastructure/supabase/supabase-config";
import { TransactionalAdminM2CommandExecutor, type AdminM2CommandExecutor } from "./admin-m2-command-executor";

export type AdminCommandSource = "mock" | "postgres";
export class AdminM2CommandConfigurationError extends Error { readonly name = "AdminM2CommandConfigurationError"; }
export function resolveAdminCommandSource(environment: SupabaseBoundaryEnvironment = process.env): AdminCommandSource {
  const source = environment.ADMIN_COMMAND_SOURCE?.trim() || "mock";
  if (source === "mock" || source === "postgres") return source;
  throw new AdminM2CommandConfigurationError("ADMIN_COMMAND_SOURCE must be mock or postgres.");
}
export interface AdminM2CommandRuntime { readonly source: AdminCommandSource; readonly executor?: AdminM2CommandExecutor; close(): Promise<void>; }
export function createAdminM2CommandRuntime(input: { readonly source: AdminCommandSource; readonly persistence: PersistenceRuntimeComposition; readonly permissionResolver: AdminPermissionResolver; readonly environment?: SupabaseBoundaryEnvironment; readonly poolFactory?: PostgresWritePoolFactory }): AdminM2CommandRuntime {
  if (input.source === "mock") return { source: "mock", close: async () => undefined };
  if (input.persistence.provider !== "supabase") throw new AdminM2CommandConfigurationError("ADMIN_COMMAND_SOURCE=postgres requires PERSISTENCE_PROVIDER=supabase.");
  const runner = createPostgresAdminM2WriteTransactionRunner(input.environment, input.poolFactory);
  return { source: "postgres", executor: new TransactionalAdminM2CommandExecutor(runner, input.permissionResolver), close: () => runner.close() };
}
