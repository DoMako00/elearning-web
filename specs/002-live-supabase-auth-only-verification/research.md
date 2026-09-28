# Research: Prompt 57B Live Supabase Auth-only Verification

## Official Supabase Documentation Gate

This planning phase used the Prompt 57A documentation review as a basis and requires a fresh review of current official Supabase documentation immediately before live execution. The execution record must capture the review date and official URLs for:

- JWT verification with a project JWKS endpoint;
- project Auth issuer and standard token validation;
- authenticated user-token audience/session behavior;
- asymmetric signing keys and key rotation/cache behavior; and
- legacy/shared-secret signing, unavailable keys, and empty/unusable JWKS behavior.

Official documentation is authoritative for Supabase-provider behavior. The project constitution, Prompt 57A contract, and this plan remain authoritative for platform authorization, brand isolation, error sanitation, data immutability, and operational controls.

## Official Facts and Project Decisions

| Topic | Official Supabase behavior to re-check | Project decision for 57B |
| --- | --- | --- |
| Access-token verification | Verify issuer, audience, signature, and temporal JWT claims using the project signing-key material. | The Prompt 57A adapter performs ES256/RS256 JWKS verification and emits only the safe UUID identity. |
| JWKS | Project asymmetric public keys are exposed through the project Auth JWKS endpoint and can rotate. | Use the approved staging project's canonical endpoint only, through the existing bounded 57A resolver. |
| Audience | Authenticated user access tokens normally use the `authenticated` audience. | `SUPABASE_AUTH_AUDIENCE=authenticated` is the only accepted live audience in this phase. |
| Claims | Provider claims identify an authenticated subject/session; application policy is separate. | Ignore roles, `app_metadata`, `user_metadata`, and custom claims for Admin authorization. |
| Legacy/shared-secret mode | Shared-secret signing is a different verification model from asymmetric JWKS. | Unsupported: do not supply a JWT secret, add HS256, or fall back to another endpoint. |

## Why a Valid JWT Must Still Fail Authorization

The token establishes only that an external Supabase Auth subject has passed verification. The existing M1 resolver is responsible for mapping that UUID to persisted `app.app_users`, an active Admin profile, canonical brand scope, role assignments, roles, and permissions. With the known intentional absence of a real identity link, the correct observation is a safe no-admin/forbidden result. This protects Medway and Elite from authority inferred from a token, a course ID, or client-supplied metadata.

## Why 57B Remains Auth-only

Prompt 56 already verified a separate staging M2 transaction/evidence path using deterministic mock authentication. Repeating it with a real token would combine separate risks, produce M4 evidence, and make it harder to establish that authentication did not create authority. 57B instead stops at the missing M1 linkage and permits no data repair, command, M2 lifecycle, or M4 evidence.

## Why Prompt 57C Is Separate

Creating a real identity linkage changes persisted authorization state and requires its own target lock, permission/policy review, transaction plan, audit approach, pre/post checks, and explicit approval. It cannot be inferred from a successful 57B token verification. Prompt 57C owns that decision if an Admin-success check later becomes required.

## JWKS, Cache, and Failure Implications

57B uses Prompt 57A's process-local bounded resolver: a 5-second default timeout (accepted range 1–10 seconds), bounded cache behavior, and fail-closed key-rotation handling. Unknown key IDs, timeouts, malformed/empty JWKS, unavailable endpoints, unsupported algorithms, wrong issuer/audience, and invalid temporal claims are not retried through mock authentication or a shared secret. They are sanitized authentication/provider failures.

## Ubuntu 24.04 Operational Implications

The execution is Linux-first: Bash-scoped environment values, `127.0.0.1` binding, `mktemp` temporary files outside the repository, standard CA/TLS verification, UTF-8/LF scripts, and case-sensitive imports. It must not depend on PowerShell, Windows paths, a Windows certificate store, CRLF-only shell behavior, or `NODE_TLS_REJECT_UNAUTHORIZED=0`.
