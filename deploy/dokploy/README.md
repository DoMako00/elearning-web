# Dokploy Staging Compose Draft

This directory contains a Dokploy-style VPS Compose deployment. It starts in mock mode by default and can be switched to the reviewed Supabase-backed administrative read runtime through the Dokploy Environment UI. It runs the existing API and web images as two services inside one application deployment boundary:

- `api` — the Node HTTP API, mock-backed by default.
- `web` — the static Vite build served by Nginx.

Medway and Elite remain brand scopes inside one application platform. Supabase remains external to this Compose deployment; its URL, database connection, and auth configuration are entered in Dokploy and are never committed. This draft does not add a database container, payment provider, storage/CDN/media provider, worker, queue, or notification service.

## Same-origin API route

The web Nginx container proxies `/api/*` to the private `api` Compose service. Use `VITE_API_BASE_URL=/api` for Dokploy. This keeps browser requests on the web domain and avoids exposing the API container port or configuring an open CORS policy.

## Supabase-backed admin staging

Only after the API and database release are approved, set these values in the **Dokploy Environment** tab, not in this repository:

```text
ADMIN_RUNTIME_MODE=supabase
PERSISTENCE_PROVIDER=supabase
AUTH_PROVIDER=supabase
ADMIN_READ_MODEL_SOURCE=postgres
ADMIN_M2_READ_MODEL_SOURCE=postgres
ADMIN_COMMAND_SOURCE=mock

SUPABASE_PROJECT_REF=<project reference>
SUPABASE_URL=https://<project reference>.supabase.co
SUPABASE_PUBLISHABLE_KEY=<publishable key>
SUPABASE_DB_URL=<server-only PostgreSQL connection URL with sslmode=verify-full>
PGSSLROOTCERT=<optional PEM root certificate from Supabase Connect>

VITE_ADMIN_DATA_SOURCE=api
VITE_API_BASE_URL=/api
VITE_SUPABASE_URL=https://<project reference>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<publishable key>
```

`SUPABASE_DB_URL` is server-only. `PGSSLROOTCERT` is an optional trusted TLS certificate used with `rejectUnauthorized: true`. Never create a `VITE_SUPABASE_DB_URL`, never put a service-role/secret key in a `VITE_*` setting, and never paste real values into `.env.example`.

## Configure and run locally

Copy the non-secret example file before starting:

```text
cd deploy/dokploy
copy .env.example .env
```

On shells with `cp`, the equivalent is:

```text
cp .env.example .env
```

Start the staging draft from this directory:

```text
docker compose --env-file .env up --build
```

The web service is published on port `8080` by default:

- `http://localhost:8080`
- `http://localhost:8080/admin`

Stop the draft with:

```text
docker compose --env-file .env down
```

Inspect service logs with:

```text
docker compose --env-file .env logs -f api
docker compose --env-file .env logs -f web
```

Dokploy may provide environment variables through its deployment UI instead of copying `.env`. Do not commit a real `.env` file or place secrets in `.env.example`.

## Current limitations

This is a staging/mock Compose draft, not a production deployment. It does not configure:

- production domains or HTTPS/TLS;
- an external reverse proxy or Dokploy routing labels;
- real authentication or trusted production brand resolution;
- persistence, backups, or database services;
- payments, storage, CDN, protected media, or notification providers;
- admin mutation endpoints or production secrets.

The API healthcheck runs on the internal service port. The web service waits for the API healthcheck before starting. API host publishing is intentionally omitted; future routing can be added by a later Compose/Dokploy task.
## Detailed staging guide

This README is the quickstart. For VPS preparation, Dokploy deployment flow, health checks, troubleshooting, rollback, and staging limitations, read [STAGING_DEPLOYMENT.md](STAGING_DEPLOYMENT.md).

For the actionable first-VPS execution sequence, use [VPS_MOCK_DEPLOYMENT_CHECKLIST.md](VPS_MOCK_DEPLOYMENT_CHECKLIST.md). The documents have distinct roles:

- this README is the short Compose quickstart;
- `STAGING_DEPLOYMENT.md` is the detailed staging deployment guide;
- `VPS_MOCK_DEPLOYMENT_CHECKLIST.md` is the execution checklist for the first Dokploy mock deployment.

### Push warning

Dokploy is connected to the `dev` branch with an **On Push** trigger. A push to `dev` may start a VPS deployment. Follow the repository [Deployment Control Policy](../../deploy/DEPLOYMENT_CONTROL_POLICY.md) and validate/approve changes before pushing.
