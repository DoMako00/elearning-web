# M1 Staging Migration Apply Report

## Status

- Phase: Prompt 36
- Result: applied successfully to Supabase staging
- Target project ref: `mgrsgibxuwgbxtdqprkw`
- Supabase project name at apply time: `medway`
- Target environment: staging
- Production target: no
- Runtime integration: no
- Push/deploy: no

The owner explicitly confirmed that the project currently named `medway` is the intended staging target despite the earlier recommended name `elearning-staging`.

## Applied source

- SQL source: `api/db/migration-drafts/m1/001_m1_identity_brand_admin_foundation.sql`
- Repository `HEAD` before application: `bdefc09` (`plan M1 staging migration apply`)
- Original SQL draft commit: `2108261e3787aa53100dd484afe6f0b9825e7f25`
- Reviewed by: Prompt 33 / commit `14d6a59`
- SHA-256 at application: `5478C78B598EDF2F2F720683C4D8354132175C0CFBFFC4163819DC844512894D`
- MCP migration name: `m1_identity_brand_admin_foundation`
- Supabase migration version: `20260821033531`

The Prompt 32/33 draft was unchanged from its reviewed commit and was passed byte-for-byte to the MCP migration operation. No wrapper SQL, extension creation, seed statement, RLS statement, policy, grant, or exposure change was added. The MCP response reported success but did not explicitly state transaction semantics, so transactional execution is not independently claimed by this report.

## Preflight summary

### Repository

- Working tree was clean on `dev`.
- `dev` was synchronized with `origin/dev` at `bdefc09`.
- No merge or rebase was active.
- `supabase/migrations` and `api/db/migrations` were absent.
- The reviewed SQL hash and Git history matched the approved draft.
- Static scans found nine M1 table statements, 16 explicit index statements, eight update-trigger statements, and one private-schema statement.
- Static scans found no seed insert, RLS enablement, RLS policy, role grant, extension creation, or forbidden active schema identifier.
- No secret or connection value was read from or added to the repository.

### Supabase staging target

- MCP project metadata matched ref `mgrsgibxuwgbxtdqprkw`.
- Project status was `ACTIVE_HEALTHY` in `eu-west-3`.
- The project name was `medway`, explicitly owner-confirmed as staging before application.
- No `app` schema or conflicting `app` object existed.
- No prior Supabase migration record existed.
- `pgcrypto` 1.3 was already installed in the `extensions` schema.
- Both `extensions.gen_random_uuid()` and `pg_catalog.gen_random_uuid()` were available.
- No `anon` or `authenticated` schema, table, or routine grant existed for `app`.
- The PostgREST exposed-schema setting was not readable from the database session; no project-setting mutation was performed.

## Apply summary

- Target ref: `mgrsgibxuwgbxtdqprkw`
- Target environment: staging only
- Result: success
- Controlled DDL calls: one
- Migration retries: none
- SQL changes during apply: none
- Extension creation: none
- Seed data: none
- RLS enablement or policies: none
- Grants to `anon` or `authenticated`: none
- `app` schema exposure or project-setting change: none
- Runtime/provider integration: none
- Production operation: none

## Post-apply verification

| Check | Result |
| --- | --- |
| Private `app` schema exists | Passed |
| Nine M1 tables exist | Passed |
| All nine tables contain zero rows | Passed |
| Catalog constraints | Passed: 45 total, including 37 explicit named clauses plus eight inline primary keys |
| Required unique and same-brand constraints | Passed |
| Database indexes | Passed: 36 total, including all 16 explicit planned indexes plus constraint-backed indexes |
| Expression and partial indexes | Passed |
| Update triggers | Passed: eight |
| `admin_role_permissions` has no `updated_at` column/trigger | Passed |
| `app.set_updated_at()` | Passed: security invoker with `search_path=pg_catalog` |
| RLS enabled | No, as explicitly approved for this private staging phase |
| RLS policies | Zero |
| Effective `anon`/`authenticated` schema privileges | None |
| Effective `anon`/`authenticated` table privileges | None |
| Effective `anon`/`authenticated` function execution | None |
| Direct table/routine grants to Data API roles | Zero |
| App sequences | Zero |
| Migration history | One `m1_identity_brand_admin_foundation` record |
| Runtime/frontend/Dokploy mode | Remains mock-backed |

Verified required constraints include brand code/slug uniqueness, global auth-user uniqueness, user-brand membership uniqueness, same-brand student-membership references, brand-scoped profile uniqueness, reusable permission-code uniqueness, brand-role uniqueness, role-permission primary key, same-brand admin profile/role/assigner references, and the partial active-assignment uniqueness index.

The Supabase table metadata tool emitted its generic critical advisory because RLS is disabled on the nine `app` tables. Read-only privilege checks independently found that `anon` and `authenticated` have no schema usage, table privileges, or trigger-function execution. The advisory remains important: these tables must not be exposed or granted to Data API roles without RLS being designed, enabled, reviewed, and tested first.

The database session did not expose the PostgREST schema-list setting, so Data API exposure could not be authoritatively confirmed through MCP/SQL. Prompt 36 performed no exposure or project-setting operation. Manual confirmation in Supabase Dashboard remains required before moving beyond verification hardening.

## Remaining gates

- D36 seed strategy remains deferred; no educational-brand or permission rows exist.
- RLS design, testing, and Data API exposure remain deferred to an explicit later phase.
- Full append-only audit/evidence persistence remains later work.
- Backend Supabase adapters and runtime switching remain later work; mock providers are still active.
- Production application requires a separate explicit approval and target.
- A reviewed rollback/down migration is required before production application.
- Manual Dashboard confirmation that `app` is absent from exposed schemas remains outstanding.

## Failure section

No failure occurred. No retry, manual patch, cleanup, drop, or rollback was performed.

## Next safe phase recommendation

Recommend **Prompt 36B — Staging Apply Verification Hardening** to record manual Data API exposed-schema confirmation and reconcile the generic RLS advisory with the intentionally private schema boundary. After that confirmation, **Prompt 37 — Backend Supabase Adapter Boundary** may plan provider integration without switching the runtime from mock.
