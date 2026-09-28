# Seeded M2 Admin Read Verification

## Scope and target

This record captures the controlled Prompt 51/51B/51C read-only verification of the existing Admin M2 HTTP path against Supabase project `mgrsgibxuwgbxtdqprkw`, environment `staging`, database `postgres`. Production was excluded and not accessed. The seeded-foundation authority is commit `fa1b8ef473ce5df927d74d6a0cbe192b46f74900`.

The verification used a temporary local API child process only. Its child-only environment selected `PERSISTENCE_PROVIDER=supabase` and `ADMIN_M2_READ_MODEL_SOURCE=postgres`, while retaining `ADMIN_READ_MODEL_SOURCE=mock` and mock runtime behavior for Admin Overview. No tracked environment file, Dokploy setting, deployment, or permanent default changed.

Credentials and the trusted root were supplied outside Git in process-only variables. The verifier passed the approved trusted root to the API child through `NODE_EXTRA_CA_CERTS` before Node started. Certificate and hostname verification remained enabled; no insecure TLS flag, relaxed SSL mode, or permanently configured certificate path was used. The verifier removed its temporary provider, source, TLS, port, and credential variables during cleanup.

## Read path verified

The successful non-empty curriculum responses prove this live chain:

`PostgreSQL read transport -> M1/M2 read repositories -> PostgreSQL Admin M2 read model -> existing Admin HTTP routes`

The repository adapters normalize valid PostgreSQL `Date` timestamp values to ISO strings at the infrastructure boundary, preserving the provider-neutral timestamp-string contracts. Invalid timestamp representations continue to map to sanitized persistence-data errors.

## HTTP results

| Area | Verified result |
| --- | --- |
| Health and readiness | `GET /health` and `GET /ready` returned `200` before M2 reads. |
| Curriculum levels | `200`; exactly five expected deterministic level DTOs, with no duplicates or extras. |
| Curriculum semesters | `200`; exactly ten expected DTOs with verified level parents, phase, status, and ordering. |
| Semester filters | Level 1 and Level 3 filters returned only their expected two-semester sets. |
| Curriculum modules | `200`; exactly 60 expected deterministic module DTOs with verified code, title, semester parent, status, and ordering. |
| Module filters | One Phase I and one Phase II semester filter returned only their manifest modules. |
| PDM exclusion | Neither `PDM1105` nor `1105 PMD` appeared in the module API results. |
| Module find/validation | Confirmed module returned `200`; valid absent UUID returned `404`; malformed UUID returned `400`. |
| Instructors | Global list returned `200` with `[]`; valid absent UUID returned `404`; malformed UUID returned `400`. |
| Medway and Elite scoped reads | Each brand's course and instructor lists returned `200` with `[]`. |
| Unknown brand | Brand course and instructor reads returned safe `404` responses. |
| Empty course domain | Valid absent Medway course returned `404`; its instructor-list route returned the documented safe empty list. |
| Query validation | Invalid UUID filters, invalid scope, mutually exclusive course filters, unsupported parameters, and repeated unsupported parameters returned `400`. No-filter routes for levels, instructors, and a brand-scoped instructor route were explicitly verified. |
| Method guard | `POST /v1/admin/curriculum/levels` returned `405` with a GET allowance. |
| Admin Overview regression | Existing Medway and Elite overview calls retained their mock identifiers and response shape, confirming its independent mock source remained selected. |

The API child shut down through `SIGTERM` and exited cleanly. Together with the existing idempotent composition-close selftest, this is the available evidence that its PostgreSQL pool lifecycle closed cleanly without changing production lifecycle code.

## Safety and boundary confirmation

Only HTTP GET/read activity occurred against staging. No `INSERT`, `UPDATE`, `DELETE`, seed, schema operation, migration, RLS/policy/grant change, Data API exposure change, Supabase MCP use, frontend change, Dokploy change, push, or deployment occurred. The permanent runtime defaults remain mock-backed.

The intentionally deferred staging domains remained empty through the verified APIs: instructors, brand instructors, brand courses, and course instructors. The verification did not add commercial, access, enrollment, user, student, admin, or content semantics.

## Local and container validation

Before staging access, API typecheck, build, PostgreSQL transport, M1 repository, M2 repository, persistence composition, Admin Overview source, Admin M2 read-model/source, and HTTP selftests all passed. Normal runtime smoke also passed with default mock configuration and a clean shutdown.

After successful live verification, Docker Compose rendering confirmed checked-in mock defaults. A no-cache API image build and the default-mock container smoke both passed, including API health/readiness, overview behavior, web routing, and container cleanup.
