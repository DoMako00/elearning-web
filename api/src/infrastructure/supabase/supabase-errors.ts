export type SupabaseBoundaryConfigurationErrorCode =
  | "invalid_provider"
  | "invalid_boolean"
  | "missing_required_configuration";

/**
 * This error intentionally contains variable names and safe context only.
 * Secret values must never be placed in messages, diagnostics, or logs.
 */
export class SupabaseBoundaryConfigurationError extends Error {
  readonly name = "SupabaseBoundaryConfigurationError";

  constructor(
    readonly code: SupabaseBoundaryConfigurationErrorCode,
    message: string,
    readonly variableName?: string,
  ) {
    super(message);
  }
}
