export type StudentApiErrorKind =
  | "brand_selection_required"
  | "no_membership"
  | "unauthenticated"
  | "not_found"
  | "unavailable"
  | "unknown";

export interface ClassifiedStudentApiError {
  readonly kind: StudentApiErrorKind;
  readonly title: string;
  readonly message: string;
}

function readStatus(error: unknown): number | null {
  const status = (error as { status?: unknown } | null | undefined)?.status;
  return typeof status === "number" ? status : null;
}

function readCode(error: unknown): string {
  const code = (error as { code?: unknown } | null | undefined)?.code;
  return typeof code === "string" ? code : "";
}

/**
 * Maps the documented Student API rejections onto distinct, honest states.
 * 400 "brand selection needed" and 403 "no active membership" are scope
 * problems, not connectivity failures, and must never be shown as such.
 */
export function classifyStudentApiError(error: unknown): ClassifiedStudentApiError {
  const status = readStatus(error);
  const code = readCode(error);
  const message = error instanceof Error ? error.message : "";

  if (status === 400 && /brand/i.test(`${code} ${message}`)) {
    return {
      kind: "brand_selection_required",
      title: "Your learning brand needs to be confirmed",
      message: "Your account is linked to more than one learning membership, and this app cannot choose between them for you. Please contact support so your active membership can be confirmed.",
    };
  }
  if (status === 403) {
    return {
      kind: "no_membership",
      title: "No active learning membership",
      message: "We couldn't find an active membership with a valid academic placement for this account. Please contact support if you believe this is a mistake.",
    };
  }
  if (status === 401 || code === "unauthenticated") {
    return { kind: "unauthenticated", title: "Please sign in again", message: "Your session has ended. Sign in again to continue." };
  }
  if (status === 404) {
    return { kind: "not_found", title: "Not found", message: message || "This item could not be found or is no longer available to you." };
  }
  if (status === 0 || (status !== null && status >= 500) || code === "network_error") {
    return { kind: "unavailable", title: "We couldn't reach the learning service", message: "Please check your connection and try again." };
  }
  return { kind: "unknown", title: "Something went wrong", message: message || "The request could not be completed." };
}
