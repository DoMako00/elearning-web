# Admin M2 Write Command and Policy Contracts

## Scope

Prompt 52 defines the pure command, validation, policy, permission, result, and evidence contracts needed for a later Admin M2 write phase. It does not implement a write repository, database transport, SQL mutation, HTTP write endpoint, runtime-provider switch, migration, seed, frontend change, or deployment action.

The required future command flow remains:

`Admin HTTP command -> trusted Admin request context -> permission resolution -> syntactic validation -> stateful policy -> transactional write repository -> action/audit evidence -> sanitized result`

The current contract layer defines only the middle, provider-neutral portions of that flow. Prompt 53 owns write-repository and command execution implementation.

## Command catalogue and authority

All commands require the existing sensitive metadata: trusted resolved brand context, correlation ID, reason, and idempotency key. Actor identity and server timestamps come from the request/context and future execution boundary, never from a client payload.

| Domain | Commands | Permission | Scope |
| --- | --- | --- | --- |
| Global instructor | `CreateInstructor`, `UpdateInstructor`, `SetInstructorStatus` | `admin.instructors.create`, `admin.instructors.update` | Existing active Admin brand context authorizes and audits the global action; it does not make the instructor brand-owned. |
| Brand instructor | `AssignInstructorToBrand`, `SetBrandInstructorStatus` | `admin.brand_instructors.assign`, `admin.brand_instructors.update` | Explicit canonical `brandId`. |
| Brand course | `CreateBrandCourse`, `UpdateBrandCourse`, `SetBrandCourseStatus` | `admin.brand_courses.create`, `admin.brand_courses.update` | Explicit canonical `brandId` and course ID for target operations. |
| Course instructor | `AssignInstructorToCourse`, `SetCourseInstructorStatus` | `admin.course_instructors.assign`, `admin.course_instructors.update` | Explicit canonical `brandId`, `courseId`, and `instructorId`. |

Create and assignment commands use schema defaults for active association status. New brand courses are explicitly `draft`; publishing is a separate command. Command success results intentionally contain only target IDs. No raw database row is a command result contract.

## Validation and policies

Syntactic validation is pure and rejects malformed UUIDs, blank required text, unsupported enum values, absent brand scope, empty update payloads, and invalid curriculum/module tuples. Text fields are trimmed for validity but no unsupported database maximum is invented: the reviewed schema uses unbounded `text`.

Stateful policy receives facts from a future handler and performs no database read itself:

- A brand must exist and be active for new active relationships.
- An instructor must exist and be active before a new active brand or course assignment.
- An existing active association is a conflict; an existing inactive association requires explicit reactivation rather than a second logical row.
- A course must resolve inside the explicit requested brand. Cross-brand combinations fail safely without existence disclosure.
- A course-instructor assignment requires an active matching `brand_instructors` relationship. The database composite foreign keys remain the final same-brand race-condition backstop.
- `curriculum` courses require an existing shared academic module. `standalone` courses may retain a valid module reference or use `null`.
- Brand-local `courseCode` is unique through the schema, is immutable after creation, and is allowed to repeat in another brand. No policy assumes a unique `(brand_id, academic_module_id)` pair.

## Lifecycles and prohibited actions

Instructor, brand-instructor, and course-instructor records use `active | inactive`; no hard-delete command exists. Inactivation preserves historical assignments and creates no access or entitlement effect.

Brand-course transitions are deliberately conservative:

| From | Allowed target | Notes |
| --- | --- | --- |
| `draft` | `published`, `archived` | Publishing requires only M2 structural validity; it does not require content, media, a teaching assignment, payment, enrollment, or access state. |
| `published` | `archived` | Archive is explicit and auditable. |
| `archived` | none | Reopen and direct republish are deferred to a separately approved high-authority policy. |
| any status | same status | Idempotent success at the policy contract layer. |

`academic_levels`, `academic_semesters`, and `academic_modules` have no Prompt 52 runtime CRUD contract. The seeded BUC reference structure may only be changed later through a separately approved controlled curriculum-change command family with source evidence, expected state/version, high-authority permission, transaction, and audit requirements.

No command creates or implies a user, admin profile, login, student relationship, subscription, payment, commercial product, enrollment, access grant, content hierarchy, media, or protected-resource entitlement.

## Errors, evidence, idempotency, and Prompt 53

Malformed input maps to `validation_failed`; missing scoped state maps to safe target/policy failures; duplicate active relationships map to `conflict`; rejected eligibility maps to `policy_validation_failed`; invalid course transitions map to `lifecycle_transition_denied`; and authorization maps to `permission_denied`. Future persistence or evidence failures must remain sanitized and must not expose SQL, connection, provider, or credential data.

Prompt 53 must execute a successful mutation and its required Admin action/audit evidence atomically. A successful write must not remain without required evidence. Failed or denied attempts retain the existing boundary’s action-evidence behavior when available. Idempotency metadata is mandatory; pre-checks do not replace database unique constraints or transaction handling for concurrent creates, assignments, and lifecycle races.

Medway and Elite remain independent student-facing brands. Instructors remain global, but their associations and course assignments are explicit and independently scoped. A shared academic module or shared instructor never shares course content, commerce, subscriptions, enrollment, or access.
