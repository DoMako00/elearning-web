# Backend MVP-A: TestSprite handoff

This is a source-derived test-generation contract and operator handoff. TestSprite has not been run or configured by this task. The generated `backend-mvp-a.openapi.json` contains 17 GET paths and no mutations. Its `x-mvp-*` fields are advisory dependency metadata, not native TestSprite bindings.

## Scope and setup

- Scope: Student Course/Lesson visibility and Admin metadata reads.
- Exclude R2 playback, payments, subscriptions, security acceptance, UI journeys and production mutations.
- API base: `http://72.61.87.212:8080/api`. Verify the deployed revision before treating a run as acceptance of this branch.
- Use secure runner variables for `student_access_token` and `admin_access_token`; never include values in prompts, reports, screenshots, command lines, or request URLs.
- Obtain the Student token by signing in an approved real Student account against the confirmed Supabase project. The login helper accepts a publishable key, never a service-role/secret key. Keep the login response and refresh token out of artifacts.
- Existing controlled SQL application identities do not create Supabase Auth accounts and cannot substitute for a real sign-in.
- Student and Admin credentials are separate. An Admin token must never be injected into a Student success test.
- A Student with multiple eligible memberships must pass the selected commercial `brand` on list, detail and lessons.
- BUC/Delta are institutions. Only medway/elite/nexus are Student commercial-brand filters.
- The supplied server uses HTTP. Credentialed testing needs an owner-approved protected transport (HTTPS or a secured tunnel); public checks need no token.

## Producers and private bindings

Run in this order. Require the producer's HTTP status and response assertions to pass before binding anything. Validate returned IDs as PostgreSQL UUID text without imposing a UUID version restriction. Never generate fallback identifiers.

| Order | Producer | Token | Required selection / private variables |
| --- | --- | --- | --- |
| 1 | GET /health | none | 200; status=ok |
| 2 | GET /ready | none | 200; status=ready; production readiness also requires database reachable and real auth |
| 3 | GET /openapi.json | none | 200 valid OpenAPI; Student list/detail/lessons present |
| 4 | GET /docs | none | 200 HTML; console behavior is tested separately |
| 5 | GET /v1/admin/curriculum/institutions | Admin | From data[], select institution code=buc, levelNumber=1, semesterNumber=1. Capture academic_level_id and semester_id from that exact parent chain |
| 6 | GET /v1/admin/curriculum/levels | Admin | Real data[]; confirm captured academic_level_id is present |
| 7 | GET /v1/admin/curriculum/semesters?levelId={academic_level_id} | Admin | Confirm semester_id belongs to selected level |
| 8 | GET /v1/admin/curriculum/brand-access | Admin | Select exactly one code=elite in data[], with BUC allowed. Capture id as elite_brand_id and brand_id |
| 9 | GET /v1/admin/instructors | Admin | Capture instructor_id from an available real scoped row; empty list is a valid read |
| 10 | GET /v1/admin/students?brand=elite&page=1&pageSize=25 | Admin | From data.data[], select only the preapproved controlled Student privately. Capture admin_student_id if available. Empty list is valid |
| 11 | GET /v1/admin/brands/{elite_brand_id}/courses | Admin | From data[], select Biochemistry Fundamentals, verify brandId, and capture id as course_id |
| 12 | GET /v1/student/courses?brand=elite&page=1&pageSize=25 | Student | Assert the five subjects below; capture Biochemistry's courseId as biochemistry_course_id |

Do not confuse Admin `data[].id` with Student `data.items[].courseId`. Retain parent/child relationships with every binding. The real course ID returned by both scopes should match for the same controlled course; an inconsistency requires investigation, not a fabricated replacement.

## Dependent reads

| Request | Dependencies | Assertions |
| --- | --- | --- |
| GET /v1/student/courses/{biochemistry_course_id}?brand=elite | Student token + passed Student producer | 200; matching courseId; BUC; Subject; subject_based; chapterCount and lessonCount agree with returned published structure |
| GET /v1/student/courses/{biochemistry_course_id}/lessons?brand=elite | Same | 200; matching courseId; 10 published ordered lessons; playbackAvailable=false throughout |
| GET /v1/admin/brands/{elite_brand_id}/courses/{course_id}/chapters | Admin token + passed brand/course producers | 200; real chapter metadata; parent course matches |
| GET /v1/admin/brands/{elite_brand_id}/courses/{course_id}/lessons | Same | 200; 10 controlled Biochemistry lessons; parent course matches |
| GET /v1/admin/brands/{elite_brand_id}/courses/{course_id}/resources | Same | 200; empty array valid for shells; metadata only |

If an instructor or student detail test is added, include its GET in the reviewed allowlist first and require its optional producer to return the approved row. Missing optional rows do not authorize creating test data.

The Elite list must have pagination.totalItems=5 and five unique entries:

| Title | Lessons |
| --- | ---: |
| Biochemistry Fundamentals | 10 |
| Physiology Foundations | 3 |
| Histology Foundations | 9 |
| Cellular Biology and Genetics | 14 |
| Anatomy Foundations | 13 |

All five entries must have brand.code=elite, academicInstitution.code=buc, levelNumber=1, semesterNumber=1, cataloguePresentation=subject_based, unitLabel=Subject, status=published. Their lesson counts total 49. For the controlled no-media import, lessons expose mediaStatus=no_media, resourceId=null and playbackAvailable=false. A different persisted resource state must remain truthful and must not be called playable.

Validate the Student schema allowlist and reject storage keys, object paths, storage/playback URLs, auth identities or contact data in Student responses. Record only pass/fail classifications and counts; do not store full bodies.

## Dependency and status rules

| Condition | Expected classification |
| --- | --- |
| Public health/ready | 200 |
| Known protected GET without bearer | 401 unauthenticated |
| Valid token with no permitted role/scope | 403 forbidden |
| Admin identity on Student route | 403 when JWT is valid; never a Student success |
| Expired/invalid bearer | 401; repair auth setup before business assertions |
| Elite-only Student requesting medway or nexus | 403; only valid for an account confirmed to have Elite-only placement |
| Multiple eligible memberships without brand | 400 choice/validation response; no implicit first membership |
| Malformed UUID with supplied bearer syntax | 400; route syntax is checked before resolving the supplied JWT |
| Known protected route without bearer, even malformed UUID | 401 in this branch; verify deployed revision before applying this expectation |
| Real course outside visible scope or a verified absent course | 404 with no private detail |
| Missing upstream binding/token | blocked/skipped; do not issue the dependent HTTP request |
| Unavailable persistence/auth provider | 503; environment/setup issue until diagnosed |
| Wrong HTTP method | 405; do not classify as missing auth |
| Duplicate/oversized Admin authorization headers | 400 malformed-header contract |

No dummy UUID is part of the positive acceptance suite. A not-found check needs a securely supplied identifier independently confirmed absent in the test database, or a real out-of-scope course selected by an authorized setup. If unavailable, mark that check blocked. Local unit tests separately cover malformed/missing IDs and never count as real-data acceptance.

## Mutation contract, separately gated

The source OpenAPI documents mutations, but this read-only subset deliberately does not enable them. Before any mutation run, approve the exact environment, operation and controlled records. Never auto-run mutations or import fixtures as test setup.

Every approved mutation requires:

- Matching Admin Authorization bearer.
- A unique Idempotency-Key per logical command; retries reuse the same key and identical payload.
- Content-Type: application/json and an actual JSON object built from real producer IDs.
- A nonblank reason.
- Current expectedVersion for delivery PATCH. Existing M2 instructor/course/assignment commands accept optional expectedVersion; supply the current version in operational tests to avoid blind updates.
- A fresh real read after success, plus explicit replay/version-conflict assertions only in the approved disposable environment.

Missing prerequisites are a blocked test, not a reason to send example JSON. No GET requires Idempotency-Key.

## Generate and review

From api/:

```powershell
npm run build
node scripts/backend-mvp-a-contract.mjs
```

Import the generated subset into the selected test project, configure separate auth contexts and implement its producer dependencies in the generated setup. Inspect every generated request before running it. A prose handoff or OpenAPI extension does not enforce TestSprite execution order.

Report public, Student, Admin and blocked dependency outcomes separately. Redact tokens, raw email/student codes, IDs, SQL errors and provider payloads. Record tested deployed revision and sanitized counts. A public pass, source selftest or generated subset is not authenticated acceptance.

## Current evidence

- Public baseline is recorded separately in backend-mvp-a-public-baseline.json.
- Real Student login/list/detail/lessons: not run; controlled credentials unavailable.
- Real Admin curriculum/students/instructors/delivery: not run; controlled credentials unavailable.
- TestSprite portal import, generated suite review and execution: not run.
- Production data mutations: none.

