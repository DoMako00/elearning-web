# Student UI — step 01: shell and Home

Date: 2026-10-20

## Working sources

- Frontend: standalone `DoMako00/elearning-web`, branch `fix/student-reference-ui`, based on `main` at `a8bcb6dbde141ac33bd4fcfe19c3b11053dedf54`.
- Reference: `shehvb/E-Learning-stage-web`, `dev` at `81cc155a4c6c25788bc30bbbdb9afa0faf5fa3d5`.
- Backend fix publication: the separate clean `elearning-api` checkout, branch `fix/student-profile-claim-projection`, based on `release/whole-app-real-data-integration` at `47d9b3f6867e3ef12cd875b4fcfc0d37f9a805f9`. The same one-line fix was initially developed in the existing `backend` checkout at `c775ac67aff17fb8cc3879f23e729f7136b152e8`.
- The pre-existing `frontend` snapshot and the original `backend` checkout were preserved. Frontend and backend changes are published separately for review; production deployment is a separate action.

## Changes

- Restore the white Student shell, reference sidebar width and compact header scale with Student-scoped CSS; shared/Admin tokens are untouched.
- Restore the search/account Home header while retaining the existing account and notification API behavior.
- Keep the reference Bento rows and container queries. Reserve usable card heights on short desktop displays and make the Home content area scroll rather than clipping the rows. Preserve the four-row tablet layout.
- Correct the Empty Learning State artwork URL after its move into `features/student/components`.
- Remove backend/database settings and contradictory mock/proxy instructions from the frontend environment example. The frontend uses an explicit independent API URL.
- Add an opt-in, read-only Home API verification script. It receives the API URL and bearer from process environment and prints neither credentials nor profile records.
- Backend: replace the nonexistent `student_account_claims.claimed_at` column with the persisted `setup_consumed_at` lifecycle field in the Student profile projection. No migration, data write, response-shape or authorization change.

## Protected work

No changes to Framer Motion, CSS keyframes/transitions, ScreenStack timing, route guards, Student scope resolution, media authorization, playback evidence, progress writes or Admin components.

## Verification

| Evidence | Result / boundary |
| --- | --- |
| Frontend `npx tsc --noEmit` | Passed |
| Frontend production build | Passed; missing artwork warning resolved. Existing large chunk warning remains. |
| Frontend tests | 18 files, 110 tests passed after changes |
| Backend build/tests | 54 self-test suites passed in the original local integration checkout; all 52 suites passed again in the clean release-based publication checkout |
| Backend runtime smoke | Passed against its explicit local mock smoke configuration; not real database/product acceptance |
| Actual local PostgreSQL schema | Corrected profile query successfully PREPAREs and EXPLAINs; production claim expression evaluated for not-issued, unclaimed and claimed cases |
| Populated local profile read | Skipped: selected local acceptance database contains no Student auth subject. No fixture was inserted. |
| Home responsive visual preview | New shell CSS temporarily applied in the existing authenticated production tab: viewport 1920×880, 1280×720 and 1024×768. No horizontal page overflow at laptop/tablet sizes; Home rows reachable through its content scroll container. This previews CSS with real data, not the full changed frontend build. |
| Mobile rendering | Existing Home renders at 390×844 with no horizontal page overflow. Mobile navigation acceptance remains unverified because browser input timed out. Mobile motion code is unchanged. |
| Production cleanup | Temporary preview removed by reloading. Original greeting and canvas background verified restored. No production data was modified. |

## Read-only production API findings

The API origin was read from the web deployment's public build configuration. The user supplied a temporary test-account bearer; no token is recorded in this repository.

- `/v1/auth/methods`: 200.
- `/v1/student/progress`: 200.
- `/v1/student/preferences`: 200.
- `/v1/student/assignments`: 200.
- Student course reads for the session's actual Brand, both `mine` and `explore`: 200.
- `/v1/student/me`: **503**. The local source projection references `claimed_at`, absent from the migration schema and from the local database. The local fix uses `setup_consumed_at`, which the account-claim writer actually persists. This strongly explains the observed failure; recovery on the deployed server must be confirmed after the fix is deployed.
- API responses allow `http://127.0.0.1:5173` through CORS.
- No mutations, goal saves, enrollment changes, media playback or database migrations were performed against production.

## Screenshots

These are authenticated CSS-preview evidence, not evidence of a deployment or a local authenticated frontend session. The desktop screenshot is scaled to 1344×616 while the observed DOM viewport was 1920×880.

- [Before](student-ui-evidence/home-before.jpg)
- [Desktop CSS preview](student-ui-evidence/home-after-1920.jpg)
- [Short laptop CSS preview](student-ui-evidence/home-after-1280.jpg)
- [Tablet CSS preview](student-ui-evidence/home-after-1024.jpg)
- [Existing mobile Home](student-ui-evidence/home-mobile-390.jpg)

## Acceptance still required

This step is locally implemented, not accepted on production. The backend profile fix needs promotion through the user's release process, followed by a successful authenticated `/v1/student/me` read. The changed frontend build also needs an authenticated browser session on a separate local/test frontend with the intended API, including real goal-save and navigation checks in a disposable test account. No production deployment is authorized by this report.
