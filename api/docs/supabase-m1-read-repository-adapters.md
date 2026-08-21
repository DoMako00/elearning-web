# Supabase M1 Read Repository Adapters

## Status

- Prompt: 38
- Scope: read-only persistence adapters only
- Runtime provider: mock
- Supabase connection/client/driver: none
- Database impact: none
- Push/deploy: none

## Purpose

Prompt 38 provides unused M1 read adapters for the private `app` schema. They are preparation for a later direct-Postgres transport phase and are not wired into application composition, request context, HTTP routes, admin overview, Dokploy, or the frontend.

## Contracts and mapping

The adapters use M1-specific contracts rather than the legacy platform-scoped runtime repository models. This preserves the approved M1 design: `app_users` are global, while memberships, student profiles, admin profiles, roles, and assignments are brand-scoped.

Each adapter maps rows from one of the nine M1 tables into explicit M1 records. Required columns and allowed lifecycle values are validated. UUIDs and timestamps remain strings; nullable source fields remain nullable. Malformed rows return a provider-neutral persistence-data error rather than receiving invented defaults.

## Private-schema read transport

`ReadQueryTransport` accepts labelled, parameterized PostgreSQL `SELECT` requests only. Prompt 38 provides no transport implementation, database dependency, environment read, or connection. A later approved direct-Postgres transport may implement this contract without exposing `app` through the Supabase Data API.

The adapter constructors receive only the transport. They do not read credentials, create clients, or execute a query during import or construction.

## Read-only and scope guarantees

- Adapter query text is limited to `SELECT` from the private `app` schema.
- No adapter performs a write, DDL, RPC, seed action, grant, RLS action, or Data API setting change.
- Brand-scoped reads always bind canonical `brand_id` alongside the requested record/user/profile/role identifier.
- A row in another brand resolves as `not_found`; the adapter does not disclose cross-brand existence.
- A global app-user record does not imply membership, subscription, seat, enrollment, admin permission, or protected-content access.
- A membership record is not an entitlement or access grant.

## Error boundary and dependency gate

Adapters return provider-neutral `RepositoryResult` values for not found, malformed persistence data, and query failures. Errors intentionally omit connection values, secret keys, DB URLs, parameter values, and full query text.

No database package is currently installed or added. The next phase must explicitly approve a minimal direct-Postgres transport dependency and its credential/runtime composition before these adapters can issue a real query.

## Runtime and next phase

`PERSISTENCE_PROVIDER=mock` remains the active default. The current mock request-context, admin overview, HTTP runtime, frontend, and Dokploy staging configuration remain unchanged.

The next integration phase should review and approve the concrete private-schema transport, connection lifecycle, observability, adapter composition, and runtime switch separately.
