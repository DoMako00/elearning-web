# Postgres/Supabase Schema Alignment Review

## Phase header

- **Phase:** 26
- **Scope:** Documentation, review, schema-alignment analysis, and migration-readiness planning only
- **Server impact:** None
- **Commit rule:** Local commit only after validation passes
- **Push rule:** Do not push
- **Deploy rule:** No deploy

## 1. Purpose

This review aligns the current logical PostgreSQL/Supabase schema and architecture documents before any real persistence work begins. It identifies stable concepts, legacy terminology, brand-scoped records, cross-brand integrity requirements, and the work that a later migration phase must perform.

The product is one application platform. Medway and Elite are educational brands inside it; brand scope is the isolation boundary. This review does not create or alter a physical schema.

## 2. Non-goals

This phase does not implement SQL, migrations, Supabase SDK usage, Postgres clients or queries, authentication, OTP, RLS policies, payments, media/storage providers, runtime changes, or deployment changes.

## 3. Source document inventory

| Source document | Primary schema/domain ownership |
| --- | --- |
| `postgres-schema-v1.md` | Legacy logical Postgres/Supabase tables, keys, constraints, and migration order |
| `erd-v1.md` | Legacy logical entity relationships and table inventory |
| `authorization-rls-strategy.md` | Backend authority model and future RLS posture |
| `auth-otp-session-device-flow.md` | Auth identity, app accounts, OTP, devices, and sessions |
| `subscription-seats-access-architecture.md` | Commercial ownership, seats, grants, and access separation |
| `payments-refunds-architecture.md` | Orders, payments, transactions, evidence, refunds, and access effects |
| `learning-content-hierarchy.md` | Learning hierarchy, release timing, and resource ownership |
| `protected-media-architecture.md` | Private asset policy, authorization, playback, and watermarking |
| `quiz-assessment-architecture.md` | Quizzes, assessments, availability, attempts, and evidence |
| `admin-dashboard-backend.md` | Admin read models, commands, permissions, and evidence |
| `platform-brand-scope-correction.md` | Canonical brand terminology and compatibility rules |
| `persistence-auth-integration-boundary.md` | Provider-neutral persistence/auth boundaries and access invariants |
| `persistence-auth-implementation-plan.md` | Staged implementation, validation, and deployment-control plan |

## 4. Stable architectural invariants

- There is one application platform.
- Medway and Elite are isolated brand scopes, not separate technical platforms.
- Authentication identity is not application authorization.
- Payment, subscription, enrollment, seat, device, and session state are not access by themselves.
- Protected access requires backend evaluation and an active brand-scoped `access_grant`.
- Frontend route guards are presentation only; backend policy is authoritative.
- Protected media must not expose permanent public provider URLs.
- Audit and evidence records are append-only.
- RLS is defense-in-depth and does not replace backend request context, policy, lifecycle, reason, idempotency, or evidence validation.

## 5. Terminology alignment review

| Legacy/current term | Canonical future term | Phase 26 treatment |
| --- | --- | --- |
| `platforms` | `brands` | Recommend `brands` for new schema work; retain legacy draft wording |
| `platform_id` | `brand_id` | New migrations should use `brand_id` |
| `platform_code` | `brand_code` | New migrations should use `brand_code` |
| platform scope | brand scope | Brand scope is the Medway/Elite isolation boundary |
| `AdminPlatform*` | `AdminBrand*` | Prefer brand names in new contracts; preserve compatibility aliases |
| `platform_mismatch` | `brand_mismatch` / `target_brand_mismatch` | Prefer brand errors in new boundaries |
| `platform-medway` | `brand-medway` | Legacy compatibility alias only |
| `platform-elite` | `brand-elite` | Legacy compatibility alias only |

Existing docs and code may retain platform-named compatibility fields while callers migrate deliberately. This phase neither removes aliases nor creates duplicate physical scope columns.

## 6. Canonical schema direction

Future persistence should group logical records behind provider-neutral repositories and use canonical brand names.

| Group | Future concepts |
| --- | --- |
| Identity and auth | Supabase `auth.users` as external identity source; app users; brand memberships; student/admin profiles; sessions; devices |
| Brand | brands; brand configuration; brand catalog scope; brand admin scope |
| Learning | programs/tracks; academic years; semesters; subjects/modules; chapters; lessons; resources; releases; resource policies |
| Commerce and access | products/offers/packages/plans/prices; orders; payments; transactions; refunds; subscriptions; seats; enrollments; access grants |
| Security and evidence | device/session events; suspicious activity; risk signals; access decisions; audit/evidence log |
| Media | media/document assets; protected-media policies; watermark policies; authorization decisions; playback events |
| Assessment | quizzes; assessments; questions; options/answers; attempts; scores; availability |
| Admin | admin profiles; roles; permissions; brand-scoped role assignments; command evidence; read models |

`auth.users` remains global provider identity. The recommended app direction is one global application user linked to that identity plus explicit brand memberships. Student and admin profiles, commercial data, content, grants, evidence, and other operational records remain brand-scoped.

## 7. Brand scope requirement matrix

| Entity/table concept | Requires `brand_id`? | Reason | Cross-brand risk if omitted | Notes |
| --- | --- | --- | --- | --- |
| Provider `auth.users` | No | Provider identity is global | Identity would be incorrectly treated as authorization | Supabase-owned table |
| App users | No | Global application identity can join more than one brand | Duplicate/ambiguous user identity | Link through `brand_memberships` |
| Student profiles | Yes | Academic identity and membership are brand-specific | Medway profile could appear in Elite | One profile per user/brand as needed |
| Admin profiles | Yes | Admin authority is brand-scoped in v1 | Cross-brand administration | Future global authority requires an explicit decision |
| Brand memberships | Yes | Explicit user-to-brand relationship | Unscoped membership grants access broadly | Membership is not an access grant |
| Content nodes/courses | Yes | Catalog and curriculum isolation | Content leaks between brands | Include hierarchy joins |
| Lesson resources | Yes | Resource ownership and policy isolation | Cross-brand protected resource access | Match parent lesson brand |
| Release schedules | Yes | Brand calendar and availability | Release bypass across brands | Match lesson/resource brand |
| Resource policies | Yes | Delivery and access policy scope | Policy applied to another brand asset | Versioned policy references |
| Orders/payments/transactions/refunds | Yes | Brand offers and financial context | Finance records could activate another brand | Financial state is not access |
| Subscriptions/seats/enrollments | Yes | Commercial and participation scope | Subscription/seat reused cross-brand | Enrollment remains participation only |
| Access grants | Yes | Explicit authorization input | A grant unlocks another brand | Match recipient and resource scope |
| Devices/sessions | Yes for v1 | Request context and operational evidence | Session/device reused cross-brand | A physical device may have separate brand records |
| Playback/media events | Yes | Protected delivery evidence | Media authorization crosses brands | Do not store permanent URLs |
| Quizzes/assessments/attempts | Yes | Assessment availability and evidence | Attempt/assessment mismatch | Match learner and resource context |
| Audit/evidence | Required when applicable | Actor/target/decision traceability | Cross-brand audit blind spot | Null only for explicitly global system events |
| Admin role assignments | Yes | Permission scope | Elite role affects Medway | Global role requires explicit future policy |

## 8. Cross-brand integrity rules

Future relational design must use composite brand-safe foreign keys, equivalent unique constraints, or explicit application/database enforcement wherever cross-brand references could occur.

- A child record carrying `brand_id` must reference a parent with the same `brand_id`.
- Content resources, releases, policies, lessons, chapters, modules, and subjects must share one brand.
- Orders, payments, transactions, refunds, subscriptions, seats, and grants must preserve one brand through every relationship.
- `access_grants` must match the recipient user membership, brand, source, and protected resource scope.
- A subscription, seat, payment, refund, or enrollment must not silently authorize another brand.
- Admin target brand must equal active admin brand unless a later explicit global policy produces a scoped decision.
- Assessment attempts must match the assessment, resource, user access context, and availability brand.
- Evidence must retain the applicable brand for actor, target, decision, and correlation analysis.

## 9. Supabase Auth and RLS alignment

Supabase `auth.users` may later own low-level authentication identity. The application owns profiles, brand memberships, sessions/devices, subscriptions/seats, grants, and audit decisions. A JWT, session claim, or `auth.uid()` is only an input to the backend request-context factory; it is not direct proof of brand, resource, or admin authorization.

RLS may later use `auth.uid()` with controlled ownership and brand predicates. It remains defense-in-depth. Backend handlers still validate trusted context, permission, active and target brand, lifecycle, policy, reason, idempotency, and append-only evidence. RLS must not become a replacement for domain workflow state machines.

## 10. Access, payment, and refund alignment

`access_grant` is the explicit authorization input. Payment, subscription, seat, and enrollment are commercial or participation inputs to access evaluation, not sufficient authorization on their own.

Future commercial boundaries are `orders`, `payments`, `payment_transactions`, payment evidence, `refunds`, subscriptions, seats, and explicit grant issuance/revocation decisions. There must be no `is_paid` shortcut as protected-content authority. Manual approval is backend-mediated and audited; refunds change access only through an explicit commercial/access policy command and never through a frontend direct write.

## 11. Device and session alignment

Device identity is server-managed and must not use MAC or IMEI values. Future records need active/revoked state, replacement counts/reasons, session lifecycle, device/session events, and concurrency/risk signals. Device or session validity participates in access evaluation but never authorizes a resource alone.

## 12. Protected media alignment

Future media records include assets, document assets, delivery policies, watermark policies, authorization decisions, optional short-lived authorization records, playback sessions, and playback events. The application authorization output is never a permanent public storage URL. Provider-specific storage details remain behind infrastructure adapters.

## 13. Quiz and assessment alignment

The future schema distinguishes lesson quizzes from scheduled assessments, with question banks/items, options/answers, attempts, score/review evidence, and availability windows. Attempts and availability must match the brand/resource scope. Auth, enrollment, payment, subscription, session, and device state are individually insufficient for assessment access.

## 14. Admin alignment

Admin persistence requires brand-scoped profiles, roles, permissions, assignments, read models, command evidence, and audit trails. Read-only admin models may be persisted before commands. Command persistence must remain separately gated by permission, active/target brand validation, lifecycle/policy validation, reason, idempotency, and evidence.

## 15. Naming decisions before SQL

| Decision | Recommended default | Why | Blocks migration? | Needs owner confirmation? |
| --- | --- | --- | --- | --- |
| Brand table name | `brands` | Clear canonical business scope | Yes | Yes |
| Application user scope | Global app user plus memberships | One identity can join multiple brands without granting cross-brand access | Yes | Yes |
| Brand membership representation | Explicit `brand_memberships` lifecycle record | Separates identity from brand relationship | Yes | Yes |
| Future global admin scope | Explicit assignment/policy and target-brand decision | Avoids implicit nullable-brand bypass | No for v1 | Yes |
| Legacy `platform_id` mapping | New schema uses `brand_id`; aliases migrate deliberately | Prevents terminology drift | Yes | Yes |
| Enrollment | Optional participation record, not access | Preserves access-grant separation | Yes for related FKs | Yes |
| Subscription seat limits | Versioned plan/subscription policy plus active assignment count | Avoids hard-coded capacity | Yes | Yes |
| Device replacement | Versioned policy plus append-only replacement/event evidence | Supports risk and audit needs | No for identity foundation | Yes |
| Video full-view limit | Policy/risk accounting metric, not authorization authority | Prevents view counters becoming access control | No | Yes |
| Assessment lifecycle | `in_progress`, `submitted`, `graded`, `under_review`, `invalidated` pending final naming review | Aligns current domain and review needs | Yes | Yes |
| Media authorization retention | Append-only decisions with policy-controlled retention/anonymization | Supports traceability without permanent secrets | Yes | Yes |
| Audit/evidence retention | Append-only history with retention/anonymization policy | Preserves consequential history | Yes | Yes |
| Financial transaction table name | `payment_transactions` | Matches payment/admin architecture docs | Yes | Yes |
| Organization/multi-owner commercial ownership | Defer; require `owner_user_id` for initial orders/subscriptions | Early migrations must not assume multi-owner administration | No for early migrations; yes before organization-owned commerce | Yes |

## 16. Organization ownership boundary

Early migrations must not be blocked by unresolved organization ownership, organization billing delegation, or multi-owner commercial administration.

The recommended initial model requires one `owner_user_id` for orders and subscriptions. Individual and Duo-style subscriptions may proceed with user ownership and named seat assignments. Organization-owned subscriptions, organization memberships, organization-admin commercial authority, invitation/offboarding, group ownership, and organization-owned seat rules are deferred until the business confirms multi-owner/admin-commercial requirements.

Existing logical documents may retain organization scenarios as future scope. They are not prerequisites for M1–M4 or a future read-only admin overview adapter.

## 17. Proposed future migration phases

No SQL is authored in this review.

1. **M0:** Finalize terminology and migration-safe schema decisions.
2. **M1:** Create brands, auth linkage, global users, brand memberships, and brand-scoped profiles.
3. **M2:** Create learning/content hierarchy, releases, and resource policy.
4. **M3:** Create individual/Duo commerce foundations: plans, orders, payments, transactions, refunds, subscriptions, named seats, enrollments, and access grants.
5. **M4:** Create device/session/security/audit evidence.
6. **M5:** Create protected-media metadata and policies.
7. **M6:** Create quiz/assessment records.
8. **M7:** Add RLS policies and backend adapter/brand-isolation tests.
9. **M8:** Seed minimal Medway/Elite staging data.
10. **M9:** Connect a read-only admin overview adapter.
11. **Deferred organization phase:** After explicit confirmation, add organizations, memberships, billing/admin authority, group ownership, invitation/offboarding, and organization-owned seat rules through a separately reviewed migration plan.

SQL authoring, migration review, migration application, and any production migration each require separate explicit approval. Production migration is forbidden unless explicitly requested later.

## 18. Adapter readiness checklist

Before a real Postgres/Supabase adapter is written:

- repository interfaces and canonical request context exist;
- brand scope and naming decisions are finalized for the adapter's data group;
- migrations are drafted, reviewed, and have rollback notes;
- minimal Medway/Elite seed strategy is defined;
- RLS and backend policy responsibilities are aligned;
- mock/real output parity and brand-isolation tests exist;
- audit/evidence expectations are defined;
- staging environment configuration and secrets are prepared outside the repository.

Organization ownership is not a prerequisite unless the adapter or migration explicitly covers organization-owned commerce.

## 19. Risks and mitigations

| Risk | Mitigation |
| --- | --- |
| Accidental push deploys staging | Follow Deployment Control Policy; push to `dev` only intentionally |
| Platform/brand confusion | Use canonical brand terms for new work and retain aliases only for compatibility |
| `auth.uid()` over-trusted | Convert identity into backend request context before authorization |
| Payment or subscription treated as access | Require grant plus backend access evaluation |
| Weak cross-brand constraints | Use brand-safe relationship rules and isolation tests |
| Missing evidence | Append audit/admin/security/access evidence for consequential decisions |
| RLS replaces business policy | Keep command/query policy in backend handlers |
| Permanent media URL leakage | Issue only short-lived authorization after policy evaluation |
| Unsafe migration | Separate authoring, review, rollout, seed, and rollback phases |
| Provider SDK leaks into core | Keep providers inside infrastructure adapters |
| Schema drifts from contracts | Maintain adapter parity and contract tests |
| Mock runtime breaks | Preserve mock defaults and smoke/parity self-tests |

## 20. Recommended next phase

Proceed with **Prompt 27 — Schema Decision Register**. It should resolve the blocking naming, identity, membership, assessment, retention, and transaction decisions before SQL or migrations are written. It remains documentation-only unless a future task explicitly expands the scope.

See [Schema Decision Register](schema-decision-register.md) for the tracked decision register, owner-confirmation status, and migration blockers.

Prompt 28 owner review finalized D01, D04, D05, D09, D19, and D21. D01 is finalized as `educational_brands`, not `brands`; domain terminology remains brand scope with concise fields such as `brand_id`, `brand_code`, and `brand_memberships`. Manual payment reference verification is required before active brand membership and access activation.
