import type { ReadQueryRequest, ReadQueryResult, ReadQueryTransport } from "../supabase/read-query-transport";
import { PostgresReadTransportError } from "./postgres-errors";

export interface PgPoolLike {
  query<Row extends Record<string, unknown>>(text: string, values: readonly string[]): Promise<{ readonly rows: readonly Row[] }>;
  end(): Promise<void>;
}

const forbidden = /\b(insert|update|delete|merge|upsert|truncate|create|alter|drop|grant|revoke|comment|vacuum|analyze|copy|call|do|set)\b/i;
const locks = /\bfor\s+(update|share|no\s+key\s+update|key\s+share)\b/i;

export function assertReadOnlySelect(text: string): void {
  const normalized = text.trim();
  if (!normalized || !/^select\b/i.test(normalized) || normalized.includes(";") || /^with\b/i.test(normalized)) {
    throw new PostgresReadTransportError("invalid_query_intent", "Only one parameterized SELECT statement is permitted.");
  }
  if (/\bselect\s+into\b/i.test(normalized) || locks.test(normalized) || forbidden.test(normalized)) {
    throw new PostgresReadTransportError("invalid_query_intent", "The query intent is not read-only.");
  }
}

function translateQueryError(error: unknown): PostgresReadTransportError {
  const code = typeof error === "object" && error !== null && "code" in error ? String(error.code) : "";
  if (code === "ETIMEDOUT" || code === "57014" || code === "CONNECTION_TIMEOUT") {
    return new PostgresReadTransportError("query_timeout", "The Postgres read query timed out.");
  }
  if (["ECONNREFUSED", "ENOTFOUND", "ECONNRESET", "EHOSTUNREACH"].includes(code)) {
    return new PostgresReadTransportError("provider_unavailable", "The Postgres provider is unavailable.");
  }
  return new PostgresReadTransportError("query_failed", "The Postgres read query failed.");
}

export class PostgresReadTransport implements ReadQueryTransport {
  private closePromise: Promise<void> | undefined;

  constructor(private readonly pool: PgPoolLike) {}

  async query<Row extends Record<string, unknown>>(request: ReadQueryRequest): Promise<ReadQueryResult<Row>> {
    assertReadOnlySelect(request.text);
    try {
      return await this.pool.query<Row>(request.text, request.values);
    } catch (error) {
      throw translateQueryError(error);
    }
  }

  close(): Promise<void> {
    if (!this.closePromise) {
      this.closePromise = this.pool.end().catch(() => {
        throw new PostgresReadTransportError("provider_unavailable", "The Postgres pool could not be closed.");
      });
    }
    return this.closePromise;
  }
}
