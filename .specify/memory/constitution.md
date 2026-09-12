<!--
Sync Impact Report
- Version change: 1.1.0 -> 1.2.0
- Modified principles:
  - I. Backend-Mediated Domain Authority -> 3. Backend Authority and Admin Commands
  - II. Private Schema and Provider-Neutral Core -> 6. Data and Database Principles
  - III. Brand Isolation and Identity Separation -> 1. Product and Brand Principles
  - IV. Admin, Staging, and Production Safety -> 9. Staging and Production Control
  - V. Evidence, Secrets, and Validation Gates -> 10. Secrets and 14. Testing and Validation Gates
- Added sections:
  - Shared Academic Curriculum and Commercial Availability
  - Critical Domain Separations
  - Authentication and Authorization
  - Admin M2 Current Verified Foundation
  - Error and Security Behavior
  - Frontend Principles
  - Protected Media and Access
  - SpecKit Workflow Rules
  - Documentation Discipline
  - Git and Commit Policy
  - Stop Conditions
  - Current Roadmap Intent
  - Ubuntu 24.04 Compatibility
- Removed sections:
  - None
- Follow-up TODOs:
  - None
-->
# Medway / Elite E-Learning Platform Constitution

## Core Principles

### 1. Product, Brand, and Curriculum Principles

This is a multi-brand medical e-learning platform for Badr University in Cairo School of
Medicine. Medway and Elite are independent student-facing brands under one technical platform.
They MUST have separate courses, instructors where applicable, pricing, subscriptions, access,
and student-facing availability. Shared ownership or instructors teaching across brands MUST be
represented through explicit brand-scoped relationships; cross-brand access is denied by default.

The BUC Medicine curriculum is a shared academic reference with the hierarchy Curriculum ->
Academic Levels -> Semesters -> Modules/Subjects. Curriculum existence MUST remain separate from
commercial availability: an academic level or module may exist without a brand course, and a
brand course is not an academic module. The canonical curriculum MUST retain Levels 1-5; current
availability is a data/configuration rule, not curriculum deletion or schema redesign:

- Elite currently offers Level 1 only.
- Medway currently offers Levels 1 and 2 only.

Backend publishing, pricing, enrollment, access, Admin filtering, and student Explore behavior
MUST enforce this availability. Unavailable combinations MUST not appear purchasable or
accessible; UI filtering alone is never enforcement. Expanding availability MUST be a reviewed
data/configuration change. Multi-university support MUST NOT be overbuilt without explicit scope.

### 2. Critical Domain Separations

The following distinctions MUST remain explicit and MUST NOT be collapsed for convenience:

- Auth identity != app user != student profile != Admin profile.
- Admin profile != role != permission.
- Instructor != user, Admin profile, or brand; global instructor != brand instructor != course
  instructor.
- Academic module != brand course; curriculum reference != commercial offering; brand
  availability != curriculum existence.
- Course != subscription != payment != access grant.
- Subscription != access grant; seat != shared credentials.
- Device != session != access.
- Video view != lesson completion.
- Registration != enrollment != protected-resource authorization.

### 3. Backend Authority and Admin Commands

All business and domain policy MUST be enforced in backend-owned services. The frontend MUST NOT
be the source of truth for Admin permissions, brand authority, course publishing, subscriptions,
payment/access conversion, device/session restrictions, protected media, brand availability,
audit evidence, enrollment, or access state.

Every Admin mutation MUST follow this sequence:

`HTTP request -> authentication -> trusted Admin context -> backend-derived brand scope ->
permission resolution -> input validation -> stateful policy check -> transaction-scoped
repository -> domain mutation -> app.admin_actions -> app.audit_logs -> one COMMIT or ROLLBACK`

Successful mutation and evidence MUST commit atomically. Best-effort audit after mutation is
prohibited. If evidence cannot commit, the mutation MUST NOT commit. M4 evidence records
successful committed mutations only; rejected, unauthorized, validation-failed, conflict,
replay, and rolled-back attempts are not successful M4 evidence. A separate rejected-attempt
evidence phase requires explicit design and approval.

### 4. Authentication and Authorization

Authentication identifies a user; authorization determines whether that identity may act as an
Admin for a brand with a permission. They MUST remain separate. Supabase JWT/JWKS verification
MAY authenticate only the Supabase identity. JWT claims MUST NOT grant Admin permissions, roles,
brand authority, `adminProfileId`, `adminUserId`, app access, content access, payment status, or
subscription status. Admin authorization MUST be resolved from persisted M1 data.

`AUTH_PROVIDER=mock` is permitted only for local/dev/test/controlled verification; it MUST be
deterministic, non-live, and incapable of granting production authority. `AUTH_PROVIDER=supabase`
MUST fail closed unless a reviewed verifier and valid configuration exist, MUST NOT fall back to
mock, MUST NOT require a service-role key for request authentication, and MUST NOT trust JWT
metadata for Admin permissions. Trusted Admin context MUST be backend-derived; client-supplied
identity, roles, permissions, memberships, brand authority, or profile IDs MUST be rejected or
ignored safely according to the route contract.

### 5. Brand Isolation

Every brand-scoped Admin operation MUST resolve exactly one active canonical `brandId` from
route/context resolution. Authority MUST NOT be inferred from a course, instructor, module, or
arbitrary body field. Medway data MUST NOT leak into Elite context, and Elite data MUST NOT leak
into Medway context. Cross-brand failures MUST be safe and MUST NOT reveal ownership. A global
instructor may serve multiple brands only through explicit `brand_instructors` relationships. A
brand course belongs to exactly one brand, and a course ID alone never implies brand authority.

### 6. Data and Database Principles

The private PostgreSQL application schema is `app` and MUST NOT be exposed through the Supabase
Data API by default. No schema exposure, grants, public privileges, RLS, policy, or Data API
change is allowed without explicit authorization in the current prompt. Server-side code MAY use
controlled direct PostgreSQL infrastructure adapters; core/domain code MUST remain provider-neutral.

Active migrations MUST NOT be created, applied, or modified without explicit authorization and a
schema review, apply plan, staging approval, and verification report. Draft migrations MUST be
clearly marked as drafts. Seeds require the same explicit authorization and MUST be deterministic,
documented, scoped, verified, and non-production unless approved. `admin_actions` and `audit_logs`
are append-only evidence records; normal feature flows MUST NOT update or delete them.

### 7. Provider-Neutral Architecture and Runtime Defaults

Core contracts MUST NOT directly depend on `pg` Pool/PoolClient, the Supabase SDK,
`process.env`, HTTP request objects, raw JWT claims, connection strings, or provider payloads.
Provider-specific code belongs in infrastructure adapters. Runtime composition MAY wire mock,
PostgreSQL, Supabase auth, read-model, and command providers, but invalid configuration MUST fail
closed and construction MUST NOT perform unexpected database mutation.

Checked-in defaults MUST remain safe, mock-backed, non-mutating, require no staging credentials,
and activate no live provider by default.

### 8. Admin M2 Current Verified Foundation

The following verified foundation MUST NOT regress:

- Transactional Admin M2 write executor, trusted Admin HTTP context, authenticated Admin M2
  routes, and staging permission catalogue exist.
- The staging verification identity is Medway-only.
- Full authenticated Admin M2 staging write verification succeeded with exactly 10 controlled
  successful HTTP mutations, 10 `app.admin_actions`, and 10 `app.audit_logs`.
- Replay, fingerprint mismatch, stale expectedVersion, lifecycle rejection, and Elite attempts
  created no duplicate mutation or evidence.
- HTTP PostgreSQL-backed read-after-write was verified.

The real Supabase JWT/JWKS auth adapter remains a later feature unless explicitly completed;
`AUTH_PROVIDER=supabase` MUST remain fail-closed until implemented and verified.

### 9. Staging and Production Control

Every staging mutation MUST be explicitly authorized and identify target project, environment,
database, exact mutation, SELECT-only preflight, transaction behavior, post-commit verification,
rollback/failure rule, documentation, and commit plan. It MUST be target-locked, credential/TLS
validated, controlled, and followed by sanitized verification. Production database access,
credentials, deployment, mutation, migration, seed, verification, and smoke tests are forbidden
without explicit authorization in the current prompt.

Supabase MCP MUST NOT be used unless explicitly requested and scoped. Push, deploy, Dokploy
triggers, and live staging/production activation require explicit authorization. A push is
deployment-adjacent because pushing `dev` may trigger deployment settings.

### 10. Secrets and Credentials

The repository MUST NOT contain secret-bearing `.env` files, database URLs or credentials, JWTs,
bearer or refresh tokens, service-role/anon keys, Supabase JWT secrets, certificate paths or
contents, private keys, payment secrets, storage secrets, or production configuration values.
Tests SHOULD generate private keys dynamically; unavoidable static keys MUST be test-only and
documented. Logs MUST NOT print tokens, Authorization headers, connection strings, passwords, JWT
payloads, secret-bearing provider traces, certificate contents, or cross-brand ownership details.

### 11. Error and Security Behavior

Invalid, missing, ambiguous, or unsupported security configuration MUST fail closed. There MUST be
no Supabase-to-mock auth fallback, permission-failure-to-allow fallback, or missing-brand-scope
fallback to global access. External errors MUST be sanitized and MUST NOT reveal tokens, JWT
claims, SQL/DB internals, provider traces, sensitive key IDs, cross-brand ownership, protected
media URLs, or payment secrets.

Admin write routes MUST use controlled idempotency where designed. Same key and fingerprint MUST
be replay-safe without duplicate mutation/evidence; same key with a different fingerprint MUST
return conflict without mutation or evidence.

### 12. Frontend Principles

The frontend MAY display, filter, guide, validate obvious input, and present brand-specific UX,
but MUST NOT be the only enforcement for permissions, brand availability, access, publishing,
payment/subscription conversion, or protected media. Admin UI writes MUST use authenticated
backend Admin command APIs; direct frontend Supabase table writes for Admin business operations
are prohibited.

Admin and student UI MUST reflect Elite Level 1 availability and Medway Levels 1-2 availability.
Unavailable levels MUST not appear as purchasable/offered content unless explicitly marked
unavailable or coming later.

### 13. Protected Media and Access

Payment confirmation MUST NOT directly equal access. The required conceptual chain is
`payment/order state -> commercial decision -> subscription/seat/access grant -> protected
resource authorization`. Protected media MUST NOT expose permanent public MP4/PDF URLs. Future
media access MUST use short-lived authorization, entitlement checks, device/session checks where
applicable, and dynamic watermarking where applicable.

### 14. Testing and Validation Gates

Before completion commits, relevant typecheck, build, selftests, HTTP/runtime smoke tests,
`git diff --check`, secret scan, and scope scan MUST pass. Dependency, Docker, runtime, or
container changes additionally require Compose parsing, no-cache image build, container startup,
health/readiness, and container smoke validation. Database changes require SELECT-only preflight,
controlled transaction, SELECT-only post-commit verification, schema/privacy regression checks,
and sanitized reporting. Frontend changes require web typecheck/build, visual/responsive checks
when UI-affecting, and proof that frontend code does not duplicate backend policy authority.

### 15. SpecKit Workflow Rules

Significant features MUST use SpecKit in this order: specify, plan, review, then tasks/implement
after approval. Specify MUST define the problem, scope, non-goals, requirements, acceptance and
failure behavior, security/data boundaries, tests, documentation, and open questions. Plan MUST
define architecture placement, files to inspect, dependencies, configuration, implementation,
errors, security, tests, scans, documentation, commit plan, and handoff. Specify and plan MUST
NOT implement runtime code. Implementation prompts MUST be narrow and reference approved
artifacts.

### 16. Documentation Discipline

Documentation MUST separate verified facts, product decisions, implementation plans,
staging-only fixtures, non-goals, deferred work, and open questions. Historical verification
reports MUST NOT be rewritten except to correct an explicit error. New documentation MUST contain
no secrets. Security/provider features MUST document configuration, fail-closed behavior,
unsupported modes, tests, and operational handoff.

### 17. Git and Commit Policy

`dev` is the active development branch and `production` is reserved for stable releases. Do not
modify `production` without explicit authorization. Force-pushes and shared-history rewrites are
prohibited. If `origin/dev` advances, integrate safely before implementation. Each commit SHOULD
represent one coherent feature, review, or verification unit. Do not mix frontend polish,
backend auth, seeds, migrations, and docs-only verification unless explicitly scoped together.
Do not push by default. If push is authorized, first report branch, divergence, commits to push,
and deployment implications.

### 18. Stop Conditions

Stop and report when source, schema, docs, or reports disagree; schema differs from assumptions;
`origin/dev` advances unexpectedly; unrelated dirty work exists; secrets would be required;
production access is needed; JWT claims would grant Admin authority; frontend would become policy
authority; unauthorized database mutation/migration is needed; validation fails; security would
fail open; or cross-brand leakage is discovered. Do not silently patch around these conditions.

### 19. Current Roadmap Intent

The preferred near-term order is:

- 57A: Supabase JWT/JWKS Authentication Adapter.
- 57B: Live Supabase Admin Auth Verification.
- 58: Admin M2 Frontend Integration.
- 59: Real Instructor and Course Onboarding.

Frontend focus is important after the auth boundary is planned, implemented, and verified, but
backend security boundaries MUST NOT be bypassed to accelerate UI work.

### 20. Final Principle

When in doubt: protect brand isolation, backend authority, audit integrity, and secrets; fail
closed; avoid scope creep; document the decision; and stop instead of guessing.

### 21. Ubuntu 24.04 Compatibility

All backend, deployment, Docker, script, and verification workflows MUST be compatible with
Ubuntu 24.04 LTS, including WSL2, Hostinger VPS, Linux containers, and CI-like shells. Runtime
code MUST NOT rely on PowerShell-only commands, Windows path separators or drive letters,
case-insensitive filesystems, CRLF behavior, Windows certificate stores, Windows services, or
Windows-only binaries. Ubuntu-compatible commands MUST be provided whenever commands are required.

Scripts SHOULD use Node.js for complex logic or bash-compatible shell syntax, quote paths safely,
and use POSIX-safe path handling. Node dependencies MUST match the approved Node version and
validate that requirement. Docker/Compose MUST represent Linux execution and be checked with
Compose config, no-cache build, startup, readiness, and smoke tests when changed. PostgreSQL,
Supabase, and TLS tooling MUST use explicit portable CA paths, preserve TLS verification, and
never use `NODE_TLS_REJECT_UNAUTHORIZED=0`.

Code MUST respect case-sensitive Linux paths, executable permissions, UTF-8 without unnecessary
BOM, and LF line endings. Environment configuration MUST use standard Linux process variables;
`.env.example` values must be Linux-compatible and no secret `.env` may be committed. Completion
of backend/runtime/deployment work MUST be possible with `npm ci`, typecheck, build,
`npm run smoke:runtime`, `docker compose config`, `docker build`, and container smoke. Every
SpecKit plan for backend, runtime, scripts, Docker, verification, or deployment MUST include an
Ubuntu 24.04 section covering commands, dependencies, paths, environment, Docker, gates, and
stop conditions. If implementation is not Ubuntu-compatible, stop unless the prompt explicitly
scopes a Windows-only local helper.

## Governance

This constitution supersedes conflicting local habits, undocumented shortcuts, and ad hoc
instructions. Every specification, plan, task list, implementation, review, and operation MUST
be checked against it.

Amendments require documented rationale, explicit review of impacts on backend authority, schema
privacy, provider neutrality, brand/curriculum isolation, identity separation, audit integrity,
operational safety, and Linux compatibility, followed by a semantic version update.

Versioning policy:

- MAJOR: removal or material redefinition of a principle or governance guarantee.
- MINOR: addition of a principle, section, mandatory control, or material expansion of guidance.
- PATCH: wording clarification that does not change governance meaning.

Compliance reviews MUST verify backend authority, no frontend policy bypass, canonical brand
scope, identity separations, private schema, fail-closed auth, atomic evidence, secret hygiene,
branch/scope discipline, validation gates, and Ubuntu compatibility. Any exception requires an
explicit written approval trail tied to the change or operation.

**Version**: 1.2.0 | **Ratified**: 2026-08-23 | **Last Amended**: 2026-08-24
