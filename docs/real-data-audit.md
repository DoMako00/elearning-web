# Real-data integration audit

This is a source-level inventory of the currently mounted product routes. It is not evidence of authenticated production acceptance. The browser uses the Backend HTTP API for business data; Supabase JS is reserved for provider authentication. No remote database, deployment, Git push, or live R2 state was changed during this pass.

## Authentication

| Route | Source / persistence | Reads and writes | Auth | Status |
|---|---|---|---|---|
| `/auth/sign-in` | Backend identity APIs; Supabase Auth provider session | Student claim, or Admin/returning Student email OTP; OTP target Brand is selectable; session/device completion | Public initiation; provider proof for completion | REAL_AUTH; Admin email-OTP acceptance requires an active persisted Admin role mapping for the selected Brand or platform-owner authority |
| `/auth/access-pending`, `/auth/access-granted` | Redirects to `/auth/sign-in` | None | Public | No mock entitlement page is reachable |

## Admin V2

| Route | Backend source | Reads | Writes | Status |
|---|---|---|---|---|
| `/admin`, `/admin/overview` | Admin Overview API; persisted commercial, Student, course and audit aggregates | Overview snapshot | None from overview | REAL_API source; live authenticated browser acceptance not performed here |
| `/admin/students` | Admin Student APIs, academic Brand/placement APIs and Admin Operations Executor | Paginated Student list/detail, persisted creation time and device counts, access summary, devices/sessions, and live Brand/institution/level/semester options | Create, safe profile/academic placement update, suspend/restore, claim reset; profile-scoped Admin security commands use Student profile IDs and resolve internal identity server-side | REAL_API; no default Brand/institution/semester or zero-access fallback; security mutations are available only to authorized Admin actions in the Security dashboard |
| `/admin/payments` | Admin manual Order APIs | Orders and payment review detail | Manual approve/reject with server reconciliation | REAL_API; manual review only |
| `/admin/subscriptions` | Admin subscription/seat/Offering APIs | Subscriptions, seats, Offering list/detail, authorized academic hierarchy and Brand Courses | Cancel and canonical seat operations; Offering create/update/status and include/remove Course commands use Idempotency-Key + expectedVersion and refetch server state; purchase wizard creates pending Order | REAL_API; Offering management is available within this route without a new navigation destination |
| `/admin/curriculum` | Academic catalogue APIs; `app.academic_institutions`, `academic_levels`, `academic_semesters`, `academic_modules` and existing audited catalogue command receipts | Institution/level/semester/academic-unit tree | Create/update/archive existing catalogue records; updates carry `expectedVersion`, creates carry `Idempotency-Key`, and all writes require an audit reason | REAL_API reads and represented mutations. Institution remains distinct from Brand. The existing academic unit model is reused; page labels follow the BUC/Delta year rule without creating duplicate Subject tables |
| `/admin/courses` | Brand Course APIs | List/detail and academic mapping | Supported create/update/status/assignment commands | REAL_API adapter; verify current mounted controls against API before claiming every mutation |
| `/admin/courses/:courseId/builder` | Course structure APIs | Chapters and lessons | Supported structure commands | REAL_API adapter; source-level status only |
| `/admin/instructors` | Instructor APIs | Directory and assignments | Supported create/update/assign/remove commands | REAL_API adapter; source-level status only |
| `/admin/content` | Lesson Resource / protected-media Admin APIs | Resource metadata and lifecycle | Supported metadata, upload-init, verify, publish/withdraw | REAL_API adapter; private media acceptance not run |
| `/admin/security` | Security events and profile-scoped Admin identity APIs | Persisted audit/security records, device/session projections | Admin-only Student session/device revocation and one-use device-replacement authorization | REAL_API; device revoke is not Student self-service: an authorized Admin confirms it from the dashboard, supplies a reason, and server data is reconciled |
| `/admin/support` | `/v1/admin/support/conversations` and shared conversation store | Brand-scoped support threads, messages, read state | Admin reply with expected version and idempotency key | REAL_API source; local DB replay not performed |
| `/admin/assignments` | `/v1/admin/assignments`, `/v1/admin/assignments/{assignmentId}/submissions`, and review command; `app.assignments`, `app.assignment_submissions` | Authorized Assignments, safe Student text submissions, scores, feedback and review versions | Score/review or return a submission with feedback, expectedVersion, Idempotency-Key and audit reason | REAL_API source; uses existing assignment persistence; route self-test and backend regression pass |
| `/admin/assessments` | `/v1/admin/assessments`, attempts read model and `app.assessment_score_overrides` | Assessments, safe question metadata, attempts, original and effective scores | Create/update, draft question replacement, publish/close/archive; dedicated `admin.assessments.score.override` permission, reason, expectedVersion, Idempotency-Key, actor/time audit | REAL_API; original calculated score remains on the attempt and effective score is persisted separately |
| `/admin/roles` | `/v1/admin/roles/me`, `/v1/admin/roles`, `/v1/admin/roles/admins/{adminProfileId}` | Effective role/permissions; assignable role catalog and Admin summaries | Platform-owner-only replacement of one active role; expectedVersion, Idempotency-Key and audit reason; explicit owner-change confirmation and last-owner protection | REAL_API; assignment replaces the target’s active role set with one selected existing role |
| `/admin/commercial`, `/admin/access`, `/admin/media`, `/admin/audit` | Redirect aliases to Payments, Subscriptions, Content, Security respectively | Canonical destination APIs | Canonical destination actions only | No placeholder page remains; these aliases do not create a second data surface |

## Student

| Route | Backend source / persistence | Reads | Writes | Status |
|---|---|---|---|---|
| `/` | Student profile, course, progress, preference and notification APIs | Persisted identity, enrolled/available courses, progress, weekly goal, unread notification count | Lesson progress and weekly-goal preference | REAL_API; AI Learning Guide explicitly remains a static “in development” presentation, not generated advice |
| `/profile` | Student profile, progress, preferences, saved-course, calendar, achievement-award and certificate APIs | Identity, placement, course progress, weekly goal, upcoming persisted items, recent learning activity, saved courses, earned awards, safe certificate metadata | Saved-course removal; edit actions route to Settings; open/download an issued certificate through the owner-scoped document endpoint | REAL_API for mounted tabs; certificate SVG is generated from the current Student's Admin-issued record and returned inline with `private, no-store`; no permanent URL or automatic issuance |
| `/my-courses` | Student course read model | Enrolled compatible Courses and backend access state | None | REAL_API |
| `/my-courses/:slug` | Student Course detail read model | Course, chapter and lesson structure/access | None | REAL_API source; verify every nested lesson/media control separately |
| `/my-courses/:slug/lessons/:lessonId` | `/v1/student/courses/{courseId}/lessons`, protected-media authorization, progress APIs, and server playback evidence in `app.media_playback_sessions` | Authorized lesson structure/resource delivery, per-Student/per-video completed-view state, and persisted course progress | In-progress/completed lesson progress; video playback start, time-bounded heartbeat and idempotent completion | REAL_API source; video limit defaults to 3 and is Admin-configurable per asset; completion requires at least 90% plausible server-bounded forward progress; exhausted playback has a specific state; authenticated media acceptance not performed |
| `/explore`, `/explore/paths/:slug` | `studentCoursesApi.ts`, `studentLearningApi.ts` and `useStudentLearningPaths`; mobile Explore uses the same `/v1/student/courses?view=explore` and `/v1/student/learning-paths*` adapters | Published placement-compatible course shells, persisted learning paths and ordered mapped courses; level/semester filters derive from course DTOs | Persisted course save/unsave on desktop; mobile path navigation only | REAL_API; no mobile demo-course/path list, ratings, learner counts, or durations; path is discovery metadata, not an access grant |
| `/calendar` | Student calendar API over persisted academic events, assignments, assessments and personal items | Date-range records | Student-owned study blocks/reminders | REAL_API source; migration schema replayed on a disposable local database; no populated-data HTTP acceptance claimed |
| `/assignments`, `/assignments/:assignmentId` | `/v1/student/assignments`; `app.assignments`, `app.assignment_submissions`; assignment attachments reuse `app.media_assets` and the existing private media service | Published compatible assignments and own submission/verified attachment metadata | Text and verified private attachment submission/resubmission via backend; authorized Admin grading/return and attachment delivery are available at `/admin/assignments` | REAL_API for desktop and mobile; upload is short-lived and server-authorized, submission linkage is persisted, and delivery checks exact Student ownership or Admin Brand scope |
| `/messages` | `/v1/student/messages/*`; `app.conversations`, participants, messages | Student peer/support conversations and messages | Start conversation/support request, send message, mark read | REAL_API source; Admin Support uses the same persisted conversation model |
| `/community` | `/v1/student/community/posts*`; persisted community spaces/posts/comments/reactions | Brand/Institution-scoped feed and post detail | Create post/comment, set or clear reaction | REAL_API source; migration schema replayed locally; no populated-data HTTP acceptance claimed |
| `/settings` | Student profile, identity, device/session, commercial and preference APIs | Verified email, optional phone, placement, account/seat summary, devices, current session, notification preferences | Profile contact update, email link/change verification, notification preferences, current-session logout, revoke other sessions | REAL_API for supported Student actions. Device revocation and replacement authorization require an authorized Admin from the Security dashboard; Students cannot revoke a device |
| `/instructor-profile`, `/instructors`, `/instructors/:instructorId` | `/v1/student/instructors`; `app.instructors` public directory metadata and persisted teaching assignments | Safe display name, public directory email, persisted specialties, assigned Courses | Read-only | REAL_API read-only; phone, office schedule, ratings/reviews and booking remain omitted because they are not persisted/approved |
| `/assessments`, `/assessments/:assessmentId` | `/v1/student/assessments*`; persisted assessment, question, attempt and answer records | Available assessment, safe questions without answer keys, own attempt history/result | Start/resume attempt and submit answers with version check | REAL_API source; correct answers remain server-side until scoring; migration schema replayed locally; no populated-data HTTP acceptance claimed |
| `/help` | Static editorial help content plus `/v1/student/messages/support` for support requests | Saved Admin Support conversations and real message history | Create support conversation; continue in Messages | REAL_API for support workflow; static help articles are presentation content only |
| `/test-inactivity`, `/test-streak`, `/test-xp`, `/test-skeleton` | Development-only components | Test/demo data | None | DEV_ONLY; excluded from production route set |

## Persistence and source-boundary findings

- Persisted learning paths reuse `app.learning_paths` and `app.learning_path_courses` from `20261014032845_student_workspace_domains.sql`; Student awards and certificate summaries reuse tables from the same workspace migration. Persisted learning, preferences, notifications, calendar, saved courses, assignments/submissions, assessments/attempts, conversations/messages and community activity use local additive migrations. The complete 42-migration chain was replayed from baseline twice in a disposable local Supabase project, with and without the project seed. No migration was applied to ELITE.
- Student conversation, community, assessment, learning-path, achievement-award and certificate-summary HTTP routes have frontend adapters and backend contracts. The schema replay and focused SQL tests passed locally; this is not authenticated populated-data acceptance.
- Protected video playback uses the existing MediaService/ObjectStorage R2 signing path. Video view evidence is stored in `app.media_playback_sessions`; direct legacy video delivery is rejected, the per-asset limit defaults to three, and completion is idempotent after 90% server-bounded forward timeline progress. Migration `20261014190000_video_completed_view_limits.sql` replayed locally and focused test `057_video_completed_view_limits.test.sql` passed.
- Student assignments use a shared backend DTO mapper on desktop and mobile. Attachments reuse the existing private media storage service and object-key namespace; only verified metadata is linked to a submission, Student delivery is owner-scoped, and Admin delivery is Brand-authorized and audited. They do not use lesson-media authorization, which is broader than exact submission ownership.
- This local capability batch adds curriculum writes against existing academic records, Admin score overrides with immutable original scores, platform-owner role assignment, and persisted Instructor public email/specialties. These source-level contracts are not authenticated browser acceptance.
- The affected production routes no longer import the Help Center ticket fixtures, Settings mock dataset, or Instructor Profile demo profile collections. `/student-preview` and development-only test routes remain isolated demo/test surfaces.
- UI filters, tabs, drawer state and form drafts may remain client-side. Business records, auth identity, progress, calendar, assignment state, messages, community activity, achievement awards, certificates, devices and sessions must remain server-authoritative.
- Direct browser queries to private `app` schema business tables are not part of the architecture. Supabase browser access is for Auth only.

## Validation and deployment boundary

Frontend app/Node typechecks and the current-source production Vite build pass; the build still reports the unresolved `weekly-study-goal-corner.webp` asset and large-chunk advisories. Backend typecheck/build, 52/52 self-test suites, boundaries, runtime smoke and source/exported OpenAPI parity pass. The full 42-migration local chain and focused migration-appropriate pgTAP tests pass in the disposable Supabase project. Authenticated browser acceptance, push, remote migration and deployment were not performed.

## Final route-by-route source truth — 2026-10-14

This section supersedes earlier route-status and validation snapshots in this file. The active production router at `src/app/router/index.tsx` has 47 product route entries: 7 public/auth paths, 19 Admin paths, and 21 Student paths. `/student-preview` is mounted only in development builds, is not a production route, and is not included in the count. Development test routes and the wildcard Not Found route are not product routes. Mobile/tablet variants share the same Student adapters and DTO mappers as desktop.

The route map points to source profiles below; each profile specifies frontend adapter, backend endpoint family, persistence, reads/writes, auth, and loading/empty/error states.

| Route | Profile | Final classification |
|---|---|---|
| `/auth/sign-in` | AUTH | REAL_AUTH |
| `/auth/register` | REDIRECT | STATIC_PRESENTATION_ONLY |
| `/auth/verify-otp` | REDIRECT | STATIC_PRESENTATION_ONLY |
| `/auth/complete-profile` | REDIRECT | STATIC_PRESENTATION_ONLY |
| `/auth/choose-brand` | REDIRECT | STATIC_PRESENTATION_ONLY |
| `/auth/access-pending` | REDIRECT | STATIC_PRESENTATION_ONLY |
| `/auth/access-granted` | REDIRECT | STATIC_PRESENTATION_ONLY |
| `/admin` | ADMIN_OVERVIEW | REAL_API |
| `/admin/security` | ADMIN_SECURITY | REAL_API |
| `/admin/support` | ADMIN_SUPPORT | REAL_API |
| `/admin/instructors` | ADMIN_INSTRUCTORS | REAL_API |
| `/admin/commercial` | REDIRECT | STATIC_PRESENTATION_ONLY |
| `/admin/access` | REDIRECT | STATIC_PRESENTATION_ONLY |
| `/admin/media` | REDIRECT | STATIC_PRESENTATION_ONLY |
| `/admin/assessments` | ADMIN_ASSESSMENTS | REAL_API |
| `/admin/assignments` | ADMIN_ASSIGNMENTS | REAL_API |
| `/admin/audit` | REDIRECT | STATIC_PRESENTATION_ONLY |
| `/admin/roles` | ADMIN_ROLES | REAL_API |
| `/admin/overview` | ADMIN_OVERVIEW | REAL_API |
| `/admin/curriculum` | ADMIN_CURRICULUM | REAL_API |
| `/admin/courses` | ADMIN_COURSES | REAL_API |
| `/admin/courses/:courseId/builder` | ADMIN_BUILDER | REAL_API |
| `/admin/subscriptions` | ADMIN_SUBSCRIPTIONS | REAL_API |
| `/admin/students` | ADMIN_STUDENTS | REAL_API |
| `/admin/content` | ADMIN_CONTENT | REAL_API |
| `/admin/payments` | ADMIN_PAYMENTS | REAL_API |
| `/` | STUDENT_HOME | REAL_API |
| `/profile` | STUDENT_PROFILE | REAL_API |
| `/instructor-profile` | STUDENT_INSTRUCTORS | REAL_API |
| `/instructors` | STUDENT_INSTRUCTORS | REAL_API |
| `/instructors/:instructorId` | STUDENT_INSTRUCTORS | REAL_API |
| `/my-courses` | STUDENT_COURSES | REAL_API |
| `/my-courses/:slug` | STUDENT_COURSE_DETAIL | REAL_API |
| `/my-courses/:slug/lessons/:lessonId` | STUDENT_LESSON | REAL_API |
| `/my-courses/human-anatomy-i` | REDIRECT | STATIC_PRESENTATION_ONLY |
| `/my-courses/human-anatomy-i/lessons/:lessonId` | REDIRECT | STATIC_PRESENTATION_ONLY |
| `/explore` | STUDENT_EXPLORE | REAL_API |
| `/explore/paths/:slug` | STUDENT_EXPLORE | REAL_API |
| `/calendar` | STUDENT_CALENDAR | REAL_API |
| `/assignments` | STUDENT_ASSIGNMENTS | REAL_API |
| `/assignments/:assignmentId` | STUDENT_ASSIGNMENTS | REAL_API |
| `/assessments` | STUDENT_ASSESSMENTS | REAL_API |
| `/assessments/:assessmentId` | STUDENT_ASSESSMENTS | REAL_API |
| `/messages` | STUDENT_MESSAGES | REAL_API |
| `/community` | STUDENT_COMMUNITY | REAL_API |
| `/help` | STUDENT_HELP | REAL_API |
| `/settings` | STUDENT_SETTINGS | REAL_API |

### Source profiles referenced by the route map

| Profile | Frontend adapter/service; backend API | Persistence, reads, and writes | Auth and states |
|---|---|---|---|
| AUTH | `features/auth/api/{supabaseAuth,identityApi}.ts`; Supabase Auth plus `/v1/auth/account-claim*`, `/v1/auth/login/*`, `/v1/auth/email/link/*` | Provider identity/session and backend identity/session/device records; claim, OTP login, verified email linking | Public initiation; provider proof and backend identity authorization on completion; explicit loading, activation-required, OTP, and safe error states |
| REDIRECT | Router `<Navigate>` only | No business persistence or API read/write | Immediate redirect; no domain loading, empty, or error state |
| ADMIN_OVERVIEW | `adminV2OperationalData.ts`, `adminOperationsApi.ts`; `/v1/admin/overview` plus authorized aggregate/list reads | Persisted Student, course, order/subscription/grant and security aggregates; read-only | Admin bearer and permission; loading, zero/empty, error states; no fabricated trend series |
| ADMIN_SECURITY | `adminOperationsApi.ts`; `/v1/admin/security/events`, profile-scoped Student devices/sessions, revoke and replacement commands | Persisted identity devices/sessions and security/audit events; Admin revoke sessions/device and authorize one-use replacement | Admin bearer + command permission/reason/idempotency; loading/empty/error and confirmation states |
| ADMIN_SUPPORT | `adminSupportApi.ts`; `/v1/admin/support/conversations*` | `app.conversations`, participants, messages; list/detail/reply/read state | Admin support permission and Brand scope; loading/empty/error/mutation states |
| ADMIN_INSTRUCTORS | `adminAcademicApi.ts`, `adminV2Mappers.ts`; `/v1/admin/instructors*`, Brand and course teaching assignment APIs | Persisted instructor directory metadata and teaching assignments; list/detail/create/update/status/assign/remove | Admin bearer + Brand/command authorization; loading/empty/error/mutation states |
| ADMIN_ASSESSMENTS | `adminAssessmentApi.ts`; `/v1/admin/assessments*`, attempts/review and score override endpoints | Persisted assessments, questions, attempts, original/effective scores and override audit; manage and review | Admin assessment permissions; override requires `admin.assessments.score.override`, reason, expectedVersion and Idempotency-Key; loading/empty/error/conflict states |
| ADMIN_ASSIGNMENTS | `adminAssignmentsApi.ts`; `/v1/admin/assignments*`, submission review and protected attachment delivery | `app.assignments`, submissions, verified attachment linkage and existing media metadata; list/review/grade/return/open attachment | Admin permission + Brand scope; loading/empty/error/mutation states |
| ADMIN_ROLES | `adminRolesApi.ts`; `/v1/admin/roles*` | Persisted roles, permission catalog and Admin-role assignment; read and assign existing role | Role read; assignment is platform-owner-only, versioned/idempotent/audited with last-owner protection; loading/empty/error/conflict states |
| ADMIN_CURRICULUM | `adminAcademicApi.ts`; `/v1/admin/curriculum/*` | Existing institutions, levels, semesters and academic units; create/update/archive | Admin write permission; loading/empty/error/conflict; academic unit type is institution/year validated |
| ADMIN_COURSES | `adminAcademicApi.ts` + `adminV2Mappers.ts`; `/v1/admin/brands/{brandId}/courses*` | Persisted Brand Courses and academic mappings; list/detail/create/update/status/Instructor assignment | Admin bearer + Brand scope; loading/empty/error/conflict states |
| ADMIN_BUILDER | `adminAcademicApi.ts`; course chapter/lesson structure endpoints | Persisted chapters/lessons; read/create/update/reorder/archive supported fields | Admin bearer + course/Brand scope; loading/empty/error/conflict states |
| ADMIN_SUBSCRIPTIONS | `semesterOfferingsApi.ts`, `adminCommercialApi.ts`; `/v1/admin/semester-offerings*`, subscriptions, seats and purchase/order endpoints | Persisted offerings, included courses, orders, subscriptions, seats, enrollments and grants; purchase, cancel, seat lifecycle and Offering management | Admin bearer + commercial/academic permissions; loading/empty/error/conflict; refetch after commands |
| ADMIN_STUDENTS | `adminStudentsApi.ts`, `adminAcademicApi.ts`; `/v1/admin/students*`, `/v1/admin/curriculum/brand-access`, `/v1/admin/curriculum/institutions`, profile-scoped security commands | Paginated durable Student list with persisted `createdAt`/device count, real placement options, detail access summary, devices and sessions | Provision, safe profile and academic placement update by persisted IDs, suspend/restore/reset claim | Admin bearer + Brand scope; loading/empty/error/conflict/mutation states; summary counts remain unavailable until detail succeeds |
| ADMIN_CONTENT | `adminContentApi.ts`; `/v1/admin/brands/{brandId}/courses/{courseId}/lessons/{lessonId}/media*` | Lesson resources and existing private media metadata; create/initiate upload/verify/publish/withdraw/configure | Admin bearer + `admin.media.manage`; loading/empty/error and upload-expiry/conflict states; private signed transfer only |
| ADMIN_PAYMENTS | `adminCommercialApi.ts`; canonical Semester Offering Order list/detail/approve/reject endpoints (`/v1/admin/semester-offering-orders*`) | Persisted Offering Orders, payment submissions, reviewer/review time/reason and subscription activation; manual review only | Admin bearer + review permission; loading/empty/error/conflict; server state refetched after mutation; retired legacy manual Order writes are not used |
| STUDENT_HOME | Student course, learning, progress, preference, notification and saved-course hooks/adapters; global SearchModal calls the existing course, lesson, instructor and Community APIs when opened | Persisted profile/membership, enrolled/available course access, lesson progress, weekly goal, notifications and saved-course state; progress/goal/bookmark writes | Student backend session/device authorization; loading/empty/error; search uses API-derived items and explicit loading/error/empty states; no demo-course/activity fallback |
| STUDENT_PROFILE | Student profile/learning adapters; `/v1/student/profile`, `/progress`, `/preferences`, `/saved-courses`, `/achievements`, `/certificates`, certificate document | Persisted profile, progress, preferences, awards, saved courses and issued certificates; save removal and own certificate retrieval | Student bearer; loading/empty/error/retry; certificate is private/no-store |
| STUDENT_INSTRUCTORS | `studentInstructorApi.ts`; `/v1/student/instructors` | Public directory metadata and persisted teaching assignments; read-only | Student bearer and server-derived placement; loading/empty/error; unsupported phone, rating and schedule fields are not fabricated |
| STUDENT_COURSES | `studentCoursesApi.ts`; `/v1/student/courses?scope=mine` | Enrollment/access and Brand Course read model; read-only | Student bearer/device/access policy; loading/empty/error and server pagination |
| STUDENT_COURSE_DETAIL | `studentCoursesApi.ts`, `learningSpaceMappers.ts`, `studentCommunityApi.ts`, `studentLearningApi.ts`; `/v1/student/courses/{courseId}`, `/v1/student/community/posts*`, and `/v1/student/lessons/{lessonId}/notes` | Persisted Course/chapter/lesson/resource structure, Brand/Institution-scoped Community feed, and private per-Student lesson notes in `app.student_lesson_notes`; list/read/create/save | Student bearer and server-derived placement/access; notes require access to the released lesson, expectedVersion on save; loading/empty/error and save-conflict states |
| STUDENT_LESSON | `studentCoursesApi.ts`, `studentLearningApi.ts`, `learningSpaceMappers.ts`, and protected-media/progress adapters; lesson/progress/notes/media/playback endpoints | Lesson/resource metadata, progress, private lesson notes and `app.media_playback_sessions`; progress and playback start/heartbeat/idempotent completion; create/update own note | Student session/device, entitlement, release and view-limit validation; note ownership/version checks; loading/empty/error plus explicit exhausted-view state |
| STUDENT_EXPLORE | `studentCoursesApi.ts`, `studentLearningApi.ts`, `useStudentLearningPaths`; `/v1/student/courses?view=explore`, `/v1/student/learning-paths*`, `/v1/student/saved-courses*` | Published course shells, scoped learning paths, ordered path courses and saved-course state; save/unsave on desktop | Student bearer and server-derived academic scope; loading/empty/error; mobile filters use only returned level/semester data |
| STUDENT_CALENDAR | `studentCalendarApi.ts`; `/v1/student/calendar`, `/calendar/items*` | Persisted academic events, assignments, assessments and Student study blocks/reminders; personal item commands | Student bearer + ownership; range loading/empty/error/mutation states |
| STUDENT_ASSIGNMENTS | `studentAssignmentsApi.ts`; `/v1/student/assignments*`, assignment attachment endpoints | Assignments, own submissions and verified assets in existing media repository; text/file submit/resubmit | Student bearer and exact Student/assignment scope; loading/empty/error/upload/verification states |
| STUDENT_ASSESSMENTS | `studentAssessmentApi.ts`; `/v1/student/assessments*` | Published assessments/questions/attempts/results; start/resume/submit | Student bearer, availability/entitlement/attempt limits; answer keys withheld before submission; loading/empty/error/result states |
| STUDENT_MESSAGES | `studentMessagesApi.ts`; `/v1/student/messages/*` | Conversations, participants, messages/read state; start peer/support, send, mark read | Student bearer and conversation membership; loading/empty/error/send states |
| STUDENT_COMMUNITY | `studentCommunityApi.ts`; `/v1/student/community/posts*` | Brand/Institution-scoped posts/comments/reactions; create/comment/react/unreact | Student bearer and server-derived scope; loading/empty/error/mutation states |
| STUDENT_HELP | Static editorial help plus Student support message API | Editorial text is static; support messages persist in shared conversations; create support request and continue in Messages | Support action requires Student auth; live conversation loading/empty/error states |
| STUDENT_SETTINGS | `studentSettingsApi.ts`, `studentLearningApi.ts`, `studentDataExport.ts`; profile, email-link, device/session, commercial, preference, progress, course, assignment and certificate APIs | Persisted identity/contact/placement, verified email, access summary, devices/sessions/preferences; profile/email/preferences/session commands; owner-scoped JSON export composed from existing reads | Student bearer + email ownership proof for email change; loading/empty/error/mutation/export states; device revoke is Admin-only |

## Final source scan and validation status — current

- Production route graph has no fixture/mock Admin API, old Community mock screen/socket hook, or preview-data imports. Legacy Admin V1/auth mock source files remain unmounted; `/student-preview` and its Students-page entry point are compiled/mounted only in development builds.
- Non-production source still contains legacy fixture/mock modules: old Admin V1 API and page trees (`src/features/admin/api/adminApi.mock.ts`, `adminApi.fixtures.ts`, the old `src/features/admin/**.fixtures.ts` files, and `src/app/pages/admin/*`); `authOnboarding.mock.ts` imported only by the unmounted legacy Complete Profile/Choose Brand components whose public routes now redirect; the old Community mock screen/socket/member data (`src/components/mobile/screens/CommunityScreen.tsx`, `src/features/community/data/communityMockData.ts`, `src/features/community/hooks/useCommunitySocket.ts`, `src/features/community/components/AllMembersModal.tsx`); and old course/message/assignment/instructor fixture collections (`src/components/mobile/data/courses.data.ts`, `src/components/ui/Messages/messages.data.ts`, `src/components/ui/Assignments/assignments.data.ts`, `src/features/instructor/data/instructorMockData.ts`). Import checks found none in the active router, Admin V2, or Student production route graph. A fresh production bundle scan found none of the legacy module identifiers or `/student-preview`. The active mobile Community view is `CommunityScreenReal.tsx` and uses Student Community APIs. `src/components/ui/CourseLibrary/courses.data.ts` contributes only category labels and visual art presets; it does not supply course records. These legacy modules were left intact and are not production imports or fallbacks.
- Admin Students now loads Brand and academic placement selectors from persisted academic APIs, paginates the Student list, uses the backend's actual profile creation timestamp and active-device count, and displays detail access counts only from the Student detail API. Academic placement edits send persisted institution/level/semester IDs with the current expected version; the form no longer substitutes BUC, Elite, zero subscriptions, or zero course access when fields are absent.
- Student global search no longer contains fixed course, lesson, Instructor, Community, or resource records; it builds results from the existing authenticated course/lesson/instructor/community APIs. The old course-specific demo URL aliases redirect to My Courses instead of sending a hardcoded demo slug to the API.
- Final literal-data review removed the placeholder student name and fabricated Instructor name from generic Student Home action copy. The AI Learning Guide remains explicitly an in-development static presentation; it does not produce personalized advice or pretend to call an AI service. Layout, component hierarchy, and motion are unchanged.
- The unused hardcoded legacy subscription plan catalog and legacy order create/approve/reject API have been retired. Historical manual order list/detail reads remain read-only; all new purchase creation and review use canonical Semester Offering Orders and persisted Offering pricing. The active Admin V2 purchase flow does not call the retired endpoints, and no database rows were changed or removed.
- `/student-preview` is intentionally excluded from the 47 production route entries above. Both its route and the Admin Students “Demo preview” action are development-only. A fresh production build emitted no `LocalStudentPreviewPage` asset and no `/student-preview` route literal, so the isolated demo data cannot be reached or loaded by the production bundle.
- Browser storage in active code is limited to Supabase Auth session persistence, stable client/device identity, and the Admin Brand filter UI preference. `adminV2.store.ts` is memory-only and enforces empty server-owned collections; it cannot be a persisted or API-failure domain fallback.
- Frontend source contains no direct Supabase table reads. Supabase browser usage is Auth-only. No active API-error-to-demo fallback was found.
- The Course Overview and Lesson Player learning-space side panels now map the real course/lesson response into modules and resources, use the persisted Brand/Institution-scoped Community API, and load/save private notes through `/v1/student/lessons/{lessonId}/notes`. Lesson-note storage reuses `app.student_lesson_notes` from `20261014032845_student_workspace_domains.sql`; no new migration or storage subsystem was added. Video resources navigate through the protected lesson player and PDFs use authorized backend delivery; no public R2 URL is constructed.
- Mobile Explore now loads course and learning-path records from the same authenticated adapters as desktop. Its category/level/semester filters derive from returned DTOs, and the path detail shows only its persisted ordered course list. Static imagery remains presentation-only; hardcoded course names, ratings, learner counts, and popularity metrics were removed. Direct mobile deep links now render their routed page under the existing mobile shell instead of silently defaulting to Home; the mobile course-detail screen remains API-backed.
- Help Center article copy is authored static presentation content; category counts derive from the actual article arrays. Support conversations and replies use the persisted messaging API. The articles contain no fabricated view totals, relative update metrics, password sign-in steps, or fabricated support tickets.
- Mobile Home actions use truthful destinations: Recent Lesson opens persisted latest activity (or My Courses when none exists), Resources opens My Courses, Assignments opens the assignments screen, My Courses/Recent Learning navigate to real routes, and Weekly Goal opens Settings. Continue Learning and recommendation bookmarks use the persisted saved-course API; active-course selection remains transient UI state only.
- 42/42 migrations replayed from baseline twice in isolated `.codex-supabase-validation`, with and without project seed. Focused migration-appropriate pgTAP passed: `049`, `050`, `052`–`057`, plus version-scoped `010`, `015`, `036`, `037`, and Admin read suite `051`. The all-files-at-latest-schema invocation is not a valid gate for historical migration-snapshot tests; those assertions must run at their intended migration version.
- Current-source backend typecheck/build, all 52 self-test suites, boundaries, runtime smoke and compiled-runtime/exported OpenAPI parity pass. `openapi.json` is generated from current source and includes Student creation time plus the already-supported optional program label. Frontend app/Node typechecks and a production Vite plus service-worker build pass into a fresh `%TEMP%` output folder. The standard build's sibling cache permission issue was avoided with Vite's runner config loader and a temporary output directory, without broad permission changes. Existing unresolved artwork and large-chunk warnings are non-fatal.
- A disposable local Supabase Auth/Admin identity (`qa-admin@local.test`) was created in the disposable database and assigned the existing `platform_owner` role; no production credential was used. Local `/health`, `/ready`, Auth health/JWKS, and a fresh local-configured frontend build pass. Chrome now visibly shows the local `/auth/sign-in` screen. Authentication was not automated because the Computer Use policy prohibits automating auth dialogs; the user was asked to complete the local OTP sign-in manually. Until the user reports the local Admin dashboard is visible, no authenticated browser session or route acceptance is claimed. No OTP was entered by the agent, no certificate was installed/trusted, and no production credential was used. The 1920x880 acceptance remains **RELEASE-BLOCKED** pending the local session handoff. Home saved-course and Settings export source changes do not alter page hierarchy, classes, styles, or motion.
- Current Docker recheck from this Codex execution context is blocked: the effective identity is `desktop-8m4sc8f\codexsandboxoffline`, Docker Desktop UI/backend processes are present, `com.docker.service` is Stopped, WSL reports `E_ACCESSDENIED`, and Docker reports access denied to both the user's Docker config and `npipe:////./pipe/docker_engine`. The explicitly authorized service-start attempt failed with “Cannot open 'com.docker.service' service on computer '.'.” No ACL, group membership, service, or security setting was changed. No local `psql`, `pg_isready`, `pg_ctl`, `postgres`, or Supabase CLI is installed, and no PostgreSQL/Supabase listener is available on the expected local ports; there is no alternate disposable local database in this environment. This does not replace or invalidate the already successful isolated 42-migration replay and focused pgTAP run, but a fresh replay cannot be launched by this sandbox identity until the interactive Windows user restores Docker/WSL access for the local validation session.
- Docker recovery action for the local Windows user: open Docker Desktop in the normal interactive account, confirm its Linux engine and WSL2 integration are healthy, and run Codex in a Windows user context permitted to read its own `.docker` config and access `npipe:////./pipe/docker_engine`; do not broaden ACLs or weaken system security for the sandbox identity.
- Settings “Download My Data” composes an owner-scoped JSON export from existing profile, progress, preferences, saved-course, course, assignment/submission and issued-certificate APIs. Private attachment and certificate file contents are excluded; no local domain cache or new backend persistence is used.
- Final action-truth pass: the desktop Student photo-upload control and unsupported purchase/card/account-closure controls remain visibly represented but are disabled with truthful copy; Switch Account uses the existing current-session logout API. The mobile Course Options control is disabled rather than showing a no-op toast. This pass changes control availability/copy only; layout hierarchy and motion are unchanged.
- R2 integration reuses `src/infrastructure/storage/r2-object-storage.ts`, `src/modules/media/media-service.ts`, `src/infrastructure/postgres/postgres-media-repository.ts`, and `src/http/routes/media.routes.ts`. Lesson media, assignment attachment delivery, private certificate response, and configurable completed-view enforcement use the existing authorized path. No public permanent URL, direct frontend R2 access, second storage service, or live R2 mutation occurred.
- The six newest migrations are `20261014140000_admin_curriculum_metadata.sql`, `20261014150000_admin_assessment_score_overrides.sql`, `20261014160000_admin_role_assignment_commands.sql`, `20261014170000_instructor_public_directory_metadata.sql`, `20261014180000_assignment_submission_attachments.sql`, and `20261014190000_video_completed_view_limits.sql`. The complete ordered 42-file migration list is the current `supabase/migrations` directory; no production migration was applied.

Ordered migration inventory (42):

```text
20260831050824_000_private_app_bootstrap.sql
20260831062546_010_m1_identity_brand_authority.sql
20260901005940_015_m4a_command_receipts_audit_events.sql
20260902050400_020_m2a_academic_teaching_foundation.sql
20260905165938_021_level_1_academic_resource_catalogue.sql
20260905235455_022_m2b_course_delivery_foundation.sql
20260909002130_026_m2b_resource_catalogue_foundation.sql
20260909032358_028_academic_institution_brand_scope.sql
20260909073109_academic_module_chapters.sql
20260910044037_academic_module_readable_labels.sql
20260912062755_brand_course_catalogue_presentation.sql
20260912064342_brand_course_catalogue_presentation.sql
20260912064858_controlled_elite_buc_course_lessons_seed.sql
20260914085324_student_academic_profiles.sql
20260921091500_admin_manual_student_subscriptions.sql
20260930103756_identity_sessions_devices.sql
20261001020000_student_account_claim_google.sql
20261001235253_protected_media_assets.sql
20261002205829_admin_brand_assignments.sql
20261002214652_admin_media_security_permissions.sql
20261003000000_media_acceptance_object_key_prefix.sql
20261003204521_email_account_link.sql
20261003220201_launch01_subscriptions_access_grants.sql
20261011034531_semester_offerings_foundation.sql
20261011035330_subscription_seats_lifecycle.sql
20261011035756_canonical_seat_access_grant_validation.sql
20261011040435_subscription_seat_command_receipts.sql
20261011052735_offering_course_command_receipts.sql
20261011102251_canonical_semester_offering_orders.sql
20261011133822_device_slot_policy.sql
20261012055523_student_profile_update_command.sql
20261012070000_semester_offering_aggregate_commands.sql
20261014030341_student_learning_progress_api.sql
20261014032845_student_workspace_domains.sql
20261014100000_student_notification_preferences.sql
20261014120000_admin_assessments_and_roles_read.sql
20261014140000_admin_curriculum_metadata.sql
20261014150000_admin_assessment_score_overrides.sql
20261014160000_admin_role_assignment_commands.sql
20261014170000_instructor_public_directory_metadata.sql
20261014180000_assignment_submission_attachments.sql
20261014190000_video_completed_view_limits.sql
```
