import type { RepositoryError, RepositoryErrorCode, RepositoryResult } from "../persistence";
import { repositoryErr } from "../persistence";

export type RequestContextErrorCode = Extract<
  RepositoryErrorCode,
  | "authentication_required"
  | "authentication_invalid"
  | "user_not_found"
  | "brand_not_found"
  | "brand_mismatch"
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
  | "invalid_input"
>;

export function contextError(code: RequestContextErrorCode, message: string, correlationId?: string): RepositoryError {
  return { code, message, correlationId };
}

export function contextFailure<T>(
  code: RequestContextErrorCode,
  message: string,
  correlationId?: string,
): RepositoryResult<T> {
  return repositoryErr(contextError(code, message, correlationId));
}
