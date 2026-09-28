# Quickstart: Future Prompt 57B Execution (Ubuntu 24.04)

> This document is a future execution runbook. Do not run the gated command until a new prompt explicitly authorizes the exact staging target, the process-only access token, and any required target-locked read-only database inspection.

## Preconditions

- Ubuntu 24.04 LTS or WSL2 Ubuntu 24.04 with Bash, Node.js 22, trusted CA material, and no `NODE_TLS_REJECT_UNAUTHORIZED=0`.
- Prompt 57A commit and its current validation are present.
- The working tree is reviewed; no production configuration, token, or credential is present.
- The actual staging project reference, canonical Medway brand UUID, and real token are provided only through the separate execution authorization. Do not put them in this file, a `.env`, shell history, screenshots, chat logs, commits, or reports.

## Local Validation Before a Live Run

```bash
cd /path/to/elearning/api
npm ci
npm run typecheck
npm run build
npm run smoke:runtime
```

After the future verifier script is implemented, first prove it is disabled by default:

```bash
node scripts/supabase-live-auth-only-verify.mjs
```

Expected result: a sanitized skip and no API child, external network, database connection, or file write.

## Gated Staging-only Execution Shape

Use placeholders only. Supply the real value interactively through an approved local secure mechanism and scope it to this single process; never copy an actual token into a command transcript.

```bash
cd /path/to/elearning/api
env \
  SUPABASE_LIVE_AUTH_ONLY_VERIFY=true \
  SUPABASE_LIVE_AUTH_TARGET_ENVIRONMENT=staging \
  AUTH_PROVIDER=supabase \
  SUPABASE_PROJECT_REF='<approved-staging-project-ref>' \
  SUPABASE_AUTH_AUDIENCE=authenticated \
  PERSISTENCE_PROVIDER=supabase \
  ADMIN_RUNTIME_MODE=mock \
  ADMIN_READ_MODEL_SOURCE=mock \
  ADMIN_M2_READ_MODEL_SOURCE=mock \
  ADMIN_COMMAND_SOURCE=mock \
  SUPABASE_LIVE_AUTH_ACCESS_TOKEN='<process-only-token>' \
  node scripts/supabase-live-auth-only-verify.mjs
```

If the separately authorized run requires direct M1/SELECT-only verification, inject its approved read-only PostgreSQL configuration and trusted CA path through the same single `env` invocation. Never record a real database URL, password, certificate path, or token in a committed file or captured output. The verifier must reject uncertain TLS/CA validation rather than weakening it.

## Docker and Container Validation

Docker/container validation is optional when the later change is only the disabled local verifier script and sanitized documentation. It becomes mandatory if a runtime file, dependency, Dockerfile, Compose configuration, or container behavior changes. In that case run the project’s Linux Docker configuration, no-cache API build, and loopback-only container smoke using no staging credentials.

## Safety and Cleanup

- No PowerShell-only workflow or Windows-only runtime path is permitted.
- Do not access production, push, deploy, trigger Dokploy, or use Supabase MCP.
- Stop for a token/output leak, target mismatch, mock fallback, unexpected Admin success/existing application user, M2/M4 evidence, non-loopback binding, invalid TLS, or cleanup failure.
- The script must stop the temporary child, delete temporary logs, clear local references, and scan output without displaying any matched secret before it reports completion.
