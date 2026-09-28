/** Server-generated request identity; it is tracing metadata, never authority. */
export function createRequestId(): string {
  return `req-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}
