# Assigned modules and session dashboard

## Observed production symptom

Read-only Admin inspection showed five student enrollment records and ten active grant records for the selected Nexus/Delta Level 1/Semester 1 account. English 1 was published; the other Semester 1 course offerings were drafts. The student course query required published course status, hiding assigned modules. Course-detail navigation also reused the released-learning flag, preventing metadata access before release.

## Resulting behavior

- Assigned draft/published modules remain in My Courses and CourseLibrary within the verified academic placement. Unassigned drafts and archived offerings remain excluded.
- Course metadata has a separate canViewDetails decision. Details work before release, with a clear unreleased notice. Course outlines and all lesson content still require published course/release plus an effective grant. Media delivery remains independently authorized.
- Home recommends the first incomplete Lesson in chapter/lesson order for every assigned module. No activity starts at session 1; completing session 1 advances to session 2. In-progress sessions remain selected. Completed modules and modules without published sessions have explicit states.
- Continue Learning shares its active module with Session contents. Switching the module updates the contents immediately. Materials, assignments, quizzes and exams have type-specific icons/surfaces and open their own protected delivery or actual product routes. Progress mutations invalidate cached course details.
- Mobile Home uses the same next-session and session-content data. Enrolled unreleased modules are included in mobile My Courses.

## Backend contract and data preparation

Each published authorized Lesson can return learningItems: id/title/kind/assetId/available/state. No media URLs, exam answers or private data are included. Content comes from published media/resources and explicitly lesson-linked assignments/assessments.

The additive migration 20261020100000_lesson_learning_item_links.sql adds nullable course_lesson_id to assignments/assessments with composite Lesson/Course/Brand foreign keys. Existing course-wide assignments and exams are deliberately not guessed into sessions. Actual session association must be authored in persisted content data. This pass does not add an Admin authoring interface or publish existing draft curriculum.

The metadata read uses optional JSON column projection for the new associations, allowing an API deployment before this migration; those associations remain empty until the migration/data links exist. Apply the migration before writing lesson associations. The frontend tolerates an older API lacking learningItems, but complete module/detail behavior requires the updated API.

A real PostgreSQL browser test also exposed a missing closing parenthesis in the existing assessment detail authorization query. It is repaired without removing its access checks.

## Validation

- Frontend: 124 tests; TypeScript and production build pass. Existing large-chunk warning remains.
- API: TypeScript/build and all 54 self-test suites pass.
- scripts/student-library.localtest.mjs passed against loopback PostgreSQL. It checks assigned draft/no-release details, complete library, unassigned draft exclusion, scoped assignment/exam Lesson links, pending PDFs, persisted progress, exam/assignment reads and revoked-grant outline isolation. Fixture writes are rolled back in finally.
- The additive migration was applied successfully to the local acceptance schema. Its foreign keys rejected cross-course assignment/exam associations in the regression.
- Local browser exercised actual HTTP handlers and PostgreSQL with a disposable signed test identity: session 1 without prior activity, session 2 after first completion, active-module switching, draft details, assignment navigation and assessment detail navigation. Desktop 1920x880 and mobile 390x844 were inspected; mobile had no horizontal page overflow.
- QA fixtures were rolled back; profile/course counts verified zero afterward. Production was inspected read-only; no records or course publication statuses were changed. This is local integration evidence, not a claim that a deployed production SHA or production authentication was validated.

## Evidence

- [Next sessions and active session contents](student-session-evidence/home-next-sessions.png)
- [Complete assigned library](student-session-evidence/full-library.png)
- [Draft module metadata page](student-session-evidence/draft-module-details.png)
- [Mobile Home](student-session-evidence/home-mobile.png)
