# Admin V2 Frontend Pre-Integration Audit

**Scope:** local frontend MVP only. This audit covers the Admin V2 routes and the local Student preview on the current browser-backed store. No API, backend, deployment, or production-data claim is made here.

## Result

The Admin V2 frontend is ready to begin backend integration. Its shared local model, route wiring, local persistence, destructive-action confirmations, and the primary cross-route relationships were reviewed and corrected where a frontend-only issue could cause misleading state.

| Route | Status | Evidence reviewed |
| --- | --- | --- |
| `/admin` and `/admin/overview` | Ready | Local derived KPIs, attention links, activity feed, empty-safe cards |
| `/admin/curriculum` | Ready | Institution-scoped years, semesters, units, inspector, archive/reorder/edit |
| `/admin/courses` | Ready | Filters, curriculum mapping, instructor assignments, enrolled Students, archive/duplicate/builder entry |
| `/admin/courses/:courseId/builder` | Ready | Not-found fallback, structure tree, chapter/lesson CRUD, archive/reorder, Content handoff |
| `/admin/instructors` | Ready | Directory, brand/course assignment, activity, selected inspector, inactive gating |
| `/admin/students` | Ready | Gmail/identifier identity, local setup code, Access, Devices, Sessions, 2-slot limit |
| `/admin/payments` | Ready | Pending review, approval/rejection, synchronized subscription and Student state |
| `/admin/subscriptions` | Ready | 1/3/5 plans, seat wizard, pending payment handoff, cancellation/revocation safeguards |
| `/admin/content` | Ready | Shared builder tree, local Video/PDF metadata, draft/publish/withdraw, release controls |
| `/admin/security` | Ready | Device/session operations, audit filtering/export, account restoration and local policy display |
| `/student-preview` | Ready, local-only | Setup-code preview explicitly labelled as non-production authentication |

## Shared Domain Model

The single `AdminV2Data` browser store contains stable IDs for courses, Students, plans, subscriptions, payments, enrollments, devices, sessions, curriculum entities, structures/resources, instructors, instructor-brand assignments, and audit events. The persistence key is `greenlearn.admin-v2.local.v1`.

The following separations are intentional and preserved:

- Institution is independent of commercial Brand. Curriculum is institution-scoped; Medway, Elite, and Nexus remain commercial brands.
- Curriculum Unit is the approved academic mapping; a Course is the brand-owned offering mapped by `curriculumUnitId`.
- Chapters and Lessons define Course Structure. Video/PDF metadata are separate `ContentResource` records linked to Lessons.
- Subscription, payment, and enrollment are separate records. A subscription may create commercial eligibility but does not duplicate the Student-to-Course access relationship.
- Device and Session are separate records. Devices represent hardware slots; sessions represent sign-ins.
- Instructor identity and Brand affiliation are separate from shared Course instructor assignments.

Academic presentation logic remains: Medway/Elite Year 1 is Subject, Medway/Elite Year 2+ is Module, and Nexus uses Module for every year. These rules never make a Brand an Institution.

## Cross-Route Relationships Verified

- Payment approval marks the linked payment Approved, activates the subscription, and activates linked Pending Payment Student accounts.
- Payment rejection leaves no active commercial access: the subscription becomes Payment Rejected and linked pending accounts become Payment Rejected.
- Cancelling an active subscription now revokes its subscription-sourced enrollment records as well as marking the subscription Cancelled. New grants remain blocked by subscription state.
- Student Access and Course enrolled-Student management use the same enrollment records.
- Courses and Instructors share the same Course instructor assignments. Active-course totals exclude archived Courses.
- Course Builder and Content read the same Course/Chapter/Lesson structure.
- Student Device and Session actions are reflected in Security; meaningful local Student, device, session, access, payment, subscription, curriculum, instructor, and content operations feed the shared audit stream consumed by Overview and Security.

## Persistence and Local-Only Behavior

- Store reads use guarded JSON parsing and now require valid core collections before accepting saved data. Malformed or incomplete payloads fall back to the initial local preview safely.
- Video and PDF file bytes are never stored in localStorage. Metadata persists; in-session `ObjectURL` previews are revoked and are deliberately unavailable after refresh.
- The temporary setup code and `/student-preview` are isolated local-demo affordances. The UI states clearly that Gmail/OTP delivery and production authentication require a backend provider.
- The unobtrusive sidebar reset restores local browser fixtures only.

## Corrective Pass Applied

- Added malformed-persistence guarding and collection shape checks.
- Made confirmation dialogs keyboard-dismissible with `Escape`, matching drawers.
- Added audit events for Student profile changes, enrollment grants/revocations, device registration/replacement/revocation, and session creation/revocation.
- Added an audit event when a subscription payment order is created.
- Prevented seat changes and term extensions for non-active subscriptions.
- Made cancellation revoke subscription-derived enrollments, preventing an active-looking access record after cancellation.
- Removed the unsupported Security policy-details affordance rather than leaving a button that only announced future scope.
- Replaced router helper `any` props with generic typed route props.

## Visual QA

Live 1920x880 captures were reviewed for all Admin V2 routes. The shared shell, title/search/brand controls, selected-row language, tables, inspectors, tree workspaces, dialogs, status badges, and empty states remained within the desktop viewport without page-wide horizontal overflow.

Accepted visual baseline retained from the prior visual passes:

- Courses, Subscriptions, Students: approximately 8.5/10.
- Curriculum, Course Builder, Content: approximately 8.5/10 after their final polish pass.
- Instructors: approximately 8.6/10.

The audit intentionally did not redesign accepted screens. Empty Course Builder and Content states are intentionally spacious but provide one direct action to build the missing structure.

## Backend Adapter Seams

All current `setData`/store mutations need service adapters when integration starts. The primary operation groups are:

1. Curriculum institution/year/semester/unit CRUD and unit ordering.
2. Course CRUD, curriculum mapping, Course instructor assignments, and enrollment grants/revocations.
3. Chapter/Lesson CRUD/order/archive and Content metadata, publishing, release settings, and durable file upload.
4. Student profile CRUD, identity/OTP lifecycle, devices, sessions, and local preview replacement.
5. Subscription purchase/seat lifecycle, payment review, approval, rejection, cancellation, and renewal.
6. Instructor profile, Brand, and Course assignment CRUD.
7. Audit-event append/query/export and Security actions.

## Remaining Integration Risks / TODOs

- Local date labels are presentation strings, not canonical timestamps. Service adapters should use ISO timestamps and format them at the view boundary.
- Some older persisted Course instructor records can be name-only. Store normalization maps a matching legacy name to `instructorId`; the backend contract should require the stable ID and eventually retire the compatibility path.
- Local subscription seat edits do not initiate a billing adjustment; backend integration must define payment, proration, and entitlement rules before enabling remote writes.
- Content previews are session-local only. The backend needs media storage, signed delivery URLs, upload validation, and authorization.
- Local confirmation, validation, empty, and loading patterns exist, but network/permission/conflict states require adapter-provided error contracts rather than fabricated frontend failures.
- Legacy files under `src/app/pages/admin/` (other than `AdminPagePlaceholder.tsx`) appear superseded and are not referenced by the current Admin V2 router. They were deliberately retained during this audit because deleting them is source cleanup, not required for safe frontend integration.

## Validation

- `npm run typecheck`: pass after the corrective pass.
- `npm run build`: pass. Existing Vite bundle-size and unresolved runtime-asset warnings remain outside this Admin V2 audit scope.
