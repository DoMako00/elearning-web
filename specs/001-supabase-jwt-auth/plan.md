# Implementation Plan: Supabase JWT/JWKS Authentication Adapter

**Branch**: `dev` | **Date**: 2026-08-24 | **Spec**: [spec.md](spec.md)

**Input**: Approved Prompt 57A feature specification from
`specs/001-supabase-jwt-auth/spec.md`.

## Summary

Add a backend-only, provider-neutral Supabase authentication adapter that verifies asymmetric
Supabase Auth access tokens through JWKS and returns only a verified UUID identity. Existing Prompt
54 M1 resolution remains the only source for app user, Admin profile, brand, role, and permission
authority. JWT role, metadata, and custom claims never grant Admin authority.

This plan is implementation-ready but does not implement runtime code, add dependencies, connect
to a provider, access staging/production, mutate a database, or change frontend behavior.

## Git and Source Preflight

Planning preflight completed on 2026-08-24:

- Active branch is `dev`; `production` was not checked out or modified.
- `git fetch origin dev` completed and `HEAD...origin/dev` is `1 / 0`; local `dev` contains the
  Prompt 56 verification commit and `origin/dev` did not advance.
- No merge or rebase is active.
- Prompt 56 completion commit `72342ee53ea8874cf51079bd6cf31f7bf363cf40` is reachable from `HEAD`.
- `spec.md`, its quality checklist, and the active feature pointer exist.
- No tracked runtime/source files are dirty. Existing untracked SpecKit infrastructure and the
  nested `elearning/` folder are preserved without inclusion in the planned implementation commit.

Before implementation, repeat this exact preflight. Stop if `origin/dev` advances, the Prompt 56
commit is no longer reachable, source/docs conflict materially, or unrelated tracked changes appear.

## Technical Context

**Language/Runtime**: TypeScript targeting ES2022; Node.js 22 runtime in Linux Docker.

**Project Type**: Backend API in a modular monolith; frontend integration is out of scope.

**Existing Auth Boundary**: `AuthIdentityAdapter` is provider-neutral. Prompt 54 resolves its
verified identity through persisted M1 records before constructing `AdminRequestContext`.

**Current Runtime Constraint**: The API package is CommonJS. The chosen JWT library is ESM-first,
so the adapter must use dynamic import rather than change the package module type.

**Storage**: No storage is used for JWT verification. M1 reads remain an existing authorization
concern after authentication; this feature adds no database connection, schema, or mutation.

**Target Platform**: Ubuntu 24.04 LTS, WSL2 Ubuntu 24.04, Node 22 Linux containers, and
Hostinger-style Linux VPS deployment.

## Constitution Check

| Gate | Plan disposition |
|---|---|
| Backend-mediated authority | PASS: JWT supplies identity only; M1 remains the authority source. |
| Private `app` schema | PASS: no Data API, RLS, grants, schema, or direct frontend access changes. |
| Medway/Elite isolation | PASS: Prompt 54 canonical route brand + M1 projection remains unchanged. |
| No JWT-derived Admin authority | PASS: roles, metadata, and custom claims are discarded. |
| Fail closed | PASS: invalid config, invalid JWT, unusable JWKS, and unsupported modes deny access. |
| Secrets and production safety | PASS: no secret/key/database URL is required; no live activity is in this phase. |
| Ubuntu 24.04 | PASS: Linux-first Node/npm/Docker validation is mandatory. |
| Push/deploy control | PASS: future commit stays local until explicit push approval. |

Re-check every gate after implementation, tests, documentation, and static scans. Any violation is a
hard stop rather than an exception to be silently worked around.

## Resolved Technical Decisions

### Dependency Decision

Implementation adds `jose` **v6.2.10** as an API runtime dependency and updates the API lockfile.
`jose` provides reviewed JWT parsing, signature verification, remote/local JWKS resolution, issuer,
audience, and time-claim validation. Manual cryptography, home-grown JWT parsing, and raw WebCrypto
verification are forbidden.

The project does not use the Supabase SDK for this boundary. JWKS verification uses public
asymmetric keys and must not require service-role, anon, JWT-secret, database, or provider SDK
credentials. Because the current API package is CommonJS and `jose` v6 is ESM-first, the
infrastructure adapter dynamically imports `jose` in its asynchronous verification path; no
repository-wide ESM conversion is permitted.

### Architecture Placement

- Keep `api/src/core/auth/` provider-neutral. Existing `AuthIdentityAdapter` and
  `VerifiedAuthIdentity` are sufficient and receive no raw JWT payload.
- Add `SupabaseJwtJwksAuthIdentityAdapter` and its configuration-owned JWKS resolver under
  `api/src/infrastructure/supabase/`.
- Add a reusable strict Bearer parser under `api/src/http/`. It reads raw HTTP headers and returns
  only an opaque token or a sanitized transport classification.
- Refactor the authenticated Admin M2 write route to use the shared parser while retaining its
  existing JSON, query, idempotency, route UUID, and authority-field checks.
- Update Admin HTTP context composition in `api/src/modules/admin/admin-http-context-source.ts`:
  `AUTH_PROVIDER=mock` keeps the existing adapter; `AUTH_PROVIDER=supabase` always creates the
  Supabase adapter from validated configuration and cannot use an injected/mock fallback.
- Do not alter existing Admin Overview mock behavior, Prompt 53 transaction/evidence ownership, or
  M1/M2 read repositories.

### Configuration Plan

`AUTH_PROVIDER=supabase` requires these non-secret configuration rules:

| Key | Decision |
|---|---|
| `SUPABASE_PROJECT_REF` | Required; must be exactly 20 lowercase ASCII letters/digits. |
| `SUPABASE_AUTH_ISSUER` | Optional assertion only; if set, must exactly equal the canonical issuer. |
| `SUPABASE_AUTH_JWKS_URL` | Optional assertion only; if set, must exactly equal the canonical JWKS URL. |
| `SUPABASE_AUTH_AUDIENCE` | Optional explicit assertion; defaults to and may only equal `authenticated`. |
| `SUPABASE_AUTH_JWKS_TIMEOUT_MS` | Optional integer; defaults to `5000`, allowed range `1000..10000`. |

Canonical values derive only from the required project ref:

```text
issuer   = https://<project-ref>.supabase.co/auth/v1
jwks URL = https://<project-ref>.supabase.co/auth/v1/.well-known/jwks.json
```

Issuer/JWKS assertions must use HTTPS, contain no query/fragment, and equal the derived canonical
value after normalization. A mismatch, invalid URL, invalid project ref, invalid audience, or
invalid timeout is a configuration failure. The adapter must not read or require `SUPABASE_URL`,
service-role/anon keys, JWT secrets, database URLs, or database credentials for authentication.
Checked-in defaults remain `AUTH_PROVIDER=mock` and non-mutating.

### JWT and JWKS Verification Strategy

- Re-check current official Supabase JWT, JWT claims, and signing-key documentation immediately
  before implementation. Record official facts separately from project decisions in the new adapter
  documentation.
- Allow exactly `ES256` and `RS256`; reject `none`, `HS256`, `EdDSA`, and every unreviewed
  algorithm before key selection.
- Require a non-empty `kid` and exactly one compatible public JWKS key selected by `kid`, algorithm,
  key type, and verify usage.
- Verify signature, exact canonical issuer, and the `authenticated` audience.
- Require a UUID `sub`, numeric `iat` not more than 60 seconds in the future, valid `exp`, and valid
  `nbf` when supplied. Use a 60-second clock tolerance and do not impose an extra maximum token age.
- Preserve no raw token or full claim payload after verification.
- `role`, `app_metadata`, `user_metadata`, and every custom claim are ignored for Admin authority.
- Prompt 57A supports asymmetric JWKS verification only. HS256/shared-secret projects are
  unsupported and never fall back to a JWT secret or Auth `/user` request.

### JWKS Fetch, Cache, and Fail-Closed Behavior

- Instantiate one process-local remote JWKS resolver per immutable validated configuration.
- Use the validated timeout, defaulting to 5 seconds.
- Use 600,000 ms maximum in-process cache age and a 30,000 ms unknown-key cooldown.
- Persist no JWKS cache to disk and add no manual retry loop. The resolver may perform its bounded
  refresh behavior after an unknown key, then denies safely.
- Network timeout/unavailability, malformed JWKS, and empty JWKS map to sanitized
  `provider_unavailable` behavior and HTTP `503` when request-visible.
- A valid-shaped JWKS with unknown/mismatched `kid`, invalid signature, or incompatible key maps to
  authentication invalid and HTTP `401`.
- Empty/no-usable JWKS is the fail-closed shared-secret-only behavior. No HS256 implementation,
  secret retrieval, or automatic fallback is permitted.

### Strict Bearer Extraction

- Read raw Node request headers before normalized context headers discard duplicates.
- Count Authorization headers case-insensitively and require exactly one value.
- Require exact `Bearer` scheme, one ASCII space, and a compact JWT with exactly three Base64URL
  segments.
- Set a hard maximum of 8,192 token characters.
- Missing, empty, or malformed bearer values map to `401`; duplicate Authorization and oversized
  values map to `400`.
- Existing Admin M2 write routes already reject all query parameters and unknown body fields. Query
  or body authority tokens remain `400`; cookie authentication is unsupported and ignored.
- Never log, return, persist, or include token/header/claim values in error details.

### Provider-Neutral Principal

On successful verification, use the existing core identity shape only:

```text
provider       = "supabase"
authIdentityId = verified UUID sub
subject        = verified UUID sub
verifiedAt     = current UTC ISO timestamp
email          = undefined
```

No roles, permissions, metadata, issuer, audience, raw JWT, refresh token, request headers,
Admin profile ID, brand authority, or provider secret is added to the principal. Existing required
`getAuthIdentityById` remains implemented as safe `authentication_invalid` without provider lookup;
Prompt 57A verifies a bearer credential only.

### Error Mapping

| Condition | Internal classification | HTTP-facing behavior |
|---|---|---|
| Missing/empty/malformed token | Authentication required/invalid | Sanitized `401` |
| Duplicate Authorization or oversized token | Invalid request | Sanitized `400` |
| Malformed/unsigned/expired/wrong issuer/wrong audience/non-UUID subject | Authentication invalid | Sanitized `401` |
| Unsupported algorithm or unknown/mismatched key | Authentication invalid | Sanitized `401` |
| Invalid provider configuration | Provider configuration | Fail composition closed; no mock fallback |
| JWKS timeout/unavailable/malformed/empty | Provider unavailable | Sanitized `503` if request-visible |
| Valid subject with no app user/Admin profile/brand/permission | Authorization denied | Existing safe `403` or scoped-absence behavior |

No mapping may reveal tokens, claims, provider stack traces, key material, database configuration,
or cross-brand ownership details.

## Data Model and Contract Impact

No schema/model mutation is planned. Authentication identity mapping is provider-neutral and passes
an existing UUID to M1. There are no migrations, seeds, new M1/M2/M4 tables, changes to
`app.app_users`, Admin profiles, roles, permissions, role assignments, `app.admin_actions`, or
`app.audit_logs`.

The HTTP authentication contract is documented in
[contracts/admin-authentication.md](contracts/admin-authentication.md). It distinguishes mock and
Supabase modes, accepted transports, principal minimization, and authentication versus
authorization/configuration/dependency failure.

## Implementation Steps

1. **Revalidate scope and sources.** Re-run Git preflight; re-read the approved spec/constitution;
   verify current official Supabase docs; stop on remote advance, source/document conflict, or
   scope expansion.
2. **Add the dependency.** Add `jose@6.2.10` and lock it. Prove dynamic loading works in emitted
   CommonJS on Node 22 before other auth changes. Stop if package install or module loading fails.
3. **Parse configuration.** Extend the existing Supabase configuration boundary with project-ref,
   canonical issuer/JWKS, audience, and bounded timeout validation. Add configuration tests. Stop
   on any secret requirement or mock fallback path.
4. **Add strict HTTP Bearer parsing.** Implement raw-header duplicate detection, exact compact JWT
   format, 8,192 character limit, and sanitized classifications. Add parser/route selftests.
5. **Add JWKS adapter.** Implement local/remote key-resolver seams, dynamic `jose` loading,
   algorithm allowlist, claim validation, and safe principal mapping. Add deterministic no-network
   adapter tests using generated keys.
6. **Compose the provider.** Wire Supabase auth into Admin context composition without changing
   M1 authority. Prove construction makes no provider/database call or mutation.
7. **Prove M1 authority.** Extend Prompt 54 fake-repository tests for verified Supabase subject,
   Medway allow, Elite deny, missing/inactive profile, missing permission, and forged JWT claims.
8. **Prove HTTP behavior.** Use fake verifier tests for route transport mapping and a local-JWKS
   verifier for one full HTTP-to-context integration. Preserve disabled mock command behavior.
9. **Document the feature.** Add `api/docs/supabase-jwt-jwks-auth-adapter.md`; minimally correct
   context/write/deployment docs only if their active statements change. Never rewrite Prompt 56
   history.
10. **Validate and commit.** Run all gates, review exact scope, and make one local commit only after
    success: `feat(api): add Supabase JWT auth adapter`.

## Test Strategy

Tests are deterministic and no-network. Generate ES256/RS256 test keys dynamically in memory and
use a local JWKS resolver seam; never embed private keys, a real Supabase token, or a live JWKS URL.

Required groups:

1. Adapter selftest: valid ES256/RS256; wrong issuer/audience; expired, future `iat`, future `nbf`;
   missing/non-UUID subject; malformed/unsigned/unsupported token; unknown key; empty/malformed/
   unavailable JWKS; ignored role/metadata/custom claims; minimal principal output.
2. Bearer parser selftest: missing, valid, malformed, duplicate, oversized, query/body, and cookie
   transport behavior.
3. Composition selftest: mock unchanged; valid Supabase configuration constructs lazily; invalid
   config fails closed; no mock fallback; no database activity at construction.
4. Prompt 54 integration tests: verified subject enters fake M1 projection; permissions stay M1-only;
   Medway allow/Elite deny; inactive/missing authority safely denied.
5. HTTP tests: fake verifier for boundary status mapping; local-JWKS verifier for one complete
   authentication/context flow; M2 routes still require persisted permission.
6. Regression tests: Prompt 53/54/55/56 command, context, evidence, and mock runtime behavior.

## Ubuntu 24.04 Compatibility and Validation Gates

Implementation must work on Ubuntu 24.04, WSL2 Ubuntu 24.04, Node 22 Linux containers, and the
Docker deployment path. No PowerShell-only runtime workflow, drive-letter path, case-insensitive
import, Windows certificate store, CRLF dependency, or Windows-only binary is allowed. Use UTF-8/LF
files and standard Linux environment variables. Preserve TLS verification and never use
`NODE_TLS_REJECT_UNAUTHORIZED=0`.

Future implementation validation commands:

```bash
cd /path/to/elearning/web
npm ci

cd /path/to/elearning/api
npm ci
npm run typecheck
npm run build
npm run smoke:runtime

cd /path/to/elearning
docker compose -f deploy/dokploy/docker-compose.yml --env-file deploy/dokploy/.env.example config
docker build --no-cache -f deploy/docker/api.Dockerfile -t elearning-api:local .
node deploy/scripts/container-smoke.mjs
```

Run the new compiled adapter/config/parser/context/route selftests plus existing request-context,
Supabase boundary, persistence composition, Prompt 53 executor/source, M1/M2 repository, and HTTP
smoke selftests. Container smoke uses no staging credentials.

## Static Scans

Before commit, run `git diff --check`, inspect staged scope, and scan for:

- bearer tokens, real JWTs, private keys, passwords, service-role/anon keys, JWT secrets, and
  database URLs;
- migrations, seeds, M2/M4 writes, staging verifier changes, frontend changes, Dokploy activation,
  Supabase MCP usage, or production configuration;
- Windows-only runtime paths or scripts;
- accidental raw-token/claim/error logging.

## Stop Conditions

Stop and report if any of these becomes true:

- `jose` cannot load from emitted CommonJS on Node 22;
- validation needs a secret, API key, JWT secret, database connection, or real Supabase token;
- shared-secret behavior cannot fail closed without HS256 or Auth-server fallback;
- JWT claims would grant Admin authority or Supabase mode can fallback to mock;
- Prompt 54/55 or mock behavior regresses;
- JWKS behavior is unbounded or leaks provider detail;
- Ubuntu/Docker validation fails because of this feature;
- `origin/dev` advances, material sources/docs conflict, or scope expands into frontend, migrations,
  data changes, staging, production, push, or deployment.

## Commit Plan

Implementation commit subject: `feat(api): add Supabase JWT auth adapter`.

Allowed implementation scope: auth adapter/config/composition, Bearer parser, selftests,
`api/package.json`, `api/package-lock.json`, and focused documentation. Forbidden without a new
explicit authorization: frontend, migrations, seeds, staging verifier/runtime activation, Docker
activation files, credential-bearing `.env` files, production behavior, push, and deployment.

## Prompt 57B Handoff

Prompt 57B is a separate, explicitly authorized staging-only verification phase. It may verify:

```text
real Supabase session JWT
-> JWKS verifier
-> provider-neutral UUID principal
-> app_users.auth_user_id
-> active Medway Admin profile
-> persisted permissions
-> Admin HTTP authentication boundary
```

It must use a controlled non-production identity/token, never log credentials, run SELECT-only
preflight and verification unless a distinct write authorization is granted, prove Medway-only
authority and Elite denial, and produce a sanitized report. It does not inherit production, push,
deploy, or Admin M2 write authorization.
