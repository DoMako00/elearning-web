# E-learning Web

This repository contains the standalone frontend for the e-learning application. It is a React and Vite application maintained at the repository root.

## Local development

Requirements: Node.js 22 and npm.

```sh
npm ci
npm run dev
```

Vite serves the app locally. For a production bundle, run:

```sh
npm run typecheck
npm run build
npm run preview
```

The build output is written to `dist/`.

## Frontend configuration

Copy `.env.example` to `.env.local` and configure only the values needed for the intended environment. Vite embeds `VITE_` values into the browser bundle, so these variables must contain public client configuration only.

Frontend environment variable names:

- `VITE_API_BASE_URL`
- `VITE_ADMIN_DATA_SOURCE`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_DASHBOARD_ENROLLMENT_STATE`

`VITE_API_BASE_URL` is the explicit HTTP API origin used by frontend API clients. The frontend calls that configured URL directly. It does not depend on a Docker Compose service named `api` or on an implicit same-network service name. Configure the value for each build/deployment environment. The independent backend lives in `DoMako00/elearning-api`.

Start the API separately using that repository's instructions, then run the frontend on its normal port 5173. The API must allow the exact frontend origin through `CORS_ALLOWED_ORIGINS`; it already supports `http://127.0.0.1:5173` and `http://localhost:5173` for local development. A different frontend port or deployment origin must be configured on the backend. Keep backend runtime and database settings out of this repository's environment files.

To check the Home data contracts against a running API, provide `STUDENT_API_BASE_URL` and a test account's `STUDENT_API_BEARER` in the current process environment, then run `node scripts/check-student-home-api.mjs`. `STUDENT_WEB_ORIGIN` optionally selects the frontend origin to check (default: `http://127.0.0.1:5173`). The check uses GET requests only and does not print or persist the bearer or profile data. It exits unsuccessfully when an endpoint, CORS response or data contract fails. This does not replace authenticated browser acceptance.

Never put database credentials, Supabase service-role/secret keys, payment secrets, or other server credentials in frontend environment variables.

## Independent web deployment

The root `Dockerfile` builds this frontend and serves the static Vite bundle with Nginx on port 8080. `VITE_API_BASE_URL` and the other frontend build variables can be passed as Docker build arguments. Nginx serves client-side routes through the SPA fallback; it does not proxy requests to a Compose API container.

The API is developed and deployed independently. Frontend and backend releases can be promoted separately.
