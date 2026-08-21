# Direct PostgreSQL Read Transport

Prompt 39 adds a backend-only, explicit-lifecycle PostgreSQL transport for the existing M1 read adapters. It is a capability boundary, not a runtime provider switch: the live API and Dokploy staging remain mock-backed.

## Design

- `pg` `Pool` is created only by an explicit factory call; importing modules and parsing configuration never opens a connection.
- `SUPABASE_DB_URL` is the only connection source and is required only when a future composition selects `PERSISTENCE_PROVIDER=supabase`.
- The URL must use `postgres:` or `postgresql:` with `sslmode=verify-full`. No insecure TLS override or competing `ssl` object is supplied.
- Pool limits use bounded defaults (`5`, `30000`, and `5000` milliseconds) and are names-only environment placeholders.
- Queries are passed as `pool.query(text, values)` and are guarded to a single non-locking `SELECT`; values are never interpolated or logged.
- Raw rows are returned to the Prompt 38 adapter mapping layer. This transport does not contain business or entitlement logic.
- `close()` is explicit and idempotent.

The private `app` schema is reached through a future server-side PostgreSQL connection, not the Supabase Data API. No exposure, grant, RLS, SQL execution, or staging connection occurs in Prompt 39.

## Errors and secrets

Provider, configuration, query-intent, timeout, availability, and query-failure errors are translated to sanitized provider-neutral errors. Connection strings, credentials, SQL text, and parameter values never appear in diagnostics or thrown messages.

## Validation and next phase

The deterministic selftest uses a fake pool and performs no network I/O. Prompt 40 owns any separately approved controlled staging read verification. A later provider-integration phase must explicitly compose this transport; until then `PERSISTENCE_PROVIDER=mock`, `ADMIN_RUNTIME_MODE=mock`, and frontend mock data remain unchanged.

## Prompt 40 status

The manually invoked staging read verifier uses this transport against only project ref `mgrsgibxuwgbxtdqprkw` when explicitly enabled. It permits only the approved SELECT checks, keeps credentials process-only, and closes the pool after verification.

The Prompt 40 controlled verification passed against staging: `SELECT 1`, database identity, private `app` schema, all nine M1 tables, and zero-row counts completed successfully. The pool closed cleanly; no runtime composition or provider switch occurred.

Prompt 41 makes this transport available through an opt-in application persistence composition only. Mock remains the default; composition construction performs no query, and the Admin Overview runtime is unchanged.
