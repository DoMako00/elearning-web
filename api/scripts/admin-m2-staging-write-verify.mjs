import { spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { createServer } from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";

const PROJECT_REF = "mgrsgibxuwgbxtdqprkw";
const ENVIRONMENT = "staging";
const DATABASE = "postgres";
const HOST = "127.0.0.1";
const MOCK_BEARER = "mock-auth-medway-admin-001";
const MOCK_AUTH_USER_ID = "02694d40-9dec-5f53-a613-6fb946a2b0fa";
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
  assert(environment.SUPABASE_PROJECT_REF === PROJECT_REF, "Staging project reference gate failed.");
  assert(environment.SUPABASE_DB_URL, "Staging database URL is missing.");
  const target = new URL(environment.SUPABASE_DB_URL);
  assert(["postgres:", "postgresql:"].includes(target.protocol), "Database protocol gate failed.");
  assert(Boolean(target.hostname), "Database hostname gate failed.");
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

async function preflight(pool) {
  const database = await selectRows(pool, "database", "select current_database() as database_name");
  assert(database[0]?.database_name === DATABASE, "Connected database identity is not approved.");

  const brands = await selectRows(pool, "brands", "select id, code, status from app.educational_brands where code = any($1::text[]) order by code", [["elite", "medway"]]);
  assert(brands.length === 2 && brands.every((row) => row.status === "active"), "Medway/Elite foundation brand state is invalid.");
  const medway = brands.find((row) => row.code === "medway");
  const elite = brands.find((row) => row.code === "elite");
  assert(medway?.id && elite?.id, "Medway/Elite identifiers could not be resolved.");

  const initial = await fixtureSnapshot(pool);
  assert(Object.values(initial).every((value) => value === 0), "Prompt 56 fixture or evidence state already exists; automatic resume is forbidden.");

  const identities = await selectRows(pool, "medway-admin", `select au.id as app_user_id, au.status as app_user_status, ap.id as admin_profile_id, ap.status as admin_profile_status
    from app.app_users au join app.admin_profiles ap on ap.app_user_id = au.id
    where au.auth_user_id = $1 and ap.brand_id = $2`, [MOCK_AUTH_USER_ID, medway.id]);
  assert(identities.length === 1 && identities[0].app_user_status === "active" && identities[0].admin_profile_status === "active", "Persisted Medway Admin fixture is not compatible with mock authentication.");
  const adminProfileId = identities[0].admin_profile_id;

  const permissionRows = await selectRows(pool, "medway-permissions", `select distinct p.code
    from app.admin_role_assignments ara
    join app.admin_roles r on r.id = ara.role_id and r.brand_id = ara.brand_id and r.status = 'active'
    join app.admin_role_permissions rp on rp.role_id = r.id
    join app.admin_permissions p on p.id = rp.permission_id and p.status = 'active'
    where ara.admin_profile_id = $1 and ara.brand_id = $2 and ara.status = 'active'`, [adminProfileId, medway.id]);
  const actualPermissions = new Set(permissionRows.map((row) => row.code));
  assert(permissions.every((permission) => actualPermissions.has(permission)), "Persisted Medway Admin permissions are incomplete.");

  const eliteAuthority = await selectRows(pool, "elite-authority", `select count(*)::int as count
    from app.app_users au join app.admin_profiles ap on ap.app_user_id = au.id
    where au.auth_user_id = $1 and ap.brand_id = $2 and au.status = 'active' and ap.status = 'active'`, [MOCK_AUTH_USER_ID, elite.id]);
  assert(count(eliteAuthority[0]) === 0, "Medway mock principal unexpectedly has Elite Admin authority.");

  const constraints = await selectRows(pool, "m4-constraints", `select conname from pg_constraint
    where conname = any($1::text[]) order by conname`, [["admin_actions_idempotency_key", "audit_logs_admin_action_id_key"]]);
  assert(constraints.length === 2, "Required M4 constraints are missing.");

  return { medwayId: medway.id, eliteId: elite.id, adminProfileId };
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
    (select count(*)::int from app.educational_brands where code in ('medway', 'elite') and status = 'active') as brands,
    (select count(*)::int from app.academic_levels) as levels,
    (select count(*)::int from app.academic_semesters) as semesters,
    (select count(*)::int from app.academic_modules) as modules,
    (select count(*)::int from app.academic_modules where module_code in ('PDM1105', '1105 PMD')) as deferred_modules`);
  const row = rows[0];
  return {
    brands: count(row, "brands"), levels: count(row, "levels"), semesters: count(row, "semesters"),
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
  if (options.auth !== false) headers.authorization = `Bearer ${MOCK_BEARER}`;
  if (options.key) headers["idempotency-key"] = options.key;
  if (options.body !== undefined) headers["content-type"] = "application/json";
  try {
    const response = await fetch(`${baseUrl}${pathname}`, {
      method, headers, signal: controller.signal,
      ...(options.body !== undefined ? { body: JSON.stringify(options.body) } : {}),
    });
    const text = await response.text();
    let body;
    try { body = text ? JSON.parse(text) : null; } catch { body = null; }
    return { status: response.status, body, headers: response.headers };
  } finally { clearTimeout(timeout); }
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
  expectStatus(await http(baseUrl, "GET", "/ready", { auth: false }), 200, "readiness");
  const overview = expectStatus(await http(baseUrl, "GET", "/v1/admin/overview?brand=medway", { auth: false }), 200, "Admin Overview");
  assert(overview.body?.brand?.brandId === "brand-medway", "Admin Overview is not mock-backed.");
  const levels = expectStatus(await http(baseUrl, "GET", "/v1/admin/curriculum/levels", { auth: false }), 200, "levels");
  const semesters = expectStatus(await http(baseUrl, "GET", "/v1/admin/curriculum/semesters", { auth: false }), 200, "semesters");
  const modules = expectStatus(await http(baseUrl, "GET", "/v1/admin/curriculum/modules", { auth: false }), 200, "modules");
  assert(levels.body?.data?.length === 5 && semesters.body?.data?.length === 10 && modules.body?.data?.length === 60, "Curriculum baseline count mismatch.");
  assert(!modules.body.data.some((row) => ["PDM1105", "1105 PMD"].includes(row.moduleCode)), "Deferred PDM module is present.");

  const createPath = `/v1/admin/brands/${context.medwayId}/instructors/global`;
  const validBody = { displayName: INSTRUCTOR_NAME, professionalTitle: null, reason: REASON };
  expectStatus(await http(baseUrl, "POST", createPath, { auth: false, key: "p56-negative-auth-v1", body: validBody }), 401, "missing Authorization");
  expectStatus(await http(baseUrl, "POST", createPath, { body: validBody }), 400, "missing Idempotency-Key");
  for (const [field, value] of [["adminProfileId", ABSENT_ID], ["permissions", []], ["brandId", context.medwayId]]) {
    expectStatus(await http(baseUrl, "POST", createPath, { key: `p56-negative-${field.toLowerCase()}-v1`, body: { ...validBody, [field]: value } }), 400, `forbidden body field ${field}`);
  }
  expectStatus(await http(baseUrl, "POST", "/v1/admin/brands/not-a-uuid/instructors/global", { key: "p56-negative-uuid-v1", body: validBody }), 400, "malformed UUID");
  expectStatus(await http(baseUrl, "POST", `${createPath}?unsupported=true`, { key: "p56-negative-query-v1", body: validBody }), 400, "unsupported query");
  expectStatus(await http(baseUrl, "PATCH", `/v1/admin/brands/${context.eliteId}/courses/${ABSENT_ID}/status`, { key: "p56-negative-elite-v1", body: { status: "published", reason: REASON } }), [403, 404], "wrong brand authority");
  const snapshot = await fixtureSnapshot(pool);
  assert(Object.values(snapshot).every((value) => value === 0), "Negative checks created fixture or evidence state.");
}

async function readData(baseUrl, pathname, label) {
  const result = expectStatus(await http(baseUrl, "GET", pathname, { auth: false }), 200, label);
  assert(result.body?.data, `${label}: response data is missing.`);
  return result.body.data;
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

  expectMutation(await http(baseUrl, "PATCH", `${createPath}/${instructorId}`, { key: "p56-update-instructor-v1", body: { professionalTitle: INSTRUCTOR_TITLE, expectedVersion: instructor.updatedAt, reason: REASON } }), 200, "update instructor");
  instructor = await readData(baseUrl, `/v1/admin/instructors/${instructorId}`, "read updated instructor");
  assert(instructor.professionalTitle === INSTRUCTOR_TITLE, "Instructor professional title update did not persist.");

  expectMutation(await http(baseUrl, "PATCH", `/v1/admin/brands/${context.medwayId}/courses/${courseId}/status`, { key: "p56-publish-course-v1", body: { status: "published", expectedVersion: course.updatedAt, reason: REASON } }), 200, "publish course");
  course = await readData(baseUrl, `/v1/admin/brands/${context.medwayId}/courses/${courseId}`, "read published course");
  assert(course.status === "published", "Course did not publish.");

  expectMutation(await http(baseUrl, "PATCH", `/v1/admin/brands/${context.medwayId}/courses/${courseId}/status`, { key: "p56-archive-course-v1", body: { status: "archived", expectedVersion: course.updatedAt, reason: REASON } }), 200, "archive course");
  course = await readData(baseUrl, `/v1/admin/brands/${context.medwayId}/courses/${courseId}`, "read archived course");
  assert(course.status === "archived", "Course did not archive.");
  const beforeRejection = await fixtureSnapshot(pool);
  expectStatus(await http(baseUrl, "PATCH", `/v1/admin/brands/${context.medwayId}/courses/${courseId}/status`, { key: "p56-republish-archived-course-v1", body: { status: "published", expectedVersion: course.updatedAt, reason: REASON } }), 400, "archived course republish rejection");
  assert(JSON.stringify(beforeRejection) === JSON.stringify(await fixtureSnapshot(pool)), "Lifecycle rejection changed persisted counts.");

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
    aa.command_name, aa.target_type, aa.target_id, aa.reason, aa.idempotency_key, aa.command_fingerprint,
    aa.outcome as action_outcome, al.outcome as audit_outcome, aa.result_summary, aa.metadata as action_metadata,
    al.before_summary, al.after_summary, al.metadata as audit_metadata
    from app.admin_actions aa left join app.audit_logs al on al.admin_action_id = aa.id
    where aa.idempotency_key = any($1::text[]) order by aa.created_at, aa.id`, [evidencePlan.map(([key]) => key)]);
  assert(rows.length === evidencePlan.length, "Prompt 56 action evidence count is not exactly 10.");
  const targetIds = { instructor: ids.instructorId, brand_instructor: ids.brandInstructorId, brand_course: ids.courseId, course_instructor: ids.courseInstructorId };
  for (const [key, commandName, targetType] of evidencePlan) {
    const row = rows.find((candidate) => candidate.idempotency_key === key);
    assert(row, `Evidence is missing for ${key}.`);
    assert(row.audit_id && row.brand_id === context.medwayId && row.admin_profile_id === context.adminProfileId, `Evidence authority mismatch for ${key}.`);
    assert(row.command_name === commandName && row.target_type === targetType && row.target_id === targetIds[targetType], `Evidence target mismatch for ${key}.`);
    assert(row.reason === REASON && row.action_outcome === "succeeded" && row.audit_outcome === "succeeded", `Evidence outcome mismatch for ${key}.`);
    assert(/^v1:sha256:[0-9a-f]{64}$/.test(row.command_fingerprint), `Evidence fingerprint mismatch for ${key}.`);
    const serialized = JSON.stringify([row.result_summary, row.action_metadata, row.before_summary, row.after_summary, row.audit_metadata]);
    assert(!/(authorization|bearer|token|password|database[_ -]?url|connection[_ -]?string|credential)/i.test(serialized), `Sensitive evidence field detected for ${key}.`);
    if (["p56-create-instructor-v1", "p56-assign-brand-instructor-v1", "p56-create-course-v1", "p56-assign-course-instructor-v1"].includes(key)) assert(row.before_summary === null, `Create evidence before-summary mismatch for ${key}.`);
    else assert(row.before_summary && row.after_summary, `Update evidence summaries are missing for ${key}.`);
  }
  const audits = await selectRows(pool, "audit-count", "select count(*)::int as count from app.audit_logs where idempotency_key = any($1::text[])", [evidencePlan.map(([key]) => key)]);
  assert(count(audits[0]) === 10, "Prompt 56 audit evidence count is not exactly 10.");
  const unmatched = await selectRows(pool, "unmatched-evidence", `select
    (select count(*)::int from app.admin_actions aa left join app.audit_logs al on al.admin_action_id = aa.id where aa.idempotency_key like 'p56-%' and al.id is null) as actions_without_audit,
    (select count(*)::int from app.audit_logs al left join app.admin_actions aa on aa.id = al.admin_action_id where al.idempotency_key like 'p56-%' and aa.id is null) as audits_without_action`);
  assert(count(unmatched[0], "actions_without_audit") === 0 && count(unmatched[0], "audits_without_action") === 0, "M4 one-to-one evidence verification failed.");
}

async function verifyFinal(pool, context, ids, beforeFoundation) {
  const snapshot = await fixtureSnapshot(pool);
  assert(snapshot.instructors === 1 && snapshot.brandInstructors === 1 && snapshot.courses === 1 && snapshot.courseInstructors === 1 && snapshot.actions === 10 && snapshot.audits === 10, "Final Prompt 56 fixture counts are invalid.");
  const rows = await selectRows(pool, "final-fixtures", `select
    (select status from app.instructors where id = $1) as instructor_status,
    (select status from app.brand_instructors where brand_id = $2 and instructor_id = $1) as brand_instructor_status,
    (select status from app.brand_courses where id = $3 and brand_id = $2) as course_status,
    (select course_scope from app.brand_courses where id = $3 and brand_id = $2) as course_scope,
    (select status from app.course_instructors where id = $4 and brand_id = $2) as course_instructor_status,
    (select count(*)::int from app.brand_instructors where brand_id = $5 and instructor_id = $1) as elite_associations`, [ids.instructorId, context.medwayId, ids.courseId, ids.courseInstructorId, context.eliteId]);
  const row = rows[0];
  assert(row.instructor_status === "inactive" && row.brand_instructor_status === "inactive" && row.course_status === "archived" && row.course_scope === "standalone" && row.course_instructor_status === "inactive" && count(row, "elite_associations") === 0, "Final Prompt 56 lifecycle or isolation state is invalid.");
  const afterFoundation = await foundationSnapshot(pool);
  assert(JSON.stringify(beforeFoundation) === JSON.stringify(afterFoundation), "Foundation/curriculum regression detected.");
  assert(afterFoundation.brands === 2 && afterFoundation.levels === 5 && afterFoundation.semesters === 10 && afterFoundation.modules === 60 && afterFoundation.deferredModules === 0, "Foundation/curriculum acceptance check failed.");
}

function cleanupEnvironment(environment) {
  for (const key of ["ADMIN_M2_STAGING_WRITE_VERIFY", "SUPABASE_PROJECT_REF", "SUPABASE_DB_URL", "PGSSLROOTCERT", "NODE_EXTRA_CA_CERTS", "ADMIN_RUNTIME_MODE", "PERSISTENCE_PROVIDER", "AUTH_PROVIDER", "ADMIN_READ_MODEL_SOURCE", "ADMIN_M2_READ_MODEL_SOURCE", "ADMIN_COMMAND_SOURCE", "API_HOST", "API_PORT"]) {
    delete environment[key];
    delete process.env[key];
  }
}

async function main() {
  const environment = loadEnvironment();
  let pool;
  let child;
  try {
    if (environment.ADMIN_M2_STAGING_WRITE_VERIFY !== "true") {
      console.log("Prompt 56 staging verification skipped: ADMIN_M2_STAGING_WRITE_VERIFY is not true.");
      return;
    }
    const validated = validateEnvironment(environment);
    pool = await openSelectPool(environment, validated.target, validated.caPath);
    const context = await preflight(pool);
    const beforeFoundation = await foundationSnapshot(pool);
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
    const ids = await executeFlow(baseUrl, pool, context);
    await verifyEvidence(pool, context, ids);
    await verifyFinal(pool, context, ids, beforeFoundation);
    console.log(`Prompt 56 staging verification passed: project_ref=${PROJECT_REF} environment=${ENVIRONMENT} mutations=10 admin_actions=10 audit_logs=10.`);
    console.log(`Prompt 56 fixture IDs: instructor=${ids.instructorId} brand_instructor=${ids.brandInstructorId} course=${ids.courseId} course_instructor=${ids.courseInstructorId}.`);
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
