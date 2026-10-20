/**
 * Browser-tab-only drafts of in-progress assessment answers.
 *
 * The Student assessment API has no save/autosave endpoint, so answers are
 * kept in sessionStorage (keyed by user and attempt) purely so a refresh,
 * navigation or responsive-layout remount does not wipe them. They are NOT
 * sent to the server until the student submits the attempt.
 */
const PREFIX = "assessment-draft:";

function storageKey(userId: string, attemptId: string) {
  return `${PREFIX}${userId}:${attemptId}`;
}

export function loadAssessmentDraft(userId: string, attemptId: string): Record<string, unknown> {
  try {
    const raw = window.sessionStorage.getItem(storageKey(userId, attemptId));
    const parsed: unknown = raw ? JSON.parse(raw) : null;
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed as Record<string, unknown> : {};
  } catch {
    return {};
  }
}

export function saveAssessmentDraft(userId: string, attemptId: string, answers: Record<string, unknown>): boolean {
  try {
    window.sessionStorage.setItem(storageKey(userId, attemptId), JSON.stringify(answers));
    return true;
  } catch {
    return false;
  }
}

export function clearAssessmentDraft(userId: string, attemptId: string): void {
  try { window.sessionStorage.removeItem(storageKey(userId, attemptId)); } catch { /* storage unavailable */ }
}

/** Removes every assessment draft in this tab (used on sign-out). */
export function clearAllAssessmentDrafts(): void {
  try {
    for (let index = window.sessionStorage.length - 1; index >= 0; index -= 1) {
      const key = window.sessionStorage.key(index);
      if (key?.startsWith(PREFIX)) window.sessionStorage.removeItem(key);
    }
  } catch { /* storage unavailable */ }
}
