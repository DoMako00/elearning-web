import type { BrandCode, BrandId } from "../brand-scope/brand-scope";

export type RepositoryErrorCode =
  | "not_found"
  | "invalid_input"
  | "brand_not_found"
  | "brand_mismatch"
  | "permission_denied"
  | "conflict"
  | "lifecycle_invalid"
  | "provider_unavailable"
  | "persistence_data_invalid"
  | "query_failed"
  | "query_timeout"
  | "invalid_query_intent"
  | "provider_not_implemented"
  | "authentication_required"
  | "authentication_invalid"
  | "user_not_found"
  | "target_brand_mismatch"
  | "session_not_found"
  | "session_inactive"
  | "session_user_mismatch"
  | "session_brand_mismatch"
  | "device_not_found"
  | "device_revoked"
  | "device_user_mismatch"
  | "admin_profile_not_found"
  | "student_profile_not_found"
  | "unknown";

export interface RepositoryError {
  readonly code: RepositoryErrorCode;
  readonly message: string;
  readonly correlationId?: string;
  readonly brandCode?: BrandCode;
  readonly brandId?: BrandId;
  readonly details?: Readonly<Record<string, unknown>>;
}

export type RepositoryOk<T> = { readonly ok: true; readonly value: T };
export type RepositoryErr = { readonly ok: false; readonly error: RepositoryError };
export type RepositoryResult<T> = RepositoryOk<T> | RepositoryErr;

export const repositoryOk = <T>(value: T): RepositoryOk<T> => ({ ok: true, value });
export const repositoryErr = (error: RepositoryError): RepositoryErr => ({ ok: false, error });
