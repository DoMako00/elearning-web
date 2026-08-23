# Contract: Admin Authentication Boundary

## Purpose

Define the external authentication boundary for authenticated Admin M2 HTTP routes. This contract
authenticates an external Supabase identity only; it does not authorize an Admin action.

## Runtime Modes

| Setting | Contract |
|---|---|
| `AUTH_PROVIDER=mock` | Existing deterministic mock authentication remains unchanged for local/dev/test/controlled verification. It does not connect to Supabase or grant production authority. |
| `AUTH_PROVIDER=supabase` | Requires complete validated non-secret Supabase JWT/JWKS configuration. Verifies only asymmetric ES256/RS256 user access tokens through JWKS. It never falls back to mock. |
| Invalid or unsupported value | Composition fails closed with a sanitized configuration failure. |

## Authorization Header Contract

The route accepts exactly one Authorization header. Its only accepted form is:

```text
Bearer <compact-jwt>
```

The scheme is exactly `Bearer`, followed by one ASCII space and exactly three Base64URL JWT
segments. The token must be non-empty and at most 8,192 characters.

| Transport/input | Result |
|---|---|
| One valid Authorization header | Continue to authentication verification. |
| Missing, empty, or malformed Bearer header | Sanitized `401`. |
| Duplicate Authorization headers | Sanitized `400`. |
| Oversized token | Sanitized `400`. |
| Query-string token | Current Admin M2 route rejects query input with `400`. |
| Body token/authority field | Current route rejects unknown body fields with `400`. |
| Cookie token | Unsupported and ignored; no valid Bearer header results in `401`. |

No request token, header, or payload may be logged, stored, echoed, or included in an error.

## Supabase Verification Contract

For `AUTH_PROVIDER=supabase`, the verifier requires:

- canonical issuer and JWKS URL derived from the validated project ref;
- audience exactly `authenticated`;
- algorithm exactly ES256 or RS256;
- a non-empty matching `kid` and usable asymmetric public JWKS key;
- valid signature, `exp`, `nbf` when supplied, `iat`, and UUID `sub`.

HS256/shared-secret verification, Auth-server introspection, JWT-secret usage, service-role/anon
keys, and mock fallback are not supported.

## Successful Principal

The provider-neutral output is:

```text
provider       = "supabase"
authIdentityId = verified UUID sub
subject        = verified UUID sub
verifiedAt     = backend UTC ISO timestamp
email          = undefined
```

It never contains raw token data, full claims, roles, permissions, metadata, Admin profile ID,
brand authority, subscription/access state, request headers, or secrets.

## Authentication Is Not Authorization

After authentication, the existing Prompt 54 resolver alone performs:

```text
verified UUID subject
-> app.app_users.auth_user_id
-> active app user and Admin profile
-> canonical route brand
-> persisted M1 role assignments, roles, and permissions
-> trusted AdminRequestContext
```

JWT `role`, `app_metadata`, `user_metadata`, and custom claims cannot add or change permissions,
Admin identity, brand scope, or access. A valid identity without persisted M1 authority is denied
safely.

## Failure Boundaries

| Failure class | Examples | Safe behavior |
|---|---|---|
| Authentication | Missing/malformed credential, invalid signature, wrong issuer/audience, expired token, non-UUID subject, unknown key | Sanitized `401`; no principal. |
| Invalid request | Duplicate Authorization, oversized token, route query/body transport violation | Sanitized `400`; no verification result. |
| Provider configuration | Missing project ref, invalid canonical assertion, invalid audience/timeout | Fail composition closed; no mock fallback. |
| Provider dependency | JWKS timeout, unavailable/malformed/empty JWKS | Sanitized `503` if request-visible; deny access. |
| Authorization | Missing/inactive app user/Admin profile, no brand authority, missing permission | Existing sanitized `403` or safe scoped absence; no ownership leak. |

## Non-Goals

This contract creates no app user, Admin profile, role, permission, brand membership, migration,
seed, database write, frontend behavior, staging access, production access, deployment, or push.
