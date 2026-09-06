# VPS Mock Deployment Checklist

## Purpose and scope

Use this checklist for the first mock-only staging deployment of the e-learning application on a Hostinger VPS through Dokploy. It validates repository access, the Docker/Dokploy build pipeline, API and web startup, API healthchecks, static SPA serving, `/admin` fallback, logs, and basic rollback readiness.

This is not a production deployment. The application is one platform with Medway and Elite as isolated brand scopes. It is not connected to database persistence, Supabase, real authentication, real admin identity or account-backed RBAC, payments, protected media, file storage/CDN, production scaling, production security hardening, or final domain/TLS configuration.

## Services and ports

The current Compose draft contains only:

- `api` — mock-backed Node HTTP skeleton.
- `web` — static Vite build served by Nginx.

Expected ports:

| Boundary | Port | Exposure |
| --- | ---: | --- |
| API container | `3000` | Internal-only by default |
| Web container | `80` | Internal container port |
| Web public/default mapping | `WEB_PORT=8080` | Public/mapped port |

The API is not publicly mapped by default. External API routing is intentionally deferred.

## Required environment

```text
NODE_ENV=production
ADMIN_RUNTIME_MODE=mock
VITE_ADMIN_DATA_SOURCE=mock
VITE_API_BASE_URL=http://localhost:3000
WEB_PORT=8080
```

Dokploy may inject these values through its UI. `.env` is for local/manual Compose use; `deploy/dokploy/.env.example` is a non-secret reference only. Do not add credentials or production secrets. No production secrets exist in this deployment boundary.

## Pre-deployment local checklist

Run from the repository root:

```text
git status

cd api
npm run typecheck
npm run build
npm run smoke:runtime

cd ../web
npm run typecheck
npm run build

cd ..
node deploy/scripts/container-smoke.mjs
docker compose -f deploy/dokploy/docker-compose.yml --env-file deploy/dokploy/.env.example config
```

Confirm generated `api/dist` and `web/dist` output remains ignored and is not committed.

### Pre-deploy reminder

Before an intentional push or Dokploy deployment, confirm:

- this deployment is intended for the VPS staging environment;
- the relevant local validation has passed;
- pushing to `dev` is intentional because Dokploy uses an **On Push** trigger;
- no secrets, credential-bearing `.env` files, or generated `dist`/`build` output are staged.

Review [DEPLOYMENT_CONTROL_POLICY.md](../../deploy/DEPLOYMENT_CONTROL_POLICY.md) before continuing.

## Git checklist before VPS/Dokploy

```text
git status
git branch
git add .
git commit -m "chore: add dokploy mock staging deployment docs"
git push origin dev
```

Keep active development on `dev`. Do not touch a production branch unless explicitly requested. Confirm local-only `.env` files, generated output, credentials, and unrelated work are not included.

## VPS preparation

- Confirm the VPS is reachable and has enough disk space.
- Confirm Docker is installed and running.
- Confirm Dokploy is installed and accessible.
- Confirm the repository is available through Git or a server checkout.
- Select the `dev` branch.
- Configure the required environment values.
- Confirm `WEB_PORT` does not conflict with another service.
- Leave reverse proxy, domain, and TLS configuration for the later deployment layer.

## Dokploy setup flow

UI labels may vary by Dokploy version:

1. Create a project/application.
2. Choose Docker Compose deployment.
3. Connect the GitHub repository or server repository path.
4. Select branch `dev`.
5. Set the Compose path to `deploy/dokploy/docker-compose.yml`.
6. If requested, set build context to the repository root.
7. Add the values above through Dokploy environment configuration.
8. Build and deploy.
9. Wait for the `api` healthcheck.
10. Confirm `web` starts after `api` is healthy.
11. Open the mapped port or assigned staging domain.

## Post-deployment checks

Use placeholders only; do not commit a real VPS address or domain:

```text
http://SERVER_IP:8080/
http://SERVER_IP:8080/admin

https://YOUR_STAGING_DOMAIN/
https://YOUR_STAGING_DOMAIN/admin
```

The domain/TLS examples are future reverse-proxy responsibilities and are not handled inside the app containers.

## Container, health, and logs

With VPS shell access:

```text
docker ps
docker logs elearning-api-staging --tail 100
docker logs elearning-web-staging --tail 100
```

Optional internal checks:

```text
docker exec elearning-api-staging node -e "fetch('http://127.0.0.1:3000/health').then(async r=>{console.log(r.status, await r.text()); process.exit(r.ok?0:1)}).catch(e=>{console.error(e); process.exit(1)})"
docker exec elearning-web-staging wget -qO- http://127.0.0.1/ | head
```

Exact shell tools can vary by base image. Dokploy UI logs may be used when available. For manual Compose logs:

```text
docker compose -f deploy/dokploy/docker-compose.yml --env-file deploy/dokploy/.env.example logs -f api
docker compose -f deploy/dokploy/docker-compose.yml --env-file deploy/dokploy/.env.example logs -f web
```

## Troubleshooting

- **Docker daemon unavailable:** verify the Docker service and Dokploy's Docker socket access.
- **Repository inaccessible:** check Git connection, repository path, and branch access without exposing secrets.
- **Wrong branch:** select `dev` and verify the deployed commit.
- **Compose path wrong:** use `deploy/dokploy/docker-compose.yml` relative to the repository root.
- **Build context wrong:** use the repository root so both Dockerfiles and their inputs are available.
- **API healthcheck fails:** inspect API logs, confirm `ADMIN_RUNTIME_MODE=mock`, and verify the internal listener is `0.0.0.0:3000`.
- **Web waits for API:** resolve the API healthcheck first; preserve the healthy dependency.
- **WEB_PORT conflict:** choose a free staging port; do not stop unrelated services.
- **`/admin` returns 404:** confirm the intended Nginx image/configuration and that the request reaches the web service; SPA fallback should return application HTML.
- **Old cached build:** verify commit/image digest and rebuild with cache controls when appropriate; avoid broad prune commands.
- **Missing environment:** compare Dokploy values with `.env.example` and keep the runtime mock-only.
- **`VITE_API_BASE_URL` confusion:** Vite values are build-time; changing this value requires rebuilding the web image. `localhost:3000` is the documented skeleton value, not a production routing solution.
- **Old browser version:** verify the deployed commit/image, then hard refresh or use a clean session.
- **Firewall blocks the port:** allow the selected web port through the VPS firewall; keep the API internal.

## Rollback and cleanup

1. Identify the last known-good commit, tag, or branch state.
2. Inspect Dokploy/container logs before rollback.
3. Redeploy that known-good revision.
4. Keep environment values unchanged unless environment caused the issue.
5. Recheck `/` and `/admin`.
6. Do not remove unrelated containers, images, or volumes.

Project-specific manual cleanup:

```text
docker stop elearning-api-staging elearning-web-staging
docker rm elearning-api-staging elearning-web-staging
```

Do not run broad Docker prune commands on a production VPS. Do not remove unrelated containers or volumes without an intentional persistent-volume plan.

## Success criteria

- `api` is healthy.
- `web` is running.
- `/` loads and `/admin` does not 404.
- Logs show no crash loop.
- Deployment is known to be mock-only.
- Medway and Elite remain brand scopes inside one application platform.
- No real provider integration is expected or configured.

## Next phase

Possible next technical phases are:

- Persistence/Auth Integration Boundary Plan;
- real admin read-model adapter design;
- Supabase schema/migration preparation, only when explicitly requested;
- protected media provider adapter planning.

Recommended next step: **Prompt 19B — Persistence/Auth Integration Boundary Plan**. Any future integration must preserve backend-authoritative permissions and Medway/Elite brand isolation.
