/**
 * Friendly error translator and disclosure helper.
 *
 * Maps technical, concurrency, or raw backend errors into human-friendly explanations
 * while preserving the raw message and correlationId for support reference.
 */

export interface FriendlyErrorInfo {
  message: string;
  details?: string;
  reference?: string;
}

export function friendlyError(error: unknown): FriendlyErrorInfo {
  const rawMessage = error instanceof Error ? error.message : typeof error === "string" ? error : "An unknown error occurred.";
  const correlationId = (error as { correlationId?: string })?.correlationId ??
    (error as { error?: { correlationId?: string } })?.error?.correlationId;
  const status = (error as { status?: number })?.status;

  const low = rawMessage.toLowerCase();

  // 1. Version / Concurrency conflict
  if (
    status === 409 ||
    low.includes("expectedversion") ||
    low.includes("version conflict") ||
    low.includes("changed by someone else") ||
    low.includes("latest server version is required")
  ) {
    return {
      message: "This was changed by someone else. Refresh the page and try again.",
      details: rawMessage,
      reference: correlationId,
    };
  }

  // 2. Network failures
  if (
    low.includes("failed to fetch") ||
    low.includes("networkerror") ||
    low.includes("load failed") ||
    low.includes("we couldn't reach the server")
  ) {
    return {
      message: "We couldn't reach the server. Check your connection.",
      details: rawMessage,
      reference: correlationId,
    };
  }

  // 3. File type restrictions
  if (low.includes("only pdf and mp4 files are accepted") || low.includes("accepts mp4 video and pdf files only")) {
    return {
      message: "Please choose a PDF or MP4 file.",
      details: rawMessage,
      reference: correlationId,
    };
  }

  // 4. Upload & multipart storage failures
  if (
    low.includes("temporary upload url") ||
    low.includes("multipart upload") ||
    low.includes("failed verification") ||
    low.includes("temporary upload failed")
  ) {
    return {
      message: "The upload didn't finish. Check your connection and try again.",
      details: rawMessage,
      reference: correlationId,
    };
  }

  // 5. Protected attachment failures
  if (low.includes("protected submission attachment could not be opened")) {
    return {
      message: "This file couldn't be opened. Please try again.",
      details: rawMessage,
      reference: correlationId,
    };
  }

  // 6. Curriculum / semester linking failures
  if (low.includes("choose a real brand course mapped to a persisted academic module")) {
    return {
      message: "This course isn't linked to a semester yet. Ask an administrator to set it up.",
      details: rawMessage,
      reference: correlationId,
    };
  }

  // 7. Scheduling chronological failures
  if (low.includes("availability end must be after availability start")) {
    return {
      message: "The closing time must be after the opening time.",
      details: rawMessage,
      reference: correlationId,
    };
  }

  // 8. Generic backend request failures
  if (
    low.includes("the content request failed") ||
    low.includes("assignment review request failed") ||
    low.includes("the admin assessment request failed") ||
    low.includes("the assessment request failed") ||
    low.includes("the admin update could not be saved") ||
    low.includes("admin data could not be loaded")
  ) {
    return {
      message: "Something went wrong. Please try again. If it keeps happening, contact support and quote the reference below.",
      details: rawMessage,
      reference: correlationId,
    };
  }

  // Default: retain existing message if already human-readable
  return {
    message: rawMessage,
    reference: correlationId,
  };
}
