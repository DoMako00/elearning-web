# Deployment Readiness

## Current status

The repository now has Dockerfiles for local image preparation, but Compose, Dokploy configuration, and production deployment are intentionally not included yet. There is one application platform with two isolated educational brand scopes: Medway and Elite. Brand scope protects catalog, access, content, media, assessments, and admin operations; it is not a separate technical deployment platform.

## Current services

- **web** — Vite static frontend build.
- **api** — mock-backed Node HTTP skeleton.

Future deployment architecture may add a database, Redis/session or cache service, a worker, and a private media/storage provider. None are configured in the current runtime.

## API runtime

The API is mock-only. Its compiled entrypoint is `api/dist/main.js` and it exposes:

- `GET /health`
- `GET /ready`
- `GET /v1/admin/overview?brand=medway|elite`

The brand query parameter is development/staging skeleton behavior only, not production authorization. The API has no real authentication, persistence, providers, mutation endpoints, or protected-media delivery.

Run the locally verified API checks:

```text
cd api
npm run typecheck
npm run build
npm run smoke:runtime
```

## Web runtime

The web service produces a static Vite build. Its admin data source is selected through environment values:

```text
VITE_ADMIN_DATA_SOURCE=mock
VITE_API_BASE_URL=http://localhost:3000
```

`mock` is the default. `api` mode uses the read-only admin overview endpoint and does not create frontend authorization.

Run the local checks:

```text
cd web
npm run typecheck
npm run build
```

## Future Docker build boundary

A future API Docker build must provide a standalone TypeScript toolchain/build stage. The current API package scripts bridge to `web/node_modules` for TypeScript and must not rely on host dependencies inside a container. The image build must compile the API to `api/dist/main.js`; the eventual API container start command will run `node dist/main.js` from the API working directory.

Generated `api/dist` and `web/dist` directories are ignored and must not be committed. Root `.dockerignore` excludes generated output, dependencies, local environment files, and local editor/cache files while retaining source, package, TypeScript configuration, and documentation files required for future builds.

## Required before production deployment

- Real authentication and an authorization adapter
- Trusted server-side brand resolution
- Persistent data storage and backup strategy
- Provider integrations for payments and private media/storage
- Backend-authoritative admin command authorization
- Protected-media delivery controls
- Secrets management
- Monitoring, logs, and operational alerting

Dockerfiles should be added only after the standalone API build toolchain and deployment environment strategy are defined and verified.
## Dockerfiles

The repository now includes separate image definitions using the repository root as the build context:

- API: `deploy/docker/api.Dockerfile`
- Web: `deploy/docker/web.Dockerfile`

Build the mock-backed API image:

```text
docker build -f deploy/docker/api.Dockerfile -t elearning-api:local .
```

Build the web image in mock mode:

```text
docker build -f deploy/docker/web.Dockerfile -t elearning-web:local --build-arg VITE_ADMIN_DATA_SOURCE=mock --build-arg VITE_API_BASE_URL=http://localhost:3000 .
```

Build the web image against the local API overview skeleton:

```text
docker build -f deploy/docker/web.Dockerfile -t elearning-web:api-local --build-arg VITE_ADMIN_DATA_SOURCE=api --build-arg VITE_API_BASE_URL=http://localhost:3000 .
```

Run the images locally after they build:

```text
docker run --rm -p 3000:3000 --env-file api/.env.example elearning-api:local
docker run --rm -p 8080:80 elearning-web:local
```

The API image compiles TypeScript in a dedicated build stage using the locked web toolchain, then runs only `node dist/main.js` as a non-root user. The web image builds Vite in Node and serves only static output through Nginx with SPA fallback.

Vite `VITE_*` values are build-time configuration in this image. Changing `VITE_API_BASE_URL` or the admin data source requires rebuilding the web image until a future runtime configuration injection mechanism exists.

Current limitations remain: the API is mock-only; there is no Compose or Dokploy configuration; and there is no database, provider, real authentication, production secrets, protected-media delivery, or admin mutation surface.
## Container Runtime Smoke

After both local images exist, run the container boundary verification from the repository root:

```text
node deploy/scripts/container-smoke.mjs
```

The script uses only dedicated smoke containers and local host ports:

- API: `elearning-api-smoke`, host port `3200` mapped to container port `3000`.
- Web: `elearning-web-smoke`, host port `8081` mapped to container port `80`.

It checks Docker availability, required images, API health/readiness/brand overview behavior, API method and route guards, Nginx root serving, and SPA fallback for `/admin` and an unknown route. It stops only its own smoke containers and never removes images or unrelated containers.

This is local-only mock runtime verification. It is not Dokploy or production deployment and does not validate a database, authentication, payments, storage, CDN, media, notification providers, or production secrets.
## Prompt 17 — Dokploy Compose Draft

The deployment flow is now:

1. Build the local API and web images.
2. Run `node deploy/scripts/container-smoke.mjs` to verify the image/container boundaries.
3. Use [deploy/dokploy/docker-compose.yml](dokploy/docker-compose.yml) as the mock/staging Compose draft.

Prompt 17 supplements Prompt 16; it does not replace the container smoke check. The Compose/Dokploy draft remains mock-only and does not configure databases, authentication, payments, storage/media providers, workers, production domains, TLS, or production secrets.
## Prompt 18 — Dokploy staging deployment guide

The deployment progression is now:

1. Build the API and web Dockerfiles.
2. Run `node deploy/scripts/container-smoke.mjs`.
3. Use `deploy/dokploy/docker-compose.yml` as the mock/staging Compose draft.
4. Follow [deploy/dokploy/STAGING_DEPLOYMENT.md](dokploy/STAGING_DEPLOYMENT.md) for the VPS/Dokploy staging deployment guide.

Prompt 18 supplements Prompt 16; it does not replace container smoke verification. The staging deployment remains mock-only and defers production authentication, persistence, providers, domains, TLS, and secrets management.