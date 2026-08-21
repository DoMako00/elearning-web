# Remaining Schema Decisions Review

## Phase header

- **Phase:** 29
- **Scope:** Documentation/remaining decision review only
- **Server impact:** None
- **Commit rule:** Local commit only after validation passes
- **Push rule:** Do not push
- **Deploy rule:** No deploy

## 1. Purpose

This document reviews the schema decisions that remain unresolved after Prompt 28 and before any M1 migration draft. It preserves current decision statuses, proposes defaults for owner approval, identifies safe deferrals, and prevents SQL or migration work from beginning before the relevant decisions are closed.

It answers:

- Which decisions are already finalized?
- Which decisions still block M1?
- Which decisions can be recommended for owner approval?
- Which decisions can be deferred safely?
- Which decisions must not be bypassed before SQL?
- What is the safest next phase?

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

## 3. Already finalized decisions

### Prompt 28 owner decisions

| Decision ID | Finalized decision | Effect |
| --- | --- | --- |
| D01 | Canonical educational brand table is `educational_brands`; scope fields remain `brand_id`, `brand_code`, and `brand_memberships`. | Establishes the M1 brand-table name without introducing `educational_brand_id`. |
| D04 | Global `app_users` link to provider authentication identity. | An application user can exist before Medway/Elite activation. |
| D05 | Brand membership uses explicit `brand_memberships`. | Registration does not automatically create active brand access. |
| D09 | RLS is required before any Supabase/Data API exposure; M7 remains the full review/hardening/testing phase. | Blocks exposure of any app table without RLS and explicit exposure approval. |
| D19 | Devices are brand-scoped for v1. | Establishes the v1 device/security direction. |
| D21 | Sessions carry brand context for v1. | Prevents silent session reuse across Medway/Elite scope. |

### Finalized architectural invariants

- There is one application platform.
- Medway and Elite are educational brands/educational identities inside that platform.
- Auth identity is not authorization.
- Payment, subscription, seat, enrollment, device, and session state are not access by themselves.
- Access requires backend evaluation and an active brand-scoped `access_grant`.
- Protected media must not expose permanent public URLs.
- Audit/evidence history is append-only.
- The backend remains the authorization source of truth.
- D02 keeps `medway` and `elite` as the canonical brand codes.
- D25 keeps permanent protected-media URLs forbidden.
- D37 keeps SQL authoring, migration review, staging application, and production application as separate explicit phases.

## 4. Remaining decision inventory

No row in this inventory is finalized by Prompt 29. “Can finalize before SQL?” means the decision is suitable for owner confirmation before its affected migration phase; it does not mean this review grants that approval.

| Decision ID | Decision | Current status | Recommended default | Migration impact | Can finalize before SQL? | Should defer? | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| D03 | Legacy platform terminology migration | Pending owner confirmation | New schema uses `brand_id`/`brand_code`; legacy `platform_id`/`platform_code` remain deliberate compatibility aliases/documentation only. | Blocks M1 | Yes | No | The naming/compatibility migration plan still requires owner confirmation even though brand terminology is established. |
| D06 | Student profile scope | Proposed default | Brand-scoped `student_profiles` linked to global `app_users`, with exactly one `brand_id` per profile. | Blocks M1 | Yes | No | Academic identity and eligibility may differ per educational brand. |
| D07 | Admin profile scope | Proposed default | Brand-scoped `admin_profiles` for v1; add future global assignments explicitly. | Blocks M1 | Yes | No | Safer initial Medway/Elite admin isolation. |
| D08 | Future global/super admin model | Deferred | Defer; later use explicit global assignment/policy that still emits target-brand decisions. | Does not block initial brand-admin migrations | Later | Yes | Never use nullable brand as an implicit bypass. |
| D10 | App schema exposure model | Proposed default | Keep the app schema private/backend-mediated initially; no direct sensitive-table Data API exposure. | Blocks Data API exposure and M1 readiness | Yes | No | Backend remains the authorization source of truth. |
| D11 | Enrollment role | Pending owner confirmation | Participation/progress evidence only; never authorization. | Blocks M3 or related learning/assessment FKs | Yes | No | Keeps learning participation separate from entitlement. |
| D12 | Access grant model | Proposed default | Explicit brand-scoped `access_grants` as authorization input; final access still requires backend evaluation. | Blocks M3 | Yes | No | A grant is required but is not the complete access decision. |
| D13 | Product/offer/plan naming | Proposed default | Keep products, offers, plans, and prices as separate concepts. | Blocks M3 | Yes | No | Supports commercial composition and versioned terms. |
| D14 | Subscription seat limits | Pending owner confirmation | Versioned plan/subscription policy snapshot plus active seat-assignment count. | Blocks M3 | Yes | No | Avoids dependence on mutable plan definitions. |
| D15 | Seat ownership and members | Proposed default | Subscription owner is separate from seat members; every member has independent identity and learning/security state. | Blocks M3 | Yes | No | Prevents shared credentials from becoming the seat model. |
| D16 | Payment transaction naming | Pending owner confirmation | `payment_transactions`. | Blocks M3 | Yes | No | Aligns financial-event terminology. |
| D17 | Manual payment evidence | Proposed default | Append-only review input with required transfer/reference number; evidence alone never approves payment or access. | Blocks M3 | Yes | No | Approval remains manual, backend-mediated, and audited. |
| D18 | Refund/access relationship | Proposed default | Refund is financial state; access effects use a separate backend policy/command. | Blocks M3 | Yes | No | Preserves separation between finance and authorization. |
| D20 | Device replacement policy | Pending owner confirmation | Versioned policy, append-only events, and reasoned admin override; exact counts remain configurable. | Blocks M4 policy tables | Yes, structurally | No | Owner may finalize structure while leaving numeric limits to policy. |
| D22 | Concurrent usage/risk events | Proposed default | Record concurrency as a risk signal/event, not automatic proof; enforcement is policy-driven. | Blocks M4 security/risk tables | Yes | No | Signals inform but do not replace authorization decisions. |
| D23 | Full-view/video limit meaning | Pending owner confirmation | Policy/risk/accounting metric only; exact count configurable by policy/resource/brand. | Affects M5 media/playback policy | Yes, structurally | No | Owner may finalize meaning while leaving numeric thresholds configurable. |
| D24 | Media authorization retention | Pending owner confirmation | Append-only authorization decisions; detailed retention/anonymization policy later. | Blocks M5 | Yes, structurally | No | Preserve traceability without prematurely fixing retention periods. |
| D26 | Assessment attempt lifecycle | Pending owner confirmation | `in_progress`, `submitted`, `graded`, `under_review`, `invalidated`. | Blocks M6 | Yes | No | Lifecycle controls scoring, review, retakes, and audit. |
| D27 | Quiz vs scheduled exam model | Proposed default | Shared assessment core with source/type distinguishing lesson quiz and scheduled exam. | Blocks M6 | Yes | No | Avoids parallel assessment systems. |
| D28 | Assessment availability and release relationship | Proposed default | Require availability, resource/release eligibility, active brand-scoped grant, and backend evaluation. | Blocks M6 | Yes | No | Identity or commercial state alone is insufficient. |
| D29 | Audit/evidence retention | Pending owner confirmation | Append-only history with no destructive rewrite; detailed retention/anonymization policy later. | Blocks M4+ evidence design | Yes, structurally | No | Finalize history integrity separately from exact retention periods. |
| D30 | Evidence brand scope | Proposed default | `brand_id` required for brand activity; nullable only for explicitly global system events. | Blocks M4 | Yes | No | Evidence must retain target-brand context. |
| D31 | Organization ownership representation | Deferred | Defer organization-owned commerce; use simple `owner_user_id`/owner metadata where needed initially. | Does not block M1 unless multi-owner scope is introduced | Later | Yes | Current early scope does not require organization ownership. |
| D32 | Admin role assignment scope | Proposed default | Brand-scoped admin role assignments for v1. | Blocks M1/admin foundations | Yes | No | Permissions must not silently cross Medway/Elite. |
| D33 | Admin command evidence model | Proposed default | Append-only actor, target, brand, reason, idempotency, result, timestamp, and metadata. | Blocks admin command persistence/M4+ evidence | Yes | No | Required for backend-mediated, auditable commands. |
| D34 | Content hierarchy canonical levels | Pending owner confirmation | Flexible Program/Track → Academic Year → Semester → Module/Subject → Chapter → Lesson hierarchy with optional levels. | Blocks M2 | Yes | No | Avoids hard-coding only Course → Lesson. |
| D35 | Resource type union | Proposed default | `video`, `document`, `quiz`, `link`, `file`. | Blocks M2/M5/M6 | Yes | No | Matches current learning-resource architecture. |
| D36 | Seed data strategy | Proposed default | Minimal Medway/Elite seed only after schema/migrations are drafted and reviewed. | Blocks M8 | Later | Yes | No seed should precede approved decisions and migrations. |
| D37 | Migration execution policy | Finalized | SQL authoring, migration review, staging application, and production application remain separate phases. | Blocks all migrations if bypassed | Already finalized | No | Verification item only; Prompt 29 does not reopen it. |

## 5. Recommended decisions to finalize next

### A. Recommended to finalize before M1

- **D03 — Legacy terminology migration:** approve `brand_id`/`brand_code` for new schema work and keep `platform_id`/`platform_code` only as deliberate compatibility documentation/aliases.
- **D06 — Student profiles:** use brand-scoped `student_profiles` linked to global `app_users`; each profile belongs to exactly one `brand_id`. Academic year/term, university, student ID, progress context, and eligibility may differ per educational brand. Recommended status after approval: **Finalized**.
- **D07 — Admin profiles:** use brand-scoped `admin_profiles` for v1; add any future global admin through explicit scoped assignments. This is the safer initial Medway/Elite isolation model. Recommended status after approval: **Finalized**.
- **D10 — App schema exposure:** keep the app schema private/backend-mediated initially, with no direct Supabase/Data API exposure for sensitive app tables. Recommended status after approval: **Finalized**.
- **D32 — Admin role assignments:** make assignments brand-scoped for v1 so permissions cannot silently cross Medway/Elite. Recommended status after approval: **Finalized**.
- **D37 — Migration execution:** verify the already-Finalized rule that SQL authoring, review, staging application, and production application remain separate explicit phases.

### B. Recommended to finalize before M2

- **D34 — Content hierarchy:** use a flexible hierarchy compatible with Program/Track → Academic Year → Semester → Module/Subject → Chapter → Lesson. Permit optional levels where a brand/course does not need them; do not hard-code only Course → Lesson. Recommended status after approval: **Finalized**.
- **D35 — Resource types:** use `video`, `document`, `quiz`, `link`, and `file`. Recommended status after approval: **Finalized**.

### C. Recommended to finalize before M3

- **D11 — Enrollment:** retain it as participation/progress evidence only, never authorization.
- **D12 — Access grants:** use explicit brand-scoped `access_grants` as an authorization input; final access still requires backend policy evaluation.
- **D13 — Commercial naming:** keep products, offers, plans, and prices separate.
- **D14 — Seat limits:** store a versioned plan/subscription policy snapshot and enforce capacity using active seat-assignment count.
- **D15 — Seat ownership:** keep the subscription owner separate from seat members; each member has independent auth, progress, devices, quiz results, and certificates.
- **D16 — Transactions:** use `payment_transactions`.
- **D17 — Manual evidence:** keep it append-only, require the transfer/reference number for review, and never treat evidence alone as approval or access.
- **D18 — Refund/access:** keep refund as financial state and apply access changes only through an explicit backend-mediated policy/command.

Recommended status for D11–D18 after explicit owner approval: **Finalized**.

### D. Recommended to finalize before M4

- **D20 — Device replacement:** use a versioned replacement policy, append-only replacement/event evidence, and an admin override reason. Exact replacement counts remain configurable. Recommended status after approval: **Finalized**, or structurally finalized with counts explicitly left pending.
- **D22 — Concurrent usage:** record it as a risk signal/event, not automatic proof; enforcement remains policy-driven. Recommended status after approval: **Finalized**.
- **D29 — Audit/evidence retention:** preserve append-only records and forbid destructive history rewrite; define exact retention/anonymization later. Recommended status after approval: **Finalized** for the structural rule.
- **D30 — Evidence brand scope:** require `brand_id` for brand activity and permit null only for explicitly global system events. Recommended status after approval: **Finalized**.
- **D33 — Admin command evidence:** include actor, target, brand, reason, idempotency, result, timestamp, and metadata. Recommended status after approval: **Finalized**.

### E. Recommended to finalize before M5

- **D23 — Full-view/video meaning:** treat view count as a policy/risk/accounting metric, not direct access authority. Keep the exact numeric count configurable by policy/resource/brand. Recommended status after approval: **Finalized**, or structurally finalized with the numeric limit explicitly left pending.
- **D24 — Media authorization retention:** keep authorization decisions append-only and set detailed retention/anonymization through later policy. Recommended status after approval: **Finalized** for the structural rule.
- **D25 — Protected media URLs:** already **Finalized**; permanent public provider URLs remain forbidden.

### F. Recommended to finalize before M6

- **D26 — Attempt lifecycle:** use `in_progress`, `submitted`, `graded`, `under_review`, and `invalidated`.
- **D27 — Assessment model:** use one shared assessment core, with source/type distinguishing lesson quizzes from scheduled exams.
- **D28 — Attempt eligibility:** require assessment availability, resource/release eligibility, an active brand-scoped `access_grant`, and backend policy evaluation.

Recommended status for D26–D28 after explicit owner approval: **Finalized**.

### G. Recommended to defer

- **D08 — Global/super admin:** defer. When introduced, require explicit global assignment/policy that still produces target-brand decisions; never use nullable brand as a bypass.
- **D31 — Organization ownership:** defer organization-owned commerce/group ownership. Early migrations should use simple `owner_user_id` or owner metadata only where needed.
- **D36 — Seed data:** defer minimal Medway/Elite seed until schema decisions are finalized and migrations are drafted and reviewed.

## 6. M1 readiness review

M1 cannot start until these unresolved decisions are owner-confirmed:

- D03 — legacy platform terminology migration naming/compatibility plan;
- D06 — student profile scope;
- D07 — admin profile scope;
- D10 — app schema exposure model; and
- D32 — admin role assignment scope.

D37 must also remain verified as Finalized and must not be bypassed. Prompt 28 already finalized D01, D04, D05, and D09, reducing the M1 blocker set, but Prompt 29 does not approve M1 SQL or migrations.

Resolving D06, D07, D10, and D32 while merely verifying D37 is not sufficient: D03 must also be owner-confirmed before M1 begins.

## 7. Owner questions for next confirmation

Answer each question **Yes** or **No** in the next owner-confirmation phase. A recommendation is not approval.

- **Q01:** Approve brand-scoped `student_profiles` linked to global `app_users`?
- **Q02:** Approve brand-scoped `admin_profiles` for v1?
- **Q03:** Approve a private/backend-mediated app schema initially, with no Supabase/Data API exposure unless RLS and exposure approval exist?
- **Q04:** Approve brand-scoped admin role assignments for v1?
- **Q05:** Approve the flexible Program/Track → Academic Year → Semester → Module/Subject → Chapter → Lesson hierarchy, with optional levels?
- **Q06:** Approve resource types `video`, `document`, `quiz`, `link`, and `file`?
- **Q07:** Approve enrollment as participation/progress evidence only, never authorization?
- **Q08:** Approve explicit brand-scoped `access_grants` as an authorization input?
- **Q09:** Approve separate products, offers, plans, and prices?
- **Q10:** Approve versioned plan/subscription policy snapshots and active seat-assignment count?
- **Q11:** Approve the subscription owner being separate from independent seat members?
- **Q12:** Approve `payment_transactions` naming?
- **Q13:** Approve manual payment evidence as append-only review input, not automatic approval?
- **Q14:** Approve refund/access separation?
- **Q15:** Approve a versioned device replacement policy with append-only evidence and an admin override reason?
- **Q16:** Approve concurrent usage as a risk signal/event, not automatic proof by itself?
- **Q17:** Approve full-view/video count as a policy/risk/accounting metric, not direct access authority?
- **Q18:** Approve append-only media authorization decisions with detailed retention/anonymization policy later?
- **Q19:** Approve assessment attempt lifecycle `in_progress`, `submitted`, `graded`, `under_review`, `invalidated`?
- **Q20:** Approve a shared assessment core for lesson quizzes and scheduled exams?
- **Q21:** Approve assessment attempts requiring availability, release/resource eligibility, an access grant, and backend evaluation?
- **Q22:** Approve append-only audit/evidence with detailed retention/anonymization policy later?
- **Q23:** Approve evidence brand scope: `brand_id` required for brand activity and nullable only for explicitly global system events?
- **Q24:** Approve admin command evidence containing actor, target, brand, reason, idempotency, result, timestamp, and metadata?
- **Q25:** Approve deferring global/super admin to a later explicit global assignment/policy?
- **Q26:** Approve deferring organization ownership and starting with simple `owner_user_id`/owner metadata where needed?

### Additional required D03 confirmation

Approve the D03 migration naming/compatibility plan: new schema work uses `brand_id` and `brand_code`, while legacy `platform_id` and `platform_code` remain deliberate compatibility documentation/aliases only? This confirmation is required in addition to the numbered checklist before M1 can begin.

## 8. Do-not-start-SQL gate

> **Do not start M1 SQL or migrations until every M1 blocker is finalized, including D03. Do not expose any app table through Supabase/Data API without RLS and explicit exposure approval. Do not apply migrations to staging or production without separate explicit phase approval.**

Prompt 29 is review documentation only. It does not authorize SQL authoring, migration creation, migration application, provider integration, staging work, production work, push, or deployment.

## 9. Next phase recommendation

### Prompt 30 — Owner Confirmation Batch for Remaining Schema Decisions

The owner answers the complete numbered checklist plus the separate D03 confirmation. The decision register is then updated only for explicitly approved answers. Prompt 30 remains documentation-only with no SQL or migrations.

If the owner explicitly approves all recommended defaults in this review, Prompt 30 may convert those approved decisions into finalized register updates. M1 migration planning remains a separate later phase.

## 10. Prompt 30 outcome

The owner approved the Prompt 29 recommended defaults. D03, D06, D07, D10, D11–D18, D20, D22–D24, D26–D30, and D32–D35 are Finalized; D08, D31, and D36 are Deferred. Numeric policy values remain configurable. The next phase is Prompt 31 — M1 Migration Draft Plan; this confirmation does not authorize SQL or migration application.
