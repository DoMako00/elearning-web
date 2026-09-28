import {
  createSupabaseBoundaryDiagnostics,
  resolveSupabaseBoundaryConfiguration,
  type SupabaseBoundaryEnvironment,
} from "./supabase-config";
import { createSupabaseAdapterBoundary } from "./supabase-adapter.factory";
import { SupabaseBoundaryConfigurationError } from "./supabase-errors";

export interface SupabaseBoundarySelfTestCaseResult {
  readonly name: string;
  readonly passed: boolean;
  readonly details?: Readonly<Record<string, unknown>>;
}

export interface SupabaseBoundarySelfTestRunResult {
  readonly passed: boolean;
  readonly cases: readonly SupabaseBoundarySelfTestCaseResult[];
}

const secretKey = "selftest-secret-key-must-not-appear";
const databaseUrl = "selftest-db-url-must-not-appear";

function assertEqual(actual: unknown, expected: unknown, message: string): void {
  if (actual !== expected) throw new Error(`${message}: expected ${String(expected)}, received ${String(actual)}`);
}

function assertTruthy(value: unknown, message: string): void {
  if (!value) throw new Error(message);
}

function assertThrows(run: () => unknown, code: SupabaseBoundaryConfigurationError["code"]): void {
  try {
    run();
  } catch (error) {
    if (!(error instanceof SupabaseBoundaryConfigurationError)) throw error;
    assertEqual(error.code, code, "Unexpected configuration error code");
    const serialized = JSON.stringify(error).concat(error.message);
    assertEqual(serialized.includes(secretKey), false, "Secret key leaked into error");
    assertEqual(serialized.includes(databaseUrl), false, "Database URL leaked into error");
    return;
  }
  throw new Error("Expected configuration parsing to throw.");
}

async function recordCase(
  cases: SupabaseBoundarySelfTestCaseResult[],
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

function validSupabaseEnvironment(): SupabaseBoundaryEnvironment {
  return {
    PERSISTENCE_PROVIDER: "supabase",
    AUTH_PROVIDER: "mock",
    SUPABASE_URL: "https://example.invalid",
    SUPABASE_PROJECT_REF: "staging-project-ref",
    SUPABASE_PUBLISHABLE_KEY: "selftest-publishable-key",
    SUPABASE_SECRET_KEY: secretKey,
    SUPABASE_DB_URL: databaseUrl,
  };
}

/** Deterministic and local-only; this function never runs on module import. */
export async function runSupabaseBoundarySelfTest(): Promise<SupabaseBoundarySelfTestRunResult> {
  const cases: SupabaseBoundarySelfTestCaseResult[] = [];

  await recordCase(cases, "Default environment resolves to mock with safe schema gates", () => {
    const configuration = resolveSupabaseBoundaryConfiguration({});
    assertEqual(configuration.persistenceProvider, "mock", "Default persistence provider");
    assertEqual(configuration.authProvider, "mock", "Default auth provider");
    assertEqual(configuration.appSchema, "app", "Default app schema");
    assertEqual(configuration.exposeAppSchema, false, "Default schema exposure");
    assertEqual(configuration.rlsRequiredBeforeExposure, true, "Default RLS exposure gate");
  });

  await recordCase(cases, "Mock mode does not initialize Supabase with missing configuration", () => {
    const boundary = createSupabaseAdapterBoundary(resolveSupabaseBoundaryConfiguration({}));
    assertEqual(boundary.kind, "mock-disabled", "Mock boundary kind");
    assertEqual(boundary.externalInitialization, "not-attempted", "Mock external initialization");
  });

  await recordCase(cases, "Supabase mode rejects missing URL", () => {
    assertThrows(() => createSupabaseAdapterBoundary(resolveSupabaseBoundaryConfiguration({ PERSISTENCE_PROVIDER: "supabase" })), "missing_required_configuration");
  });

  await recordCase(cases, "Supabase mode rejects missing server-side configuration", () => {
    const environment = { ...validSupabaseEnvironment(), SUPABASE_SECRET_KEY: undefined };
    assertThrows(() => createSupabaseAdapterBoundary(resolveSupabaseBoundaryConfiguration(environment)), "missing_required_configuration");
  });

  await recordCase(cases, "Invalid provider and boolean values reject predictably", () => {
    assertThrows(() => resolveSupabaseBoundaryConfiguration({ PERSISTENCE_PROVIDER: "postgres" }), "invalid_provider");
    assertThrows(() => resolveSupabaseBoundaryConfiguration({ SUPABASE_EXPOSE_APP_SCHEMA: "yes" }), "invalid_boolean");
  });

  await recordCase(cases, "Diagnostics redact secret values", () => {
    const diagnostics = createSupabaseBoundaryDiagnostics(resolveSupabaseBoundaryConfiguration(validSupabaseEnvironment()));
    const serialized = JSON.stringify(diagnostics);
    assertEqual(serialized.includes(secretKey), false, "Secret key leaked into diagnostics");
    assertEqual(serialized.includes(databaseUrl), false, "Database URL leaked into diagnostics");
    assertTruthy(diagnostics.secretKeyConfigured, "Secret key presence flag");
    assertTruthy(diagnostics.dbUrlConfigured, "DB URL presence flag");
  });

  await recordCase(cases, "Valid Supabase configuration remains unimplemented and disconnected", () => {
    const boundary = createSupabaseAdapterBoundary(resolveSupabaseBoundaryConfiguration(validSupabaseEnvironment()));
    assertEqual(boundary.kind, "supabase-configured-not-implemented", "Supabase boundary kind");
    assertEqual(boundary.externalInitialization, "not-attempted", "Supabase external initialization");
  });

  return { passed: cases.every((testCase) => testCase.passed), cases };
}
