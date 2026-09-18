import { createPersistenceRuntimeComposition } from "../../infrastructure/persistence-runtime-composition";
import { createAdminHttpRequestContextResolver, AdminHttpContextConfigurationError } from "./admin-http-context-source";

function assert(value: unknown, message: string): asserts value { if (!value) throw new Error(message); }

export function runAdminHttpContextSourceSelfTest(): void {
  const persistence = createPersistenceRuntimeComposition({ environment: { AUTH_PROVIDER: "mock" } });
  const mock = createAdminHttpRequestContextResolver({ persistence, environment: { AUTH_PROVIDER: "mock" } });
  assert(mock, "mock provider composition");
  const supabase = createAdminHttpRequestContextResolver({ persistence, environment: { AUTH_PROVIDER: "supabase", SUPABASE_PROJECT_REF: "abcdefghijklmnopqrst" } });
  assert(supabase, "Supabase provider composition");
  try {
    createAdminHttpRequestContextResolver({ persistence, environment: { AUTH_PROVIDER: "supabase" } });
    throw new Error("invalid Supabase configuration must fail closed");
  } catch (error) {
    assert(error instanceof AdminHttpContextConfigurationError, "invalid configuration error type");
  }
}

if (process.argv[1]?.endsWith("admin-http-context-source.selftest.js")) { runAdminHttpContextSourceSelfTest(); console.log("Admin HTTP context source selftest passed"); }
