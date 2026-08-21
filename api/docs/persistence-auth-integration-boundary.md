# Persistence and Auth Integration Boundary

## 1. Scope

This document defines the boundary for introducing real persistence and authentication into the e-learning application later. It is a design and sequencing document only. Its purpose is to preserve the existing admin contracts, brand-scope isolation, backend-mediated authorization, mock runtime, and future provider adapters while real infrastructure is added incrementally.

The concrete staged roadmap is documented in [Persistence/Auth Implementation Plan](persistence-auth-implementation-plan.md). This boundary document remains the provider-neutral architectural contract; the implementation plan defines sequencing, feature controls, validation gates, and deployment impact.

The application remains one platform. Medway and Elite are educational brands inside that platform. Brand scope is the isolation boundary for catalog, content, pricing, subscriptions, seats, access grants, admin visibility, protected media policy, and evidence.

## 2. Non-goals

This task does not implement or connect:

- Supabase or another authentication/database provider;
- Postgres queries, SQL, schemas, or migrations;
- real OTP delivery or verification;
- real login sessions or registered devices;
- real payments, refunds, or payment providers;
- real protected-media authorization or delivery;
- real file storage, CDN, video, or PDF providers;
- real notifications, queues, workers, or background jobs.

The current mock API, frontend mock mode, Dockerfiles, Compose draft, and runtime smoke behavior remain unchanged.

## 3. Core identities and separations

These concepts must remain separate even when they are related in a user journey:

| Concept | Meaning | Authorization role |
| --- | --- | --- |
| Auth identity | Low-level identity from an authentication system | Proves an authenticated subject only; never grants content or admin access by itself |
| App user | Application-owned account mapped to an auth identity and brand scope | Provides the business account context |
| Student profile | Application-owned learning profile for an app user | Supplies student-specific state; does not replace access evaluation |
| Admin profile | Application-owned administrative profile, roles, and permissions | Supplies backend-resolved admin authority within brand scope |
| Login session | Server-managed authenticated session and lifecycle state | Contributes session validity; is not sufficient for resource access |
| Registered device | Server-managed device registration and policy state | Contributes device policy evaluation; is not sufficient for access |
| Brand membership/scope | The app user's or admin's relationship to one brand | Defines the scope in which identity and permissions may operate |
| Subscription | Commercial lifecycle record for a plan and owner | Commercial evidence only; does not itself authorize a resource |
| Seat | Capacity/assignment record associated with a subscription or offer | Commercial entitlement capacity only; does not itself authorize a resource |
| Enrollment | Learning relationship between a user and a course/program | Learning state only; does not replace an explicit access grant |
| Access grant | Backend-owned explicit authorization grant with scope, source, validity, and policy state | Required input to protected resource authorization |
| Payment/order | Financial and commercial records | May change commercial state through backend workflows; does not directly authorize content |
| Resource authorization decision | Backend decision for a specific brand-scoped resource request | The result consumed by protected access/media delivery |

These invariants are mandatory:

- Auth identity alone never grants learning resource access.
- Payment alone never grants protected content access.
- Subscription alone never grants protected content access.
- Enrollment alone never grants protected content access.
- A seat alone never grants protected content access.
- A device or session alone never grants protected content access.
- Access requires backend evaluation and an active brand-scoped access grant.
- Frontend route guards and local permission visibility are presentation only.
- Backend authorization is the source of truth.

## 4. Brand scope resolution

Every backend request that operates on brand-scoped data must resolve exactly one active brand scope before protected data is loaded or a command is evaluated.

### Request categories

- **Student-facing requests:** resolve the trusted active brand, app user, student profile, session, device, and requested resource scope.
- **Admin-facing requests:** resolve the trusted active brand, app user, admin profile, roles, permissions, actor, and target relationship.
- **Public catalog requests:** resolve the requested public brand through a server-approved host/path/selector and filter all catalog records by that brand.
- **Media/resource requests:** resolve the brand associated with the resource and compare it with the trusted request context before issuing authorization.
- **Payment/order requests:** resolve the brand attached to the order and commercial relationship; do not accept a client-selected brand as an authority override.

Brand values supplied by a browser, URL, header, or frontend state are inputs or hints until the backend resolves and validates them. Production resolution must use trusted server-side context such as an approved host, route scope, request selector, or an authenticated relationship.

Cross-brand targeting must fail explicitly. Medway access must not unlock Elite resources, and Elite access must not unlock Medway resources. Admin operations must carry the actor, target, brand scope, reason where required, and idempotency key where required.

## 5. Future Supabase/Auth positioning

Supabase Auth may own low-level authentication identity in a future implementation. The application remains responsible for business authorization and owns or resolves:

- app user and profile records;
- brand memberships and active brand scope;
- admin profiles, roles, and permissions;
- sessions and registered devices;
- subscriptions, seats, enrollments, and access grants;
- payment/order state and commercial effects;
- audit, security, access-decision, and operational evidence.

`auth.users` must not be treated as direct authorization for learning resources or admin commands. JWT or session claims must be validated at the authentication boundary and converted into an internal request context. Editable frontend metadata and unverified claims are not authority.

The internal request context is the object consumed by admin/core policies and future access evaluation. Core/domain code must not depend on the shape of a Supabase response.

## 6. Application database boundary

Future persistence must sit behind repository and read-model interfaces. Provider-specific implementations belong in infrastructure/adapters; contracts and domain/core policy code remain provider-neutral.

Expected adapter boundaries include:

- auth identity adapter;
- user/profile repository;
- brand repository;
- admin profile/role repository;
- student read model;
- content hierarchy repository;
- subscription/seat repository;
- access grant repository;
- payment/order repository;
- device/session repository;
- append-only audit/evidence writer;
- protected media authorization repository.

Rules for the future implementation:

- Domain/core code must not import the Supabase SDK or execute raw SQL.
- Provider-specific mapping, retries, error translation, and transaction mechanics stay in adapters/infrastructure.
- Repositories must accept explicit brand scope where the data is brand-scoped.
- Read models must preserve current public contracts or provide deliberate versioned adapters.
- Mock and real adapters must be interchangeable at the module boundary.
- No provider response or secret should leak through an admin contract.

## 7. Canonical request context

Future backend middleware should create an internal request context containing the fields applicable to the request:

- `requestId`;
- `actorUserId`;
- `actorAuthId`;
- `actorType`;
- `activeBrandCode`;
- `activeBrandId`, where applicable;
- `adminProfileId`, where applicable;
- `studentProfileId`, where applicable;
- `sessionId`;
- `deviceId`;
- `permissions`;
- `roles`;
- IP and user-agent metadata when available and safe to retain;
- `correlationId`;
- `reason` for sensitive admin commands;
- `idempotencyKey` for mutating commands.

This context is created by backend middleware and trusted adapters. The frontend cannot create or authorize a trusted context. Every future command and protected query should receive context explicitly rather than reconstructing authority from request fragments.

Compatibility platform fields may remain temporarily in existing contracts, but new persistence/auth integration should prefer `brandId`, `brandCode`, `activeBrandId`, and `activeBrandCode` for Medway/Elite scope.

## 8. Admin authorization boundary

Admin permissions are resolved backend-side from the authenticated actor, the active brand, active admin profile, role assignments, and policy state. Frontend navigation and route visibility are not security controls.

Every admin command must validate, as applicable:

- required permission;
- exactly one active brand scope;
- target brand and target relationship;
- active admin profile and role lifecycle;
- domain lifecycle state;
- policy/version/effective-date rules;
- reason for sensitive actions;
- idempotency key for mutating commands;
- correlation metadata;
- append-only evidence/audit writes.

Global or super-admin roles may exist later, but they must still produce an explicit scoped decision and must not silently bypass brand or target checks. A global role is not permission to mix records without a deliberate policy decision.

## 9. Student protected-access boundary

The future protected-access pipeline should be introduced behind the current contracts in a staged manner:

1. Authenticate the request at the trusted boundary.
2. Resolve the application user.
3. Resolve and validate the active session.
4. Validate device policy where applicable.
5. Resolve exactly one active brand.
6. Resolve the requested brand-scoped resource.
7. Validate release schedule and publication state.
8. Validate the active access grant and its scope.
9. Validate subscription/seat relationships where relevant to the grant source.
10. Validate resource and delivery policy.
11. Write an access decision/evidence record where required.
12. Issue only short-lived resource authorization when applicable.

This pipeline is not implemented by this task. It must be added behind backend interfaces without moving authorization into the frontend or treating a commercial record as a grant.

## 10. Payment and access boundary

Orders, payments, transactions, refunds, and provider evidence are financial records. Payment confirmation may create or update commercial state through a backend workflow, but it does not directly authorize protected learning content.

Manual payment approval must be backend-mediated, brand-scoped, idempotent where mutating, and audited. A refund must produce an explicit access effect through access policy, such as grant suspension or revocation, while preserving the original financial and access history.

Frontend code must never write paid state, subscription state, or access state directly. The future flow is: commercial event -> backend policy evaluation -> explicit grant/access effect -> evidence.

## 11. Device and session boundary

Device identity and session validity are server-managed application concepts. The implementation must not rely on MAC addresses, IMEI values, or other unstable/hard-to-control hardware identifiers as the sole identity.

First-device registration, replacement, concurrent session limits, playback conflicts, revocation, and recovery are application policies. Device/session signals may contribute to a protected-access decision but are never sufficient alone.

Admin reset and revoke-device/session actions must be permission-checked, brand-scoped, reasoned where sensitive, idempotent where mutating, and audited. Raw fingerprints, tokens, OTPs, and secrets must not appear in logs or admin responses.

## 12. Protected media boundary

Storage and media provider URLs must never be exposed as permanent public links for protected assets. Every protected media request must pass through backend authorization for the requested brand, resource, grant, session, device, release state, and policy.

A future media adapter may issue short-lived authorization or signed delivery information only after the access pipeline succeeds. Provider URLs, storage keys, bearer tokens, and permanent public links remain infrastructure concerns and must not enter core/domain contracts.

Watermarking, session trace, and incident data must be policy-driven and brand-scoped. Browser screen capture cannot be perfectly prevented; the practical strategy is deterrence, traceability, revocation, and evidence.

## 13. Evidence and audit boundary

Future append-only evidence categories include:

- `admin_action`;
- `security_event`;
- `access_decision`;
- `payment_event`;
- `subscription_event`;
- `device_event`;
- `media_event`;
- `assessment_event`.

Evidence should carry actor, correlation, outcome, timestamp, target, and brand scope where applicable. Sensitive admin commands require a reason. Failed decisions should be recorded where operationally appropriate, without exposing secrets or raw provider payloads.

Evidence is not a mutable status cache. Historical records must not be deleted or overwritten to make a later state appear as if it always existed.

## 14. Future implementation sequence

### Phase 1 — Schema and terminology readiness

- Finalize the database/schema and migration plan from the existing architecture documents.
- Resolve platform-versus-brand naming decisions before physical schema work.
- Preserve compatibility aliases until callers can migrate safely.

### Phase 2 — Infrastructure boundaries

- Create explicit infrastructure and adapter folder boundaries.
- Define repository/read-model interfaces where missing.
- Add mock and in-memory adapter parity checks against current contracts.

### Phase 3 — Authentication context

- Add a future Supabase Auth or equivalent identity adapter.
- Convert provider identity/session data into the internal request context.
- Keep the mock runtime and deterministic test contexts available.

### Phase 4 — Admin read persistence

- Add Postgres-backed read-model adapters for admin overview first.
- Compare mock and real outputs against the same admin contracts.
- Preserve brand filtering and redaction before broader reads.

### Phase 5 — Admin command persistence

- Add one admin command group at a time.
- Persist lifecycle/idempotency outcomes.
- Require append-only admin/audit/security evidence for sensitive commands.

### Phase 6 — Student access and media

- Add the student protected-access pipeline.
- Add grant, subscription/seat, session/device, release, and resource policy evaluation.
- Add a protected-media authorization adapter only after access decisions are authoritative.

### Phase 7 — Commercial persistence

- Add payment/manual approval persistence.
- Keep payment, subscription, grant, and access decisions separate.
- Model refund effects through explicit access policy and evidence.

## 15. Risk register

| Risk | Mitigation |
| --- | --- |
| Medway/Elite are treated as separate technical platforms | Keep one application platform and make brand scope explicit in context, repositories, policies, cache keys, and evidence |
| Frontend brand or user values are trusted | Resolve and validate brand and identity on the backend |
| Payment is treated as access | Require an explicit backend access grant and resource decision |
| Subscription is treated as access | Evaluate subscription as a grant source, not as authorization itself |
| Access grants are bypassed | Make protected-resource authorization depend on active, brand-scoped grants |
| Permanent media URLs leak | Issue short-lived authorization only after backend access evaluation |
| Supabase SDK is imported in domain/core | Keep provider code in infrastructure adapters and use provider-neutral contracts |
| Audit trail is missing | Require evidence at command and consequential decision boundaries |
| Cross-brand admin actions are allowed | Validate active brand, target brand, and every related entity before execution |
| Unsafe migrations damage isolation | Review names, constraints, backfills, and rollback plans before any schema change |
| Mock/runtime testability is lost | Preserve mock adapters, self-tests, runtime smoke, and contract parity during integration |

## 16. Future acceptance criteria

Real persistence/auth integration is ready for staged rollout only when:

- every applicable request resolves a trusted internal context;
- every protected resource decision is backend-mediated;
- every admin command validates permission, active brand, target relationship, and policy/lifecycle state;
- every sensitive command writes append-only evidence;
- mock and real adapters satisfy the same contracts and boundary tests;
- Medway and Elite remain isolated by brand scope inside one application platform;
- frontend-only authorization is not relied upon;
- protected media does not expose permanent public URLs;
- core/domain code has no direct provider dependency;
- migration and rollback plans are reviewed before physical schema changes;
- the current mock runtime remains available as a safe development fallback until real integration is proven.

Until those checks are met, deployment remains mock-only and the current HTTP/container/Dokploy smoke tests must not be interpreted as proof of real persistence or authentication readiness.

## Canonical request-context implementation

The provider-neutral context contracts are now backed by an exported skeleton in `api/src/core/request-context/`, including `RequestContextBuilder`, `InMemoryRequestContextFactory`, and the independently callable request-context self-test. `api/src/core/brand-scope/` contains the canonical in-memory brand resolver. These files are contracts and deterministic test fixtures only; they are not a Supabase, database, or production authentication adapter. The current admin-core `AdminRequestContext` remains the compatibility context until a controlled migration is approved.
