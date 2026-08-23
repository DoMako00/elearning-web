# Authenticated Admin M2 staging write verification

## Verification result

Prompt 56 passed on 2026-08-23 against the authorized staging target only:

- Supabase project: `mgrsgibxuwgbxtdqprkw`
- Environment: `staging`
- Database: `postgres`
- Result: 10 successful M2 mutations, 10 `app.admin_actions` receipts, and 10 one-to-one `app.audit_logs` rows

The run used the existing authenticated Admin HTTP routes and the compiled API runtime. It did not use direct domain DML, Supabase MCP, Dokploy, a deployment, production, or a schema-changing tool.

## Prerequisites and actor

The verified implementation and staging fixtures were already present:

- Prompt 55 write routes: `a853ef6` (`feat(api): expose authenticated admin M2 writes`)
- Prompt 56B permission catalogue: `5f8f2c1` (`test(api): add staging admin permission catalogue`)
- Prompt 56A verification identity: `89e8629` (`test(api): add staging admin verification fixture`)

The non-human staging actor resolved as follows:

- Authentication identity: `02694d40-9dec-5f53-a613-6fb946a2b0fa`
- Application user: `c3214c3c-349f-512c-8917-4053c19428a5`
- Medway Admin profile: `ec1b84ae-bd54-57ba-9b38-0c88735f33af`
- Dedicated role: `d5443433-a172-5bf7-a628-08cb4b992a63` (`staging_verify_m2_admin`)
- Active role assignment: `4977dd88-9e0f-5a81-8d84-458e74481aac`

The persisted authorization projection resolved exactly these eight active permissions and no extras:

- `admin.instructors.create`
- `admin.instructors.update`
- `admin.brand_instructors.assign`
- `admin.brand_instructors.update`
- `admin.brand_courses.create`
- `admin.brand_courses.update`
- `admin.course_instructors.assign`
- `admin.course_instructors.update`

The equivalent Elite projection returned no authorized Admin snapshot. Prompt 56A and Prompt 56B rows were read and regression-checked; they were not modified.

## Temporary runtime and transport

The verifier required both manual gates, including `ADMIN_P56_TARGET_ENVIRONMENT=staging`, and accepted only the approved project, `/postgres` database path, and a recognized Supabase direct or pooler hostname carrying the project identity. PostgreSQL TLS used `sslmode=verify-full`, an existing trusted root, hostname verification, and `rejectUnauthorized: true`.

The temporary child process bound to an ephemeral loopback port and used exactly:

- `ADMIN_RUNTIME_MODE=mock`
- `PERSISTENCE_PROVIDER=supabase`
- `AUTH_PROVIDER=mock`
- `ADMIN_READ_MODEL_SOURCE=mock`
- `ADMIN_M2_READ_MODEL_SOURCE=postgres`
- `ADMIN_COMMAND_SOURCE=postgres`

The verifier's independent PostgreSQL pool executed parameterized, schema-qualified `SELECT` statements only. All M2 and M4 writes flowed through authenticated HTTP requests into the Prompt 53 PostgreSQL transaction executor. The mock bearer proved deterministic trusted-context integration with persisted M1 authority; this run does not claim Supabase JWT/JWKS verification. `AUTH_PROVIDER=supabase` remains fail-closed.

No credential, bearer value, database URL, username, password, trusted-root path or content, raw header/body, or provider output is recorded here.

## Baseline and negative matrix

Before mutation, SELECT-only preflight proved:

- the database and private `app` schema matched the authorized target;
- Medway and Elite foundation rows were present and active;
- the Prompt 56A identity, profile, role, assignment, and exact permission projection were intact;
- required M1, M2, and M4 tables and M4 idempotency/audit constraints were present;
- the disposable instructor, brand-instructor, course, and course-instructor rows were absent;
- `p56-*` action and audit evidence counts were both zero;
- curriculum remained 5 levels, 10 semesters, and 60 modules;
- `PDM1105` and `1105 PMD` were absent;
- the private-schema privilege boundary was intact.

The temporary API returned `200` for `/health` and `/ready`. Admin Overview remained mock-backed. PostgreSQL-backed Admin M2 HTTP reads returned exactly 5 levels, 10 semesters, and 60 modules.

Before the first mutation, the verifier safely rejected:

| Case | Accepted result |
|---|---:|
| Missing bearer | `401` |
| Malformed bearer | `401` |
| Duplicate Authorization headers | `400` or `401` |
| Missing Idempotency-Key | `400` |
| Malformed Idempotency-Key | `400` |
| Malformed route UUID | `400` |
| Unsupported query parameter | `400` |
| Malformed JSON | `400` |
| JSON `null`, array, or primitive | `400` |
| Body larger than 32 KiB | `400` |
| Unsupported body field | `400` |
| Client `adminProfileId`, `permissions`, or `brandId` | `400` |
| Medway actor against Elite scope | `403` or safe `404` |

M2 and M4 snapshots were identical before and after the complete negative matrix.

## Ten-command lifecycle

The accepted live total intentionally remained ten. The separate brand-course update route remains covered by local contract, executor, transaction, and authenticated-route tests and was not added as an eleventh staging mutation.

| # | Idempotency key | Command | Result |
|---:|---|---|---|
| 1 | `p56-create-instructor-v1` | Create global instructor | Created active with null professional title |
| 2 | `p56-assign-brand-instructor-v1` | Assign instructor to Medway | Active Medway association |
| 3 | `p56-create-course-v1` | Create standalone Medway course | Draft, null academic module |
| 4 | `p56-assign-course-instructor-v1` | Assign instructor to course | Active assignment |
| 5 | `p56-update-instructor-v1` | Set professional title | Updated successfully |
| 6 | `p56-publish-course-v1` | Draft to published | Published successfully |
| 7 | `p56-archive-course-v1` | Published to archived | Archived successfully |
| 8 | `p56-inactivate-course-instructor-v1` | Inactivate course assignment | Inactive |
| 9 | `p56-inactivate-brand-instructor-v1` | Inactivate Medway association | Inactive |
| 10 | `p56-inactivate-instructor-v1` | Inactivate global instructor | Inactive |

The retained disposable staging IDs are:

- Instructor: `1cc80cc4-6033-4360-ac2a-2642f754ea6b`
- Medway brand-instructor: `91b868d0-94e8-4d18-abda-b9f861d41a0f`
- Medway standalone course: `bcb297fb-d95a-4c66-a629-fdfa36ae40d1`
- Course-instructor: `2aebf670-6a5c-40a9-8dca-63134b0c0e16`

The instructor is named `__STAGING_VERIFY_P56_INSTRUCTOR__` and finishes inactive with professional title `Prompt 56 Verification Fixture`. The course uses code `VERIFY_P56_M2`, title `__STAGING_VERIFY_P56_COURSE__`, standalone scope, null academic module, and archived status. Both relationships finish inactive.

## Replay, conflict, isolation, and lifecycle results

- Replaying the exact create-instructor request returned `200`, `mutated=false`, and `replayed=true`, with the original target/action/audit IDs and no count increase.
- Reusing that key with a different reason returned `409`, with no mutation or evidence.
- Reusing the instructor's pre-update timestamp as a stale `expectedVersion` returned `409`, with no state or evidence change.
- Elite-scoped writes using the real Medway instructor, course, and relationship IDs returned `403` or safe `404`. No Elite relationship, course, course-instructor, or M4 evidence appeared.
- Attempting archived to published returned the contract's `400`; the course remained archived and no receipt or audit row was created.

## M4 evidence and read-after-write proof

SELECT-only verification found exactly 10 matching successful `admin_actions` and 10 matching successful `audit_logs`. Every action had exactly one audit row, and neither side had an orphan.

For every successful command, the verifier checked the exact command name, target type and ID, Medway brand, Admin profile, reason, succeeded outcome, idempotency key, request/correlation linkage, and `v1:sha256:<lowercase-hex>` fingerprint. It also checked allowlisted result/before/after object shapes and command-specific create, update, status, and lifecycle semantics.

JSON evidence objects were bounded and scanned for prohibited credential, authorization, JWT/session, database, certificate, raw-request, provider-internal, stack-trace, protected-media, and payment-secret material. None was found. Rejected requests, replay, fingerprint conflict, stale version, Elite attempts, lifecycle rejection, and reads created zero extra evidence.

After commit, the PostgreSQL-backed Admin M2 HTTP GET routes returned the same safe values as direct SELECT inspection for all four retained rows. Elite-scoped state remained absent.

## Regression and shutdown

Post-run snapshots matched their pre-run values for:

- Medway and Elite foundation rows;
- Prompt 56A identity and authorization rows;
- Prompt 56B permission catalogue rows;
- 5/10/60 curriculum and deferred-module absence;
- schema object, constraint, index, trigger, policy, and RLS counts;
- anon/authenticated schema usage and public table privileges.

The child API was terminated gracefully, the inspection and API pools closed, and process-only gate, target, credential, TLS, selector, port, and bearer variables were cleared. Checked-in runtime defaults were not changed.

The four disposable M2 records are intentionally retained in inactive/archived staging state. No hard-delete or cleanup DML was run. Production was not accessed, no deployment or push occurred, and Supabase MCP was not used.
