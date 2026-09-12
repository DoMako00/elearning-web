import {
  createSupabaseBoundaryDiagnostics,
  type SupabaseBoundaryConfiguration,
} from "./supabase-config";
import { SupabaseBoundaryConfigurationError } from "./supabase-errors";
import type { SupabaseAdapterBoundary } from "./supabase-adapter";

const requiredSupabaseVariables = [
  ["SUPABASE_URL", (configuration: SupabaseBoundaryConfiguration) => Boolean(configuration.url)],
  ["SUPABASE_PROJECT_REF", (configuration: SupabaseBoundaryConfiguration) => Boolean(configuration.projectRef)],
  ["SUPABASE_SECRET_KEY", (configuration: SupabaseBoundaryConfiguration) => configuration.secretKeyConfigured],
  ["SUPABASE_DB_URL", (configuration: SupabaseBoundaryConfiguration) => configuration.dbUrlConfigured],
] as const;

function assertRequiredSupabaseConfiguration(configuration: SupabaseBoundaryConfiguration): void {
  for (const [variableName, isConfigured] of requiredSupabaseVariables) {
    if (!isConfigured(configuration)) {
      throw new SupabaseBoundaryConfigurationError(
        "missing_required_configuration",
        `${variableName} is required when PERSISTENCE_PROVIDER=supabase.`,
        variableName,
      );
    }
  }
}

/** Validates configuration only; it never creates a Supabase or database client. */
export function createSupabaseAdapterBoundary(
  configuration: SupabaseBoundaryConfiguration,
): SupabaseAdapterBoundary {
  const diagnostics = createSupabaseBoundaryDiagnostics(configuration);

  if (configuration.persistenceProvider === "mock") {
    return { kind: "mock-disabled", externalInitialization: "not-attempted", diagnostics };
  }

  assertRequiredSupabaseConfiguration(configuration);
  return { kind: "supabase-configured-not-implemented", externalInitialization: "not-attempted", diagnostics };
}
