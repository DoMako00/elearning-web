# Supabase Environment Boundary

## Status

- Phase: Prompt 34
- Scope: setup boundary only
- SQL applied: no
- Supabase connection: none
- Runtime integration: none
- Push/deploy: none

## Purpose

This document defines how future Supabase project values and secrets are collected, stored, and separated before staging migration application or backend adapter integration. Prompt 34 adds names-only environment placeholders and setup guidance. It does not create a Supabase project, connect runtime code, apply SQL, expose a schema, or approve a deployment.

## Project naming and environment separation

Recommended staging project name: `elearning-staging`.

The future production project must be separate: `elearning-production`.

- Do not use a production project for M1 draft or staging application.
- Staging migration application requires a later explicit phase.
- Production migration application requires another explicit phase.
- A project name is a recommendation, not evidence that either project has been created.

## Project values to collect manually

Collect these values manually from the Supabase Dashboard only when a later phase explicitly needs them:

| Variable | Where it lives | Safe in frontend? | Safe in backend? | Safe in Git? | Notes |
| --- | --- | --- | --- | --- | --- |
| `SUPABASE_URL` | Dashboard project/API settings | Generally public, but configure through env | Yes | Name only | The real value must still not be committed. |
| `SUPABASE_PROJECT_REF` | Dashboard project settings / URL | Not needed by the browser | Yes | Name only | Keep the real project reference out of committed files. |
| `SUPABASE_PUBLISHABLE_KEY` | Dashboard API Keys / Connect dialog | Yes, only for a later approved browser Supabase use with the required RLS model | Yes | Name only | Prefer the new publishable-key naming. |
| `SUPABASE_SECRET_KEY` | Dashboard API Keys / secret keys | No | Yes, server-side only | Name only | Elevated key; never place in Vite variables or frontend bundles. |
| `SUPABASE_DB_URL` | Dashboard Connect dialog / database connection details | No | Apply tooling/backend only | Name only | Treat as a database credential; never expose or commit it. |

None of the real values belongs in Git. `.env.example` files contain variable names and safe mock/default values only.

## Key handling policy

Use the new Supabase `publishable` and `secret` terminology going forward. Supabase may still show legacy `anon` and `service_role` names for compatibility, but this repository should not introduce those names unless a later integration has a documented compatibility requirement. Supabase documents publishable keys as public-component keys and secret keys as backend-only elevated keys. [Supabase API key guidance](https://supabase.com/docs/guides/getting-started/api-keys), [Migrating to publishable and secret API keys](https://supabase.com/docs/guides/getting-started/migrating-to-new-api-keys)

Anything prefixed `VITE_` is available to the frontend build and must never contain a secret, database URL, service-role value, or equivalent elevated credential. Real server-side values belong in private `.env.local` files, Dokploy Environment UI, or an external secret manager—not in committed documentation or templates.

## Schema exposure policy

The Prompt 32 SQL draft uses a private `app` schema.

- Do not add `app` to Supabase exposed schemas yet.
- Do not grant schema/table access to `anon` or `authenticated`.
- Do not enable Data API exposure for `app`.
- If `app` is ever exposed, RLS policies must first be designed, enabled, reviewed, and tested for every exposed table.
- M7 remains the full RLS hardening, review, and testing phase.

Supabase treats custom-schema exposure and Postgres grants as explicit configuration steps, separate from row-level policy behavior. [Using Custom Schemas](https://supabase.com/docs/guides/api/using-custom-schemas), [Securing your API](https://supabase.com/docs/guides/api/securing-your-api)

## Local development environment plan

Future local private files are:

- `api/.env.local`
- `web/.env.local`

`.env.example` is committed and contains names-only placeholders. `.env.local` is ignored/private and must never be committed. Real Supabase credentials belong only in those private files or an approved external secret manager.

Prompt 34 does not create either `.env.local` file.

## Dokploy staging environment plan

When a later provider/migration phase is approved, put real staging values in the Dokploy Environment UI only.

- Do not commit them.
- Do not paste them into repository documentation.
- Do not put them in Compose files or committed `.env.example` files.
- The current staging runtime remains mock-backed.
- Adding variables to Dokploy does not mean that current runtime code reads or uses them.

## M1 SQL relationship

Prompt 32 and Prompt 33 SQL remain draft-only and unapplied. Prompt 34 does not apply SQL.

- Prompt 35 may plan staging migration application.
- Prompt 36 or later may apply M1 to Supabase staging only if explicitly approved.
- Backend adapter integration remains a later phase.
- Production application requires its own explicit approval after staging evidence.

## Manual Supabase project checklist

- [ ] Create or approve a Supabase organization/project for staging.
- [ ] Name the staging project `elearning-staging`.
- [ ] Choose the region intentionally and record the decision outside Git if needed.
- [ ] Save the database password securely outside Git.
- [ ] Copy the project reference privately.
- [ ] Copy the Supabase URL privately.
- [ ] Create or copy a publishable key for approved public/client use later.
- [ ] Create or copy a secret key for backend use only.
- [ ] Copy the connection string/DB URL for migration-apply tooling only.
- [ ] Keep the `app` schema unexposed.
- [ ] Do not apply M1 SQL yet.
- [ ] Do not seed data yet.

## Forbidden actions in Prompt 34

- No SQL application.
- No project secrets in Git.
- No frontend secret or database URL.
- No `app` schema exposure.
- No grants to `anon` or `authenticated`.
- No runtime Supabase adapter.
- No production project use.
- No push or deploy from this phase.

## Prompt 35 staging-apply planning note

Prompt 35 records a future [M1 Staging Migration Apply Plan](m1-staging-migration-apply-plan.md). Codex MCP is connected for staging planning only; the environment boundary is unchanged, real keys remain outside Git, and the `app` schema remains private and unexposed. Prompt 35 neither applies the draft nor creates runtime integration.

## Prompt 36 staging-apply note

Supabase staging ref `mgrsgibxuwgbxtdqprkw` now contains the M1 private `app` schema described in the [M1 Staging Migration Apply Report](m1-staging-migration-apply-report.md). The environment boundary is unchanged: no secret was committed, no Data API grant or exposure change was made, and runtime remains mock-backed. Manual Dashboard confirmation of the exposed-schema list remains required because that setting was not readable through the database session.

## Prompt 36B verification note

The owner completed the Dashboard exposure check for staging ref `mgrsgibxuwgbxtdqprkw` (display name `medway`). The `app` schema remains prohibited from exposure: it is visible in the schema list but unchecked, while only `public` and `graphql_public` are exposed. No Dashboard setting or grant changed, no production project was opened, and no secret was committed.

## Prompt 37 adapter-boundary note

Prompt 37 adds a local-only [Supabase Adapter Boundary](supabase-adapter-boundary.md). `PERSISTENCE_PROVIDER=mock` remains the default; no client, connection, query, repository adapter, runtime switch, or environment value consumption was added. The private `app` schema and existing secret boundary remain unchanged.
