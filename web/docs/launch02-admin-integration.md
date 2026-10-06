# Launch-02 Admin integration

## Source and scope

- Frontend base: `4066ca5346622612ad05b8a62d78e9c6a076d697`.
- Frontend branch: `launch/02-admin-live-integration`.
- Backend media-read correction: PR #24, normal merge `ae24f94e590cf5c99517e92bc3b90e0aeef86f0a`.
- Only frontend files under `web/` are included in this frontend change.
- Instructor management is an Admin capability; an instructor portal is deferred.

## Page/API inventory

| Admin surface | API mode | Integration |
| --- | --- | --- |
| Sign-in | Real API | Supabase email OTP followed by backend session/device establishment |
| Overview | Partial API | Available live counts only; unsupported analytics are not fabricated |
| Students | Real API | Search/list, provisioning, detail, subscription summary, supported security actions |
| Subscriptions | Real API | Manual orders, approval/rejection, subscription detail/cancellation |
| Payments | Real API | Existing manual-payment review contracts |
| Courses | Real API | Brand catalogue, course metadata and instructor assignments |
| Course builder | Real API | Chapters, lessons, resources, direct private media upload/verification/publication |
| Published media management | Real API | Safe saved-media inventory and confirmed withdrawal; requires backend PR #24 deployment |
| Instructors | Real API | Persisted directory, creation, detail and supported brand/course assignments |
| Content and Security | Partial API | Current supported operations and truthful unavailable states |
| Assessments, audit, role management and future commercial engines | Not launch required | Deferred; no new product implementation |

API mode does not fall back to mock responses when an API request fails. Development preview modules remain in the repository. The Student frontend is outside this integration scope.

## UI and flow changes

- Preserve the existing Admin shell, palette and animations.
- Use the shared right-side action drawer, 40% width on desktop, with a blurred backdrop.
- Keep long content scrolling within drawers/outline panels; contain table overflow within the table region.
- Use real loading, empty, error and permission states.
- Require confirmed backend success for mutations and refresh persisted data afterwards.
- Show the one-time setup credential returned by provisioning. It is a setup/claim code, **not a password**.
- Preserve optional Student code semantics.
- Upload file bytes directly to private R2; do not proxy them through the API server.
- Use the backend multipart threshold and maximum-size policy. Show actual browser upload progress for small PUTs.
- Reject real-content uploads while the backend uses its acceptance object namespace.
- Retrieve saved asset IDs after refresh for media withdrawal. Preserve stored files and audit history.
- Do not display or log signed delivery/upload URLs.

## Runtime configuration

Required frontend configuration: `VITE_ADMIN_DATA_SOURCE=api`, `VITE_API_BASE_URL`, `VITE_SUPABASE_URL`, and `VITE_SUPABASE_PUBLISHABLE_KEY`.

Server secrets, service-role credentials, DB connection strings, R2 credentials and SMTP passwords must never be included in frontend configuration.

## Validation and remaining acceptance

- Dependency install, TypeScript and production build passed locally.
- The repository has no frontend test script; no automated frontend test-suite count is claimed.
- Live authenticated Elite Students list, name search and Mohamed Salah detail were observed.
- Student detail drawer at 2528px viewport measured 1011px, with no horizontal page or drawer overflow.
- Backend correction passed 40 suites, zero failed/skipped, boundaries, runtime smoke and Docker build; GitHub CI passed.

The complete Launch-02 acceptance is **pending**. Remaining gates include exact shadow deployment verification of the media-read correction, the owner-selected real Biochemistry video upload/verification/publication, remaining commercial/security browser operations, and exact frontend staging deployment.

Use the existing Elite `ELT-BIO` course and its existing Carbohydrates lesson. Do not generate dummy media or clean up real course content. An optional PDF is not a blocker.

Mohamed Salah currently appears pending in Elite, without a live session/device in the observed Admin read. Do not report revocation or protected-delivery acceptance without establishing the required controlled state through the supported flows.

Launch-01 and Phase 08 remain complete. Main, PR #11, Google configuration and the old stack are outside this change.

## Final layout follow-up

Chapter and lesson editing now reuse the existing right-side action drawer instead of expanding the course card. The existing drawer animation, backdrop blur, mutation version checks and idempotency handling remain intact.

Authenticated browser layout checks passed at a 1366 x 768 desktop viewport and a 390 x 844 mobile override: no document or drawer horizontal overflow was observed. Desktop drawer width was 546.39 px (40% of 1366 px). Temporary viewport overrides were reset afterward. No course or lesson mutation was submitted during these checks.

Typecheck, production build and git diff --check passed after this change. The existing large-bundle warning remains.

Live media acceptance remains pending deployment of backend merge ae24f94e590cf5c99517e92bc3b90e0aeef86f0a. The public shadow OpenAPI still lacks the authorized lesson-media GET contract at the time of this check. No owner-approved lecture file has been selected or uploaded.

## Super Admin media permission correction

Read-only ELITE inspection confirmed that the owner account resolves to an active app user, active Admin profile and effective platform_owner assignment. Its existing global-brand authorization was correct; the role-to-permission mapping for admin.media.manage was missing.

An owner-authorized, narrow transaction added only that mapping to the existing platform_owner role and retained an immutable command receipt and audit event (correlation launch02-owner-media-permission-20261006). A follow-up database query verified the active permission mapping and audit evidence. No normal Admin assignment, brand assignment, identity, student record, schema or migration was changed. The frontend's generic 403 message now distinguishes required permission and target-brand authorization rather than asserting that brand scope alone is the cause.

This verifies the persisted permission repair; it does not claim a successful real lecture upload or replace the pending shadow media-read contract deployment gate.

## Live media-contract diagnostic

The authenticated Super Admin read-only upload-access check now passes the authorization boundary but returns HTTP 405 on the lesson-media GET collection route. The shadow public OpenAPI still advertises POST only for that path. This confirms the missing deployment contract rather than a remaining brand denial. The uploader exposes a read-only Check upload access action, and HTTP 405 has a specific deployment-version message. No file upload, asset creation or publication was submitted during this diagnostic. Deploy backend merge ae24f94e590cf5c99517e92bc3b90e0aeef86f0a before resuming media acceptance.

## Shadow deployment update

The owner requested a manual deployment while unavailable. The Dokploy Deploy action started, and public runtime verification now confirms the merged Admin media-read contract is active. Shadow health, readiness, OpenAPI and docs return HTTP 200; the existing old API health/readiness and old frontend root also return HTTP 200. The exact runtime commit SHA was not independently visible without opening the sensitive Deployments view, so it is recorded as not independently verified.

Authenticated, read-only Admin Check upload access now succeeds for the Elite Biochemistry lesson. The policy response reports the storage namespace is still set to acceptance. No media file has been uploaded. Before a real lecture upload, change only MEDIA_OBJECT_KEY_PREFIX to the production namespace `media` through a safe Dokploy mechanism; do not expose existing environment values. The Deployments page exposed the deployment webhook in its automatic snapshot, so owner rotation is required. Autodeploy was observed disabled on the app's General page.
