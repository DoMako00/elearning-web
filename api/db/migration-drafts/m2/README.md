# M2 Curriculum, Brand Course, and Instructor Drafts

## Status and safety

This directory contains Prompt 44 non-applied SQL drafts for the shared BUC academic reference hierarchy, global instructor identity, brand-instructor associations, brand-owned courses, and course-instructor assignments.

The files are deliberately outside `supabase/migrations` and `api/db/migrations`. They are not connected to a migration runner and must not be applied to local, staging, or production databases without separate SQL review and migration-application approval.

Prompt 44 does not connect to Supabase, use MCP, execute SQL, create seed rows, alter the already-applied M1 schema, expose the private `app` schema, enable RLS, create policies, add grants, or change runtime behavior.

## M2 contents

The draft contains only these seven tables:

- `app.academic_levels`
- `app.academic_semesters`
- `app.academic_modules`
- `app.instructors`
- `app.brand_instructors`
- `app.brand_courses`
- `app.course_instructors`

The M2 tables depend on M1 `app.educational_brands` and the M1 `app.set_updated_at()` trigger utility. No new schema, extension, trigger utility, curriculum row, instructor row, brand row, or course row is created by data statements.

Academic levels, semesters, and modules are shared BUC reference data. Brand courses are independent brand-owned offerings. Global instructors can associate with both Medway and Elite through explicit `brand_instructors` rows, and course assignments preserve the same-brand relationship through composite foreign keys.

## Explicit exclusions

M2 does not include student-profile changes, prerequisite tables, credit metadata, course offering subtypes, content chapters/lessons/resources, pricing, products, subscriptions, payments, seats, enrollment, access grants, protected media, assessments, audit/evidence, authentication, providers, runtime adapters, or seed data.

Existing `student_profiles.academic_year`, `academic_term`, and `university` fields remain unchanged. Relational level/semester placement requires a later backfill and compatibility plan.

## Review gates

Before an active migration is authored or applied, review:

1. Exact BUC source codes and titles, including the unresolved PDM-like `1105` source label.
2. Lifecycle/status, phase, source provenance, and prerequisite policy.
3. Course scope and brand-local course-code policy.
4. Instructor role, primary-assignment, approval, privacy, and audit policy.
5. Student-profile placement backfill and compatibility strategy.
6. Rollback/down migration, RLS, Data API exposure, and staging/production approval.

The `course_scope` check is intentionally minimal: `curriculum` requires an academic module; `standalone` may omit one. Multiple courses for the same brand/module are allowed, and there is no unique `(brand_id, academic_module_id)` constraint.

## Future application phases

SQL authoring, SQL review/fix, staging application, staging verification, production application, RLS/Data API exposure, seed strategy, and runtime/provider integration remain separate explicit phases. Prompt 44 performs none of them.
