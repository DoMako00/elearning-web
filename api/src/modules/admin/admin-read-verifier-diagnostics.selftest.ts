import { createApplication } from "../../app";
import { repositoryErr, repositoryOk } from "../../core/persistence";
import type { AdminM2ReadModel } from "./read-models";
import { ADMIN_READ_VERIFIER_DIAGNOSTICS_REQUEST, ADMIN_READ_VERIFIER_DIAGNOSTICS_RESPONSE, ADMIN_READ_VERIFIER_DIAGNOSTICS_VERSION, createAdminReadVerifierDiagnostics, installAdminReadVerifierDiagnosticsIpc, type VerifierIpcChannel } from "./admin-read-verifier-diagnostics";

function assert(value: unknown, message: string): asserts value { if (!value) throw new Error(message); }

function readModel(calls: string[]): AdminM2ReadModel {
  const empty = repositoryOk([]);
  const missing = repositoryErr({ code: "not_found" as const, message: "missing" });
  return {
    listAcademicLevels: async () => { calls.push("levels"); return empty; },
    listAcademicSemesters: async () => { calls.push("semesters"); return empty; },
    listAcademicModules: async () => { calls.push("modules"); return empty; },
    findAcademicModule: async () => { calls.push("module-detail"); return missing; },
    listInstructors: async () => { calls.push("instructors"); return empty; },
    findInstructor: async () => { calls.push("instructor-detail"); return missing; },
    listBrandInstructors: async () => { calls.push("brand-instructors"); return empty; },
    findBrandInstructor: async () => { calls.push("brand-instructor-detail"); return missing; },
    listInstructorCourseAssignments: async () => { calls.push("brand-instructor-courses"); return empty; },
    listBrandCourses: async () => { calls.push("brand-courses"); return empty; },
    findBrandCourse: async () => { calls.push("brand-course-detail"); return missing; },
    listCourseInstructors: async () => { calls.push("course-instructors"); return empty; },
  };
}

class FakeIpc implements VerifierIpcChannel {
  connected = true;
  readonly sent: unknown[] = [];
  private listener: ((message: unknown) => void) | undefined;
  send(message: unknown): boolean { this.sent.push(message); return true; }
  on(_event: "message", listener: (message: unknown) => void): void { this.listener = listener; }
  off(_event: "message", listener: (message: unknown) => void): void { if (this.listener === listener) this.listener = undefined; }
  emit(message: unknown): void { this.listener?.(message); }
}

export async function runAdminReadVerifierDiagnosticsSelfTest(): Promise<void> {
  assert(createAdminReadVerifierDiagnostics({}, {}) === undefined, "diagnostics must be disabled by default");
  for (const environment of [
    { ADMIN_READ_VERIFIER_DIAGNOSTICS: "enabled" },
    { ADMIN_READ_VERIFIER_DIAGNOSTICS: "true", NODE_ENV: "production", API_HOST: "127.0.0.1", ADMIN_COMMAND_SOURCE: "mock" },
    { ADMIN_READ_VERIFIER_DIAGNOSTICS: "true", NODE_ENV: "test", API_HOST: "0.0.0.0", ADMIN_COMMAND_SOURCE: "mock" },
    { ADMIN_READ_VERIFIER_DIAGNOSTICS: "true", NODE_ENV: "test", API_HOST: "127.0.0.1", ADMIN_COMMAND_SOURCE: "postgres" },
  ]) {
    try { createAdminReadVerifierDiagnostics(environment, { connected: false }); throw new Error("invalid diagnostic activation accepted"); } catch (error) { assert(error instanceof Error && error.message === "Admin read verifier diagnostics are unavailable for this runtime." || error instanceof Error && error.message === "Admin read verifier diagnostics configuration is invalid.", "activation guard must fail safely"); }
  }
  try { createApplication({ environment: { PERSISTENCE_PROVIDER: "mock", ADMIN_READ_VERIFIER_DIAGNOSTICS: "true", NODE_ENV: "test", API_HOST: "127.0.0.1", ADMIN_COMMAND_SOURCE: "mock" } }); throw new Error("application accepted diagnostics without IPC"); } catch (error) { assert(error instanceof Error && error.message === "Admin read verifier diagnostics are unavailable for this runtime.", "application must fail closed without IPC"); }

  const diagnostics = createAdminReadVerifierDiagnostics({ ADMIN_READ_VERIFIER_DIAGNOSTICS: "true", NODE_ENV: "test", API_HOST: "127.0.0.1", ADMIN_COMMAND_SOURCE: "mock" }, { connected: true, send: () => true });
  assert(diagnostics, "valid verifier child configuration must enable diagnostics");
  const calls: string[] = [];
  const wrapped = diagnostics.wrap(readModel(calls));
  await wrapped.listAcademicLevels();
  await wrapped.findAcademicModule({ moduleId: "module" });
  await wrapped.listInstructorCourseAssignments({ brandId: "brand", instructorId: "instructor" });
  const first = diagnostics.snapshot();
  assert(first.totalProtectedReadInvocations === 3 && first.curriculumLevelReads === 1 && first.curriculumModuleDetailReads === 1 && first.brandInstructorCourseReads === 1, "each wrapped operation must increment only its counter and total");
  assert(calls.length === 3, "wrapped operations must preserve delegation");
  try { (first as { curriculumLevelReads: number }).curriculumLevelReads = 99; } catch { /* frozen snapshots are expected. */ }
  assert(diagnostics.snapshot().curriculumLevelReads === 1, "snapshots must not mutate internal counters");

  const ipc = new FakeIpc();
  const dispose = installAdminReadVerifierDiagnosticsIpc(ipc, diagnostics);
  ipc.emit({ type: "unknown" });
  ipc.emit({ type: ADMIN_READ_VERIFIER_DIAGNOSTICS_REQUEST, version: ADMIN_READ_VERIFIER_DIAGNOSTICS_VERSION, nonce: "short" });
  assert(ipc.sent.length === 0, "invalid IPC messages must not expose diagnostics");
  const nonce = "diagnostic_nonce_123456";
  ipc.emit({ type: ADMIN_READ_VERIFIER_DIAGNOSTICS_REQUEST, version: ADMIN_READ_VERIFIER_DIAGNOSTICS_VERSION, nonce });
  const response = ipc.sent[0] as { type: string; version: number; nonce: string; counts: { totalProtectedReadInvocations: number } };
  assert(response.type === ADMIN_READ_VERIFIER_DIAGNOSTICS_RESPONSE && response.version === ADMIN_READ_VERIFIER_DIAGNOSTICS_VERSION && response.nonce === nonce && response.counts.totalProtectedReadInvocations === 3, "IPC snapshots must be allowlisted aggregate counts only");
  dispose();
  ipc.emit({ type: ADMIN_READ_VERIFIER_DIAGNOSTICS_REQUEST, version: ADMIN_READ_VERIFIER_DIAGNOSTICS_VERSION, nonce });
  assert(Number(ipc.sent.length) === 1, "IPC listener must be removed during shutdown");
}

if (process.argv[1]?.endsWith("admin-read-verifier-diagnostics.selftest.js")) runAdminReadVerifierDiagnosticsSelfTest().then(() => console.log("admin read verifier diagnostics selftest passed"));
