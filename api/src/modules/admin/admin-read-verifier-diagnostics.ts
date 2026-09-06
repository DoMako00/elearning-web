import type { AdminM2ReadModel } from "./read-models";

export interface AdminReadVerifierDiagnosticsCounts {
  readonly totalProtectedReadInvocations: number;
  readonly curriculumLevelReads: number;
  readonly curriculumSemesterReads: number;
  readonly curriculumModuleReads: number;
  readonly curriculumModuleDetailReads: number;
  readonly globalInstructorReads: number;
  readonly globalInstructorDetailReads: number;
  readonly brandInstructorReads: number;
  readonly brandInstructorCourseReads: number;
  readonly brandCourseReads: number;
  readonly brandCourseDetailReads: number;
  readonly courseInstructorReads: number;
}

export const ADMIN_READ_VERIFIER_DIAGNOSTICS_REQUEST = "admin-read-verifier-diagnostics:snapshot";
export const ADMIN_READ_VERIFIER_DIAGNOSTICS_RESPONSE = "admin-read-verifier-diagnostics:snapshot-result";
export const ADMIN_READ_VERIFIER_DIAGNOSTICS_VERSION = 1;

type CountKey = Exclude<keyof AdminReadVerifierDiagnosticsCounts, "totalProtectedReadInvocations">;

export interface VerifierProcessState {
  readonly connected?: boolean;
  readonly send?: (message: unknown) => boolean;
}

export interface VerifierIpcChannel extends VerifierProcessState {
  on(event: "message", listener: (message: unknown) => void): unknown;
  off(event: "message", listener: (message: unknown) => void): unknown;
}

export interface AdminReadVerifierDiagnostics {
  readonly wrap: (readModel: AdminM2ReadModel) => AdminM2ReadModel;
  readonly snapshot: () => AdminReadVerifierDiagnosticsCounts;
}

const countKeys: readonly CountKey[] = [
  "curriculumLevelReads",
  "curriculumSemesterReads",
  "curriculumModuleReads",
  "curriculumModuleDetailReads",
  "globalInstructorReads",
  "globalInstructorDetailReads",
  "brandInstructorReads",
  "brandInstructorCourseReads",
  "brandCourseReads",
  "brandCourseDetailReads",
  "courseInstructorReads",
];

function emptyCounts(): Record<keyof AdminReadVerifierDiagnosticsCounts, number> {
  return { totalProtectedReadInvocations: 0, curriculumLevelReads: 0, curriculumSemesterReads: 0, curriculumModuleReads: 0, curriculumModuleDetailReads: 0, globalInstructorReads: 0, globalInstructorDetailReads: 0, brandInstructorReads: 0, brandInstructorCourseReads: 0, brandCourseReads: 0, brandCourseDetailReads: 0, courseInstructorReads: 0 };
}

function isEnabled(environment: Readonly<Record<string, string | undefined>>): boolean {
  const value = environment.ADMIN_READ_VERIFIER_DIAGNOSTICS;
  if (value === undefined || value === "") return false;
  if (value !== "true") throw new Error("Admin read verifier diagnostics configuration is invalid.");
  return true;
}

function validateActivation(environment: Readonly<Record<string, string | undefined>>, processState: VerifierProcessState): void {
  if (environment.NODE_ENV === "production" || environment.API_HOST !== "127.0.0.1" || environment.ADMIN_COMMAND_SOURCE !== "mock" || processState.connected !== true || typeof processState.send !== "function") {
    throw new Error("Admin read verifier diagnostics are unavailable for this runtime.");
  }
}

export function createAdminReadVerifierDiagnostics(
  environment: Readonly<Record<string, string | undefined>> = process.env,
  processState: VerifierProcessState = process,
): AdminReadVerifierDiagnostics | undefined {
  if (!isEnabled(environment)) return undefined;
  validateActivation(environment, processState);
  const counts = emptyCounts();
  const increment = (key: CountKey): void => {
    if (!Number.isSafeInteger(counts.totalProtectedReadInvocations) || !Number.isSafeInteger(counts[key])) throw new Error("Admin read verifier diagnostics counter overflow.");
    counts.totalProtectedReadInvocations += 1;
    counts[key] += 1;
  };
  const snapshot = (): AdminReadVerifierDiagnosticsCounts => Object.freeze({ ...counts });
  return {
    snapshot,
    wrap: (readModel) => ({
      listAcademicLevels: (input) => { increment("curriculumLevelReads"); return readModel.listAcademicLevels(input); },
      listAcademicSemesters: (input) => { increment("curriculumSemesterReads"); return readModel.listAcademicSemesters(input); },
      listAcademicModules: (input) => { increment("curriculumModuleReads"); return readModel.listAcademicModules(input); },
      findAcademicModule: (input) => { increment("curriculumModuleDetailReads"); return readModel.findAcademicModule(input); },
      listInstructors: (input) => { increment("globalInstructorReads"); return readModel.listInstructors(input); },
      findInstructor: (input) => { increment("globalInstructorDetailReads"); return readModel.findInstructor(input); },
      listInstructorBrandAssignments: (input) => { increment("brandInstructorReads"); return readModel.listInstructorBrandAssignments(input); },
      listBrandInstructors: (input) => { increment("brandInstructorReads"); return readModel.listBrandInstructors(input); },
      findBrandInstructor: (input) => { increment("brandInstructorReads"); return readModel.findBrandInstructor(input); },
      listInstructorCourseAssignments: (input) => { increment("brandInstructorCourseReads"); return readModel.listInstructorCourseAssignments(input); },
      listBrandCourses: (input) => { increment("brandCourseReads"); return readModel.listBrandCourses(input); },
      findBrandCourse: (input) => { increment("brandCourseDetailReads"); return readModel.findBrandCourse(input); },
      listCourseInstructors: (input) => { increment("courseInstructorReads"); return readModel.listCourseInstructors(input); },
      listCourseChapters: (input) => readModel.listCourseChapters(input),
      listCourseLessons: (input) => readModel.listCourseLessons(input),
      listLessonResources: (input) => readModel.listLessonResources(input),
    }),
  };
}

function validNonce(value: unknown): value is string {
  return typeof value === "string" && /^[A-Za-z0-9_-]{16,128}$/.test(value);
}

export function installAdminReadVerifierDiagnosticsIpc(channel: VerifierIpcChannel, diagnostics: AdminReadVerifierDiagnostics): () => void {
  const listener = (message: unknown): void => {
    if (!message || typeof message !== "object") return;
    const request = message as { readonly type?: unknown; readonly version?: unknown; readonly nonce?: unknown };
    if (request.type !== ADMIN_READ_VERIFIER_DIAGNOSTICS_REQUEST || request.version !== ADMIN_READ_VERIFIER_DIAGNOSTICS_VERSION || !validNonce(request.nonce) || channel.connected !== true || typeof channel.send !== "function") return;
    try {
      channel.send({ type: ADMIN_READ_VERIFIER_DIAGNOSTICS_RESPONSE, version: ADMIN_READ_VERIFIER_DIAGNOSTICS_VERSION, nonce: request.nonce, counts: diagnostics.snapshot() });
    } catch {
      // IPC disconnection during shutdown is intentionally silent.
    }
  };
  channel.on("message", listener);
  return () => { channel.off("message", listener); };
}

export function isAdminReadVerifierDiagnosticsCounts(value: unknown): value is AdminReadVerifierDiagnosticsCounts {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  return Object.keys(candidate).length === countKeys.length + 1
    && Object.keys(candidate).every((key) => key === "totalProtectedReadInvocations" || countKeys.includes(key as CountKey))
    && Object.values(candidate).every((count) => Number.isSafeInteger(count) && (count as number) >= 0);
}
