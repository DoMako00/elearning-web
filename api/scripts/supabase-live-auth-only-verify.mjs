import { existsSync, readFileSync } from "node:fs";
import { fork } from "node:child_process";
import { randomBytes } from "node:crypto";
import { request } from "node:http";
import { createServer } from "node:net";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { classifyPostgresTarget } from "./postgres-target-classifier.mjs";

const PROJECT_REF = "mgrsgibxuwgbxtdqprkw";
const LOOPBACK = "127.0.0.1";
const VERSION = 1;
const REQUEST = "admin-read-verifier-diagnostics:snapshot";
const RESPONSE = "admin-read-verifier-diagnostics:snapshot-result";
const COUNT_KEYS = ["totalProtectedReadInvocations", "curriculumLevelReads", "curriculumSemesterReads", "curriculumModuleReads", "curriculumModuleDetailReads", "globalInstructorReads", "globalInstructorDetailReads", "brandInstructorReads", "brandInstructorCourseReads", "brandCourseReads", "brandCourseDetailReads", "courseInstructorReads"];
const READ_CODES = ["admin.overview.read", "admin.curriculum.read", "admin.instructors.read", "admin.brand_instructors.read", "admin.brand_courses.read", "admin.course_instructors.read"];
const COUNTS_QUERY = "select current_database() = 'postgres' as database_ok, (select count(*)::int from app.educational_brands) as educational_brands, (select count(*)::int from app.app_users) as app_users, (select count(*)::int from app.brand_memberships) as brand_memberships, (select count(*)::int from app.student_profiles) as student_profiles, (select count(*)::int from app.admin_profiles) as admin_profiles, (select count(*)::int from app.admin_permissions) as admin_permissions, (select count(*)::int from app.admin_roles) as admin_roles, (select count(*)::int from app.admin_role_permissions) as admin_role_permissions, (select count(*)::int from app.admin_role_assignments) as admin_role_assignments, (select count(*)::int from app.academic_levels) as academic_levels, (select count(*)::int from app.academic_semesters) as academic_semesters, (select count(*)::int from app.academic_modules) as academic_modules, (select count(*)::int from app.instructors) as instructors, (select count(*)::int from app.brand_instructors) as brand_instructors, (select count(*)::int from app.brand_courses) as brand_courses, (select count(*)::int from app.course_instructors) as course_instructors, (select count(*)::int from app.admin_actions) as admin_actions, (select count(*)::int from app.audit_logs) as audit_logs";
const AUTHORITY_QUERY = "select count(au.*)::int as app_user_total, count(*) filter (where au.status = 'active')::int as app_user_active, count(ap.*) filter (where ap.status = 'active' and ap.brand_id = $2 and b.status = 'active')::int as active_medway_profiles, count(ap.*) filter (where ap.status <> 'active' or b.status <> 'active')::int as inactive_profiles, count(ara.*) filter (where ara.status = 'active' and ar.status = 'active')::int as active_roles, count(ara.*) filter (where ara.status <> 'active' or ar.status <> 'active')::int as inactive_roles, count(distinct p.code) filter (where p.code = any($3) and p.status = 'active')::int as catalogue_codes, count(distinct p.code) filter (where p.code = any($3) and p.status = 'active' and ara.status = 'active' and ar.status = 'active')::int as projected_codes, bool_or(p.code = 'admin.curriculum.read' and p.status = 'active' and ara.status = 'active' and ar.status = 'active') as curriculum_effective from app.app_users au left join app.admin_profiles ap on ap.app_user_id = au.id left join app.educational_brands b on b.id = ap.brand_id left join app.admin_role_assignments ara on ara.admin_profile_id = ap.id and ara.brand_id = ap.brand_id left join app.admin_roles ar on ar.id = ara.role_id and ar.brand_id = ap.brand_id left join app.admin_role_permissions arp on arp.role_id = ar.id left join app.admin_permissions p on p.id = arp.permission_id where au.auth_user_id = $1";

function output(value) { process.stdout.write(`${value}\n`); }
function candidateSubject(token) { try { const raw = token.split(".")[1]; const value = JSON.parse(Buffer.from(raw, "base64url").toString("utf8")).sub; return typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value) ? value : undefined; } catch { return undefined; } }
function present(name) { return typeof process.env[name] === "string" && process.env[name].trim().length > 0; }
function missingGates() {
  const missing = [];
  for (const name of ["SUPABASE_LIVE_AUTH_ONLY_VERIFY", "SUPABASE_LIVE_AUTH_TARGET_ENVIRONMENT", "SUPABASE_PROJECT_REF", "SUPABASE_LIVE_AUTH_ACCESS_TOKEN", "SUPABASE_LIVE_AUTH_MEDWAY_BRAND_ID", "SUPABASE_LIVE_AUTH_DB_TARGET_CONFIRMED", "SUPABASE_DB_URL", "PGSSLROOTCERT"]) if (!present(name)) missing.push(name);
  if (process.env.SUPABASE_LIVE_AUTH_ONLY_VERIFY !== "true" && !missing.includes("SUPABASE_LIVE_AUTH_ONLY_VERIFY")) missing.push("SUPABASE_LIVE_AUTH_ONLY_VERIFY");
  if (process.env.SUPABASE_LIVE_AUTH_TARGET_ENVIRONMENT !== "staging" && !missing.includes("SUPABASE_LIVE_AUTH_TARGET_ENVIRONMENT")) missing.push("SUPABASE_LIVE_AUTH_TARGET_ENVIRONMENT");
  if (process.env.SUPABASE_PROJECT_REF !== PROJECT_REF && !missing.includes("SUPABASE_PROJECT_REF")) missing.push("SUPABASE_PROJECT_REF");
  if (process.env.SUPABASE_LIVE_AUTH_DB_TARGET_CONFIRMED !== "true" && !missing.includes("SUPABASE_LIVE_AUTH_DB_TARGET_CONFIRMED")) missing.push("SUPABASE_LIVE_AUTH_DB_TARGET_CONFIRMED");
  if (process.env.NODE_TLS_REJECT_UNAUTHORIZED === "0") missing.push("NODE_TLS_REJECT_UNAUTHORIZED");
  if (present("PGSSLROOTCERT") && !existsSync(process.env.PGSSLROOTCERT)) missing.push("PGSSLROOTCERT");
  if (present("SUPABASE_LIVE_AUTH_MEDWAY_BRAND_ID") && !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(process.env.SUPABASE_LIVE_AUTH_MEDWAY_BRAND_ID)) missing.push("SUPABASE_LIVE_AUTH_MEDWAY_BRAND_ID");
  if (present("SUPABASE_DB_URL") && !classifyPostgresTarget(process.env.SUPABASE_DB_URL, PROJECT_REF)) missing.push("SUPABASE_DB_URL");
  return [...new Set(missing)];
}
function requestStatus(port, path, headers = {}) { return new Promise((resolve, reject) => { const client = request({ host: LOOPBACK, port, path, method: "GET", headers, timeout: 5000 }, (response) => { response.resume(); response.once("end", () => resolve(response.statusCode ?? 0)); }); client.once("timeout", () => client.destroy(new Error("timeout"))); client.once("error", reject); client.end(); }); }
function reservePort() { return new Promise((resolve, reject) => { const probe = createServer(); probe.once("error", reject); probe.listen(0, LOOPBACK, () => { const address = probe.address(); const port = typeof address === "object" && address ? address.port : 0; probe.close((error) => error ? reject(error) : resolve(port)); }); }); }
function validCounts(value) { return value && typeof value === "object" && Object.keys(value).length === COUNT_KEYS.length && COUNT_KEYS.every((key) => Number.isSafeInteger(value[key]) && value[key] >= 0); }
function snapshot(child) { return new Promise((resolve, reject) => { const nonce = randomBytes(18).toString("base64url"); let settled = false; const done = (error, counts) => { if (settled) return; settled = true; clearTimeout(timer); child.off("message", listener); error ? reject(error) : resolve(counts); }; const timer = setTimeout(() => done(new Error("DIAGNOSTIC_PROOF_FAILED")), 5000); const listener = (message) => { if (!message || typeof message !== "object" || message.nonce !== nonce) return; if (message.type !== RESPONSE || message.version !== VERSION || !validCounts(message.counts)) return done(new Error("DIAGNOSTIC_PROOF_FAILED")); done(undefined, message.counts); }; child.on("message", listener); child.send({ type: REQUEST, version: VERSION, nonce }, (error) => { if (error) done(new Error("DIAGNOSTIC_PROOF_FAILED")); }); }); }
function stop(child) { if (child.exitCode !== null) return Promise.resolve(); child.kill("SIGTERM"); return new Promise((resolve) => { const timer = setTimeout(() => { if (child.exitCode === null) child.kill("SIGKILL"); resolve(); }, 3000); child.once("exit", () => { clearTimeout(timer); resolve(); }); }); }
function classify(authority) { const appUser = authority.app_user_total === 1 ? authority.app_user_active === 1 ? "one_active" : "inactive" : authority.app_user_total === 0 ? "missing" : "ambiguous"; const scope = authority.active_medway_profiles === 1 ? "one_active_medway" : authority.active_medway_profiles > 1 ? "ambiguous" : authority.inactive_profiles > 0 ? "inactive" : "missing"; const catalogue = authority.catalogue_codes === 0 ? "absent" : authority.catalogue_codes === READ_CODES.length ? "complete" : "partial"; const projection = authority.projected_codes === 0 ? "none" : authority.projected_codes === READ_CODES.length ? "complete" : "partial"; return { appUser, scope, role: authority.active_roles > 0 ? "one_or_more_active" : authority.inactive_roles > 0 ? "inactive_or_expired" : "missing", catalogue, projection, curriculum: authority.curriculum_effective ? "present" : "absent" }; }
async function captureSnapshot(subject, poolFactory) { const { Pool } = await import("pg"); const pool = poolFactory ? await poolFactory() : new Pool({ connectionString: process.env.SUPABASE_DB_URL, max: 1, connectionTimeoutMillis: 5000, ssl: { ca: readFileSync(process.env.PGSSLROOTCERT, "utf8"), rejectUnauthorized: true } }); const client = await pool.connect(); try { await client.query("begin transaction read only"); const counts = (await client.query({ text: COUNTS_QUERY, values: [] })).rows[0]; const authority = (await client.query({ text: AUTHORITY_QUERY, values: [subject, process.env.SUPABASE_LIVE_AUTH_MEDWAY_BRAND_ID, READ_CODES] })).rows[0]; await client.query("commit"); return Object.freeze({ counts: Object.freeze({ ...counts }), authority: Object.freeze(classify(authority)) }); } catch (error) { try { await client.query("rollback"); } catch {} throw error; } finally { client.release(); await pool.end(); } }
function identical(left, right) { return JSON.stringify(left) === JSON.stringify(right); }
async function run() {
  const gates = missingGates();
  if (gates.length) { output("MISSING_GATES"); for (const gate of gates) output(gate); return; }
  const subject = candidateSubject(process.env.SUPABASE_LIVE_AUTH_ACCESS_TOKEN);
  if (!subject) { output("TOKEN_SUBJECT_UNUSABLE"); return; }
  const baselineDatabase = await captureSnapshot(subject);
  if (baselineDatabase.counts.database_ok !== true || baselineDatabase.counts.academic_levels !== 5 || baselineDatabase.counts.academic_semesters !== 10 || baselineDatabase.counts.academic_modules !== 60) { output("STAGING_BASELINE_MISMATCH"); return; }
  if (baselineDatabase.authority.appUser !== "one_active" || baselineDatabase.authority.scope !== "one_active_medway" || baselineDatabase.authority.role !== "one_or_more_active") { output("AUTHORITY_TARGET_MISMATCH"); return; }
  if (baselineDatabase.authority.curriculum !== "absent") { output("READ_PERMISSION_STATE_UNEXPECTED"); return; }
  const port = await reservePort();
  const childEnvironment = { ...process.env, AUTH_PROVIDER: "supabase", PERSISTENCE_PROVIDER: "supabase", ADMIN_READ_MODEL_SOURCE: "postgres", ADMIN_M2_READ_MODEL_SOURCE: "postgres", ADMIN_COMMAND_SOURCE: "mock", ADMIN_READ_VERIFIER_DIAGNOSTICS: "true", API_HOST: LOOPBACK, API_PORT: String(port), SUPABASE_AUTH_AUDIENCE: "authenticated", NODE_ENV: "test" };
  delete childEnvironment.SUPABASE_LIVE_AUTH_ACCESS_TOKEN;
  const child = fork(join(process.cwd(), "dist", "main.js"), [], { cwd: process.cwd(), silent: true, env: childEnvironment });
  try {
    const deadline = Date.now() + 10000;
    while (Date.now() < deadline) { try { if (await requestStatus(port, "/ready") === 200) break; } catch {} await new Promise((resolve) => setTimeout(resolve, 100)); }
    if (await requestStatus(port, "/health") !== 200 || await requestStatus(port, "/ready") !== 200) throw new Error("FAILED_SAFE");
    const baseline = await snapshot(child);
    const status = await requestStatus(port, "/v1/admin/curriculum/levels", { authorization: `Bearer ${process.env.SUPABASE_LIVE_AUTH_ACCESS_TOKEN}` });
    const final = await snapshot(child);
    if (status !== 403 || final.totalProtectedReadInvocations !== baseline.totalProtectedReadInvocations || final.curriculumLevelReads !== baseline.curriculumLevelReads) throw new Error("DIAGNOSTIC_PROOF_FAILED");
    const finalDatabase = await captureSnapshot(subject);
    if (!identical(baselineDatabase, finalDatabase)) { output("UNEXPECTED_STAGING_MUTATION"); return; }
    output("protected_repository_read=not_executed"); output("protected_repository_read_delta=0"); output("FAILED_SAFE");
  } finally { await stop(child); }
}
if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) run().catch(() => { output("FAILED_SAFE"); process.exitCode = 2; });
export { AUTHORITY_QUERY, COUNTS_QUERY, candidateSubject, captureSnapshot, classify, identical, missingGates };
