# PostgreSQL Staging Read Verification

## Status

Prompt 40 is a controlled, manually invoked, read-only staging verification. It does not change the API runtime, Dokploy environment, frontend, schema, RLS, grants, Data API settings, or production.

- Target project ref: `mgrsgibxuwgbxtdqprkw`
- Target environment: `staging`
- Script: `api/scripts/postgres-staging-read-verify.mjs`
- Enable flag: `POSTGRES_STAGING_READ_VERIFY=true`
- Runtime defaults remain `ADMIN_RUNTIME_MODE=mock`, `PERSISTENCE_PROVIDER=mock`, and `VITE_ADMIN_DATA_SOURCE=mock`.

## Credential and target boundary

The database URL and any Supabase CA trust material must be injected into the current process only. For local convenience, the script reads ignored `api/.env` and optional `api/.env.local` files into an in-memory process environment; process values take precedence, followed by `.env.local`, then `.env`. It never writes those files, prints their values, or commits them. Secrets must not be placed in source, documentation, package files, `.env.example`, Compose, logs, commit messages, or Git. `SUPABASE_PROJECT_REF` must exactly equal the target ref before a Pool is created. The script uses an isolated factory environment with `PERSISTENCE_PROVIDER=supabase`; it does not mutate the application process configuration.

`sslmode=verify-full` is required. If the local Node trust store does not contain the Supabase CA, provide `NODE_EXTRA_CA_CERTS` as a process-only path outside the repository. No certificate-validation bypass is permitted.

## Approved SELECT scope

The script uses the Prompt 39 `PostgresReadTransport` and only executes:

1. `SELECT 1 AS ok`.
2. `SELECT current_database() AS database_name`.
3. A parameterized `pg_namespace` check for schema `app`.
4. A parameterized `information_schema.tables` check for the nine reviewed M1 tables.
5. `COUNT(*)` reads for a hard-coded allowlist of those nine table names.

No table name is accepted from command-line, environment, or user input. No repository adapter lookup is performed because transport-level verification is sufficient and avoids personal-data output.

## Lifecycle and output safety

The script never runs on import, API startup, build, runtime smoke, or container startup. It creates the Pool only after all preflight checks pass and closes it in `finally`. It does not retry. Console output is limited to the sanitized target, database name, schema/table status, counts, timings, and safe PASS/FAIL categories. Credentials, SQL parameters, raw rows, and stack traces are never printed.

## Result record

The single owner-authorized live verification completed successfully against the exact staging target:

- Verification status: passed.
- Project ref: `mgrsgibxuwgbxtdqprkw`.
- Environment: `staging`.
- `SELECT 1`: passed (`ok=1`).
- `current_database()`: passed (`postgres`).
- `app` schema: exists.
- Nine M1 tables: all present.
- Row counts: zero for all nine tables.
- Pool close: passed.
- Duration: `1136 ms`.

No application rows or personal-data records were read or printed. The process-only URL and CA path were not written to the repository.

## Forbidden actions

No INSERT, UPDATE, DELETE, DDL, migration, seed, RLS/policy, grant, Data API exposure, Supabase MCP call, production target, Dokploy secret wiring, push, or deploy is part of Prompt 40.
