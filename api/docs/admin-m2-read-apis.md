# Admin M2 read APIs

Prompt 48 adds read-only, backend-mediated Admin endpoints for the M2 curriculum, instructor, brand-course, and course-instructor tables. It adds no writes, seed data, access grants, commerce state, protected-media URLs, student routes, frontend client, Data API exposure, RLS, policy, or grant change.

## Endpoints and scope

Global shared BUC reference endpoints are `GET /v1/admin/curriculum/levels`, `/semesters`, `/modules`, `/modules/:moduleId`, `/v1/admin/instructors`, and `/v1/admin/instructors/:instructorId`. Semesters accept `levelId`; modules accept `semesterId`.

Brand-scoped endpoints require canonical UUID `brandId`: brand instructors, brand courses, course instructors, and an instructor's assignments within that brand. Brand courses accept exactly one of `academicModuleId` or `scope=standalone`. The Postgres source resolves the active M1 brand before a scoped M2 call, preventing cross-brand lookup leakage. Academic modules remain shared reference data; brand courses remain brand-owned, instructors global, and same-brand course/instructor assignment safety remains schema-backed.

`BrandCourseAdminDto` intentionally has no `sortOrder`: the reviewed M2 schema has no brand-course sort column. Lists retain repository ordering by course code, title, then ID. More than one course may refer to an academic module.

## Sources and errors

`ADMIN_M2_READ_MODEL_SOURCE=mock|postgres` defaults to `mock` and is independent of `ADMIN_READ_MODEL_SOURCE`. Mock returns deterministic empty arrays and not-found finds; it never represents staging data or opens a DB connection. Postgres is allowed only with `PERSISTENCE_PROVIDER=supabase` and uses existing M1/M2 read repositories; construction is query-free.

Empty M2 tables are valid. Lists return `200` with an empty `data` array; finds return a safe `404`. Invalid IDs and filters return `400`; provider failures return sanitized `503`; malformed persistence data remains a redacted internal failure. The current HTTP runtime retains its mock-admin skeleton and does not claim production RBAC. Prompt 49 may add a frontend Admin adapter; it must not bypass these backend boundaries.
