/**
 * Normalizes the timestamp representations returned by supported read
 * transports without changing the provider-neutral repository contracts.
 */
export function requiredPersistenceTimestamp(value: unknown): string {
  if (typeof value === "string" && value) return value;
  if (value instanceof Date) {
    const milliseconds = value.getTime();
    if (Number.isFinite(milliseconds)) return value.toISOString();
  }
  throw new Error("Required persistence timestamp is malformed.");
}

export function nullablePersistenceTimestamp(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  return requiredPersistenceTimestamp(value);
}
