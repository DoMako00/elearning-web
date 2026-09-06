# Schema Decision Register

## Phase header

- **Phase:** 27
- **Scope:** Documentation/decision register only
- **Server impact:** None
- **Commit rule:** Local commit only after validation passes
- **Push rule:** Do not push
- **Deploy rule:** No deploy

## 1. Purpose

This register tracks the schema decisions required before writing PostgreSQL/Supabase SQL or migrations. It is the decision source of truth for distinguishing architecture that is already stable from proposed defaults, decisions that require owner confirmation, later-phase decisions, and decisions that block a migration or Data API exposure.

It answers:

- Which schema decisions are already stable?
- Which decisions are proposed defaults?
- Which decisions require owner confirmation?
- Which decisions block M1, M2, or M3 migrations?
- Which decisions belong to later phases?
- Which decisions and safety gates are forbidden to bypass?

The application is one platform. Medway and Elite are brand scopes inside that platform, and brand scope is the canonical isolation boundary. Legacy `platform`/`platform_id`/`platform_code` terminology may remain as compatibility documentation only; new schema decisions use brand terminology.

## 2. Non-goals

This register does not include:

- SQL;
- migrations or migration files;
- Supabase SDK usage;
- RLS policy implementation;
- runtime integration or database queries;
- authentication, OTP, sessions, or devices runtime;
- payment, protected-media, storage, CDN, or other provider implementation;
- deployment or Dokploy activity; or
- a production decision.

## 3. Decision status and migration-impact model

### Statuses

- **Finalized:** already required by an approved project rule; it is not an owner choice in this register.
- **Proposed default:** the recommended design direction, not yet approved as the owner’s final choice.
- **Pending owner confirmation:** an owner decision is required before the affected schema or migration work can proceed.
- **Deferred:** intentionally moved to a later phase; it may still require owner confirmation before that phase.
- **Blocked:** unresolved or contradictory information prevents the affected work from safely proceeding.

### Migration impact

- **Blocks M1:** must be resolved before identity/brand-foundation SQL or migrations.
- **Blocks M2:** must be resolved before learning/content SQL or migrations.
- **Blocks M3:** must be resolved before commerce/access SQL or migrations.
- **Blocks M4+:** must be resolved before the indicated later-phase migration work.
- **Does not block initial migrations:** can remain deferred while earlier foundations proceed.
- **Blocks Data API exposure:** the decision and exposure approval must be resolved before a table is exposed through Supabase/Data API.
- **Blocks production only:** may be deferred from local/staging planning but must be resolved before production migration or operation.

## 4. Core stable decisions

The following are **Finalized** because they are already required by approved architecture and are not silently reopened by this register:

1. There is one application platform.
2. Medway and Elite are brand scopes.
3. New schema work uses brand terminology.
4. Auth identity is not authorization.
5. Payment is not access.
6. Subscription is not access.
7. Seat is not access.
8. Enrollment is not access.
9. Device/session is not access.
10. Access requires backend evaluation and an active brand-scoped access grant.
11. The backend is the authorization source of truth.
12. Frontend route guards are presentation only.
13. Protected media must not expose permanent public URLs.
14. Evidence/audit should be append-only.
15. RLS is defense-in-depth, not a replacement for backend policies.

## 5. Main decision table

| ID | Decision | Recommended default | Status | Migration impact | Owner confirmation required? | Rationale | Follow-up phase |
| --- | --- | --- | --- | --- | --- | --- | --- |
| D01 | Educational brand table naming | `educational_brands`; do not use `brands` as the canonical table name. Domain terminology remains brand scope, with concise `brand_id`, `brand_code`, and `brand_memberships` fields. | Finalized | Blocks M1 | No | Owner-confirmed in Prompt 28: Medway and Elite are educational brands/identities inside one application platform. Do not introduce `educational_brand_id` or `educational_brand_code` unless explicitly decided later. | M1 |
| D02 | Brand code values | `medway`, `elite` | Finalized | Blocks M1 | No, unless approved docs change | Canonical brand codes are already used by runtime and documentation. | M1 |
| D03 | Legacy platform terminology migration | New schema and migration work use `brand_id`/`brand_code`; legacy `platform_id`, `platform_code`, `platform-*`, and `AdminPlatform*` remain compatibility aliases/documentation only. | Finalized | M1 foundation | No | Owner-confirmed in Prompt 30. Do not continue platform terminology in new SQL and do not remove compatibility aliases in this phase. | M1 migration draft plan |
| D04 | Application user scope | Global `app_users` linked to provider authentication identity; users exist at application level before brand activation. | Finalized | Blocks M1 | No | Owner-confirmed in Prompt 28; brand-scoped app users per auth identity are not the v1 default. | M1 |
| D05 | Brand membership model | Explicit `brand_memberships` table with lifecycle state and membership type; activation follows verified brand-scoped commercial flow. | Finalized | Blocks M1 | No | Owner-confirmed in Prompt 28; registration does not automatically activate a Medway/Elite membership. | M1 |
| D06 | Student profile scope | Brand-scoped `student_profiles` linked to global `app_users`; each profile belongs to exactly one `brand_id`. | Finalized | M1 foundation | No | Owner-confirmed in Prompt 30. Academic year/term, university, student ID, eligibility, and learning context may differ per educational brand. | M1 migration draft plan |
| D07 | Admin profile scope | Brand-scoped `admin_profiles` for v1; future global admin uses explicit scoped assignments. | Finalized | M1 foundation | No | Owner-confirmed in Prompt 30. Safer isolation between Medway and Elite admin operations. | M1 migration draft plan |
| D08 | Future global/super admin model | Defer global/super admin; when added, require explicit global assignment/policy that still produces target-brand decisions. | Deferred | Does not block initial brand-admin migrations | No, until global-admin work | Owner-approved deferral in Prompt 30. Never use nullable brand as a bypass. | Deferred governance phase |
| D09 | RLS timing | M7 remains the full RLS review/hardening/testing phase, but RLS is required before any Supabase/Data API exposure. | Finalized | Blocks Data API exposure | No | Owner-confirmed in Prompt 28; no app table may be exposed without explicit RLS/exposure approval. | M7 / exposure review |
| D10 | App schema exposure model | Keep the app schema private and backend-mediated initially; no direct Supabase/Data API exposure for sensitive app tables unless explicit exposure approval and RLS exist. | Finalized | Blocks Data API exposure | No | Owner-confirmed in Prompt 30. The backend remains the authorization source of truth. | M7 / exposure review |
| D11 | Enrollment role | Enrollment is participation/progress evidence only, never authorization. | Finalized | M3 / learning-assessment relationships | No | Owner-confirmed in Prompt 30. Enrollment does not unlock protected content by itself. | M3 migration draft plan |
| D12 | Access grant model | Use explicit brand-scoped `access_grants`; a grant is an authorization input, and final access still requires backend policy evaluation. | Finalized | M3 access foundation | No | Owner-confirmed in Prompt 30. Preserves payment/subscription/seat/enrollment/access separation. | M3 migration draft plan |
| D13 | Product/offer/plan naming | Keep products, offers, plans, and prices as separate concepts. | Finalized | M3 commerce foundation | No | Owner-confirmed in Prompt 30. Supports packages, subscriptions, early-bird pricing, promotions, free access, and future variants. | M3 migration draft plan |
| D14 | Subscription seat limits | Use versioned plan/subscription policy snapshots and enforce seat limits by active seat-assignment count. | Finalized | M3 subscription/seat foundation | No | Owner-confirmed in Prompt 30. Exact seat numbers and prices remain configurable policy values. | M3 migration draft plan |
| D15 | Seat ownership and members | Subscription owner is separate from seat members; each member has independent auth, progress, device state, quiz results, and certificates. | Finalized | M3 seat foundation | No | Owner-confirmed in Prompt 30. Converts account sharing into explicit paid seats. | M3 migration draft plan |
| D16 | Payment transaction naming | Use `payment_transactions`. | Finalized | M3 payment foundation | No | Owner-confirmed in Prompt 30. Use consistent financial event naming. | M3 migration draft plan |
| D17 | Manual payment evidence | Append-only review input with required transfer/reference number; evidence alone does not approve payment or activate access. | Finalized | M3 payment review foundation | No | Owner-confirmed in Prompt 30. Admin approval remains backend-mediated and audited. | M3 migration draft plan |
| D18 | Refund/access relationship | Refund is financial state; access revocation/update uses an explicit backend-mediated access command/policy. | Finalized | M3 refund/access foundation | No | Owner-confirmed in Prompt 30. Financial and authorization transitions remain separate. | M3 migration draft plan |
| D19 | Device scope for v1 | Devices are server-managed and brand-scoped for v1 policy/risk evaluation; global device identity may be considered later. | Finalized | Blocks M4 | No | Owner-confirmed in Prompt 28; this supports anti-sharing, access validation, and brand-scoped risk policy. | M4 |
| D20 | Device replacement policy | Versioned device replacement policy with append-only replacement/event evidence and reasoned admin override. | Finalized | M4 device/security foundation | No | Owner-confirmed in Prompt 30. Exact replacement counts remain configurable policy values. | M4 migration draft plan |
| D21 | Session scope for v1 | Sessions carry brand context for v1 request/access validation. | Finalized | Blocks M4 | No | Owner-confirmed in Prompt 28; prevents session reuse from silently crossing Medway/Elite brand scope. | M4 |
| D22 | Concurrent usage/risk events | Record concurrent usage as a risk signal/event, not automatic proof; enforcement depends on policy. | Finalized | M4 security/risk foundation | No | Owner-confirmed in Prompt 30. A risk signal is policy input, not standalone conviction. | M4 migration draft plan |
| D23 | Full-view/video limit meaning | Full-view/video count is a policy/risk/accounting metric, not direct access authority. | Finalized | M5 media/playback policy | No | Owner-confirmed in Prompt 30. Exact numeric limits remain configurable per policy/resource/brand. | M5 migration draft plan |
| D24 | Media authorization retention | Media authorization decisions are append-only; retention/anonymization periods are policy-controlled later. | Finalized | M5 media authorization foundation | No | Owner-confirmed in Prompt 30. Preserve traceability without hard-coding retention durations. | M5 migration draft plan |
| D25 | Protected media URL policy | Never expose permanent public provider URLs; issue only backend-authorized short-lived delivery after evaluation. | Finalized | Blocks M5 | No | This is a core protected-media invariant. | M5 |
| D26 | Assessment attempt lifecycle | `in_progress`, `submitted`, `graded`, `under_review`, `invalidated`. | Finalized | M6 assessment foundation | No | Owner-confirmed in Prompt 30. Affects scoring, review, retakes, invalidation, and audit. | M6 migration draft plan |
| D27 | Quiz vs scheduled exam model | Shared assessment core with source/type distinguishing lesson quiz from scheduled exam. | Finalized | M6 assessment model | No | Owner-confirmed in Prompt 30. Avoid duplicate assessment systems. | M6 migration draft plan |
| D28 | Assessment availability and release relationship | Attempts require availability, resource/release eligibility, an active brand-scoped access grant, and backend policy evaluation. | Finalized | M6 assessment access model | No | Owner-confirmed in Prompt 30. Auth/enrollment/payment/subscription/session/device are individually insufficient. | M6 migration draft plan |
| D29 | Audit/evidence retention | Audit/evidence records are append-only with no destructive history rewrite; retention/anonymization policy is defined later. | Finalized | M4+ evidence foundation | No | Owner-confirmed in Prompt 30. Exact retention periods remain configurable policy values. | M4 migration draft plan |
| D30 | Evidence brand scope | `brand_id` is required for brand activity; nullable scope is allowed only for explicitly global system events. | Finalized | M4 evidence foundation | No | Owner-confirmed in Prompt 30. Evidence must not lose target-brand context. | M4 migration draft plan |
| D31 | Organization ownership representation | Defer organization-owned commerce/group ownership; use simple `owner_user_id` or owner metadata where needed initially. | Deferred | Does not block initial migration planning | No, until organization-owned commerce | Owner-approved deferral in Prompt 30. Early migrations are not blocked by organization ownership. | Deferred organization phase |
| D32 | Admin role assignment scope | Admin role assignments are brand-scoped for v1. | Finalized | M1 admin foundation | No | Owner-confirmed in Prompt 30. Admin permissions must not silently cross Medway/Elite. | M1 migration draft plan |
| D33 | Admin command evidence model | Append-only command evidence includes actor, target, brand, reason, idempotency, result, timestamp, and metadata. | Finalized | Admin command persistence / M4 evidence | No | Owner-confirmed in Prompt 30. Admin operations remain backend-mediated and auditable. | M4 migration draft plan |
| D34 | Content hierarchy canonical levels | Flexible Program/Track → Academic Year → Semester → Module/Subject → Chapter → Lesson hierarchy; some levels may be optional. | Finalized | M2 learning/content foundation | No | Owner-confirmed in Prompt 30. Do not hard-code only Course → Lesson. | M2 migration draft plan |
| D35 | Resource type union | `video`, `document`, `quiz`, `link`, `file`. | Finalized | M2/M5/M6 resources | No | Owner-confirmed in Prompt 30. Aligns learning resources, protected media, and assessments. | M2 migration draft plan |
| D36 | Seed data strategy | Seed minimal Medway/Elite data only after schema/migrations are drafted and reviewed. | Deferred | Does not block initial migration planning; blocks M8 seed execution | No, until M8 | Owner-approved deferral in Prompt 30. No seed data before schema decisions and migration drafts are ready. | M8 after migration review |
| D37 | Migration execution policy | SQL authoring, migration review, staging application, and production application are separate explicit phases. | Finalized | Blocks all migrations | No | Preserves deployment control and migration safety. | All migration phases |

## 6. Prompt 28 owner-confirmed clarifications

Prompt 28 owner review finalized D01, D04, D05, D09, D19, and D21. The D01 correction is explicit: the canonical table is `educational_brands`, not `brands`. Domain terminology remains brand scope, and schema fields remain concise as `brand_id`, `brand_code`, and `brand_memberships`; do not introduce `educational_brand_id` or `educational_brand_code` unless explicitly decided later.

Brand membership is not automatic after registration. A global `app_user` becomes an active Medway or Elite brand user only after a brand-scoped commercial flow is verified. For paid access, manual payment evidence must include a transfer/reference number, an admin must verify it, and only an approved backend-mediated flow may activate the membership, subscription/seat assignment, and explicit access grant. Payment evidence or reference submission alone is not authorization.

## 7. Blocking decision groups

Prompt 30 resolved the listed M1–M6 decision blockers through owner confirmation, except intentionally deferred decisions that do not block the corresponding initial planning phase. These groups remain the traceability index for future migration planning; they are not authorization to write or apply SQL.

### A. Blocks M1 identity/brand foundation

D01, D03, D04, D05, D06, D07, D09, D10, D32.

### B. Blocks M2 learning/content

D34, D35.

### C. Blocks M3 commerce/access

D11, D12, D13, D14, D15, D16, D17, D18.

### D. Blocks M4 security/evidence

D19, D20, D21, D22, D29, D30.

### E. Blocks M5 media

D23, D24, D25, D35.

### F. Blocks M6 assessment

D26, D27, D28, D35.

### G. Blocks Supabase/Data API exposure

D09, D10.

## 8. Owner confirmation checklist

- [x] Owner-confirm D01: canonical table name is `educational_brands`.
- [x] Owner-confirm D04/D05: global `app_users` plus explicit `brand_memberships`.
- [x] Owner-confirm D09: RLS is required before any Data API exposure; M7 remains full review/hardening/testing.
- [x] Owner-confirm D19/D21: brand-scoped devices and brand-context sessions for v1.
- [x] Owner-confirm D03, D06, D07, D10, and D32: M1 terminology, profiles, private exposure model, and role-assignment foundations.
- [x] Owner-confirm D11–D18: M3 enrollment, grants, commerce, seats, payments, and refund/access separation.
- [x] Owner-confirm D20, D22–D24, D26–D30, and D33–D35: M2/M4/M5/M6 structural decisions.
- [x] Owner-confirm D08, D31, and D36 as intentional deferrals.

## 9. Recommended defaults summary

Owner-confirmed planning defaults are:

- `educational_brands` with canonical codes `medway` and `elite`;
- global `app_users` plus explicit `brand_memberships`;
- brand-scoped student and admin profiles for v1;
- a private, backend-mediated app schema initially;
- RLS before any Supabase/Data API exposure;
- explicit brand-scoped `access_grants`;
- payment, subscription, seat, and enrollment records separate from access;
- brand-scoped devices and sessions for v1 policy;
- append-only evidence with controlled retention/anonymization;
- no permanent protected-media URLs; and
- separate migration authoring, review, application, seed, and production phases.

## 10. Migration readiness gate

- All current M1–M6 decision blockers are resolved or intentionally deferred, but Prompt 30 does not authorize SQL authoring, migration creation, or migration application.
- SQL authoring, migration review, staging application, and production application remain separate explicit phases under D37.
- No table may be exposed through Supabase/Data API without RLS enabled for that table and explicit exposure approval.
- No production migration may start without explicit production-phase approval, separate from local commit approval.
- No decision may be bypassed by encoding an implicit nullable-brand or cross-brand exception in SQL, application code, seed data, or provider configuration.

## 11. Next phase recommendation

### Prompt 31 — M1 Migration Draft Plan

Recommended next phase. Plan the first identity/brand migration batch and safety gates. SQL may be drafted only if Prompt 31 explicitly allows it; migration application remains forbidden unless a later explicit phase approves it.

### Migration application phase

This must be separately approved after SQL authoring and migration review. It is not authorized by Prompt 30.

## 12. Prompt 29 remaining-decision review

The remaining schema decisions are reviewed in [Remaining Schema Decisions Review](remaining-schema-decisions-review.md). Prompt 28 finalized D01, D04, D05, D09, D19, and D21, and D37 remains Finalized. Prompt 30 records explicit owner confirmation for the remaining approved defaults.

## 13. Prompt 30 owner confirmation batch

See [Schema Decision Owner Confirmation Batch](schema-decision-owner-confirmation-batch.md) for the complete approval record. D03, D06, D07, D10–D18, D20, D22–D24, D26–D30, and D32–D35 are Finalized; D08, D31, and D36 are Deferred. M1/M2/M3/M4/M5/M6 decision blockers are resolved or intentionally deferred, but no SQL or migration is authorized by this documentation phase.

## 14. Prompt 31 M1 migration planning

See [M1 Migration Draft Plan](m1-migration-draft-plan.md). M1 planning follows the Prompt 30 Finalized decisions, but no SQL or migration implementation exists. Any staging checkpoint push is a separate explicit action after validation and approval; it is not part of Prompt 31.

## 15. Prompt 32 M1 SQL draft

See the non-applied [M1 SQL draft](../db/migration-drafts/m1/README.md) and [M1 SQL Draft Review](m1-sql-draft-review.md). The draft follows the finalized Prompt 30/31 M1 decisions but does not authorize or perform migration application. D08, D31, and D36 remain Deferred; D36 specifically means Prompt 32 contains no seed data. RLS and explicit exposure approval remain mandatory before any Supabase/Data API exposure.

## 16. Prompt 33 M1 SQL draft review

See [M1 SQL Draft Review Fixes](m1-sql-draft-review-fixes.md). Prompt 33 completed the static draft review without applying SQL. D08, D31, and D36 remain Deferred; no seed, RLS/Data API exposure, or migration application is authorized by the review.
