# Learning Content Hierarchy, Release, Enrollment, and Progress Architecture

## Scope and invariants

This is backend design only. It aligns with the existing schema, authorization/RLS, authentication, subscription/seat/access, and payment/refund documents. It does not add SQL, migrations, executable RLS policies, API runtime code, storage/CDN/video/PDF integrations, quiz-engine integrations, or frontend screens.

Every learning record and decision resolves one `platform_id`. Medway programs, academic structures, resources, releases, instructor assignments, enrollments, progress, access grants, and delivery records are isolated from Elite. The same educational subject may exist in both platforms, but each platform owns its own instructor assignments, explanation style, hierarchy, assets, offers/pricing relationships, release rules, and learner evidence.

Subscription, seat, entitlement source, access grant, enrollment, scheduled availability, playback, resource completion, lesson completion, and course/program completion are separate concepts. Subscription expiry, cancellation, seat revocation, or refund can remove future paid-resource eligibility through entitlement/grant evaluation without deleting historical enrollment, progress, attempts, certificates, playback evidence, or audit records.

## Content and academic hierarchy

Named domain concepts remain meaningful: `Program`, `AcademicYear`, `Semester`, `Subject`, `Module`, `Chapter`, and `Lesson`. A program represents an academic track; academic years and semesters provide optional calendar organization; subjects represent curricular domains; modules and chapters organize instructional structure; and lessons are learner-facing instructional units.

The current schema draft records fixed named relationships. Before the physical database is frozen, add a future platform-scoped **typed hierarchy-node/placement model** as the canonical composition layer. A node has a type such as program, academic year, semester, subject, module, chapter, or lesson container; a placement establishes its parent, ordering, status, and effective visibility. Named entities retain their specialized attributes while placements permit variable depth.

This avoids hidden placeholder modules/chapters and a mandatory fixed path:

- Early academic stages may place lessons directly beneath a subject or an optional chapter.
- Later stages may use program → academic year → semester → subject → module → chapter → lesson.
- A platform may use a different valid arrangement for another track, provided typed placements and all linked records share the same `platform_id`.

The hierarchy node/placement model is a future logical schema refinement only; no table or migration is created by this document.

## Lesson and polymorphic resource model

`lessons` are ordered, publishable learning units placed in the academic hierarchy. A lesson may have zero or more ordered `lesson_resources`; a lesson is not required to contain every resource type.

Each `lesson_resources` row declares exactly one `resource_type`:

| Resource type | Purpose | Specialized record |
|---|---|---|
| `video` | Protected or unprotected instructional video | `video_assets` when an asset is required. |
| `document` | PDF or another document resource | `document_assets` for protected document metadata. |
| `quiz` | Assessment/resource entry point | `quizzes` and linked `assessments`. |
| `link` | Approved external/internal destination | Secure validated target reference only. |
| `file` | Downloadable/supporting learning material | Private storage reference and delivery policy where protected. |

Only video/document resource types can have their respective specialized asset record. Resource subtype/type correspondence is validated platform-safely. Storage references, signed URLs, stream tokens, and document delivery are transport details, not enduring entitlement; protected resources follow the authorization pipeline before delivery.

## Instructor and content ownership

Instructor/content-owner assignments are platform-scoped administrative relationships controlled by active `admin_users`, role assignments, and permissions. A content owner may draft, publish, arrange, schedule, or withdraw only the content scopes granted by platform policy. Assignment is not inferred from a course/subject title or from an account in the other platform.

The future logical model may use an auditable content-owner assignment record with `platform_id`, user/admin identity, target scope, assignment role, active period, and status. Publication, release, policy, and protected-asset actions remain backend-mediated and audited.

## Scheduled availability and release rules

`content_releases` currently represents platform-calendar availability windows. Before schema freeze, generalize it into a future release-rule model attached to a lesson or resource scope. Each rule is platform-scoped, versioned/effective-dated, and has one release mode:

1. **Immediate:** available once published and authorized.
2. **Absolute calendar:** available from/until a platform-calendar date, time, or week window using an explicit timezone.
3. **Relative:** available after a policy-defined offset from the learner's qualifying subscription or entitlement-source start.
4. **Manual:** explicitly released, held, or withdrawn by an authorized content manager.

The future model must support a manual override/evidence record rather than silently modifying the original scheduled rule. It must also record release scope, status, source baseline requirements, timezone, effective period, policy/release version, and audit references. Relative release evaluates against the recipient's currently qualifying subscription or entitlement source, not merely browser time or enrollment creation time. Cohort- and enrollment-relative schedules remain a later extension.

For every student request, release evaluation returns an explicit `available` or `not_available` result after platform/resource resolution and before protected delivery. A release result never substitutes for an active grant, and a valid grant does not bypass an unreleased or withdrawn resource.

## Enrollment and progress

`enrollments` record participation by a platform student in a program, subject, or other approved learning scope. An enrollment may be created after an eligible grant, via a permitted administrative workflow, or by a configured learning workflow. It is neither proof of payment nor a content entitlement.

Progress is learner-specific evidence. The existing `progress` model records lesson-level state; before final schema, allow related resource-progress and summary records or equivalent versioned evidence so the system can retain:

- watched seconds, watched percentage, and last safe playback position;
- resource completion evidence and timestamps;
- linked quiz attempts, results, and assessment evidence;
- lesson status/completion evidence;
- subject, program, or course-style aggregate summaries.

Playback/session telemetry can contribute evidence but cannot by itself mark a video, resource, or lesson complete. Progress writes are idempotent, platform/user/enrollment scoped, ordered where the policy requires it, and resilient to duplicate or out-of-order client telemetry. Assessment attempts and answers remain immutable historical evidence.

## Completion, prerequisite, and unlocking distinction

Authorization answers whether a student may access a specific released resource now. Completion answers whether learning evidence satisfies a content rule. Unlocking answers whether a later learning item becomes eligible under a configured progression policy. They use different inputs and records.

Lesson/resource completion, prerequisite sequencing, quiz passing, video-consumption thresholds, feedback availability, and next-lesson unlocking use versioned completion/assessment policy references. The platform does not assume that watching 100% of a video is required to unlock a lesson or that a video view completes it. Where a policy enables such a requirement, evaluation records its version and supporting evidence.

## Admin content-management flow

1. Resolve one active platform and an authorized instructor/content-manager/admin scope.
2. Create or update named academic entities and their typed hierarchy placements with sibling ordering and effective status.
3. Draft/publish lessons and ordered typed resources; validate specialized assets, protected-resource policy, and platform-safe ownership.
4. Configure a versioned release rule or controlled manual release/hold; record audit evidence rather than overwriting historical learner-facing rules.
5. Publish/withdraw through an approved backend command. Existing learner progress, assessment evidence, and audit trails remain preserved.

Content, release, protected-asset, policy, and ownership changes require platform-scoped permissions and immutable audit/admin-action evidence. Frontend catalog visibility never authorizes publication or protected access.

## Student content-access flow

1. Resolve platform from trusted backend context; authenticate and resolve the active platform-scoped app user.
2. Validate app session and required device state.
3. Resolve the requested hierarchy node, lesson, resource, and asset; reject another platform before looking up learning or entitlement state.
4. Evaluate eligible subscription/seat/promotion/administrative-exception source and explicit active `access_grant` scope/validity.
5. Evaluate release availability and then the applicable resource/protected-delivery policy.
6. Record an allow/deny access decision. On allow, issue a short-lived protected authorization/playback session and minimum-necessary watermark metadata where needed.
7. Accept separately validated progress or assessment evidence; do not treat playback issuance as completion.

Enrollment provides participation context and progress history throughout this flow but cannot bypass grants, releases, sessions, devices, or resource policy.

## Related schema tables

| Concern | Existing tables / future logical refinement |
|---|---|
| Academic structure | `programs`, `academic_years`, `semesters`, `subjects`, `modules`, `chapters`, `lessons`; future typed hierarchy nodes/placements |
| Availability and resources | `content_releases`, `lesson_resources`, `video_assets`, `document_assets`; future generalized release rules/overrides |
| Assessment | `quizzes`, `assessments`, `questions`, `attempts`, `attempt_answers` |
| Participation and evidence | `enrollments`, `progress`; future resource-progress/summary evidence where needed |
| Commercial authorization | `subscriptions`, `seats`, `promotions`, `policy_sets`, `access_grants` |
| Protected delivery and operations | `devices`, `app_sessions`, `playback_sessions`, `access_decisions`, `protected_content_authorizations`, `watermark_payloads`, `audit_logs`, `analytics_events`, `security_events`, `admin_actions` |

## API route map (contracts only)

| Route | Purpose |
|---|---|
| `GET /v1/programs`; `POST /v1/admin/programs` | Read eligible platform programs and create/manage a program through authorized backend commands. |
| `GET /v1/programs/{id}/structure`; `POST /v1/admin/learning-placements` | Read a redacted eligible structure or manage typed hierarchy placement/order. |
| `POST /v1/admin/academic-years`; `POST /v1/admin/semesters`; `POST /v1/admin/subjects`; `POST /v1/admin/modules`; `POST /v1/admin/chapters`; `POST /v1/admin/lessons` | Backend academic-content management contracts. |
| `POST /v1/admin/lessons/{id}/resources`; `POST /v1/admin/resources/{id}/publish` | Create/manage typed resources and controlled publication. |
| `POST /v1/admin/release-rules`; `POST /v1/admin/release-rules/{id}/manual-override` | Configure release behavior or issue an audited manual hold/release. |
| `GET /v1/learning/navigation`; `GET /v1/lessons/{id}` | Backend-filtered student navigation and lesson metadata. |
| `POST /v1/enrollments`; `GET /v1/enrollments/mine` | Controlled enrollment creation and learner participation read. |
| `POST /v1/progress/resources/{id}`; `POST /v1/progress/lessons/{id}`; `GET /v1/progress/summary` | Idempotent progress evidence submission and learner summaries. |
| `POST /v1/protected-access/check` | Full entitlement, grant, release, session/device, and resource-policy evaluation before protected delivery. |

## Validation, audit, and edge cases

Validate platform-safe composite relationships; typed placement parent/child compatibility; no hierarchy cycles; unique sibling ordering where required; entity and release lifecycle; valid explicit timezone and start/end windows; source-baseline validity for relative release; resource subtype/type consistency; content-owner permission; grant scope; active app session/device for protected assets; and idempotency/correlation keys for progress and management commands.

Audit structure changes, ordering, publication/withdrawal, content-owner assignments, release rule/override changes, protected-resource policy changes, enrollment creation/status changes, material progress corrections, access denials, and administrative actions. Store actor, platform, target, reason, policy/release version, correlation key, outcome, and redacted metadata. Never put asset secrets, storage credentials, raw device data, authentication tokens, or sensitive learner content into ordinary logs.

Handle cross-platform identifiers, a disabled content owner, withdrawn content with retained historical evidence, release-window expiry, subscription renewal after missed releases, changed relative-release baselines, access revocation during playback, duplicate/out-of-order telemetry, lesson/resource edits after learner activity, unavailable/missing specialized assets, and retention/anonymization requests without erasing governed academic or audit evidence.

## Open decisions before implementation

- Exact typed-node taxonomy, allowed parent/child combinations, and whether some named concepts need additional specialized fields.
- Cohort-, enrollment-, or institution-relative release audiences beyond the subscription/entitlement-source baseline.
- Academic calendar ownership, timezone governance, holidays/catch-up rules, and withdrawal behavior after learner consumption.
- Instructor role taxonomy, review/approval workflow, content versioning, and localized or duplicated content across platforms.
- Completion, prerequisite, assessment, certificate, grading, and feedback timing rules.
- Progress precision, telemetry sampling/offline-sync behavior, correction rights, and video-view/concurrency policy.
- Storage/DRM/download choices, watermark requirements, retention, privacy/erasure, and regulatory data-residency obligations.

## Prompt 43 BUC curriculum boundary note

The historical hierarchy in this document uses compatibility `platform*` terminology and describes brand-scoped teaching content. Prompt 43 adds a future canonical split: shared BUC academic reference data (`academic_levels` → `academic_semesters` → `academic_modules`) connects to, but does not own, brand-scoped `brand_courses`. Chapters, lessons, resources, releases, media, and assessments remain owned by the brand course. See [BUC Curriculum, Brand Course, and Instructor Boundary Review](buc-curriculum-brand-instructor-boundary.md). No schema or runtime change is made here.
