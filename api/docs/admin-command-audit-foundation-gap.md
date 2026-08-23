# Admin Command Audit Foundation Gap

## Prompt 53 stop condition

Prompt 53 write execution is intentionally stopped before any M2 write repository, PostgreSQL write transport, command handler, or HTTP write route is implemented.

The applied M1 foundation does not contain an audit/evidence persistence target. The reviewed M1 draft explicitly records that full append-only audit/evidence tables are deferred and that Admin command activation must wait for M4 evidence persistence or a separately approved minimal audit foundation. The existing `AdminEvidenceWriter` implementation is in-memory only, so it cannot participate in the same PostgreSQL transaction as a domain mutation.

Implementing a write repository now would violate the required invariant that a successful M2 mutation and its mandatory Admin action/audit evidence either commit together or roll back together. No best-effort or post-commit evidence write is acceptable.

## Proposed non-active foundation

The reviewed, still non-active draft [001_m4_admin_command_audit_foundation.sql](../db/migration-drafts/m4/001_m4_admin_command_audit_foundation.sql) proposes two private `app`-schema append-only-by-application-policy tables:

- `app.admin_actions` is the durable successful-command receipt. It records the resolved brand and admin-profile actor, command/target, required reason, correlation/request identifiers, idempotency key, canonical safe command fingerprint, policy/version reference, safe result summary, safe metadata, and immutable server-generated timestamp. Its composite actor/brand foreign key binds the evidence actor to the recorded brand.
- `app.audit_logs` records the matching immutable human/audit evidence: action, actor/brand/target, correlation/idempotency identifiers, reason, and redacted before/after/metadata summaries. The intentionally duplicated actor/brand/action/target fields preserve direct audit queryability without requiring a join to the command receipt.

`UNIQUE (admin_action_id)` guarantees at most one audit row per receipt. The future command transaction—not that FK/unique constraint alone—must create exactly one audit record for every committed successful mutation. Both M4 tables persist only `succeeded` outcomes. Rejected and rolled-back failed attempts are deferred to a later, separately reviewed telemetry/event model because they cannot safely share the transaction that is rolled back.

The uniqueness boundary on `(brand_id, admin_profile_id, command_name, idempotency_key)` supports durable retry handling. A future transactional handler must compare the stored canonical `v1:sha256:<lowercase-hex-digest>` fingerprint before replaying a recorded result: same identity plus same fingerprint replays the safe stored result; the same identity with different material content is a conflict, never a new mutation.

The draft contains no seed rows, no active migration registration, no public schema objects, no Data API exposure, no RLS/policies/grants, no views/functions, and no write path for M2 or academic-reference tables. It remains unapplied.

## Required next phases

1. Complete static review of naming, retention, redaction, idempotency, append-only, and private-schema requirements. The detailed result is recorded in [the M4 review](m4-admin-command-audit-foundation-review.md).
2. Receive separate explicit authorization to move the reviewed draft into an active migration path and apply it to the approved staging target through a controlled preflight/transaction/verification process.
3. Verify the applied audit tables, constraints, indexes, zero-row state, private-schema boundary, and absence of RLS/policy/grant/Data API changes with SELECT-only catalog checks.
4. Only then implement Prompt 53 write repositories and transaction-scoped evidence adapters. Those implementations must use one checked-out PostgreSQL client for domain mutation, `admin_actions`, and `audit_logs`, rolling back all three on any failure.

Until those phases are complete, M2 write execution remains unavailable by design. The current staging foundation data must not be mutated for this gap assessment.
