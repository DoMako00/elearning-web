# Backend-facing edit audit

Scope: every change made in this working session that touches API calls, request payloads, data persistence or the data the UI trusts from the backend. Pure styling, skeletons and guides are listed only at the end.

**Limit of this audit:** the backend is not in this workspace, so nothing here was exercised against a live server. Typecheck and 42 unit tests pass; those tests do not call the API. The "Verify" column is a manual checklist.

## 1. Changes that alter what is sent to, or read from, the backend

| # | Area | File | Change | Risk | Verify |
|---|------|------|--------|------|--------|
| 1 | Instructor assignments | `admin-v2/assignments/InstructorAssignmentWorkspace.tsx` | Due date and time are now two inputs, combined as `YYYY-MM-DDTHH:mm` (time defaults to 23:59) and sent as `dueAt` (ISO, from local time). Blank date sends `dueAt: null`. Same endpoint and field as before. | Time zone: the value is interpreted in the browser's local zone, as the old single `datetime-local` input was. | Create an assignment with a date only, with date and time, and with neither; confirm stored `dueAt`. |
| 2 | Payments | `admin-v2/payments/PaymentsPage.tsx` | The status filter now starts from `?status=` (`pending_review`, `approved`, `rejected`, `cancelled`; anything else means all). It is passed to the existing `listSemesterOfferingOrders({ status })` call. | Low. Unknown values fall back to "all". | Open `/admin/payments?status=pending_review`; the list and the dropdown should both show Pending review. |
| 3 | Overview | `admin-v2/overview/OverviewPage.tsx` | No new call. Reads `overview.counts` from `GET /v1/admin/overview?brand=<code>` (summed per active brand). The "Needs attention" list is derived only from `contentAwaitingRelease` and `pendingPaymentReviews`. Links to Payments now carry `?status=pending_review`. | The backend's definition of `contentAwaitingRelease` is unknown to the frontend. | Compare the tile with Content approvals; compare the payments tile with the Pending review count on Payments. |
| 4 | Instructors: edit brands | `admin-v2/instructors/InstructorsPage.tsx` | **New API calls on Save in the Edit drawer:** `listBrandAccess`, `listInstructorBrands`, `assignInstructorToBrand` (for newly checked brands) and `setInstructorBrandStatus(..., "inactive", version)` (for unchecked brands). Previously the checkboxes were ignored on edit. The checkboxes now start from persisted assignments (`instructorBrandAssignments`), not from brands inferred from courses. | New write path. A failure midway can leave brands partly updated (calls are sequential, not transactional); the error is shown through `reportDomainError`. | On a test instructor: add a brand, remove a brand, save; reload and confirm. Check an instructor whose only brand comes via a course. |
| 5 | Instructors: assign to course | `admin-v2/instructors/InstructorsPage.tsx` | The Lead/Co-Instructor picker was removed. New assignments are written with role `"Unspecified"` through the existing store, which persists via `adminV2ServerData`. | Fixes a save error: the persistence layer throws when a non-"Unspecified" role is new, because the backend cannot store roles. | Assign an instructor to a course; no error banner; assignment survives reload. |
| 6 | Course setup: instructors | `admin-v2/courses/CoursesPage.tsx` | Instructors chosen in the course form are saved with role `"Unspecified"`. On edit, the two selects now default to the first and second assigned instructors, and any beyond the second are kept (`slice(2)`). The old rule kept only "Unspecified" assignments and rebuilt the rest from the form. | Behavior change on edit: the form now reflects real assignments. Removing an instructor from slot 1 or 2 deactivates that assignment through the existing persistence diff. | Edit a course with 1, 2 and 3 assigned instructors; save without changes; confirm nothing is removed or duplicated. |
| 7 | Course setup: display | `admin-v2/courses/CoursesPage.tsx` | "Lead instructor" column now shows the first assigned instructor and a `+N` count; header renamed "Instructor". Display only. | None to the backend. | Courses with instructors no longer read "Unassigned". |
| 8 | Curriculum | `admin-v2/curriculum/CurriculumPage.tsx` | No API change. Initial state ids were mock values (`inst-buc`, `year-buc-1`, ...); they now start empty and fall back to real records. Semester open/closed state was inverted to a "collapsed" list. Move up/down are disabled at the ends. Display text fixed from garbled characters. | The page now selects its first real year/unit through the existing fallbacks; verify the first load selects something sensible. | Load Curriculum for each brand and for "All brands". |

## 2. Items reviewed and left unchanged

- All existing mutations on the Instructor portal screens (course content, assignments, grading, exams) kept their hooks and payloads; only markup changed.
- Course create, duplicate, archive/restore and edit still go through `createBrandCourse` / `setCourseStatus` / the store diff in `adminV2ServerData.ts`.
- Instructor sign-in invitation (`createInstructorLogin`) and instructor create/status calls are unchanged.
- The Drawer and form field styles (`shared/admin-drawer.css`) are CSS only.

## 3. Findings about the backend contract (not fixed; need a decision)

1. **No lead/co-instructor roles.** Every instructor loaded from the server has role `"Unspecified"`. The UI no longer offers roles in the two places that would error, but older copy elsewhere may still imply roles.
2. **Instructor directory stores limited fields.** `persistInstructors` rejects store-diffed email, phone or specialty changes ("stores name, code, status, Brand, and Course assignments only"). The Edit drawer avoids this by calling `writeInstructor` directly with `publicEmail` and `specialties`. Confirm the backend persists those two fields.
3. **Content approvals has no "needs review" filter.** The Overview "Content to review" tile cannot link to the waiting item. A filter or queue endpoint would fix this.
4. **Payments count vs list.** `pendingPaymentReviews` (overview) and the Pending review rows (orders list) come from different endpoints; they should match but were not compared.
5. **Brand removal is a soft deactivate** (`setInstructorBrandStatus(... "inactive")`), consistent with the rest of the app; nothing is deleted.

## 4. Non-backend changes (for completeness)

Styling and layout for Home, My courses, Course builder, Assignments, Students, Subscriptions, Exams, Overview, Curriculum, Course setup and Instructors; route-level skeletons for each; the shared drawer styles; the workspace guide engine (`layout/WorkspaceGuide.tsx`) with Instructor and Admin guides (browser storage only, no API); the breadcrumb ECG width fix; garbled-character fixes in two source files.

## 5. Suggested manual test order

1. Payments deep link (#2), then Overview tiles (#3).
2. Assign to Course, then Edit Course (#5, #6).
3. Edit Instructor brands (#4).
4. Create an assignment with a due date and time (#1).
5. Load Curriculum under each brand (#8).
