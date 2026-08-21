# Supabase Adapter Boundary

## Status

- Prompt: 37
- Scope: backend infrastructure/configuration boundary only
- Runtime provider: mock
- Supabase connection/client/query: none
- Database impact: none
- Push/deploy: none

## Purpose

This boundary prepares future backend persistence adapters without coupling the current mock runtime to Supabase. It does not create a Supabase client, connect to a database, execute SQL, implement repositories, or switch any runtime provider.

## Provider behavior

`PERSISTENCE_PROVIDER` is the canonical future persistence flag.

- `mock` is the default and returns a disabled boundary with no external initialization or Supabase configuration requirement.
- `supabase` validates future server configuration and returns `supabase-configured-not-implemented`; it does not create a client, connect, query, or alter the current runtime.

`AUTH_PROVIDER` also defaults to `mock`. `ADMIN_RUNTIME_MODE=mock` and `ADMIN_READ_MODEL_SOURCE=mock` remain unchanged. The HTTP application, admin overview, and Dokploy staging runtime remain mock-backed.

## Configuration and diagnostics

The boundary parses future `SUPABASE_*` settings with approved defaults: schema `app`, app-schema exposure `false`, and RLS-required-before-exposure `true`.

`SUPABASE_SECRET_KEY` and `SUPABASE_DB_URL` are represented only as configured/not-configured state. Their values are never returned by diagnostics, errors, or the selftest. The public diagnostics also use presence flags for the publishable key rather than emitting any key material.

For `PERSISTENCE_PROVIDER=supabase`, the boundary requires `SUPABASE_URL`, `SUPABASE_PROJECT_REF`, `SUPABASE_SECRET_KEY`, and `SUPABASE_DB_URL`. This validates future readiness only; it does not authorize or attempt any external operation.

## Schema and exposure safety

The private `app` schema remains unexposed. This boundary makes no Data API setting, privilege, grant, RLS, or policy change. If a later phase exposes an app table, RLS must be designed, enabled, reviewed, and tested before that exposure.

## Next prerequisite

A later explicitly approved provider-integration phase may add a real backend adapter only after its client, authorization, repository, logging, and runtime-switch boundaries are separately reviewed. Prompt 37 does not make that change.

## Prompt 38 read-adapter note

Prompt 38 adds unused M1 read adapters behind a dependency-free parameterized `SELECT` transport contract. No concrete transport, client, connection, query execution, or runtime composition was added. The private `app` schema remains unexposed and `PERSISTENCE_PROVIDER=mock` remains active.
## Prompt 39 status

The direct `pg` read transport is now available as an unused backend capability. It requires explicit future composition, enforces private-schema parameterized SELECT reads, and does not connect or change the mock runtime.
