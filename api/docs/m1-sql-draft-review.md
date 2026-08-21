# M1 SQL Draft Review

## Status

- Phase: Prompt 32
- Scope: draft SQL and documentation only
- SQL status: draft only; not applied
- Database connection: none
- Supabase connection: none
- Push/deploy: none

This review records the first translation of finalized M1 decisions into PostgreSQL/Supabase-compatible draft structures. It is not migration-application, staging, or production approval.

## Files created

- `api/db/migration-drafts/m1/001_m1_identity_brand_admin_foundation.sql`
- `api/db/migration-drafts/m1/README.md`

The directory is deliberately non-active. No `supabase/migrations` or `api/db/migrations` path was created.

## Main draft decisions

- Internal objects use the private `app` schema.
- `educational_brands` is the canonical educational-brand table.
- Scope columns use concise `brand_id` terminology.
- `app_users` is global and uses direct `auth_user_id` linkage in this draft.
- No hard foreign key to `auth.users` is included yet.
- `brand_memberships` is explicit and brand-scoped.
- `student_profiles` and `admin_profiles` are brand-scoped.
- Student profiles require a same-brand membership reference in this draft.
- `admin_permissions` is a global reusable catalog.
- `admin_roles` is brand-scoped for v1.
- `admin_role_assignments` is brand-scoped and constrained to same-brand profiles and roles.
- No seed data or permission catalog rows are inserted.
- No RLS policy implementation or Data API exposure is included.
- Full audit/evidence persistence remains an M4 dependency.

These structures do not make membership, a profile, an admin profile, authentication, payment evidence, or any commercial record sufficient for protected access. Explicit access grants and backend evaluation remain separate requirements.

## Review required before migration application

The following items require explicit review before an active migration is authored or applied:

- confirm `gen_random_uuid()` availability and the approved `pgcrypto`/extension policy;
- confirm direct `auth_user_id` versus a separate multi-provider identity mapping;
- decide whether a Supabase-specific foreign key to `auth.users(id)` is appropriate;
- confirm global versus non-unique email and phone strategy;
- confirm one persistent membership row per user-brand versus multiple lifecycle-history rows;
- confirm that `student_profiles.brand_membership_id` remains mandatory;
- confirm brand-scoped `admin_roles` versus global role templates;
- define the separate seed strategy for educational brands and permissions under D36;
- determine whether a minimal append-only audit foundation must precede admin command activation;
- design, review, enable, and test RLS before any table exposure;
- define rollback/down-migration strategy;
- define a separately approved staging application plan; and
- define a separately approved production application plan.

## Non-goals confirmed

Prompt 32 adds no:

- commerce, product, offer, plan, price, order, payment, transaction, or refund tables;
- subscription, seat, enrollment, or `access_grants` tables;
- device or session tables;
- learning/content hierarchy or lesson-resource tables;
- protected-media tables or provider integration;
- quiz, assessment, or attempt tables;
- seed data;
- full audit/evidence tables;
- Supabase SDK, Postgres client, provider adapter, or runtime database integration;
- RLS policies or Data API exposure;
- deployment or production decision.

## RLS and Data API gate

The `app` schema remains private/backend-mediated. No Supabase/Data API exposure is approved. If exposure is proposed later, the relevant tables must have RLS designed, enabled, reviewed, and tested before explicit exposure approval. M7 remains the full RLS hardening/review/testing phase.

## Static validation checklist

- [x] No active SQL identifier uses `platform_id`.
- [x] No active SQL identifier uses `platform_code`.
- [x] No active SQL identifier uses `educational_brand_id`.
- [x] No active SQL identifier uses `educational_brand_code`.
- [x] The canonical table is `educational_brands`.
- [x] Scoped tables use `brand_id`.
- [x] Explicit `brand_memberships` exist.
- [x] `app_users` remains global.
- [x] Student/admin profiles and admin assignments are brand-scoped.
- [x] Cross-brand composite foreign keys are present.
- [x] No `insert into` statement or seed data exists.
- [x] No RLS policy or Data API role grant exists.
- [x] No Supabase SDK, runtime, Docker, Compose, or deployment file changed.
- [x] No database or Supabase connection was used.

## Next review phase

## Prompt 33 review result

Prompt 33 completed a static review without changing the SQL draft. All eight tables with `updated_at` have one explicit update trigger. The ninth table, `admin_role_permissions`, is deliberately an immutable join table with `created_at` only, so it has no `updated_at` column or update trigger. See [M1 SQL Draft Review Fixes](m1-sql-draft-review-fixes.md) for the review record, deferred items, and validation result.

The next step is later migration-review/apply planning. It must not apply this SQL. Active migration authoring, staging application, and production application remain separate explicit approvals.
