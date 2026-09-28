# M2 Curriculum, Brand Course, and Instructor Schema Draft

## Status

- Phase: Prompt 44
- Scope: M2 schema design and non-applied SQL draft only
- SQL execution: none
- Database/Supabase connection: none
- Seeds: none
- Runtime/frontend/provider changes: none
- RLS, policies, grants, and Data API exposure: none
- Push/deploy: none

The SQL candidate is [001_m2_curriculum_brand_course_instructor.sql](../db/migration-drafts/m2/001_m2_curriculum_brand_course_instructor.sql). It is outside all active migration paths and depends on the reviewed/applied M1 private `app` schema.

## M2 scope and academic boundary

BUC School of Medicine remains the only academic scope. No university table or multi-university abstraction is introduced. The seven M2 tables are shared academic reference, global teaching identity, or brand-owned course-assignment structures. They do not create access or commercial entitlement.

The hierarchy is:

```text
academic_levels -> academic_semesters -> academic_modules
educational_brands -> brand_courses -> existing brand-scoped content
instructors -> brand_instructors -> course_instructors
```

Academic modules are shared curriculum identity. Brand courses are independent Medway/Elite offerings. The same module may have multiple courses in one brand and separate courses in both brands.

## Table decisions

### `app.academic_levels`

Global BUC reference rows use UUID identity, positive `level_number` and `sort_order`, display name, `active | inactive` status, and M1 timestamp conventions. `level_number` and `sort_order` are unique. Phase is not stored here because the official Phase I/II boundary crosses the Level 3 area.

### `app.academic_semesters`

Global rows reference `academic_levels` and contain positive `semester_number`/`sort_order`, display name, `phase_i | phase_ii`, `active | inactive` status, and timestamps. `semester_number` is globally unique for the current single BUC scope; `(level_id, sort_order)` is unique. The schema does not hard-code a maximum of ten.

### `app.academic_modules`

Global rows reference `academic_semesters`, require `module_code` and `title`, and contain positive `sort_order`, `active | inactive` status, and timestamps. `module_code` is globally unique for the current BUC scope and is independent of any brand course code. Source normalization is an application/review policy; uncertain `1105` naming is not seeded. Credit hours, module classification, and prerequisites are deferred.

### `app.instructors`

Global teaching identity contains UUID, display name, optional professional title, `active | inactive` status, and timestamps. It has no brand ownership, authentication FK, student meaning, or admin meaning.

### `app.brand_instructors`

This explicit brand association contains UUID, `brand_id`, `instructor_id`, `active | inactive` status, and timestamps. It has unique `(brand_id, instructor_id)` and `(id, brand_id)` constraints plus M1 brand/instructor foreign keys. One instructor may have independent Medway and Elite associations.

### `app.brand_courses`

Brand-owned course roots contain `brand_id`, nullable `academic_module_id`, brand-local `course_code`, title, required `course_scope`, `draft | published | archived` status, and timestamps. `course_scope` is `curriculum | standalone`; curriculum requires an academic module, while standalone may omit one. Unique `(brand_id, course_code)` identifies offerings within a brand. There is deliberately no unique `(brand_id, academic_module_id)`, so full, revision, crash, question-bank, and exam-prep offerings remain possible without introducing an offering subtype enum.

### `app.course_instructors`

Assignments contain UUID, `course_id`, denormalized `brand_id`, `instructor_id`, `active | inactive` status, and timestamps. Unique `(course_id, instructor_id)` prevents duplicate current relationships. Composite foreign keys require the course and instructor-brand association to share the same brand. Active-status eligibility remains a future service/domain rule; no trigger is added.

## Keys, checks, indexes, and lifecycle

- All seven tables use UUID primary keys and M1 timestamp conventions.
- Academic hierarchy foreign keys use `NO ACTION` deletion behavior.
- Brand, instructor, course, and assignment foreign keys use `NO ACTION` to preserve historical references; no broad cascade is introduced.
- `academic_module_id` also uses `NO ACTION`; unlinking a course from curriculum requires an explicit reviewed lifecycle decision.
- Positive numeric checks protect levels, semesters, and ordering values.
- Text checks protect required names/codes and approved lifecycle/scope values.
- Unique constraints provide module-code, course-code, relationship, and composite-FK target support.
- Lookup indexes cover semester/level, module/semester, instructor/brand, course/brand/module/status, and assignment course/instructor/brand paths.
- All seven mutable tables receive stable `app.set_updated_at()` triggers. The utility itself is inherited from M1 and is not recreated.
- Archive/status transitions are preferred over hard deletion. No cascade or destructive history policy is introduced.

## Brand isolation and instructor sharing

`academic_levels`, `academic_semesters`, `academic_modules`, and `instructors` are intentionally not brand-scoped. `brand_instructors` and `brand_courses` carry canonical `brand_id`. `course_instructors` stores `brand_id` so composite FKs can reject cross-brand course/association combinations.

The same instructor can teach Medway and Elite without duplicated identity. A Medway course cannot silently use an Elite-only association. The structural relationship is database-enforced; the requirement that the association and instructor are active is backend/domain authorization and remains future runtime work.

Content under a `brand_course` remains brand-owned. Referencing the same academic module never shares chapters, lessons, PDFs, videos, quizzes, pricing, subscriptions, enrollments, or access grants.

## StudentProfile alignment

M1 `student_profiles` is unchanged. Its current textual `academic_year`, `academic_term`, and `university` fields remain compatibility/context data. A future migration may add nullable `academic_level_id` and `academic_semester_id` after source mapping, backfill, validation, and compatibility policy are approved. Academic placement is never entitlement and cannot authorize protected content.

## RLS, Data API, seeds, and application boundary

The private `app` schema remains backend-only. Prompt 44 adds no RLS enablement, policies, grants, exposed-schema change, or Data API configuration. No data rows are included. D36 seed strategy remains deferred. Applying this draft requires separate SQL review/fix, controlled staging-apply approval, post-apply verification, rollback planning, and production approval.

## Prompt 45 review status

Prompt 45 completed the static [M2 SQL Draft Review and Staging Apply Plan](m2-sql-draft-review-apply-plan.md). The draft retains the same seven-table domain design, now with explicitly named primary keys, non-empty checks for required academic labels/titles, and seven focused explicit indexes after redundant index removal. The two `course_instructors` composite foreign keys have matching child-side composite indexes. M2 remains unapplied; live M1 dependency and M2-conflict checks are mandatory Prompt 46 preflight.

## Deferred owner decisions

- Exact source codes/titles and provenance, including `1105`.
- Prerequisite, credit-hour, and source-classification representation.
- Course publication/lifecycle workflow and offering subtype taxonomy.
- Instructor professional metadata, teaching-role taxonomy, primary assignment, approval, and audit policy.
- Student-profile placement backfill and compatibility mapping.
- Content versioning/localization and any explicitly approved shared-content capability.
