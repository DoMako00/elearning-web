# Schema Decision Owner Review

## Phase header

- **Phase:** 28
- **Scope:** Documentation/owner-decision confirmation only
- **Server impact:** None
- **Commit rule:** Local commit only after validation passes
- **Push rule:** Do not push
- **Deploy rule:** No deploy

## 1. Purpose

This document records owner-approved schema decisions after Prompt 27 and before any SQL or migration work. It updates the decision register’s statuses without creating a physical schema, changing runtime behavior, or silently finalizing decisions that the owner has not approved.

The product remains one application platform. Medway and Elite are educational brands/educational identities inside it; brand scope remains the canonical isolation boundary.

## 2. Non-goals

This phase includes:

- no SQL;
- no migrations;
- no Supabase SDK;
- no RLS implementation;
- no runtime integration;
- no payment/provider implementation;
- no media/storage implementation; and
- no deployment.

## 3. Owner-approved decisions

| Decision ID | Decision | Owner-approved value | Previous status | New status | Migration impact | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| D01 | Educational brand table naming | `educational_brands` | Proposed default: `brands` | Finalized | M1 foundation | Medway and Elite are educational brands/educational identities inside one application platform. The canonical table name is `educational_brands`, not `brands`. Domain terminology remains brand scope. Use concise fields such as `brand_id`, `brand_code`, and `brand_memberships`; do not introduce `educational_brand_id` or `educational_brand_code` unless explicitly decided later. |
| D04 | Application user scope | Global `app_users` linked to provider authentication identity | Pending owner confirmation | Finalized | M1 foundation | A user can exist at application level before Medway/Elite brand activation. Brand-scoped app users per auth identity are not the v1 default. |
| D05 | Brand membership model | Explicit `brand_memberships` | Pending owner confirmation | Finalized | M1 foundation | Membership activation follows a verified brand-scoped commercial flow. A user is not automatically an active brand user after registration. |
| D09 | RLS timing | M7 is full RLS review/hardening/testing, but RLS is required before any Supabase/Data API exposure | Pending owner confirmation | Finalized | Blocks Data API exposure | No app table may be exposed through Supabase/Data API without explicit RLS and exposure approval. |
| D19 | Device scope for v1 | Devices are brand-scoped for v1 | Pending owner confirmation | Finalized | M4 security/device foundation | This supports anti-sharing, access validation, and brand-scoped risk policy. Global device identity may be reconsidered later but is not the v1 default. |
| D21 | Session scope for v1 | Sessions carry brand context for v1 | Proposed default | Finalized | M4 session/security foundation | This prevents session reuse from silently crossing Medway/Elite brand scope. |

## 4. Registration-to-brand activation flow

```text
Register / OTP
  → create provider auth identity
  → create global app_user
  → user chooses Medway or Elite
  → create brand-scoped order/payment attempt
  → user submits transfer/reference number
  → admin reviews manually
  → if approved:
       approve payment/commercial evidence
       activate brand_membership
       activate subscription/seat assignment
       create brand-scoped access_grant
       user becomes active brand user
  → if rejected:
       user remains app_user
       brand access remains inactive
       paid content remains locked
```

Registration alone does not grant brand access. `app_user` existence alone does not grant brand access. Payment evidence submission alone, including transfer/reference number submission alone, does not grant access. Admin verification is required before activation. `access_grant` remains the explicit authorization input, and final protected-resource access still requires backend policy evaluation.

## 5. Manual payment reference rule

- Manual payment must include a transfer/reference number.
- The reference number is review evidence, not automatic payment approval.
- Admin approval creates or updates commercial state through a backend-mediated command.
- Admin approval may trigger subscription/seat activation and access-grant creation only through backend-mediated commands.
- The frontend must never directly activate membership, subscription, seat, or access grant.
- Rejection preserves the submitted evidence and the rejection reason.
- Duplicate reference numbers are a risk/validation case for later implementation.
- Payment approval and access activation remain separate audited transitions.

## 6. Remaining pending decisions

The following decisions remain visible in `schema-decision-register.md` and are not silently finalized by this review:

- D06 — Student profile scope
- D07 — Admin profile scope
- D11 — Enrollment role
- D14 — Subscription seat limits
- D16 — Payment transaction naming
- D20 — Device replacement policy
- D23 — Full-view/video limit meaning
- D24 — Media authorization retention
- D26 — Assessment attempt lifecycle
- D29 — Audit/evidence retention
- D31 — Organization ownership deferral
- D34 — Content hierarchy canonical levels

Other proposed, deferred, or blocked decisions retain their Prompt 27 status unless explicitly changed by a later owner review.

## 7. Migration-readiness impact

- Finalizing D01, D04, and D05 reduces the M1 identity/brand blocker set, but M1 is not automatically approved until every remaining M1 blocker is reviewed.
- D09 finalizes the safety rule that RLS and exposure approval are required before any Supabase/Data API exposure.
- Finalizing D19 and D21 establishes the v1 brand-scoped security, device, and session direction for M4.
- No SQL may start yet unless explicitly approved in a later phase.
- `educational_brands` is the owner-approved M1 table name for Medway/Elite educational brand identities.

## 8. Next phase recommendation

### Prompt 29 — Remaining Schema Decisions Review

The next phase should finalize the remaining M1 blockers first, then decide whether M2/M3 blockers can be finalized immediately or deferred. It remains documentation-only; no SQL or migrations may begin unless the scope is explicitly changed.

### Prompt 29B — M1 Migration Draft Plan

This is a later alternative only after all M1 blockers are resolved and explicitly recorded. It must not be used to bypass the migration-readiness gate.
