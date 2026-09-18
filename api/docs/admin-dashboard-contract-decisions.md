# Admin Dashboard Contract Decisions

## 1. Purpose

This document freezes canonical naming and contract decisions for the future Admin Dashboard API, read models, and command contracts.

These are documentation and design decisions only. They do not create database changes, create or apply migrations, create SQL, implement runtime behavior, add API routes, connect Supabase, connect payment providers, connect storage/CDN/media providers, or modify the frontend.

Existing backend domain types may temporarily differ from these canonical contract names until later explicit refactor commits. Adapters may translate existing internal representations into the canonical admin-contract representations. Admin UI labels, future TypeScript DTOs, frontend admin API contracts, mock adapters, and backend admin modules must use the canonical names defined here going forward.

The decisions preserve the architecture invariants already established by the schema, ERD, authorization/RLS, authentication/session/device, commercial/access, learning-content, protected-media, and assessment documents:

- Every request resolves exactly one active platform, `medway` or `elite`.
- Backend authorization is authoritative; frontend visibility and local state are not authorization.
- Payment, subscription, seat assignment, enrollment, session, device state, and media visibility are distinct from explicit access authorization.
- Access requires backend evaluation of an active platform-scoped grant, eligible source, session/device state, release state, and resource policy.
- Audit, security, admin-action, access-decision, transaction, playback, attempt, answer, and evidence records are append-only.

## 2. Decision Status Legend

| Status | Meaning |
|---|---|
| **Accepted for v1** | The name or contract shape is canonical for future admin contracts and should be used by new DTOs, read models, command contracts, and admin labels. |
| **Temporary alias** | An existing internal name may remain temporarily and must be translated at the admin-contract boundary. New admin contracts should not introduce it as the primary name. |
| **Pending implementation** | The contract decision is accepted, but runtime/domain/persistence support is incomplete. Implementations must expose the gap rather than silently approximating it. |
| **Deferred** | The decision is intentionally left for a later architecture or policy decision and must not be invented by an implementer. |
| **Deprecated** | The term is no longer canonical for new admin contracts and should not appear in new user-facing labels. |
| **Compatibility-only** | The term may be recognized at an internal adapter or legacy boundary but must not be the primary admin-contract field or label. |

## 3. Canonical Naming Table

| Area | Existing variants | Canonical admin-contract name | Internal aliases allowed? | Status | Notes |
|---|---|---|---|---|---|
| Payment transaction table/concept | `payment_transactions`, `transactions` | `payment_transactions` | `transactions` may remain internal temporarily | Accepted for v1; `transactions` temporary alias | Admin labels use “Payment transactions”. |
| Payment transaction type | `Transaction` | `PaymentTransaction` | `Transaction` may remain internal temporarily | Accepted for v1; `Transaction` temporary alias | The type name must make financial context explicit. |
| Organization identity | `organization_id`, `organizationReference` | `organizationId` inside `AdminCommercialOwner` | `organizationReference` | Accepted for v1; compatibility-only | Admin contracts must not expose an ambiguous reference as the primary owner field. |
| Policy relationship | `policy_set_id`, `policyReferences` | `primaryPolicySetId`, typed `policySnapshot`, typed `policyReferences` | Existing `policyReferences` may be mapped | Accepted for v1 | A single governing policy uses `primaryPolicySetId`; future multi-policy display remains typed. |
| Commercial owner | `owner_user_id` / `organization_id`, `ownerUserId` / `organizationReference` | `AdminCommercialOwner` / `owner` | Existing fields may be mapped by adapters | Accepted for v1 | Exactly one discriminated owner variant is valid. |
| Lesson resource type | `video`, `document`, `quiz`, `link`, `file`; current `download` | `AdminLessonResourceType` | `download` may map to `file` internally | Accepted for v1; `download` deprecated | Resource subtype must match specialized asset metadata. |
| Generic resource subtype | `file`, `download` | `file` | `download` | Deprecated; compatibility-only | `download` describes an action or legacy type, not the canonical resource kind. |
| Access grant entity | `access_grants`, grant/evaluator terminology | `access_grants`, `AdminAccessGrantSummary` | Generic “grant” may be used in internal prose | Accepted for v1 | Read models must distinguish grants from entitlement evaluation and access decisions. |
| Release entity | `content_releases`, release rules, manual overrides | `AdminReleaseRuleSummary` mapped from `content_releases` | `content_releases` remains persistence terminology | Accepted for v1 | Manual overrides are separate auditable actions. |
| Protected delivery authorization | `protected_content_authorizations` | `protected_content_authorizations`, `ProtectedContentAuthorizationSummary` | Short “protected authorization” only in internal prose | Accepted for v1 | It is issued only after the full protected-access evaluation. |
| Watermark evidence | `watermark_payloads` | `watermark_payloads`, `WatermarkPayloadSummary` | Short “watermark payload” in internal prose | Accepted for v1 | Only minimum-necessary, redacted metadata is contract-visible. |
| Attempt result state | `graded`, `scored` | `scored` | `graded` maps to `scored` | Accepted for v1; `graded` temporary alias | Admin labels use “Scored”. |
| Question response type | `free_text`, `short_answer` | Both are distinct `AdminQuestionType` values | No silent alias | Accepted for v1 | `short_answer` is not automatically equivalent to `free_text`. |
| Enrollment on attempt | Required `enrollmentId` in current domain; optional by policy in assessment architecture | `enrollmentId?: EntityId | null` in admin contracts | Current required field may remain internally | Accepted for v1; pending implementation | Null enrollment requires other authorization/policy context. |
| Grant scope | Current evaluator supports lesson/asset; docs list seven scopes | `AdminGrantScopeType` with full documented union | Unsupported evaluator scopes may remain internally | Accepted for v1; pending implementation | Backend must reject unsupported scope execution. |

## 4. Decision 1 — Payment Transactions Naming

### Current conflict

- `postgres-schema-v1.md` uses `payment_transactions`.
- `payments-refunds-architecture.md` uses `payment_transactions`.
- `subscription-seats-access-architecture.md` references `payment_transactions`.
- `erd-v1.md` uses `transactions`.
- `api/src/domain/commercial.ts` defines `Transaction`.

### Decision

- The canonical admin-contract type name is `PaymentTransaction`.
- The canonical table/read-model concept is `payment_transactions`.
- `Transaction` may remain as an internal temporary domain alias until a later explicit refactor.
- Frontend/admin labels must say “Payment transactions”, not generic “Transactions”, where ambiguity is possible.
- A payment transaction is append-only financial evidence. It does not confirm access, activate a subscription, issue a grant, or replace an access decision.
- No implementation rename is performed in this documentation task.

**Status:** Accepted for v1, with `Transaction` as a temporary alias.

## 5. Decision 2 — Organization Identity and Ownership

### Current conflict

- The schema and ERD use `organization_id`.
- Current domain types use `organizationReference` in orders, subscriptions, and memberships.
- Orders and subscriptions require exactly one owner.

### Decision

Admin contracts must expose an explicit owner object:

```ts
owner: {
  type: "user" | "organization";
  id: EntityId;
  displayName: string;
}
```

For the more specific subscription contract, use `AdminCommercialOwner` as defined in Section 7.

- Later persistence mapping maps the user variant to `owner_user_id` and the organization variant to `organization_id`.
- Exactly one owner variant is valid.
- `organizationReference` may remain as an internal compatibility-only field until persistence and domain refactors are finalized.
- No admin contract should expose ambiguous `organizationReference` as the primary owner field.
- An organization membership or organization-admin relationship does not itself grant learning access.

**Status:** Accepted for v1; `organizationReference` is compatibility-only.

## 6. Decision 3 — Policy Set References

### Current conflict

- The schema uses `policy_set_id` on policy-governed records such as plans and refunds.
- The current `Plan` domain type uses an array of `policyReferences`.
- The architecture documents state that prices, limits, timing, eligibility, device rules, playback rules, refund rules, seat capacity, and assessment behavior are versioned policy decisions rather than hard-coded constants.

### Decision

Admin contracts expose the following shape where policy information is relevant:

```ts
primaryPolicySetId?: EntityId;
policySnapshot?: AdminPolicySnapshotSummary;
policyReferences?: AdminPolicyReference[];
```

- `primaryPolicySetId` is used when one policy set governs the record or command.
- `policySnapshot` is a redacted, immutable summary of the policy version evaluated or captured by the record.
- `policyReferences` is allowed only as a typed collection for future multi-policy display or records that genuinely use multiple policy references.
- Admin UI and frontend contracts must not hard-code price limits, device counts, view counts, refund windows, seat counts, concurrency limits, attempt limits, timer values, or pass marks.
- The policy reference is not a permission by itself; the backend must validate effective dates, lifecycle, and authority.

**Status:** Accepted for v1.

## 7. Decision 4 — Subscription Owner Representation

### Current conflict

- The schema and architecture require `owner_user_id XOR organization_id`.
- Current domain types contain `ownerUserId` plus `organizationReference`.

### Decision

Admin contracts use:

```ts
type AdminCommercialOwner =
  | { type: "user"; userId: EntityId; displayName: string }
  | { type: "organization"; organizationId: EntityId; displayName: string };
```

- Exactly one owner variant is valid.
- Individual subscriptions are user-owned.
- Duo subscriptions are user-owned; the purchaser occupies one named seat and another real platform user may occupy another seat.
- Group subscriptions are organization-owned.
- Seat members are not subscription owners unless explicitly represented by the owner model.
- Seat assignment, enrollment, and access grants remain separate records from subscription ownership.

**Status:** Accepted for v1.

## 8. Decision 5 — Lesson Resource Types

### Current conflict

- The schema and learning-content documents define `video`, `document`, `quiz`, `link`, and `file`.
- `api/src/domain/learning.ts` currently defines `video`, `document`, `link`, and `download`.
- `quiz` and `file` are absent from the current domain union.
- `download` is not the canonical documented resource value.

### Decision

The canonical admin contract type is:

```ts
type AdminLessonResourceType =
  | "video"
  | "document"
  | "quiz"
  | "link"
  | "file";
```

- `download` is deprecated as an admin-facing term.
- Existing internal `download` values may be mapped to `file` in admin read models until the domain is explicitly refactored.
- Admin UI must never label a quiz resource as a generic link or file.
- Only `video` resources may have `video_assets` metadata.
- Only `document` resources may have `document_assets` metadata.
- Resource subtype/type correspondence remains a backend validation rule.

**Status:** Accepted for v1; `download` is deprecated and remains a temporary internal compatibility alias.

## 9. Decision 6 — Question Types

### Current state

The current domain supports:

- `single_choice`
- `multiple_choice`
- `true_false`
- `free_text`

The assessment architecture expects a future controlled model that can support single choice, multiple choice, true/false, short answer, matching, ordering, numeric, clinical scenario, and free-text/manual-review responses.

### Decision

The canonical admin contract type is:

```ts
type AdminQuestionType =
  | "single_choice"
  | "multiple_choice"
  | "true_false"
  | "short_answer"
  | "matching"
  | "ordering"
  | "numeric"
  | "clinical_scenario"
  | "free_text";
```

Implementation status:

- **Active/partially represented now:** `single_choice`, `multiple_choice`, `true_false`, `free_text`.
- **Future/placeholder:** `short_answer`, `matching`, `ordering`, `numeric`, `clinical_scenario`.
- Admin UI may display future types as disabled or unavailable until the backend authoring, evaluation, review, and versioning support exists.
- Existing `free_text` remains valid.
- `short_answer` is not automatically the same as `free_text`; answer normalization, scoring, and review semantics require a later policy/engine decision.
- Correct answers, scoring keys, private rationales, and reviewer notes remain protected authoring data.

**Status:** Accepted for v1 contract, with partial implementation pending.

## 10. Decision 7 — Attempt Lifecycle

### Current conflict

The current domain supports:

- `in_progress`
- `submitted`
- `graded`
- `invalidated`

The assessment architecture describes:

- `created`
- `started`
- `in_progress`
- `submitted`
- `expired`
- `awaiting_review`
- `scored`
- `moderated`
- `invalidated`
- `cancelled`

### Decision

The canonical admin contract type is:

```ts
type AdminAttemptStatus =
  | "created"
  | "started"
  | "in_progress"
  | "submitted"
  | "expired"
  | "awaiting_review"
  | "scored"
  | "moderated"
  | "invalidated"
  | "cancelled";
```

- Existing `graded` maps to `scored` in admin read models.
- Admin UI labels use “Scored”, not “Graded”, except when showing raw legacy state in a developer/debug view.
- Attempt lifecycle transitions remain backend-policy controlled.
- The frontend must not decide whether an attempt may be started, resumed, submitted, expired, invalidated, moderated, or released.
- Historical attempts, answers, scores, and review evidence remain preserved.

**Status:** Accepted for v1; `graded` is a temporary compatibility alias.

## 11. Decision 8 — Attempt Enrollment Optionality

### Current conflict

- The current domain `Attempt` requires `enrollmentId`.
- The assessment architecture says enrollment may be required only where participation context or policy requires it.
- Some scheduled assessments may not be tied to a lesson enrollment.

### Decision

Admin attempt contracts use:

```ts
enrollmentId?: EntityId | null;
```

When `enrollmentId` is null, the attempt must still include, directly or through a safe reference:

- `platformId`.
- `studentUserId`.
- `assessmentId`.
- Authorization context or an appropriate policy snapshot summary.
- The assessment/version and lifecycle context required to interpret the attempt.

Enrollment is participation context only. Admin contracts must not imply that enrollment grants attempt access or protected content access.

**Status:** Accepted for v1 contract; runtime/domain implementation pending.

## 12. Decision 9 — Access Grant Scope

### Current state

- The current protected-content evaluator visibly supports lesson and asset scope checks.
- The schema and access architecture document the broader scopes product, package, program, subject, lesson, resource, and asset.

### Decision

The canonical admin contract type is:

```ts
type AdminGrantScopeType =
  | "product"
  | "package"
  | "program"
  | "subject"
  | "lesson"
  | "resource"
  | "asset";
```

- Admin contracts expose the full documented scope union.
- Current evaluator support beyond lesson/asset is pending.
- Admin UI may label unsupported scopes as “contract-defined / evaluator pending” until runtime support exists.
- The backend must reject unsupported scope execution rather than silently issuing a grant with incomplete evaluation.
- Grant source, recipient, scope, validity, revocation, policy snapshot, and platform must remain explicit.

**Status:** Accepted for v1 contract; evaluator support is partially pending.

## 13. Decision 10 — Protected Content Evaluation Completeness

### Current state

The existing domain validates some platform equality and access conditions. The full architecture requires evaluation of:

- Trusted platform context.
- Authenticated subject.
- Active platform-scoped app user.
- Active app session.
- Device state where required.
- Eligible subscription/seat/promotion/exception source.
- Explicit active `access_grant`.
- Content release and availability window.
- Resource and delivery policy.
- Concurrency, view, download, and other policy controls.
- Append-only access-decision evidence.
- Short-lived protected authorization only after allow.

### Decision

- Admin contracts and UI models represent the full documented pipeline, even where current runtime/domain support is incomplete.
- Existing runtime/domain support must be treated as incomplete until each required evaluation is implemented and tested.
- UI must not show “authorized” solely because a grant, subscription, device, session, enrollment, or payment exists.
- Access-decision read models must expose backend-evaluated reason codes and safe platform, release, source, resource-policy, and authorization context.
- No permanent MP4, PDF, document, file, signed URL, bearer token, or raw storage reference may be returned by an admin contract.
- `protected_content_authorizations` represent evaluated delivery authorization, not a durable entitlement.

**Status:** Accepted for v1; runtime completeness pending.

## 14. Decision 11 — Release Rules Naming

### Current conflict

The documents use `content_releases` for current platform-calendar availability and describe a future generalized release-rule model with manual overrides and evidence.

### Decision

Admin read models use `AdminReleaseRuleSummary`, which may map to current `content_releases` records.

The canonical release mode is:

```ts
type AdminReleaseMode =
  | "immediate"
  | "absolute_calendar"
  | "relative_to_entitlement"
  | "manual";
```

- `content_releases` remains the current persistence/documentation concept until a later schema decision.
- A release rule includes platform, target scope, mode, effective window/timezone where applicable, lifecycle, and policy/version references.
- Manual overrides are separate auditable actions or records conceptually.
- A manual override must not silently overwrite the original release rule.
- A valid grant does not bypass a release window.

**Status:** Accepted for v1.

## 15. Decision 12 — Payment Evidence Naming

### Current conflict

The payment documents refer to future `payment_evidence`, manual-payment submissions, secure evidence pointers, and evidence/reference data.

### Decision

Admin read models use:

```ts
AdminPaymentEvidenceSummary
```

- Evidence storage is private and backend-mediated.
- Evidence previews are redacted/reference-only unless a later backend design provides a safe short-lived viewing authorization.
- Evidence submission does not confirm payment.
- Evidence acceptance supports a finance decision but does not itself activate a subscription or issue an access grant.
- Raw payment instruments, credentials, provider payloads, public evidence URLs, and unrestricted evidence files are never returned.

**Status:** Accepted for v1; physical schema is pending.

## 16. Decision 13 — Admin Command Metadata

All sensitive admin command contracts must include or receive through trusted request context:

- **Platform context** — exactly one active platform, resolved by the backend.
- **`reason`** — required for sensitive state changes, overrides, revocations, exceptions, refunds, incidents, invalidations, and governance changes.
- **`correlationId`** — required for tracing the command across domain, audit, security, access, payment, playback, and future provider boundaries.
- **`idempotencyKey`** — required where mutation or retry risk exists, especially for finance, access, security, publication, incident, role, and policy commands.
- **Policy reference** — `policySetId`, `primaryPolicySetId`, or a policy snapshot reference where the operation is policy-governed.
- **`expectedVersion`** — optional optimistic/concurrency validation input where supported.
- **Target summary** — optional safe target context useful for confirmation and audit display; it is not authority.

Sensitive commands include:

- Suspend/restore student.
- Revoke sessions or devices.
- Review/reconcile payment.
- Decide/process refund.
- Apply refund access effect.
- Issue/revoke/suspend grant.
- Approve/reject seat assignment or replacement.
- Publish/withdraw content.
- Override release.
- Register/update/withdraw asset metadata.
- Revoke playback session.
- Open/apply media incident action.
- Publish/withdraw assessment.
- Invalidate attempt.
- Assign/revoke role.
- Update policy placeholder.

Every consequential command validates permission, platform, target relationship, lifecycle, policy version, reason, and idempotency/correlation metadata before mutation. Every consequential command appends the appropriate immutable audit, admin-action, security, access-decision, payment, playback, or assessment evidence.

**Status:** Accepted for v1.

## 17. Canonical Type Summary

The following TypeScript-like definitions are contract documentation only. They do not modify `api/src/domain/*` and do not constitute runtime DTOs yet.

```ts
type AdminPlatformCode = "medway" | "elite";

type AdminCommercialOwner =
  | { type: "user"; userId: EntityId; displayName: string }
  | { type: "organization"; organizationId: EntityId; displayName: string };

type AdminLessonResourceType =
  | "video"
  | "document"
  | "quiz"
  | "link"
  | "file";

type AdminGrantSourceType =
  | "subscription"
  | "seat"
  | "promotion"
  | "admin_exception";

type AdminGrantScopeType =
  | "product"
  | "package"
  | "program"
  | "subject"
  | "lesson"
  | "resource"
  | "asset";

type AdminQuestionType =
  | "single_choice"
  | "multiple_choice"
  | "true_false"
  | "short_answer"
  | "matching"
  | "ordering"
  | "numeric"
  | "clinical_scenario"
  | "free_text";

type AdminAttemptStatus =
  | "created"
  | "started"
  | "in_progress"
  | "submitted"
  | "expired"
  | "awaiting_review"
  | "scored"
  | "moderated"
  | "invalidated"
  | "cancelled";

type AdminReleaseMode =
  | "immediate"
  | "absolute_calendar"
  | "relative_to_entitlement"
  | "manual";

type AdminDocumentDeliveryMode =
  | "view_only"
  | "download_allowed"
  | "watermarked_view"
  | "watermarked_download";
```

Additional named contract summaries referenced by this document include:

```ts
type AdminPolicyReference = {
  policySetId: EntityId;
  policyVersion: number;
  policyKey: string;
};

type AdminPolicySnapshotSummary = {
  policySetId: EntityId;
  policyVersion: number;
  effectiveFrom: Instant;
  effectiveTo: Instant | null;
  status: string;
};

type AdminReleaseRuleSummary = {
  platformId: EntityId;
  targetId: EntityId;
  releaseMode: AdminReleaseMode;
  availableFrom: Instant | null;
  availableUntil: Instant | null;
  timezone: string | null;
  policySnapshot?: AdminPolicySnapshotSummary;
};

type AdminPaymentEvidenceSummary = {
  platformId: EntityId;
  paymentId: EntityId;
  status: string;
  claimedAmount: number | null;
  currency: string | null;
  submittedAt: Instant | null;
  redactedReference: string | null;
};
```

These summaries are intentionally redacted and are not direct database row shapes.

## 18. Compatibility Notes for Existing Domain Types

No domain source type is refactored in this task.

- Adapters may use canonical admin-contract names while translating existing internal names.
- Existing `Transaction` maps to canonical `PaymentTransaction`.
- Existing `organizationReference` maps to the organization variant of `AdminCommercialOwner` when the reference can be safely resolved within the active platform.
- Existing `Plan.policyReferences` maps to `primaryPolicySetId`, `policySnapshot`, and/or typed `policyReferences` according to the eventual record semantics.
- Existing `download` maps to canonical resource type `file` in admin read models until the domain is explicitly refactored.
- Existing `graded` maps to canonical attempt status `scored` in admin read models.
- Existing required `Attempt.enrollmentId` remains an internal-domain constraint until a later explicit contract/domain refactor supports policy-optional enrollment.
- Existing `LessonResource.resourceType` does not currently include `quiz` or `file`; admin contract adapters must not fabricate unsupported runtime behavior. They may expose capability/pending status until the domain supports those values.
- Existing grant evaluator scope is partial. The canonical admin union is broader than currently executable evaluation and must not be presented as fully supported.
- Existing protected-content evaluation is incomplete relative to the full documented pipeline. Admin read models must show backend-evaluated status and reason context, not infer authorization from a single record.
- Existing `AccessGrant.sourceType` currently has a narrower union than the canonical admin source contract. Promotion and administrative-exception support must remain pending until runtime/domain support is added.
- Existing `LessonResource` uses `download` while protected document delivery separately distinguishes view/download policy. A resource type and a delivery mode must not be conflated.

## 19. Implementation Guardrails

- Do not generate frontend Admin UI until this decision document is treated as the canonical contract baseline.
- Do not generate admin API TypeScript contracts until these names and statuses are confirmed as the source terminology.
- Do not create migrations or SQL based on these names yet.
- Do not refactor all domain files as part of this documentation task.
- Do not expose deprecated aliases in user-facing admin labels.
- Do not hide pending runtime gaps. A contract-defined value that the evaluator or domain cannot execute must be explicitly marked pending or rejected by the backend.
- Do not let the frontend make permission, platform, lifecycle, policy, access, scoring, timing, or delivery decisions.
- Do not put admin business logic in `web/src`.
- Do not treat payment confirmation, subscription state, seat assignment, enrollment, device state, session state, playback state, or media URL visibility as access authorization.
- Do not expose permanent public MP4/PDF/file URLs, raw storage references, access tokens, provider secrets, raw device fingerprints, OTP values, private payment evidence, answer keys, or unrestricted reviewer notes.
- Preserve Medway and Elite isolation in every future DTO, query key, adapter, repository interface, command context, read model, and audit record.
- RLS remains defense-in-depth and must not replace backend workflow validation.
- Append-only evidence must be corrected through new governed records rather than rewritten or deleted.

## 20. Follow-up Refactor Candidates

The following are separate future commits and are not part of this documentation change:

1. Rename or explicitly alias `Transaction` to `PaymentTransaction` in backend domain types.
2. Replace `organizationReference` with a platform-safe organization identity and owner representation where persistence requires it.
3. Replace the internal `download` resource type with canonical `file`.
4. Add `quiz` and `file` support to the domain resource model.
5. Map or rename `graded` to `scored` in attempt domain contracts.
6. Expand the attempt lifecycle and validate all permitted transitions.
7. Make attempt enrollment optional where assessment policy permits it.
8. Expand access-grant evaluator support from lesson/asset to the full canonical scope union.
9. Implement and test the full protected-content decision pipeline.
10. Add the future physical `payment_evidence` model after schema decisions are approved.
11. Add the future generalized release-rule model and separate manual-override evidence.
12. Define shared admin DTO/read-model shapes and command-result envelopes using this canonical terminology.

