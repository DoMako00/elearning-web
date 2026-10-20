import assert from "node:assert/strict";

// Read-only checks against the independently deployed API. Credentials are
// supplied by the caller's environment, never saved or printed by this script.
const base = process.env.STUDENT_API_BASE_URL?.replace(/\/$/, "");
const bearer = process.env.STUDENT_API_BEARER;
if (!base || !bearer) throw new Error("Set STUDENT_API_BASE_URL and STUDENT_API_BEARER in the process environment.");
const target = new URL(base);
if (target.protocol !== "https:" && !(target.protocol === "http:" && ["localhost", "127.0.0.1"].includes(target.hostname))) {
  throw new Error("The API must use HTTPS or a local development origin.");
}
const origin = process.env.STUDENT_WEB_ORIGIN ?? "http://127.0.0.1:5173";
let failed = 0;
async function check(path, validate) {
  try {
    const response = await fetch(`${base}${path}`, {
      headers: { Authorization: `Bearer ${bearer}`, Origin: origin },
      signal: AbortSignal.timeout(15_000),
    });
    console.log(`${response.ok ? "HTTP OK" : "HTTP FAIL"} ${path}: ${response.status}`);
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("access-control-allow-origin"), origin, "Frontend origin must be allowed by API CORS.");
    const body = await response.json();
    assert.equal(body.ok, true);
    validate(body.data);
    return body.data;
  } catch {
    failed += 1;
    console.error(`FAIL ${path}: HTTP, CORS or response contract check failed.`);
    return null;
  }
}

const methods = await check("/v1/auth/methods", (data) => assert.ok(["medway", "elite", "nexus"].includes(data.brandCode)));
await check("/v1/student/me", (data) => {
  assert.equal(typeof data.fullName, "string");
  assert.equal(data.brand.code, methods?.brandCode);
  assert.ok(["not_issued", "unclaimed", "claimed"].includes(data.claimStatus));
});
await check("/v1/student/progress", (data) => {
  assert.equal(typeof data.totalCompletedLessons, "number");
  assert.ok(Array.isArray(data.weekDays));
  assert.ok(Array.isArray(data.courses));
});
await check("/v1/student/preferences", (data) => {
  assert.ok(data.weeklyLessonGoal === null || Number.isInteger(data.weeklyLessonGoal));
  assert.ok(data.version === null || Number.isInteger(data.version));
});
await check("/v1/student/assignments", (data) => assert.ok(Array.isArray(data)));
if (methods) {
  for (const view of ["mine", "explore"]) {
    await check(`/v1/student/courses?view=${view}&brand=${methods.brandCode}&page=1&pageSize=25`, (data) => {
      assert.ok(Array.isArray(data.items));
      assert.equal(typeof data.pagination.totalItems, "number");
      for (const item of data.items) assert.equal(item.brand.code, methods.brandCode);
    });
  }
}
console.log(`Home API checks: ${failed === 0 ? "passed" : `${failed} failed`}. GET requests only; no Student data was modified.`);
if (failed) process.exitCode = 1;
