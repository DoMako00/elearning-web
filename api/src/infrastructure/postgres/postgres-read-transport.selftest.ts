import { createPostgresReadTransportFromEnvironment } from "./postgres-read-transport.factory";
import { PostgresReadTransportError } from "./postgres-errors";

interface FakePool {
  queryCalls: Array<{ text: string; values: readonly string[] }>;
  endCalls: number;
  failWith?: unknown;
}

function createFakePool(): FakePool & { query<Row extends Record<string, unknown>>(text: string, values: readonly string[]): Promise<{ rows: readonly Row[] }>; end(): Promise<void>; setFailure(error: unknown): void; getEndCalls(): number } {
  const state: FakePool = { queryCalls: [], endCalls: 0 };
  return {
    ...state,
    query<Row extends Record<string, unknown>>(text: string, values: readonly string[]) {
      state.queryCalls.push({ text, values });
      if (state.failWith) return Promise.reject(state.failWith);
      return Promise.resolve({ rows: [{ id: "row-1" }] as unknown as readonly Row[] });
    },
    end() {
      state.endCalls += 1;
      return Promise.resolve();
    },
    setFailure(error: unknown) { state.failWith = error; },
    getEndCalls() { return state.endCalls; },
  };
}

const connectionString = ["postgresql:", "//example.test/db?sslmode=verify-full"].join("");

export async function runPostgresReadTransportSelfTest(): Promise<void> {
  const mock = createPostgresReadTransportFromEnvironment({ PERSISTENCE_PROVIDER: "mock" }, () => {
    throw new Error("pool must not be created in mock mode");
  });
  if (mock.kind !== "mock-disabled") throw new Error("mock provider was not disabled");

  const pool = createFakePool();
  const configured = createPostgresReadTransportFromEnvironment({ PERSISTENCE_PROVIDER: "supabase", SUPABASE_DB_URL: connectionString }, () => pool);
  if (configured.kind !== "supabase-configured-not-wired") throw new Error("supabase transport was not constructed");
  try {
    createPostgresReadTransportFromEnvironment({ PERSISTENCE_PROVIDER: "supabase", SUPABASE_DB_URL: connectionString, PGSSLROOTCERT: "not-a-certificate" }, () => pool);
    throw new Error("invalid root certificate was accepted");
  } catch (error) {
    if (!(error instanceof PostgresReadTransportError) || error.code !== "invalid_configuration" || error.message.includes("not-a-certificate")) throw error;
  }
  try {
    createPostgresReadTransportFromEnvironment({ PERSISTENCE_PROVIDER: "supabase", SUPABASE_DB_URL: connectionString, PGSSLROOTCERT_BASE64: "not base64!" }, () => pool);
    throw new Error("invalid encoded root certificate was accepted");
  } catch (error) {
    if (!(error instanceof PostgresReadTransportError) || error.code !== "invalid_configuration" || error.message.includes("not base64")) throw error;
  }
  const result = await configured.transport.query<{ id: string }>({ label: "selftest", text: "SELECT id FROM app.example WHERE id = $1", values: ["safe-id"] });
  if (result.rows[0]?.id !== "row-1" || pool.queryCalls.length !== 1 || pool.queryCalls[0].values[0] !== "safe-id") throw new Error("parameterized query failed");

  for (const text of ["INSERT INTO app.example VALUES ($1)", "UPDATE app.example SET id = $1", "DELETE FROM app.example", "SELECT 1; SELECT 2", "WITH x AS (SELECT 1) SELECT * FROM x", "SELECT * FROM app.example FOR UPDATE"]) {
    try {
      await configured.transport.query({ label: "invalid", text, values: [] });
      throw new Error("invalid query was accepted");
    } catch (error) {
      if (!(error instanceof PostgresReadTransportError) || error.code !== "invalid_query_intent") throw error;
    }
  }
  if (pool.queryCalls.length !== 1) throw new Error("invalid queries reached the pool");

  pool.setFailure(Object.assign(new Error("sensitive $1 value"), { code: "ETIMEDOUT" }));
  try {
    await configured.transport.query({ label: "timeout", text: "SELECT id FROM app.example WHERE id = $1", values: ["secret-value"] });
    throw new Error("query failure was not reported");
  } catch (error) {
    if (!(error instanceof PostgresReadTransportError) || error.code !== "query_timeout" || error.message.includes("secret-value")) throw error;
  }
  await configured.transport.close();
  await configured.transport.close();
  if (pool.getEndCalls() !== 1) throw new Error("pool close was not idempotent");
}

if (process.env.POSTGRES_READ_TRANSPORT_SELFTEST === "1") {
  runPostgresReadTransportSelfTest().then(() => console.log("postgres read transport selftest passed"));
}
