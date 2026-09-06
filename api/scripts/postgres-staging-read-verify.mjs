import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { classifyPostgresTarget } from "./postgres-target-classifier.mjs";

const TARGET_PROJECT_REF = "mgrsgibxuwgbxtdqprkw";
const TARGET_ENVIRONMENT = "staging";
const APP_SCHEMA = "app";
const EXPECTED_TABLES = Object.freeze([
  "educational_brands",
  "app_users",
  "brand_memberships",
  "student_profiles",
  "admin_profiles",
  "admin_permissions",
  "admin_roles",
  "admin_role_permissions",
  "admin_role_assignments",
]);
let lastVerificationPhase = "initialization";

function isDirectInvocation() {
  return process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
}

function loadLocalEnvironment() {
  const environment = { ...process.env };
  const apiDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  // Local precedence follows common dotenv behavior: process > .env.local > .env.
  for (const fileName of [".env", ".env.local"]) {
    const environmentPath = path.join(apiDirectory, fileName);
    if (!fs.existsSync(environmentPath)) continue;
    for (const line of fs.readFileSync(environmentPath, "utf8").split(/\r?\n/)) {
      const match = line.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
      if (!match) continue;
      const value = match[2].trim().replace(/^(['"])(.*)\1$/, "$2");
      if (environment[match[1]] === undefined) environment[match[1]] = value;
    }
  }
  return environment;
}

function requireEnabled(environment) {
  if (environment.POSTGRES_STAGING_READ_VERIFY !== "true") {
    console.log("staging PostgreSQL read verification skipped: POSTGRES_STAGING_READ_VERIFY is not true");
    return false;
  }
  return true;
}

function validateTarget(environment) {
  if (environment.SUPABASE_PROJECT_REF !== TARGET_PROJECT_REF) {
    throw new Error("staging verification target mismatch");
  }
  if (environment.ADMIN_RUNTIME_MODE && environment.ADMIN_RUNTIME_MODE !== "mock") {
    throw new Error("current API runtime must remain mock");
  }
  if (environment.PERSISTENCE_PROVIDER && environment.PERSISTENCE_PROVIDER !== "mock") {
    throw new Error("current runtime persistence provider must remain mock");
  }
}

function validateDatabaseUrl(value) {
  if (!classifyPostgresTarget(value, TARGET_PROJECT_REF)) throw new Error("SUPABASE_DB_URL target is not approved");
}

function resultRows(result) {
  return Array.isArray(result?.rows) ? result.rows : [];
}

function verificationFailure(code) {
  const error = new Error("staging verification check failed");
  error.verificationCode = code;
  return error;
}

async function runVerification(environment = loadLocalEnvironment()) {
  if (!requireEnabled(environment)) return { skipped: true };

  try {
    validateTarget(environment);
    validateDatabaseUrl(environment.SUPABASE_DB_URL);
  } catch (error) {
    if (error && typeof error === "object") error.verificationPhase = "preflight";
    throw error;
  }

  const modulePath = new URL("../dist/infrastructure/postgres/index.js", import.meta.url);
  let boundary;
  try {
    const { createPostgresReadTransportFromEnvironment } = await import(modulePath.href);
    const transportEnvironment = { ...environment, PERSISTENCE_PROVIDER: "supabase" };
    boundary = createPostgresReadTransportFromEnvironment(transportEnvironment);
  } catch (error) {
    if (error && typeof error === "object") error.verificationPhase = "transport_initialization";
    throw error;
  }
  if (boundary.kind !== "supabase-configured-not-wired") throw new Error("Postgres transport was not configured");

  const transport = boundary.transport;
  const startedAt = Date.now();
  let activePhase = "initialization";
  console.log(`staging PostgreSQL read verification: project_ref=${TARGET_PROJECT_REF} environment=${TARGET_ENVIRONMENT}`);
  try {
    activePhase = "connectivity";
    lastVerificationPhase = activePhase;
    const connectivity = await transport.query({ label: "staging-connectivity", text: "SELECT 1 AS ok", values: [] });
    if (String(resultRows(connectivity)[0]?.ok) !== "1") throw verificationFailure("connectivity");
    console.log("PASS SELECT 1");

    activePhase = "database_identity";
    lastVerificationPhase = activePhase;
    const identity = await transport.query({ label: "staging-database-identity", text: "SELECT current_database() AS database_name", values: [] });
    const databaseName = resultRows(identity)[0]?.database_name;
    if (typeof databaseName !== "string" || !databaseName) throw verificationFailure("database_identity");
    console.log(`PASS current_database database_name=${databaseName}`);

    activePhase = "app_schema";
    lastVerificationPhase = activePhase;
    const schemaResult = await transport.query({
      label: "staging-app-schema",
      text: "SELECT EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = $1) AS exists",
      values: [APP_SCHEMA],
    });
    if (resultRows(schemaResult)[0]?.exists !== true) throw verificationFailure("app_schema");
    console.log("PASS app schema exists=true");

    activePhase = "m1_table_presence";
    lastVerificationPhase = activePhase;
    const tablePlaceholders = EXPECTED_TABLES.map((_, index) => `$${index + 2}`).join(", ");
    const tableResult = await transport.query({
      label: "staging-m1-table-presence",
      text: `SELECT table_name FROM information_schema.tables WHERE table_schema = $1 AND table_name IN (${tablePlaceholders}) ORDER BY table_name`,
      values: [APP_SCHEMA, ...EXPECTED_TABLES],
    });
    const presentTables = resultRows(tableResult).map((row) => row.table_name).filter((name) => typeof name === "string");
    const missingTables = EXPECTED_TABLES.filter((name) => !presentTables.includes(name));
    if (missingTables.length) throw verificationFailure("m1_table_presence");
    console.log(`PASS M1 tables present=${EXPECTED_TABLES.join(",")}`);

    for (const tableName of EXPECTED_TABLES) {
      activePhase = "m1_row_count";
      lastVerificationPhase = activePhase;
      const countResult = await transport.query({
        label: `staging-row-count-${tableName}`,
        text: `SELECT COUNT(*) AS count FROM app.${tableName}`,
        values: [],
      });
      const count = resultRows(countResult)[0]?.count;
      if (typeof count !== "string" && typeof count !== "number") throw verificationFailure("m1_row_count");
      console.log(`PASS row_count table=${tableName} count=${String(count)}`);
    }
    console.log(`staging PostgreSQL read verification passed duration_ms=${Date.now() - startedAt}`);
    return { skipped: false };
  } catch (error) {
    if (error && typeof error === "object") error.verificationPhase = activePhase;
    throw error;
  } finally {
    await transport.close();
    console.log("Postgres pool closed");
  }
}

export { runVerification, TARGET_PROJECT_REF, EXPECTED_TABLES };

if (isDirectInvocation()) {
  runVerification().catch((error) => {
    const category = error && typeof error.code === "string" ? error.code : "verification_failed";
    const verificationCode = error && typeof error.verificationCode === "string" && /^[a-z0-9_]+$/.test(error.verificationCode)
      ? error.verificationCode
      : "redacted";
    const providerCode = error && typeof error.providerCode === "string" && /^[A-Z0-9_]+$/.test(error.providerCode)
      ? error.providerCode
      : "redacted";
    const phase = error && typeof error.verificationPhase === "string" ? error.verificationPhase : lastVerificationPhase;
    console.error(`staging PostgreSQL read verification failed: category=${category} provider_code=${providerCode} verification_code=${verificationCode} phase=${phase}`);
    process.exitCode = 1;
  });
}
