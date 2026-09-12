import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const PROJECT_REF = "mgrsgibxuwgbxtdqprkw";
const TARGET_ENVIRONMENT = "staging";
const DATABASE = "postgres";
const UUID_NAMESPACE = "6ba7b810-9dad-11d1-80b4-00c04fd430c8";
const UUID_INPUT_PREFIX = "elearning.admin.permission.v1/";
const MEDWAY_ID = "37cb02d5-b44f-5c74-9768-077d1a187ead";
const ELITE_ID = "ad255057-2e07-56af-b999-fd935cb6e7d6";
const apiDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const fixturePath = path.join(apiDirectory, "db", "seed-drafts", "verification", "002_staging_admin_m2_permission_catalogue.sql");
const permissionContractPath = path.join(apiDirectory, "src", "contracts", "admin", "permissions.ts");

const manifest = Object.freeze([
  { id: "e291ccf1-a18e-5fab-9966-8b0bcedf517d", code: "admin.instructors.create", category: "instructors", description: "Create global instructors.", status: "active" },
  { id: "ea97a4ad-89dc-5edc-b3ba-b50ab5417ce5", code: "admin.instructors.update", category: "instructors", description: "Update global instructors.", status: "active" },
  { id: "f108bfdf-5cf7-50dd-bd15-a3a792580be4", code: "admin.brand_instructors.assign", category: "brand_instructors", description: "Assign global instructors to a brand.", status: "active" },
  { id: "126b7c16-95ae-5058-9c2b-8a53631fd6f0", code: "admin.brand_instructors.update", category: "brand_instructors", description: "Update brand instructor associations.", status: "active" },
  { id: "09cc729c-a607-5c64-b591-fb4ab640f3bf", code: "admin.brand_courses.create", category: "brand_courses", description: "Create brand courses.", status: "active" },
  { id: "cc76a74a-3ec8-5281-a729-33cd712aec0e", code: "admin.brand_courses.update", category: "brand_courses", description: "Update brand courses.", status: "active" },
  { id: "98573182-688b-5c32-9304-e886997b8e3b", code: "admin.course_instructors.assign", category: "course_instructors", description: "Assign instructors to brand courses.", status: "active" },
  { id: "93947542-fa93-50bf-8db1-2d068441bae2", code: "admin.course_instructors.update", category: "course_instructors", description: "Update course instructor assignments.", status: "active" },
]);

function assert(value, message) { if (!value) throw new Error(message); }

function uuidBytes(value) { return Buffer.from(value.replaceAll("-", ""), "hex"); }

function uuidV5(value) {
  const bytes = createHash("sha1").update(uuidBytes(UUID_NAMESPACE)).update(value).digest();
  bytes[6] = (bytes[6] & 0x0f) | 0x50;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = bytes.subarray(0, 16).toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function loadEnvironment() {
  const environment = { ...process.env };
  for (const fileName of [".env.local", ".env"]) {
    const filePath = path.join(apiDirectory, fileName);
    if (!existsSync(filePath)) continue;
    for (const line of readFileSync(filePath, "utf8").split(/\r?\n/)) {
      const match = line.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
      if (!match || environment[match[1]] !== undefined) continue;
      environment[match[1]] = match[2].trim().replace(/^(['"])(.*)\1$/, "$2");
    }
  }
  return environment;
}

function validateEnvironment(environment) {
  assert(environment.ADMIN_P56_PERMISSION_CATALOGUE_APPLY === "true", "Explicit Prompt 56B catalogue-apply gate is not enabled.");
  assert(environment.ADMIN_P56_TARGET_ENVIRONMENT === TARGET_ENVIRONMENT, "Staging environment gate failed.");
  assert(environment.SUPABASE_PROJECT_REF === PROJECT_REF, "Staging project reference gate failed.");
  assert(environment.SUPABASE_DB_URL, "Staging database URL is missing.");
  const target = new URL(environment.SUPABASE_DB_URL);
  assert(["postgres:", "postgresql:"].includes(target.protocol) && target.hostname, "PostgreSQL target gate failed.");
  assert(target.pathname === `/${DATABASE}`, "Database name gate failed.");
  assert(target.searchParams.get("sslmode") === "verify-full", "TLS verification-mode gate failed.");
  const caPath = environment.PGSSLROOTCERT || environment.NODE_EXTRA_CA_CERTS;
  assert(caPath && existsSync(caPath), "Trusted TLS root gate failed.");
  return { target, caPath };
}

function connectionString(target) {
  const value = new URL(target.href);
  value.searchParams.delete("sslmode");
  value.searchParams.delete("sslrootcert");
  return value.href;
}

async function openPool(target, caPath) {
  const imported = await import("pg");
  const Pool = imported.Pool ?? imported.default?.Pool;
  assert(Pool, "PostgreSQL transport is unavailable.");
  return new Pool({
    connectionString: connectionString(target),
    ssl: { rejectUnauthorized: true, ca: readFileSync(caPath, "utf8") },
    max: 1,
    connectionTimeoutMillis: 5_000,
    idleTimeoutMillis: 5_000,
    application_name: "elearning-p56b-permission-catalogue",
  });
}

function sameStrings(actual, expected) {
  return JSON.stringify([...actual].sort()) === JSON.stringify([...expected].sort());
}

function validateLocalArtifacts(sql) {
  const codes = manifest.map((entry) => entry.code);
  const ids = manifest.map((entry) => entry.id);
  assert(manifest.length === 8 && new Set(codes).size === 8 && new Set(ids).size === 8, "Permission manifest must contain eight unique codes and IDs.");
  for (const entry of manifest) {
    assert(uuidV5(`${UUID_INPUT_PREFIX}${entry.code}`) === entry.id, `Deterministic UUID mismatch for ${entry.code}.`);
  }
  const contract = readFileSync(permissionContractPath, "utf8");
  assert(codes.every((code) => contract.includes(`\"${code}\"`)), "Permission manifest does not match AdminPermissionCode.");
  const statements = sql.replace(/^\s*--.*$/gm, "").split(";").map((value) => value.trim()).filter(Boolean);
  assert(statements.length === 8, "Catalogue artifact must contain exactly eight statements.");
  assert(statements.every((statement) => /^insert\s+into\s+app\.admin_permissions\s*\(/i.test(statement)), "Catalogue artifact may insert only into app.admin_permissions.");
  assert(!/\b(update|delete|alter|drop|create|truncate|grant|revoke)\s+(table|schema|role|policy|on|from|app\.)/i.test(sql), "Catalogue artifact contains an unauthorized operation.");
  assert(!/app\.(admin_roles|admin_role_assignments|admin_role_permissions|app_users|admin_profiles|instructors|brand_instructors|brand_courses|course_instructors|admin_actions|audit_logs)\b/i.test(sql), "Catalogue artifact references an unauthorized table.");
  for (const entry of manifest) {
    assert(sql.includes(entry.id) && sql.includes(entry.code) && sql.includes(`'${entry.category}'`) && sql.includes(`'${entry.description}'`), `Catalogue SQL does not match manifest for ${entry.code}.`);
  }
}

async function rows(client, text, values = []) { return (await client.query(text, values)).rows; }

function numeric(row, key) {
  const value = Number(row?.[key]);
  assert(Number.isSafeInteger(value) && value >= 0, `Invalid count for ${key}.`);
  return value;
}

async function verifyPermissionSchema(client) {
  const columns = await rows(client, `select column_name, data_type, udt_name, is_nullable, column_default
    from information_schema.columns where table_schema = 'app' and table_name = 'admin_permissions' order by ordinal_position`);
  const expected = [
    ["id", "uuid", "uuid", "NO"], ["code", "text", "text", "NO"], ["category", "text", "text", "NO"],
    ["description", "text", "text", "YES"], ["status", "text", "text", "NO"],
    ["created_at", "timestamp with time zone", "timestamptz", "NO"], ["updated_at", "timestamp with time zone", "timestamptz", "NO"],
  ];
  assert(columns.length === expected.length && columns.every((column, index) =>
    column.column_name === expected[index][0] && column.data_type === expected[index][1] && column.udt_name === expected[index][2] && column.is_nullable === expected[index][3]), "Live admin_permissions column shape differs from M1.");
  assert(columns.find((column) => column.column_name === "id")?.column_default?.includes("gen_random_uuid"), "Permission ID default differs from M1.");
  assert(columns.find((column) => column.column_name === "status")?.column_default?.includes("active"), "Permission status default differs from M1.");
  assert(columns.filter((column) => ["created_at", "updated_at"].includes(column.column_name)).every((column) => column.column_default?.includes("now()")), "Permission timestamp defaults differ from M1.");
  const constraints = await rows(client, `select c.conname, c.contype, pg_get_constraintdef(c.oid) as definition
    from pg_constraint c join pg_class t on t.oid = c.conrelid join pg_namespace n on n.oid = t.relnamespace
    where n.nspname = 'app' and t.relname = 'admin_permissions' order by c.conname`);
  assert(constraints.some((item) => item.conname === "admin_permissions_pkey" && item.contype === "p"), "Permission primary key is missing.");
  assert(constraints.some((item) => item.conname === "admin_permissions_code_key" && item.contype === "u"), "Permission code uniqueness is missing.");
  assert(constraints.some((item) => item.conname === "admin_permissions_status_check" && item.contype === "c" && item.definition.includes("deprecated") && item.definition.includes("disabled")), "Permission status constraint differs from M1.");
  const triggers = await rows(client, `select trigger_name from information_schema.triggers
    where event_object_schema = 'app' and event_object_table = 'admin_permissions' and trigger_name = 'admin_permissions_set_updated_at'`);
  assert(triggers.length === 1, "Permission updated-at trigger is missing.");
}

async function classifyPermissions(client) {
  const ids = manifest.map((entry) => entry.id);
  const codes = manifest.map((entry) => entry.code);
  const found = await rows(client, `select id, code, category, description, status from app.admin_permissions
    where id = any($1::uuid[]) or code = any($2::text[]) order by code, id`, [ids, codes]);
  const absent = [];
  const exact = [];
  const conflicts = [];
  for (const expected of manifest) {
    const matches = found.filter((row) => row.id === expected.id || row.code === expected.code);
    if (matches.length === 0) absent.push(expected.code);
    else if (matches.length === 1 && Object.entries(expected).every(([key, value]) => matches[0][key] === value)) exact.push(expected.code);
    else conflicts.push(expected.code);
  }
  const manifestKeys = new Set([...ids, ...codes]);
  if (found.some((row) => !manifestKeys.has(row.id) || !manifestKeys.has(row.code))) {
    for (const row of found) if (!manifestKeys.has(row.id) || !manifestKeys.has(row.code)) conflicts.push(row.code);
  }
  return { absent: [...new Set(absent)].sort(), exact: [...new Set(exact)].sort(), conflicts: [...new Set(conflicts)].sort() };
}

async function dataSnapshot(client) {
  const result = (await rows(client, `select
    (select count(*)::int from app.app_users) as app_users,
    (select count(*)::int from app.admin_profiles) as admin_profiles,
    (select count(*)::int from app.admin_roles) as admin_roles,
    (select count(*)::int from app.admin_role_assignments) as role_assignments,
    (select count(*)::int from app.admin_role_permissions) as role_permissions,
    (select count(*)::int from app.instructors) as instructors,
    (select count(*)::int from app.brand_instructors) as brand_instructors,
    (select count(*)::int from app.brand_courses) as brand_courses,
    (select count(*)::int from app.course_instructors) as course_instructors,
    (select count(*)::int from app.admin_actions) as admin_actions,
    (select count(*)::int from app.audit_logs) as audit_logs,
    (select count(*)::int from app.academic_levels) as levels,
    (select count(*)::int from app.academic_semesters) as semesters,
    (select count(*)::int from app.academic_modules) as modules,
    (select count(*)::int from app.academic_modules where module_code in ('PDM1105', '1105 PMD')) as deferred_modules`))[0];
  return Object.fromEntries(Object.keys(result).map((key) => [key, numeric(result, key)]));
}

async function securitySnapshot(client) {
  const result = (await rows(client, `select
    (select count(*)::int from information_schema.tables where table_schema = 'app') as tables,
    (select count(*)::int from pg_constraint c join pg_namespace n on n.oid = c.connamespace where n.nspname = 'app') as constraints,
    (select count(*)::int from pg_indexes where schemaname = 'app') as indexes,
    (select count(*)::int from information_schema.triggers where event_object_schema = 'app') as triggers,
    (select count(*)::int from pg_policies where schemaname = 'app') as policies,
    (select relrowsecurity from pg_class c join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'app' and c.relname = 'admin_permissions') as permission_rls,
    case when exists(select 1 from pg_roles where rolname = 'anon') then has_schema_privilege('anon', 'app', 'USAGE') else false end as anon_schema_usage,
    case when exists(select 1 from pg_roles where rolname = 'authenticated') then has_schema_privilege('authenticated', 'app', 'USAGE') else false end as authenticated_schema_usage,
    case when exists(select 1 from pg_roles where rolname = 'anon') then has_table_privilege('anon', 'app.admin_permissions', 'SELECT,INSERT,UPDATE,DELETE') else false end as anon_table_dml,
    case when exists(select 1 from pg_roles where rolname = 'authenticated') then has_table_privilege('authenticated', 'app.admin_permissions', 'SELECT,INSERT,UPDATE,DELETE') else false end as authenticated_table_dml`))[0];
  return result;
}

async function foundationSnapshot(client) {
  return rows(client, "select id, code, name, status, created_at, updated_at from app.educational_brands where id = any($1::uuid[]) order by id", [[MEDWAY_ID, ELITE_ID]]);
}

async function preflight(client) {
  const database = await rows(client, "select current_database() as database_name");
  assert(database[0]?.database_name === DATABASE, "Connected database identity is not approved.");
  const appSchema = await rows(client, "select exists(select 1 from pg_namespace where nspname = 'app') as exists");
  assert(appSchema[0]?.exists === true, "Private app schema is missing.");
  await verifyPermissionSchema(client);
  const brands = await foundationSnapshot(client);
  assert(brands.length === 2 && brands.some((row) => row.id === MEDWAY_ID && row.code === "medway" && row.status === "active") && brands.some((row) => row.id === ELITE_ID && row.code === "elite" && row.status === "active"), "Medway or Elite foundation row is invalid.");
  const data = await dataSnapshot(client);
  assert(data.levels === 5 && data.semesters === 10 && data.modules === 60 && data.deferred_modules === 0, "Curriculum foundation state is invalid.");
  const security = await securitySnapshot(client);
  assert(security.permission_rls === false && security.anon_schema_usage === false && security.authenticated_schema_usage === false && security.anon_table_dml === false && security.authenticated_table_dml === false, "Private app-schema security boundary is not intact.");
  return { classification: await classifyPermissions(client), data, security, brands };
}

async function verifyPostApply(client, before) {
  const classification = await classifyPermissions(client);
  assert(classification.absent.length === 0 && classification.conflicts.length === 0 && classification.exact.length === 8, "Final permission catalogue is not exact.");
  assert(JSON.stringify(await dataSnapshot(client)) === JSON.stringify(before.data), "M1 authority, M2, M4, or curriculum state changed during Prompt 56B.");
  assert(JSON.stringify(await securitySnapshot(client)) === JSON.stringify(before.security), "Schema, RLS, policy, grant, or privacy state changed during Prompt 56B.");
  assert(JSON.stringify(await foundationSnapshot(client)) === JSON.stringify(before.brands), "Medway or Elite foundation state changed during Prompt 56B.");
  return classification;
}

function cleanup(environment) {
  for (const key of ["ADMIN_P56_PERMISSION_CATALOGUE_APPLY", "ADMIN_P56_TARGET_ENVIRONMENT", "SUPABASE_PROJECT_REF", "SUPABASE_DB_URL", "PGSSLROOTCERT", "NODE_EXTRA_CA_CERTS"]) {
    delete environment[key];
    delete process.env[key];
  }
}

async function main() {
  const environment = loadEnvironment();
  let pool;
  let client;
  let transaction = false;
  try {
    const sql = readFileSync(fixturePath, "utf8");
    validateLocalArtifacts(sql);
    if (environment.ADMIN_P56_PERMISSION_CATALOGUE_APPLY !== "true") {
      console.log("Prompt 56B permission catalogue apply skipped: ADMIN_P56_PERMISSION_CATALOGUE_APPLY is not true.");
      return;
    }
    const { target, caPath } = validateEnvironment(environment);
    pool = await openPool(target, caPath);
    client = await pool.connect();
    const before = await preflight(client);
    console.log(`Prompt 56B preflight: absent=${before.classification.absent.length} exact_existing=${before.classification.exact.length} conflicts=${before.classification.conflicts.length}.`);
    assert(before.classification.conflicts.length === 0, `Permission catalogue conflict: ${before.classification.conflicts.join(",")}.`);
    if (before.classification.absent.length === 0) {
      await verifyPostApply(client, before);
      console.log("Prompt 56B permission catalogue verified: inserted=0 exact_existing=8 conflicts=0.");
      return;
    }
    await client.query("BEGIN");
    transaction = true;
    await client.query(sql);
    const inside = await classifyPermissions(client);
    assert(inside.absent.length === 0 && inside.conflicts.length === 0 && inside.exact.length === 8, "Transaction-local catalogue verification failed.");
    await client.query("COMMIT");
    transaction = false;
    await verifyPostApply(client, before);
    console.log(`Prompt 56B permission catalogue applied: inserted=${before.classification.absent.length} exact_existing=${before.classification.exact.length} conflicts=0 final=8.`);
  } catch (error) {
    if (client && transaction) { try { await client.query("ROLLBACK"); } catch { /* preserve original sanitized failure */ } }
    throw error;
  } finally {
    client?.release();
    if (pool) await pool.end();
    cleanup(environment);
  }
}

main().catch((error) => {
  console.error(`Prompt 56B permission catalogue apply failed: ${error instanceof Error ? error.message : "unexpected error"}`);
  process.exitCode = 1;
});
