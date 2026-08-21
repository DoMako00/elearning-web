# M1 Staging Migration Apply Plan

## Status

- Phase: Prompt 35
- Scope: staging migration application planning only
- SQL status: not applied
- SQL execution: none
- Database mutation: none
- Runtime integration: none
- Push/deploy: none

## Purpose

This document defines the future controlled process for applying the already reviewed M1 SQL draft to Supabase staging only. It does not authorize an active migration, SQL execution, database mutation, runtime integration, staging deployment, or production work.

The reviewed candidate remains [`001_m1_identity_brand_admin_foundation.sql`](../db/migration-drafts/m1/001_m1_identity_brand_admin_foundation.sql). It must remain a draft until a later explicit Prompt 36 approval authorizes a controlled staging-only application.

## Supabase staging target

- Project reference: `mgrsgibxuwgbxtdqprkw`
- Intended project name: `elearning-staging`
- Target environment: staging only
- Production target: forbidden

Production must use a separate project and a separately approved production-application phase. Prompt 35 does not use Supabase MCP, inspect project metadata, query data, execute SQL, or record secrets.

## Preconditions before Prompt 36 application

### Repository

- [ ] Working tree is clean.
- [ ] Active branch is `dev`.
- [ ] `dev` is synchronized with `origin/dev`; any intentional local commits are identified and approved for the staging application.
- [ ] The M1 SQL draft has passed the Prompt 33 static review.
- [ ] The draft is unchanged since review, or any change has a separate review commit and repeat review.
- [ ] No active migration has been created from the draft yet.
- [ ] No secrets, connection strings, or private environment files are committed.

### Supabase staging

- [ ] The staging project exists and its reference is confirmed as `mgrsgibxuwgbxtdqprkw`.
- [ ] The target is confirmed as `elearning-staging`, not a production project.
- [ ] The database password and connection URL are available to approved apply tooling outside Git.
- [ ] Publishable and secret keys remain outside Git; no key is copied into documentation, source, or Vite environment variables.
- [ ] The `app` schema is not exposed through the Supabase Data API.
- [ ] No `anon` or `authenticated` grant exists for the `app` schema or its M1 tables.

### Explicit approvals

- [ ] Owner approves staging-only mutation in Prompt 36.
- [ ] Owner confirms that production is not targeted.
- [ ] Owner confirms that seed data remains deferred under D36.
- [ ] Owner confirms that RLS design, schema exposure, and Data API access remain deferred.

## Apply-time review gates

The following must be explicitly resolved or reconfirmed at the time of application:

- Confirm `gen_random_uuid()` availability and the approved `pgcrypto`/extension policy. Prompt 36 must either require the function to exist already or separately authorize an extension step; it must not assume either outcome.
- Confirm the reviewed v1 choice of direct `app_users.auth_user_id` linkage without a foreign key to `auth.users` for the staging application.
- Keep D36 seed data deferred: no Medway/Elite rows, permission rows, or other seed data are part of M1 application.
- Do not add RLS policies or enable RLS as part of M1 application.
- Do not expose `app` through the Data API or grant access to `anon` or `authenticated`.
- Do not connect backend or frontend runtime to the resulting schema after application.
- Define and approve a rollback/down strategy before any future production application; M1 has no approved down migration.

## Proposed Prompt 36 staging-only sequence

This is a future runbook, not a command to execute in Prompt 35.

### A. Pre-apply verification

1. Confirm the exact target project reference is `mgrsgibxuwgbxtdqprkw` and the environment is `elearning-staging`.
2. Confirm a production project is not selected in the apply tool or connection configuration.
3. Inspect existing schemas and object names only through approved read-only tooling, if needed, to identify `app`-schema or M1 table-name conflicts.
4. Confirm the reviewed UUID/extension decision and verify that no change to the reviewed draft is required.
5. Confirm `app` is not exposed through the Data API and that no committed secret is present.

### B. Convert the reviewed draft into a controlled staging artifact

1. Copy the reviewed draft into a controlled staging-apply artifact only in Prompt 36.
2. Do not silently alter the source draft while creating that artifact.
3. If SQL changes are required, stop, create a dedicated review change, and re-review before any application.
4. Keep active migration authoring and SQL application distinct where the approved Prompt 36 workflow can do so.

### C. Apply to staging

1. Apply only after the Prompt 36 approval template is explicitly confirmed.
2. Target only project reference `mgrsgibxuwgbxtdqprkw`; never substitute a production target.
3. Apply the approved M1 structures only: private `app` schema, nine reviewed tables, constraints, indexes, and update triggers.
4. Do not add seed inserts, RLS policies, Data API exposure, or grants to `anon` or `authenticated`.
5. Capture application success or failure output. Stop immediately on any error.

### D. Post-apply verification

1. Confirm the private `app` schema exists.
2. Confirm all nine M1 tables, their required constraints, indexes, and update triggers exist.
3. Confirm no seed rows were inserted.
4. Confirm no RLS policies were created, `app` remains unexposed, and no `anon`/`authenticated` grants were added.
5. Record the structural verification result in a later staging-application evidence document without including credentials.

### E. Failure handling

1. Stop if any statement fails; do not make an ad-hoc patch in the staging database.
2. Record the failing statement, error output, and object state without including secrets.
3. Decide whether a reviewed remediation or a controlled staging cleanup is appropriate; cleanup requires its own explicit approval.
4. Do not continue to runtime integration or production application after any failure.

## Rollback planning

Prompt 32 did not create a down migration. If rollback is needed, select and approve one of these options before acting:

- Preferred: use an approved temporary Supabase branch or disposable staging environment when available.
- Alternative: create a staging-only controlled drop script in a separate review phase.
- Alternative: restore from an approved backup or snapshot if one is available.

Never run ad-hoc rollback SQL against production. Never drop schemas, tables, or other objects without explicit approval. A production rollback plan must be approved before any production application phase.

## Staging verification checklist

- [ ] `app` schema exists and remains private.
- [ ] `educational_brands` exists.
- [ ] `app_users` exists.
- [ ] `brand_memberships` exists.
- [ ] `student_profiles` exists.
- [ ] `admin_profiles` exists.
- [ ] `admin_permissions` exists.
- [ ] `admin_roles` exists.
- [ ] `admin_role_permissions` exists.
- [ ] `admin_role_assignments` exists.
- [ ] Required constraints, indexes, and update triggers exist.
- [ ] No seed rows exist.
- [ ] No RLS policies exist.
- [ ] No `anon` or `authenticated` grants exist for `app`.
- [ ] The `app` schema is not Data API exposed.
- [ ] API runtime remains mock-backed.
- [ ] Frontend remains mock-backed.
- [ ] Dokploy runtime remains mock-backed.

## Non-goals

- No production migration.
- No Supabase runtime adapter or client implementation.
- No authentication, admin read-model, student access, payment, media, or storage integration.
- No RLS policy implementation, schema exposure, or Data API grant.
- No seed data.
- No deployment, push, or Dokploy action.

## Prompt 36 approval template

> I approve Prompt 36 to apply the reviewed M1 SQL draft to Supabase staging only.
>
> Target project ref: `mgrsgibxuwgbxtdqprkw`
>
> Target environment: staging
>
> Production target: no
>
> I understand:
>
> - this will mutate the staging database;
> - it will create the `app` schema, M1 tables, constraints, indexes, and triggers;
> - it will not create seed data;
> - it will not expose the `app` schema;
> - it will not grant `anon` or `authenticated` access;
> - it will not enable RLS;
> - it will not connect runtime code; and
> - production remains untouched.

## Prompt 36 draft constraints

Any future Prompt 36 application request must include:

- the exact staging project reference;
- an explicit no-production rule;
- pre-apply read-only target and conflict inspection;
- an explicit SQL-application step after approval;
- post-apply structural verification;
- no seed data;
- no RLS implementation;
- no Data API grants or schema exposure;
- no runtime integration; and
- no push/deploy unless separately and explicitly approved.
