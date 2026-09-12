import type { IncomingMessage } from "node:http";

export type StrictBearerErrorCode = "missing" | "malformed" | "duplicate" | "oversized";

export type StrictBearerResult =
  | { readonly ok: true; readonly token: string }
  | { readonly ok: false; readonly code: StrictBearerErrorCode };

const MAX_TOKEN_LENGTH = 8192;
const COMPACT_JWT = /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/;
const MOCK_CREDENTIAL = /^mock-auth-[A-Za-z0-9-]+$/;

function authorizationValues(request: IncomingMessage): readonly string[] {
  const raw = request.rawHeaders ?? [];
  const values: string[] = [];
  for (let index = 0; index < raw.length; index += 2) {
    if (raw[index]?.toLowerCase() === "authorization") values.push(raw[index + 1] ?? "");
  }
  if (raw.length > 0) return values;
  const value = request.headers.authorization;
  return Array.isArray(value) ? value : value === undefined ? [] : [value];
}

/** Extracts only one compact JWT from one raw Authorization header. */
export function parseStrictBearerToken(request: IncomingMessage): StrictBearerResult {
  const values = authorizationValues(request);
  if (values.length === 0) return { ok: false, code: "missing" };
  if (values.length !== 1) return { ok: false, code: "duplicate" };
  const value = values[0]!;
  if (value.length > MAX_TOKEN_LENGTH) return { ok: false, code: "oversized" };
  if (!value.startsWith("Bearer ") || value.length <= 7) return { ok: false, code: "malformed" };
  const token = value.slice(7);
  // Preserve the deterministic mock provider contract; Supabase mode still
  // requires the compact JWT shape before jose verification.
  if (!COMPACT_JWT.test(token) && !MOCK_CREDENTIAL.test(token)) return { ok: false, code: "malformed" };
  return { ok: true, token };
}

export const strictBearerTokenMaxLength = MAX_TOKEN_LENGTH;
