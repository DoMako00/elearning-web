# Deployment Control Policy

## Purpose

This policy controls how future changes move from local development to GitHub and then to Dokploy/VPS staging. It separates local work, validation, commits, pushes, and server deployment so a development action does not accidentally become a staging deployment.

## Current deployment model

- Dokploy staging is connected to the `dev` branch.
- The current mock staging deployment is working on the VPS.
- Dokploy's trigger type is currently **On Push**.
- A push to `dev` may automatically start a VPS/Dokploy build and deployment.
- The deployment is mock-only staging and is not production.
- Medway and Elite are brands inside one application platform, not separate technical platforms.

## Golden rule

> Local changes do not affect the server. Commits do not affect the server. Pushes to `dev` may affect the server.

Do not push until the change has been validated and intentionally approved for staging deployment.

## Standard workflow

1. Make local changes only.
2. Run the relevant local validation.
3. Review `git status` and the complete diff.
4. Commit locally after validation passes.
5. Push only when the change is approved for staging deployment.
6. After pushing, monitor the Dokploy deployment and verify the staging application.

Keep the push decision separate from the commit decision. A valid local commit does not automatically authorize a VPS deployment.

## Required validation before commit

### API

```text
cd api
npm run typecheck
npm run build
npm run smoke:runtime
```

### Web

```text
cd web
npm run typecheck
npm run build
```

### Root/container checks

```text
cd ..
node deploy/scripts/container-smoke.mjs
docker compose -f deploy/dokploy/docker-compose.yml --env-file deploy/dokploy/.env.example config
```

Documentation-only changes do not always require every heavy runtime validation. Runtime, API, Web, Docker, Compose, or deployment changes must run the relevant gates. If the impact is unclear, run all validations.

## Required checks before push

```text
git status
git diff --stat
git log --oneline -5
```

Before pushing, confirm:

- the active branch is `dev`;
- no `dist` or `build` output is staged;
- no secrets are staged;
- no `.env` files containing secrets are staged;
- no accidental Docker, Compose, or Dokploy changes are staged;
- no migration or provider integration was added unintentionally;
- server deployment is intended for this specific change.

## Push rules

- Push to `dev` only after required validation passes.
- Do not push WIP changes.
- Do not push broken local builds.
- Do not push source changes that intentionally skip required validation.
- Do not push when the server should not deploy; keep the commit local instead.
- Never push to `production` as part of normal development.
- Do not merge to or create releases from `production` unless explicitly requested in a later release task.

## Deployment monitoring after push

After an intentional push to `dev`, check Dokploy for:

- deployment started or intentionally did not start;
- repository clone completed;
- API and Web images built successfully;
- `elearning-api-staging` became healthy;
- `elearning-web-staging` started after the API dependency;
- logs show no crash loop or startup error.

Verify the staging public surface:

- `/` loads the web application;
- `/admin` returns the SPA and does not 404.

## Server impact classification

Every future task should identify one of these impact levels:

### A. Server impact: none

Documentation-only or planning work. No deployment is required. Push is optional, but remember that any push to `dev` may still trigger Dokploy while On Push remains enabled.

### B. Server impact: local-only

Source changes are tested locally but are not approved for VPS deployment yet. Do not push until explicit staging approval is available.

### C. Server impact: staging

The change is safe for the mock Dokploy staging environment after validation. An intentional push to `dev` is allowed.

### D. Server impact: sensitive staging

Database, authentication, provider, security, payment, or protected-media changes. These require explicit approval, a rollback plan, relevant manual verification, and deliberate deployment timing. They must not be casually pushed.

### E. Server impact: production

Production-impacting work is forbidden in this workflow unless explicitly requested later through a dedicated release/deployment task.

## Future prompt template

Future implementation prompts should include this header:

```text
Phase:
Scope:
Allowed changes:
Forbidden changes:
Validation:
Server impact:
Commit rule:
Push rule:
Deploy rule:
Rollback notes:
```

## Commit rules

- Commit after local validation passes.
- Use a clear, focused commit message.
- Do not commit generated `dist` or `build` output.
- Do not commit secrets.
- Do not commit `.env` files except safe `.env.example` files.
- Keep implementation phases small and reviewable.
- Keep a commit local when it is not ready or approved for staging.

## Docker and Dokploy rules

- Do not modify Dockerfiles or Compose files casually.
- Any Dockerfile or Compose change requires container smoke and Compose configuration validation.
- Any Dokploy-facing change requires an explicit server-impact classification.
- The current Dokploy deployment is mock-only staging.
- Do not change the Dokploy trigger type as part of ordinary feature work.
- Do not add domains, TLS assumptions, credentials, or production routing to the repository.

## Database, authentication, and provider rules

- Do not add Supabase, Postgres, authentication, payments, media, storage, CDN, queues, workers, or notification integrations without explicit phase approval.
- Future integrations must preserve backend-mediated authorization.
- Future integrations must preserve Medway and Elite isolation as brand scopes inside one application platform.
- Do not add SQL or migrations without an explicit migration phase and rollback plan.
- Never store production credentials or provider secrets in the repository.

DB, authentication, provider, security, payment, and protected-media work is classified as **sensitive staging** by default. A later approved task may narrow that classification only when its scope, validation gates, rollback plan, and deployment intent are explicit; it must not be treated as ordinary casual `dev` work.

## Rollback rule

If a push breaks staging:

1. Inspect Dokploy and container logs first.
2. Identify the last known-good commit.
3. Redeploy the last known-good commit or tag.
4. Keep environment values unchanged unless the environment caused the issue.
5. Recheck `/` and `/admin`.
6. Do not remove unrelated containers, images, or volumes.
7. Do not run broad Docker prune commands on the VPS unless intentionally planned.

## Current known-good baseline

- Mock staging deployed successfully on Dokploy.
- API is healthy.
- Web started successfully.
- Docker Compose deployed successfully.
- Active branch is `dev`.
- Runtime and deployment mode are mock-only.

This baseline is informational and intentionally does not record a VPS IP, domain, credential, or hard-coded commit hash.

## Prompt 34 environment-placeholder note

Adding names-only Supabase environment placeholders locally has no server impact. Adding real environment values through the Dokploy Environment UI may affect future deployments only after runtime code begins reading them and a deployment is explicitly approved. The committed templates contain no real values. A push to `dev` may still redeploy staging because the Dokploy trigger is **On Push**.

## Prompt 35 staging-migration planning note

The [M1 Staging Migration Apply Plan](../api/docs/m1-staging-migration-apply-plan.md) is documentation-only. A database migration application is not a Dokploy deployment, but it is a sensitive staging database mutation and requires explicit approval, target verification, and a rollback plan. Prompt 35 does not push; any future push to `dev` may still trigger Dokploy because the trigger remains **On Push**.

## Prompt 36 staging-database note

Prompt 36 applied the reviewed M1 schema once to the approved Supabase staging project; this database mutation was separate from Dokploy deployment. No push or deployment occurred. A future push to `dev` may redeploy the mock application because Dokploy remains **On Push**, but it does not automatically reapply the recorded Supabase migration.

## Prompt 36B verification note

Prompt 36B recorded read-only Dashboard verification of the staging exposure boundary and did not deploy or mutate Supabase settings. A future push may redeploy Dokploy because the trigger remains **On Push**, but it does not reapply database SQL.

## Prompt 37 adapter-boundary note

Prompt 37 adds only a local backend configuration boundary with `PERSISTENCE_PROVIDER=mock` as its default. It does not wire Dokploy to Supabase or change mock runtime values. A future push may still redeploy Dokploy because the trigger remains **On Push**, but this boundary neither connects to Supabase nor changes the active provider.

## Prompt 38 read-adapter note

Prompt 38 adds unused local read-adapter code only. Dokploy remains mock-backed and receives no Supabase transport, credential, provider, or runtime configuration change. A future push may still redeploy the mock application because the trigger is **On Push**, but it does not create a database connection or change the active provider.
## Prompt 39 status

The API image now carries the approved `pg` dependency for a future backend read transport, but no pool is constructed in mock runtime and no Supabase connection occurs. Dokploy values remain mock-only; this phase performs no push or deployment.
