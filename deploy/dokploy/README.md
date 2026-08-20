# Dokploy Staging Compose Draft

This directory contains a mock-only staging Compose draft for a Dokploy-style VPS deployment. It runs the existing API and web images as two services inside one application deployment boundary:

- `api` — the mock-backed Node HTTP skeleton.
- `web` — the static Vite build served by Nginx.

Medway and Elite remain brand scopes inside one application platform. This draft does not add a database, Supabase, real authentication, payment provider, storage/CDN/media provider, worker, queue, or notification service.

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
