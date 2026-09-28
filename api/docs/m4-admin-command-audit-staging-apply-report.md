# M4 Admin Command Audit Foundation — Staging Apply Report

## Status

The reviewed M4 audit foundation was applied exactly once to the approved Supabase staging target through one explicit PostgreSQL transaction. The schema prerequisite for Prompt 53 is now satisfied; Prompt 53 write execution itself was not implemented or executed.

- Target project ref: `mgrsgibxuwgbxtdqprkw`
- Environment: `staging`
- Database: `postgres`
- Production: not accessed and not authorized
- Prompt 53A review commit: `a05dbb7c9634a3e2703d0306092e52543d564d35`
- Apply source: [001_m4_admin_command_audit_foundation.sql](../db/migration-drafts/m4/001_m4_admin_command_audit_foundation.sql)
- Reviewed Git blob: `ef95b342c6527d55d59c2fd69d576b67a10daa89`
- Reviewed file SHA-256: `3785A4A9DCBCA00BD36881AD07C92DD8220E706FF024AE5BFCC75631C18DC974`

The SQL file remained unchanged from the Prompt 53A-reviewed commit immediately before execution.

## Credential and target handling

The established external, non-repository process loader supplied the apply gate, staging project ref, PostgreSQL URL, and trusted root material. Values were validated in-process and were never printed, persisted, serialized into the repository, or written to documentation. The URL protocol, host/database presence, `sslmode=verify-full`, and trusted-root file existence passed. Certificate and hostname verification remained enabled. Process-only variables were cleared after database work.

No production target, Supabase MCP, Dokploy environment, tracked `.env` file, or deployment configuration was used.

## Pre-apply SELECT-only verification

Before DDL, the direct PostgreSQL session verified:

- `current_database()` returned `postgres`;
- private schema `app` exists;
- `app.educational_brands`, `app.admin_profiles`, `app.academic_levels`, `app.academic_semesters`, and `app.academic_modules` exist;
- `educational_brands.id`, `admin_profiles.id`, and `admin_profiles.brand_id` are `uuid`;
- the M1 `admin_profiles_id_brand_key` composite unique constraint exists and supports `(id, brand_id)` references;
- the reviewed `gen_random_uuid()` mechanism exists in a non-system schema;
- `app.admin_actions` and `app.audit_logs` were absent;
- all reviewed M4 constraint and index names were absent;
- no equivalent `admin*action` or `audit*log` table was present;
- `anon` and `authenticated` had no `USAGE` on schema `app`.

The preflight found no conflict or partial M4 state.

## Transaction and apply result

The exact reviewed DDL was executed once as:

```text
BEGIN
exact reviewed M4 CREATE TABLE / CREATE INDEX contents
COMMIT
```

The transaction committed successfully. Sanitized elapsed execution time was approximately 1.7 seconds. No retry, repair, rollback, data insert, or second DDL attempt was required. The initial local invocation failures occurred before a database session was established and did not execute SQL; the successful attempt used the approved CA with hostname verification preserved.

Created objects:

- `app.admin_actions`
- `app.audit_logs`
- 29 named constraints: 2 primary keys, 2 unique constraints, 5 foreign keys, and 20 checks
- 6 reviewed explicit indexes

## Post-apply SELECT-only verification

### Tables and rows

| Table | Final row count |
|---|---:|
| `app.admin_actions` | 0 |
| `app.audit_logs` | 0 |

No Admin action receipt, audit record, M2 domain row, seed row, instructor, course, association, user, role, permission, access, commercial, or enrollment data was inserted.

### Columns and timestamps

The exact reviewed column sets, types, nullability, and defaults were verified. Both tables have:

- `created_at` as `timestamptz NOT NULL DEFAULT now()`;
- no `updated_at` column;
- no update trigger.

### Constraints and foreign keys

All 29 reviewed named constraints exist. Verification included:

- `admin_actions_idempotency_key` on `(brand_id, admin_profile_id, command_name, idempotency_key)`;
- `audit_logs_admin_action_id_key` on `admin_action_id`;
- five foreign keys, all with PostgreSQL `NO ACTION` delete behavior;
- both actor/brand composite references to `app.admin_profiles(id, brand_id)`;
- required non-empty identity checks;
- success-only outcome checks;
- reason trim and 500-character bound checks;
- `v1:sha256:<lowercase-hex-digest>` fingerprint check;
- JSON object-shape checks for result, metadata, before, and after summaries.

The audit unique reference guarantees at most one `audit_logs` row per `admin_actions` row. The schema alone does not guarantee that every action has a child audit row; the future Prompt 53 transaction must create both atomically.

### Indexes

All six reviewed indexes exist with the expected definitions:

- `admin_actions_brand_created_at_idx`
- `admin_actions_admin_profile_created_at_idx`
- `admin_actions_target_created_at_idx`
- `admin_actions_correlation_id_idx`
- `audit_logs_brand_created_at_idx`
- `audit_logs_target_created_at_idx`

### Privacy and exposure

Post-apply catalog checks confirmed:

- RLS remains disabled for both new private tables, matching the reviewed design;
- no policy exists for either table;
- `anon` and `authenticated` have no `app` schema usage;
- neither role has M4 table privileges;
- no grant, revoke, Data API exposure, view, function, or trigger was introduced;
- the private `app` schema boundary remains intact.

### M1/M2 integrity

The required M1 and M2 dependency tables remained present after commit. No existing M1/M2 object was altered.

## Prompt 53 resume gate

The M4 schema gate is **PASS**:

- both tables exist;
- both tables are empty;
- reviewed constraints and indexes exist;
- actor/brand composite FKs resolve;
- durable idempotency and audit at-most-one constraints exist;
- fingerprint, outcome, reason, and JSON checks exist;
- no RLS, policy, grant, or Data API exposure was added;
- `app` remains private;
- M1/M2 prerequisites remain intact;
- no schema ambiguity remains.

Prompt 53 is now **schema-unblocked for implementation of transaction-scoped write execution only**. No such implementation was included in this phase.

## Explicit exclusions

This apply did not perform or authorize:

- M2 command execution;
- `INSERT`, `UPDATE`, `DELETE`, seed, or application data mutation;
- active migration creation;
- RLS, policy, grant, or Data API changes;
- runtime provider changes;
- frontend changes;
- production access;
- Supabase MCP use;
- push or deployment.
