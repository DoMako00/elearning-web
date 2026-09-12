import { SupabaseBoundaryConfigurationError } from "./supabase-errors";
import { authProviders, persistenceProviders, type AuthProvider, type PersistenceProvider } from "./supabase-provider";

export type SupabaseBoundaryEnvironment = Readonly<Record<string, string | undefined>>;

export interface SupabaseBoundaryConfiguration {
  readonly persistenceProvider: PersistenceProvider;
  readonly authProvider: AuthProvider;
  readonly url?: string;
  readonly projectRef?: string;
  readonly publishableKeyConfigured: boolean;
  readonly appSchema: string;
  readonly exposeAppSchema: boolean;
  readonly rlsRequiredBeforeExposure: boolean;
  readonly secretKeyConfigured: boolean;
  readonly dbUrlConfigured: boolean;
}

export interface SupabaseBoundaryDiagnostics {
  readonly persistenceProvider: PersistenceProvider;
  readonly authProvider: AuthProvider;
  readonly urlConfigured: boolean;
  readonly projectRefConfigured: boolean;
  readonly publishableKeyConfigured: boolean;
  readonly appSchema: string;
  readonly exposeAppSchema: boolean;
  readonly rlsRequiredBeforeExposure: boolean;
  readonly secretKeyConfigured: boolean;
  readonly dbUrlConfigured: boolean;
}

const defaultAppSchema = "app";

function nonEmpty(value: string | undefined): string | undefined {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

function parseProvider<T extends string>(
  variableName: string,
  value: string | undefined,
  allowedValues: readonly T[],
  fallback: T,
): T {
  const normalized = nonEmpty(value) ?? fallback;
  if ((allowedValues as readonly string[]).includes(normalized)) return normalized as T;
  throw new SupabaseBoundaryConfigurationError(
    "invalid_provider",
    `${variableName} must be one of: ${allowedValues.join(", ")}.`,
    variableName,
  );
}

function parseBoolean(variableName: string, value: string | undefined, fallback: boolean): boolean {
  const normalized = nonEmpty(value);
  if (!normalized) return fallback;
  if (normalized === "true") return true;
  if (normalized === "false") return false;
  throw new SupabaseBoundaryConfigurationError(
    "invalid_boolean",
    `${variableName} must be exactly true or false.`,
    variableName,
  );
}

export function resolveSupabaseBoundaryConfiguration(
  environment: SupabaseBoundaryEnvironment = process.env,
): SupabaseBoundaryConfiguration {
  return {
    persistenceProvider: parseProvider("PERSISTENCE_PROVIDER", environment.PERSISTENCE_PROVIDER, persistenceProviders, "mock"),
    authProvider: parseProvider("AUTH_PROVIDER", environment.AUTH_PROVIDER, authProviders, "mock"),
    url: nonEmpty(environment.SUPABASE_URL),
    projectRef: nonEmpty(environment.SUPABASE_PROJECT_REF),
    publishableKeyConfigured: Boolean(nonEmpty(environment.SUPABASE_PUBLISHABLE_KEY)),
    appSchema: nonEmpty(environment.SUPABASE_APP_SCHEMA) ?? defaultAppSchema,
    exposeAppSchema: parseBoolean("SUPABASE_EXPOSE_APP_SCHEMA", environment.SUPABASE_EXPOSE_APP_SCHEMA, false),
    rlsRequiredBeforeExposure: parseBoolean(
      "SUPABASE_RLS_REQUIRED_BEFORE_EXPOSURE",
      environment.SUPABASE_RLS_REQUIRED_BEFORE_EXPOSURE,
      true,
    ),
    secretKeyConfigured: Boolean(nonEmpty(environment.SUPABASE_SECRET_KEY)),
    dbUrlConfigured: Boolean(nonEmpty(environment.SUPABASE_DB_URL)),
  };
}

export function createSupabaseBoundaryDiagnostics(
  configuration: SupabaseBoundaryConfiguration,
): SupabaseBoundaryDiagnostics {
  return {
    persistenceProvider: configuration.persistenceProvider,
    authProvider: configuration.authProvider,
    urlConfigured: Boolean(configuration.url),
    projectRefConfigured: Boolean(configuration.projectRef),
    publishableKeyConfigured: configuration.publishableKeyConfigured,
    appSchema: configuration.appSchema,
    exposeAppSchema: configuration.exposeAppSchema,
    rlsRequiredBeforeExposure: configuration.rlsRequiredBeforeExposure,
    secretKeyConfigured: configuration.secretKeyConfigured,
    dbUrlConfigured: configuration.dbUrlConfigured,
  };
}
