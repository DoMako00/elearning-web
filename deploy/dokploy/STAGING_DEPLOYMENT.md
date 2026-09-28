# Mock Staging Deployment with Dokploy

## Scope

This guide describes the current mock-only staging deployment for a VPS using a Dokploy-style Docker Compose workflow. It is suitable for validating:

- API and web container startup;
- API health and readiness;
- static web serving;
- the admin shell at `/admin`;
- SPA fallback for client-side routes;
- Medway and Elite brand-scoped overview behavior through the mock runtime.

This is not a production deployment. It is not connected to a database, Supabase, real authentication, payments, protected media, file storage, CDN, notification provider, or any other external provider.

There is one application platform. Medway and Elite are isolated brand scopes inside that platform; they are not separate technical platforms.

## Current services

The Compose draft contains only:

- `api` — the mock-backed Node HTTP skeleton.
- `web` — the static Vite build served by Nginx.

No database, Redis, queue, worker, object storage, payment, media, or notification service is included.

## Ports and routing

- The web service publishes `WEB_PORT`, defaulting to `8080`.
- The API listens internally on port `3000` and is not published to the host by the current Compose draft.
- External API routing is intentionally not exposed yet.
- Domain routing, HTTPS/TLS, and any reverse proxy are later Dokploy or VPS responsibilities, not application-container responsibilities.

## Environment variables

The local reference file is [`.env.example`](.env.example):

```text
NODE_ENV=production
ADMIN_RUNTIME_MODE=mock
VITE_ADMIN_DATA_SOURCE=mock
VITE_API_BASE_URL=http://localhost:3000
WEB_PORT=8080
```

`ADMIN_RUNTIME_MODE=mock` is the only supported API runtime mode. `VITE_ADMIN_DATA_SOURCE=mock` keeps the web build independent of a running API. The current `VITE_*` values are build-time values for the static web image.

Dokploy may inject environment variables through its deployment UI instead of using a checked-out `.env` file. The committed `.env.example` is a local reference only. Do not commit `.env`, production secrets, provider credentials, tokens, or private endpoints.

## Local pre-deployment verification

Run the direct API checks:

```text
cd api
npm run typecheck
npm run build
npm run smoke:runtime
```

Run the web checks:

```text
cd ../web
npm run typecheck
npm run build
```

Return to the repository root and verify the built containers:

```text
cd ..
node deploy/scripts/container-smoke.mjs
```

Validate the Compose model without starting services:

```text
docker compose -f deploy/dokploy/docker-compose.yml --env-file deploy/dokploy/.env.example config
```

All of these checks are mock-only. Passing them does not prove production authentication, persistence, provider integration, or production security.

## Local Compose verification

From the repository root, start the staging draft with:

```text
docker compose -f deploy/dokploy/docker-compose.yml --env-file deploy/dokploy/.env.example up --build
```

The web service should be available at:

- `http://localhost:8080`
- `http://localhost:8080/admin`

The API is internal to the Compose network. Its healthcheck runs against:

```text
http://127.0.0.1:3000/health
```

Stop the project cleanly with:

```text
docker compose -f deploy/dokploy/docker-compose.yml --env-file deploy/dokploy/.env.example down
```

## VPS preparation checklist

Before using the draft on a VPS, confirm:

- Docker is installed and the daemon is running.
- Dokploy is installed and reachable.
- The repository is connected to Dokploy or is available on the server.
- The Compose file can be read from the repository root.
- Environment variables are configured through Dokploy or a server-local environment mechanism.
- `WEB_PORT` or the eventual reverse-proxy target is available.
- No unrelated service is already using the selected host port.
- Domain and TLS configuration are planned separately.

Domains, certificates, HTTPS termination, and reverse-proxy routing are later Dokploy/VPS responsibilities. They are not configured inside the API or web containers in this phase.

## Generic Dokploy deployment flow

Dokploy UI labels may vary by version. The generic flow is:

1. Create a Dokploy project or application.
2. Select a Docker Compose deployment type.
3. Point the deployment at the repository root.
4. Configure the Compose file path as:

   ```text
   deploy/dokploy/docker-compose.yml
   ```

5. Add the environment variables represented by `deploy/dokploy/.env.example`.
6. Build and deploy the Compose application.
7. Wait for the API healthcheck to become healthy.
8. Confirm that the web service starts after the healthy API dependency is available.
9. Open the assigned port or later configured domain.
10. Review service logs and health status before treating the deployment as a successful staging verification.

The deployment remains mock-only and should not be presented as production-ready.

## Health checks

API health inside its container:

```text
http://127.0.0.1:3000/health
```

Web health inside its container:

```text
http://127.0.0.1/
```

Public/local web checks:

```text
http://localhost:8080/
http://localhost:8080/admin
```

The API also exposes the read-only staging overview route internally:

```text
/v1/admin/overview?brand=medway
/v1/admin/overview?brand=elite
```

The brand query selector is development/staging skeleton behavior only. It is not production authorization.

## Logs

Local Compose logs:

```text
docker compose -f deploy/dokploy/docker-compose.yml --env-file deploy/dokploy/.env.example logs -f api
docker compose -f deploy/dokploy/docker-compose.yml --env-file deploy/dokploy/.env.example logs -f web
```

If available in the selected Dokploy version, use the Dokploy UI service log view for the same `api` and `web` services. Do not place secrets or provider payloads into logs while investigating.

## Troubleshooting

### Docker daemon unavailable

Run `docker version` and `docker compose version`. Start the Docker daemon or Docker Desktop Linux engine, then retry the validation. The deployment cannot start while the daemon is unavailable.

### API healthcheck failing

Inspect the API logs:

```text
docker compose -f deploy/dokploy/docker-compose.yml --env-file deploy/dokploy/.env.example logs api
```

Confirm that the image starts `node dist/main.js`, `ADMIN_RUNTIME_MODE` is `mock`, and the internal port is `3000`. The current API has no database or provider dependency that should be configured as a workaround.

### Web waits for API forever

The web service depends on the API healthcheck. Inspect API health and logs first, then inspect the Compose status:

```text
docker compose -f deploy/dokploy/docker-compose.yml --env-file deploy/dokploy/.env.example ps
docker compose -f deploy/dokploy/docker-compose.yml --env-file deploy/dokploy/.env.example logs api
```

Do not remove the health dependency to hide an API startup failure.

### Port already in use

Check the process or service using `WEB_PORT` (default `8080`) and stop or reconfigure only the intended project service. Do not stop unrelated containers. The API has no host port mapping in this draft.

### `/admin` returns 404

Confirm that the web container is serving the Nginx configuration from `deploy/docker/nginx.web.conf` and that the request is reaching the web service rather than an unrelated proxy. The static image must use SPA fallback to `/index.html`.

### Web loads but API mode does not work

The default staging build is mock mode. `VITE_ADMIN_DATA_SOURCE=api` is a build-time choice and the web image must be rebuilt after changing it. The current Compose draft does not proxy API requests through Nginx, and the API is internal-only, so API-mode browser connectivity is not a production deployment feature yet.

### Wrong `VITE_API_BASE_URL`

Review the build argument and environment value used by the web image. `VITE_API_BASE_URL` is embedded during `npm run build`; changing it requires rebuilding the web image. `localhost` refers to the browser/client context, not automatically to the Compose API container.

### Accidentally using mock data

Check `VITE_ADMIN_DATA_SOURCE` at image build time. `mock` is the intentional default. Seeing mock data is expected unless a later API-enabled build and a reachable trusted runtime path have been explicitly configured.

### Build cache confusion

Rebuild the affected image when source, build arguments, or Dockerfile inputs change. If necessary, use a targeted no-cache rebuild for the intended project image only:

```text
docker compose -f deploy/dokploy/docker-compose.yml --env-file deploy/dokploy/.env.example build --no-cache api web
```

Inspect the resulting image and logs before changing application or environment configuration.

## Safe rollback

For a staging rollback:

1. Inspect current API and web logs first.
2. Identify the previous known-good Git commit or tag.
3. Redeploy that commit/tag through the same Compose structure.
4. Keep the service names, healthchecks, and network structure stable.
5. Avoid changing application code and environment values at the same time unless required to restore service.
6. Stop or bring down only the project containers:

   ```text
   docker compose -f deploy/dokploy/docker-compose.yml --env-file deploy/dokploy/.env.example down
   ```

Do not remove unrelated containers or images as part of rollback.

## What this deployment does not prove

A successful staging deployment does not prove:

- real authentication;
- Supabase integration;
- database persistence;
- payment verification;
- protected media authorization or delivery;
- file storage or CDN behavior;
- real admin permissions against an authenticated user identity;
- production security controls;
- production scale, availability, or recovery behavior.

## Next phase

The next technical phase should choose a persistence and authentication integration plan, add real API read models behind the current contracts, introduce real admin command handlers gradually, and add provider adapters behind explicit boundaries.

Those changes must preserve Brand scope separation: Medway operations must not affect Elite records or access, and Elite operations must not affect Medway records or access.