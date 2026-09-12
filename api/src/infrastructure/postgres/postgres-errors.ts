export type PostgresReadTransportErrorCode =
  | "provider_not_configured"
  | "provider_unavailable"
  | "query_failed"
  | "query_timeout"
  | "invalid_query_intent"
  | "invalid_configuration"
  | "tls_verification_failed";

export class PostgresReadTransportError extends Error {
  readonly name = "PostgresReadTransportError";

  constructor(readonly code: PostgresReadTransportErrorCode, message: string, readonly providerCode?: string) {
    super(message);
  }
}
