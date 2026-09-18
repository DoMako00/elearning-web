# M1 Staging Apply Verification Hardening

## Status

- Prompt: 36B
- Scope: verification hardening only
- No SQL execution
- No database mutation
- No Supabase settings mutation
- No runtime integration
- No push/deploy

## Context

Prompt 36 applied the reviewed M1 SQL draft to Supabase staging project ref `mgrsgibxuwgbxtdqprkw`. The Supabase project display name is currently `medway`; the owner confirmed that exact ref and name as the intended staging target. Production was not opened or modified.

## Why this verification exists

Prompt 36 verified database-level privileges, RLS state, and policy state. The database session could not authoritatively read the Supabase PostgREST/Data API exposed-schema setting, so a Dashboard confirmation was required before backend adapter work.

## Manual Dashboard result

The owner completed the read-only Dashboard check:

| Check | Result |
| --- | --- |
| Dashboard project ref | `mgrsgibxuwgbxtdqprkw` |
| Project name | `medway` |
| Environment | Staging (owner-confirmed) |
| Data API / exposed schemas checked | Yes |
| `app` schema visible in schema list | Yes, but unchecked |
| `app` schema exposed | No |
| Exposed schemas | `public` and `graphql_public` only |
| Dashboard settings changed | No |
| Grants added | No |
| Production opened or modified | No |

All required Dashboard verification items are confirmed. No unresolved exposure item blocks the next planning phase.

## Effective access state after Prompt 36

- The private `app` schema exists.
- All nine M1 tables exist.
- All nine M1 tables contain zero rows; no seed data was inserted.
- No RLS policies were created.
- RLS remains disabled as approved for this private staging phase.
- No effective `anon` or `authenticated` privileges were found at the database level.
- The Dashboard confirms that `app` is not exposed through the Data API.

## Remaining gates

- RLS and Data API design remain deferred to a later reviewed phase.
- Seed strategy D36 remains deferred.
- The backend Supabase adapter remains pending; runtime continues to use mock sources.
- Production migration requires separate explicit approval and targeting.
- A reviewed rollback/down strategy remains required before any production application.

## Next safe phase

Recommend **Prompt 37 — Backend Supabase Adapter Boundary**, now that the Dashboard exposed-schema check is confirmed. The Prompt 36 and 36B documentation must be included in a separately approved repository checkpoint push before that phase is treated as published. This Prompt 36B task itself performs no push or deployment.
