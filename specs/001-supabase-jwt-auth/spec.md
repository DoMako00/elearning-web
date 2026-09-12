# Feature Specification: Supabase JWT/JWKS Authentication Adapter

**Feature Branch**: `dev`

**Created**: 2026-08-24

**Status**: Draft

**Input**: User description: "Prompt 57A — specify a provider-neutral Supabase JWT/JWKS authentication adapter for real Supabase Auth access tokens without implementing runtime code."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Authenticate a Supabase User Identity (Priority: P1)

As an authenticated Admin API caller, I need the backend to verify my Supabase access token and
resolve only my external user identity so that the existing M1 authorization flow can independently
decide whether I may act for the requested brand.

**Why this priority**: Real Supabase authentication is the missing boundary that blocks later
production-grade Admin session integration; authorization must remain persistence-derived.

**Independent Test**: Use a deterministic, locally generated asymmetric signing key and local JWKS
fixture to verify a token with the configured issuer, audience, time claims, and UUID subject. The
result contains only the provider-neutral identity contract and performs no network or database work.

**Acceptance Scenarios**:

1. **Given** Supabase authentication mode has complete valid configuration and a locally generated
   token is signed by a matching asymmetric JWKS key, **when** the token has the expected issuer,
   audience, valid time claims, and UUID subject, **then** authentication succeeds with a
   provider-neutral Supabase identity.
2. **Given** that verified identity, **when** an Admin request proceeds, **then** the existing Prompt
   54 resolver still derives app user, Admin profile, brand roles, and permissions from M1.
3. **Given** a valid identity with no matching M1 app user or Admin authority, **when** an Admin
   request proceeds, **then** access fails safely without creating authority from JWT claims.

---

### User Story 2 - Reject Invalid or Ambiguous Credentials (Priority: P1)

As a platform operator, I need malformed, invalid, expired, ambiguous, or incorrectly scoped tokens
to fail closed so that authentication cannot be bypassed or confused across transports or projects.

**Why this priority**: A permissive fallback or incomplete JWT validation would compromise every
Admin route that depends on the authentication boundary.

**Independent Test**: Run the deterministic negative matrix using local keys and fixtures and verify
that every invalid credential fails with a sanitized classification and no principal.

**Acceptance Scenarios**:

1. **Given** no Authorization header, malformed Bearer syntax, an empty token, or a token supplied
   only in query/body/cookie input, **when** authentication is attempted, **then** it is rejected.
2. **Given** duplicated Authorization values or an oversized token, **when** extraction occurs,
   **then** the request is rejected before JWT claims can be trusted.
3. **Given** a malformed, unsigned, expired, wrong-issuer, wrong-audience, unsupported-algorithm, or
   unknown-key token, **when** verification occurs, **then** authentication fails closed.
4. **Given** unavailable JWKS or invalid provider configuration, **when** authentication is selected,
   **then** the provider fails closed and never falls back to mock.

---

### User Story 3 - Keep Authentication Separate from Admin Authority (Priority: P1)

As the platform security owner, I need JWT role and metadata claims to be non-authoritative so that
Medway and Elite permissions remain derived from private, brand-scoped M1 records.

**Why this priority**: A valid identity token is not proof of Admin status, brand authority, or any
application-specific permission.

**Independent Test**: Verify locally signed tokens containing fabricated `role`, `app_metadata`,
`user_metadata`, and custom Admin-like claims, then prove that the returned principal contains no
authority and the existing M1 projection remains required.

**Acceptance Scenarios**:

1. **Given** a valid token containing Admin-like role or metadata claims, **when** authentication
   succeeds, **then** no Admin role, permission, brand, profile ID, or application access is granted.
2. **Given** a valid Supabase subject with a Medway Admin profile only, **when** an Elite-scoped
   request is made, **then** existing M1 authorization denies it without leaking ownership.
3. **Given** a valid identity but an inactive Admin profile or missing permission, **when** an Admin
   command is requested, **then** the existing authorization boundary denies the request.

---

### User Story 4 - Preserve Safe Runtime Modes and Handoff (Priority: P2)

As a maintainer, I need mock authentication to remain unchanged, Supabase mode to activate only with
valid non-secret verification configuration, and Prompt 57B to receive a documented live-verification
handoff without performing live work in Prompt 57A.

**Why this priority**: The feature must add a secure mode without changing safe defaults or repeating
the already verified Prompt 56 staging mutation path.

**Independent Test**: Validate configuration and behavior using deterministic no-network tests, then
review the required documentation for supported, unsupported, and deferred behavior.

**Acceptance Scenarios**:

1. **Given** `AUTH_PROVIDER=mock`, **when** the application composes, **then** existing deterministic
   behavior remains unchanged and no Supabase network call occurs.
2. **Given** `AUTH_PROVIDER=supabase` with complete valid configuration, **when** composition occurs,
   **then** a Supabase identity verifier can be selected without requiring a database URL, API key,
   service-role key, anon key, JWT secret, or staging project default.
3. **Given** Prompt 57A documentation, **when** Prompt 57B is planned, **then** it has explicit live
   verification prerequisites, safety boundaries, and no implied authorization to connect or mutate.

### Edge Cases

- Authorization header is absent, empty, contains multiple values, has incorrect casing/spacing, or
  contains extra authentication parameters.
- Token is syntactically valid but exceeds the configured bounded size.
- Token appears only in a query string, request body, or cookie.
- JWT is malformed, unsigned, truncated, has invalid encoding, or uses an unsupported algorithm.
- Signature is valid but issuer, audience, expiry, issued-at/not-before, or UUID subject is invalid.
- Audience is represented as a string or array and does not contain the configured expected value.
- `kid` is absent, unknown, or maps to no compatible asymmetric public key.
- JWKS is unavailable, times out, is malformed, contains no keys, or reflects a signing-key rotation.
- A shared-secret/HS256 project exposes no usable asymmetric JWKS key.
- JWT includes convincing Admin role, permission, profile, brand, or metadata claims.
- Authentication succeeds but the M1 app user, Admin profile, brand authority, active status, or
  permission is absent.
- Provider configuration contains a hardcoded staging/production project, invalid URL, unsupported
  scheme, unbounded timeout, or conflicting derived and explicit values.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: `AUTH_PROVIDER=mock` MUST retain its current deterministic behavior.
- **FR-002**: `AUTH_PROVIDER=supabase` with valid verifier configuration MUST select a Supabase
  authentication provider.
- **FR-003**: Missing, invalid, ambiguous, or unsupported Supabase verifier configuration MUST fail
  closed.
- **FR-004**: Supabase authentication MUST NOT fall back to mock authentication.
- **FR-005**: The HTTP boundary MUST accept exactly one Authorization header value.
- **FR-006**: The sole accepted credential format MUST be exactly `Bearer <token>` under the route's
  documented case and whitespace rules.
- **FR-007**: Missing, empty, malformed, duplicated, query, body, or cookie credentials MUST be
  rejected unless a future separately approved feature adds another transport.
- **FR-008**: Bearer token input MUST have a bounded maximum size; the plan MUST select and document
  the limit before implementation.
- **FR-009**: Supabase JWT signatures MUST be verified using the configured Supabase JWKS and an
  explicitly allowed asymmetric signing algorithm.
- **FR-010**: The verifier MUST validate the expected issuer.
- **FR-011**: The verifier MUST validate the expected audience, including valid string/array claim
  representation.
- **FR-012**: The verifier MUST validate expiry and applicable standard time claims using the chosen
  reviewed JWT verifier.
- **FR-013**: The verifier MUST reject a missing or non-UUID subject.
- **FR-014**: Unsigned, malformed, wrong-issuer, wrong-audience, expired, unsupported-algorithm,
  unknown-key, and incompatible-key tokens MUST be rejected.
- **FR-015**: Prompt 57A MUST support asymmetric JWKS verification only and MUST NOT verify
  HS256/shared-secret JWTs.
- **FR-016**: JWT verification MUST NOT require a service-role key, anon key, JWT secret, database
  URL, or database connection.
- **FR-017**: Successful verification MUST map the Supabase user UUID to the existing
  provider-neutral authentication identity contract.
- **FR-018**: The principal MUST contain only the existing minimum safe identity fields required by
  the core boundary: verified UUID identity/subject, provider identifier, verification time, and an
  optional non-authoritative email only if the existing contract retains it.
- **FR-019**: The principal and all logs/errors MUST exclude the raw token, full payload, request
  headers, refresh token, roles, permissions, metadata, provider secrets, and connection details.
- **FR-020**: JWT `role`, `app_metadata`, `user_metadata`, and custom claims MUST be ignored for Admin
  authorization.
- **FR-021**: Prompt 54's M1 projection MUST remain responsible for resolving
  `app_users.auth_user_id`, active Admin profile, brand-scoped role assignments, roles, and
  permissions into the trusted Admin request context.
- **FR-022**: Valid authentication without a matching active app user/Admin profile, brand authority,
  or required permission MUST fail safely through the existing authorization boundary.
- **FR-023**: JWKS retrieval and caching MUST use bounded timeouts and bounded cache behavior, fail
  closed, and accommodate documented key rotation without extending trust indefinitely.
- **FR-024**: Authentication, authorization, provider-configuration, and dependency failures MUST
  remain distinguishable internally while mapping to sanitized external responses.
- **FR-025**: Missing/malformed credentials and invalid JWTs MUST map to sanitized authentication
  failure; ambiguous duplicate headers MUST map to a sanitized invalid-request failure.
- **FR-026**: Valid authentication lacking M1 authority MUST map to sanitized authorization failure;
  cross-brand failures MUST not reveal target ownership.
- **FR-027**: Invalid startup configuration MUST prevent Supabase provider activation; transient JWKS
  unavailability MUST map to a sanitized provider/dependency failure, never an allow decision.
- **FR-028**: All tests for Prompt 57A MUST be deterministic and no-network, using locally generated
  asymmetric keys, JWTs, and JWKS fixtures; no real Supabase token may be used.
- **FR-029**: Prompt 57A MUST cause no staging/production access, database connection, database
  mutation, migration, seed, Admin M2 write, frontend change, push, deployment, or Supabase MCP use.
- **FR-030**: The feature documentation MUST be created at
  `api/docs/supabase-jwt-jwks-auth-adapter.md` during implementation and cover scope, official facts,
  project decisions, supported/unsupported modes, configuration, validation, errors, M1 integration,
  security, Ubuntu compatibility, tests, non-goals, and Prompt 57B handoff.
- **FR-031**: Existing auth/Admin/deployment documentation MAY be updated only where required for
  accuracy; historical verification reports MUST not be rewritten.
- **FR-032**: All planned dependencies, scripts, commands, tests, paths, environment variables,
  Docker assumptions, and runtime behavior MUST be compatible with Ubuntu 24.04 LTS and use
  Linux-compatible commands as the primary documented path.

### Failure Classification and Safe Mapping

| Condition | Internal class | Required external behavior |
|---|---|---|
| Missing/empty Bearer credential | Authentication required | Sanitized `401`; no principal |
| Malformed/oversized Bearer credential | Authentication invalid | Sanitized `401`; no token echo |
| Duplicate Authorization values | Invalid request | Sanitized `400`; no verification attempt |
| Token supplied only via query/body/cookie | Authentication required | Ignore unsupported transport and return sanitized `401` |
| Invalid, expired, unsigned, wrong issuer/audience, or unknown key JWT | Authentication invalid | Sanitized `401`; no claim/provider detail |
| Missing/invalid provider configuration | Provider configuration | Fail composition/activation closed; no mock fallback |
| JWKS unavailable, timed out, or malformed | Provider dependency unavailable | Sanitized `503` if request-visible; no allow decision |
| Valid subject without app user/Admin profile/brand authority | Authorization denied | Sanitized `403` or existing safe scoped-absence mapping |
| Inactive Admin profile or missing permission | Authorization denied | Sanitized `403`; no authority detail |

### Runtime Configuration Contract

- `AUTH_PROVIDER=supabase` selects this provider; `mock` remains the checked-in default.
- `SUPABASE_PROJECT_REF` identifies a project when the approved derivation policy uses it.
- `SUPABASE_AUTH_ISSUER` MAY explicitly configure the expected issuer.
- `SUPABASE_AUTH_JWKS_URL` MAY explicitly configure the JWKS discovery URL.
- `SUPABASE_AUTH_AUDIENCE` configures the required audience.
- `SUPABASE_AUTH_JWKS_TIMEOUT_MS` MAY configure a bounded timeout.
- No staging or production project reference may be hardcoded as a default.
- Configuration MUST require no secret for asymmetric public-key verification and MUST ignore/not
  consume service-role keys, anon keys, JWT secrets, or database URLs.
- The plan MUST define precedence and consistency checks for derived versus explicit issuer/JWKS
  values, URL safety constraints, algorithm allowlist, timeout, and cache behavior.

### Key Entities

- **Bearer Credential**: The single opaque access token extracted only from the Authorization header;
  it is never logged, persisted, returned, or treated as authority.
- **Verified Authentication Identity**: Provider-neutral result containing the verified Supabase UUID
  subject and minimum safe identity metadata, with no Admin authority.
- **Supabase Verifier Configuration**: Non-secret expected project/issuer/audience/JWKS and bounded
  operational settings required to activate the provider.
- **JWKS Key Set**: Public asymmetric verification keys selected by compatible `kid` and algorithm;
  absence or incompatibility is a closed failure.
- **Trusted Admin Request Context**: Existing Prompt 54 output populated only after M1 resolves the
  verified subject to an active app user, brand-scoped Admin profile, roles, and permissions.

### Data Impact

There is no schema, migration, seed, staging mutation, production access, or data-model change.
Prompt 57A does not alter `app.app_users`, Admin profiles/roles/permissions/assignments, M2 tables,
`app.admin_actions`, `app.audit_logs`, or curriculum tables.

### Source Facts

- The repository already defines provider-neutral `AuthIdentityAdapter` and
  `VerifiedAuthIdentity` contracts; mock auth implements them.
- Prompt 54 authenticates first, then resolves the canonical route brand and persisted M1 authority.
- Current `AUTH_PROVIDER=supabase` composition intentionally throws a sanitized fail-closed error.
- Existing Admin write routes accept a strict Bearer credential and map authentication failures to
  sanitized responses; their extraction boundary must be aligned, not duplicated into a parallel
  auth system.
- The API currently declares no JWT/JWKS library dependency.
- Official Supabase documentation states that user tokens use a project Auth issuer, include `aud`,
  `exp`, `iat`, and UUID `sub`, and require signature/issuer/audience/time validation.
- Official Supabase documentation exposes asymmetric public keys at the project Auth JWKS endpoint,
  notes that it returns no keys for projects without asymmetric signing keys, and describes an edge
  cache of approximately 10 minutes with rotation timing implications.
- Official Supabase documentation distinguishes asymmetric signing keys from legacy/shared-secret
  signing and recommends public-key verification for local verification.

Official references reviewed on 2026-08-24:

- [Supabase JWT overview and verification](https://supabase.com/docs/guides/auth/jwts)
- [Supabase JWT signing keys](https://supabase.com/docs/guides/auth/signing-keys)
- [Supabase JWT claims reference](https://supabase.com/docs/guides/auth/jwt-fields)

### Product and Security Decisions

- Prompt 57A supports Supabase Auth user access tokens signed asymmetrically and verified through
  JWKS only.
- Expected issuer and audience are mandatory validation inputs.
- The authenticated-user audience is required for Admin user authentication; JWT `role` is never an
  Admin authorization input.
- The verified UUID subject is the bridge to persisted M1 authorization.
- Shared-secret/HS256 verification and Auth-server introspection are unsupported in Prompt 57A.
- Tests are local, deterministic, and no-network; live verification belongs exclusively to Prompt
  57B after separate authorization.

### Unsupported and Deferred Behavior

- HS256, the legacy JWT secret, and any verification path requiring a shared secret.
- Real Supabase tokens, live JWKS calls, staging verification, and production activation.
- Auth-server `/user` introspection, token refresh, session management, OTP, and device policy.
- Creation or alteration of app users, Admin profiles, roles, permissions, or brand authority.
- Frontend login/session integration and Admin M2 frontend writes.
- Rejected-attempt persistence or changes to M4 evidence semantics.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: One hundred percent of the 23 required deterministic test cases pass without network,
  staging, production, or database access.
- **SC-002**: Every accepted test token yields exactly one UUID authentication identity and zero
  Admin roles, permissions, brand authority, profile IDs, or access decisions from token claims.
- **SC-003**: Every invalid-token, ambiguous-transport, unsupported-algorithm, configuration, and JWKS
  failure case denies access with no raw token, claims, provider internals, or secrets in output.
- **SC-004**: Existing mock authentication scenarios remain behaviorally unchanged in all regression
  tests.
- **SC-005**: Existing Prompt 54 authorization tests demonstrate that 100% of Admin permission and
  brand decisions still come from M1 projections after successful authentication.
- **SC-006**: A reviewer can trace every requirement to an acceptance scenario, failure mapping, or
  deterministic test expectation with no unresolved clarification marker.
- **SC-007**: All implementation validation commands planned for the next phase run on Ubuntu 24.04
  without Windows-only paths, shells, certificate stores, or runtime assumptions.
- **SC-008**: Prompt 57A produces zero runtime, frontend, dependency, migration, seed, staging,
  production, database, push, or deployment changes.

## Assumptions

- Existing Prompt 54 provider-neutral contracts and M1 projection remain the authoritative
  integration boundary; implementation extends them minimally instead of creating a parallel system.
- The Supabase project used in Prompt 57B will have an active asymmetric signing key and a usable
  JWKS endpoint; shared-secret-only projects are unsupported by this feature.
- Standard JWT verifier behavior will validate `exp`, `nbf` when present, and claim types; the plan
  will define any safe clock tolerance and issued-at policy.
- The current strict Admin route extraction behavior is the compatibility baseline, with duplicate
  Authorization values explicitly treated as invalid request input.
- Documentation-only specification work requires no runtime build or container validation, but
  whitespace, scope, placeholder, and secret checks remain applicable.

## Open Questions for Plan

1. Should implementation use `jose` or an already available reviewed JWT/JWKS capability after a
   lockfile and Ubuntu 24.04 compatibility review?
2. Should issuer and JWKS URL be derived from `SUPABASE_PROJECT_REF`, supplied explicitly, or require
   consistency when both forms are present?
3. Should the default audience be `authenticated`, or should it always be explicitly configured,
   given the official claims reference?
4. What exact bounded JWKS timeout, cache duration, rotation refresh, retry, and cache-purge behavior
   should implementation use?
5. How should a shared-secret-only project be detected and surfaced as an unsupported fail-closed
   configuration?
6. Which existing provider-neutral principal fields are mandatory, and can optional email remain
   without widening the authentication/authorization boundary?
7. Which HTTP tests should inject a fake verifier versus exercise a real local JWKS verifier through
   the full route boundary?
8. Which exact Ubuntu 24.04 commands, Node version checks, Docker validation, static scans, and stop
   conditions are required for implementation completion?

## Prompt 57B Handoff

Prompt 57B is a separate, explicitly authorized live verification phase. Its future specification or
plan must identify the exact staging project and environment, use a disposable non-production user,
perform authentication/read-only authorization preflight before any separately approved write, avoid
recording tokens or secrets, verify Medway-only authority and Elite denial, produce a sanitized report,
and retain the no-production/no-push/no-deploy boundaries unless independently authorized.
