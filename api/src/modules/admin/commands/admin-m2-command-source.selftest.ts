import { InMemoryAdminPermissionResolver } from "../../../core/permissions";
import type { PersistenceRuntimeComposition } from "../../../core/persistence";
import type { PgWriteClientLike, PgWritePoolLike } from "../../../infrastructure/postgres";
import { AdminM2CommandConfigurationError, createAdminM2CommandRuntime, resolveAdminCommandSource } from "./admin-m2-command-source";

class NoQueryPool implements PgWritePoolLike { connects = 0; ends = 0; async connect(): Promise<PgWriteClientLike> { this.connects += 1; throw new Error("construction must not connect"); } async end(): Promise<void> { this.ends += 1; } }
function assert(value: unknown, message: string): asserts value { if (!value) throw new Error(message); }
export async function runAdminM2CommandSourceSelfTest(): Promise<void> {
  assert(resolveAdminCommandSource({}) === "mock", "command source default changed");
  const mock = createAdminM2CommandRuntime({ source: "mock", persistence: { provider: "mock", status: "mock-disabled", close: async () => undefined }, permissionResolver: new InMemoryAdminPermissionResolver(), poolFactory: () => { throw new Error("mock source constructed a pool"); } });
  assert(!mock.executor, "mock source exposed an executor"); await mock.close();
  try { createAdminM2CommandRuntime({ source: "postgres", persistence: { provider: "mock", status: "mock-disabled", close: async () => undefined }, permissionResolver: new InMemoryAdminPermissionResolver() }); throw new Error("invalid source matrix was accepted"); } catch (error) { assert(error instanceof AdminM2CommandConfigurationError, "invalid matrix was not sanitized"); }
  const pool = new NoQueryPool(); const persistence = { provider: "supabase", status: "supabase-read-only-configured", close: async () => undefined } as PersistenceRuntimeComposition;
  const postgres = createAdminM2CommandRuntime({ source: "postgres", persistence, permissionResolver: new InMemoryAdminPermissionResolver(), environment: { PERSISTENCE_PROVIDER: "supabase", SUPABASE_DB_URL: "postgresql://test.invalid/postgres?sslmode=verify-full" }, poolFactory: () => pool });
  assert(Boolean(postgres.executor) && pool.connects === 0, "postgres source queried during construction"); await postgres.close(); await postgres.close(); assert(pool.ends === 1, "write pool close was not idempotent");
  try { resolveAdminCommandSource({ ADMIN_COMMAND_SOURCE: "invalid" }); throw new Error("invalid source was accepted"); } catch (error) { assert(error instanceof AdminM2CommandConfigurationError, "invalid source error was unsafe"); }
}
if (process.argv[1]?.endsWith("admin-m2-command-source.selftest.js")) runAdminM2CommandSourceSelfTest().then(() => console.log("admin M2 command source selftest passed"));
