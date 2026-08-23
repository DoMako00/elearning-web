# M4 Audit Foundation Drafts

This directory contains non-active, review-only schema drafts for the minimal private Admin command audit foundation. It is not an active migration path, and no SQL in this directory has been applied.

The reviewed draft defines two private `app`-schema tables: `admin_actions` for durable, successful-command idempotency receipts and `audit_logs` for one-to-one immutable evidence. It does not define a runtime write path, rejected/failed-attempt telemetry, database triggers, RLS, policies, grants, or Data API exposure.

Prompt 53 write execution remains blocked until this foundation receives separate schema-review and controlled staging-apply authorization. The draft must not be copied into an active migration directory or executed against staging or production without that approval. See [the M4 review](../../../docs/m4-admin-command-audit-foundation-review.md) for the transaction, replay, redaction, and future apply requirements.
