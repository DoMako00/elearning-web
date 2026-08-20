# Runtime Smoke Verification

## Purpose

This document describes the lightweight runtime smoke checks required before Docker image work begins. The current backend is a mock-backed HTTP skeleton intended for local and staging-oriented verification only.

## Current Runtime Surface

The HTTP skeleton exposes:

- `GET /health`
- `GET /ready`
- `GET /v1/admin/overview?brand=medway`
- `GET /v1/admin/overview?brand=elite`

The overview endpoint is read-only and uses the backend admin module with in-memory read models. It returns no protected media URLs, provider payloads, tokens, or mutation capabilities.

## What Does Not Exist Yet

- Real authentication or authorization adapters
- Trusted production brand resolution
- Supabase or another database
- Payment, storage, CDN, video, PDF, or media providers
- Admin mutation endpoints
- Protected media delivery
- Docker Compose or Dokploy deployment

## Brand Scope

There is one application platform. Medway and Elite are brands inside that platform. The `brand` query parameter exists only for the development runtime skeleton; it is not production authority. Future runtime behavior must resolve brand from trusted server-side context and then enforce backend authorization and brand-scope validation.

## Frontend Data Modes

The admin frontend defaults to mock data:

```text
VITE_ADMIN_DATA_SOURCE=mock
```

To use the HTTP overview skeleton after a server start path is intentionally wired:

```text
VITE_ADMIN_DATA_SOURCE=api
VITE_API_BASE_URL=http://localhost:3000
```

API mode currently supports only the read-only admin overview endpoint. It does not silently fall back to mock data when the API fails.

## Local Verification Checklist

1. Run backend type validation:

   ```text
   web/node_modules/.bin/tsc.cmd -p api/tsconfig.json --pretty false
   ```

2. Run frontend validation:

   ```text
   cd web
   npm run typecheck
   npm run build
   ```

3. Invoke `runHttpSmokeSelfTest()` through future test tooling. The self-test is exported only and does not start a listener.

4. Once a safe explicit runtime start command exists, manually verify:

   ```text
   /health
   /ready
   /v1/admin/overview?brand=medway
   /v1/admin/overview?brand=elite
   ```

## Docker Readiness

Dockerfiles now exist for local image preparation. Run direct runtime smoke and container runtime smoke before treating the images as deployment-ready; Compose and Dokploy configuration remain deferred. Docker work must preserve mock-mode clarity until real authentication, trusted brand resolution, persistence, and provider integrations are introduced.

## Runtime Start Boundary

`api/src/main.ts` is the explicit runtime entrypoint. It starts the mock-backed HTTP skeleton only when the entry module is executed. `api/src/server.ts` remains import-safe and does not start a listener on import.

The current runtime accepts only mock mode:

```text
API_PORT=3000
API_HOST=0.0.0.0
ADMIN_RUNTIME_MODE=mock
NODE_ENV=development
```

The verified compiled API entrypoint exposes:

```text
GET /health
GET /ready
GET /v1/admin/overview?brand=medway
GET /v1/admin/overview?brand=elite
```

The frontend can use the overview skeleton with:

```text
VITE_ADMIN_DATA_SOURCE=api
VITE_API_BASE_URL=http://localhost:3000
```

This is not production-ready: there is no real authentication, trusted production brand resolver, persistence, provider integration, admin mutation surface, or protected media delivery.

The API build boundary emits `api/dist/main.js`; Dockerfiles remain deferred until controlled runtime smoke verification and a standalone Docker build toolchain are defined.

## Build Output Boundary

`api/tsconfig.json` remains the strict typecheck configuration and intentionally uses `noEmit`. The runtime build uses `api/tsconfig.build.json`, which emits CommonJS JavaScript with source maps into `api/dist`.

Build the API with:

```text
cd api
npm run build
```

The expected explicit runtime entry is `api/dist/main.js`. Once the build succeeds, start the API skeleton with:

```text
cd api
npm run start
```

`api/src/main.ts` remains the only listener-starting entry module. `api/src/server.ts` remains safe to import and does not start a listener itself. The current runtime is mock-only.

The API package scripts use the TypeScript compiler already available in `web/node_modules`; this is a local workspace bridge, not a standalone production dependency strategy. A future Docker build must provide its own verified TypeScript build toolchain, build the API, and run the compiled `api/dist/main.js` entrypoint.

The current admin and HTTP barrels export self-test modules, so their JavaScript files are emitted alongside runtime files. They are verification utilities only and are not run during application startup.
## Controlled Runtime Smoke Execution

Run the real local HTTP verification with:

```text
cd api
npm run smoke:runtime
```

The command builds the API, starts the compiled `dist/main.js` entrypoint on `127.0.0.1:3100` in mock mode, verifies health, readiness, Medway and Elite overview responses, safe invalid-brand failures, method handling, and unknown-route handling, then stops the child process it started.

The smoke runner uses no database, provider, or real authentication integration. It is a development verification of the mock-backed HTTP skeleton only. It must pass before Dockerfiles are created, but it does not make the runtime production-ready.
## Docker Readiness Status

The controlled runtime smoke has passed locally, but Dockerfiles have not been created yet. A future API Docker build must compile the API to `api/dist/main.js` and start the container with `node dist/main.js` from the API working directory.

Use [api/.env.example](../.env.example) and [web/.env.example](../../web/.env.example) as non-secret configuration references. `api/dist` and `web/dist` are generated output and should not be committed; they are excluded by the root `.gitignore` and `.dockerignore`.

The current runtime remains mock-only. Docker work still requires a standalone API TypeScript toolchain, real authentication, trusted production brand resolution, persistence, provider integrations, and an explicit production environment strategy.
## Docker Image Note

API and web Dockerfiles now exist under `deploy/docker/`. Local API runtime smoke should continue to pass before and after every image build. Container runtime smoke is intentionally deferred to the next prompt; image creation alone does not prove container endpoint behavior.
## Container Runtime Smoke

The existing runtime smoke checks the compiled Node API directly through a locally started process. The container smoke runner at `deploy/scripts/container-smoke.mjs` checks the Docker image and container boundaries instead: it starts the API and Nginx web images, exercises their mapped HTTP ports, verifies the API brand overview routes and the web SPA fallback, and cleans up its dedicated containers.

Both smoke layers are mock-only verification. Neither validates Supabase, a database, real authentication, payment providers, protected media, storage, CDN, or notification providers.