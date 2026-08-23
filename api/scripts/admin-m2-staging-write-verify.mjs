import { spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { request as nodeHttpRequest } from "node:http";
import { createServer } from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";

const PROJECT_REF = "mgrsgibxuwgbxtdqprkw";
const ENVIRONMENT = "staging";
const DATABASE = "postgres";
const HOST = "127.0.0.1";
const MOCK_BEARER = "mock-auth-medway-admin-001";
const MOCK_AUTH_USER_ID = "02694d40-9dec-5f53-a613-6fb946a2b0fa";
const APP_USER_ID = "c3214c3c-349f-512c-8917-4053c19428a5";
const ADMIN_PROFILE_ID = "ec1b84ae-bd54-57ba-9b38-0c88735f33af";
const ROLE_ID = "d5443433-a172-5bf7-a628-08cb4b992a63";
const ASSIGNMENT_ID = "4977dd88-9e0f-5a81-8d84-458e74481aac";
const ROLE_CODE = "staging_verify_m2_admin";
const INSTRUCTOR_NAME = "__STAGING_VERIFY_P56_INSTRUCTOR__";
const INSTRUCTOR_TITLE = "Prompt 56 Verification Fixture";
const COURSE_CODE = "VERIFY_P56_M2";
const COURSE_TITLE = "__STAGING_VERIFY_P56_COURSE__";
const REASON = "Prompt 56 controlled staging verification fixture";
const ABSENT_ID = "00000000-0000-4000-8000-000000000056";
const apiDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const permissions = Object.freeze([
  "admin.instructors.create",
  "admin.instructors.update",
  "admin.brand_instructors.assign",
  "admin.brand_instructors.update",
  "admin.brand_courses.create",
  "admin.brand_courses.update",
  "admin.course_instructors.assign",
  "admin.course_instructors.update",
]);

const permissionIds = Object.freeze({
  "admin.instructors.create": "e291ccf1-a18e-5fab-9966-8b0bcedf517d",
  "admin.instructors.update": "ea97a4ad-89dc-5edc-b3ba-b50ab5417ce5",
  "admin.brand_instructors.assign": "f108bfdf-5cf7-50dd-bd15-a3a792580be4",
  "admin.brand_instructors.update": "126b7c16-95ae-5058-9c2b-8a53631fd6f0",
  "admin.brand_courses.create": "09cc729c-a607-5c64-b591-fb4ab640f3bf",
  "admin.brand_courses.update": "cc76a74a-3ec8-5281-a729-33cd712aec0e",
  "admin.course_instructors.assign": "98573182-688b-5c32-9304-e886997b8e3b",
  "admin.course_instructors.update": "93947542-fa93-50bf-8db1-2d068441bae2",
});

const expectedTables = Object.freeze([
  "academic_levels", "academic_modules", "academic_semesters", "admin_actions", "admin_permissions",
  "admin_profiles", "admin_role_assignments", "admin_role_permissions", "admin_roles", "app_users",
  "audit_logs", "brand_courses", "brand_instructors", "course_instructors", "educational_brands", "instructors",
]);

const rejectedEvidenceKeys = Object.freeze([
  "p56-negative-auth-v1", "p56-negative-malformed-auth-v1", "p56-negative-duplicate-auth-v1",
  "p56-negative-malformed-key-v1", "p56-negative-uuid-v1", "p56-negative-query-v1",
  "p56-negative-malformed-json-v1", "p56-negative-null-v1", "p56-negative-array-v1",
  "p56-negative-primitive-v1", "p56-negative-oversized-v1", "p56-negative-unsupported-v1",
  "p56-negative-adminprofileid-v1", "p56-negative-permissions-v1", "p56-negative-brandid-v1",
  "p56-negative-elite-v1", "p56-stale-instructor-v1", "p56-elite-instructor-v1",
  "p56-elite-course-v1", "p56-elite-course-instructor-v1", "p56-republish-archived-course-v1",
]);

const evidencePlan = Object.freeze([
  ["p56-create-instructor-v1", "admin.m2.instructors.create", "instructor"],
  ["p56-assign-brand-instructor-v1", "admin.m2.brand_instructors.assign", "brand_instructor"],
  ["p56-create-course-v1", "admin.m2.brand_courses.create", "brand_course"],
  ["p56-assign-course-instructor-v1", "admin.m2.course_instructors.assign", "course_instructor"],
  ["p56-update-instructor-v1", "admin.m2.instructors.update", "instructor"],
  ["p56-publish-course-v1", "admin.m2.brand_courses.set_status", "brand_course"],
  ["p56-archive-course-v1", "admin.m2.brand_courses.set_status", "brand_course"],
  ["p56-inactivate-course-instructor-v1", "admin.m2.course_instructors.set_status", "course_instructor"],
  ["p56-inactivate-brand-instructor-v1", "admin.m2.brand_instructors.set_status", "brand_instructor"],
  ["p56-inactivate-instructor-v1", "admin.m2.instructors.set_status", "instructor"],
]);

function assert(value, message) {
  if (!value) throw new Error(message);
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
  assert(environment.ADMIN_M2_STAGING_WRITE_VERIFY === "true", "Explicit Prompt 56 verification gate is not enabled.");
  assert(environment.ADMIN_P56_TARGET_ENVIRONMENT === ENVIRONMENT, "Staging environment selector gate failed.");
  assert(environment.SUPABASE_PROJECT_REF === PROJECT_REF, "Staging project reference gate failed.");
  assert(environment.SUPABASE_DB_URL, "Staging database URL is missing.");
  const target = new URL(environment.SUPABASE_DB_URL);
  assert(["postgres:", "postgresql:"].includes(target.protocol), "Database protocol gate failed.");
  assert(Boolean(target.hostname), "Database hostname gate failed.");
  const hostname = target.hostname.toLowerCase();
  const username = decodeURIComponent(target.username).toLowerCase();
  const directTarget = hostname === `db.${PROJECT_REF}.supabase.co`;
  const poolerTarget = hostname.endsWith(".pooler.supabase.com") && username.includes(PROJECT_REF);
  assert(directTarget || poolerTarget, "Supabase staging host/project identity gate failed.");
  assert(target.pathname === `/${DATABASE}`, "Database name gate failed.");
  assert(target.searchParams.get("sslmode") === "verify-full", "TLS verification-mode gate failed.");
  const caPath = environment.PGSSLROOTCERT || environment.NODE_EXTRA_CA_CERTS;
  assert(caPath && existsSync(caPath), "Trusted TLS root gate failed.");
  const child = {
    ADMIN_RUNTIME_MODE: "mock",
    PERSISTENCE_PROVIDER: "supabase",
    AUTH_PROVIDER: "mock",
    ADMIN_READ_MODEL_SOURCE: "mock",
    ADMIN_M2_READ_MODEL_SOURCE: "postgres",
    ADMIN_COMMAND_SOURCE: "postgres",
  };
  assert(Object.values(child).every(Boolean), "Temporary runtime selector gate failed.");
  return { target, caPath, child };
}

function poolConnectionString(target) {
  const value = new URL(target.href);
  value.searchParams.delete("sslmode");
  value.searchParams.delete("sslrootcert");
  return value.href;
}

async function openSelectPool(environment, target, caPath) {
  const imported = await import("pg");
  const Pool = imported.Pool ?? imported.default?.Pool;
  assert(Pool, "PostgreSQL verification transport is unavailable.");
  return new Pool({
    connectionString: poolConnectionString(target),
    ssl: { rejectUnauthorized: true, ca: readFileSync(caPath, "utf8") },
    max: 1,
    idleTimeoutMillis: 5_000,
    connectionTimeoutMillis: 5_000,
    application_name: "elearning-p56-select-verifier",
  });
}

async function selectRows(pool, label, text, values = []) {
  assert(/^\s*select\b/i.test(text), `${label} is not an allowlisted SELECT.`);
  const result = await pool.query({ name: `p56-${label}`, text, values });
  return result.rows;
}

function count(row, key = "count") {
  const value = Number(row?.[key]);
  assert(Number.isSafeInteger(value) && value >= 0, `Invalid count for ${key}.`);
  return value;
}

function sameStrings(actual, expected) {
  return JSON.stringify([...actual].sort()) === JSON.stringify([...expected].sort());
}

async function schemaSnapshot(pool) {
  const rows = await selectRows(pool, "schema-snapshot", `select
    (select count(*)::int from information_schema.tables where table_schema = 'app') as tables,
    (select count(*)::int from pg_constraint c join pg_namespace n on n.oid = c.connamespace where n.nspname = 'app') as constraints,
    (select count(*)::int from pg_indexes where schemaname = 'app') as indexes,
    (select count(*)::int from information_schema.triggers where event_object_schema = 'app') as triggers,
    (select count(*)::int from pg_policies where schemaname = 'app') as policies,
    (select count(*)::int from pg_class c join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'app' and c.relkind = 'r' and c.relrowsecurity) as rls_tables,
    case when exists(select 1 from pg_roles where rolname = 'anon') then has_schema_privilege('anon', 'app', 'USAGE') else false end as anon_schema_usage,
    case when exists(select 1 from pg_roles where rolname = 'authenticated') then has_schema_privilege('authenticated', 'app', 'USAGE') else false end as authenticated_schema_usage,
    (select count(*)::int from information_schema.role_table_grants where table_schema = 'app' and grantee in ('anon', 'authenticated')) as public_table_grants`);
  const row = rows[0];
  return {
    tables: count(row, "tables"), constraints: count(row, "constraints"), indexes: count(row, "indexes"),
    triggers: count(row, "triggers"), policies: count(row, "policies"), rlsTables: count(row, "rls_tables"),
    anonSchemaUsage: row.anon_schema_usage, authenticatedSchemaUsage: row.authenticated_schema_usage,
    publicTableGrants: count(row, "public_table_grants"),
  };
}

async function authoritySnapshot(pool, medwayId) {
  const identities = await selectRows(pool, "authority-identity", `select au.id as app_user_id, au.auth_user_id, au.primary_email, au.primary_phone,
    au.status as app_user_status, au.created_at as app_user_created_at, au.updated_at as app_user_updated_at,
    ap.id as admin_profile_id, ap.brand_id, ap.app_user_id as profile_app_user_id, ap.display_name,
    ap.status as admin_profile_status, ap.created_at as admin_profile_created_at, ap.updated_at as admin_profile_updated_at
    from app.app_users au join app.admin_profiles ap on ap.app_user_id = au.id
    where au.auth_user_id = $1 and ap.brand_id = $2`, [MOCK_AUTH_USER_ID, medwayId]);
  const assignments = await selectRows(pool, "authority-assignment", `select ara.id as assignment_id, ara.brand_id, ara.admin_profile_id,
    ara.role_id, ara.assigned_by_admin_profile_id, ara.assigned_at, ara.revoked_at, ara.status as assignment_status,
    ara.created_at as assignment_created_at, ara.updated_at as assignment_updated_at,
    r.code as role_code, r.name as role_name, r.description as role_description, r.status as role_status,
    r.created_at as role_created_at, r.updated_at as role_updated_at
    from app.admin_role_assignments ara join app.admin_roles r on r.id = ara.role_id and r.brand_id = ara.brand_id
    where ara.admin_profile_id = $1 and ara.brand_id = $2`, [ADMIN_PROFILE_ID, medwayId]);
  const resolvedPermissions = await selectRows(pool, "authority-permissions", `select p.id, p.code, p.category, p.description, p.status, rp.created_at
    from app.admin_role_assignments ara
    join app.admin_roles r on r.id = ara.role_id and r.brand_id = ara.brand_id and r.status = 'active'
    join app.admin_role_permissions rp on rp.role_id = r.id
    join app.admin_permissions p on p.id = rp.permission_id and p.status = 'active'
    where ara.admin_profile_id = $1 and ara.brand_id = $2 and ara.status = 'active' order by p.code`, [ADMIN_PROFILE_ID, medwayId]);
  return { identities, assignments, resolvedPermissions };
}

async function permissionCatalogueSnapshot(pool) {
  return selectRows(pool, "permission-catalogue", `select id, code, category, description, status, created_at, updated_at
    from app.admin_permissions where code = any($1::text[]) order by code`, [permissions]);
}

async function preflight(pool) {
  const database = await selectRows(pool, "database", "select current_database() as database_name");
  assert(database[0]?.database_name === DATABASE, "Connected database identity is not approved.");

  const appSchema = await selectRows(pool, "app-schema", "select exists(select 1 from pg_namespace where nspname = 'app') as exists");
  assert(appSchema[0]?.exists === true, "Private app schema is missing.");
  const tables = await selectRows(pool, "required-tables", `select table_name from information_schema.tables
    where table_schema = 'app' and table_name = any($1::text[]) order by table_name`, [expectedTables]);
  assert(sameStrings(tables.map((row) => row.table_name), expectedTables), "Required M1/M2/M4 tables are missing.");

  const brands = await selectRows(pool, "brands", "select id, code, name, slug, status, created_at, updated_at from app.educational_brands where code = any($1::text[]) order by code", [["elite", "medway"]]);
  assert(brands.length === 2 && brands.every((row) => row.status === "active"), "Medway/Elite foundation brand state is invalid.");
  const medway = brands.find((row) => row.code === "medway");
  const elite = brands.find((row) => row.code === "elite");
  assert(medway?.id && elite?.id, "Medway/Elite identifiers could not be resolved.");

  const initial = await fixtureSnapshot(pool);
  assert(Object.values(initial).every((value) => value === 0), "Prompt 56 fixture or evidence state already exists; automatic resume is forbidden.");

  const authority = await authoritySnapshot(pool, medway.id);
  const identity = authority.identities[0];
  assert(authority.identities.length === 1 && identity.app_user_id === APP_USER_ID && identity.auth_user_id === MOCK_AUTH_USER_ID && identity.app_user_status === "active" && identity.admin_profile_id === ADMIN_PROFILE_ID && identity.profile_app_user_id === APP_USER_ID && identity.admin_profile_status === "active", "Persisted Prompt 56A identity/profile fixture is invalid.");
  const assignment = authority.assignments[0];
  assert(authority.assignments.length === 1 && assignment.assignment_id === ASSIGNMENT_ID && assignment.brand_id === medway.id && assignment.admin_profile_id === ADMIN_PROFILE_ID && assignment.role_id === ROLE_ID && assignment.assignment_status === "active" && assignment.role_code === ROLE_CODE && assignment.role_status === "active", "Persisted Prompt 56A role/assignment fixture is invalid.");
  const actualPermissions = authority.resolvedPermissions.map((row) => row.code);
  assert(authority.resolvedPermissions.length === 8 && sameStrings(actualPermissions, permissions), "Persisted Medway Admin permission set is not exactly the approved eight.");
  for (const row of authority.resolvedPermissions) assert(permissionIds[row.code] === row.id && row.status === "active", `Persisted permission definition is incompatible: ${row.code}.`);

  const catalogue = await permissionCatalogueSnapshot(pool);
  assert(catalogue.length === 8 && sameStrings(catalogue.map((row) => row.code), permissions), "Prompt 56B catalogue is incomplete.");
  for (const row of catalogue) assert(permissionIds[row.code] === row.id && row.status === "active", `Prompt 56B catalogue row is incompatible: ${row.code}.`);

  const eliteAuthority = await selectRows(pool, "elite-authority", `select count(*)::int as count
    from app.app_users au join app.admin_profiles ap on ap.app_user_id = au.id
    where au.auth_user_id = $1 and ap.brand_id = $2 and au.status = 'active' and ap.status = 'active'`, [MOCK_AUTH_USER_ID, elite.id]);
  assert(count(eliteAuthority[0]) === 0, "Medway mock principal unexpectedly has Elite Admin authority.");

  const constraints = await selectRows(pool, "m4-constraints", `select conname from pg_constraint
    where conname = any($1::text[]) order by conname`, [["admin_actions_idempotency_key", "audit_logs_admin_action_id_key"]]);
  assert(constraints.length === 2, "Required M4 constraints are missing.");

  const schema = await schemaSnapshot(pool);
  assert(schema.anonSchemaUsage === false && schema.authenticatedSchemaUsage === false && schema.publicTableGrants === 0, "Private app-schema privilege boundary is not intact.");
  const foundation = await foundationSnapshot(pool);
  assert(foundation.levels === 5 && foundation.semesters === 10 && foundation.modules === 60 && foundation.deferredModules === 0, "Curriculum foundation state is invalid.");
  return { medwayId: medway.id, eliteId: elite.id, adminProfileId: ADMIN_PROFILE_ID, immutable: { brands, authority, catalogue, schema, foundation } };
}

async function fixtureSnapshot(pool) {
  const rows = await selectRows(pool, "fixture-snapshot", `select
    (select count(*)::int from app.instructors where display_name = $1) as instructors,
    (select count(*)::int from app.brand_instructors bi join app.instructors i on i.id = bi.instructor_id where i.display_name = $1) as brand_instructors,
    (select count(*)::int from app.brand_courses where course_code = $2 or title = $3) as courses,
    (select count(*)::int from app.course_instructors ci join app.brand_courses bc on bc.id = ci.course_id where bc.course_code = $2 or bc.title = $3) as course_instructors,
    (select count(*)::int from app.admin_actions where idempotency_key like 'p56-%') as actions,
    (select count(*)::int from app.audit_logs where idempotency_key like 'p56-%') as audits`, [INSTRUCTOR_NAME, COURSE_CODE, COURSE_TITLE]);
  const row = rows[0];
  return {
    instructors: count(row, "instructors"),
    brandInstructors: count(row, "brand_instructors"),
    courses: count(row, "courses"),
    courseInstructors: count(row, "course_instructors"),
    actions: count(row, "actions"),
    audits: count(row, "audits"),
  };
}

async function foundationSnapshot(pool) {
  const rows = await selectRows(pool, "foundation-snapshot", `select
    (select count(*)::int from app.academic_levels) as levels,
    (select count(*)::int from app.academic_semesters) as semesters,
    (select count(*)::int from app.academic_modules) as modules,
    (select count(*)::int from app.academic_modules where module_code in ('PDM1105', '1105 PMD')) as deferred_modules`);
  const row = rows[0];
  return {
    levels: count(row, "levels"), semesters: count(row, "semesters"),
    modules: count(row, "modules"), deferredModules: count(row, "deferred_modules"),
  };
}

function reservePort() {
  return new Promise((resolve, reject) => {
    const probe = createServer();
    probe.once("error", reject);
    probe.listen(0, HOST, () => {
      const address = probe.address();
      const port = typeof address === "object" && address ? address.port : undefined;
      probe.close((error) => error || !port ? reject(error ?? new Error("Could not reserve a verification port.")) : resolve(port));
    });
  });
}

const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

async function http(baseUrl, method, pathname, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 7_500);
  const headers = {};
  if (options.auth !== false) headers.authorization = options.authorization ?? `Bearer ${MOCK_BEARER}`;
  if (options.key) headers["idempotency-key"] = options.key;
  if (options.body !== undefined || options.rawBody !== undefined) headers["content-type"] = "application/json";
  try {
    const response = await fetch(`${baseUrl}${pathname}`, {
      method, headers, signal: controller.signal,
      ...(options.rawBody !== undefined ? { body: options.rawBody } : options.body !== undefined ? { body: JSON.stringify(options.body) } : {}),
    });
    const text = await response.text();
    let body;
    try { body = text ? JSON.parse(text) : null; } catch { body = null; }
    return { status: response.status, body, headers: response.headers };
  } finally { clearTimeout(timeout); }
}

async function rawHttp(baseUrl, method, pathname, headers, body) {
  const target = new URL(pathname, baseUrl);
  return new Promise((resolve, reject) => {
    const request = nodeHttpRequest({ hostname: target.hostname, port: target.port, path: `${target.pathname}${target.search}`, method, headers }, (response) => {
      const chunks = [];
      response.setEncoding("utf8");
      response.on("data", (chunk) => chunks.push(chunk));
      response.on("end", () => {
        const text = chunks.join("");
        let responseBody;
        try { responseBody = text ? JSON.parse(text) : null; } catch { responseBody = null; }
        resolve({ status: response.statusCode ?? 0, body: responseBody, headers: response.headers });
      });
    });
    request.setTimeout(7_500, () => request.destroy(new Error("Raw HTTP request timed out.")));
    request.on("error", reject);
    if (body !== undefined) request.write(body);
    request.end();
  });
}

function expectStatus(result, expected, label) {
  const allowed = Array.isArray(expected) ? expected : [expected];
  assert(allowed.includes(result.status), `${label}: expected HTTP ${allowed.join("/")}, received ${result.status}.`);
  return result;
}

function expectMutation(result, status, label) {
  expectStatus(result, status, label);
  assert(result.body?.ok === true && result.body.mutated === true && result.body.replayed === false, `${label}: mutation envelope is invalid.`);
  assert(result.body.adminActionId && result.body.auditLogId, `${label}: evidence identifiers are missing.`);
  return result.body;
}

async function waitForApi(child, baseUrl) {
  const deadline = Date.now() + 15_000;
  while (Date.now() < deadline) {
    assert(child.exitCode === null, "Temporary API exited during startup.");
    try {
      const result = await http(baseUrl, "GET", "/health", { auth: false });
      if (result.status === 200 && result.body?.status === "ok") return;
    } catch { /* bounded startup polling only */ }
    await wait(125);
  }
  throw new Error("Temporary API did not become healthy.");
}

async function stopApi(child) {
  if (!child || child.exitCode !== null) return;
  const exited = new Promise((resolve) => child.once("exit", (code, signal) => resolve({ code, signal })));
  child.kill("SIGTERM");
  const result = await Promise.race([exited, wait(15_000).then(() => undefined)]);
  assert(result && (result.code === 0 || result.code === null), "Temporary API did not shut down cleanly.");
}

async function baselineAndNegatives(baseUrl, pool, context) {
  expectStatus(await http(baseUrl, "GET", "/health", { auth: false }), 200, "health");
  const readiness = expectStatus(await http(baseUrl, "GET", "/ready", { auth: false }), 200, "readiness");
  assert(readiness.body?.status === "ready", "Readiness response is invalid.");
  const overview = expectStatus(await http(baseUrl, "GET", "/v1/admin/overview?brand=medway", { auth: false }), 200, "Admin Overview");
  assert(overview.body?.brand?.brandId === "brand-medway", "Admin Overview is not mock-backed.");
  const levels = expectStatus(await http(baseUrl, "GET", "/v1/admin/curriculum/levels", { auth: false }), 200, "levels");
  const semesters = expectStatus(await http(baseUrl, "GET", "/v1/admin/curriculum/semesters", { auth: false }), 200, "semesters");
  const modules = expectStatus(await http(baseUrl, "GET", "/v1/admin/curriculum/modules", { auth: false }), 200, "modules");
  assert(levels.body?.data?.length === 5 && semesters.body?.data?.length === 10 && modules.body?.data?.length === 60, "Curriculum baseline count mismatch.");
  assert(!modules.body.data.some((row) => ["PDM1105", "1105 PMD"].includes(row.moduleCode)), "Deferred PDM module is present.");

  const createPath = `/v1/admin/brands/${context.medwayId}/instructors/global`;
  const validBody = { displayName: INSTRUCTOR_NAME, professionalTitle: null, reason: REASON };
  const before = await fixtureSnapshot(pool);
  assert(Object.values(before).every((value) => value === 0), "Negative-test baseline is not empty.");
  expectStatus(await http(baseUrl, "POST", createPath, { auth: false, key: "p56-negative-auth-v1", body: validBody }), 401, "missing Authorization");
  expectStatus(await http(baseUrl, "POST", createPath, { authorization: "Bearer malformed credential", key: "p56-negative-malformed-auth-v1", body: validBody }), 401, "malformed Authorization");
  expectStatus(await rawHttp(baseUrl, "POST", createPath, [
    "authorization", "Bearer malformed-one", "authorization", "Bearer malformed-two",
    "idempotency-key", "p56-negative-duplicate-auth-v1", "content-type", "application/json",
  ], JSON.stringify(validBody)), [400, 401], "duplicate Authorization");
  expectStatus(await http(baseUrl, "POST", createPath, { body: validBody }), 400, "missing Idempotency-Key");
  expectStatus(await http(baseUrl, "POST", createPath, { key: "invalid key", body: validBody }), 400, "malformed Idempotency-Key");
  expectStatus(await http(baseUrl, "POST", createPath, { key: "p56-negative-malformed-json-v1", rawBody: "{" }), 400, "malformed JSON");
  expectStatus(await http(baseUrl, "POST", createPath, { key: "p56-negative-null-v1", body: null }), 400, "null JSON");
  expectStatus(await http(baseUrl, "POST", createPath, { key: "p56-negative-array-v1", body: [] }), 400, "array JSON");
  expectStatus(await http(baseUrl, "POST", createPath, { key: "p56-negative-primitive-v1", body: "invalid" }), 400, "primitive JSON");
  const oversizedBody = JSON.stringify({ ...validBody, padding: "x".repeat(33 * 1024) });
  expectStatus(await http(baseUrl, "POST", createPath, { key: "p56-negative-oversized-v1", rawBody: oversizedBody }), 400, "oversized JSON");
  expectStatus(await http(baseUrl, "POST", createPath, { key: "p56-negative-unsupported-v1", body: { ...validBody, unsupported: true } }), 400, "unsupported body field");
  for (const [field, value] of [["adminProfileId", ABSENT_ID], ["permissions", []], ["brandId", context.medwayId]]) {
    expectStatus(await http(baseUrl, "POST", createPath, { key: `p56-negative-${field.toLowerCase()}-v1`, body: { ...validBody, [field]: value } }), 400, `forbidden body field ${field}`);
  }
  expectStatus(await http(baseUrl, "POST", "/v1/admin/brands/not-a-uuid/instructors/global", { key: "p56-negative-uuid-v1", body: validBody }), 400, "malformed UUID");
  expectStatus(await http(baseUrl, "POST", `${createPath}?unsupported=true`, { key: "p56-negative-query-v1", body: validBody }), 400, "unsupported query");
  expectStatus(await http(baseUrl, "PATCH", `/v1/admin/brands/${context.eliteId}/courses/${ABSENT_ID}/status`, { key: "p56-negative-elite-v1", body: { status: "published", reason: REASON } }), [403, 404], "wrong brand authority");
  const after = await fixtureSnapshot(pool);
  assert(JSON.stringify(after) === JSON.stringify(before), "Negative checks created fixture or evidence state.");
}

async function readData(baseUrl, pathname, label) {
  const result = expectStatus(await http(baseUrl, "GET", pathname, { auth: false }), 200, label);
  assert(result.body?.data, `${label}: response data is missing.`);
  return result.body.data;
}

function assertExactKeys(value, keys, label) {
  assert(value && typeof value === "object" && !Array.isArray(value), `${label} must be a JSON object.`);
  assert(sameStrings(Object.keys(value), keys), `${label} contains unexpected or missing fields.`);
  assert(Buffer.byteLength(JSON.stringify(value), "utf8") <= 16 * 1024, `${label} exceeds the bounded evidence size.`);
}

async function executeFlow(baseUrl, pool, context) {
  const createPath = `/v1/admin/brands/${context.medwayId}/instructors/global`;
  const createBody = { displayName: INSTRUCTOR_NAME, professionalTitle: null, reason: REASON };
  const created = expectMutation(await http(baseUrl, "POST", createPath, { key: "p56-create-instructor-v1", body: createBody }), 201, "create instructor");
  const instructorId = created.data?.instructorId;
  assert(instructorId, "Created instructor ID is missing.");
  let instructor = await readData(baseUrl, `/v1/admin/instructors/${instructorId}`, "read instructor");
  assert(instructor.displayName === INSTRUCTOR_NAME && instructor.professionalTitle === null && instructor.status === "active" && instructor.updatedAt, "Created instructor state is invalid.");
  assert(!Object.hasOwn(instructor, "brandId"), "Global instructor unexpectedly exposes brand ownership.");

  const beforeReplay = await fixtureSnapshot(pool);
  const replay = expectStatus(await http(baseUrl, "POST", createPath, { key: "p56-create-instructor-v1", body: createBody }), 200, "idempotent replay");
  assert(replay.body?.ok === true && replay.body.mutated === false && replay.body.replayed === true && replay.body.data?.instructorId === instructorId, "Idempotent replay envelope is invalid.");
  assert(replay.body.adminActionId === created.adminActionId && replay.body.auditLogId === created.auditLogId, "Idempotent replay evidence IDs changed.");
  assert(JSON.stringify(beforeReplay) === JSON.stringify(await fixtureSnapshot(pool)), "Idempotent replay changed persisted counts.");

  expectStatus(await http(baseUrl, "POST", createPath, { key: "p56-create-instructor-v1", body: { ...createBody, reason: `${REASON} changed` } }), 409, "fingerprint conflict");
  assert(JSON.stringify(beforeReplay) === JSON.stringify(await fixtureSnapshot(pool)), "Fingerprint conflict changed persisted counts.");

  expectMutation(await http(baseUrl, "POST", `/v1/admin/brands/${context.medwayId}/instructors`, { key: "p56-assign-brand-instructor-v1", body: { instructorId, reason: REASON } }), 200, "assign instructor to Medway");
  let brandInstructor = await readData(baseUrl, `/v1/admin/brands/${context.medwayId}/instructors/${instructorId}`, "read Medway instructor association");
  assert(brandInstructor.status === "active" && brandInstructor.brandId === context.medwayId, "Medway instructor association is invalid.");
  expectStatus(await http(baseUrl, "GET", `/v1/admin/brands/${context.eliteId}/instructors/${instructorId}`, { auth: false }), 404, "Elite instructor isolation");

  const courseCreated = expectMutation(await http(baseUrl, "POST", `/v1/admin/brands/${context.medwayId}/courses`, { key: "p56-create-course-v1", body: { courseCode: COURSE_CODE, title: COURSE_TITLE, scope: "standalone", academicModuleId: null, reason: REASON } }), 201, "create course");
  const courseId = courseCreated.data?.courseId;
  assert(courseId, "Created course ID is missing.");
  let course = await readData(baseUrl, `/v1/admin/brands/${context.medwayId}/courses/${courseId}`, "read course");
  assert(course.courseCode === COURSE_CODE && course.title === COURSE_TITLE && course.courseScope === "standalone" && course.academicModuleId === null && course.status === "draft", "Created course state is invalid.");
  expectStatus(await http(baseUrl, "GET", `/v1/admin/brands/${context.eliteId}/courses/${courseId}`, { auth: false }), 404, "Elite course isolation");

  expectMutation(await http(baseUrl, "POST", `/v1/admin/brands/${context.medwayId}/courses/${courseId}/instructors`, { key: "p56-assign-course-instructor-v1", body: { instructorId, reason: REASON } }), 200, "assign instructor to course");
  let assignments = await readData(baseUrl, `/v1/admin/brands/${context.medwayId}/courses/${courseId}/instructors`, "read course instructors");
  assert(Array.isArray(assignments) && assignments.length === 1 && assignments[0].instructorId === instructorId && assignments[0].status === "active", "Course instructor assignment is invalid.");
  let courseInstructor = assignments[0];

  const beforeEliteWrites = await fixtureSnapshot(pool);
  expectStatus(await http(baseUrl, "PATCH", `/v1/admin/brands/${context.eliteId}/instructors/global/${instructorId}/status`, { key: "p56-elite-instructor-v1", body: { status: "inactive", expectedVersion: instructor.updatedAt, reason: REASON } }), [403, 404], "Elite instructor write isolation");
  expectStatus(await http(baseUrl, "PATCH", `/v1/admin/brands/${context.eliteId}/courses/${courseId}/status`, { key: "p56-elite-course-v1", body: { status: "published", expectedVersion: course.updatedAt, reason: REASON } }), [403, 404], "Elite course write isolation");
  expectStatus(await http(baseUrl, "PATCH", `/v1/admin/brands/${context.eliteId}/courses/${courseId}/instructors/${instructorId}/status`, { key: "p56-elite-course-instructor-v1", body: { status: "inactive", expectedVersion: courseInstructor.updatedAt, reason: REASON } }), [403, 404], "Elite course-instructor write isolation");
  assert(JSON.stringify(await fixtureSnapshot(pool)) === JSON.stringify(beforeEliteWrites), "Elite-scoped write attempts changed persisted counts.");

  const staleInstructorVersion = instructor.updatedAt;
  expectMutation(await http(baseUrl, "PATCH", `${createPath}/${instructorId}`, { key: "p56-update-instructor-v1", body: { professionalTitle: INSTRUCTOR_TITLE, expectedVersion: instructor.updatedAt, reason: REASON } }), 200, "update instructor");
  instructor = await readData(baseUrl, `/v1/admin/instructors/${instructorId}`, "read updated instructor");
  assert(instructor.professionalTitle === INSTRUCTOR_TITLE && instructor.updatedAt !== staleInstructorVersion, "Instructor professional title update did not persist with a refreshed version.");
  const beforeStaleVersion = await fixtureSnapshot(pool);
  const currentInstructor = JSON.stringify(instructor);
  expectStatus(await http(baseUrl, "PATCH", `${createPath}/${instructorId}`, { key: "p56-stale-instructor-v1", body: { professionalTitle: "Rejected stale Prompt 56 value", expectedVersion: staleInstructorVersion, reason: REASON } }), 409, "stale instructor expectedVersion");
  instructor = await readData(baseUrl, `/v1/admin/instructors/${instructorId}`, "read instructor after stale-version rejection");
  assert(JSON.stringify(instructor) === currentInstructor && JSON.stringify(await fixtureSnapshot(pool)) === JSON.stringify(beforeStaleVersion), "Stale expectedVersion changed instructor state or evidence counts.");

  expectMutation(await http(baseUrl, "PATCH", `/v1/admin/brands/${context.medwayId}/courses/${courseId}/status`, { key: "p56-publish-course-v1", body: { status: "published", expectedVersion: course.updatedAt, reason: REASON } }), 200, "publish course");
  course = await readData(baseUrl, `/v1/admin/brands/${context.medwayId}/courses/${courseId}`, "read published course");
  assert(course.status === "published", "Course did not publish.");

  expectMutation(await http(baseUrl, "PATCH", `/v1/admin/brands/${context.medwayId}/courses/${courseId}/status`, { key: "p56-archive-course-v1", body: { status: "archived", expectedVersion: course.updatedAt, reason: REASON } }), 200, "archive course");
  course = await readData(baseUrl, `/v1/admin/brands/${context.medwayId}/courses/${courseId}`, "read archived course");
  assert(course.status === "archived", "Course did not archive.");
  const beforeRejection = await fixtureSnapshot(pool);
  expectStatus(await http(baseUrl, "PATCH", `/v1/admin/brands/${context.medwayId}/courses/${courseId}/status`, { key: "p56-republish-archived-course-v1", body: { status: "published", expectedVersion: course.updatedAt, reason: REASON } }), 400, "archived course republish rejection");
  const rejectedCourse = await readData(baseUrl, `/v1/admin/brands/${context.medwayId}/courses/${courseId}`, "read course after lifecycle rejection");
  assert(rejectedCourse.status === "archived" && JSON.stringify(beforeRejection) === JSON.stringify(await fixtureSnapshot(pool)), "Lifecycle rejection changed course state or persisted counts.");

  expectMutation(await http(baseUrl, "PATCH", `/v1/admin/brands/${context.medwayId}/courses/${courseId}/instructors/${instructorId}/status`, { key: "p56-inactivate-course-instructor-v1", body: { status: "inactive", expectedVersion: courseInstructor.updatedAt, reason: REASON } }), 200, "inactivate course instructor");
  assignments = await readData(baseUrl, `/v1/admin/brands/${context.medwayId}/courses/${courseId}/instructors`, "read inactive course instructor");
  courseInstructor = assignments[0];
  assert(assignments.length === 1 && courseInstructor.status === "inactive", "Course instructor final state is invalid.");

  expectMutation(await http(baseUrl, "PATCH", `/v1/admin/brands/${context.medwayId}/instructors/${instructorId}/status`, { key: "p56-inactivate-brand-instructor-v1", body: { status: "inactive", expectedVersion: brandInstructor.updatedAt, reason: REASON } }), 200, "inactivate brand instructor");
  brandInstructor = await readData(baseUrl, `/v1/admin/brands/${context.medwayId}/instructors/${instructorId}`, "read inactive brand instructor");
  assert(brandInstructor.status === "inactive", "Brand instructor final state is invalid.");

  expectMutation(await http(baseUrl, "PATCH", `${createPath}/${instructorId}/status`, { key: "p56-inactivate-instructor-v1", body: { status: "inactive", expectedVersion: instructor.updatedAt, reason: REASON } }), 200, "inactivate instructor");
  instructor = await readData(baseUrl, `/v1/admin/instructors/${instructorId}`, "read inactive instructor");
  assert(instructor.status === "inactive", "Instructor final state is invalid.");

  return { instructorId, brandInstructorId: brandInstructor.id, courseId, courseInstructorId: courseInstructor.id };
}

async function verifyEvidence(pool, context, ids) {
  const rows = await selectRows(pool, "evidence", `select aa.id as action_id, al.id as audit_id, aa.brand_id, aa.admin_profile_id,
    aa.command_name, al.action as audit_action, aa.target_type, aa.target_id, al.brand_id as audit_brand_id,
    al.admin_profile_id as audit_admin_profile_id, al.target_type as audit_target_type, al.target_id as audit_target_id,
    aa.reason, al.reason as audit_reason,
    aa.correlation_id, al.correlation_id as audit_correlation_id, aa.request_id, aa.idempotency_key,
    al.idempotency_key as audit_idempotency_key, aa.command_fingerprint, aa.expected_version,
    aa.outcome as action_outcome, al.outcome as audit_outcome, aa.result_summary, aa.metadata as action_metadata,
    al.before_summary, al.after_summary, al.metadata as audit_metadata
    from app.admin_actions aa left join app.audit_logs al on al.admin_action_id = aa.id
    where aa.idempotency_key = any($1::text[]) order by aa.created_at, aa.id`, [evidencePlan.map(([key]) => key)]);
  assert(rows.length === evidencePlan.length, "Prompt 56 action evidence count is not exactly 10.");
  const targetIds = { instructor: ids.instructorId, brand_instructor: ids.brandInstructorId, brand_course: ids.courseId, course_instructor: ids.courseInstructorId };
  const resultKeys = {
    instructor: ["instructorId"], brand_instructor: ["brandId", "instructorId"],
    brand_course: ["brandId", "courseId"], course_instructor: ["brandId", "courseId", "instructorId"],
  };
  const summaryKeys = {
    instructor: ["id", "displayName", "professionalTitle", "status"],
    brand_instructor: ["id", "brandId", "instructorId", "status"],
    brand_course: ["id", "brandId", "academicModuleId", "courseCode", "title", "courseScope", "status"],
    course_instructor: ["id", "brandId", "courseId", "instructorId", "status"],
  };
  for (const [key, commandName, targetType] of evidencePlan) {
    const row = rows.find((candidate) => candidate.idempotency_key === key);
    assert(row, `Evidence is missing for ${key}.`);
    assert(row.audit_id && row.brand_id === context.medwayId && row.admin_profile_id === context.adminProfileId && row.audit_brand_id === context.medwayId && row.audit_admin_profile_id === context.adminProfileId, `Evidence authority mismatch for ${key}.`);
    assert(row.command_name === commandName && row.audit_action === commandName && row.target_type === targetType && row.audit_target_type === targetType && row.target_id === targetIds[targetType] && row.audit_target_id === targetIds[targetType], `Evidence target mismatch for ${key}.`);
    assert(row.reason === REASON && row.audit_reason === REASON && row.action_outcome === "succeeded" && row.audit_outcome === "succeeded", `Evidence outcome mismatch for ${key}.`);
    assert(row.audit_idempotency_key === key && row.correlation_id && row.audit_correlation_id === row.correlation_id && row.request_id, `Evidence request identity mismatch for ${key}.`);
    assert(/^v1:sha256:[0-9a-f]{64}$/.test(row.command_fingerprint), `Evidence fingerprint mismatch for ${key}.`);
    assertExactKeys(row.result_summary, resultKeys[targetType], `${key} result summary`);
    assertExactKeys(row.after_summary, summaryKeys[targetType], `${key} after summary`);
    assertExactKeys(row.action_metadata, ["fingerprintVersion", "commandVersion"], `${key} action metadata`);
    assertExactKeys(row.audit_metadata, ["fingerprintVersion", "commandVersion"], `${key} audit metadata`);
    assert(row.action_metadata.fingerprintVersion === "v1" && row.action_metadata.commandVersion === "v1" && row.audit_metadata.fingerprintVersion === "v1" && row.audit_metadata.commandVersion === "v1", `Evidence metadata mismatch for ${key}.`);
    const serialized = JSON.stringify([row.result_summary, row.action_metadata, row.before_summary, row.after_summary, row.audit_metadata]);
    assert(!/(authorization|bearer|jwt|session[_ -]?token|password|database[_ -]?url|connection[_ -]?string|credential|certificate|ca[_ -]?path|raw[_ -]?(request|body)|provider|stack[_ -]?trace|protected[_ -]?media|payment[_ -]?secret)/i.test(serialized), `Sensitive evidence field detected for ${key}.`);
    if (["p56-create-instructor-v1", "p56-assign-brand-instructor-v1", "p56-create-course-v1", "p56-assign-course-instructor-v1"].includes(key)) assert(row.before_summary === null, `Create evidence before-summary mismatch for ${key}.`);
    else assertExactKeys(row.before_summary, summaryKeys[targetType], `${key} before summary`);
    if (key === "p56-create-instructor-v1") assert(row.after_summary.displayName === INSTRUCTOR_NAME && row.after_summary.professionalTitle === null && row.after_summary.status === "active", "Instructor create evidence semantics are invalid.");
    if (key === "p56-update-instructor-v1") assert(row.before_summary.professionalTitle === null && row.after_summary.professionalTitle === INSTRUCTOR_TITLE && row.before_summary.status === "active" && row.after_summary.status === "active", "Instructor update evidence semantics are invalid.");
    if (key === "p56-create-course-v1") assert(row.after_summary.courseCode === COURSE_CODE && row.after_summary.title === COURSE_TITLE && row.after_summary.courseScope === "standalone" && row.after_summary.academicModuleId === null && row.after_summary.status === "draft", "Course create evidence semantics are invalid.");
    if (key === "p56-publish-course-v1") assert(row.before_summary.status === "draft" && row.after_summary.status === "published", "Course publish evidence semantics are invalid.");
    if (key === "p56-archive-course-v1") assert(row.before_summary.status === "published" && row.after_summary.status === "archived", "Course archive evidence semantics are invalid.");
    if (["p56-inactivate-course-instructor-v1", "p56-inactivate-brand-instructor-v1", "p56-inactivate-instructor-v1"].includes(key)) assert(row.before_summary.status === "active" && row.after_summary.status === "inactive", `Inactive transition evidence semantics are invalid for ${key}.`);
  }
  const audits = await selectRows(pool, "audit-count", "select count(*)::int as count from app.audit_logs where idempotency_key = any($1::text[])", [evidencePlan.map(([key]) => key)]);
  assert(count(audits[0]) === 10, "Prompt 56 audit evidence count is not exactly 10.");
  const unmatched = await selectRows(pool, "unmatched-evidence", `select
    (select count(*)::int from app.admin_actions aa left join app.audit_logs al on al.admin_action_id = aa.id where aa.idempotency_key like 'p56-%' and al.id is null) as actions_without_audit,
    (select count(*)::int from app.audit_logs al left join app.admin_actions aa on aa.id = al.admin_action_id where al.idempotency_key like 'p56-%' and aa.id is null) as audits_without_action`);
  assert(count(unmatched[0], "actions_without_audit") === 0 && count(unmatched[0], "audits_without_action") === 0, "M4 one-to-one evidence verification failed.");
  const rejected = await selectRows(pool, "rejected-evidence", `select
    (select count(*)::int from app.admin_actions where idempotency_key = any($1::text[])) as actions,
    (select count(*)::int from app.audit_logs where idempotency_key = any($1::text[])) as audits`, [rejectedEvidenceKeys]);
  assert(count(rejected[0], "actions") === 0 && count(rejected[0], "audits") === 0, "Rejected requests incorrectly created M4 evidence.");
}

async function verifyFinal(baseUrl, pool, context, ids) {
  const snapshot = await fixtureSnapshot(pool);
  assert(snapshot.instructors === 1 && snapshot.brandInstructors === 1 && snapshot.courses === 1 && snapshot.courseInstructors === 1 && snapshot.actions === 10 && snapshot.audits === 10, "Final Prompt 56 fixture counts are invalid.");
  const rows = await selectRows(pool, "final-fixtures", `select
    (select row_to_json(i) from (select id, display_name as "displayName", professional_title as "professionalTitle", status from app.instructors where id = $1) i) as instructor,
    (select row_to_json(bi) from (select id, brand_id as "brandId", instructor_id as "instructorId", status from app.brand_instructors where id = $4 and brand_id = $2 and instructor_id = $1) bi) as brand_instructor,
    (select row_to_json(bc) from (select id, brand_id as "brandId", academic_module_id as "academicModuleId", course_code as "courseCode", title, course_scope as "courseScope", status from app.brand_courses where id = $3 and brand_id = $2) bc) as course,
    (select row_to_json(ci) from (select id, brand_id as "brandId", course_id as "courseId", instructor_id as "instructorId", status from app.course_instructors where id = $5 and brand_id = $2 and course_id = $3 and instructor_id = $1) ci) as course_instructor,
    (select count(*)::int from app.brand_instructors where brand_id = $6 and instructor_id = $1) as elite_associations,
    (select count(*)::int from app.brand_courses where brand_id = $6 and (course_code = $7 or title = $8)) as elite_courses,
    (select count(*)::int from app.course_instructors where brand_id = $6 and (course_id = $3 or instructor_id = $1)) as elite_course_instructors`, [ids.instructorId, context.medwayId, ids.courseId, ids.brandInstructorId, ids.courseInstructorId, context.eliteId, COURSE_CODE, COURSE_TITLE]);
  const row = rows[0];
  assert(row.instructor?.id === ids.instructorId && row.instructor.displayName === INSTRUCTOR_NAME && row.instructor.professionalTitle === INSTRUCTOR_TITLE && row.instructor.status === "inactive", "Final instructor state is invalid.");
  assert(row.brand_instructor?.id === ids.brandInstructorId && row.brand_instructor.brandId === context.medwayId && row.brand_instructor.instructorId === ids.instructorId && row.brand_instructor.status === "inactive", "Final brand-instructor state is invalid.");
  assert(row.course?.id === ids.courseId && row.course.brandId === context.medwayId && row.course.academicModuleId === null && row.course.courseCode === COURSE_CODE && row.course.title === COURSE_TITLE && row.course.courseScope === "standalone" && row.course.status === "archived", "Final course state is invalid.");
  assert(row.course_instructor?.id === ids.courseInstructorId && row.course_instructor.brandId === context.medwayId && row.course_instructor.courseId === ids.courseId && row.course_instructor.instructorId === ids.instructorId && row.course_instructor.status === "inactive", "Final course-instructor state is invalid.");
  assert(count(row, "elite_associations") === 0 && count(row, "elite_courses") === 0 && count(row, "elite_course_instructors") === 0, "Final Elite isolation state is invalid.");

  const [httpInstructor, httpBrandInstructor, httpCourse, httpCourseInstructors] = await Promise.all([
    readData(baseUrl, `/v1/admin/instructors/${ids.instructorId}`, "final HTTP instructor read"),
    readData(baseUrl, `/v1/admin/brands/${context.medwayId}/instructors/${ids.instructorId}`, "final HTTP brand-instructor read"),
    readData(baseUrl, `/v1/admin/brands/${context.medwayId}/courses/${ids.courseId}`, "final HTTP course read"),
    readData(baseUrl, `/v1/admin/brands/${context.medwayId}/courses/${ids.courseId}/instructors`, "final HTTP course-instructor read"),
  ]);
  const httpCourseInstructor = Array.isArray(httpCourseInstructors) ? httpCourseInstructors.find((item) => item.id === ids.courseInstructorId) : undefined;
  assert(httpCourseInstructor, "Final HTTP course-instructor row is missing.");
  for (const [label, direct, overHttp] of [["instructor", row.instructor, httpInstructor], ["brand instructor", row.brand_instructor, httpBrandInstructor], ["course", row.course, httpCourse], ["course instructor", row.course_instructor, httpCourseInstructor]]) {
    for (const [key, value] of Object.entries(direct)) assert(overHttp[key] === value, `Final ${label} HTTP/SELECT parity failed for ${key}.`);
  }

  const afterBrands = await selectRows(pool, "final-brand-snapshot", "select id, code, name, slug, status, created_at, updated_at from app.educational_brands where id = any($1::uuid[]) order by code", [[context.medwayId, context.eliteId]]);
  const afterAuthority = await authoritySnapshot(pool, context.medwayId, context.eliteId);
  const afterCatalogue = await permissionCatalogueSnapshot(pool);
  const afterSchema = await schemaSnapshot(pool);
  const afterFoundation = await foundationSnapshot(pool);
  assert(JSON.stringify(context.immutable.brands) === JSON.stringify(afterBrands), "Medway/Elite foundation regression detected.");
  assert(JSON.stringify(context.immutable.authority) === JSON.stringify(afterAuthority), "Prompt 56A authority fixture regression detected.");
  assert(JSON.stringify(context.immutable.catalogue) === JSON.stringify(afterCatalogue), "Prompt 56B permission catalogue regression detected.");
  assert(JSON.stringify(context.immutable.schema) === JSON.stringify(afterSchema), "Schema/RLS/policy/privilege regression detected.");
  assert(JSON.stringify(context.immutable.foundation) === JSON.stringify(afterFoundation), "Curriculum regression detected.");
  assert(afterFoundation.levels === 5 && afterFoundation.semesters === 10 && afterFoundation.modules === 60 && afterFoundation.deferredModules === 0, "Curriculum acceptance check failed.");
}

function cleanupEnvironment(environment) {
  for (const key of ["ADMIN_M2_STAGING_WRITE_VERIFY", "ADMIN_P56_TARGET_ENVIRONMENT", "SUPABASE_PROJECT_REF", "SUPABASE_DB_URL", "PGSSLROOTCERT", "NODE_EXTRA_CA_CERTS", "ADMIN_RUNTIME_MODE", "PERSISTENCE_PROVIDER", "AUTH_PROVIDER", "ADMIN_READ_MODEL_SOURCE", "ADMIN_M2_READ_MODEL_SOURCE", "ADMIN_COMMAND_SOURCE", "API_HOST", "API_PORT", "ADMIN_MOCK_BEARER_TOKEN"]) {
    delete environment[key];
    delete process.env[key];
  }
}

async function main() {
  const environment = loadEnvironment();
  let pool;
  let child;
  let mutationStarted = false;
  try {
    if (environment.ADMIN_M2_STAGING_WRITE_VERIFY !== "true") {
      console.log("Prompt 56 staging verification skipped: ADMIN_M2_STAGING_WRITE_VERIFY is not true.");
      return;
    }
    const validated = validateEnvironment(environment);
    pool = await openSelectPool(environment, validated.target, validated.caPath);
    const context = await preflight(pool);
    const port = await reservePort();
    const baseUrl = `http://${HOST}:${port}`;
    child = spawn(process.execPath, ["dist/main.js"], {
      cwd: apiDirectory,
      windowsHide: true,
      stdio: ["ignore", "ignore", "ignore"],
      env: {
        ...environment, ...validated.child, NODE_ENV: "test", API_HOST: HOST, API_PORT: String(port),
        NODE_EXTRA_CA_CERTS: validated.caPath,
      },
    });
    await waitForApi(child, baseUrl);
    await baselineAndNegatives(baseUrl, pool, context);
    mutationStarted = true;
    const ids = await executeFlow(baseUrl, pool, context);
    await verifyEvidence(pool, context, ids);
    await verifyFinal(baseUrl, pool, context, ids);
    console.log(`Prompt 56 staging verification passed: project_ref=${PROJECT_REF} environment=${ENVIRONMENT} mutations=10 admin_actions=10 audit_logs=10.`);
    console.log(`Prompt 56 fixture IDs: instructor=${ids.instructorId} brand_instructor=${ids.brandInstructorId} course=${ids.courseId} course_instructor=${ids.courseInstructorId}.`);
  } catch (error) {
    if (pool && mutationStarted) {
      try {
        const state = await fixtureSnapshot(pool);
        console.error(`Prompt 56 read-only failure classification: instructors=${state.instructors} brand_instructors=${state.brandInstructors} courses=${state.courses} course_instructors=${state.courseInstructors} admin_actions=${state.actions} audit_logs=${state.audits}.`);
      } catch {
        console.error("Prompt 56 read-only failure classification was unavailable.");
      }
    }
    throw error;
  } finally {
    await stopApi(child);
    if (pool) await pool.end();
    cleanupEnvironment(environment);
  }
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : "Unexpected verification failure.";
  console.error(`Prompt 56 staging verification failed: ${message}`);
  process.exitCode = 1;
});
