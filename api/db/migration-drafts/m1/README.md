# M1 SQL Migration Drafts

## Status and purpose

This directory contains non-applied SQL drafts for the M1 identity, educational-brand, membership, profile, and admin-authorization foundation. It translates the documentation-only [M1 Migration Draft Plan](../../../docs/m1-migration-draft-plan.md) into reviewable PostgreSQL/Supabase-compatible structures.

These files are not active migrations. They are deliberately outside `supabase/migrations` and `api/db/migrations`, are not connected to a migration runner, and must not be applied without a later explicit migration-application approval.

## Safety warning

- Do not run these drafts against local, staging, or production databases.
- Do not copy them into an active migration path before SQL review is complete.
- Do not connect them to Supabase, a Postgres client, runtime adapters, or deployment automation.
- Do not add grants or expose the private `app` schema through the Supabase/Data API.
- Do not add seed data in this phase. D36 keeps seed strategy deferred.

## M1 draft contents

The current draft covers:

- the private `app` schema;
- `educational_brands`;
- global `app_users` with draft direct auth-identity linkage;
- explicit brand-scoped `brand_memberships`;
- brand-scoped `student_profiles` and `admin_profiles`;
- a global `admin_permissions` catalog;
- brand-scoped `admin_roles`;
- `admin_role_permissions`; and
- brand-scoped `admin_role_assignments` with same-brand constraints.

Membership and profiles do not grant protected access. Orders, manual payment evidence, subscriptions, seat assignments, enrollments, explicit `access_grants`, and their backend policy evaluation remain M3 work.

## Excluded from M1

The drafts do not include learning/content, commerce, payment, refund, subscription, seat, enrollment, access-grant, device, session, protected-media, assessment, full audit/evidence, provider-integration, runtime-adapter, or seed structures. They do not implement Supabase Auth integration, RLS policies, Data API exposure, rollback/application scripts, or deployment configuration.

Full append-only audit/evidence persistence remains M4. Admin command activation must wait for that evidence foundation or a separately approved minimal audit phase.

## Review process

Before any draft becomes an active migration:

1. Review every table, constraint, index, trigger, and lifecycle value against the [M1 SQL Draft Review](../../../docs/m1-sql-draft-review.md).
2. Resolve the UUID/extension, auth identity, uniqueness, membership history, role model, audit dependency, seed, rollback, RLS, and rollout questions.
3. Run a separate SQL review/fix phase without applying the draft.
4. Create an active migration only in a later explicitly approved authoring phase.
5. Review and approve staging application separately.
6. Review and approve production application separately.

## RLS and Data API gate

The `app` schema is private and backend-mediated initially. Prompt 32 does not expose it or grant access to Supabase Data API roles. If any table is proposed for exposure, RLS must first be designed, enabled, reviewed, and tested for that table, followed by explicit exposure approval. M7 remains the full RLS hardening/review/testing phase.

## Future phases

- Prompt 33 or a later phase may review and correct the SQL draft.
- Migration application requires a separate explicit phase.
- Supabase connection and provider/runtime integration remain separate phases.
- D36 defers Medway/Elite brand and permission seed data until migrations and seed strategy are separately reviewed.
