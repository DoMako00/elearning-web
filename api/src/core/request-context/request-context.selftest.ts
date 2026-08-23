import { createInMemoryRequestContextDependencies } from "./in-memory-request-context-factory";
import { buildRequestContext } from "./request-context-builder";
import type { RequestContextInput } from "./request-context-input";
import type { DeviceId, SessionId } from "../persistence";
import { medwayAdminVerificationAuthIdentityId } from "../auth";

const sessionId = (value: string) => value as SessionId;
const deviceId = (value: string) => value as DeviceId;

export type RequestContextSelfTestCaseResult = {
  readonly name: string;
  readonly passed: boolean;
  readonly details?: Record<string, unknown>;
};

export type RequestContextSelfTestRunResult = {
  readonly passed: boolean;
  readonly cases: readonly RequestContextSelfTestCaseResult[];
};

function assertEqual(actual: unknown, expected: unknown, message: string): void {
  if (actual !== expected) throw new Error(`${message}: expected ${String(expected)}, received ${String(actual)}`);
}

function assertTruthy(value: unknown, message: string): void {
  if (!value) throw new Error(message);
}

function assertFailure(result: { readonly ok: boolean }, code: string | undefined, actualCode: string | undefined): void {
  assertEqual(result.ok, false, "Expected a failed repository result");
  assertEqual(actualCode, code, "Unexpected failure code");
}

function baseInput(overrides: Partial<RequestContextInput> = {}): RequestContextInput {
  return {
    requestId: "request-context-selftest",
    correlationId: "corr-request-context-selftest",
    auth: { bearerToken: "mock-auth-medway-admin-001", correlationId: "corr-request-context-selftest" },
    requestedBrandCode: "medway",
    expectedActorType: "admin",
    ...overrides,
  };
}

async function recordCase(
  cases: RequestContextSelfTestCaseResult[],
  name: string,
  run: () => Promise<void> | void,
): Promise<void> {
  try {
    await run();
    cases.push({ name, passed: true });
  } catch (error) {
    cases.push({ name, passed: false, details: { message: error instanceof Error ? error.message : "Unexpected self-test failure." } });
  }
}

export async function runRequestContextSelfTest(): Promise<RequestContextSelfTestRunResult> {
  const cases: RequestContextSelfTestCaseResult[] = [];

  await recordCase(cases, "Medway admin context builds correctly", async () => {
    const result = await createInMemoryRequestContextDependencies().authIdentityAdapter.verifyRequestAuth({ bearerToken: "mock-auth-medway-admin-001" });
    assertTruthy(result.ok, "Mock admin identity should verify");
    if (result.ok) assertEqual(result.value.authIdentityId, medwayAdminVerificationAuthIdentityId, "Mock admin UUID identity");
    const deps = createInMemoryRequestContextDependencies();
    const context = await buildRequestContext(baseInput(), deps);
    assertTruthy(context.ok, "Medway admin context should build");
    if (context.ok) {
      assertEqual(context.value.activeBrandCode, "medway", "Admin brand code");
      assertEqual(context.value.adminProfileId, "admin-medway-001", "Admin profile");
      assertTruthy(context.value.permissions.includes("admin.students.read"), "Admin permission should come from profile repository");
    }
  });

  await recordCase(cases, "Elite admin context builds correctly", async () => {
    const deps = createInMemoryRequestContextDependencies();
    const result = await buildRequestContext(baseInput({
      correlationId: "corr-elite-admin",
      auth: { bearerToken: "mock-auth-elite-admin-001" },
      requestedBrandCode: "elite",
    }), deps);
    assertTruthy(result.ok, "Elite admin context should build");
    if (result.ok) assertEqual(result.value.activeBrandId, "brand-elite", "Elite brand ID");
  });

  await recordCase(cases, "Medway student context builds correctly", async () => {
    const deps = createInMemoryRequestContextDependencies();
    const result = await buildRequestContext(baseInput({
      auth: { bearerToken: "mock-auth-medway-student-001" },
      expectedActorType: "student",
      sessionId: sessionId("session-medway-student-001"),
      deviceId: deviceId("device-medway-student-001"),
    }), deps);
    assertTruthy(result.ok, "Student context should build");
    if (result.ok) {
      assertEqual(result.value.studentProfileId, "student-medway-001", "Student profile");
      assertEqual(result.value.permissions.length, 0, "Student admin permissions");
    }
  });

  await recordCase(cases, "Unknown auth identity is rejected", async () => {
    const result = await buildRequestContext(baseInput({ auth: { bearerToken: "unknown" } }), createInMemoryRequestContextDependencies());
    assertFailure(result, "authentication_invalid", result.ok ? undefined : result.error.code);
  });

  await recordCase(cases, "Unknown brand is rejected", async () => {
    const result = await buildRequestContext(baseInput({ requestedBrandCode: "unknown" as never }), createInMemoryRequestContextDependencies());
    assertFailure(result, "brand_not_found", result.ok ? undefined : result.error.code);
  });

  await recordCase(cases, "Medway actor targeting Elite is rejected", async () => {
    const result = await buildRequestContext(baseInput({ targetBrandCode: "elite" }), createInMemoryRequestContextDependencies());
    assertFailure(result, "target_brand_mismatch", result.ok ? undefined : result.error.code);
  });

  await recordCase(cases, "Elite actor targeting Medway is rejected", async () => {
    const result = await buildRequestContext(baseInput({ auth: { bearerToken: "mock-auth-elite-admin-001" }, requestedBrandCode: "elite", targetBrandCode: "medway" }), createInMemoryRequestContextDependencies());
    assertFailure(result, "target_brand_mismatch", result.ok ? undefined : result.error.code);
  });

  await recordCase(cases, "Session owned by another same-brand user is rejected", async () => {
    const result = await buildRequestContext(baseInput({ sessionId: sessionId("session-medway-student-001") }), createInMemoryRequestContextDependencies());
    assertFailure(result, "session_user_mismatch", result.ok ? undefined : result.error.code);
  });

  await recordCase(cases, "Revoked device is rejected", async () => {
    const result = await buildRequestContext(baseInput({ deviceId: deviceId("device-medway-revoked-001") }), createInMemoryRequestContextDependencies());
    assertFailure(result, "device_revoked", result.ok ? undefined : result.error.code);
  });

  await recordCase(cases, "Auth identity does not supply admin permissions", async () => {
    const result = await buildRequestContext(baseInput(), createInMemoryRequestContextDependencies());
    assertTruthy(result.ok, "Admin context should build");
    if (result.ok) {
      assertTruthy(result.value.permissions.includes("admin.security.read"), "Profile permissions should be present");
      assertEqual(result.value.permissions.includes("admin.students.suspend"), false, "Auth adapter must not inject permissions");
    }
  });

  await recordCase(cases, "Student context has no admin permissions", async () => {
    const result = await buildRequestContext(baseInput({ auth: { bearerToken: "mock-auth-medway-student-001" }, expectedActorType: "student" }), createInMemoryRequestContextDependencies());
    assertTruthy(result.ok, "Student context should build");
    if (result.ok) assertEqual(result.value.permissions.length, 0, "Student permissions");
  });

  await recordCase(cases, "Successful context preserves correlation ID", async () => {
    const result = await buildRequestContext(baseInput({ correlationId: "corr-preserved-001" }), createInMemoryRequestContextDependencies());
    assertTruthy(result.ok, "Context should build");
    if (result.ok) assertEqual(result.value.correlationId, "corr-preserved-001", "Correlation ID");
  });

  return { passed: cases.every((testCase) => testCase.passed), cases };
}
