# Staging Admin M2 Permission Catalogue Verification

## Scope and reason

Prompt 56B created the minimal persisted Admin M2 permission catalogue required by the approved Prompt 52/53/54/55 authorization contracts. Prompt 56A had stopped before opening a transaction because all eight definitions were absent from staging.

This is a staging-only controlled fixture for Supabase project `mgrsgibxuwgbxtdqprkw`, database `postgres`. Production was excluded. A permission definition is not an authorization grant: no Admin identity, profile, role, role assignment, or role-permission relationship was created by this phase.

## Controlled manifest

IDs are deterministic UUIDv5 values using the standard DNS namespace `6ba7b810-9dad-11d1-80b4-00c04fd430c8` and the exact input `elearning.admin.permission.v1/<permission-code>`.

| Permission code | Deterministic ID | Category | Status |
| --- | --- | --- | --- |
| `admin.instructors.create` | `e291ccf1-a18e-5fab-9966-8b0bcedf517d` | `instructors` | `active` |
| `admin.instructors.update` | `ea97a4ad-89dc-5edc-b3ba-b50ab5417ce5` | `instructors` | `active` |
| `admin.brand_instructors.assign` | `f108bfdf-5cf7-50dd-bd15-a3a792580be4` | `brand_instructors` | `active` |
| `admin.brand_instructors.update` | `126b7c16-95ae-5058-9c2b-8a53631fd6f0` | `brand_instructors` | `active` |
| `admin.brand_courses.create` | `09cc729c-a607-5c64-b591-fb4ab640f3bf` | `brand_courses` | `active` |
| `admin.brand_courses.update` | `cc76a74a-3ec8-5281-a729-33cd712aec0e` | `brand_courses` | `active` |
| `admin.course_instructors.assign` | `98573182-688b-5c32-9304-e886997b8e3b` | `course_instructors` | `active` |
| `admin.course_instructors.update` | `93947542-fa93-50bf-8db1-2d068441bae2` | `course_instructors` | `active` |

The application `AdminPermissionCode` union was used as the code authority. The SQL artifact contains eight guarded `INSERT` statements targeting only `app.admin_permissions`; it contains no update, delete, schema DDL, role relationship, M2, or M4 operation.

## Controlled staging result

The disabled apply harness required both the explicit Prompt 56B enable flag and the exact staging environment selector. Before connecting, it validated the project reference, PostgreSQL database path, `sslmode=verify-full`, and available trusted root. Connection values and certificate details were process-only and were not printed or persisted.

SELECT-only preflight confirmed:

- database `postgres` and private `app` schema;
- the exact reviewed M1 `app.admin_permissions` columns, defaults, primary key, unique code constraint, status check, and updated-at trigger;
- active Medway and Elite foundation rows;
- curriculum counts of 5 levels, 10 semesters, and 60 modules, with the deferred module codes absent;
- no `anon` or `authenticated` schema usage or permission-table DML privilege;
- RLS, policy, schema-object, M1 authority, M2, and M4 baseline snapshots;
- classifications: 8 absent, 0 exact-existing, 0 conflicts.

One explicit PostgreSQL transaction inserted the eight absent definitions. Transaction-local verification resolved every manifest row exactly before commit. Post-commit SELECT-only verification produced:

- inserted: 8;
- exact-existing before apply: 0;
- conflicts: 0;
- final exact definitions: 8;
- inactive definitions: 0;
- duplicate target codes: 0.

Before/after snapshots proved no changes to app users, Admin profiles, Admin roles, role assignments, role-permission assignments, M2 domain rows, M4 evidence rows, curriculum rows, Medway or Elite foundation rows, schema objects, RLS, policies, or `anon`/`authenticated` privileges.

## Authority and security boundary

Persisting these definitions granted no authority. Authorization still requires the full persistence-derived relationship:

`Admin profile -> role assignment -> role -> role permission -> permission`

Prompt 56B did not create any part of that relationship. The private `app` schema and Data API boundary remained unchanged. No RLS, policy, grant, schema exposure, or Data API configuration changed.

No credential, bearer value, database URL, username, password, trusted-root path, or certificate content is contained in this report or the controlled artifacts.

## Handoff

Prompt 56A may now be resumed separately and must rerun its complete staging preflight from the beginning before applying its identity and Medway-only authorization fixture. Prompt 56 remains disabled and was not run. Prompt 56B does not authorize the M2 write lifecycle.
