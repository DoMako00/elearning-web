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
| D03 | Legacy platform terminology migration | New schema uses `brand_id`/`brand_code`; `platform_id`/`platform_code` remain compatibility aliases only. | Pending owner confirmation | Blocks M1 | Yes, for migration naming plan | Prevents continuing platform confusion in SQL while allowing deliberate compatibility migration. | M1 owner review |
| D04 | Application user scope | Global `app_users` linked to provider authentication identity; users exist at application level before brand activation. | Finalized | Blocks M1 | No | Owner-confirmed in Prompt 28; brand-scoped app users per auth identity are not the v1 default. | M1 |
| D05 | Brand membership model | Explicit `brand_memberships` table with lifecycle state and membership type; activation follows verified brand-scoped commercial flow. | Finalized | Blocks M1 | No | Owner-confirmed in Prompt 28; registration does not automatically activate a Medway/Elite membership. | M1 |
| D06 | Student profile scope | Brand-scoped `student_profiles`. | Proposed default | Blocks M1 | Yes | Academic term/year/university/student ID may differ per brand/product context. | M1 owner review |
| D07 | Admin profile scope | Brand-scoped `admin_profiles` for v1; future alternative: global admin identity plus scoped assignments. | Proposed default | Blocks M1 | Yes | Safer isolation for the initial admin dashboard. | M1 owner review |
| D08 | Future global/super admin model | Explicit global assignment/policy that still produces target-brand decisions. | Deferred | Does not block initial brand-admin migrations | Yes, before global-admin work | Avoids a nullable brand bypass. | Deferred governance phase |
| D09 | RLS timing | M7 remains the full RLS review/hardening/testing phase, but RLS is required before any Supabase/Data API exposure. | Finalized | Blocks Data API exposure | No | Owner-confirmed in Prompt 28; no app table may be exposed without explicit RLS/exposure approval. | M7 / exposure review |
| D10 | App schema exposure model | Keep the app schema private and backend-mediated initially; no direct Supabase Data API exposure for sensitive app tables. | Proposed default | Blocks Data API exposure | Yes | Keeps the backend as authorization source of truth. | M7 / exposure review |
| D11 | Enrollment role | Retain enrollment as participation/progress evidence, never authorization. | Pending owner confirmation | Blocks M3 or learning/assessment FKs if used there | Yes | Avoids mixing learning participation with entitlement. | M3/M6 owner review |
| D12 | Access grant model | Explicit brand-scoped `access_grants` with user/seat/resource/product scope where needed. | Proposed default | Blocks M3 | Yes | `access_grant` is the explicit authorization input. | M3 |
| D13 | Product/offer/plan naming | Keep products/offers/plans/prices as separate concepts. | Proposed default | Blocks M3 | Yes | Supports packages, subscriptions, early bird, promotions, and free access. | M3 |
| D14 | Subscription seat limits | Versioned plan/subscription policy snapshot plus active assignment count. | Pending owner confirmation | Blocks M3 | Yes | Seat count, limits, and prices must not depend only on mutable plan definitions. | M3 owner review |
| D15 | Seat ownership and members | Subscription owner plus separate seat members/users with independent progress, devices, and results. | Proposed default | Blocks M3 | Yes | Turns account sharing into explicit paid seats. | M3 |
| D16 | Payment transaction naming | `payment_transactions`. | Pending owner confirmation | Blocks M3 | Yes | Provides consistent financial event naming across schema and architecture docs. | M3 owner review |
| D17 | Manual payment evidence | Store payment evidence as append-only review input; approval creates financial/commercial state, not direct access. | Proposed default | Blocks M3 | Yes | Manual payment remains backend-mediated and audited. | M3 |
| D18 | Refund/access relationship | Refund is financial state; access revocation/update occurs through an explicit access policy/command. | Proposed default | Blocks M3 | Yes | Keeps financial and authorization transitions separate. | M3 |
| D19 | Device scope for v1 | Devices are server-managed and brand-scoped for v1 policy/risk evaluation; global device identity may be considered later. | Finalized | Blocks M4 | No | Owner-confirmed in Prompt 28; this supports anti-sharing, access validation, and brand-scoped risk policy. | M4 |
| D20 | Device replacement policy | Versioned policy plus append-only device replacement/event evidence. | Pending owner confirmation | Does not block M1, blocks M4 policy tables | Yes | Replacement counts and reasons need explicit owner policy. | M4 owner review |
| D21 | Session scope for v1 | Sessions carry brand context for v1 request/access validation. | Finalized | Blocks M4 | No | Owner-confirmed in Prompt 28; prevents session reuse from silently crossing Medway/Elite brand scope. | M4 |
| D22 | Concurrent usage/risk events | Record risk signals/events separately from the hard authorization decision. | Proposed default | Blocks M4 security/risk tables | Yes | Concurrency is a signal, not automatic proof. | M4 |
| D23 | Full-view/video limit meaning | Treat it as a risk/policy accounting metric, not direct access authority. | Pending owner confirmation | Does not block identity foundation; affects media/playback policy | Yes | “3 full views” must be precisely defined before enforcement. | M5 policy review |
| D24 | Media authorization retention | Append-only decisions with policy-controlled retention/anonymization. | Pending owner confirmation | Blocks M5 | Yes | Protected media authorization needs traceability and privacy policy. | M5 owner review |
| D25 | Protected media URL policy | Never expose permanent public provider URLs; issue only backend-authorized short-lived delivery after evaluation. | Finalized | Blocks M5 | No | This is a core protected-media invariant. | M5 |
| D26 | Assessment attempt lifecycle | `in_progress`, `submitted`, `graded`, `under_review`, `invalidated`. | Pending owner confirmation | Blocks M6 | Yes | Lifecycle affects scoring, review, retakes, and audit. | M6 owner review |
| D27 | Quiz vs scheduled exam model | Shared assessment core with source/type distinguishing lesson quiz from scheduled exam. | Proposed default | Blocks M6 | Yes | Avoids duplicate assessment systems. | M6 |
| D28 | Assessment availability and release relationship | Attempts require assessment availability plus resource/release/access evaluation. | Proposed default | Blocks M6 | Yes | Auth, enrollment, payment, session, and device alone are insufficient. | M6 |
| D29 | Audit/evidence retention | Append-only with retention/anonymization policy; no destructive history rewrite. | Pending owner confirmation | Blocks M4+ evidence design | Yes | Evidence spans admin, security, access, payment, media, and assessment. | M4+ owner review |
| D30 | Evidence brand scope | `brand_id` required for brand activity; nullable only for explicitly global system events. | Proposed default | Blocks M4 | Yes | Audit records must retain target brand context. | M4 |
| D31 | Organization ownership representation | Do not block early migrations on organization ownership; start with `owner_user_id` or simple owner fields where needed; defer organization-owned commerce/group ownership. | Deferred | Does not block M1 unless a multi-owner model is confirmed | Yes, before organization-owned commerce | Current project is one owner / multiple brands. | Deferred organization phase |
| D32 | Admin role assignment scope | Brand-scoped role assignments for v1. | Proposed default | Blocks M1/admin foundations | Yes | Provides safer admin isolation. | M1 |
| D33 | Admin command evidence model | Append-only command evidence including actor, target, brand, reason, idempotency, and result. | Proposed default | Blocks admin command persistence | Yes | Admin operations must be backend-mediated and auditable. | Admin command phase |
| D34 | Content hierarchy canonical levels | Flexible content nodes/resources compatible with Program/Track → Academic Year → Semester → Module/Subject → Chapter → Lesson. | Pending owner confirmation | Blocks M2 | Yes | Supports current BUC/medical content and future structure. | M2 owner review |
| D35 | Resource type union | `video`, `document`, `quiz`, `link`, `file`. | Proposed default | Blocks M2/M5/M6 | Yes | Aligns current learning resource documentation. | M2/M5/M6 |
| D36 | Seed data strategy | Minimal Medway/Elite staging seed after migrations, not before schema decisions. | Proposed default | Blocks M8 | Yes | Seed data must follow approved schema and brand decisions. | M8 |
| D37 | Migration execution policy | SQL authoring, migration review, staging application, and production application are separate explicit phases. | Finalized | Blocks all migrations | No | Preserves deployment control and migration safety. | All migration phases |

## 6. Prompt 28 owner-confirmed clarifications

Prompt 28 owner review finalized D01, D04, D05, D09, D19, and D21. The D01 correction is explicit: the canonical table is `educational_brands`, not `brands`. Domain terminology remains brand scope, and schema fields remain concise as `brand_id`, `brand_code`, and `brand_memberships`; do not introduce `educational_brand_id` or `educational_brand_code` unless explicitly decided later.

Brand membership is not automatic after registration. A global `app_user` becomes an active Medway or Elite brand user only after a brand-scoped commercial flow is verified. For paid access, manual payment evidence must include a transfer/reference number, an admin must verify it, and only an approved backend-mediated flow may activate the membership, subscription/seat assignment, and explicit access grant. Payment evidence or reference submission alone is not authorization.

## 7. Blocking decision groups

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

## 8. Remaining owner confirmation checklist before SQL

- [x] Owner-confirm D01: canonical table name is `educational_brands`.
- [x] Owner-confirm D04/D05: global `app_users` plus explicit `brand_memberships`.
- [x] Owner-confirm D09: RLS is required before any Data API exposure; M7 remains full review/hardening/testing.
- [x] Owner-confirm D19/D21: brand-scoped devices and brand-context sessions for v1.
- [ ] Confirm brand-scoped student and admin profile scope for v1.
- [ ] Confirm enrollment remains participation/progress evidence, not authorization.
- [ ] Confirm subscription seat limits and policy snapshot semantics.
- [ ] Confirm `payment_transactions` as the canonical transaction name.
- [ ] Confirm the device replacement policy and evidence requirements.
- [ ] Define the meaning of a video “full view” for policy accounting.
- [ ] Confirm media authorization retention and anonymization rules.
- [ ] Confirm the assessment attempt lifecycle.
- [ ] Confirm audit/evidence retention and anonymization policy.
- [ ] Confirm canonical content hierarchy levels.
- [ ] Confirm organization ownership remains deferred for initial migrations.

## 9. Recommended defaults summary

Until the owner confirms pending decisions, the recommended planning defaults are:

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

- No M1 SQL or migration may start until all M1 blockers are resolved and owner-confirmed where required.
- No M2–M6 migration may start until its listed blocker group is resolved.
- No table may be exposed through Supabase/Data API without RLS enabled for that table and explicit exposure approval.
- No production migration may start without explicit production-phase approval, separate from local commit approval.
- No decision may be bypassed by encoding an implicit nullable-brand or cross-brand exception in SQL, application code, seed data, or provider configuration.

## 11. Next phase recommendation

### Prompt 29 — Remaining Schema Decisions Review

Recommended next phase. Review and finalize remaining M1 blockers first, then decide whether M2/M3 blockers can be finalized now or deferred. The result remains documentation-only with no SQL or migrations unless a later phase explicitly changes scope.

### Prompt 29B — M1 Migration Draft Plan

This is an alternative only after all M1 blockers are resolved and explicitly recorded. It must not begin before the migration-readiness gate is confirmed.
