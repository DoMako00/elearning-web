# Supabase JWT/JWKS authentication adapter

## Scope

Prompt 57A adds `AUTH_PROVIDER=supabase` authentication for backend Admin HTTP requests. It verifies a Supabase Auth access token with asymmetric public keys from the project JWKS endpoint and returns only a provider-neutral authentication identity. It does not grant Admin authority, brand authority, application access, or content access.

The existing `AUTH_PROVIDER=mock` mode remains deterministic, local, and network-free. Prompt 57A does not run live Supabase verification, connect to staging or production, mutate a database, create users or Admin profiles, change schema, or modify the frontend.

## Official Supabase behavior reviewed

The following official documentation was reviewed on 2026-08-24:

- [JSON Web Token (JWT)](https://supabase.com/docs/guides/auth/jwts)
- [JWT Signing Keys](https://supabase.com/docs/guides/auth/signing-keys)
- [JWT Claims Reference](https://supabase.com/docs/guides/auth/jwt-fields)
- [Supabase changelog](https://supabase.com/changelog)

Official facts used by this adapter:

- A project exposes public signing keys at `https://<project-ref>.supabase.co/auth/v1/.well-known/jwks.json`.
- The JWKS response contains public asymmetric keys and matches the JWT `kid` and `alg` values.
- The JWKS endpoint returns no keys when the project is not using asymmetric signing keys.
- Supabase documents an edge cache of approximately ten minutes and advises applications not to cache longer without a purge strategy during key rotation.
- Supabase user access tokens use the project Auth issuer and standard claims including `iss`, `aud`, `exp`, `iat`, and UUID `sub`; `aud` may be a string or string array.
- The documented authenticated-user audience is `authenticated`.
- Legacy JWT-secret/HS256 signing is distinct from asymmetric signing. Supabase recommends Auth-server validation for shared-secret projects when that mode is needed.
- Supabase's own local verification example uses the `jose` library and `createRemoteJWKSet`.

## Project decisions

Prompt 57A deliberately narrows the official capability to a safe local verification boundary:

- Supported algorithms are **ES256** and **RS256** only.
- `SUPABASE_PROJECT_REF` is required and must be exactly 20 lowercase ASCII letters or digits.
- Issuer and JWKS URL are derived from the project reference. Optional overrides are exact canonical assertions; arbitrary hosts are rejected.
- The only accepted audience is `authenticated`.
- `exp` and `iat` are required numeric claims. `nbf` is validated when present. A 60-second clock tolerance is used, and `iat` may not be more than 60 seconds in the future.
- A non-empty `kid` is required, and the matching public key must be available.
- JWKS uses a process-local `jose` remote resolver with a 5-second default timeout, a 10-minute maximum cache age, and a 30-second unknown-key cooldown.
- No token, payload, request header, JWKS body, provider exception, or claim data is logged or returned.
- JWT `role`, `app_metadata`, `user_metadata`, and custom permission claims are ignored for authorization.

## Configuration

| Key | Rule |
|---|---|
| `AUTH_PROVIDER` | `mock` remains the default; `supabase` selects this adapter. |
| `SUPABASE_PROJECT_REF` | Required in Supabase mode; exactly 20 lowercase ASCII letters/digits. |
| `SUPABASE_AUTH_ISSUER` | Optional exact HTTPS assertion of `https://<project-ref>.supabase.co/auth/v1`; no query or fragment. |
| `SUPABASE_AUTH_JWKS_URL` | Optional exact HTTPS assertion of the canonical JWKS URL; arbitrary hosts are rejected. |
| `SUPABASE_AUTH_AUDIENCE` | Defaults to and only accepts `authenticated`. |
| `SUPABASE_AUTH_JWKS_TIMEOUT_MS` | Defaults to `5000`; integer range `1000..10000`. |

No service-role key, anon key, JWT secret, database URL, database password, or Supabase MCP configuration is read or required. Selecting Supabase authentication does not construct a database pool, and valid provider construction does not fetch JWKS until verification is requested.

Invalid or missing configuration fails closed and never falls back to mock authentication.

## Bearer extraction

The authenticated Admin M2 write boundary reads raw Node request headers before normalization. It requires exactly one case-insensitive `Authorization` header whose value is `Bearer <token>` with one ASCII space. The token is non-empty, no longer than 8192 characters, and must be compact JWT syntax in Supabase mode. The deterministic `mock-auth-*` credential remains accepted for the existing mock provider contract.

Duplicate Authorization headers and oversized tokens return a sanitized `400`. Missing, empty, malformed, query-only, body-only, or cookie-only credentials do not authenticate and return a sanitized `401`. No credential is echoed.

## Verification and principal

`jose` is loaded with an awaited dynamic import because the API emits CommonJS while `jose` is ESM. The adapter verifies the signature through JWKS, exact issuer, `authenticated` audience, time claims, algorithm allowlist, `kid`, and UUID `sub`.

The successful result is exactly the existing safe core shape:

```text
{
  provider: "supabase",
  authIdentityId: UUID(sub),
  subject: UUID(sub),
  verifiedAt: ISO-8601 UTC timestamp
}
```

Email is intentionally not populated in Prompt 57A. The result contains no raw token, refresh token, full payload, headers, issuer/audience metadata, role, permission, Admin profile ID, Admin user ID, brand ID, or provider secret.

## Authorization integration

The verified UUID flows through the existing Prompt 54 boundary:

```text
verified Supabase subject
→ app.app_users.auth_user_id
→ active app user
→ app.admin_profiles
→ canonical brand scope
→ active role assignments
→ roles
→ permissions
→ trusted AdminRequestContext
```

Authentication does not create or infer an app user, Admin profile, role, permission, Medway authority, or Elite authority. Missing or inactive persisted authority remains a safe authorization denial. Cross-brand access remains backend-enforced and fails without ownership disclosure.

## Error behavior

- Missing/malformed/expired/invalid/unsigned/wrong-issuer/wrong-audience/unsupported-algorithm/unknown-key credentials map to sanitized authentication failure (`401`).
- Duplicate Authorization headers and oversized credentials map to sanitized invalid-request failure (`400`).
- Missing or invalid provider configuration prevents activation and is not converted to mock mode.
- JWKS timeout, unavailable, malformed, empty, or unusable provider responses fail closed as a sanitized provider dependency failure (`503` when request-visible).
- Valid authentication without persisted app-user/Admin/brand/permission authority maps to the existing safe authorization denial (`403` or the route's scoped absence response).

## Unsupported and deferred behavior

Prompt 57A does not support HS256/shared-secret verification, JWT-secret access, Auth `/user` introspection, Supabase client SDK authentication, token refresh, session management, OTP, device policy, or any fallback to mock. Shared-secret projects must migrate to a usable asymmetric JWKS key or remain unavailable to this provider.

Prompt 57B is the separately authorized live-verification phase. It may use a controlled real Supabase session JWT to verify the path through JWKS, the provider-neutral principal, persisted M1 identity, Medway scope, and an Admin HTTP authentication boundary. It must not log tokens, access production, mutate staging unless separately approved, or create new M2 writes.

## Tests and validation

Prompt 57A tests generate asymmetric keys in memory and use local JWKS fixtures. They cover valid ES256 verification, invalid issuer/audience/expiry/iat/subject, malformed and unsigned tokens, unknown keys, ignored authority claims, strict bearer extraction, provider composition, mock preservation, and Admin context integration. No real Supabase token or live network call is used.

The implementation is validated with Ubuntu 24.04-compatible Node 22/npm commands, API typecheck/build/selftests, HTTP smoke, `git diff --check`, secret and scope scans, Compose configuration, a no-cache Linux API image build, and container smoke. TLS verification remains enabled; `NODE_TLS_REJECT_UNAUTHORIZED=0` is not used.

## Non-goals

No schema, migration, seed, app-user creation, Admin fixture, role/permission change, frontend integration, brand-availability change, production behavior, staging activity, Supabase MCP usage, push, or deployment is part of Prompt 57A.
