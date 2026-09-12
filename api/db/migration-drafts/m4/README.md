# M4 Audit Foundation Drafts

This directory contains non-active, review-only schema drafts for the minimal private Admin command audit foundation. The reviewed draft was applied to the approved staging database in Prompt 53B, but this directory remains outside the active migration path and is not an executable migration history.

The reviewed draft defines two private `app`-schema tables: `admin_actions` for durable, successful-command idempotency receipts and `audit_logs` for one-to-one immutable evidence. It does not define a runtime write path, rejected/failed-attempt telemetry, database triggers, RLS, policies, grants, or Data API exposure.

Prompt 53 is now schema-unblocked after the controlled apply and catalog verification. The draft must not be copied into an active migration directory or executed against another target without separate approval. See [the M4 review](../../../docs/m4-admin-command-audit-foundation-review.md) and [the staging apply report](../../../docs/m4-admin-command-audit-staging-apply-report.md) for the transaction, replay, redaction, and verification record. Runtime write execution remains a separate phase.
