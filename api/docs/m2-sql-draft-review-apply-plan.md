# M2 SQL Draft Review and Staging Apply Plan

## Status

- Phase: Prompt 45
- Scope: static SQL review, hardening, and Prompt 46 staging-apply planning only
- Draft state: reviewed and unapplied
- SQL execution: none
- Database/Supabase mutation: none
- Seed data: none
- Runtime/frontend/provider changes: none
- RLS, policies, grants, and Data API exposure changes: none
- Push/deploy: none

The reviewed source is [001_m2_curriculum_brand_course_instructor.sql](../db/migration-drafts/m2/001_m2_curriculum_brand_course_instructor.sql). It remains under the non-active `api/db/migration-drafts/m2/` convention. Prompt 45 does not create `supabase/migrations`, `api/db/migrations`, a migration runner, or an apply script.

## Review scope and readiness conclusion

The draft is structurally safe to apply after M1 once Prompt 46 repeats the staging catalog preflight and receives explicit owner approval to mutate the staging database. The review found no domain-model blocker, cross-brand integrity gap, seed dependency, runtime dependency, or production requirement.

Prompt 45 made limited hardening changes:

- named all seven primary-key constraints explicitly;
- added non-empty checks for the required academic-level name, semester name, and module title;
- removed six explicit indexes whose leading columns were already covered by unique constraints or were superseded by exact composite-FK indexes; and
- added exact child-side indexes for the two composite foreign keys on `course_instructors`.

After the fixes, the draft contains exactly seven `CREATE TABLE app.*` statements, 48 named constraints, seven explicit indexes, and seven update triggers. It contains no seed or data-write statement, schema/extension creation, grant/revoke, RLS/policy statement, or Data API configuration.

## M1 dependency assessment

| Dependency | Assessment | Prompt 46 preflight |
| --- | --- | --- |
| Private `app` schema | Required and already documented as applied in M1 | Confirm with a read-only catalog query |
| `app.educational_brands` | Required by `brand_instructors.brand_id` and `brand_courses.brand_id` | Confirm table and `id` column exist |
| `app.educational_brands.id` type | M1 defines UUID identity and M2 uses UUID `brand_id` | Confirm catalog type is `uuid` |
| `app.set_updated_at()` | M1 defines and Prompt 36 verified the trigger function | Confirm the function resolves in `app` |
| UUID generation | M2 follows M1 `gen_random_uuid()` defaults | Confirm the existing target supports the already-used M1 convention |
| Timestamps | M2 follows M1 `timestamptz not null default now()` convention | No additional object required |
| Seed rows | None required | M2 can apply to an empty M1 database |
| Medway/Elite rows | Not required | Do not seed either brand during apply |

The draft does not recreate the `app` schema, an extension, or `app.set_updated_at()`. Local M1 SQL and the Prompt 36 apply report support these dependencies. No live catalog connection was made in Prompt 45; authoritative catalog confirmation remains a mandatory Prompt 46 preflight.

## Table-by-table findings

### `app.academic_levels`

- Shared BUC reference data with no `brand_id`, university, campus, or tenant column.
- UUID primary key now has the explicit name `academic_levels_pkey`.
- `level_number` and `sort_order` are positive and independently unique.
- Required `display_name` is non-empty after trimming.
- Lifecycle is limited to `active | inactive`; phase is correctly absent.
- One M1-owned `set_updated_at` trigger is attached.

Result: ready.

### `app.academic_semesters`

- Required UUID `level_id` references `app.academic_levels(id)` with `ON DELETE NO ACTION`.
- `semester_number` is globally unique for the single BUC program; the database does not hard-code ten semesters.
- `(level_id, sort_order)` preserves ordered membership within a level.
- Phase is modeled here as `phase_i | phase_ii`, allowing the Phase I/II boundary to cross the Level 3 area without putting phase on the level.
- Required `display_name` is non-empty after trimming.
- No brand or university scope is introduced.

Result: ready.

### `app.academic_modules`

- Required UUID `semester_id` references `app.academic_semesters(id)` with `ON DELETE NO ACTION`.
- `module_code` is required, non-empty, and globally unique for the current BUC-only scope.
- Required `title` is now non-empty after trimming.
- `(semester_id, sort_order)` provides deterministic ordering.
- The table has no brand, pricing, subscription, access, enrollment, or content-ownership fields.
- The unresolved PDM/PDM-like `1105` label remains unguessed and unseeded.

Result: ready.

### `app.instructors`

- Global UUID identity has no owning brand, `app_user_id`, authentication, student, or admin coupling.
- Required display name is non-empty; professional title remains optional.
- Lifecycle is limited to `active | inactive`.
- One identity can therefore participate in Medway, Elite, or both through separate association rows.

Result: ready.

### `app.brand_instructors`

- `brand_id` references M1 `app.educational_brands(id)` and `instructor_id` references global `app.instructors(id)`.
- `UNIQUE (brand_id, instructor_id)` allows one row per instructor per brand while permitting two rows for Medway and Elite.
- `UNIQUE (id, brand_id)` remains available for future brand-safe composite references.
- The relationship is teaching association only; it does not imply login, employment, administration, membership, subscription, or access.
- Delete behavior is conservative `NO ACTION`.

Result: ready.

### `app.brand_courses`

- Mandatory `brand_id` anchors every course to exactly one educational brand.
- Nullable `academic_module_id` supports standalone offerings.
- `course_scope` is limited to `curriculum | standalone`; curriculum requires an academic module, while standalone may be null or intentionally mapped later.
- `UNIQUE (brand_id, course_code)` keeps course identity brand-local and independent from academic `module_code`.
- There is deliberately no `UNIQUE (brand_id, academic_module_id)`, so one brand may publish multiple offerings for one module.
- `UNIQUE (id, brand_id)` is the target for same-brand course assignments.
- Status is publication lifecycle only: `draft | published | archived`. It is not payment, subscription, enrollment, or access state.
- No pricing, product, subscription, payment, enrollment, grant, or content-sharing field exists.
- The nullable academic-module FK uses `NO ACTION`, preserving curriculum linkage rather than silently removing it.

Result: ready.

### `app.course_instructors`

- One course may have many instructors and one instructor may teach many courses.
- `UNIQUE (course_id, instructor_id)` prevents duplicate current assignments.
- `(course_id, brand_id)` references `brand_courses(id, brand_id)`.
- `(brand_id, instructor_id)` references `brand_instructors(brand_id, instructor_id)`.
- Exact child-side indexes now support both composite FKs.
- Status is limited to `active | inactive`; active-status eligibility remains backend/domain policy because a normal FK cannot require the referenced association to remain active.

Result: ready.

## Composite foreign-key review

The same-brand strategy is valid and preserves both isolation and legitimate cross-brand teaching:

1. `course_instructors.brand_id` cannot contradict its course because `(course_id, brand_id)` must match the unique target `brand_courses(id, brand_id)`.
2. The same `brand_id` and `instructor_id` must match an existing unique `brand_instructors(brand_id, instructor_id)` row.
3. An Elite-only instructor association cannot be assigned to a Medway course.
4. The same global instructor can teach both brands when both brand-association rows exist.
5. UUID types and column order match on both sides of each composite FK.

The supporting indexes are `course_instructors_course_brand_idx (course_id, brand_id)` and `course_instructors_brand_instructor_idx (brand_id, instructor_id)`.

## Check-constraint and lifecycle review

- Positive checks cover level numbers, semester numbers, and all current sort-order fields.
- Required academic labels/titles and existing codes/titles are rejected when empty after trimming.
- Reference and instructor-association status is `active | inactive`.
- Course publication status is `draft | published | archived` and is not a commercial/access state.
- Course scope is `curriculum | standalone`.
- `curriculum` requires `academic_module_id`; standalone remains representable with a null mapping and is not over-constrained from having an intentional mapping.
- No evolving course subtype, instructor role, prerequisite, credit-hour, primary-instructor, or student-placement taxonomy is prematurely encoded.

## Trigger review

Every M2 table has `updated_at` and exactly one deterministic `BEFORE UPDATE` trigger calling the M1-owned `app.set_updated_at()` function. The draft does not recreate or replace the function. No trigger performs cross-domain work, data seeding, authorization, or lifecycle side effects beyond maintaining `updated_at`.

Expected triggers:

- `academic_levels_set_updated_at`
- `academic_semesters_set_updated_at`
- `academic_modules_set_updated_at`
- `instructors_set_updated_at`
- `brand_instructors_set_updated_at`
- `brand_courses_set_updated_at`
- `course_instructors_set_updated_at`

## Index review

Unique constraints already create indexes and provide the relevant leftmost lookup paths. Prompt 45 removed redundant single-column indexes and retained only justified lookup/relationship indexes:

- `brand_instructors_instructor_id_idx`
- `brand_courses_academic_module_id_idx` (partial, non-null mappings only)
- `brand_courses_brand_module_idx` (partial, brand/module lookup without uniqueness)
- `brand_courses_brand_status_idx`
- `course_instructors_course_brand_idx`
- `course_instructors_brand_instructor_idx`
- `course_instructors_instructor_id_idx`

This is seven explicit indexes. Constraint-backed indexes remain separate and are not duplicated deliberately. Additional indexes must be justified by observed query patterns rather than added speculatively.

## Foreign-key delete behavior

All eight M2 foreign keys explicitly use `ON DELETE NO ACTION`. This preserves academic, brand, instructor, course, and assignment history and prevents silent cascades. `brand_courses.academic_module_id` remains `NO ACTION`, not `SET NULL`, so deleting an academic module cannot silently sever its curriculum meaning. Archival/status transitions are preferred to hard deletion.

## StudentProfile alignment

M1 `app.student_profiles` remains unchanged. Its textual `academic_year`, `academic_term`, and `university` fields remain compatibility/context fields. A later, separately reviewed migration may add nullable `academic_level_id` and `academic_semester_id` only after mapping, backfill, compatibility, and rollback policy are approved.

Academic placement may support discovery, filtering, recommendations, or policy inputs. It does not create membership, enrollment, subscription, payment approval, seat assignment, `access_grant`, or protected-content authorization.

## Catalog verification status

Prompt 45 used repository artifacts only and made no database connection. The following live facts are therefore **pending mandatory Prompt 46 SELECT-only preflight**, even though M1 apply/verification documents already support them:

- exact staging target identity;
- `app` schema and required M1 tables;
- `app.educational_brands.id` is `uuid`;
- `app.set_updated_at()` resolves;
- none of the seven M2 tables already exists; and
- no M2 migration-history record already exists.

No missing credential blocks this static review. Credentials must not be requested, printed, or committed in Prompt 45.

## Apply readiness

**Decision: ready for a separately approved Prompt 46 staging apply, subject to all preflight gates passing unchanged.**

The draft is PostgreSQL-transaction-safe: it uses ordinary `CREATE TABLE`, `CREATE INDEX`, and `CREATE TRIGGER` statements, with no `CONCURRENTLY` command or transaction-prohibited operation. One transaction is recommended. Prompt 46 must establish the chosen migration tool's transaction behavior before mutation and must not claim atomicity unless the tool or result confirms it.

## Prompt 46 controlled staging apply plan

### 1. Repository gate

1. Confirm branch `dev` and a clean working tree.
2. Fetch and confirm `HEAD` is synchronized with the intended `origin/dev` checkpoint.
3. Confirm no merge or rebase is active.
4. Confirm the reviewed Prompt 45 commit and exact SQL checksum.
5. Confirm `supabase/migrations` and `api/db/migrations` are absent.
6. Re-run static forbidden-statement and secret scans.
7. If the SQL differs from the reviewed Prompt 45 commit, stop for a new review commit.

### 2. Target and secret gate

1. Target project ref must be exactly `mgrsgibxuwgbxtdqprkw`.
2. Target environment must be explicitly confirmed as staging; project display name `medway` is the owner-approved staging project.
3. Production must be explicitly excluded.
4. Database URL, username, password, JWTs, keys, and CA material must remain process-local or in an approved private secret manager outside Git.
5. Do not print or paste secret values into logs, reports, commands, docs, or commit messages.
6. Stop before connecting if the exact target cannot be confirmed.

### 3. SELECT-only catalog preflight

Before any DDL, use read-only catalog queries to confirm:

- schema `app` exists;
- required M1 tables, including `app.educational_brands`, exist;
- `app.educational_brands.id` has type `uuid`;
- `app.set_updated_at()` exists and resolves;
- none of `academic_levels`, `academic_semesters`, `academic_modules`, `instructors`, `brand_instructors`, `brand_courses`, or `course_instructors` exists in `app`;
- no conflicting relation uses any planned M2 name; and
- Supabase migration history does not already contain `m2_curriculum_brand_course_instructor` or an equivalent applied M2 record.

Any conflict, partial prior application, missing dependency, project mismatch, or uncertain target is a stop condition. Do not apply twice.

### 4. Apply once

1. Apply the exact reviewed file `api/db/migration-drafts/m2/001_m2_curriculum_brand_course_instructor.sql` once.
2. Use migration name `m2_curriculum_brand_course_instructor` if the approved tool records migration history.
3. Prefer one controlled transaction. Do not add extension/schema creation, wrappers that change statement semantics, seeds, RLS, policies, grants, exposure, or cleanup SQL.
4. Capture a sanitized success/failure result and whether the tool explicitly confirmed transaction handling.
5. Do not retry blindly.

### 5. Failure policy

- If preflight fails, make no mutation.
- If a transactional apply fails before commit, stop and record the failure; do not rerun without reviewing the cause.
- If the tool can partially apply outside a transaction, stop immediately after an error and inspect only with SELECT-only catalog queries.
- Do not drop, alter, patch, or manually complete partial objects without separate explicit owner approval and a reviewed recovery plan.
- Never redirect the apply to production.

### 6. Post-apply SELECT verification

Confirm with read-only catalog/data checks:

- all seven M2 tables exist in `app`;
- all 48 expected named constraints exist with the reviewed definitions;
- all seven explicit indexes plus required constraint-backed indexes exist;
- all seven update triggers exist and invoke `app.set_updated_at()`;
- every M2 table has zero rows;
- the nine M1 tables and M1 trigger utility remain intact;
- no RLS policy exists on M2 tables and RLS was not enabled by the apply;
- `anon` and `authenticated` received no schema/table/function privilege;
- no seed data or unrelated object was created; and
- no Data API setting or exposed-schema list changed. If SQL cannot authoritatively prove the Dashboard setting, record that no settings operation occurred and require manual Dashboard confirmation that `app` remains unchecked.

### 7. Documentation and local commit

Create a sanitized M2 staging apply report recording target, reviewed source commit/checksum, preflight evidence, one-shot apply result, transaction evidence, schema verification, zero-row result, access/exposure state, and remaining production/rollback gates. Update only the relevant M2/status documents. Validate the documentation diff, then commit locally with the Prompt 46-approved message. Do not push or deploy until that report is reviewed and a separate checkpoint is approved.

## Rollback and production boundary

Prompt 45 does not create destructive rollback SQL. Staging apply should fail before commit through a single transaction where the approved tool supports and confirms it. If a partial non-transactional state occurs, recovery requires a separately reviewed staging-only plan and explicit owner approval.

Before production, provide and review a down/rollback strategy, backup/restore or approved branch/snapshot option, failure rehearsal, and production-specific target approval. Never use ad-hoc destructive SQL against production.

## Explicit non-goals

- No M2 application, catalog query, or database connection in Prompt 45.
- No active migration path or migration runner.
- No seed data, BUC catalog rows, brands, instructors, courses, or assignments.
- No student-profile alteration or backfill.
- No RLS, policy, grants, Data API exposure, or project-setting change.
- No runtime repository, adapter, auth, API, frontend, Docker, Compose, or Dokploy change.
- No production access, push, or deployment.

BUC remains the sole academic scope; no university table is introduced. Academic modules remain shared reference data, brand courses remain brand-owned offerings, global instructors may teach both brands through explicit brand associations, standalone courses remain supported, and multiple courses per brand/module remain valid.
