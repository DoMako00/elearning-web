# Feature Specification: Live Supabase Auth-only Verification

**Feature Branch**: `dev`

**Created**: 2026-08-24

**Status**: Draft

**Input**: User description: "Prompt 57B — specify a staging-only live verification that proves a real Supabase Auth access token is verified by JWKS, produces only a provider-neutral identity, and is denied without persisted M1 Admin linkage."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Prove Real Staging Authentication Without Granting Authority (Priority: P1)

As the platform security owner, I need a controlled local verification using a real staging Supabase
access token so that I can prove the API accepts the identity only after real staging JWKS verification,
while proving that authentication alone does not create Medway, Elite, or Admin authority.

**Why this priority**: Prompt 57A verified the boundary with locally generated keys. The remaining
security evidence is that the same boundary works with a real staging-issued token and remains
fail-closed when no application identity exists.

**Independent Test**: A separately authorized, temporary local verification process receives a real
staging access token through an ephemeral secure mechanism. It verifies the token through the approved
staging JWKS, reaches the existing authorization lookup, and returns a sanitized no-admin/forbidden
result. The report records only safe outcome facts and no token or raw claims.

**Acceptance Scenarios**:

1. **Given** valid non-secret staging verification configuration and a real staging access token,
   **when** the temporary local process receives one strict Bearer credential, **then** it verifies the
   token through the approved staging JWKS and accepts only a provider-neutral UUID identity.
2. **Given** the verified identity has no linked active application user, **when** the selected
   Admin boundary resolves authorization, **then** it reaches the M1 lookup and returns a safe
   no-admin/forbidden result without creating authority.
3. **Given** a token contains role, metadata, brand, or permission-like claims, **when** identity
   verification succeeds, **then** none of those claims grants an Admin role, permission, profile,
   application access, Medway authority, or Elite authority.

---

### User Story 2 - Preserve Auth-only and Data-immutable Verification (Priority: P1)

As the data and security owner, I need the live verification to remain read-only and authentication-only
so that it cannot create application users, repair authorization, run an Admin command, or create M2
or M4 records while proving the missing-link failure path.

**Why this priority**: The expected result is denial, not a write. A successful verification must not
reuse Prompt 56's controlled M2 lifecycle or leave evidence that could be mistaken for an Admin action.

**Independent Test**: The verification plan proves that no application-user, Admin-profile, role,
assignment, permission, M2, `admin_actions`, or `audit_logs` change occurred. If a future execution
prompt separately authorizes database inspection, it uses only target-locked, TLS-validated SELECTs.

**Acceptance Scenarios**:

1. **Given** a verified real Supabase identity with no M1 application-user linkage, **when** the
   authorization lookup finishes, **then** no row is created or changed.
2. **Given** the chosen API route is an Admin route, **when** the no-admin decision is returned,
   **then** no Admin M2 command executes and no M4 `admin_actions` or `audit_logs` evidence is
   created.
3. **Given** optional database inspection is separately authorized, **when** it verifies the
   outcome, **then** it performs SELECT-only inspection and reports only sanitized aggregate facts.

---

### User Story 3 - Handle Live Credentials and Operational Failure Safely (Priority: P1)

As the operator conducting the verification, I need strict token handling, bounded cleanup, and
unambiguous stop conditions so that a real staging credential is never committed, printed, or retained
and an unexpected result cannot be treated as a successful proof.

**Why this priority**: The verification uses a real credential and external provider endpoint for the
first time; credential hygiene and fail-closed handling are part of the feature outcome.

**Independent Test**: The later execution follows a written token lifecycle: inject securely into the
temporary process, make the bounded checks, stop the process, remove the process-scoped value, scan
sanitized outputs, and confirm that no token, raw claims, or secrets remain in the report or Git diff.

**Acceptance Scenarios**:

1. **Given** the real token is supplied for execution, **when** the temporary local process starts,
   **then** the token is available only through an approved ephemeral local mechanism and is never
   written to a committed file or process output.
2. **Given** a missing, malformed, duplicated, expired, wrong-project, or otherwise invalid
   credential, **when** authentication is attempted, **then** the process reports a sanitized failure
   and does not use mock authentication or retry with a substitute credential.
3. **Given** the verification completes, is interrupted, or detects a possible credential leak,
   **when** cleanup begins, **then** the temporary process is stopped, credential exposure is treated
   as a stop condition, and only a sanitized report may remain.

### Edge Cases

- The staging token is missing, empty, malformed, expired, wrong issuer, wrong audience, signed by
  an unavailable/unknown key, or exceeds the supported header boundary.
- Authorization arrives as duplicate headers, query data, body data, or a cookie rather than one
  accepted strict Bearer header.
- The approved staging JWKS endpoint is unavailable, times out, contains no usable asymmetric key,
  or cannot validate the supplied key during a rotation window.
- The runtime is configured for mock, attempts a mock fallback, has invalid Supabase verification
  configuration, or cannot start its temporary local process.
- The real identity does link to an unexpected application user or Admin authority, making the
  expected no-app-user result false.
- The target environment, project identity, TLS settings, or execution port/interface cannot be
  proven to match the separately approved staging execution prompt.
- The process is interrupted before cleanup, cleanup cannot be verified, or sanitized output scanning
  identifies a possible token, raw-claim, connection-detail, or credential exposure.
- Any API result suggests an M2 mutation, M4 evidence, or authorization success despite the intended
  auth-only/no-link scenario.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The future Prompt 57B execution MUST be separately authorized for one approved staging
  Supabase project and MUST not access production.
- **FR-002**: The execution MUST use a temporary local API process and must not change deployed,
  shared, staging, or production runtime configuration.
- **FR-003**: The temporary process MUST select `AUTH_PROVIDER=supabase` and MUST not use mock
  authentication for the positive real-token check.
- **FR-004**: Valid Supabase verification configuration MUST use the approved staging issuer and JWKS
  endpoint, and the execution must prove that live JWKS verification was attempted and accepted the
  real token.
- **FR-005**: The process MUST accept a real staging access token only through exactly one strict
  Bearer credential and MUST not accept an alternate token transport.
- **FR-006**: A successfully verified token MUST become only a provider-neutral UUID identity. It
  MUST NOT become an Admin role, Admin permission, brand authority, Admin profile, application access,
  subscription state, or protected-content access.
- **FR-007**: The verified UUID identity MUST be passed into the existing M1 authorization lookup.
- **FR-008**: The expected positive-auth result is that M1 finds no matching `app.app_users` record
  and the selected Admin boundary returns its existing sanitized no-admin/forbidden outcome.
- **FR-009**: The verification MUST prove that no mock fallback occurred and that JWT role,
  `app_metadata`, `user_metadata`, and custom claims did not affect the authority outcome.
- **FR-010**: Missing and malformed Bearer credentials MUST receive sanitized authentication failure;
  duplicate Authorization headers MUST receive sanitized invalid-request failure.
- **FR-011**: Authentication failure, authorization denial, provider dependency failure, provider
  configuration failure, verification-precondition failure, and security-leak failure MUST remain
  distinguishable in the sanitized execution record.
- **FR-012**: The execution MUST create or change no application user, Admin profile, role, role
  assignment, role-permission relationship, permission catalogue, schema, migration, or seed.
- **FR-013**: The execution MUST not invoke any Admin M2 write route, create an instructor or course,
  repeat Prompt 56's lifecycle, or create M4 `admin_actions` or `audit_logs` evidence.
- **FR-014**: Any database inspection requires a separate execution authorization and MUST be
  target-locked, TLS-validated, SELECT-only, and sanitized. It MUST not be required to start the
  temporary authentication process.
- **FR-015**: A real token MUST be supplied only through a secure ephemeral process environment or
  secure local prompt mechanism approved by the execution plan. It MUST never be committed, printed,
  returned, written to a `.env` file, or stored in documentation.
- **FR-016**: Logs, reports, screenshots, command history, and Git artifacts MUST exclude the raw
  token, decoded claims, database URL, passwords, API keys, provider stack traces, and connection
  details. A subject reference is excluded by default; if an execution plan needs one, it MUST use a
  non-reversible hash or heavily redacted reference and explain why.
- **FR-017**: The execution MUST stop the temporary process and remove process-scoped credential
  values on success, failure, or interruption. An unverified cleanup or detected exposure is a
  security-leak stop condition, not a successful verification.
- **FR-018**: The execution report MUST document only sanitized facts: staging target approval,
  issuer/audience match, UUID-subject validation, JWKS verification outcome, M1 no-app-user result,
  safe denial result, negative-check outcomes, mutation absence, cleanup, and validation results.
- **FR-019**: Future commands, process management, TLS handling, paths, environment variables, and
  validation gates MUST be compatible with Ubuntu 24.04 LTS, WSL2 Ubuntu 24.04, Linux containers,
  and Ubuntu VPS environments.
- **FR-020**: The phase MUST not use Supabase MCP, service-role credentials as user credentials,
  anon credentials as user credentials, a JWT secret, HS256/shared-secret fallback, push, deployment,
  or frontend changes.
- **FR-021**: If the expected no-app-user result is not observed, the execution MUST stop, preserve
  evidence safely, and defer any identity-link repair or Admin-success verification to Prompt 57C.
- **FR-022**: The execution phase MUST create a sanitized report at
  `api/docs/supabase-live-auth-only-verification.md` only after a separately authorized live run;
  specification work must not create that execution report.

### Failure Classification and Safe Mapping

| Condition | Classification | Required safe behavior |
|---|---|---|
| Missing or malformed Bearer credential | Authentication failure | Return a sanitized `401`; do not invoke M1 lookup or echo credentials. |
| Duplicate Authorization header | Invalid request | Return a sanitized `400`; do not verify a token. |
| Expired, wrong-issuer, wrong-audience, invalid-signature, unknown-key, or unsupported-algorithm token | Authentication failure | Return a sanitized `401`; do not expose claim or provider details. |
| JWKS unavailable, timeout, malformed, empty, or no usable asymmetric key | Provider dependency failure | Fail closed with sanitized dependency failure; do not retry without a bounded approved rule. |
| Missing/invalid project, issuer, audience, or JWKS configuration | Provider configuration failure | Prevent verification startup and never select mock fallback. |
| Valid identity with no application-user/Admin linkage | Authorization failure | Return the existing safe no-admin/forbidden result; create nothing. |
| Unexpected matching application user, active Admin authority, M2/M4 evidence, or success result | Verification precondition failure | Stop immediately; do not repair, mutate, or continue toward Admin success. |
| Token/raw claims/secrets appear in output or cleanup cannot be confirmed | Security leak failure | Stop, contain local output/process state, do not commit or publish a report, and request incident direction. |
| Temporary process cannot start or stop safely | Verification precondition failure | Stop without fallback, deployment, or provider substitution. |

### Key Entities

- **Live Staging Access Token**: A short-lived, real Supabase Auth credential supplied only for the
  separately approved execution; it is never persisted or reported.
- **Verified Authentication Identity**: The safe UUID subject result from Prompt 57A; it represents
  identity verification only and contains no application authority.
- **M1 Authorization Lookup**: The existing persisted lookup that determines whether the verified
  identity has an application-user/Admin relationship and brand-scoped authority.
- **Auth-only Verification Record**: A sanitized execution report that states outcomes and cleanup
  facts without credentials, raw claims, database details, or reversible subject information.
- **No-app-user Denial**: The expected authorization outcome after valid authentication when no
  matching application user exists; it is not an authentication failure and does not repair data.

### Data Impact

Prompt 57B has no data-model impact. It does not change schema, migrations, seeds, curriculum,
`app.app_users`, Admin profiles, roles, permissions, role assignments, M2 entities,
`app.admin_actions`, or `app.audit_logs`.

No mutation is permitted during this feature's specification work or its future auth-only execution.
Any future real-identity fixture or Admin-success verification is outside this feature and belongs to
Prompt 57C under separate authorization.

### Source Facts

- Prompt 57A is implemented in commit `86bd8416c02c303400741f2303cf5fe5eb802eb4` and provides
  asymmetric JWKS identity verification with no JWT-derived authority or mock fallback.
- Prompt 56 is implemented in commit `72342ee53ea8874cf51079bd6cf31f7bf363cf40` and verified a
  separate staging Admin M2 write path using deterministic mock authentication; that proof does not
  prove real Supabase bearer authentication.
- The existing Admin context resolves a verified identity into M1-persisted application-user,
  Admin-profile, brand, role, and permission state before it can produce a trusted Admin context.
- The current known scenario has no real Supabase Auth user linked to `app.app_users` for Admin
  authorization. The expected result is therefore successful authentication followed by safe denial.
- Current official Supabase documentation describes project JWKS verification, the authenticated
  audience for authenticated user tokens, standard token validation, key rotation/cache behavior,
  and separate legacy/shared-secret signing behavior.

### Product and Security Decisions

- Prompt 57B proves the live authentication boundary and fail-closed missing-M1-link behavior only.
- An accepted real token is not evidence of Admin authorization, Medway authority, Elite authority,
  course access, subscription access, or protected-media access.
- The staging target must be explicitly approved and locked in the later execution prompt. It must
  never be inferred from a token, local environment default, or user-supplied request field.
- The expected successful verification result is a sanitized safe denial after M1 lookup, not an
  authorized response and not a database repair.
- A real token is operationally sensitive. The future execution must treat any appearance outside the
  ephemeral credential boundary as a security incident and stop condition.
- The private `app` schema remains private; no Data API exposure, grant, RLS, policy, or schema
  change is authorized.

### Unsupported and Deferred Behavior

- Production access, production credential use, production verification, push, deployment, and
  Dokploy activation.
- M2 writes, M4 evidence, instructor/course changes, payment/access changes, media behavior, frontend
  integration, migration, seed, and authorization repairs.
- Creation or alteration of application users, Admin profiles, roles, permissions, role assignments,
  brand memberships, or brand authority.
- Service-role or anon credentials as user authentication, HS256/shared-secret verification, JWT
  secret use, Auth-server user introspection fallback, token refresh, and Supabase MCP.
- Prompt 57C's controlled real Supabase Admin identity fixture and any Admin-success proof.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A separately authorized execution produces exactly one sanitized staging auth-only
  verification outcome: accepted real identity followed by no-app-user/no-admin safe denial, with
  zero successful Admin command responses.
- **SC-002**: All three required credential-boundary checks pass: missing credential returns safe
  `401`, malformed credential returns safe `401`, and duplicate Authorization returns safe `400`.
- **SC-003**: The execution report contains zero raw tokens, raw claims, reversible subject values,
  passwords, database URLs, API keys, or provider stack traces.
- **SC-004**: The verification confirms zero application-user/Admin-role repair actions, zero M2
  mutations, and zero M4 `admin_actions`/`audit_logs` mutations attributable to the run.
- **SC-005**: The temporary process and process-scoped token handling are confirmed cleaned up on
  every terminal outcome before the report is accepted.
- **SC-006**: The live verification demonstrates that 100% of authority decisions remain
  persistence-derived: JWT role/metadata claims produce zero Admin permissions or brand authority.
- **SC-007**: The approved execution instructions can run on Ubuntu 24.04 without Windows-only paths,
  shells, certificate stores, or disabled TLS verification.

## Assumptions

- A later execution prompt will explicitly authorize one approved staging Supabase project, identify
  the target safely, and provide the real token through an approved ephemeral local mechanism.
- The selected staging project has an active asymmetric signing key and a reachable public JWKS
  endpoint compatible with Prompt 57A.
- The real Supabase user intentionally has no matching `app.app_users` row and no persisted Admin
  authority at the time of execution.
- Prompt 57A's local validation remains a prerequisite; any code or documentation conflict discovered
  during planning/execution stops the phase for review.
- Prompt 57C, not Prompt 57B, owns any controlled identity fixture, Admin-success verification, or
  authorization repair.

## Open Questions for Planning

1. Which approved secure local mechanism will provide the real staging access token during execution?
2. Which temporary loopback port and interface will be used without colliding with an existing process?
3. Which non-mutating Admin boundary is best suited to prove the expected no-app-user safe denial?
4. Is the API denial and sanitized local process trace sufficient, or should separately authorized,
   target-locked SELECT-only inspection prove the missing application-user condition?
5. If SELECT-only inspection is needed, what exact target identity, TLS/CA validation, credential
   handling, query allowlist, and sanitized output rules apply?
6. How will the later run prove zero M2/M4 mutation without introducing a write or broad database
   inspection?
7. Which output/log paths must be scanned for token, claim, connection-detail, and secret leakage?
8. How will process-environment and temporary-process cleanup be verified after success, failure, and
   interruption?
9. Should the execution use an existing local smoke facility or create a narrowly scoped local-only
   verifier, subject to a separate implementation decision?
10. What exact Ubuntu 24.04 commands, timeouts, and stop conditions are required for the live run?
