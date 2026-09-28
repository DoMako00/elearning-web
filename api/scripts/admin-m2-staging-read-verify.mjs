import { createHash } from "node:crypto";
import { spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { createServer } from "node:net";
import { fileURLToPath } from "node:url";
import path from "node:path";

const projectRef = "mgrsgibxuwgbxtdqprkw";
const hostname = "127.0.0.1";
const dnsNamespace = "6ba7b810-9dad-11d1-80b4-00c04fd430c8";
const foundationPrefix = "elearning.foundation.staging.v1/";
const apiDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const planPath = path.join(apiDirectory, "docs", "foundation-seed-plan-medway-elite-buc.md");
const absentId = "00000000-0000-4000-8000-000000000001";
const absentBrandId = "00000000-0000-4000-8000-000000000002";
const absentCourseId = "00000000-0000-4000-8000-000000000003";

function assert(value, message) { if (!value) throw new Error(message); }
function uuidV5(name) {
  const namespace = Buffer.from(dnsNamespace.replaceAll("-", ""), "hex");
  const digest = createHash("sha1").update(namespace).update(Buffer.from(name, "utf8")).digest();
  digest[6] = (digest[6] & 0x0f) | 0x50;
  digest[8] = (digest[8] & 0x3f) | 0x80;
  const value = digest.subarray(0, 16).toString("hex");
  return `${value.slice(0, 8)}-${value.slice(8, 12)}-${value.slice(12, 16)}-${value.slice(16, 20)}-${value.slice(20, 32)}`;
}
const id = (naturalKey) => uuidV5(`${foundationPrefix}${naturalKey}`);
function exact(values) { return [...values].sort((left, right) => left.id.localeCompare(right.id)); }
function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === "object") return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonical(value[key])]));
  return value;
}
function same(left, right) { return JSON.stringify(canonical(left)) === JSON.stringify(canonical(right)); }
function assertCollection(actual, expected, label) {
  assert(Array.isArray(actual), `${label} must return data array.`);
  assert(actual.length === expected.length && same(exact(actual), exact(expected)), `${label} does not match the approved foundation manifest.`);
}
function parseManifest() {
  const rows = [];
  for (const line of readFileSync(planPath, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\| `buc-medicine-module-([^`]+)` \| `([^`]+)` \| (.*?) \| (\d+) \| (\d+) \| `active` \| .*? \| `include_in_prompt_50` \|$/);
    if (match) rows.push({ id: id(`buc-medicine-module-${match[1]}`), academicSemesterId: id(`buc-medicine-semester-${match[4]}`), moduleCode: match[2], title: match[3], sortOrder: Number(match[5]), status: "active" });
  }
  assert(rows.length === 60, "Approved module manifest must contain exactly 60 rows.");
  assert(!rows.some((row) => row.moduleCode === "PDM1105" || row.moduleCode === "1105 PMD"), "Deferred PDM code is present in the verification manifest.");
  return {
    brands: ["medway", "elite"].map((code) => ({ id: id(code), code })),
    levels: Array.from({ length: 5 }, (_, index) => ({ id: id(`buc-medicine-level-${index + 1}`), levelNumber: index + 1, displayName: `Level ${index + 1}`, sortOrder: index + 1, status: "active" })),
    semesters: Array.from({ length: 10 }, (_, index) => {
      const semesterNumber = index + 1;
      return { id: id(`buc-medicine-semester-${semesterNumber}`), academicLevelId: id(`buc-medicine-level-${Math.ceil(semesterNumber / 2)}`), semesterNumber, displayName: `Semester ${semesterNumber}`, phase: semesterNumber <= 5 ? "phase_i" : "phase_ii", sortOrder: semesterNumber % 2 || 2, status: "active" };
    }),
    modules: rows,
  };
}
function validateEnvironment() {
  assert(process.env.ADMIN_M2_STAGING_VERIFY === "true", "ADMIN_M2_STAGING_VERIFY must equal true.");
  assert(process.env.SUPABASE_PROJECT_REF === projectRef, "Staging project reference gate failed.");
  assert(process.env.SUPABASE_DB_URL, "Staging database URL is missing.");
  const target = new URL(process.env.SUPABASE_DB_URL);
  assert(["postgres:", "postgresql:"].includes(target.protocol) && target.hostname && target.pathname === "/postgres", "Database target gate failed.");
  assert(target.searchParams.get("sslmode") === "verify-full", "TLS verification-mode gate failed.");
  assert(process.env.PGSSLROOTCERT && existsSync(process.env.PGSSLROOTCERT), "Trusted TLS root gate failed.");
}
function reservePort() {
  return new Promise((resolve, reject) => {
    const probe = createServer();
    probe.once("error", () => reject(new Error("Local verification port is unavailable.")));
    probe.listen(0, hostname, () => {
      const address = probe.address(); const port = typeof address === "object" && address ? address.port : undefined;
      probe.close((error) => error || !port ? reject(error ?? new Error("Could not reserve a local port.")) : resolve(port));
    });
  });
}
const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));
async function request(baseUrl, method, pathname) {
  const controller = new AbortController(); const timeout = setTimeout(() => controller.abort(), 5_000);
  try { const response = await fetch(`${baseUrl}${pathname}`, { method, signal: controller.signal }); return { status: response.status, headers: response.headers, body: await response.json() }; } finally { clearTimeout(timeout); }
}
function expectStatus(result, status, label) { assert(result.status === status, `${label}: expected HTTP ${status}, received ${result.status}.`); }
function expectEmpty(result, label) { expectStatus(result, 200, label); assert(Array.isArray(result.body?.data) && result.body.data.length === 0, `${label}: expected empty data.`); }
async function waitForHealth(child, baseUrl) {
  const deadline = Date.now() + 10_000;
  while (Date.now() < deadline) {
    assert(child.exitCode === null, "Temporary API exited during startup.");
    try { const response = await request(baseUrl, "GET", "/health"); if (response.status === 200 && response.body?.status === "ok") return; } catch { /* bounded retry during startup only */ }
    await wait(100);
  }
  throw new Error("Temporary API did not become healthy.");
}
async function stop(child) {
  if (child.exitCode !== null) return;
  const exited = new Promise((resolve) => child.once("exit", (code, signal) => resolve({ code, signal })));
  child.kill("SIGTERM"); const result = await Promise.race([exited, wait(10_000).then(() => undefined)]);
  assert(result && (result.code === 0 || result.code === null), "Temporary API did not shut down cleanly.");
}
function cleanup() {
  for (const key of ["ADMIN_M2_STAGING_VERIFY", "PERSISTENCE_PROVIDER", "ADMIN_M2_READ_MODEL_SOURCE", "ADMIN_READ_MODEL_SOURCE", "SUPABASE_PROJECT_REF", "SUPABASE_DB_URL", "PGSSLROOTCERT", "NODE_EXTRA_CA_CERTS", "API_PORT", "API_HOST"]) delete process.env[key];
}
async function verify(baseUrl, expected) {
  expectStatus(await request(baseUrl, "GET", "/health"), 200, "health");
  expectStatus(await request(baseUrl, "GET", "/ready"), 200, "readiness");
  const levels = await request(baseUrl, "GET", "/v1/admin/curriculum/levels"); expectStatus(levels, 200, "levels"); assertCollection(levels.body.data, expected.levels, "levels");
  const semesters = await request(baseUrl, "GET", "/v1/admin/curriculum/semesters"); expectStatus(semesters, 200, "semesters"); assertCollection(semesters.body.data, expected.semesters, "semesters");
  for (const number of [1, 3]) { const level = expected.levels[number - 1]; const result = await request(baseUrl, "GET", `/v1/admin/curriculum/semesters?levelId=${level.id}`); expectStatus(result, 200, `level ${number} semester filter`); assertCollection(result.body.data, expected.semesters.filter((semester) => semester.academicLevelId === level.id), `level ${number} semester filter`); }
  const modules = await request(baseUrl, "GET", "/v1/admin/curriculum/modules"); expectStatus(modules, 200, "modules"); assertCollection(modules.body.data, expected.modules, "modules"); assert(!modules.body.data.some((row) => row.moduleCode === "PDM1105" || row.moduleCode === "1105 PMD"), "Deferred PDM module is present.");
  for (const number of [1, 10]) { const semester = expected.semesters[number - 1]; const result = await request(baseUrl, "GET", `/v1/admin/curriculum/modules?semesterId=${semester.id}`); expectStatus(result, 200, `semester ${number} module filter`); assertCollection(result.body.data, expected.modules.filter((module) => module.academicSemesterId === semester.id), `semester ${number} module filter`); }
  const module = expected.modules[0]; const found = await request(baseUrl, "GET", `/v1/admin/curriculum/modules/${module.id}`); expectStatus(found, 200, "module find"); assert(same(found.body.data, module), "Module find mismatch.");
  expectStatus(await request(baseUrl, "GET", `/v1/admin/curriculum/modules/${absentId}`), 404, "absent module"); expectStatus(await request(baseUrl, "GET", "/v1/admin/curriculum/modules/not-a-uuid"), 400, "malformed module");
  expectEmpty(await request(baseUrl, "GET", "/v1/admin/instructors"), "instructors"); expectStatus(await request(baseUrl, "GET", `/v1/admin/instructors/${absentId}`), 404, "absent instructor"); expectStatus(await request(baseUrl, "GET", "/v1/admin/instructors/not-a-uuid"), 400, "malformed instructor");
  for (const brand of expected.brands) { expectEmpty(await request(baseUrl, "GET", `/v1/admin/brands/${brand.id}/courses`), `${brand.code} courses`); expectEmpty(await request(baseUrl, "GET", `/v1/admin/brands/${brand.id}/instructors`), `${brand.code} instructors`); }
  expectStatus(await request(baseUrl, "GET", `/v1/admin/brands/${absentBrandId}/courses`), 404, "unknown brand courses"); expectStatus(await request(baseUrl, "GET", `/v1/admin/brands/${absentBrandId}/instructors`), 404, "unknown brand instructors");
  const medway = expected.brands[0]; expectStatus(await request(baseUrl, "GET", `/v1/admin/brands/${medway.id}/courses/${absentCourseId}`), 404, "absent course"); expectEmpty(await request(baseUrl, "GET", `/v1/admin/brands/${medway.id}/courses/${absentCourseId}/instructors`), "absent course instructors");
  for (const pathname of ["/v1/admin/curriculum/semesters?levelId=bad", "/v1/admin/curriculum/modules?semesterId=bad", `/v1/admin/brands/${medway.id}/courses?scope=invalid`, `/v1/admin/brands/${medway.id}/courses?academicModuleId=${module.id}&scope=standalone`, "/v1/admin/curriculum/levels?unexpected=value", "/v1/admin/curriculum/levels?unexpected=value&unexpected=again", "/v1/admin/instructors?unexpected=value", `/v1/admin/brands/${medway.id}/instructors?unexpected=value`]) expectStatus(await request(baseUrl, "GET", pathname), 400, `invalid request ${pathname}`);
  const method = await request(baseUrl, "POST", "/v1/admin/curriculum/levels"); expectStatus(method, 405, "GET-only method guard"); assert(method.headers.get("allow")?.includes("GET"), "GET-only method guard missing Allow header.");
  for (const brand of expected.brands) { const overview = await request(baseUrl, "GET", `/v1/admin/overview?brand=${brand.code}`); expectStatus(overview, 200, `${brand.code} overview`); assert(overview.body?.brand?.brandId === `brand-${brand.code}`, "Admin Overview is no longer mock-backed."); }
}
async function main() {
  validateEnvironment(); const expected = parseManifest(); const port = await reservePort(); const baseUrl = `http://${hostname}:${port}`;
  const child = spawn(process.execPath, ["dist/main.js"], { cwd: apiDirectory, windowsHide: true, stdio: ["ignore", "ignore", "ignore"], env: { ...process.env, API_HOST: hostname, API_PORT: String(port), ADMIN_RUNTIME_MODE: "mock", PERSISTENCE_PROVIDER: "supabase", ADMIN_M2_READ_MODEL_SOURCE: "postgres", ADMIN_READ_MODEL_SOURCE: "mock", NODE_EXTRA_CA_CERTS: process.env.PGSSLROOTCERT, NODE_ENV: "test" } });
  try { await waitForHealth(child, baseUrl); await verify(baseUrl, expected); console.log("Prompt 51 staging HTTP verification passed: levels=5 semesters=10 modules=60."); } finally { await stop(child); cleanup(); }
}
main().catch((error) => { console.error(`Prompt 51 staging verification failed: ${error instanceof Error ? error.message : "unexpected error"}`); process.exitCode = 1; });
