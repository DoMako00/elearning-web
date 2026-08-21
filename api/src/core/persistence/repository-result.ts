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

