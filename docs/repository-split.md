# Repository split: frontend promotion

## Source and history

The old integrated repository layout at `origin/dev` kept the React/Vite application in `web/`, with the API in `api/`, Supabase schema/import/test material in `supabase/`, and shared deployment/specification material in `deploy/` and `specs/`.

The frontend source used for this promotion is exactly `origin/dev:web/` at commit `8fc10ddb0f2abe326a925c02feb3cc3078786df4`. Its files were moved to the repository root so normal frontend commands and Vite configuration work without entering a nested `web/` directory. The React source, route definitions, static assets, package versions, lockfile, API/auth clients, mock/live selection, styles, and visual behavior were taken from that source tree without a UI redesign.

The branch is based on the verified `origin/main` commit `b6db7cc19966caa3ff51736997a88bde1c90f4bb` and is named `split/frontend-main`. The PR is intended to replace the old root `web/` layout with the frontend tree sourced from `origin/dev:web/`; it is not a merge of the divergent `dev` history.

## Main-only commit review

At preflight, `origin/main` had one commit not reachable from `origin/dev`: merge commit `b6db7cc19966caa3ff51736997a88bde1c90f4bb` (`feat(progress): add weekly goal card`). Relative to its first parent, it added the original `WeeklyGoalCard` component, barrel export, and props type. Those files are represented in the audited `origin/dev:web/` frontend. The current `origin/dev` component has since evolved (including its unavailable-activity state, goal editing, and styling), so the frontend-only tree uses the latest `origin/dev` version as required. No distinct behavior from the older main-only version was retained as a separate implementation.

## Frontend/backend boundary

The frontend is now the complete repository root. Backend source, Supabase migrations, and backend-only deployment/runtime definitions are not part of this frontend branch. The frontend continues to read `VITE_API_BASE_URL` for direct HTTP API requests and retains its existing public Supabase Auth configuration boundary. Vite variables are public browser configuration; backend/database secrets do not belong here.

A future backend extraction must use the preserved integrated source from `dev` or `rescue/pre-split-baseline`. The rescue branch points to Phase 00 audit commit `c4535e9a096bef55d7ab6c684bb3a7f42ee79c91`, whose parent is the source baseline above. This frontend promotion does not remove backend code from either `dev` or the rescue branch.

## Deployment status

No staging cutover occurred. No Dokploy settings, current staging containers, Supabase configuration, database state, or running deployment were changed. The current integrated staging deployment remains tied to the `dev` repository. This branch only prepares an independently buildable and deployable frontend image; configuring the new production/staging API URL and switching web deployment are separate, later operations.
