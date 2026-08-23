/** This self-test is exported for future tooling and is not executed automatically. */

import type { IncomingMessage, ServerResponse } from "node:http";
import { createApplication } from "../app";
import { createHttpApp } from "./http-app";

export type HttpSmokeSelfTestCaseResult = { name: string; passed: boolean; details?: Record<string, unknown> };
export type HttpSmokeSelfTestRunResult = { passed: boolean; cases: HttpSmokeSelfTestCaseResult[] };

type CapturedResponse = { readonly statusCode: number; readonly headers: Readonly<Record<string, string>>; readonly body: Record<string, unknown>; readonly serializedBody: string };

function assertEqual(actual: unknown, expected: unknown, message: string): void {
  if (actual !== expected) throw new Error(`${message}: expected ${String(expected)}, received ${String(actual)}`);
}

function assertTruthy(value: unknown, message: string): void {
  if (!value) throw new Error(message);
}

function assertNoUnsafeErrorPayload(body: unknown): void {
  const serialized = JSON.stringify(body).toLowerCase();
  for (const unsafeWord of ["stack", "trace", "token", "secret", "password", "providerpayload", "rawpayload"]) {
    if (serialized.includes(unsafeWord)) throw new Error(`Unsafe error payload term detected: ${unsafeWord}`);
  }
}

async function recordCase(name: string, fn: () => void | Promise<void>): Promise<HttpSmokeSelfTestCaseResult> {
  try { await fn(); return { name, passed: true }; }
  catch (error) { return { name, passed: false, details: { message: error instanceof Error ? error.message : "Unexpected smoke-test failure." } }; }
}

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Expected a JSON object.");
  return value as Record<string, unknown>;
}

function responseError(body: Record<string, unknown>): Record<string, unknown> {
  return asRecord(body.error);
}

export async function runHttpSmokeSelfTest(): Promise<HttpSmokeSelfTestRunResult> {
  const application = createApplication();
  const handler = createHttpApp({ admin: application.admin });
  const invoke = async (method: string, url: string, headers: Readonly<Record<string, string>> = {}): Promise<CapturedResponse> => {
    const responseHeaders: Record<string, string> = {};
    let serializedBody = "";
    const response = {
      statusCode: 200,
      setHeader(name: string, value: string | number) { responseHeaders[name.toLowerCase()] = String(value); },
      end(body: string | undefined) { serializedBody = body ?? ""; },
    } as unknown as ServerResponse;
    const request = { method, url, headers } as unknown as IncomingMessage;
    await handler(request, response);
    return { statusCode: response.statusCode, headers: responseHeaders, body: asRecord(JSON.parse(serializedBody)), serializedBody };
  };
  const cases: HttpSmokeSelfTestCaseResult[] = [];

  cases.push(await recordCase("GET /health returns ok", async () => {
    const response = await invoke("GET", "/health");
    assertEqual(response.statusCode, 200, "Health status");
    assertEqual(response.body.status, "ok", "Health body status");
    assertEqual(response.body.service, "api", "Health service");
    assertEqual(response.body.runtime, "http-skeleton", "Health runtime");
    assertTruthy(response.headers["x-correlation-id"], "Health correlation header");
  }));

  cases.push(await recordCase("GET /ready returns ready", async () => {
    const response = await invoke("GET", "/ready");
    const checks = asRecord(response.body.checks);
    assertEqual(response.statusCode, 200, "Readiness status");
    assertEqual(response.body.status, "ready", "Readiness body status");
    assertEqual(checks.adminModule, "ok", "Admin module check");
    assertEqual(checks.providers, "not_configured", "Provider check");
    assertEqual(checks.database, "not_configured", "Database check");
    assertEqual(checks.auth, "not_configured", "Auth check");
  }));

  cases.push(await recordCase("GET /v1/admin/curriculum/levels returns an empty mock list", async () => {
    const response = await invoke("GET", "/v1/admin/curriculum/levels");
    assertEqual(response.statusCode, 200, "Curriculum levels status");
    assertEqual(response.body.ok, true, "Curriculum levels response");
    assertTruthy(Array.isArray(response.body.data) && response.body.data.length === 0, "Curriculum levels must be mock-empty");
  }));

  cases.push(await recordCase("GET /v1/admin/instructors returns an empty mock list", async () => {
    const response = await invoke("GET", "/v1/admin/instructors");
    assertEqual(response.statusCode, 200, "Instructors status");
    assertEqual(response.body.ok, true, "Instructors response");
    assertTruthy(Array.isArray(response.body.data) && response.body.data.length === 0, "Instructors must be mock-empty");
  }));

  cases.push(await recordCase("M2 no-filter routes reject unsupported or repeated query parameters", async () => {
    const validBrandId = "00000000-0000-4000-8000-000000000001";
    const validResourceId = "00000000-0000-4000-8000-000000000002";
    for (const url of [
      "/v1/admin/curriculum/levels?unexpected=value",
      "/v1/admin/curriculum/levels?unexpected=value&unexpected=again",
      "/v1/admin/instructors?unexpected=value",
      `/v1/admin/curriculum/modules/${validResourceId}?unexpected=value`,
      `/v1/admin/brands/${validBrandId}/instructors?unexpected=value`,
      `/v1/admin/brands/${validBrandId}/courses/${validResourceId}?unexpected=value`,
    ]) {
      const response = await invoke("GET", url);
      assertEqual(response.statusCode, 400, `Unsupported M2 query status for ${url}`);
      assertEqual(response.body.ok, false, `Unsupported M2 query response for ${url}`);
      assertNoUnsafeErrorPayload(response.body);
    }
  }));

  cases.push(await recordCase("M2 supported filters and valid no-filter requests retain their behavior", async () => {
    const validBrandId = "00000000-0000-4000-8000-000000000001";
    const validResourceId = "00000000-0000-4000-8000-000000000002";
    for (const url of [
      "/v1/admin/curriculum/semesters?levelId=00000000-0000-4000-8000-000000000003",
      "/v1/admin/curriculum/modules?semesterId=00000000-0000-4000-8000-000000000004",
      `/v1/admin/brands/${validBrandId}/courses?academicModuleId=${validResourceId}`,
      `/v1/admin/brands/${validBrandId}/courses?scope=standalone`,
    ]) {
      const response = await invoke("GET", url);
      assertEqual(response.statusCode, 200, `Supported M2 filter status for ${url}`);
    }
    const response = await invoke("GET", "/v1/admin/curriculum/levels");
    assertEqual(response.statusCode, 200, "Valid no-filter M2 request status");
  }));

  cases.push(await recordCase("M2 brand-course filters reject conflicts and repeated unsupported parameters", async () => {
    const validBrandId = "00000000-0000-4000-8000-000000000001";
    const validModuleId = "00000000-0000-4000-8000-000000000002";
    for (const url of [
      `/v1/admin/brands/${validBrandId}/courses?academicModuleId=${validModuleId}&scope=standalone`,
      `/v1/admin/brands/${validBrandId}/courses?unexpected=value&unexpected=again`,
    ]) {
      const response = await invoke("GET", url);
      assertEqual(response.statusCode, 400, `Invalid M2 course filter status for ${url}`);
    }
  }));

  cases.push(await recordCase("POST M2 route is rejected before a read", async () => {
    const response = await invoke("POST", "/v1/admin/curriculum/levels");
    assertEqual(response.statusCode, 405, "M2 POST status");
    assertTruthy(response.headers.allow?.includes("GET"), "M2 POST allow header");
  }));

  cases.push(await recordCase("GET /v1/admin/overview requires brand", async () => {
    const response = await invoke("GET", "/v1/admin/overview");
    assertEqual(response.statusCode, 400, "Missing brand status");
    assertEqual(response.body.ok, false, "Missing brand response");
    assertTruthy(response.headers["x-correlation-id"], "Missing brand correlation header");
    assertTruthy(typeof responseError(response.body).message === "string", "Missing brand safe error message");
    assertNoUnsafeErrorPayload(response.body);
  }));

  cases.push(await recordCase("GET /v1/admin/overview rejects invalid brand", async () => {
    const response = await invoke("GET", "/v1/admin/overview?brand=unknown");
    assertEqual(response.statusCode, 400, "Invalid brand status");
    assertEqual(response.body.ok, false, "Invalid brand response");
    assertTruthy(!("data" in response.body), "Invalid brand must not load overview data");
    assertNoUnsafeErrorPayload(response.body);
  }));

  for (const [brandCode, brandId, correlationId, otherBrand] of [["medway", "brand-medway", "smoke-medway-001", "elite"], ["elite", "brand-elite", "smoke-elite-001", "medway"]] as const) {
    cases.push(await recordCase(`GET /v1/admin/overview returns ${brandCode === "medway" ? "Medway" : "Elite"} overview`, async () => {
      const response = await invoke("GET", `/v1/admin/overview?brand=${brandCode}`, { "x-correlation-id": correlationId });
      const brand = asRecord(response.body.brand);
      const data = asRecord(response.body.data);
      assertEqual(response.statusCode, 200, `${brandCode} overview status`);
      assertEqual(response.body.ok, true, `${brandCode} overview response`);
      assertEqual(response.body.correlationId, correlationId, `${brandCode} correlation ID`);
      assertEqual(brand.brandCode, brandCode, `${brandCode} brand code`);
      assertEqual(brand.brandId, brandId, `${brandCode} brand ID`);
      assertTruthy(data.counts && typeof data.counts === "object", `${brandCode} overview counts`);
      assertTruthy(!JSON.stringify(brand).toLowerCase().includes(otherBrand), `${brandCode} top-level brand isolation`);
    }));
  }

  cases.push(await recordCase("GET /v1/admin/overview does not allow POST", async () => {
    const response = await invoke("POST", "/v1/admin/overview?brand=medway");
    assertEqual(response.statusCode, 405, "POST overview status");
    assertTruthy(response.headers.allow?.includes("GET"), "POST overview allow header");
    assertEqual(response.body.ok, false, "POST overview response");
    assertNoUnsafeErrorPayload(response.body);
  }));

  cases.push(await recordCase("unknown route returns 404", async () => {
    const response = await invoke("GET", "/unknown");
    assertEqual(response.statusCode, 404, "Unknown route status");
    assertEqual(response.body.ok, false, "Unknown route response");
    assertTruthy(response.headers["x-correlation-id"], "Unknown route correlation header");
    assertNoUnsafeErrorPayload(response.body);
  }));

  return { passed: cases.every((testCase) => testCase.passed), cases };
}
