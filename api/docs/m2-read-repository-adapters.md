# M2 Read Repository Adapters

Prompt 47 adds provider-neutral, read-only contracts and PostgreSQL-backed adapters for the seven applied M2 tables. The adapters use `ReadQueryTransport` only; they do not know about pools, connection strings, Supabase clients, HTTP, or runtime environment variables.

## Covered tables and bundle

`M2ReadRepositories` contains academic-level, academic-semester, academic-module, instructor, brand-instructor, brand-course, and course-instructor repositories. Academic levels, semesters, and modules are shared BUC curriculum references. Instructors are global identities. Brand-instructor associations, brand courses, and course-instructor assignments are brand-scoped relationships.

All list reads are bounded to an internal limit of 200 and use stable ordering. Brand courses use `course_code`, `title`, and `id`; the applied schema has no course `sort_order` column.

## Boundaries and semantics

Academic and instructor lookups do not require a brand and do not imply enrollment, access, pricing, content ownership, login, or administration. Brand-scoped methods require the existing `BrandScope` and bind `brand_id` in every query. A course lookup always requires both brand and course identity, and assignment reads require both brand and course/instructor identity. Same-brand composite-key enforcement remains in the applied schema.

`module_code` lookup trims surrounding whitespace but preserves case; the source normalization policy remains deferred. `module_code` is independent from brand-local `course_code`. Standalone courses are supported with a null `academic_module_id`; no method assumes one course per brand/module.

## Mapping and errors

Adapters preserve UUID and timestamp values as strings and preserve nullable fields. They accept only the applied status, scope, and phase values. Empty list results are valid, and empty-table find methods return `not_found`. Malformed rows return `persistence_data_invalid`; transport failures return sanitized `query_failed`; no SQL, host, credential, or cross-brand details are exposed.

## Runtime and testing boundary

The optional `m2Repositories` bundle is constructed only in the opt-in Supabase persistence composition and performs zero queries during construction. Mock mode remains the default, creates no pool, and requires no database URL. Admin Overview sources, HTTP routes, frontend behavior, and runtime provider defaults are unchanged. Prompt 48 owns any M2 admin read model or endpoint exposure.

The M2 selftest uses a fake `ReadQueryTransport` and verifies parameter binding, ordering, empty results, malformed data, invalid lifecycle values, nullable standalone courses, same-brand filtering, SELECT-only SQL, and zero-query construction. It never connects to Supabase.
