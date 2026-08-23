# Prompt 57B: Live Supabase Auth-only Verification — Execution Plan

## 1. Summary

Prompt 57B is a separately authorized, staging-only operational verification of the Prompt 57A authentication boundary. It proves the following constrained sequence and nothing beyond it:

```text
real staging access token
  -> real staging JWKS verification
  -> provider-neutral UUID authentication identity
  -> existing M1 authorization lookup
  -> no linked app.app_users record
  -> safe no-admin / forbidden result
  -> zero mutations
```

The expected positive result is **authentication succeeds and authorization denies**. A valid JWT is never evidence of Admin permission, Medway or Elite authority, application access, or a right to invoke an Admin command.

This plan creates no runtime behavior. The later execution may start only under a fresh prompt that explicitly authorizes the exact staging project, staging database access if required, and the supplied temporary token.

## 2. Git and Source Preflight

The plan preflight on 2026-08-24 established:

- `dev` is checked out and is three local commits ahead of `origin/dev`; `origin/dev` did not advance.
- No merge or rebase is in progress.
- Prompt 57A implementation commit `86bd8416c02c303400741f2303cf5fe5eb802eb4` is reachable.
- Prompt 56 completion commit `72342ee53ea8874cf51079bd6cf31f7bf363cf40` is reachable.
- `spec.md` and `checklists/requirements.md` exist for this feature.
- No tracked runtime, source, package, or frontend file is dirty. Existing untracked `.agents/`, `.specify/`, and `elearning/` directories remain preserved and outside this commit.

Before a live execution, repeat `git status -sb`, `git fetch origin dev`, `git rev-list --left-right --count HEAD...origin/dev`, and `git log --oneline --decorate -n 30`. Stop if the branch, implementation commits, source behavior, or target approval differs materially.

## 3. Approved Target and Non-targets

The later run must name exactly one approved **staging** Supabase project and must lock both its project reference and canonical HTTPS issuer/JWKS endpoints before process startup. Production, Supabase MCP, deployed services, Dokploy, public listening interfaces, and every non-approved project are non-targets.

No schema, Data API exposure, RLS, policy, grant, migration, seed, app user, Admin profile, role, permission, role assignment, M2 entity, `app.admin_actions`, or `app.audit_logs` change is in scope. Prompt 57C owns any future real identity linkage or Admin-success verification.

## 4. Resolved Technical Decisions

| Question | Decision |
| --- | --- |
| Real-token transport | A process-scoped `SUPABASE_LIVE_AUTH_ACCESS_TOKEN` environment variable only. It is never committed, echoed, written to `.env`, passed as a command-line argument, copied to a report, or retained in a parent shell. |
| Temporary API interface | A child process binds only to `127.0.0.1` on an ephemeral loopback port selected by the verifier (or an explicitly supplied unused loopback port). No `0.0.0.0`, public interface, Docker deployment, or Dokploy is permitted. |
| Positive Admin boundary | No authenticated Admin GET route currently exercises Prompt 54 context resolution. The only viable current boundary is `POST /v1/admin/brands/<approved-staging-medway-brand-id>/instructors/global`, used only after a fresh execution prompt explicitly permits its fail-closed pre-command path. If that exception is not explicitly approved, do not run 57B; no other current route proves the required live-auth-to-M1 sequence. |
| Persistence for M1 proof | Use `PERSISTENCE_PROVIDER=supabase` only when the execution prompt separately authorizes the staging direct PostgreSQL read path. `ADMIN_RUNTIME_MODE=mock`, `ADMIN_READ_MODEL_SOURCE=mock`, `ADMIN_M2_READ_MODEL_SOURCE=mock`, and `ADMIN_COMMAND_SOURCE=mock` keep commands unavailable. Mock persistence cannot prove a real staging `app.app_users` absence. |
| Independent SQL proof | Conditional, not assumed. A target-locked SELECT-only inspection is preferred when separately authorized and TLS/CA validation is demonstrably correct. Otherwise the report must describe no-app-user absence as inferred from the safe API denial and resolver ordering, not independently observed. |
| No-mutation proof | Resolver ordering denies before `requireAdminPermission` and before `admin.commands.m2`; mock/disabled command composition makes command execution unavailable. Authorized SQL inspection may add sanitized pre/post SELECT snapshots only. No DML or cleanup DML is ever allowed. |
| Output leak scan | Capture child stdout/stderr in an OS temporary file outside the repository; scan it without emitting matching text for literal token equality, JWT-like strings, Authorization headers, decoded-claim markers, DB URLs, passwords, service-role/anon keys, and Supabase secrets. Delete it after the pass/fail decision. |
| Cleanup | Kill and await the API child, close any read-only inspection pool, discard in-process token references, remove temporary files, and verify no credential-bearing file exists in the repository. Use a one-command scoped environment so child cleanup does not rely on changing a parent shell. |
| Verifier vehicle | Later implementation adds a disabled, local-only `api/scripts/supabase-live-auth-only-verify.mjs`, not a shared smoke tool. Without all gates it exits with a sanitized skipped result before network, DB, or child-process work. |
| Ubuntu commands | Bash-compatible commands and standard Linux environment variables are mandatory; the complete sequence is in `quickstart.md`. |

## 5. Official Supabase Documentation Gate

Immediately before a live execution, re-check only current official Supabase documentation for JWT verification, project issuer and JWKS endpoint format, access-token/session behavior, `authenticated` audience behavior, asymmetric signing algorithms, signing-key rotation/cache behavior, and empty-JWKS/shared-secret legacy behavior. Record the review date and documentation URLs in the later sanitized execution report, without recording tokens, raw claims, project URLs, or credentials.

The 57A verifier supports the project decision of asymmetric `ES256`/`RS256` JWKS verification only. No HS256/shared-secret/JWT-secret fallback, `/auth/v1/user` fallback, service-role credential, or anon credential is permitted. An empty or unusable JWKS is a fail-closed provider failure, not a reason to switch modes.

## 6. Runtime Composition Plan

The future local child starts only after validating these process-scoped settings:

```text
AUTH_PROVIDER=supabase
SUPABASE_PROJECT_REF=<approved-staging-project-ref>
SUPABASE_AUTH_AUDIENCE=authenticated
PERSISTENCE_PROVIDER=supabase
ADMIN_RUNTIME_MODE=mock
ADMIN_READ_MODEL_SOURCE=mock
ADMIN_M2_READ_MODEL_SOURCE=mock
ADMIN_COMMAND_SOURCE=mock
```

The direct PostgreSQL configuration necessary for `PERSISTENCE_PROVIDER=supabase` is separately authorized operational material, never checked in, never printed, and must use TLS verification. The approved run must prove that its database target corresponds to the same approved staging project. The composition selects real Supabase authentication and real persisted M1 reads while keeping Admin command execution absent/non-mutating. It must not open a database connection merely while parsing the authentication configuration; the connection is justified only when the M1 lookup is requested.

`AUTH_PROVIDER=mock`, a supplied mock adapter, an invalid Supabase config, an unavailable M1 repository, or a fallback to mock is a stop condition for the positive path.

## 7. Secure Token Injection Plan

The future verifier requires all three gates before doing anything external:

```text
SUPABASE_LIVE_AUTH_ONLY_VERIFY=true
SUPABASE_LIVE_AUTH_TARGET_ENVIRONMENT=staging
SUPABASE_LIVE_AUTH_ACCESS_TOKEN=<process-only-value>
```

It must also validate the approved `SUPABASE_PROJECT_REF` and use the resulting canonical issuer/JWKS endpoint. A missing gate produces a sanitized `skipped` result with no network request, database connection, API child, or file write.

The token is supplied as a scoped environment value to the verifier process, never via a positional argument, `.env`, shell script, terminal history, screenshot, documentation, chat transcript, or report. The script must retain it only for the duration of the request, redact it from errors, and clear local references in `finally`. Because a child cannot erase a parent shell's environment, the approved command must scope the variable to the one `node` invocation rather than export it.

## 8. Temporary API and Route Selection Plan

The verifier starts the already-built API as a child on loopback and waits for bounded readiness. It must not reuse a running server, alter deployment configuration, or bind outside `127.0.0.1`.

Source inspection found no authenticated GET Admin route that invokes the trusted Admin context. The current fallback boundary is therefore the exact POST route below, subject to an explicit new execution authorization because it is structurally an M2 route:

```text
POST /v1/admin/brands/<approved-staging-medway-brand-id>/instructors/global
```

The verifier sends one syntactically valid, non-sensitive JSON body and a fresh valid `Idempotency-Key`. It must use a confirmed canonical staging Medway UUID; it cannot reuse the mock fixture UUID or infer brand ownership from a course, request body, or token. With the known no-link scenario, the route parses the request, verifies the bearer token, performs M1 resolution, receives the safe `permission_denied` result for no application user, and returns `403` **before** any permission check or `admin.commands.m2` invocation.

This is not a command test and must never be treated as an M2 write. If source ordering changes, an executor is present, a `2xx` is returned, the real user is linked to an `app.app_users` record, or the required route exception is not specifically approved, stop before continuing. The plan preserves the specification's no-M2-write rule by requiring that explicit exception; without it, 57B is blocked pending a new read-only trusted-context endpoint rather than silently widening scope.

## 9. Optional SELECT-only Inspection Plan

Independent inspection is allowed only in an execution prompt that explicitly authorizes it. It must:

1. Lock the exact staging project reference, DB host, database, and approved read-only credential.
2. Require TLS with hostname and CA verification (`rejectUnauthorized=true`); never use `NODE_TLS_REJECT_UNAUTHORIZED=0`, `sslmode=disable`, or an unverified CA.
3. Use a transaction/session configured for read-only work where supported and a parameterized allowlist of `SELECT` statements only.
4. Avoid printing the raw subject. The verifier can retain it in memory for a parameterized lookup and report only boolean/count outcomes.
5. Optionally take sanitized pre/post aggregate snapshots scoped to a fresh, non-secret run marker to confirm no M2/M4 evidence was created. The marker must not be written to the database.

The approved SELECT set is limited to determining whether the verified subject has an `app.app_users` record and to sanitized pre/post counts relevant to the attempted route. It must not read broad user data, raw audit content, credentials, or unrelated brands. When inspection is absent, the report states that the missing-app-user condition is inferred from the API's safe denial rather than proved with SQL.

## 10. No-mutation and Negative-check Plan

The positive request is bounded to one safe-denial attempt. No retry with another real token, no authorization repair, no M2 lifecycle, no M4 evidence, and no cleanup mutation are permitted.

Before the positive attempt, perform these non-mutating negative HTTP checks against the temporary loopback child:

- no Authorization header: safe `401`;
- malformed Bearer header: safe `401`;
- duplicate Authorization header: safe `400`;
- query/body token field: existing request validation remains safe `400` where detected.

Record only response status, correlation reference if non-sensitive, and classification. Do not record headers, body text that could contain credentials, token values, raw JWT claims, provider exceptions, or database details.

## 11. Log and Secret Leakage Scan

The later script uses a `mktemp`/OS temporary directory outside the repository with restrictive access where the platform supports it. It redirects child output there, scans programmatically, returns only pass/fail category names, and removes the file in `finally`.

Scan at least for the exact supplied-token sequence, `Authorization:`, compact JWT-like triples, claim labels such as `app_metadata`, `user_metadata`, `sub`, and `role`, connection URL patterns, password markers, `service_role`, `anon`, PEM/private-key markers, and Supabase secret/key markers. The scanner must never print matching lines. A match, inaccessible log, retained temporary file, or new credential-bearing repository file is a security-leak failure: stop, contain local data, do not commit a report, and seek incident direction.

## 12. Cleanup Plan

In all success, failure, signal, and exception paths, the later verifier must:

1. Stop the loopback child process and confirm it exited.
2. Close any read-only PostgreSQL pool/session.
3. Drop in-memory references to the token and subject.
4. Delete temporary logs and verification artifacts outside the repository.
5. Verify that the repository contains no newly created credential file and that `git status -sb` contains only the explicitly planned implementation/report files.
6. Emit a sanitized cleanup-complete or cleanup-failed status, never diagnostic credentials.

Interrupted processes that cannot be shown stopped, or outputs that cannot be scanned and deleted, are failed runs—not evidence for 57B.

## 13. Ubuntu 24.04 Execution Plan

All future commands must run in Bash on Ubuntu 24.04 LTS and WSL2 Ubuntu 24.04, with UTF-8/LF files, case-sensitive imports, Linux paths, standard environment variables, and normal CA/TLS verification. No PowerShell requirement, Windows path, Windows certificate store, case-insensitive import assumption, or disabled TLS verification is permitted. The command sequence is in `quickstart.md` and uses only placeholder values for live credentials.

Docker/container validation is optional when the future change is strictly the local verifier script and documentation. It becomes mandatory if runtime source, dependencies, image configuration, or container behavior changes.

## 14. Validation Gates

Before the future live run: re-run typecheck, build, runtime smoke, disabled-verifier check, target and config validation, loopback binding check, and the official-documentation review. During the run: validate negative checks, real JWKS authentication, safe M1 denial, command unavailability, optional SELECT-only snapshots, log scan, and cleanup. After it: run `git diff --check`, focused secret/scope scans, and produce only a sanitized report.

The later disabled verifier must not create a connection, child, or file when its gates are absent.

## 15. Stop Conditions

Stop without repair, fallback, push, deployment, or commit when any of the following occurs:

- missing/expired token or token appears in any file, log, output, screenshot, or report;
- project ref/issuer/JWKS target mismatch, a production target, invalid config, unsupported signing mode, or unexpected JWKS failure;
- mock authentication or mock fallback in the positive path;
- binding outside loopback, temporary API startup failure, or unverified cleanup;
- an `app.app_users` link, Admin authority, `2xx` response, M2 record, or M4 evidence appears;
- route resolver ordering/executor composition no longer proves denial before mutation;
- a database inspection is assumed without fresh authorization, target lock, and verified TLS/CA;
- database mutation would be needed to proceed;
- a non-Linux-compatible behavior or disabled TLS is required;
- Git/source state changes unexpectedly or a token/secret would enter Git.

## 16. Documentation and Commit Plan

This planning commit contains only SpecKit files. The later authorized execution may create the sanitized `api/docs/supabase-live-auth-only-verification.md`, documenting target approval, Prompt 57A prerequisite, runtime composition, safeguards, JWKS result, provider-neutral principal outcome, M1 denial, no-M2/M4 proof, failures, cleanup, Ubuntu notes, Prompt 57C handoff, Prompt 58 handoff, and non-goals. It must contain no token, claims, subject, DB URL, or credential.

The future execution commit, only after the live run passes, is expected to be:

```text
test(api): verify live Supabase auth-only boundary
```

It may contain the disabled local verifier script, sanitized report, and narrowly related tests/docs. It may not contain frontend changes, migrations, seeds, M2/M4 mutation code, credentials, or deployment activation. No push or deployment is part of either phase.

## 17. Prompt 57C Handoff

Prompt 57C is a separate, explicitly authorized staging fixture phase if an authorized Admin-success proof becomes necessary. It must separately authorize linking the real `auth.users.id` to a staging `app.app_users` record and any Admin profile/role relationship, with preflight, one controlled transaction, verification, and sanitized reporting. 57B neither creates nor repairs that identity.
