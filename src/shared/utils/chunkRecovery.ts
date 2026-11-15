const RELOAD_KEY = "gl_chunk_recovery_at";
const RELOAD_COOLDOWN_MS = 60_000;

/** Recover once from a missing lazy-loaded bundle after a deployment. */
export function recoverMissingChunk(now = Date.now()): boolean {
  try {
    const lastReload = Number(sessionStorage.getItem(RELOAD_KEY) || 0);
    if (lastReload > 0 && now - lastReload < RELOAD_COOLDOWN_MS) return false;
    sessionStorage.setItem(RELOAD_KEY, String(now));
  } catch {
    // Without persistent per-tab storage a reload cannot be bounded safely.
    return false;
  }
  window.location.reload();
  return true;
}

export function isChunkLoadError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /failed to fetch dynamically imported module|error loading dynamically imported module|loading chunk [\w-]+ failed|importing a module script failed/i.test(message);
}
