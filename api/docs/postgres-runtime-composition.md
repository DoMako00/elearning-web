# PostgreSQL Runtime Composition

## Prompt 41 boundary

Prompt 41 adds an opt-in backend persistence composition. `PERSISTENCE_PROVIDER=mock` remains the default and preserves the current in-memory Admin Overview, HTTP routes, request context, frontend behavior, and Dokploy staging mode.

`PERSISTENCE_PROVIDER=supabase` is the only opt-in value. It validates the existing server-only `SUPABASE_DB_URL`, creates the Prompt 39 read-only PostgreSQL transport, and builds the Prompt 38 M1 repository bundle. The presence of `SUPABASE_DB_URL` alone never activates this path.

## Construction and safety

Composition is created by `createApplication()` using the existing centralized configuration boundary. Mock construction requires no database configuration and creates no `pg` Pool. Supabase construction creates infrastructure only; it does not run a query, health check, table inspection, verification probe, seed, write, migration, or readiness check.

All M1 repositories remain read-only and use the private `app` schema through direct server-side PostgreSQL transport. The Data API is not used, `app` is not exposed, and no RLS, policy, grant, or schema-setting change is part of this phase. Database URLs and credentials are never logged, serialized, returned through HTTP, or exposed to the frontend.

## Bundle and lifecycle

The Supabase composition exposes typed repositories for educational brands, global app users, brand memberships, student profiles, admin profiles, permissions, roles, role permissions, and role assignments. Global and brand-scoped semantics remain separate, and no M1 identity record is treated as entitlement or protected-content access.

The composition owns the transport lifecycle. `close()` is a safe no-op in mock mode and delegates idempotently to the PostgreSQL transport in Supabase mode. The default HTTP server attaches this cleanup to server close; no unrelated shutdown orchestration was changed.

## Runtime boundary

The live Admin Overview endpoint still uses its existing in-memory read model. Prompt 41 does not switch routes, auth, request context, frontend data sources, or Dokploy values. Prompt 42 is the next boundary for an explicitly controlled Admin Overview read-model integration.

## Prompt 42 status

Prompt 42 adds `ADMIN_READ_MODEL_SOURCE=mock|postgres` inside application composition. Mock remains the default. PostgreSQL source requires Supabase persistence, constructs without querying, and uses only M1 brand resolution; the deployed Dokploy and frontend sources remain mock-backed.

## Prompt 53 command composition

`ADMIN_COMMAND_SOURCE=mock|postgres` is independent from the read selectors and defaults to `mock`. Mock creates no write pool or executable M2 command service. PostgreSQL commands require Supabase persistence and use a dedicated lazy pool so the existing `ReadQueryTransport` stays strictly read-only. Construction performs no connection or query; application shutdown closes the optional write pool and read transport idempotently. The executor is programmatic only and is not mounted on HTTP routes.
