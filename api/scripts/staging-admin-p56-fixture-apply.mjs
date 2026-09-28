import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const PROJECT_REF = "mgrsgibxuwgbxtdqprkw";
const TARGET_ENVIRONMENT = "staging";
const DATABASE = "postgres";
const MEDWAY_ID = "37cb02d5-b44f-5c74-9768-077d1a187ead";
const ELITE_ID = "ad255057-2e07-56af-b999-fd935cb6e7d6";
const AUTH_ID = "02694d40-9dec-5f53-a613-6fb946a2b0fa";
const APP_USER_ID = "c3214c3c-349f-512c-8917-4053c19428a5";
const ADMIN_PROFILE_ID = "ec1b84ae-bd54-57ba-9b38-0c88735f33af";
const ROLE_ID = "d5443433-a172-5bf7-a628-08cb4b992a63";
const ASSIGNMENT_ID = "4977dd88-9e0f-5a81-8d84-458e74481aac";
const ROLE_CODE = "staging_verify_m2_admin";
const UUID_NAMESPACE = "6ba7b810-9dad-11d1-80b4-00c04fd430c8";
const UUID_INPUT_PREFIX = "elearning.verification.staging.p56.v1/";
const apiDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const fixturePath = path.join(apiDirectory, "db", "seed-drafts", "verification", "001_staging_admin_p56_verification_fixture.sql");

const requiredPermissions = Object.freeze([
  "admin.brand_courses.create",
  "admin.brand_courses.update",
  "admin.brand_instructors.assign",
  "admin.brand_instructors.update",
  "admin.course_instructors.assign",
  "admin.course_instructors.update",
  "admin.instructors.create",
  "admin.instructors.update",
]);

const requiredPermissionIds = Object.freeze({
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
  "admin_permissions", "admin_profiles", "admin_role_assignments", "admin_role_permissions",
  "admin_roles", "app_users", "educational_brands",
]);

const expectedConstraints = Object.freeze([
  "admin_permissions_code_key", "admin_permissions_pkey", "admin_permissions_status_check",
  "admin_profiles_app_user_id_fkey", "admin_profiles_brand_app_user_key", "admin_profiles_brand_id_fkey", "admin_profiles_id_brand_key", "admin_profiles_pkey", "admin_profiles_status_check",
  "admin_role_assignments_assigner_brand_fkey", "admin_role_assignments_brand_id_fkey", "admin_role_assignments_pkey",
  "admin_role_assignments_profile_brand_fkey", "admin_role_assignments_role_brand_fkey",
  "admin_role_assignments_status_check", "admin_role_permissions_permission_id_fkey", "admin_role_permissions_pkey", "admin_role_permissions_role_id_fkey",
  "admin_roles_brand_code_key", "admin_roles_brand_id_fkey", "admin_roles_id_brand_key", "admin_roles_pkey", "admin_roles_status_check",
  "app_users_auth_user_id_key", "app_users_pkey", "app_users_status_check",
  "educational_brands_code_format_check", "educational_brands_code_key", "educational_brands_pkey", "educational_brands_slug_key", "educational_brands_status_check",
]);

const expectedColumns = Object.freeze({
  educational_brands: ["id:uuid:NO", "code:text:NO", "name:text:NO", "slug:text:NO", "status:text:NO", "created_at:timestamp with time zone:NO", "updated_at:timestamp with time zone:NO"],
  app_users: ["id:uuid:NO", "auth_user_id:uuid:NO", "primary_email:text:YES", "primary_phone:text:YES", "status:text:NO", "created_at:timestamp with time zone:NO", "updated_at:timestamp with time zone:NO"],
  admin_profiles: ["id:uuid:NO", "brand_id:uuid:NO", "app_user_id:uuid:NO", "display_name:text:NO", "status:text:NO", "created_at:timestamp with time zone:NO", "updated_at:timestamp with time zone:NO"],
  admin_permissions: ["id:uuid:NO", "code:text:NO", "category:text:NO", "description:text:YES", "status:text:NO", "created_at:timestamp with time zone:NO", "updated_at:timestamp with time zone:NO"],
  admin_roles: ["id:uuid:NO", "brand_id:uuid:NO", "code:text:NO", "name:text:NO", "description:text:YES", "status:text:NO", "created_at:timestamp with time zone:NO", "updated_at:timestamp with time zone:NO"],
  admin_role_permissions: ["role_id:uuid:NO", "permission_id:uuid:NO", "created_at:timestamp with time zone:NO"],
  admin_role_assignments: ["id:uuid:NO", "brand_id:uuid:NO", "admin_profile_id:uuid:NO", "role_id:uuid:NO", "assigned_by_admin_profile_id:uuid:YES", "assigned_at:timestamp with time zone:NO", "revoked_at:timestamp with time zone:YES", "status:text:NO", "created_at:timestamp with time zone:NO", "updated_at:timestamp with time zone:NO"],
});

function assert(value, message) { if (!value) throw new Error(message); }

function uuidBytes(value) { return Buffer.from(value.replaceAll("-", ""), "hex"); }

function uuidV5(value) {
  const bytes = createHash("sha1").update(uuidBytes(UUID_NAMESPACE)).update(value).digest();
  bytes[6] = (bytes[6] & 0x0f) | 0x50;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = bytes.subarray(0, 16).toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function validateDeterministicIds() {
  const expected = [
    ["auth-identity", AUTH_ID],
    ["app-user", APP_USER_ID],
    ["admin-profile-medway", ADMIN_PROFILE_ID],
    ["admin-role-medway-m2", ROLE_ID],
    ["admin-role-assignment-medway-m2", ASSIGNMENT_ID],
  ];
  for (const [name, id] of expected) assert(uuidV5(`${UUID_INPUT_PREFIX}${name}`) === id, `Deterministic UUID mismatch for ${name}.`);
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
  assert(environment.ADMIN_P56_STAGING_FIXTURE_APPLY === "true", "Explicit Prompt 56A fixture-apply gate is not enabled.");
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
    application_name: "elearning-p56a-fixture-apply",
  });
}

function number(row, key = "count") {
  const value = Number(row?.[key]);
  assert(Number.isSafeInteger(value) && value >= 0, `Invalid count for ${key}.`);
  return value;
}

function sameStrings(actual, expected) {
  return JSON.stringify([...actual].sort()) === JSON.stringify([...expected].sort());
}

function validateFixtureSql(sql) {
  const statements = sql.replace(/^\s*--.*$/gm, "").split(";").map((value) => value.trim()).filter(Boolean);
  const allowedTargets = ["app.app_users", "app.admin_profiles", "app.admin_roles", "app.admin_role_permissions", "app.admin_role_assignments"];
  assert(statements.length === 5, "Fixture artifact must contain exactly five statements.");
  assert(statements.every((statement, index) => new RegExp(`^insert\\s+into\\s+${allowedTargets[index].replace(".", "\\.")}\\b`, "i").test(statement)), "Fixture INSERT order or target is unauthorized.");
  assert(!/\b(update|delete|alter|drop|create|truncate|grant|revoke)\s+(table|schema|role|policy|on|from|app\.)/i.test(sql), "Fixture artifact contains an unauthorized operation.");
  assert(!/app\.(instructors|brand_instructors|brand_courses|course_instructors|admin_actions|audit_logs|academic_levels|academic_semesters|academic_modules)\b/i.test(sql), "Fixture artifact references M2, M4, or curriculum data.");
  for (const value of [AUTH_ID, APP_USER_ID, ADMIN_PROFILE_ID, ROLE_ID, ASSIGNMENT_ID, MEDWAY_ID, ROLE_CODE, ...requiredPermissions]) {
    assert(sql.includes(value), `Fixture artifact is missing controlled value ${value}.`);
  }
}

async function queryRows(client, text, values = []) { return (await client.query(text, values)).rows; }

async function schemaSnapshot(client) {
  const rows = await queryRows(client, `select
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
    tables: number(row, "tables"), constraints: number(row, "constraints"), indexes: number(row, "indexes"), triggers: number(row, "triggers"),
    policies: number(row, "policies"), rlsTables: number(row, "rls_tables"), anonSchemaUsage: row.anon_schema_usage,
    authenticatedSchemaUsage: row.authenticated_schema_usage, publicTableGrants: number(row, "public_table_grants"),
  };
}

async function protectedDataSnapshot(client) {
  const rows = await queryRows(client, `select
    (select count(*)::int from app.instructors where display_name = '__STAGING_VERIFY_P56_INSTRUCTOR__') as instructors,
    (select count(*)::int from app.brand_instructors bi join app.instructors i on i.id = bi.instructor_id where i.display_name = '__STAGING_VERIFY_P56_INSTRUCTOR__') as brand_instructors,
    (select count(*)::int from app.brand_courses where course_code = 'VERIFY_P56_M2' or title = '__STAGING_VERIFY_P56_COURSE__') as courses,
    (select count(*)::int from app.course_instructors ci join app.brand_courses bc on bc.id = ci.course_id where bc.course_code = 'VERIFY_P56_M2' or bc.title = '__STAGING_VERIFY_P56_COURSE__') as course_instructors,
    (select count(*)::int from app.admin_actions where idempotency_key like 'p56-%') as actions,
    (select count(*)::int from app.audit_logs where idempotency_key like 'p56-%') as audits,
    (select count(*)::int from app.academic_levels) as levels,
    (select count(*)::int from app.academic_semesters) as semesters,
    (select count(*)::int from app.academic_modules) as modules,
    (select count(*)::int from app.academic_modules where module_code in ('PDM1105', '1105 PMD')) as deferred_modules`);
  const row = rows[0];
  return {
    instructors: number(row, "instructors"), brandInstructors: number(row, "brand_instructors"), courses: number(row, "courses"), courseInstructors: number(row, "course_instructors"),
    actions: number(row, "actions"), audits: number(row, "audits"),
    levels: number(row, "levels"), semesters: number(row, "semesters"), modules: number(row, "modules"), deferredModules: number(row, "deferred_modules"),
  };
}

async function verifyLiveM1Shape(client) {
  const columns = await queryRows(client, `select table_name, column_name, data_type, is_nullable from information_schema.columns
    where table_schema = 'app' and table_name = any($1::text[]) order by table_name, ordinal_position`, [expectedTables]);
  for (const table of expectedTables) {
    const actual = columns.filter((row) => row.table_name === table).map((row) => `${row.column_name}:${row.data_type}:${row.is_nullable}`);
    assert(JSON.stringify(actual) === JSON.stringify(expectedColumns[table]), `Live M1 column shape differs for ${table}.`);
  }
  const constraints = await queryRows(client, `select c.conname from pg_constraint c join pg_class t on t.oid = c.conrelid join pg_namespace n on n.oid = t.relnamespace
    where n.nspname = 'app' and t.relname = any($1::text[]) order by c.conname`, [expectedTables]);
  assert(sameStrings(constraints.map((row) => row.conname), expectedConstraints), "Live M1 constraints differ from the reviewed schema.");
}

async function permissionCatalogueSnapshot(client) {
  const permissions = await queryRows(client, "select id, code, category, description, status from app.admin_permissions where code = any($1::text[]) order by code", [requiredPermissions]);
  assert(permissions.length === 8, "Required Prompt 56B permission catalogue is incomplete or duplicated.");
  for (const row of permissions) {
    assert(requiredPermissionIds[row.code] === row.id && row.status === "active", `Required permission definition is incompatible: ${row.code}.`);
  }
  assert(sameStrings(permissions.map((row) => row.code), requiredPermissions), "Required permission codes were substituted.");
  return permissions;
}

async function foundationSnapshot(client) {
  return queryRows(client, "select id, code, name, slug, status, created_at, updated_at from app.educational_brands where code in ('medway', 'elite') order by code");
}

async function inspectFixture(client) {
  const appUsers = await queryRows(client, "select id, auth_user_id, primary_email, primary_phone, status from app.app_users where id = $1 or auth_user_id = $2", [APP_USER_ID, AUTH_ID]);
  const profiles = await queryRows(client, "select id, brand_id, app_user_id, display_name, status from app.admin_profiles where id = $1 or (brand_id = $2 and app_user_id = $3)", [ADMIN_PROFILE_ID, MEDWAY_ID, APP_USER_ID]);
  const roles = await queryRows(client, "select id, brand_id, code, name, description, status from app.admin_roles where id = $1 or (brand_id = $2 and code = $3)", [ROLE_ID, MEDWAY_ID, ROLE_CODE]);
  const assignments = await queryRows(client, "select id, brand_id, admin_profile_id, role_id, assigned_by_admin_profile_id, status from app.admin_role_assignments where id = $1 or (brand_id = $2 and admin_profile_id = $3 and role_id = $4)", [ASSIGNMENT_ID, MEDWAY_ID, ADMIN_PROFILE_ID, ROLE_ID]);
  const permissionRows = await queryRows(client, `select p.id, p.code, p.status from app.admin_role_permissions rp join app.admin_permissions p on p.id = rp.permission_id where rp.role_id = $1 order by p.code`, [ROLE_ID]);
  const appUserExact = appUsers.length === 1 && appUsers[0].id === APP_USER_ID && appUsers[0].auth_user_id === AUTH_ID && appUsers[0].primary_email === null && appUsers[0].primary_phone === null && appUsers[0].status === "active";
  const profileExact = profiles.length === 1 && profiles[0].id === ADMIN_PROFILE_ID && profiles[0].brand_id === MEDWAY_ID && profiles[0].app_user_id === APP_USER_ID && profiles[0].display_name === "__STAGING_VERIFY_ADMIN_P56__" && profiles[0].status === "active";
  const roleExact = roles.length === 1 && roles[0].id === ROLE_ID && roles[0].brand_id === MEDWAY_ID && roles[0].code === ROLE_CODE && roles[0].name === "__STAGING_VERIFY_M2_ADMIN__" && roles[0].description === "Prompt 56 staging-only M2 verification authority" && roles[0].status === "active";
  const assignmentExact = assignments.length === 1 && assignments[0].id === ASSIGNMENT_ID && assignments[0].brand_id === MEDWAY_ID && assignments[0].admin_profile_id === ADMIN_PROFILE_ID && assignments[0].role_id === ROLE_ID && assignments[0].assigned_by_admin_profile_id === null && assignments[0].status === "active";
  const classifyOne = (values, exact) => values.length === 0 ? "absent" : exact ? "exact_existing" : "conflict";
  const rolePermissionCodes = permissionRows.map((row) => row.code);
  const extraRolePermissions = rolePermissionCodes.filter((code) => !requiredPermissions.includes(code));
  const rolePermissionClassifications = Object.fromEntries(requiredPermissions.map((code) => [code, rolePermissionCodes.includes(code) ? "exact_existing" : "absent"]));
  const components = {
    appUser: classifyOne(appUsers, appUserExact),
    adminProfile: classifyOne(profiles, profileExact),
    role: classifyOne(roles, roleExact),
    assignment: classifyOne(assignments, assignmentExact),
  };
  const conflict = Object.values(components).includes("conflict") || extraRolePermissions.length > 0 || permissionRows.some((row) => row.status !== "active");
  const exact = Object.values(components).every((value) => value === "exact_existing") && Object.values(rolePermissionClassifications).every((value) => value === "exact_existing");
  const absent = Object.values(components).every((value) => value === "absent") && permissionRows.length === 0;
  return {
    classification: conflict ? "conflict" : exact ? "exact_existing" : absent ? "absent" : "partial_compatible",
    components, rolePermissionClassifications, rolePermissionCount: permissionRows.length, extraRolePermissions,
  };
}

async function authorizationProjection(client, brandId, expected) {
  const rows = await queryRows(client, `select au.id as app_user_id, au.auth_user_id, au.status as app_user_status,
    ap.id as admin_profile_id, ap.brand_id, ap.display_name, ap.status as admin_profile_status,
    coalesce(array_agg(distinct r.code) filter (where ara.status = 'active' and r.status = 'active'), array[]::text[]) as role_codes,
    coalesce(array_agg(distinct p.code) filter (where ara.status = 'active' and r.status = 'active' and p.status = 'active'), array[]::text[]) as permission_codes
    from app.app_users au
    join app.admin_profiles ap on ap.app_user_id = au.id
    left join app.admin_role_assignments ara on ara.admin_profile_id = ap.id and ara.brand_id = ap.brand_id
    left join app.admin_roles r on r.id = ara.role_id and r.brand_id = ap.brand_id
    left join app.admin_role_permissions rp on rp.role_id = r.id
    left join app.admin_permissions p on p.id = rp.permission_id
    where au.auth_user_id = $1 and ap.brand_id = $2
    group by au.id, au.auth_user_id, au.status, ap.id, ap.brand_id, ap.display_name, ap.status`, [AUTH_ID, brandId]);
  if (!expected) {
    assert(rows.length === 0, "Authorization projection unexpectedly resolved non-Medway authority.");
    return null;
  }
  assert(rows.length === 1, "Authorization projection did not resolve exactly one Medway Admin.");
  const row = rows[0];
  assert(row.app_user_id === APP_USER_ID && row.auth_user_id === AUTH_ID && row.app_user_status === "active", "Authorization app-user projection is invalid.");
  assert(row.admin_profile_id === ADMIN_PROFILE_ID && row.brand_id === brandId && row.admin_profile_status === "active", "Authorization profile projection is invalid.");
  assert(sameStrings(row.role_codes, [ROLE_CODE]) && sameStrings(row.permission_codes, requiredPermissions), "Authorization role or permission projection is broader than approved.");
  return row;
}

async function preflight(client) {
  const database = await queryRows(client, "select current_database() as database_name");
  assert(database[0]?.database_name === DATABASE, "Connected database identity is not approved.");
  const schemaPresence = await queryRows(client, "select exists(select 1 from pg_namespace where nspname = 'app') as exists");
  assert(schemaPresence[0]?.exists === true, "Private app schema is missing.");
  await verifyLiveM1Shape(client);
  const brands = await foundationSnapshot(client);
  assert(brands.length === 2 && brands.find((row) => row.code === "medway")?.id === MEDWAY_ID && brands.find((row) => row.code === "elite")?.id === ELITE_ID && brands.every((row) => row.status === "active"), "Foundation brand state is invalid.");
  const tables = await queryRows(client, "select table_name from information_schema.tables where table_schema = 'app' and table_name = any($1::text[]) order by table_name", [expectedTables]);
  assert(sameStrings(tables.map((row) => row.table_name), expectedTables), "Required M1 tables are missing.");
  const permissions = await permissionCatalogueSnapshot(client);
  const elite = await queryRows(client, `select
    (select count(*)::int from app.admin_profiles where brand_id = $1 and app_user_id = $2) as profiles,
    (select count(*)::int from app.admin_role_assignments where brand_id = $1 and admin_profile_id = $3) as assignments`, [ELITE_ID, APP_USER_ID, ADMIN_PROFILE_ID]);
  assert(number(elite[0], "profiles") === 0 && number(elite[0], "assignments") === 0, "Verification identity has unexpected Elite authority.");
  const protectedData = await protectedDataSnapshot(client);
  assert(protectedData.instructors === 0 && protectedData.brandInstructors === 0 && protectedData.courses === 0 && protectedData.courseInstructors === 0 && protectedData.actions === 0 && protectedData.audits === 0, "Prompt 56 M2/M4 fixture state is not empty.");
  assert(protectedData.levels === 5 && protectedData.semesters === 10 && protectedData.modules === 60 && protectedData.deferredModules === 0, "Curriculum foundation state is invalid.");
  const fixture = await inspectFixture(client);
  assert(fixture.classification !== "conflict", "Verification fixture state conflicts with deterministic IDs or natural keys.");
  const schema = await schemaSnapshot(client);
  assert(schema.anonSchemaUsage === false && schema.authenticatedSchemaUsage === false && schema.publicTableGrants === 0, "Private app-schema privilege boundary is not intact.");
  return { fixture, protectedData, schema, brands, permissions };
}

async function verifyPostApply(client, before) {
  const fixture = await inspectFixture(client);
  assert(fixture.classification === "exact_existing", "Verification fixture is not exact after apply.");
  await authorizationProjection(client, MEDWAY_ID, true);
  await authorizationProjection(client, ELITE_ID, false);
  const elite = await queryRows(client, `select
    (select count(*)::int from app.admin_profiles where brand_id = $1 and app_user_id = $2) as profiles,
    (select count(*)::int from app.admin_role_assignments where brand_id = $1 and admin_profile_id = $3) as assignments`, [ELITE_ID, APP_USER_ID, ADMIN_PROFILE_ID]);
  assert(number(elite[0], "profiles") === 0 && number(elite[0], "assignments") === 0, "Elite authority appeared after fixture apply.");
  assert(JSON.stringify(await protectedDataSnapshot(client)) === JSON.stringify(before.protectedData), "M2, M4, or curriculum state changed during Prompt 56A.");
  assert(JSON.stringify(await schemaSnapshot(client)) === JSON.stringify(before.schema), "Schema, constraint, index, trigger, or policy state changed during Prompt 56A.");
  assert(JSON.stringify(await foundationSnapshot(client)) === JSON.stringify(before.brands), "Medway or Elite foundation state changed during Prompt 56A.");
  assert(JSON.stringify(await permissionCatalogueSnapshot(client)) === JSON.stringify(before.permissions), "Prompt 56B permission catalogue changed during Prompt 56A.");
  return fixture;
}

function cleanup(environment) {
  for (const key of ["ADMIN_P56_STAGING_FIXTURE_APPLY", "ADMIN_P56_TARGET_ENVIRONMENT", "SUPABASE_PROJECT_REF", "SUPABASE_DB_URL", "PGSSLROOTCERT", "NODE_EXTRA_CA_CERTS"]) {
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
    validateDeterministicIds();
    const sql = readFileSync(fixturePath, "utf8");
    validateFixtureSql(sql);
    if (environment.ADMIN_P56_STAGING_FIXTURE_APPLY !== "true") {
      console.log("Prompt 56A staging fixture apply skipped: ADMIN_P56_STAGING_FIXTURE_APPLY is not true.");
      return;
    }
    const { target, caPath } = validateEnvironment(environment);
    pool = await openPool(target, caPath);
    client = await pool.connect();
    const before = await preflight(client);
    const componentValues = Object.values(before.fixture.components);
    const relationshipValues = Object.values(before.fixture.rolePermissionClassifications);
    console.log(`Prompt 56A preflight: fixture=${before.fixture.classification} components_absent=${componentValues.filter((value) => value === "absent").length} components_exact=${componentValues.filter((value) => value === "exact_existing").length} relationships_absent=${relationshipValues.filter((value) => value === "absent").length} relationships_exact=${relationshipValues.filter((value) => value === "exact_existing").length} conflicts=0 permissions=8.`);
    if (before.fixture.classification === "exact_existing") {
      await verifyPostApply(client, before);
      console.log(`Prompt 56A staging fixture verified: classification=exact_existing auth_id=${AUTH_ID} app_user_id=${APP_USER_ID} admin_profile_id=${ADMIN_PROFILE_ID} role_id=${ROLE_ID} assignment_id=${ASSIGNMENT_ID}.`);
      return;
    }
    await client.query("BEGIN");
    transaction = true;
    await client.query(sql);
    await verifyPostApply(client, before);
    await client.query("COMMIT");
    transaction = false;
    await verifyPostApply(client, before);
    console.log(`Prompt 56A staging fixture applied: classification=${before.fixture.classification}_to_exact auth_id=${AUTH_ID} app_user_id=${APP_USER_ID} admin_profile_id=${ADMIN_PROFILE_ID} role_id=${ROLE_ID} assignment_id=${ASSIGNMENT_ID} permissions=8 elite_authority=0.`);
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
  console.error(`Prompt 56A staging fixture apply failed: ${error instanceof Error ? error.message : "unexpected error"}`);
  process.exitCode = 1;
});
