# Authenticated Admin M2 HTTP Write APIs

## Scope and activation

Prompt 55 adds a thin, authenticated Node HTTP boundary for the ten Prompt 53 Admin M2 commands. It performs transport validation, trusted Admin context resolution, an early permission check, command mapping, and sanitized response mapping only. It never queries a repository, writes M4 evidence, implements a policy matrix, or controls a transaction.

The routes are structurally registered, but checked-in defaults remain fail-closed: `ADMIN_COMMAND_SOURCE=mock` supplies no executor, so a valid mock-authenticated request receives a sanitized `503` and cannot report a mutation. `AUTH_PROVIDER=supabase` remains composition-time fail-closed pending a separately reviewed JWT/JWKS verifier. No permanent runtime source is switched.

## Routes and mappings

| HTTP method and route | Executor method | Permission | Successful status |
|---|---|---|---:|
| `POST /v1/admin/brands/:brandId/instructors/global` | `createInstructor` | `admin.instructors.create` | 201 |
| `PATCH /v1/admin/brands/:brandId/instructors/global/:instructorId` | `updateInstructor` | `admin.instructors.update` | 200 |
| `PATCH /v1/admin/brands/:brandId/instructors/global/:instructorId/status` | `setInstructorStatus` | `admin.instructors.update` | 200 |
| `POST /v1/admin/brands/:brandId/instructors` | `assignInstructorToBrand` | `admin.brand_instructors.assign` | 200 |
| `PATCH /v1/admin/brands/:brandId/instructors/:instructorId/status` | `setBrandInstructorStatus` | `admin.brand_instructors.update` | 200 |
| `POST /v1/admin/brands/:brandId/courses` | `createBrandCourse` | `admin.brand_courses.create` | 201 |
| `PATCH /v1/admin/brands/:brandId/courses/:courseId` | `updateBrandCourse` | `admin.brand_courses.update` | 200 |
| `PATCH /v1/admin/brands/:brandId/courses/:courseId/status` | `setBrandCourseStatus` | `admin.brand_courses.update` | 200 |
| `POST /v1/admin/brands/:brandId/courses/:courseId/instructors` | `assignInstructorToCourse` | `admin.course_instructors.assign` | 200 |
| `PATCH /v1/admin/brands/:brandId/courses/:courseId/instructors/:instructorId/status` | `setCourseInstructorStatus` | `admin.course_instructors.update` | 200 |

Every route requires a canonical UUID `:brandId`. It is an untrusted selector until the [trusted Admin HTTP context](trusted-admin-auth-http-context.md) verifies an authenticated active Admin profile, the active brand authority, and backend-derived permissions. The executor receives the resolved brand context, never a body-supplied brand identity.

## Body and header contract

Only these routes parse a JSON body. The parser accepts one object only, with a 32 KiB byte limit. Empty, null, array, malformed, or unknown-field bodies fail with `400`. Query parameters and repeated query parameters are unsupported and fail with `400`. Bodies are neither logged nor persisted directly.

`Idempotency-Key` is the sole idempotency transport. It must be a single non-empty safe header of at most 255 characters. A body `idempotencyKey` is an unknown field and is rejected. The route maps the header to Prompt 52 `AdminSensitiveCommandMetadata.idempotencyKey`.

`reason` is a required body field for every command and is passed to the Prompt 52/53 validator unchanged. `expectedVersion` is available only on update/status request shapes; it must be a non-empty string at the HTTP boundary and remains the executor's normalized timestamp comparison value. `scope` maps to `courseScope`; creating a course sets `status: "draft"` internally. Course codes exist only on create and are immutable through these routes.

The body rejects all actor, authority, policy, and compatibility fields, including `brandId`, `educationalBrandId`, `platformId`, `platformCode`, `adminProfileId`, `adminUserId`, permissions, roles, and `idempotencyKey`. Headers cannot establish actor or permission identity; only a strictly formed bearer credential is passed to the provider-neutral resolver.

## Trusted flow and evidence ownership

```
HTTP route and bounded JSON
  -> Prompt 54 trusted resolver
  -> trusted profile, brand, and permission context
  -> Prompt 53 executor
  -> one M2/M4 PostgreSQL transaction when enabled
```

The route's permission check is defense in depth. Prompt 53 still enforces the same permission, policy, brand-scope, idempotency, lifecycle, optimistic-version, and concurrency rules. It alone owns a successful mutation's atomic `app.admin_actions` receipt and matching `app.audit_logs` record. No HTTP handler directly writes either evidence table.

For a new mutation the envelope is `{ ok, correlationId, data, mutated: true, replayed: false, adminActionId, auditLogId }`. A semantic no-op remains a successful `200` with `mutated: false` and no evidence IDs. Idempotent replay is `200` with `replayed: true`. Errors map safely to `400`, `401`, `403`, `404`, `409`, `503`, or sanitized `500`; no SQL, tokens, raw bodies, permission-store details, or provider errors are returned.

## Non-goals and Prompt 56 handoff

This phase creates no schema, migration, seed, frontend change, live database mutation, Supabase JWT/JWKS verifier, deployment, or production access. Current GET APIs retain their approved mock-compatible behavior.

Prompt 56 is the separately authorized staging verification boundary. It must use explicitly approved disposable records and demonstrate the full trusted context -> executor -> transaction -> M2/M4 evidence path, including an approved retention or cleanup plan, before any live write is attempted.
