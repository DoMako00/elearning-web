import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdir, writeFile } from "node:fs/promises";

// Offline generation. TestSprite must implement the described bindings in its setup.
const require = createRequire(import.meta.url);
const { openApiDocument } = require("../dist/http/openapi.js");
const endpoints = {
  "/health": { auth: "public" }, "/ready": { auth: "public" },
  "/openapi.json": { auth: "public" }, "/docs": { auth: "public" },
  "/v1/admin/curriculum/institutions": { auth: "admin", produces: ["academic_level_id", "semester_id"], selector: "Select BUC, levelNumber=1, semesterNumber=1 from data[].levels[].semesters[]. Preserve parent relationships." },
  "/v1/admin/curriculum/levels": { auth: "admin" },
  "/v1/admin/curriculum/semesters": { auth: "admin" },
  "/v1/admin/curriculum/brand-access": { auth: "admin", produces: ["brand_id", "elite_brand_id"], selector: "Select exactly one data[] entry with code=elite; capture id and require BUC in allowedAcademicInstitutions." },
  "/v1/admin/instructors": { auth: "admin", produces: ["instructor_id"], selector: "Capture id of a real returned instructor selected for test scope. Empty lists block dependents." },
  "/v1/admin/students": { auth: "admin", produces: ["admin_student_id"], selector: "Select only the preapproved controlled student from data.data[]; retain id privately. Empty lists are valid." },
  "/v1/admin/brands/{brandId}/courses": { auth: "admin", requires: { brandId: "elite_brand_id" }, produces: ["course_id"], selector: "Select Biochemistry Fundamentals from data[]; capture id after verifying brandId equals elite_brand_id." },
  "/v1/admin/brands/{brandId}/courses/{courseId}/chapters": { auth: "admin", requires: { brandId: "elite_brand_id", courseId: "course_id" } },
  "/v1/admin/brands/{brandId}/courses/{courseId}/lessons": { auth: "admin", requires: { brandId: "elite_brand_id", courseId: "course_id" } },
  "/v1/admin/brands/{brandId}/courses/{courseId}/resources": { auth: "admin", requires: { brandId: "elite_brand_id", courseId: "course_id" } },
  "/v1/student/courses": { auth: "student", produces: ["biochemistry_course_id"], selector: "Use brand=elite&page=1&pageSize=25. Verify five expected BUC Y1S1 subjects, then capture courseId of Biochemistry Fundamentals from data.items[]." },
  "/v1/student/courses/{courseId}": { auth: "student", requires: { courseId: "biochemistry_course_id" } },
  "/v1/student/courses/{courseId}/lessons": { auth: "student", requires: { courseId: "biochemistry_course_id" } },
};
const paths = {};
for (const [path, metadata] of Object.entries(endpoints)) {
  const operation = openApiDocument.paths[path]?.get;
  assert.ok(operation, "Required MVP-A GET operation absent from source OpenAPI");
  assert.ok(!(operation.parameters ?? []).some(p => p.name?.toLowerCase() === "idempotency-key"), "GET must not require Idempotency-Key");
  assert.equal((operation.security ?? []).length > 0, metadata.auth !== "public", "Auth contract mismatch");
  for (const p of operation.parameters ?? []) if (p.in === "path") assert.ok(metadata.requires?.[p.name], "Path needs a real producer dependency");
  paths[path] = { get: { ...structuredClone(operation), "x-mvp-auth": metadata.auth,
    "x-mvp-producer": metadata.produces ?? [], "x-mvp-bindings": metadata.requires ?? {},
    "x-mvp-selection": metadata.selector ?? "",
    "x-mvp-missing-dependency": "blocked: do not send a request or invent an identifier" } };
}
const components = {};
const pending = [paths]; const found = new Set();
while (pending.length) {
  const value = pending.pop();
  if (!value || typeof value !== "object") continue;
  if (value.$ref) {
    assert.ok(value.$ref.startsWith("#/components/"), "Only local references are allowed");
    const [, , group, name] = value.$ref.split("/");
    if (!found.has(value.$ref)) {
      const component = openApiDocument.components[group]?.[name];
      assert.ok(component, "Dangling OpenAPI reference");
      found.add(value.$ref); (components[group] ??= {})[name] = structuredClone(component); pending.push(component);
    }
  }
  for (const child of Object.values(value)) pending.push(child);
}
components.securitySchemes = structuredClone(openApiDocument.components.securitySchemes);
const subset = {
  openapi: openApiDocument.openapi,
  info: { title: "Backend MVP-A Course/Lesson visibility - TestSprite handoff", version: "1.0.0",
    description: "Read-only generation contract. Real Student/Admin credentials are separate. Missing producers block dependents. This file is not evidence of a TestSprite run." },
  servers: [{ url: "http://72.61.87.212:8080/api", description: "Owner-supplied server; verify deployment and target before authenticated acceptance." }],
  paths, components,
};
function omitExamples(value) {
  if (!value || typeof value !== "object") return;
  delete value.example; delete value.examples;
  for (const child of Object.values(value)) omitExamples(child);
}
omitExamples(subset);
await mkdir(new URL("../docs/testing/", import.meta.url), { recursive: true });
await writeFile(new URL("../docs/testing/backend-mvp-a.openapi.json", import.meta.url), JSON.stringify(subset, null, 2) + "\n");
process.stdout.write("MVP-A read-only contract checked: " + Object.keys(paths).length + " GET paths; no mutations or example IDs.\n");

