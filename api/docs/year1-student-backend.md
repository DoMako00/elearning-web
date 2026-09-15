# Year 1 MVP backend: structure and student reads

## Scope and authoritative sources

Commercial courses live in `app.brand_courses`. Their structure lives in
`app.course_chapters` and `app.course_lessons`. Shared reference catalogues use
`academic_institutions -> academic_levels -> academic_semesters -> academic_modules`
and `academic_module_chapters`; those reference topics are not delivery resources.

`app.lesson_resources` already holds private resource metadata, with no storage
binding. No new schema or resource rows are needed for this phase. A lesson with
no visible resource returns `no_media`. A published metadata resource returns
`pending_media`; the deterministic first published resource is identified by
`resourceId`. Draft/archived resources remain hidden. `ready` is reserved and is
never emitted here. `playbackAvailable` is always false, and `lessonsWithMedia`
is always zero. No durations, storage keys, URLs or content bodies are returned.

Before this change, there were no student course HTTP routes. The generic student
request-context builder had in-memory wiring; real M1 identity repositories and
the Supabase JWT verifier existed. This implementation reuses that verifier and
the existing private Postgres read transport, adding only a course-read scope.
Admin course reads already returned `cataloguePresentation`.

Existing Admin read routes remain unchanged:

- `/v1/admin/curriculum/institutions` and `/brand-access`
- `/v1/admin/curriculum/levels`, `/semesters`, `/modules`, `/modules/{moduleId}`
- `/v1/admin/brands/{brandId}/courses` and `/courses/{courseId}`
- `/v1/admin/brands/{brandId}/courses/{courseId}/chapters`, `/lessons`, `/resources`

## Controlled data

The existing 033 import has two Medway/BUC students, two Elite/BUC students and one
Nexus/Delta student, all at Level 1 / Semester 1. These are synthetic acceptance
records, without Auth users or login capability. Import 030 supplies the accepted
five Elite subject courses, one chapter each, and 49 lessons (10/3/9/14/13).

New import `034_controlled_year1_course_shells.sql` must follow 030. It adds six
Medway/BUC subject shells and eight Nexus/Delta module shells from the existing
eligible catalogue (blocked/retired modules are excluded). It copies only existing
active topic titles into lessons. Subjects/modules without an accepted outline
have zero lessons. It publishes only the controlled shell/child identities; this
is visibility of structure, not publication of playable media or an access grant.

Expected local inventory after 033, 030, 034:

| Brand | Institution | Presentation | Courses | Chapters | Lessons | Students |
| --- | --- | --- | ---: | ---: | ---: | ---: |
| Medway | BUC | subject_based | 6 | 4 | 49 | 2 |
| Elite | BUC | subject_based | 5 | 5 | 49 | 2 |
| Nexus | Delta | module_based | 8 | 4 | 49 | 1 |

Import 034 checks the accepted catalogue inventory and controlled identity/outline
conflicts before publishing. It is transactional and replayable. It does not
remove existing academic access mappings or mutate unrelated courses/resources.
No migration is added, and no cloud data has been changed by this task.

## Student API and authorization

- `GET /v1/student/courses?brand=elite&page=1&pageSize=25`
- `GET /v1/student/courses/{courseId}?brand=elite`
- `GET /v1/student/courses/{courseId}/lessons?brand=elite`

The response envelope is `{ ok: true, correlationId, data }`. Lists return
`data.items` and `data.pagination`. Details return the course with nested ordered
chapters/lessons. The lessons route flattens lessons in chapter/sibling order.
OpenAPI contains the complete response schemas.

Bearer verification uses the existing issuer/audience/signature/expiry rules.
The verified subject must resolve to an active app user, student profile and
time-valid brand membership, then a valid private academic placement with active
brand/institution access. Medway and Elite are scoped to BUC; Nexus to Delta.
Courses must match the same institution, level and semester. Draft/archived
courses, chapters and lessons are hidden. First-year presentation mismatches are
hidden; the controlled import creates the intended presentation explicitly.

Brand is optional for a single eligible membership. Multiple memberships require
an explicit eligible commercial brand. `brand=all`, institutional brand values,
client-supplied student IDs, academic placement overrides and repeated/unknown
query parameters are rejected. Scope is rechecked with the course query. JWT
`user_metadata` does not grant authority. No enrollment/subscription is fabricated.

No permissions are added to admin roles and no admin impersonation endpoint is
introduced. Real student requests are supported once real owner-managed Auth
users are mapped to the application's student records. The controlled synthetic
identities alone cannot satisfy a real login. This task creates no Auth users.

The student service is wired only when both persistence and authentication use
Supabase. Disabled/missing real runtime returns 503 (or 401 when no token is sent),
never mock courses. Responses use `Cache-Control: private, no-store`.

## Verification and remaining runtime gate

Verified on 2026-09-15:

- Isolated branch from origin/dev `c26649f`; original dirty dev checkout preserved.
- Pinned Supabase start and `db reset --local` succeeded through all 14 migrations.
- Migration 032 pgTAP: 14/14; app schema lint: no errors.
- Imports 033 and 030 applied locally; placements and five/49 counts matched.
- Import 034 applied and replayed; second run inserted/updated zero rows.
- Aggregate inventory matched the table above; resources/enrollments/Auth users remained zero.
- API typecheck/build passed.
- Dependency-isolated student route/security/JWT tests passed (28 checks).
- Existing API runtime smoke passed; its Admin fixture coverage uses mock mode.

The populated HTTP/Postgres suite then stalled while Docker Desktop's Linux
engine became unavailable. Container inspection and `/version` returned HTTP 500,
and fresh local Postgres connections timed out. The test process was stopped.
This does not establish whether the request itself contributed to the outage.
Do not claim that populated student HTTP acceptance passed until the local suite
below completes. Production login and a browser render of `/docs` are also unverified.

## Resume local acceptance (PowerShell)

Run from the isolated worktree, with Docker Desktop's Linux engine healthy:

```powershell
docker ps
npx --yes supabase@2.116.0 start
# The reset is destructive to the project-local database only.
npx --yes supabase@2.116.0 db reset --local
npx --yes supabase@2.116.0 test db --local supabase/tests/032_student_academic_profiles.test.sql
npx --yes supabase@2.116.0 db lint --local --schema app --level error --fail-on error
Get-Content -Raw 'supabase/imports/033_controlled_admin_students_seed.sql' | docker exec -i supabase_db_elearning psql -U postgres -d postgres -v ON_ERROR_STOP=1
Get-Content -Raw 'supabase/imports/030_elite_buc_course_lessons_seed.sql' | docker exec -i supabase_db_elearning psql -U postgres -d postgres -v ON_ERROR_STOP=1
Get-Content -Raw 'supabase/imports/034_controlled_year1_course_shells.sql' | docker exec -i supabase_db_elearning psql -U postgres -d postgres -v ON_ERROR_STOP=1
Get-Content -Raw 'supabase/imports/verify_year1_mvp.sql' | docker exec -i supabase_db_elearning psql -U postgres -d postgres -v ON_ERROR_STOP=1
npm --prefix api run typecheck
npm --prefix api run build
node api/scripts/student-courses.selftest.mjs
node api/scripts/student-courses.localtest.mjs
git diff --check
```

Stop at a nonzero command exit. The local test script is hardwired to loopback;
it runs real Postgres reads and HTTP requests with temporary JWT signing keys.
Its identity remapping and negative-test fixtures run in a transaction and roll
back. It does not create Auth users or weaken production TLS/JWKS configuration.
The deployment environment continues to use its real configured Supabase JWKS.

## Server deployment plan (not executed)

1. Complete the populated local suite and review the scoped commits first.
2. Fetch origin/dev and integrate from a clean checkout; do not pull/rebase the
   original dirty dev checkout. From this clean task branch, after owner approval:

   ```sh
   git fetch origin dev
   git rebase origin/dev
   npm --prefix api run typecheck
   npm --prefix api run build
   node api/scripts/student-courses.selftest.mjs
   git diff --check
   git push origin HEAD:dev
   ```

   In a clean checkout whose branch is dev, the equivalent final command is
   `git push origin dev`. Never force-push.

3. In Dokploy, open the existing e-learning application, confirm repository branch
   `dev`, trigger Rebuild/Deploy, and verify the resulting commit matches the pushed
   head. Do not change secrets, ports, routing or existing build settings.
4. Check the deployed origin:

   ```sh
   API_BASE=http://72.61.87.212:8080/api
   curl --fail --silent --show-error "$API_BASE/health"
   curl --fail --silent --show-error "$API_BASE/ready"
   curl --fail --silent --show-error "$API_BASE/openapi.json"
   curl --fail --silent --show-error --output /dev/null "$API_BASE/docs"
   ```

5. Only after explicit approval for a named non-production database, verify its
   project identity and migration history. Use the existing secure libpq connection
   configuration (PGHOST/PGPORT/PGDATABASE/PGUSER/PGSSLMODE and protected credentials;
   TLS verify-full for cloud). Then, from the repository root:

   ```sh
   psql -X -v ON_ERROR_STOP=1 -f supabase/imports/033_controlled_admin_students_seed.sql
   psql -X -v ON_ERROR_STOP=1 -f supabase/imports/030_elite_buc_course_lessons_seed.sql
   psql -X -v ON_ERROR_STOP=1 -f supabase/imports/034_controlled_year1_course_shells.sql
   psql -X -v ON_ERROR_STOP=1 -f supabase/imports/verify_year1_mvp.sql
   ```

   This is a separate database action: Dokploy deploy does not apply these imports.
   Production student rows must come from a real approved import, not file 033.
6. Authenticate with an existing, correctly mapped student account. Keep its token
   in a process-local secret variable, pass it via Authorization, and check the
   list, detail and lessons routes. A platform-owner token without a student
   placement correctly returns 403. Clear the variable afterward. Do not log tokens.

Frontend integration, real student account provisioning, R2, uploads, signed URLs,
video approval/playback, subscriptions and payments remain outside this change.
