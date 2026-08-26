import { existsSync } from "node:fs";
import { fork } from "node:child_process";
import { randomBytes } from "node:crypto";
import { request } from "node:http";
import { createServer } from "node:net";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const PROJECT_REF = "mgrsgibxuwgbxtdqprkw";
const LOOPBACK = "127.0.0.1";
const VERSION = 1;
const REQUEST = "admin-read-verifier-diagnostics:snapshot";
const RESPONSE = "admin-read-verifier-diagnostics:snapshot-result";
const COUNT_KEYS = ["totalProtectedReadInvocations", "curriculumLevelReads", "curriculumSemesterReads", "curriculumModuleReads", "curriculumModuleDetailReads", "globalInstructorReads", "globalInstructorDetailReads", "brandInstructorReads", "brandInstructorCourseReads", "brandCourseReads", "brandCourseDetailReads", "courseInstructorReads"];

function output(value) { process.stdout.write(`${value}\n`); }
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
  if (present("SUPABASE_DB_URL")) { try { const url = new URL(process.env.SUPABASE_DB_URL); if (!/^(postgres|postgresql):$/.test(url.protocol) || url.searchParams.get("sslmode") !== "verify-full" || url.pathname.replace(/^\//, "") !== "postgres" || !url.hostname.includes(PROJECT_REF) || /localhost|127\.0\.0\.1|::1/i.test(url.hostname)) missing.push("SUPABASE_DB_URL"); } catch { missing.push("SUPABASE_DB_URL"); } }
  return [...new Set(missing)];
}
function requestStatus(port, path, headers = {}) { return new Promise((resolve, reject) => { const client = request({ host: LOOPBACK, port, path, method: "GET", headers, timeout: 5000 }, (response) => { response.resume(); response.once("end", () => resolve(response.statusCode ?? 0)); }); client.once("timeout", () => client.destroy(new Error("timeout"))); client.once("error", reject); client.end(); }); }
function reservePort() { return new Promise((resolve, reject) => { const probe = createServer(); probe.once("error", reject); probe.listen(0, LOOPBACK, () => { const address = probe.address(); const port = typeof address === "object" && address ? address.port : 0; probe.close((error) => error ? reject(error) : resolve(port)); }); }); }
function validCounts(value) { return value && typeof value === "object" && Object.keys(value).length === COUNT_KEYS.length && COUNT_KEYS.every((key) => Number.isSafeInteger(value[key]) && value[key] >= 0); }
function snapshot(child) { return new Promise((resolve, reject) => { const nonce = randomBytes(18).toString("base64url"); let settled = false; const done = (error, counts) => { if (settled) return; settled = true; clearTimeout(timer); child.off("message", listener); error ? reject(error) : resolve(counts); }; const timer = setTimeout(() => done(new Error("DIAGNOSTIC_PROOF_FAILED")), 5000); const listener = (message) => { if (!message || typeof message !== "object" || message.nonce !== nonce) return; if (message.type !== RESPONSE || message.version !== VERSION || !validCounts(message.counts)) return done(new Error("DIAGNOSTIC_PROOF_FAILED")); done(undefined, message.counts); }; child.on("message", listener); child.send({ type: REQUEST, version: VERSION, nonce }, (error) => { if (error) done(new Error("DIAGNOSTIC_PROOF_FAILED")); }); }); }
function stop(child) { if (child.exitCode !== null) return Promise.resolve(); child.kill("SIGTERM"); return new Promise((resolve) => { const timer = setTimeout(() => { if (child.exitCode === null) child.kill("SIGKILL"); resolve(); }, 3000); child.once("exit", () => { clearTimeout(timer); resolve(); }); }); }
async function run() {
  const gates = missingGates();
  if (gates.length) { output("MISSING_GATES"); for (const gate of gates) output(gate); return; }
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
    output("protected_repository_read=not_executed"); output("protected_repository_read_delta=0"); output("FAILED_SAFE");
  } finally { await stop(child); }
}
if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) run().catch(() => { output("FAILED_SAFE"); process.exitCode = 2; });
