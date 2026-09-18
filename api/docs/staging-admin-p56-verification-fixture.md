# Staging Admin Prompt 56 Verification Fixture

## Purpose and prerequisite

Prompt 56A establishes one deterministic, non-human staging Admin identity whose authorization is derived from the persisted M1 model. It exists only to support separately authorized Admin write verification on staging.

The original Prompt 56A preflight stopped before `BEGIN` because the required permission definitions were absent. Prompt 56B subsequently created and verified the eight active catalogue definitions in commit `5f8f2c1`. Prompt 56A reused those rows by code and ID; it did not create or modify permission definitions.

This fixture is restricted to Supabase project `mgrsgibxuwgbxtdqprkw`, environment `staging`, database `postgres`. It is not production bootstrap data and must never be copied automatically to production.

## Deterministic UUID strategy

All controlled IDs are UUIDv5 values derived with the standard DNS namespace `6ba7b810-9dad-11d1-80b4-00c04fd430c8` and the prefix `elearning.verification.staging.p56.v1/`.

| Fixture component | UUIDv5 suffix | Deterministic ID |
| --- | --- | --- |
| Authentication identity | `auth-identity` | `02694d40-9dec-5f53-a613-6fb946a2b0fa` |
| Application user | `app-user` | `c3214c3c-349f-512c-8917-4053c19428a5` |
| Medway Admin profile | `admin-profile-medway` | `ec1b84ae-bd54-57ba-9b38-0c88735f33af` |
| Medway verification role | `admin-role-medway-m2` | `d5443433-a172-5bf7-a628-08cb4b992a63` |
| Active role assignment | `admin-role-assignment-medway-m2` | `4977dd88-9e0f-5a81-8d84-458e74481aac` |

The controlled harness recomputed every UUID before permitting a connection. Random UUID generation was not used.

## Persisted M1 fixture

The controlled transaction created exactly:

- one active `app.app_users` row with the UUID authentication identity, null email, and null phone;
- one active Medway `app.admin_profiles` row labelled `__STAGING_VERIFY_ADMIN_P56__`;
- one active Medway `app.admin_roles` row with code `staging_verify_m2_admin` and name `__STAGING_VERIFY_M2_ADMIN__`;
- eight `app.admin_role_permissions` relationships to the pre-existing Prompt 56B catalogue rows;
- one active Medway `app.admin_role_assignments` row with no assigning Admin fixture.

The dedicated role resolves to exactly:

- `admin.instructors.create`
- `admin.instructors.update`
- `admin.brand_instructors.assign`
- `admin.brand_instructors.update`
- `admin.brand_courses.create`
- `admin.brand_courses.update`
- `admin.course_instructors.assign`
- `admin.course_instructors.update`

There are no additional role permissions. No Elite Admin profile, Elite role, or Elite role assignment exists for the verification identity.

## Authentication compatibility

The deterministic in-memory authentication adapter maps the approved Medway verification credential to authentication identity `02694d40-9dec-5f53-a613-6fb946a2b0fa`.

The adapter remains deterministic, database-unaware, provider-neutral, and free of role, permission, brand, connection, and staging-target configuration. Authorization continues to come from the persisted M1 projection. `AUTH_PROVIDER=supabase` remains fail-closed; this phase does not implement or claim JWT/JWKS verification.

## Staging preflight and transaction

The disabled apply harness required the explicit Prompt 56A enable flag and exact staging environment selector. It validated the project reference, PostgreSQL database path, `sslmode=verify-full`, trusted-root availability, certificate validation, and hostname verification without printing connection or certificate values.

The full SELECT-only preflight restarted from the beginning and verified:

- database `postgres` and private `app` schema;
- exact live M1 table columns, nullability, constraints, and lifecycle model;
- exactly one active Medway and one active Elite foundation row;
- all eight exact Prompt 56B permission IDs and codes are active;
- controlled classifications: four fixture rows absent, eight role-permission links absent, zero conflicts;
- no Elite authority or conflicting authority rows;
- no Prompt 56 instructor, brand-instructor, course, or course-instructor fixture;
- zero `p56-*` Admin actions and zero `p56-*` audit logs;
- curriculum counts of 5 levels, 10 semesters, and 60 modules;
- deferred `PDM1105` and `1105 PMD` records absent;
- no `anon` or `authenticated` schema usage or app-table grants;
- unchanged schema, constraint, index, trigger, policy, and RLS baselines.

With zero conflicts, one explicit PostgreSQL transaction executed the five guarded fixture statements. Transaction-local authorization verification passed before commit. Post-commit SELECT verification classified all four controlled rows and all eight role-permission links as exact existing.

## Prompt 54 authorization projection

The verification used the same semantic query as the Prompt 54 M1 trusted Admin context repository: authentication identity plus requested brand, joined through app user, Admin profile, active role assignment, active role, role permissions, and active permission definitions.

For authentication identity `02694d40-9dec-5f53-a613-6fb946a2b0fa` and the Medway brand, the projection returned:

- application user `c3214c3c-349f-512c-8917-4053c19428a5`;
- active Admin profile `ec1b84ae-bd54-57ba-9b38-0c88735f33af`;
- dedicated role `staging_verify_m2_admin`;
- exactly the eight approved active permissions.

The same identity projected against Elite returned no Admin authorization row. This proves that authentication is deterministic while authority and brand isolation remain persistence-derived.

## Regression and retention

Before/after verification proved that Medway and Elite foundation rows, the Prompt 56B permission catalogue, curriculum, Prompt 56 M2 fixture counts, Prompt 56 M4 evidence counts, schema objects, RLS state, policies, and public-role privileges did not change except for the explicitly authorized M1 fixture rows and relationships.

Post-apply local validation passed API typecheck and build, trusted Admin context, request context, PostgreSQL read transport, M1 and M2 repositories, persistence composition, Admin command executor/source, PostgreSQL command transaction, authenticated write routes, HTTP smoke, the fail-closed Supabase boundary, and normal mock runtime smoke. Both controlled staging scripts remained inert with their gates disabled.

Dokploy Compose configuration parsing passed with mock defaults. A no-cache API image build passed, followed by an isolated container smoke proving healthy and ready responses, unconfigured provider/database/auth readiness, mock-empty curriculum, and a mock-backed Medway overview. No staging credential was supplied to the build or container.

The fixture is retained on staging as a stable verification dependency. It is non-human, staging-only, Medway-only, and limited to the exact eight permissions. Removal requires a separately reviewed cleanup operation because future M4 evidence may reference its Admin profile ID.

Prompt 56 was not enabled or executed during Prompt 56A. Resuming Prompt 56 requires a separate controlled run and its complete pre-mutation checks.
