# Schema Decision Owner Confirmation Batch

## Phase header

- **Phase:** 30
- **Scope:** Documentation/owner-decision confirmation only
- **Server impact:** None
- **Commit rule:** Local commit only after validation passes
- **Push rule:** Do not push
- **Deploy rule:** No deploy

## 1. Purpose

This document records the owner’s approval of the remaining recommended schema defaults from Prompt 29. It is still pre-SQL and pre-migration. It does not approve staging or production migration execution; it prepares the project for a future M1 Migration Draft Plan.

## 2. Non-goals

This phase includes:

- no SQL;
- no migrations;
- no Supabase SDK;
- no RLS policy implementation;
- no runtime integration;
- no provider implementation;
- no deployment;
- no source-code changes; and
- no production decision.

## 3. Previously finalized decisions

| Decision ID | Finalized value |
| --- | --- |
| D01 | Canonical educational brand table: `educational_brands`; concise scope fields remain `brand_id`, `brand_code`, and `brand_memberships`. |
| D02 | Brand codes: `medway`, `elite`. |
| D04 | Global `app_users` linked to provider authentication identity. |
| D05 | Explicit `brand_memberships`. |
| D09 | RLS before any Supabase/Data API exposure. |
| D19 | Brand-scoped devices for v1. |
| D21 | Sessions carry brand context for v1. |
| D25 | No permanent public protected-media URLs. |
| D37 | Separate SQL authoring, migration review, staging application, and production application phases. |

## 4. Owner-confirmed decisions in Prompt 30

| Decision ID | Decision | Owner-approved value | New status | Migration impact | Notes |
| --- | --- | --- | --- | --- | --- |
| D03 | Legacy platform terminology migration | New schema/migration work uses `brand_id` and `brand_code`; legacy `platform_id`, `platform_code`, `platform-*`, and `AdminPlatform*` remain compatibility documentation/aliases only. | Finalized | M1 foundation | Do not continue platform terminology in new SQL. Do not remove compatibility aliases in this phase. |
| D06 | Student profile scope | `student_profiles` are brand-scoped, linked to global `app_users`, and each belongs to exactly one `brand_id`. | Finalized | M1 foundation | Academic year/term, university, student ID, eligibility, and learning context may differ per educational brand. |
| D07 | Admin profile scope | `admin_profiles` are brand-scoped for v1; future global admin uses explicit scoped assignments. | Finalized | M1 foundation | Safer Medway/Elite admin isolation. |
| D10 | App schema exposure model | App schema is private/backend-mediated initially; sensitive tables have no direct Data API exposure unless RLS and explicit exposure approval exist. | Finalized | Blocks Data API exposure | Backend remains the authorization source of truth. |
| D11 | Enrollment role | Enrollment is participation/progress evidence only, never authorization. | Finalized | M3 / learning-assessment relationships | Enrollment does not unlock protected content by itself. |
| D12 | Access grant model | Use explicit brand-scoped `access_grants`; a grant is an authorization input and final access still needs backend evaluation. | Finalized | M3 access foundation | Preserves payment/subscription/seat/enrollment/access separation. |
| D13 | Product/offer/plan naming | Keep products, offers, plans, and prices as separate concepts. | Finalized | M3 commerce foundation | Supports packages, subscriptions, early-bird pricing, promotions, free access, and future variants. |
| D14 | Subscription seat limits | Use versioned plan/subscription policy snapshots and active seat-assignment count. | Finalized | M3 subscription/seat foundation | Exact seat numbers and prices remain configurable policy values. |
| D15 | Seat ownership and members | Subscription owner is separate from seat members; each member has independent auth, progress, devices, quiz results, and certificates. | Finalized | M3 seat foundation | Converts account sharing into explicit paid seats. |
| D16 | Payment transaction naming | Use `payment_transactions`. | Finalized | M3 payment foundation | Consistent financial event naming. |
| D17 | Manual payment evidence | Append-only review input with required transfer/reference number; evidence alone does not approve payment or activate access. | Finalized | M3 payment review foundation | Admin approval is backend-mediated and audited. |
| D18 | Refund/access relationship | Refund is financial state; access revocation/update uses an explicit backend-mediated access command/policy. | Finalized | M3 refund/access foundation | Financial and authorization transitions remain separate. |
| D20 | Device replacement policy | Versioned replacement policy, append-only replacement/event evidence, and reasoned admin override. | Finalized | M4 device/security foundation | Exact replacement counts remain configurable policy values. |
| D22 | Concurrent usage/risk events | Concurrent usage is a risk signal/event, not automatic proof; enforcement depends on policy. | Finalized | M4 security/risk foundation | Risk signal is policy input, not standalone conviction. |
| D23 | Full-view/video limit meaning | Full-view/video count is a policy/risk/accounting metric, not direct access authority. | Finalized | M5 media/playback policy | Exact numeric limits remain configurable per policy/resource/brand. |
| D24 | Media authorization retention | Media authorization decisions are append-only; retention/anonymization periods are policy-controlled later. | Finalized | M5 media authorization foundation | Preserve traceability without hard-coding durations. |
| D26 | Assessment attempt lifecycle | `in_progress`, `submitted`, `graded`, `under_review`, `invalidated`. | Finalized | M6 assessment foundation | Affects scoring, review, retakes, invalidation, and audit. |
| D27 | Quiz vs scheduled exam model | Shared assessment core; source/type distinguishes lesson quiz from scheduled exam. | Finalized | M6 assessment model | Avoid duplicate assessment systems. |
| D28 | Assessment availability and release relationship | Attempts require assessment availability, resource/release eligibility, active brand-scoped grant, and backend policy evaluation. | Finalized | M6 assessment access model | Auth/enrollment/payment/subscription/session/device are individually insufficient. |
| D29 | Audit/evidence retention | Audit/evidence is append-only; retention/anonymization policy is later; no destructive history rewrite. | Finalized | M4+ evidence foundation | Exact retention periods remain configurable policy values. |
| D30 | Evidence brand scope | `brand_id` is required for brand activity; null is allowed only for explicitly global system events. | Finalized | M4 evidence foundation | Evidence must retain target-brand context. |
| D32 | Admin role assignment scope | Admin role assignments are brand-scoped for v1. | Finalized | M1 admin foundation | Permissions must not silently cross Medway/Elite. |
| D33 | Admin command evidence model | Include actor, target, brand, reason, idempotency, result, timestamp, and metadata. | Finalized | Admin command persistence / M4 evidence | Admin operations remain backend-mediated and auditable. |
| D34 | Content hierarchy canonical levels | Flexible Program/Track → Academic Year → Semester → Module/Subject → Chapter → Lesson hierarchy; levels may be optional. | Finalized | M2 learning/content foundation | Do not hard-code only Course → Lesson. |
| D35 | Resource type union | `video`, `document`, `quiz`, `link`, `file`. | Finalized | M2/M5/M6 resources | Aligns learning resources, protected media, and assessments. |

## 5. Owner-approved deferrals

| Decision ID | Decision | Owner-approved deferral | Status | Notes |
| --- | --- | --- | --- | --- |
| D08 | Future global/super admin model | Defer. When added, require explicit global assignment/policy that still produces target-brand decisions; no nullable-brand bypass. | Deferred | Does not block initial brand-admin planning. |
| D31 | Organization ownership representation | Defer organization-owned commerce/group ownership. Use simple `owner_user_id`/owner metadata where needed. | Deferred | Early migrations are not blocked by organization ownership. |
| D36 | Seed data strategy | Seed minimal Medway/Elite data only after schema/migrations are drafted and reviewed. | Deferred | No seed data before decisions and migration drafts are ready. |

## 6. Updated migration readiness

Prompt 30 resolves the current M1/M2/M3/M4/M5/M6 schema decision blockers or intentionally defers decisions that do not block initial planning. M1 SQL or migration work is still not approved automatically.

The next safe phase is **Prompt 31 — M1 Migration Draft Plan**, not migration implementation. SQL authoring, migration review, staging application, and production application remain separate explicit phases. No app table may be exposed through Supabase/Data API without RLS and explicit exposure approval.

## 7. Remaining configurable policy values

The following values remain configurable policy values, not schema decision blockers or hard-coded values:

- device replacement counts;
- device replacement time windows, if needed;
- video/full-view numerical limits;
- media authorization retention periods;
- audit/evidence retention periods;
- anonymization timing;
- pricing values;
- seat pricing and discount numbers; and
- risk-scoring thresholds.

## 8. Next phase recommendation

### Prompt 31 — M1 Migration Draft Plan

Plan the first migration batch for identity, `educational_brands`, global app users, brand memberships, profiles, admin role-assignment foundations, and safety gates. SQL may be drafted only if Prompt 31 explicitly permits it. Applying migrations remains forbidden unless a later explicit phase approves it.
