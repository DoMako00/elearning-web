# Contract: Live Supabase Auth-only Verification

## 1. Execution Gates

The later local verifier must exit safely without network, database, or child-process activity unless all of the following are present and valid:

```text
SUPABASE_LIVE_AUTH_ONLY_VERIFY=true
SUPABASE_LIVE_AUTH_TARGET_ENVIRONMENT=staging
SUPABASE_PROJECT_REF=<approved-staging-project-ref>
SUPABASE_LIVE_AUTH_ACCESS_TOKEN=<process-only-token>
AUTH_PROVIDER=supabase
SUPABASE_AUTH_AUDIENCE=authenticated
```

If a real M1 lookup is authorized, the future prompt also authorizes its direct PostgreSQL read configuration and TLS/CA material through process-only configuration. Those values are never written to docs or version control.

## 2. Token Handling Contract

The access token is available only to the verifier process through `SUPABASE_LIVE_AUTH_ACCESS_TOKEN`. It must not appear in command arguments, committed files, `.env`, shell exports retained after the command, HTTP output, child logs, reports, screenshots, or errors. The verifier must redact it, discard references after use, scan outputs without printing matches, and delete temporary output files.

## 3. Temporary Runtime Contract

The API is a temporary local child, bound only to `127.0.0.1` using a bounded ephemeral/configured port. It selects `AUTH_PROVIDER=supabase`; it must never select or fall back to mock authentication. For a real M1 absence proof, it uses real staging read composition only under explicit authorization, while Admin command composition stays mock/disabled and non-executable.

No deployment, Dokploy action, public listener, production connection, Supabase MCP call, M2 command, or M4 evidence creation is allowed.

## 4. Accepted HTTP Credential Transport

The positive request contains exactly one raw `Authorization` header in this exact form:

```text
Bearer <compact-jwt>
```

It is accepted only when strict parsing, live JWKS verification, issuer/audience/time validation, and UUID-subject validation succeed. Query-string tokens, body token fields, cookie credentials, malformed headers, missing tokens, multiple spaces, duplicate Authorization headers, or alternative transports are rejected. Missing/malformed Bearer is a safe `401`; duplicate Authorization is a safe `400`.

## 5. Positive Path and Expected No-admin Result

The known expected path is:

```text
real staging token -> real staging JWKS -> safe UUID principal -> M1 lookup
  -> no app.app_users link -> permission_denied -> safe HTTP 403
```

The JWT must not grant a role, permission, `adminProfileId`, `adminUserId`, Medway/Elite authority, brand membership, course/content access, payment/subscription status, or protected-media access. Roles and `app_metadata`, `user_metadata`, and custom claims are ignored for authorization.

## 6. Route Boundary Contract

No existing authenticated Admin GET route currently resolves the Prompt 54 context. The proposed future boundary is the existing POST global-instructor route with a confirmed canonical staging Medway brand UUID, a syntactically valid harmless body, and a fresh idempotency key. It can be used only under an explicit execution-prompt exception and only when source review confirms resolver denial occurs before command/permission execution. Without that exception, 57B must stop pending a purpose-built read-only trusted-context endpoint.

## 7. Failure Classes

| Class | Safe HTTP/operational result |
| --- | --- |
| Authentication failure | Sanitized `401`; no M1 lookup for missing/malformed/invalid credentials. |
| Invalid request | Sanitized `400` for duplicate Authorization or rejected alternate transport. |
| Provider dependency failure | Sanitized unavailable failure for JWKS timeout/unavailability/malformed/empty key set; no fallback. |
| Provider configuration failure | Fail closed before positive verification for invalid/missing project, issuer, audience, or JWKS configuration. |
| Authorization failure | Sanitized `403` after a valid identity lacks persisted M1 application/Admin authority. |
| Verification-precondition failure | Stop for an existing app user/authority, M2/M4 record, unexpected success, untrusted TLS target, or unsafe process state. |
| Security-leak failure | Stop and contain local artifacts if a token, claim, secret, or credential appears outside its ephemeral boundary. |

## 8. Optional SELECT-only Inspection Contract

It is permitted only under a fresh explicit staging authorization. It must be target-locked, TLS/CA-verified, parameterized, SELECT-only, and sanitized. It may prove no matching `app.app_users` record and compare scoped pre/post M2/M4 aggregate observations. It must not expose the subject, raw records, DB URL, or credentials, and cannot run any DML.

## 9. Reporting and Cleanup Contract

The later report contains only target approval, configuration class, issuer/audience/JWKS outcome, UUID validation, M1 lookup outcome, safe status class, optional aggregate mutation observation, negative-check results, leak-scan result, cleanup result, and Ubuntu notes. It excludes tokens, raw claims, subject values, DB details, provider errors, and secrets.

The verifier always stops its child, closes read-only pools, removes temp files, clears local values, and confirms repository scope before a report may be accepted.
