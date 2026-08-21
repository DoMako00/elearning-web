# Persistence/Auth Implementation Plan

## 1. Purpose

This document turns the persistence and authentication boundary into a safe staged implementation roadmap. It defines the order, interfaces, feature controls, validation gates, and deployment controls for introducing real infrastructure later without breaking the current admin contracts, mock runtime, brand isolation, backend-mediated authorization, or VPS/Dokploy staging stability.

Implementation in this phase is documentation-only. The roadmap assumes one application platform with Medway and Elite as brand scopes inside that platform.

## 2. Current baseline

- The API and frontend runtime are mock-only.
- The admin dashboard uses backend-shaped mock/read-model boundaries and compatibility contracts.
- API/Web Docker images, container smoke, Compose, and Dokploy mock staging have been validated.
- The API became healthy and the Web service started successfully in the known-good Dokploy deployment.
- No real database, Supabase, authentication, payment, media, storage, or notification providers exist.
- Dokploy is connected to `dev` with an **On Push** trigger; a push to `dev` may deploy to the VPS.
- The current deployment is mock staging, not production.

## 3. Non-goals

This plan does not implement:

- Supabase or any Supabase SDK;
- SQL, Postgres queries, schemas, or migrations;
- real authentication, OTP, sessions, or devices;
- real payment/refund/provider processing;
- protected media authorization or media delivery;
- storage, CDN, video, PDF, or notification providers;
- production secrets, domains, TLS, or production deployment.

## 4. Architectural invariants

- Authentication identity is not application authorization.
- Payment is not access.
- Subscription is not access.
- Enrollment is not access.
- Seat assignment is not access.
- Device state is not access.
- Session state is not access.
- Protected access requires backend evaluation and an active brand-scoped access grant.
- Frontend route guards and local permission state are presentation only.
- Backend authorization is the source of truth.
- Medway and Elite are brands inside one application platform, never separate technical platforms.
- Cross-brand reads, grants, admin targets, commercial records, content, and media authorization must fail explicitly.

## 5. Target folder architecture

Future boundaries may be introduced incrementally using a structure like:

```text
api/src/core/request-context/
api/src/core/brand-scope/
api/src/core/auth/
api/src/core/persistence/
api/src/core/access/
api/src/core/audit/

api/src/modules/admin/
api/src/modules/student/
api/src/modules/content/
api/src/modules/commercial/
api/src/modules/security/
api/src/modules/media/

api/src/infrastructure/supabase/
api/src/infrastructure/postgres/
api/src/infrastructure/auth/
api/src/infrastructure/storage/
api/src/infrastructure/payments/
```

- `core` owns interfaces, value types, policies, and provider-neutral decisions.
- `modules` own use cases and application orchestration.
- `infrastructure` owns provider clients, persistence mapping, retries, and adapter errors.
- Domain/core code must not import the Supabase SDK or depend on raw SQL.
- Mock and in-memory adapters remain available for local testing and staging safety.

## 6. Interface-first implementation sequence

Create interfaces before real provider adapters. Each interface must accept explicit request context and brand scope where applicable.

| Interface | Purpose | Future real adapter | Mock/in-memory parity | Before real Supabase? |
| --- | --- | --- | --- | --- |
| `AuthIdentityAdapter` | Validate provider identity and map it to an authenticated subject | Supabase Auth or approved provider adapter | Deterministic test identity adapter | Yes |
| `RequestContextFactory` | Build trusted internal request context from validated identity, brand, session, and device data | Backend auth/context middleware | Existing test-context helper plus deterministic mock factory | Yes |
| `BrandResolver` | Resolve exactly one active `BrandCode`/brand ID per request | Trusted host/path/request selector plus persisted brand repository | Medway/Elite fixture resolver | Yes |
| `AdminProfileRepository` | Load active admin profile, roles, permissions, and scope | Postgres/Supabase adapter | In-memory permission/profile map | Yes |
| `StudentProfileRepository` | Load student profile and lifecycle state | Postgres/Supabase adapter | In-memory student records | No, but required before student auth flows |
| `UserRepository` | Resolve app user from auth identity and brand | Postgres/Supabase adapter | In-memory user map | Yes |
| `SessionRepository` | Load, create, revoke, and validate sessions | Postgres/Supabase adapter | In-memory session store | Before real session support |
| `DeviceRepository` | Load registration, replacement, and revocation state | Postgres/Supabase adapter | In-memory device policy fixtures | Before real device support |
| `SubscriptionRepository` | Load commercial subscription lifecycle and policy snapshot | Postgres/Supabase adapter | In-memory subscription fixtures | Before subscription-backed access |
| `SeatRepository` | Load seat ownership, assignment, and replacement state | Postgres/Supabase adapter | In-memory seat fixtures | Before seat-backed access |
| `AccessGrantRepository` | Load active explicit grants, scopes, validity, source, and revocation | Postgres/Supabase adapter | In-memory grant evaluator/store | Yes for protected access |
| `ContentRepository` | Load brand-scoped content hierarchy, release state, and resource policy | Postgres/Supabase adapter | Existing backend read models/fixtures | Before real catalog reads |
| `PaymentRepository` | Load orders, payments, refunds, and commercial evidence | Postgres plus future payment adapter | In-memory/manual fixtures | Before commercial persistence |
| `AuditEvidenceWriter` | Append admin, security, access, payment, device, media, and assessment evidence | Postgres/event adapter | Existing in-memory evidence writer | Yes for sensitive commands |
| `ProtectedMediaAuthorizationRepository` | Evaluate media access and issue short-lived authorization metadata | Provider-neutral media authorization adapter | Safe denial/mock authorization result | Before real media delivery |

Parity means the mock adapter and future real adapter expose the same contract, typed outcomes, brand filtering, redaction expectations, and failure semantics. No real adapter should be enabled merely because its interface exists.

## 7. Request context plan

Future backend middleware should build a trusted context containing:

- `requestId`;
- `correlationId`;
- `actorAuthId`;
- `actorUserId`;
- `actorType`;
- `activeBrandCode`;
- `activeBrandId`, where applicable;
- `adminProfileId`, where applicable;
- `studentProfileId`, where applicable;
- `sessionId`;
- `deviceId`;
- `roles`;
- `permissions`;
- IP and user-agent metadata when available and safe to retain;
- `reason` for a sensitive admin command;
- `idempotencyKey` for a mutating command.

The frontend cannot create trusted context. Client-provided brand, user, role, permission, session, and device values are inputs for validation, not authority. Context is created by backend middleware and passed explicitly to every query, command, repository call, and authorization evaluation.

## 8. Brand-scope implementation plan

Canonical brand codes are:

- `medway`;
- `elite`.

Existing `platformId`, `platformCode`, `AdminPlatform*`, and target-platform fields are compatibility names for the same brand scope. New interfaces should prefer `brandId`, `brandCode`, `BrandCode`, and `BrandScope`; aliases remain until a deliberate contract/schema migration.

Resolution rules:

- Student requests resolve the trusted active brand before loading profile, grant, or resource data.
- Admin requests resolve the actor brand before resolving permissions or targets.
- Public catalog requests resolve the selected public brand through a server-approved selector.
- Media/resource requests compare request brand, resource brand, grant brand, and delivery policy.
- Payment/order requests use the persisted order brand and reject client attempts to change it.

Cross-brand behavior is an explicit typed failure. Admin target brand must equal the active brand unless a future, explicitly scoped global policy authorizes otherwise. Content, offers, subscriptions, seats, grants, payments, assessments, protected media, and evidence remain filtered by brand.

## 9. Admin read-model migration plan

Real persistence begins with read-only interfaces and output parity, not command writes.

### Phase A — Preserve mock overview

- Keep the current mock admin overview as the default.
- Add an `AdminOverviewReadModel` interface around the existing query contract.
- Add mock parity tests for Medway and Elite counts, evidence IDs, redaction, and brand isolation.
- Do not add a database dependency.

### Phase B — Add a real read adapter later

- Implement a Postgres/Supabase-backed read adapter behind the interface.
- Compare real output shape, correlation behavior, errors, filtering, and redaction with the mock contract.
- Add a future feature flag named `ADMIN_READ_MODEL_SOURCE=mock|postgres`.
- Default to `mock`; switching to `postgres` must be explicit and environment-controlled.

### Phase C — Staging rollout

- Validate the real read adapter locally and in isolated tests first.
- Review server impact as sensitive staging.
- Deploy to staging manually only after approval, rollback planning, and verification.
- Keep mock mode available until real adapter stability is demonstrated.

## 10. Admin command migration plan

Introduce commands one group at a time:

1. Student admin actions.
2. Device/session actions.
3. Payment/manual review actions.
4. Subscription/seat actions.
5. Access-grant actions.
6. Content schedule actions.
7. Security actions.

Every command group requires:

- permission validation;
- active brand validation;
- target brand and relationship validation;
- lifecycle validation;
- reason for sensitive actions;
- idempotency key;
- append-only audit/evidence write;
- rollback or compensation notes;
- typed failure behavior without leaking provider payloads.

Command persistence must follow read-model parity and must not be enabled for all groups at once.

## 11. Student access pipeline plan

Future protected access should be implemented in this order:

1. Authenticate the request.
2. Resolve the app user.
3. Resolve and validate the session.
4. Validate device policy.
5. Resolve the active brand.
6. Resolve the requested brand-scoped resource.
7. Validate release schedule and publication state.
8. Validate the active access grant.
9. Validate subscription/seat state when relevant to the grant source.
10. Validate resource policy.
11. Write the access decision.
12. Issue short-lived media/resource authorization when applicable.

This pipeline is not implemented in Prompt 22. It must not be bypassed by frontend routing, local state, payment callbacks, subscription UI, enrollment state, device state, or permanent media URLs.

## 12. Supabase positioning plan

Future Supabase responsibilities must remain separated:

- Supabase Auth may own low-level auth identity.
- Postgres may own persisted application state through repositories.
- Supabase Storage may be considered later, but protected media must remain backend-authorized.
- `auth.users` is not direct resource or admin authorization.
- JWT claims are validated inputs to the internal request context, not business authority.
- Core/domain code must not import Supabase SDK types or clients directly.

Provider mapping, errors, retries, transactions, and storage URL handling belong in infrastructure adapters.

## 13. Configuration and feature flags plan

Future environment/configuration names may include:

```text
AUTH_PROVIDER=mock|supabase
ADMIN_READ_MODEL_SOURCE=mock|postgres
ADMIN_COMMAND_SOURCE=mock|postgres
ACCESS_EVALUATOR_SOURCE=mock|postgres
MEDIA_AUTH_SOURCE=mock|provider
PAYMENT_PROVIDER=mock|manual|provider
```

These names are planning targets only and are not added to runtime in this phase. Every default remains `mock` until an explicitly approved phase changes it. Staging values must be configured manually and intentionally; no secrets belong in the repository.

## 14. Test and validation plan

### Documentation-only changes

```text
git status
git diff --check
```

### API/runtime changes

```text
cd api
npm run typecheck
npm run build
npm run smoke:runtime
```

### Web changes

```text
cd web
npm run typecheck
npm run build
```

### Docker/deployment changes

```text
cd ..
node deploy/scripts/container-smoke.mjs
docker compose -f deploy/dokploy/docker-compose.yml --env-file deploy/dokploy/.env.example config
```

### Future persistence/auth gates

- contract tests for every interface;
- mock versus real adapter shape comparison;
- Medway/Elite brand isolation tests;
- permission denial and target-brand mismatch tests;
- audit/evidence tests for success and failure;
- session/device policy tests;
- rollback and compensation notes for every mutating group.

## 15. Deployment control plan

- Do not push until validation passes.
- A push to `dev` may trigger Dokploy because the trigger is On Push.
- Database, authentication, provider, security, payment, and media phases are sensitive staging by default.
- Manual review and an explicit rollback plan are required before a sensitive staging push.
- Production work is forbidden unless explicitly requested through a later release task.
- No deployment is performed by this planning phase.

## 16. Future phases

| Phase | Work | Server impact | Push rule | Deploy rule |
| --- | --- | --- | --- | --- |
| 23 | Backend Repository Interfaces | local-only | Do not push until validation and approval | No deploy |
| 24 | Request Context Middleware Skeleton | local-only; staging only after explicit approval | Push only after validation and approval | No automatic deployment |
| 25 | Admin Overview Read Model Interface + Mock Parity | local-only | Do not push until validation and approval | No deploy unless explicitly approved |
| 26 | Postgres/Supabase Schema Alignment Review | none | Commit locally after docs validation | No deploy |
| 27 | First Real Read Adapter Design | sensitive staging | Manual approval required before push | Manual only |
| 28 | Migration Plan | sensitive staging | No push until migration plan is approved | No deploy until explicitly approved |

## 17. Risk register

| Risk | Mitigation |
| --- | --- |
| Accidental deployment from a push | Check server impact, validate, review branch, and approve push intentionally |
| Confusing brand and platform | Use `BrandCode`/`BrandScope`; retain platform names only as compatibility aliases |
| Trusting frontend brand/user values | Resolve identity and brand in backend context middleware |
| Direct Supabase SDK use in core | Keep provider clients inside infrastructure adapters |
| Payment treated as access | Require explicit brand-scoped grant and access decision |
| Missing audit evidence | Require append-only evidence for commands and consequential decisions |
| Media URL leakage | Issue only short-lived authorization after access evaluation |
| Cross-brand admin mutation | Validate active brand, target brand, and related records |
| Migration drift | Require a dedicated migration phase, review, backfill plan, and rollback |
| Breaking mock runtime | Keep mock defaults, fixtures, smoke tests, and adapter parity |
| Losing local testability | Run deterministic contract, isolation, permission, and evidence tests before staging |

## 18. Acceptance criteria before implementation

Runtime adapter implementation may begin only when:

- the deployment control and sensitive-staging rules are understood;
- repository and adapter interfaces are planned;
- trusted request context fields and construction are defined;
- canonical brand scope and compatibility mapping are documented;
- feature flags and safe mock defaults are named;
- mock adapters remain available;
- read-model parity is planned before command persistence;
- contract, isolation, permission, evidence, and rollback tests are identified;
- no migration is attempted before an explicit migration phase;
- the current mock runtime and VPS/Dokploy staging baseline remain stable.

## Prompt 23 status

Prompt 23 adds provider-neutral repository, authentication, request-context, brand-scope, evidence, and protected-media authorization interfaces under `api/src/core/`. It adds typed repository results/errors and lightweight branded ID aliases only; no provider integration, SQL, migrations, or persistence implementation was added. The mock runtime remains the default and existing in-memory admin fixtures remain unchanged. The next step is the request-context middleware skeleton or mock parity tests.

## Prompt 24 status

Prompt 24 adds the canonical provider-neutral request-context builder under `api/src/core/request-context/`, together with an in-memory brand resolver, mock authentication adapter, and deterministic user, admin-profile, student-profile, session, and device repositories. The builder verifies mock identity, resolves one brand scope, checks optional session/device ownership, and loads admin or student authority without evaluating resource access.

No real authentication, provider, database, SQL, migration, or persistence behavior was added. The current HTTP runtime still uses its existing compatibility `AdminRequestContext` and mock admin context; the new canonical context is exported for future adapters only. The next phase is Prompt 25 — Admin Overview Read Model Interface + Mock Parity.

## Prompt 25 status

Prompt 25 adds the formal `AdminOverviewReadModel` boundary under `api/src/modules/admin/read-models/`, plus an in-memory adapter and independently callable parity self-test. It preserves the current overview snapshot shape, validates one canonical Medway or Elite brand scope, and delegates to the existing mock overview provider.

No Postgres/Supabase adapter, feature-flag runtime selection, command persistence, or HTTP runtime wiring was added. The current HTTP overview route remains mock-backed and unchanged. A later phase may choose one of: mock-only runtime wiring behind a read-model source boundary, a Postgres/Supabase schema alignment review, or grouped admin command interfaces.

## Prompt 26 status

Prompt 26 adds the [Postgres/Supabase Schema Alignment Review](postgres-supabase-schema-alignment-review.md). It aligns future schema terminology and migration order around canonical brand scope, while preserving current platform-named compatibility references. No SQL, migration, provider code, or runtime behavior was added. The recommended next phase is Prompt 27 — Schema Decision Register.

## Prompt 27 status

The [Schema Decision Register](schema-decision-register.md) was created to track schema decisions, owner-confirmation items, and migration blockers. No SQL, migrations, provider code, or runtime behavior was added. The next phase is owner review of the pending decisions.

## Prompt 28 status

Prompt 28 records owner decisions: D01 is finalized as `educational_brands`; global `app_users` plus explicit `brand_memberships` are finalized; manual payment reference verification before brand activation is required; RLS before Supabase/Data API exposure is finalized; and brand-scoped devices/sessions for v1 are finalized. No SQL, migrations, provider code, or runtime behavior was added. Remaining pending decisions must be reviewed before an M1 migration draft.

## Prompt 29 status

Prompt 29 adds the [Remaining Schema Decisions Review](remaining-schema-decisions-review.md), preserving unresolved statuses while grouping recommended owner defaults and migration blockers. No SQL, migrations, provider code, or runtime behavior was added. An M1 migration draft remains blocked pending owner confirmation of D03, D06, D07, D10, and D32.

## Prompt 30 status

Prompt 30 records owner confirmation of the remaining schema defaults and resolves the M1 decision blockers. No SQL, migrations, provider code, or runtime behavior was added. The recommended next phase is Prompt 31 — M1 Migration Draft Plan; applying migrations remains forbidden until a later explicit phase.

## Prompt 31 status

The [M1 Migration Draft Plan](m1-migration-draft-plan.md) defines the first identity, educational-brand, global app-user, membership, profile, and admin role-assignment foundation. No SQL, migration files, provider code, or runtime behavior was added. A separate validated push checkpoint may be considered only after explicit approval; no push is part of Prompt 31.

## Prompt 32 status

Prompt 32 created the non-applied [M1 SQL draft](../db/migration-drafts/m1/README.md) and [M1 SQL Draft Review](m1-sql-draft-review.md). No provider integration, runtime adapter, database/Supabase connection, or migration application was added or performed. The next step should be a separate SQL review/fix phase, not migration application.

## Prompt 33 status

Prompt 33 completed the static [M1 SQL Draft Review Fixes](m1-sql-draft-review-fixes.md) without changing or applying the SQL draft. No provider/runtime adapter, database/Supabase connection, or migration application was added. Migration authoring/application still requires a later explicit phase.

## Prompt 34 status

The [Supabase Environment Boundary](supabase-environment-boundary.md) and Dokploy staging guide document names-only environment placeholders and secret handling. The runtime remains mock-backed; no Supabase adapter/provider, SQL application, database connection, or migration application was added. A later phase may plan staging migration application.

## Prompt 35 status

The [M1 Staging Migration Apply Plan](m1-staging-migration-apply-plan.md) defines the required future staging-only application gates for the reviewed M1 SQL draft. Runtime remains mock-backed and provider adapters remain pending; no SQL, database connection, migration application, or runtime integration was added. Prompt 36 requires explicit approval before staging mutation.

## Prompt 36 status

The M1 database foundation now exists in owner-confirmed Supabase staging ref `mgrsgibxuwgbxtdqprkw`; see the [M1 Staging Migration Apply Report](m1-staging-migration-apply-report.md). Provider and runtime adapters remain pending, and the current application continues to use mock sources. Production, seed, RLS/Data API exposure, push, and deployment remain separate work.

## Prompt 36B status

Staging DB foundation verification is hardened: the owner confirmed through the Supabase Dashboard that `app` is visible but unchecked and only `public` and `graphql_public` are exposed. Runtime remains mock-backed, no settings or grants changed, and the backend adapter boundary remains the next safe phase.

## Prompt 37 status

The [Supabase Adapter Boundary](supabase-adapter-boundary.md) adds configuration validation and a disabled-by-default provider skeleton only. `PERSISTENCE_PROVIDER=mock`, `AUTH_PROVIDER=mock`, and the existing mock runtime sources remain unchanged. No client, database connection, query, repository adapter, provider switch, or runtime integration was added.

## Prompt 38 status

The [Supabase M1 Read Repository Adapters](supabase-m1-read-repository-adapters.md) add unused, read-only M1 mapping adapters behind a fakeable parameterized `SELECT` transport contract. No driver, database connection, query execution, runtime wiring, provider switch, or entitlement behavior was added. Mock remains the active runtime source.
