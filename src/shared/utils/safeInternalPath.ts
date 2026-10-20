/**
 * Returns the path only when it is a same-origin, in-app route. Server-provided
 * deep links are untrusted input: absolute URLs, protocol-relative URLs,
 * backslash tricks and script schemes are rejected.
 */
export function safeInternalPath(value: string | null | undefined): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//") || trimmed.includes("\\")) return null;
  try {
    const parsed = new URL(trimmed, window.location.origin);
    if (parsed.origin !== window.location.origin) return null;
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return null;
  }
}
