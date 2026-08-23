# Quickstart: Prompt 57A Implementation Validation

## Purpose

This guide is for the later approved implementation phase. Prompt 57A remains local and
no-network: it uses dynamically generated test keys and local JWKS fixtures, never a real Supabase
token or staging credential.

## Ubuntu 24.04 Prerequisites

- Ubuntu 24.04 LTS or WSL2 Ubuntu 24.04.
- Node.js 22 and npm available in a bash-compatible shell.
- Docker and Docker Compose available only for the later container gates.
- No PowerShell-only requirement and no Windows-only runtime paths.
- Files use UTF-8/LF and case-correct imports; no Windows certificate store is required.

## Future Local Validation Commands

```bash
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

Install the web toolchain with `npm ci` from `/path/to/elearning/web` first when the API typecheck
requires the locked shared TypeScript executable.

## Required Feature Checks

Run the compiled JWT/JWKS adapter, configuration/composition, Bearer parser, trusted Admin context,
and authenticated Admin write-route selftests in addition to existing request-context, persistence,
M1/M2 repository, HTTP smoke, and runtime smoke checks. Expected results include:

- locally signed ES256/RS256 test JWTs verify only with correct issuer, `authenticated` audience,
  valid time claims, matching key, and UUID subject;
- invalid tokens and malformed transports deny safely without leaking token or provider detail;
- JWT role/metadata claims produce no Admin permission or brand authority;
- M1 remains responsible for Medway authority and Elite denial;
- `AUTH_PROVIDER=mock` remains unchanged;
- valid Supabase configuration constructs without database activity or network fetch at startup.

## Container Safety

Container smoke uses mock defaults and **no staging credentials**. Do not set real Supabase tokens,
database URLs, service-role/anon keys, JWT secrets, or production values for local/container
validation. TLS verification remains enabled; do not use `NODE_TLS_REJECT_UNAUTHORIZED=0`.

## Completion Boundaries

Before any local implementation commit, run `git diff --check`, review exact scope, and scan for
secrets, bearer tokens, JWTs, private keys, database URLs, passwords, migrations, seeds, frontend
changes, Dokploy activation, and Windows-only paths.

No production access, staging access, database mutation, migration, seed, push, or deployment is
part of Prompt 57A. Prompt 57B is a separate authorization for controlled live Supabase Admin
authentication verification.
