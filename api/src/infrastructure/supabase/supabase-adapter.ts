import type { SupabaseBoundaryDiagnostics } from "./supabase-config";

export interface MockDisabledSupabaseBoundary {
  readonly kind: "mock-disabled";
  readonly externalInitialization: "not-attempted";
  readonly diagnostics: SupabaseBoundaryDiagnostics;
}

export interface ConfiguredNotImplementedSupabaseBoundary {
  readonly kind: "supabase-configured-not-implemented";
  readonly externalInitialization: "not-attempted";
  readonly diagnostics: SupabaseBoundaryDiagnostics;
}

/**
 * This is an infrastructure seam only. Neither state creates a client,
 * connects to Supabase, or performs a repository operation.
 */
export type SupabaseAdapterBoundary =
  | MockDisabledSupabaseBoundary
  | ConfiguredNotImplementedSupabaseBoundary;
