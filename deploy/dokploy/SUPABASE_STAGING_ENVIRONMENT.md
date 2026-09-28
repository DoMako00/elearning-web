# Supabase Staging Environment for Dokploy

## Purpose

This document defines which values may be added later through the Dokploy Environment UI for the future `elearning-staging` Supabase project. It does not create a project, add credentials, connect the current Compose runtime, apply SQL, expose the `app` schema, or approve a deployment.

## Variables reserved for the staging environment

| Variable | Intended source | Current repository/runtime state | Secret handling |
| --- | --- | --- | --- |
| `SUPABASE_URL` | Supabase Dashboard | Reserved placeholder; unused by current mock runtime | Keep private in Dokploy UI; names only in Git. |
| `SUPABASE_PROJECT_REF` | Supabase Dashboard | Reserved placeholder; unused by current mock runtime | Keep private in Dokploy UI; names only in Git. |
| `SUPABASE_PUBLISHABLE_KEY` | Supabase Dashboard API Keys | Reserved placeholder; unused by current mock runtime | Public-component key only after approved integration. |
| `SUPABASE_SECRET_KEY` | Supabase Dashboard API Keys | Reserved placeholder; unused by current mock runtime | Backend-only; never Compose/docs/frontend. |
| `SUPABASE_DB_URL` | Supabase Connect/database settings | Reserved placeholder; unused by current mock runtime | Backend/apply tooling only; never frontend or Git. |
| `SUPABASE_APP_SCHEMA` | Repository boundary decision | `app` in the example | Keep `app` private until a later approved exposure decision. |
| `SUPABASE_EXPOSE_APP_SCHEMA` | Repository safety gate | `false` in the example | Must remain false during the mock phase. |
| `SUPABASE_RLS_REQUIRED_BEFORE_EXPOSURE` | Repository safety gate | `true` in the example | Unconditional safety requirement. |
| `AUTH_PROVIDER` | Runtime source selector | `mock` | Do not switch without adapter and deployment approval. |
| `ADMIN_READ_MODEL_SOURCE` | Runtime source selector | `mock` | Do not switch without adapter and deployment approval. |
| `ADMIN_COMMAND_SOURCE` | Runtime source selector | `mock` | Do not switch without adapter and deployment approval. |
| `ACCESS_EVALUATOR_SOURCE` | Runtime source selector | `mock` | Do not switch without adapter and deployment approval. |
| `MEDIA_AUTH_SOURCE` | Runtime source selector | `mock` | Do not switch without adapter and deployment approval. |
| `PAYMENT_PROVIDER` | Runtime source selector | `mock` | Do not switch without provider and deployment approval. |

These are reserved names and safe mock defaults, not evidence that Dokploy currently consumes Supabase configuration. The committed [`deploy/dokploy/.env.example`](.env.example) contains no real values.

## Current staging mode

The current staging runtime remains mock-backed:

```text
AUTH_PROVIDER=mock
ADMIN_READ_MODEL_SOURCE=mock
ADMIN_COMMAND_SOURCE=mock
ACCESS_EVALUATOR_SOURCE=mock
MEDIA_AUTH_SOURCE=mock
PAYMENT_PROVIDER=mock
```

The current Compose file is not wired to a Supabase client, database connection, or provider adapter. Adding placeholders to Dokploy does not change that behavior.

## Future activation gate

Switching any source from `mock` to `postgres` or `supabase` requires all of the following in a later explicit phase:

- backend adapter implementation;
- M1 SQL reviewed and applied to staging through an approved migration phase;
- credentials configured privately in Dokploy;
- API/Web and integration smoke tests;
- RLS/Data API review if any table is exposed;
- rollback and monitoring plan; and
- explicit deployment approval.

Production remains a separate project and separate approval path.

## Secret policy

- Do not put secret values in Compose files.
- Do not put secret values in committed documentation.
- Do not put secret values in web environment variables.
- Do not put secret values in `.env.example` files.
- Use Dokploy Environment UI or an approved external secret manager.
- Never place `SUPABASE_SECRET_KEY` or `SUPABASE_DB_URL` in `VITE_` variables.
- Keep the `app` schema unexposed, with no `anon`/`authenticated` grants, until RLS and exposure approval are complete.
