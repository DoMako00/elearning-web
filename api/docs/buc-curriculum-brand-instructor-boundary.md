# BUC Curriculum, Brand Course, and Instructor Boundary Review

## Status and scope

Prompt 43 is an architecture and domain-boundary review only. It creates no SQL, migration, seed, runtime code, repository implementation, API route, frontend change, package, Supabase connection, MCP call, deployment, or database mutation.

The current academic scope is Badr University in Cairo (BUC), School of Medicine, Bachelor of Medicine and Surgery. This is one academic scope inside the application, not a multi-university tenancy model.

Medway and Elite remain educational brands inside one technical application. Brand scope is the canonical commercial, content, and access-isolation boundary. The concise identifiers for new design are `brand_id`, `brand_code`, and `educational_brands`; older `platform*` names remain compatibility terminology only.

## Source and evidence boundary

The reviewed BUC source establishes a credit-hour Medicine program with five academic levels, ten semesters, Phase I covering semesters 1–5, and Phase II covering semesters 6–10. Examples include `TSF1101`, `ANA1102`, `CBG1103`, `BIO1104`, `ECX1106`, `SIM1107`, `IPP1208`, `PAT1209`, `MIC1210`, `PHE1211`, `IMM1212`, `SIM1213`, `SBS1214`, `MSK2115`, `CVS2116`, `RES2117`, `ECX2118`, and `REP3124`.

These examples are evidence for shape and naming, not seed data. Source labels must be verified before any future catalog authoring; in particular, the PDM/PDM-like `1105` source naming remains unresolved. No code or title is normalized, corrected, or inserted by Prompt 43.

The official curriculum is broader than the currently available Drive content. Drive folders organized as Level 1/Semesters 1–2, Level 2/Semesters 3–4, and Level 3/Semesters 5–6 are source organization, not a complete database curriculum. Academic Advising, Extra Resources, Basic Life Support Course, and Incision Academy are not automatically BUC curriculum modules. This review is not a Drive importer design.

## Single-university decision

BUC School of Medicine is the implicit academic root for the current milestone. Do not introduce `academic_institutions`, universities, tenant universities, institution memberships, campuses, faculties, accreditation engines, or SIS-style registration structures.

A future institution parent may be added as an additive migration if product scope expands. It must not force brand courses, content, pricing, subscriptions, enrollments, or access semantics to be rewritten.

Do not repeat “Badr University” on every course row. The academic hierarchy is cleanly modeled as BUC reference data while remaining extensible for a later parent relationship.

## Academic reference hierarchy

The proposed shared academic hierarchy is:

```text
AcademicLevel
  -> AcademicSemester
       -> AcademicModule
```

### `academic_levels`

Responsibility: represent the five BUC academic levels and their ordering/phase metadata.

Scope and keys: global shared academic reference data; internal UUID primary key; `level_number` unique for the current BUC scope; display name, sort order, optional phase, lifecycle status, and timestamps.

It does not represent a brand course, published teaching content, a learner entitlement, or a student’s current access.

### `academic_semesters`

Responsibility: represent semesters within an academic level.

Scope and keys: global shared academic reference data; internal UUID primary key; conceptual foreign key to `academic_levels`; unique `(academic_level_id, semester_number)`; display name, sort order, lifecycle status, and timestamps.

The current BUC shape has ten semesters, but the hierarchy should not encode payment, enrollment, or access rules. Calendar dates and timezone governance remain later policy decisions.

### `academic_modules`

Responsibility: represent a shared BUC academic module such as `MSK2115`.

Scope and keys: global shared reference data; internal UUID primary key; conceptual foreign key to `academic_semesters`; globally unique `module_code` for the current single-university scope; title, optional credit metadata, optional prerequisite reference, lifecycle status, and timestamps.

`module_code` is the academic identity. It is not a random slug, brand-course ID, frontend label, or commercial product code. A module may exist without any Medway or Elite course, and a module does not own teaching content.

Prerequisite representation, credit metadata, exact lifecycle statuses, and source provenance require owner approval before SQL drafting.

## Brand course and content separation

### `brand_courses`

Responsibility: represent one brand-owned teaching offering.

Scope and keys: mandatory `brand_id` to `educational_brands`; internal UUID primary key; nullable `academic_module_id` for curriculum courses; future brand-local course code unique within a brand; title, lifecycle/publication fields, and timestamps.

A curriculum course maps to one shared academic module. A standalone course may have no module mapping. A course can exist in draft before content is published.

Two brands may offer the same module, producing distinct courses:

```text
academic_modules: MSK2115

brand_courses:
  Medway -> MSK2115 -> Course A
  Elite  -> MSK2115 -> Course B
```

Course A and Course B may have different instructors, videos, PDFs, quizzes, schedules, pricing, publication rules, enrollments, subscriptions, and access grants. Sharing the academic reference does not share content or authorize cross-brand reads.

Do not impose unique `(brand_id, academic_module_id)`. A brand may need a standard, revision, crash, or question-bank offering for one module. Distinguish offerings through a brand-local course code and later approved classification policy rather than a premature enum.

The teaching hierarchy is therefore:

```text
shared BUC academic reference: AcademicLevel -> AcademicSemester -> AcademicModule
brand-owned teaching content:  BrandCourse -> existing chapters/units -> lessons -> resources
```

Existing protected-media, quiz/assessment, release, and content hierarchy rules continue to apply to the brand course/content side. Content beneath a brand course inherits its brand scope; a shared module is never a default shared-content container.

## Instructor identity and assignments

### `instructors`

Responsibility: represent one global real person who may teach in one or both brands.

Scope and keys: global application/domain identity; internal UUID primary key; display name, approved professional metadata, lifecycle status, and timestamps. It has no sole `brand_id` ownership field.

An instructor is not automatically an app user, admin, brand member, course owner, subscription holder, or access grant recipient.

### `brand_instructors`

Responsibility: represent an instructor’s association with one educational brand.

Scope and keys: mandatory `brand_id` and `instructor_id`; unique `(brand_id, instructor_id)`; lifecycle status, optional brand-specific display/profile metadata, and timestamps.

The same instructor may have active Medway and Elite rows. The relation is not duplicated instructor identity and does not grant course access to students.

### `course_instructors`

Responsibility: represent teaching assignments between brand courses and global instructors.

Scope and keys: mandatory course/brand/instructor references; conceptual composite foreign key from `(brand_course_id, brand_id)` to `brand_courses`; conceptual composite relationship from `(brand_id, instructor_id)` to `brand_instructors`; unique course/instructor assignment; teaching role, optional ordering, optional primary indicator, lifecycle status, and timestamps.

One course may have multiple instructors, and one instructor may teach multiple courses across either or both brands. A course assignment must not silently create a brand association: the service/domain policy must require an active `brand_instructors` relation. Database composite constraints should enforce identity and same-brand relationships; active-status authorization is additionally a service/domain rule because ordinary foreign keys cannot express lifecycle status.

The instructor role taxonomy, approval/review workflow, primary-instructor rule, ordering semantics, and assignment audit evidence remain owner questions.

## Cross-brand invariants

- `brand_courses.brand_id` is mandatory and never inferred from an academic module.
- Every chapter, lesson, resource, release, media policy, quiz, assessment, pricing record, subscription, enrollment, and access grant under a brand course carries or inherits that same brand scope.
- A Medway course cannot reference Elite content, instructors through an Elite-only association, pricing, enrollment, or access state.
- A shared `academic_module_id` is a curriculum relationship only; it is not a permission or content-sharing relationship.
- Cross-brand references require composite brand-safe foreign keys or equivalent explicit domain/database enforcement.
- Global `instructors` and global academic modules are not themselves authorization evidence.

## Standalone courses and Drive areas

Standalone offerings such as Basic Life Support Course or Incision Academy are modeled as `brand_courses` with nullable `academic_module_id` when they are genuinely offered by a brand. They are not inserted into `academic_modules` solely because a folder exists.

“Curriculum” versus “standalone” is a semantic classification to confirm before physical schema work. A future classification field may be used only after its lifecycle and taxonomy are approved. Supplementary resources should remain a separate concept if they are not courses; no extra enum or table is introduced here.

## Student academic placement

The existing brand-scoped `student_profiles.academic_year`, `academic_term`, and `university` values remain profile/context data. A later model may reference shared `academic_levels` and `academic_semesters` for recommendation, filtering, discovery, or eligibility policy.

Academic placement does not create course enrollment, membership activation, subscription, payment approval, seat assignment, or `access_grant`. A student’s semester is never an implicit protected-content entitlement.

## Commercial and access boundaries

Pricing attaches to brand-scoped products/offers/packages, not to `academic_modules`. A brand course may later be associated with commercial records, but:

```text
AcademicModule != BrandCourse != CommercialProduct
BrandMembership != Enrollment != AccessGrant
Payment != Subscription != Access
```

Protected content remains available only after the existing explicit access-grant and release/policy evaluation. Prompt 43 introduces no commerce, payment, enrollment, subscription, seat, access, media, assessment, or audit schema.

## Proposed next-schema concepts

| Concept | Responsibility | Scope/key | Does not mean |
| --- | --- | --- | --- |
| `academic_levels` | BUC level reference | Global; unique `level_number` | Brand course or entitlement |
| `academic_semesters` | Semester reference within a level | Global; unique `(academic_level_id, semester_number)` | Enrollment or release calendar policy |
| `academic_modules` | Shared module identity and metadata | Global; unique `module_code`; semester FK | Brand-owned content or price |
| `instructors` | Global instructor identity | Global UUID | Brand authorization or student access |
| `brand_instructors` | Instructor-brand association | `(brand_id, instructor_id)` unique | Duplicated person identity or student membership |
| `brand_courses` | Brand-owned teaching offering | Brand-scoped UUID; future code unique per brand; optional module FK | Academic module, subscription, enrollment, or access |
| `course_instructors` | Course teaching assignment | Same-brand course/instructor relations | Automatic brand membership or publication authority |

All future entities require explicit lifecycle, audit, source-provenance, and deletion/anonymization policy. No physical schema is created by Prompt 43.

## Compatibility with existing documents and contracts

The older logical schema, ERD, domain interfaces, and learning hierarchy use `platform*` names and model academic/content rows as platform-scoped. Those documents remain historical/compatibility references and are not silently rewritten here. New M2 design work should use the shared BUC reference plus canonical `brand_id` brand-course split described in this document.

Existing `StudentProfile` academic fields remain compatible as context fields. Existing content contracts can retain their compatibility projections while future implementation decides how brand courses map into the typed learning hierarchy. Current Admin Overview and runtime composition are unchanged.

## Explicit non-goals

- No university, faculty, campus, department, accreditation, transcript, GPA, attendance, or SIS model.
- No Drive importer or automatic folder-to-module conversion.
- No SQL, migration, seed, Supabase/MCP/database activity, or RLS/Data API change.
- No M1 identity-table changes.
- No runtime repository, API, admin route, frontend, auth, payment, media, or deployment implementation.
- No implicit access from curriculum placement, membership, course mapping, instructor association, enrollment, or payment.

## Owner approval questions before M2 implementation

1. Confirm exact source codes/titles and provenance, including the unresolved PDM-like `1105` label.
2. Confirm level/semester lifecycle statuses, phase representation, dates, timezone ownership, and credit metadata.
3. Confirm prerequisite representation: reference, graph, policy document, or later milestone.
4. Confirm whether `module_code` is globally unique for the BUC scope and how future institution expansion namespaces it.
5. Confirm brand-course lifecycle/publication states and the brand-local course-code convention.
6. Confirm the course classification taxonomy for curriculum, standalone, revision, crash, question-bank, and supplementary offerings.
7. Confirm instructor professional metadata, privacy/retention policy, and role taxonomy.
8. Confirm instructor assignment approval/review workflow, active `brand_instructors` enforcement, ordering, and primary-instructor semantics.
9. Confirm whether multiple active courses per brand/module remain allowed without an additional offering policy.
10. Confirm how student profile academic placement references shared levels/semesters without creating eligibility or access.
11. Confirm content versioning, localization, explicit shared-content capability, and audit/evidence requirements.

## Recommended next milestone

Prompt 44 — **M2 Curriculum, Brand Course, and Instructor Migration Draft Plan**, after the owner questions above are resolved. Prompt 44 may plan SQL concepts and migration order, but application, seed, RLS/Data API exposure, runtime integration, and production changes must remain separately approved.

## Prompt 44 status

Prompt 44 adds a reviewed-but-unapplied M2 draft for `academic_levels`, `academic_semesters`, `academic_modules`, `instructors`, `brand_instructors`, `brand_courses`, and `course_instructors`. The draft keeps BUC academic reference data separate from brand-owned courses, allows multiple offerings per brand/module, uses the minimal `curriculum | standalone` course scope, and preserves global instructors with same-brand assignment constraints. Student-profile academic foreign keys, prerequisites, offering subtypes, seeds, RLS, runtime integration, and migration application remain deferred.

## Prompt 45 status

Prompt 45 statically reviewed and hardened the M2 draft without applying it. The review confirms that composite course/brand and brand/instructor foreign keys preserve instructor assignment scope, while the same global instructor may teach both brands through separate `brand_instructors` rows. Standalone courses and multiple courses per brand/module remain supported; no university model, seed, student-profile change, access/commercial inference, RLS, grant, exposure, or runtime behavior was added. See [M2 SQL Draft Review and Staging Apply Plan](m2-sql-draft-review-apply-plan.md).
