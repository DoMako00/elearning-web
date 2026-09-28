# M1 SQL Draft Review Fixes

## Status

- Phase: Prompt 33
- Scope: static review and documentation clarification only
- SQL application: none
- Database/Supabase connection: none
- Push/deploy: none

## Issues found and fixes made

| Area | Finding | Prompt 33 resolution |
| --- | --- | --- |
| Timestamp triggers | The Prompt 32 review did not explicitly explain why the nine-table draft has eight `updated_at` triggers. | Clarified that `app.admin_role_permissions` is an immutable join table with `created_at` only; it deliberately has no `updated_at` column or update trigger. |
| Static review record | The draft did not yet contain a dedicated Prompt 33 review outcome. | This document records the completed boundary, syntax-shape, integrity, index, security-gate, and documentation review. |

## SQL review result

No SQL change was required. The draft remains structurally consistent with the finalized M1 decisions:

- creation order precedes every foreign-key reference;
- all composite foreign-key targets have matching unique constraints:
  `brand_memberships(id, brand_id)`, `admin_profiles(id, brand_id)`, and `admin_roles(id, brand_id)`;
- same-brand student membership and admin role-assignment relationships are enforced;
- names are lowercase, schema-qualified, and use concise brand terminology;
- partial and expression indexes use PostgreSQL-compatible forms;
- unique constraints provide code, slug, and auth-user lookup coverage without redundant duplicate indexes;
- the eight mutable tables with `updated_at` each have one explicit trigger using `app.set_updated_at()`;
- `admin_role_permissions` deliberately has only `created_at`, so no ninth update trigger is needed;
- no `on delete cascade` behavior is present;
- no hard foreign key to `auth.users` is present; and
- the `gen_random_uuid()`/pgcrypto availability decision remains a review gate rather than an active extension statement.

## Intentionally deferred

- approval of `gen_random_uuid()` availability and pgcrypto/extension policy;
- direct `auth_user_id` versus a future multi-provider identity mapping;
- any foreign key to `auth.users(id)`;
- email/phone uniqueness policy;
- membership lifecycle history model;
- global role templates, if ever needed;
- seed strategy under D36;
- full audit/evidence persistence and command activation under M4;
- RLS design, enablement, testing, and Data API exposure approval;
- rollback, staging-apply, and production-apply planning.

## Final static validation result

Passed without database execution:

- draft remains only under `api/db/migration-drafts/m1/`;
- no `supabase/migrations` or `api/db/migrations` directory exists;
- no migration runner, provider/client, runtime adapter, or seed path exists in the reviewed scope;
- all nine M1 tables, 37 constraints, 16 indexes, and eight update triggers were found;
- no duplicate constraint, index, or trigger names were found;
- no active SQL identifier uses legacy platform terminology or long educational-brand scope names;
- no seed insert, RLS policy/enablement, Data API role grant, extension creation, or cascade delete appears in active SQL; and
- no SQL was applied and no database/Supabase connection, push, or deployment occurred.

The next safe activity is later migration-review/apply planning, with active migration authoring and application still requiring separate explicit approval.
