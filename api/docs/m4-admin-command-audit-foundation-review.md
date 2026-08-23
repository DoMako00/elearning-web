# M4 Admin Command Audit Foundation Review

## Status and scope

This is the static design review for the non-active M4 draft, not a schema apply record. The draft remains outside active migration paths and has not been executed against any database. It is the prerequisite for future atomic M2 Admin write execution; it creates no M2 write repository, handler, HTTP route, seed, runtime switch, RLS policy, grant, or Data API exposure.

The accepted contract baseline is `a527386cbb5218f7db03126e2e28e8b2ca0ab243` (`feat(api): define admin M2 write command policies`). The review preserves its sensitive-command requirements: trusted brand context, admin-profile actor, non-empty reason, correlation ID, and idempotency key.

## Approved two-table model

Two tables are justified because they have distinct responsibilities:

| Table | Responsibility | Deliberate exclusions |
|---|---|---|
| `app.admin_actions` | Durable receipt for one successfully committed command, including idempotency identity, fingerprint, actor/brand context, target, policy/version context, and safe result. | It is not a complete domain snapshot store or a rejected/failed-attempt log. |
| `app.audit_logs` | One-to-one immutable, human/audit-oriented before/after evidence for the committed action. | It is not a generic event bus, raw request archive, or domain write mechanism. |

`audit_logs` duplicates actor, brand, action, target, correlation, idempotency, outcome, and reason from `admin_actions` intentionally. This supports direct brand/actor/target audit investigation without a mandatory join and ensures that an audit record remains intelligible as an evidence projection. The future transaction writer must copy these fields consistently and use the command name as the audit action.

`UNIQUE (audit_logs.admin_action_id)` and its foreign key guarantee at most one audit record per receipt. They do not guarantee a child exists. The Prompt 53 transaction path must create the domain mutation, receipt, and exactly one audit log in the same transaction; a successful mutation must never commit without its evidence.

## Scope, actor, target, and outcomes

Every M4 receipt stores `brand_id` and `admin_profile_id`, with the composite foreign key `(admin_profile_id, brand_id)` to M1 `admin_profiles (id, brand_id)`. This verified M1 key proves the recorded actor belonged to the recorded brand. The evidence FKs use `ON DELETE NO ACTION`; later deactivation of an actor does not invalidate historical evidence, and application behavior must not delete audit records.

For global instructor commands, `brand_id` is the resolved authorization and audit context only. It does not assign ownership of the global instructor to that brand.

The M4 outcome boundary is intentionally success-only. Both tables allow only `succeeded` and are written only with a committed mutation. Rejected commands and failures that cause transaction rollback are not durable M4 receipts because the same rollback would remove them. Sanitized operational logging may remain outside this invariant; durable rejected/failed attempt telemetry is deferred to a separate security/event design.

`target_type` and `target_id` are bounded, non-empty generic fields rather than a database enum or polymorphic FKs. Prompt 53 may use `instructor`, `brand_instructor`, `brand_course`, and `course_instructor`. A create handler writes evidence after the target exists. The command transaction, not a polymorphic FK, proves target validity.

## Idempotency and fingerprint contract

The durable retry identity is:

`(brand_id, admin_profile_id, command_name, idempotency_key)`

Future handler behavior is fixed:

| Existing receipt | Result |
|---|---|
| None | Perform the authorized command once within the transaction. |
| Same identity, same fingerprint, succeeded | Return the stored safe result. Do not execute another mutation or write another audit record. |
| Same identity, different fingerprint | Return safe `idempotency_key_reused` conflict. Do not mutate. |

`command_fingerprint` has the format `v1:sha256:<lowercase-hex-digest>`. Future runtime code must compute it from canonical UTF-8 JSON with recursively sorted keys. Its material input is command name, canonical brand context, known target identity, normalized business fields, status/lifecycle values, course scope/module reference, expected version when used, and reason. It excludes correlation/request IDs, server timestamps, actor display data, permission snapshots, transport metadata, and secrets. Only the digest is stored.

## Safe data and append-only rules

`metadata` is a required JSON object with an empty-object default. `result_summary` is an optional JSON object. In `audit_logs`, `before_summary` is nullable and `after_summary` is a required JSON object.

| Command kind | Before summary | After summary |
|---|---|---|
| Create or association creation | `null` | Safe created entity/relation state. |
| Update or lifecycle transition | Safe changed old fields only. | Safe changed new fields only. |
| Idempotent replay | No new audit row. | No new audit row. |

Evidence JSON may contain safe identifiers, controlled status transitions, course code/title summaries, and policy outcome facts. It must not contain credentials, passwords, OTPs, tokens, JWTs, sessions, raw HTTP headers, provider/database payloads, connection details, payment secrets, protected-media URLs, raw request bodies, or unbounded stack traces. Future runtime validation must enforce redaction and a maximum serialized size of 16 KiB per JSON object; the schema uses object-shape checks only.

M4 uses application-level append-only enforcement. It has no `updated_at`, update trigger, or delete repository. Trigger-based immutability and database privilege hardening are explicitly deferred to a later private-schema security review; no RLS, policy, or grant is introduced here.

## Constraints and indexes

The hardened draft has deterministic PK, FK, unique, and check names. It uses existing M1/M2 `uuid default gen_random_uuid()` and immutable `created_at timestamptz default now()` conventions. The server generates all trusted evidence timestamps.

| Object | Purpose |
|---|---|
| `admin_actions_idempotency_key` unique constraint | Durable idempotency lookup and duplicate-command backstop. |
| `admin_actions_brand_created_at_idx` | Recent actions in a brand. |
| `admin_actions_admin_profile_created_at_idx` | Recent actions by actor. |
| `admin_actions_target_created_at_idx` | Target history. |
| `admin_actions_correlation_id_idx` | Operational correlation lookup. |
| `audit_logs_brand_created_at_idx` | Recent audit evidence in a brand. |
| `audit_logs_target_created_at_idx` | Direct audit evidence by target. |

The draft defines five foreign keys, all `ON DELETE NO ACTION`: two on `admin_actions`, and three on `audit_logs`. It intentionally does not duplicate correlation/actor indexes on `audit_logs` unless a future read surface proves they are necessary.

## Prompt 53 transaction requirement

Prompt 53 remains blocked until M4 is separately applied and verified on staging. Once authorized, its transaction adapter must own `BEGIN`, constrained writes, `COMMIT`/`ROLLBACK`, client release, and sanitized provider errors. Handlers receive transaction-scoped repositories/evidence operations, never a raw PostgreSQL client or arbitrary SQL executor.

The required successful path is: resolve trusted request context and permissions; validate state and policy facts; read durable idempotency; mutate the domain; insert `admin_actions`; insert exactly one `audit_logs`; commit. Any mutation or evidence error rolls back all pending work. Database uniqueness and composite foreign keys remain the race-condition backstop.

## Future Prompt 53B controlled staging apply

A future separately authorized apply must target only staging project `mgrsgibxuwgbxtdqprkw`. It must run Git preflight, validate process-only credentials/TLS and production exclusion, and perform SELECT-only checks for the private `app` schema, `educational_brands`, `admin_profiles`, the `admin_profiles (id, brand_id)` unique key, UUID/default support, absence of equivalent M4 objects, and unchanged RLS/policy/grant/Data API boundaries.

It must apply the reviewed ordinary transactional DDL once, then use SELECT-only catalog checks for the two tables, named constraints, indexes, zero rows, schema privacy, and unchanged exposure settings. A sanitized apply report and separate local documentation commit follow only after success. There is no production access, runtime switch, deployment, or push in that phase.

## Deferred work

The following remain out of scope: M4 staging application; transaction adapter implementation; M2 write repositories and command handlers; HTTP write routes; academic-reference writes; persistent rejected/failed-attempt telemetry; physical append-only triggers; privilege redesign; RLS, policies, grants, Data API exposure; audit query APIs; retention/export processes; frontend; seed; and deployment.
