# M2 Staging Migration Apply Report

## Status

- Target project ref: `mgrsgibxuwgbxtdqprkw`
- Environment: `staging`
- Production: not accessed and not authorized.
- Applied SQL: [001_m2_curriculum_brand_course_instructor.sql](../db/migration-drafts/m2/001_m2_curriculum_brand_course_instructor.sql)
- Result: **M2 schema applied to staging exactly once.**

## Git and credential preflight

- The local repository was on clean `dev`; no merge or rebase was in progress.
- `git fetch origin dev` completed and `origin/dev` had not advanced relative to local `dev`.
- Prompt 45 review commit `db8b55e98648323fa16efed214ef97000ac700c3` was present.
- The applied draft matched that reviewed version exactly: Git blob hash `cbb17c53c4477da392cbb930e07ae05356d19648`.
- Static review reconfirmed seven `CREATE TABLE` statements, 48 named constraints, seven explicit indexes, eight foreign keys with `ON DELETE NO ACTION`, and seven update triggers. The file contains no seed/data writes, RLS/policy/grant/Data API statement, schema/extension creation, or transaction-prohibited concurrent index statement.
- The local-only, non-committed process loader at `C:\Users\ProjeCss\.elearning-secrets\m2-staging-env.ps1` supplied the apply gate, target ref, connection setting, and trusted TLS-root path only to the execution process. No value, URL, credential, or certificate content was printed, persisted, or committed.
- Target validation confirmed the enabled gate, exact project ref, PostgreSQL URL protocol, host and database name, `sslmode=verify-full`, and an existing trusted-root certificate file. The certificate was supplied to the direct PostgreSQL client in memory while hostname verification remained enabled.

## Pre-apply catalog verification

Read-only catalog checks confirmed:

- `current_database()` returned `postgres`.
- The private `app` schema exists.
- All nine M1 tables exist: `educational_brands`, `app_users`, `brand_memberships`, `student_profiles`, `admin_profiles`, `admin_permissions`, `admin_roles`, `admin_role_permissions`, and `admin_role_assignments`.
- `app.educational_brands.id` is `uuid` and `app.set_updated_at()` resolves.
- None of the seven M2 tables or equivalent named M2 constraints, indexes, or triggers existed.

## Apply execution

- The unchanged reviewed draft was executed exactly once through a direct PostgreSQL connection to the authorized staging project.
- Transaction behavior: explicit `BEGIN`, the exact reviewed DDL contents, then `COMMIT`.
- The transaction committed successfully; sanitized execution duration was approximately 298 ms.
- No retry, manual repair, rollback, seed, user/app data insert, runtime switch, or deployment occurred.
- An initial direct-connection preflight stopped during TLS certificate validation before any SQL was accepted. After the trusted root was made available locally, the full Git, target-validation, and SELECT-only catalog preflight sequence was restarted and passed. No rollback was required.

## Post-apply verification

- Created tables: `academic_levels`, `academic_semesters`, `academic_modules`, `instructors`, `brand_instructors`, `brand_courses`, and `course_instructors` in schema `app`.
- All seven M2 tables exist and each has zero rows. No seed data or test data was created.
- The catalog contains all 48 expected M2 named constraints, with the complete name set matching the reviewed draft: seven named primary keys and eight expected foreign keys.
- All seven explicit indexes exist: `brand_instructors_instructor_id_idx`, `brand_courses_academic_module_id_idx`, `brand_courses_brand_module_idx`, `brand_courses_brand_status_idx`, `course_instructors_course_brand_idx`, `course_instructors_brand_instructor_idx`, and `course_instructors_instructor_id_idx`.
- All seven `app.set_updated_at()` triggers exist and resolve to `app.set_updated_at()`.
- The two same-brand composite foreign keys exist exactly as designed:
  - `course_instructors(course_id, brand_id)` references `brand_courses(id, brand_id)`.
  - `course_instructors(brand_id, instructor_id)` references `brand_instructors(brand_id, instructor_id)`.
- No unique constraint exists on `brand_courses(brand_id, academic_module_id)`.
- PostgreSQL catalog verification reports `confdeltype = 'a'` for all eight foreign keys, its authoritative `NO ACTION` code. `pg_get_constraintdef` omits that default clause from rendered text; this is a display difference, not a schema difference.
- The nine M1 tables and the `app.set_updated_at()` dependency remain intact.
- The application-controlled privacy checks confirm `anon` and `authenticated` lack `USAGE` on schema `app`, and neither role has M2 table grants. The seven M2 tables have RLS disabled and no policies. The applied draft contains no grant, RLS, policy, or Data API configuration operation.

## Exclusions and cleanup

- No production connection, Supabase MCP use, push, or deployment occurred.
- No active migration file, seed file, API runtime source, frontend source, package file, Docker/Compose/Dokploy configuration, or environment template was changed.
- All process-only apply and TLS-root variables were removed after every connection command.
