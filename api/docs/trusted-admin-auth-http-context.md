# Trusted Admin HTTP Context

## Scope

Prompt 54 adds the reusable server-side boundary that prepares an Admin request for the Prompt 53 transactional M2 executor. It does not add an Admin HTTP write route, request-body parser, database mutation, migration, seed, frontend change, or deployment behavior.

## Identity and authority chain

The resolver accepts only server-created request/correlation identifiers, a bearer credential passed to the configured authentication adapter, and a route-matched canonical `brandId`. The route value is only a requested scope until it is resolved through `app.educational_brands` and confirmed active.

The authoritative chain is deliberately separated:

1. Authentication verifies an external subject.
2. `app.app_users.auth_user_id` resolves the global application user.
3. `app.admin_profiles.id` resolves the active Admin actor inside the requested brand.
4. Active role assignments, active roles, and active permissions resolve the permission snapshot.
5. The resolver constructs the existing `AdminRequestContext`.

`adminProfileId` is the canonical actor identity for M4 evidence and Prompt 53 durable idempotency. The deprecated `adminUserId` compatibility field is set to the identical backend-derived profile ID. An authenticated subject, app user, Admin profile, brand, role, and permission are never collapsed into one identifier.

## Trust and anti-forgery boundary

The client cannot establish authority through `adminProfileId`, `adminUserId`, permissions, roles, arbitrary actor/permission headers, query parameters, policy values, or request-body-shaped input. Raw credentials are passed only to the authentication adapter and never copied into the trusted context, evidence, logs, or response.

The context contains the resolved active brand, application user, Admin profile, role identifiers, known permission codes, request ID, correlation ID, and minimal masked identity data only. Request and correlation IDs are tracing metadata; neither is authorization evidence.

Unknown brands map safely to scoped absence, while an inactive brand, no active app user/Admin profile, or missing authority maps to a safe forbidden result. Malformed authority data maps to a sanitized internal result; provider/query failures remain dependency failures.

## Provider and runtime behavior

`AUTH_PROVIDER=mock` uses deterministic in-memory credentials and authority fixtures for local/test contexts. Existing Admin Overview and M2 GET routes remain unchanged and mock-compatible; they do not begin requiring authentication in this phase.

`PERSISTENCE_PROVIDER=supabase` can supply the M1 read projection for the resolver, but performs no query at construction. `AUTH_PROVIDER=supabase` deliberately fails closed during composition: no reviewed Supabase JWT/JWKS verifier exists yet. This phase does not trust provider-specific JWT claim shapes, import a Supabase SDK into core/Admin code, or add a permanent live runtime default.

## Prompt 53 and Prompt 55 handoff

Prompt 53's programmatic executor already requires a trusted `AdminRequestContext`. Prompt 55 may add authenticated HTTP mutation routes only by obtaining that context from this resolver using a canonical `:brandId` route scope before it calls the executor. It must not reconstruct authority in each handler, accept client actor/permission values, or expose a write path before body validation and trusted authentication are separately approved.

No POST, PUT, PATCH, or DELETE Admin endpoint is mounted by Prompt 54.
