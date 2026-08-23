import { createApplication } from "../app";
import { PostgresReadTransportError } from "./postgres";
import { createPersistenceRuntimeComposition } from "./persistence-runtime-composition";

class FakePool {
  queryCount = 0;
  endCount = 0;
  async query<Row extends Record<string, unknown>>(): Promise<{ readonly rows: readonly Row[] }> {
    this.queryCount += 1;
    return { rows: [] };
  }
  async end(): Promise<void> {
    this.endCount += 1;
  }
}
class FakeWritePool {
  connectCount = 0;
  endCount = 0;
  async connect(): Promise<never> { this.connectCount += 1; throw new Error("write pool must remain lazy during composition"); }
  async end(): Promise<void> { this.endCount += 1; }
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

export async function runPersistenceRuntimeCompositionSelfTest(): Promise<void> {
  let poolFactoryCalls = 0;
  const mock = createPersistenceRuntimeComposition({
    environment: { PERSISTENCE_PROVIDER: "mock" },
    poolFactory: () => {
      poolFactoryCalls += 1;
      throw new Error("mock mode must not construct a pool");
    },
  });
  assert(mock.provider === "mock" && mock.status === "mock-disabled", "mock composition should be disabled");
  assert(poolFactoryCalls === 0, "mock composition must not construct a pool");
  await mock.close();

  try {
    createPersistenceRuntimeComposition({ environment: { PERSISTENCE_PROVIDER: "supabase" } });
    throw new Error("missing DB URL should fail");
  } catch (error) {
    assert(error instanceof PostgresReadTransportError && error.code === "provider_not_configured", "missing DB URL error is unsafe");
    assert(!error.message.includes("secret"), "secret leaked in configuration error");
  }

  const pool = new FakePool();
  const supabase = createPersistenceRuntimeComposition({
    environment: {
      PERSISTENCE_PROVIDER: "supabase",
      SUPABASE_DB_URL: "postgresql://test.invalid/db?sslmode=verify-full",
    },
    poolFactory: () => pool,
  });
  assert(supabase.provider === "supabase" && supabase.status === "supabase-read-only-configured", "supabase composition not configured");
  assert(supabase.m1Repositories?.educationalBrands !== undefined, "M1 repository bundle missing");
  assert(supabase.m2Repositories?.academicModules !== undefined, "M2 repository bundle missing");
  assert(pool.queryCount === 0, "composition must not query during construction");
  await Promise.all([supabase.close(), supabase.close()]);
  assert(pool.endCount === 1, "close should end the pool once");

  try {
    createPersistenceRuntimeComposition({ environment: { PERSISTENCE_PROVIDER: "invalid" } });
    throw new Error("invalid provider should fail");
  } catch (error) {
    assert(error instanceof Error && !error.message.includes("test.invalid"), "invalid provider leaked connection details");
  }

  const application = createApplication({ environment: { PERSISTENCE_PROVIDER: "mock" }, writePoolFactory: () => { throw new Error("mock application must not construct a write pool"); } });
  assert(application.admin !== undefined && application.persistence.status === "mock-disabled" && application.adminCommandSource === "mock" && application.admin.commands.m2 === undefined, "existing mock application changed");
  await application.close();

  try {
    createApplication({ environment: { PERSISTENCE_PROVIDER: "mock", ADMIN_COMMAND_SOURCE: "postgres" }, writePoolFactory: () => { throw new Error("invalid matrix must fail before pool construction"); } });
    throw new Error("mock persistence with postgres commands was accepted");
  } catch (error) { assert(error instanceof Error && !error.message.includes("SUPABASE_DB_URL"), "invalid command matrix did not fail safely"); }

  const readPool = new FakePool(); const writePool = new FakeWritePool();
  const writeApplication = createApplication({
    environment: { PERSISTENCE_PROVIDER: "supabase", ADMIN_COMMAND_SOURCE: "postgres", SUPABASE_DB_URL: "postgresql://test.invalid/db?sslmode=verify-full" },
    poolFactory: () => readPool,
    writePoolFactory: () => writePool,
  });
  assert(writeApplication.admin.commands.m2 !== undefined && readPool.queryCount === 0 && writePool.connectCount === 0, "postgres command construction queried a provider");
  await Promise.all([writeApplication.close(), writeApplication.close()]);
  assert(readPool.endCount === 1 && writePool.endCount === 1, "application close did not close both pools once");
}

if (process.argv[1]?.endsWith("persistence-runtime-composition.selftest.js")) {
  runPersistenceRuntimeCompositionSelfTest().then(() => console.log("persistence runtime composition selftest passed"));
}
