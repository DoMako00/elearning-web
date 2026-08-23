# Research: Supabase JWT/JWKS Authentication Adapter

**Feature**: [Prompt 57A specification](spec.md)
**Date**: 2026-08-24

## Official Supabase Findings

Supabase documents the following facts for user access-token verification:

- Auth user tokens include a project Auth issuer, audience, expiry, issued-at time, and user subject.
  The documented authenticated-user audience is `authenticated`; the documented user subject is a
  UUID.
- A project with asymmetric signing keys exposes public verification keys at
  `https://<project-ref>.supabase.co/auth/v1/.well-known/jwks.json`.
- Supabase supports ES256 and RS256 asymmetric signing keys. Its current documentation describes
  EdDSA as coming later and HS256 as a shared-secret mode that is not recommended for production.
- The JWKS discovery endpoint is edge-cached for approximately 10 minutes. Key rotation/revocation
  therefore requires bounded application caching and deliberate rotation awareness.
- A shared-secret or legacy signing configuration does not provide the asymmetric public JWKS needed
  for local public-key verification. Supabase documents an Auth-server request as one possible
  shared-secret verification approach, but Prompt 57A intentionally does not use that path.

Official references to re-check immediately before coding:

- [Supabase JWT verification](https://supabase.com/docs/guides/auth/jwts)
- [Supabase JWT signing keys](https://supabase.com/docs/guides/auth/signing-keys)
- [Supabase JWT claims reference](https://supabase.com/docs/guides/auth/jwt-fields)

## Project Decisions

| Topic | Decision | Rationale |
|---|---|---|
| Signing support | ES256 and RS256 only | Both are documented asymmetric Supabase signing modes; narrow allowlist avoids algorithm confusion. |
| Audience | Default and only accepted value is `authenticated` | Prompt 57A authenticates real Supabase user tokens, not anon/service/custom-audience tokens. |
| Issuer/JWKS | Derive from required project ref; overrides must exactly assert the derived values | Prevent arbitrary remote JWKS/issuer targets and make configuration deterministic. |
| Principal | UUID subject only with provider and verification time | Authentication must not become Admin authorization. |
| Shared secret | Unsupported and deferred | Avoid JWT secret, HS256, Auth-server fallback, and additional live dependencies. |
| Live activity | Deferred to Prompt 57B | Prompt 57A tests must stay deterministic and no-network. |

## Dependency Decision: `jose` v6.2.10

**Decision**: Add `jose` v6.2.10 as an API runtime dependency during implementation.

**Rationale**:

- It provides mature JWT signature, issuer, audience, and time-claim verification plus local and
  remote JWKS resolution.
- Manual crypto/JWT implementation is prohibited.
- It supports dynamically generated local key/JWKS test fixtures without a provider connection.
- Its remote JWKS controls provide bounded timeout/cooldown/cache behavior.

**CommonJS compatibility**: The API remains CommonJS. The asynchronous infrastructure adapter
loads `jose` dynamically; implementation must prove the emitted Node 22 runtime can load it. No
repo-wide ESM conversion is allowed.

**Alternatives rejected**:

- Supabase SDK: unnecessary for public-key JWT verification and would broaden the provider boundary.
- `jsonwebtoken` plus separate key-fetch package: splits key acquisition/algorithm policy and adds
  more moving parts.
- Manual WebCrypto/JWK handling: high security risk and outside the project’s reviewed dependency
  approach.

## JWKS Cache and Timeout Decision

| Control | Value | Reason |
|---|---:|---|
| Request timeout | 5,000 ms default; configurable 1,000-10,000 ms | Bounds latency and prevents a hanging auth request. |
| In-process cache maximum | 600,000 ms | Matches Supabase’s documented 10-minute edge-cache horizon. |
| Unknown-key cooldown | 30,000 ms | Prevents request-triggered refresh abuse while permitting bounded key-rotation refresh. |
| Manual retries | None | Avoids unbounded traffic and unpredictable auth latency. |
| Persistent cache | None | Avoids stale key trust across process lifetime/revocation events. |

Timeout/unavailability, malformed JWKS, and empty JWKS fail closed as provider-unavailable.
Unknown/mismatched key under an otherwise usable JWKS fails as invalid authentication.

## Unsupported Shared-Secret / HS256 Behavior

Prompt 57A does not read a JWT secret, service-role key, anon key, or database credential. It does
not verify HS256, call the Auth `/user` endpoint, or fall back to mock. If no usable asymmetric key
is available, authentication fails closed and the configuration/project must be changed or a later,
explicitly specified supported mode must be designed.

## Ubuntu 24.04 Implications

- Node 22, npm lockfile installation, TypeScript compile, dynamic module loading, and Docker
  `node:22-alpine` runtime must be validated on Linux.
- Commands and paths must be bash/POSIX compatible; runtime code must not require PowerShell,
  drive-letter paths, case-insensitive imports, or Windows certificate stores.
- Tests generate key material only in memory. No key file, secret `.env`, or Windows-specific
  certificate mechanism is needed.
- Docker/container smoke uses mock defaults and no staging credentials; TLS verification remains
  enabled for any future remote JWKS activity.
