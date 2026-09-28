# Prompt 50 - Foundation Seed Staging Apply Report

## Status

The approved controlled foundation seed was applied exactly once to the approved staging target on 2026-08-23. The transaction committed successfully and post-commit, read-only verification passed.

- Target project ref: `mgrsgibxuwgbxtdqprkw`
- Environment: `staging`
- Database name verified: `postgres`
- Production: not accessed and not authorized
- Prompt 49 source commit present and reachable: `e46bd4b5a24e4124648560ea114016a46049b64f`
- Seed authority: [foundation-seed-plan-medway-elite-buc.md](foundation-seed-plan-medway-elite-buc.md)
- Controlled seed artifact: [001_foundation_medway_elite_buc.sql](../db/seed-drafts/foundation/001_foundation_medway_elite_buc.sql)

No Supabase MCP, runtime switch, staging HTTP/API call, frontend change, migration, schema change, RLS/policy/grant change, Data API exposure change, push, or deployment was performed.

## Credential handling and target gate

The existing local-only external credential loader supplied process-only connection inputs. Values, connection details, usernames, passwords, certificate location/content, and TLS material were not printed, persisted, or committed. The apply process validated the explicit enable gate, the exact approved project ref, PostgreSQL URL protocol/host/database presence, `sslmode=verify-full`, and the configured trusted root before connecting. The process-only apply and connection variables were removed after the database work.

## UUIDv5 identity derivation

The approved Prompt 49 identity amendment was used for all foundation IDs:

- namespace: standard DNS UUIDv5 namespace `6ba7b810-9dad-11d1-80b4-00c04fd430c8`;
- input: UTF-8 `elearning.foundation.staging.v1/<natural-key>`;
- natural keys: `medway`, `elite`, the five level keys, the ten semester keys, and the 60 approved module keys;
- 77 generated literals were unique and were reviewed in the controlled seed artifact before application.

An existing natural key with a different deterministic ID, parent, or controlled value would have been a conflict. None was found.

## Pre-apply catalog and conflict verification

Read-only preflight confirmed all required foundations before any mutation:

- `current_database()` returned `postgres` and schema `app` exists.
- `app.educational_brands`, `app.academic_levels`, `app.academic_semesters`, and `app.academic_modules` exist with the reviewed required columns and types.
- `app.set_updated_at()` exists.
- The initial approved-key state was empty: 0 brands, 0 levels, 0 semesters, and 0 modules.
- The 77-row manifest classification was 77 absent, 0 exact matches, and 0 conflicts.
- No `PDM1105` or `1105 PMD` module row existed.
- The deferred M1/M2 domains checked by the operation had 0 rows and were outside the mutation set.
- Application-controlled privacy checks confirmed `anon` and `authenticated` have no `USAGE` on schema `app`; the relevant M2 tables had RLS disabled, no policies, and no `anon`/`authenticated` table grants.

## Apply execution

The artifact is a controlled staging foundation seed, not a migration. It contains one explicit `BEGIN`/`COMMIT` transaction and 77 schema-qualified, literal `INSERT` statements only. Inserts are ordered by dependency: brands, levels, semesters, then modules. Each insert is conditional only on its deterministic UUID being absent; the preflight conflict gate prevented a same-natural-key mismatch from being hidden.

The one transaction committed. Sanitized elapsed execution time was approximately 3.2 seconds. There was no rollback, retry, repair, update, delete, or schema operation.

## Final semantic verification

| Domain | Inserted | Exact existing before apply | Conflicts | Final approved rows |
|---|---:|---:|---:|---:|
| `app.educational_brands` | 2 | 0 | 0 | 2 |
| `app.academic_levels` | 5 | 0 | 0 | 5 |
| `app.academic_semesters` | 10 | 0 | 0 | 10 |
| `app.academic_modules` | 60 | 0 | 0 | 60 |
| **Total** | **77** | **0** | **0** | **77** |

Read-only post-commit checks confirmed the exact deterministic IDs and controlled fields for both brands (`medway`, `elite`), all five levels, all ten semester parent/phase/order relationships, and all 60 module code/title/semester/order/status relationships.

`PDM1105` was not inserted, and no `1105 PMD` alternate-code row was created. This unresolved source conflict remains deferred.

The following domains were not mutated; their checked counts remained unchanged (zero): `app.instructors`, `app.brand_instructors`, `app.brand_courses`, `app.course_instructors`, `app.app_users`, `app.brand_memberships`, `app.student_profiles`, `app.admin_profiles`, `app.admin_permissions`, `app.admin_roles`, `app.admin_role_permissions`, and `app.admin_role_assignments`.

The required M1/M2 schema objects remained intact. The same application-controlled privacy, RLS, policy, and grant checks produced the same result after commit. The private `app` schema boundary and Data API exposure boundary were not changed by this seed; the seed contains no command that can change either boundary.

## Failure and rollback notes

No failure, rollback, partial state, unexpected row, or conflict occurred. If the preflight had detected a semantic conflict, an unrecognized existing foundation row, PDM/PMD row, target mismatch, or catalog mismatch, the operation would have stopped before DML. Any transaction failure would have requested rollback and stopped without a retry.

## Explicit outcome

M2 foundation data was applied to staging exactly once: Medway and Elite are the only seeded brands; five BUC Medicine levels, ten BUC Medicine semesters, and 60 approved modules now form the shared reference foundation. No instructor, course, assignment, user, student, admin, membership, access, commercial, enrollment, content, or runtime data was seeded.
