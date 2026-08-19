# Admin Dashboard Backend Architecture

## 1. Scope

This document defines the backend architecture and contract boundaries for a future platform-scoped admin dashboard. It covers:

- Admin dashboard read models and redacted detail views.
- Backend-mediated admin command boundaries.
- Permission, role, platform, target-relationship, lifecycle, and policy validation.
- Audit, security, admin-action, access-decision, payment, playback, and assessment evidence expectations.
- Isolation between the Medway and Elite platforms.
- Contract expectations for a frontend that consumes backend query and command adapters.

This is an architectural contract, not an implementation. It does not create or apply SQL or migrations, implement a runtime server, add Supabase integration, connect a payment provider, connect a storage/CDN/video/PDF provider, create frontend UI, add executable RLS policies, or implement real API routes. It also does not add mock data or modify the existing frontend/student dashboard.

The frontend may use route visibility, local permission presentation, loading state, or mock adapters for usability and development, but none of these is authorization. Backend authorization remains authoritative for every read that contains protected administrative information and every consequential command.

The document aligns with the current logical schema, ERD, authorization/RLS, authentication/session/device, subscription/access, payment/refund, learning-content, protected-media, and quiz/assessment documents. Where those documents or current domain types disagree, the disagreement is recorded in [Open Decisions](#12-open-decisions) and must not be silently resolved by an implementation.

## 2. Authority Model

### 2.1 Authority layers

An admin request has the following logical authority layers:

1. **Authenticated subject** — the trusted provider identity established by the future authentication adapter. Authentication proves the subject; it does not prove platform membership, admin status, or permission.
2. **Platform-scoped app user** — the `app.users` business account resolved for exactly one active platform. The same provider subject may have separate Medway and Elite business accounts.
3. **Platform-scoped admin user** — the `admin_users` record for the resolved platform. It is distinct from a student profile and must be active, not revoked or suspended, and not beyond any elevated-access expiry.
4. **Role assignments** — active, time-valid `admin_user_roles` records connected to platform-scoped roles.
5. **Permissions** — active permissions granted through platform-scoped roles and role-permission relationships.
6. **Target relationship** — the requested entity and every related entity must belong to the same platform and satisfy the command’s relationship rules.
7. **Workflow authority** — lifecycle, policy-version, reason, idempotency, and concurrency checks required for the target operation.

An organization membership or staff membership may support an administrative relationship, but membership alone never grants learning access. A payment, subscription, seat, enrollment, session, device, or visible course record also never authorizes an admin operation by itself.

### 2.2 Role assignment lifecycle

Admin role assignment is historical and platform-scoped. A role assignment must record its start, optional end, status, assigning authority, and audit correlation. Assignment, expiry, suspension, and revocation are separate state transitions; historical assignments are not physically deleted.

Elevated access is time-bounded where required. Every command rechecks current admin status, role-assignment validity, permission validity, and `elevated_access_expires_at` at command time. A role or permission read by the browser is not sufficient evidence of authority.

### 2.3 Backend authority rules

- UI permission gates are presentation only.
- Route guards are not security controls.
- Client role claims, client-supplied platform identifiers, and user-editable JWT metadata are not trusted authority sources.
- Backend handlers validate permission before loading or mutating protected target data.
- Backend handlers validate platform equality for the target and every relevant relationship.
- Backend handlers validate lifecycle state, effective policy version, required reason, and expected concurrency/idempotency metadata.
- Consequential operations append immutable audit/admin/security evidence.
- RLS, where eventually used, is defense-in-depth and does not replace workflow validation.

## 3. Platform Resolution

Every request resolves exactly one active platform: `medway` or `elite`. A request with ambiguous, missing, inactive, or conflicting platform context is rejected before administrative data is loaded.

The required logical flow is:

1. Resolve the platform from a trusted host, path, server-controlled header, or approved request selector. Do not accept an arbitrary client platform ID as authority.
2. Validate that the resolved platform is active.
3. Resolve the authenticated provider identity from the trusted authentication boundary.
4. Resolve exactly one active `app.users` row for that provider identity and platform.
5. When an admin operation is requested, resolve the platform-scoped `admin_users` row.
6. Resolve active role assignments and permissions for that admin user in the same platform.
7. Validate that the target entity, related source records, and requested scope belong to the same platform.
8. Validate workflow state, lifecycle transitions, policy version, reason, idempotency key, and correlation metadata.
9. Execute the authorized query or command through a backend module.
10. Append audit, admin-action, security, access-decision, payment, playback, or assessment evidence where required by the operation.

No Medway user, role, permission, session, device, subscription, payment, seat, grant, lesson, quiz, media asset, or audit record may authorize or affect Elite. The reverse is equally prohibited. Platform identity must be present in every query scope, command context, repository interface, cache key, and audit record.

## 4. Admin Modules

The following are logical future modules under `api/src/modules/admin/`. They are architectural boundaries only; no modules or runtime routes are created by this document.

| Module | Purpose and primary entities | Read models | Commands and permissions | Audit and redaction requirements | Forbidden shortcuts |
|---|---|---|---|---|---|
| `identity` | Admin identity, roles, permissions, memberships, platform users | Admin users, role assignments, permission summaries | Assign/revoke roles; account authority actions; `admin.roles.*` | Record actor, platform, target, reason, expiry, outcome; never expose provider secrets or editable JWT claims | Treating a client role or membership label as authority |
| `students` | Student accounts, profiles, academic summaries | Student list, student detail, account/access summaries | Suspend/restore; sensitive-profile support flow; `admin.students.*` | Redact contact and academic-sensitive data according to support permission | Mutating student state from the browser or inferring access from enrollment |
| `security` | Devices, sessions, OTP-related support state, security events | Device/session summaries, risk/event views | Revoke session/device; device-replacement decision; `admin.sessions.revoke`, `admin.devices.revoke` | Never expose OTP values, raw fingerprints, tokens, or secrets; append security/admin evidence | Using device visibility or a session ID as authorization |
| `commercial` | Orders, payments, evidence, transactions, refunds | Redacted finance queues and detail views | Review/reconcile payment; decide/process refund; `admin.payments.*`, `admin.refunds.*` | Payment evidence and provider payloads are redacted; all finance commands are audited and append-only | Treating confirmation as access or writing provider state from the client |
| `subscriptions` | Plans, subscriptions, owners, policy snapshots | Lifecycle, owner, plan, policy, and commercial-impact views | Evaluate/activate subscription; `admin.subscriptions.read` plus approved command permission | Preserve terms and lifecycle evidence; show commercial status separately from access | Activating access directly from payment or subscription UI state |
| `access` | Seats, entitlements, explicit grants, decisions | Grant, seat, source, scope, validity, and decision views | Seat decisions; exception grant; grant revoke/suspend; entitlement/protected-access checks | Record source, scope, policy snapshot, reason, and decision; redact sensitive internals | Treating enrollment, payment, seat assignment, or signed URLs as access |
| `content` | Program-to-lesson hierarchy, resources, releases, ownership | Content tree, resource, release, publication, owner views | Create/update hierarchy, publish/withdraw, release override, resource attachment | Record target/version/reason and preserve historical publication evidence | Bypassing release/policy validation or exposing protected asset URLs |
| `media` | Video/document assets, delivery policies, playback, watermark and incidents | Asset, authorization, playback, watermark, access-decision, incident views | Register/update metadata, change policy, withdraw asset, revoke playback, incident action | Never return permanent media URLs, tokens, raw storage refs, or watermark secrets | Direct provider access, durable public URLs, or browser-side authorization |
| `assessments` | Quizzes, assessments, exam periods, attempts, review state | Assessment, attempt, scoring/review, policy snapshot views | Publish/withdraw, invalidate attempt, review/moderation/release placeholders | Preserve question/answer snapshots; hide answer keys and restricted rationale | Letting client timers, scores, or attempt IDs decide eligibility |
| `operations` | Audit, security, admin-action, analytics evidence | Append-only operational search and timelines | Evidence queries; no general deletion command | Redact before/after snapshots and sensitive payload references | Treating analytics as financial/access truth or deleting evidence |
| `governance` | Policy sets, permission governance, platform controls | Policy and permission summaries | Policy/role/permission changes through approved governance workflows | Require elevated authority, reason, version, and immutable audit | Editing active policy or permissions without lifecycle/version controls |

## 5. Admin Read Models

Read models are backend-produced, platform-filtered, permission-checked, and redacted. They are not direct table mirrors. A read response must include enough platform context for the frontend to display scope, but must not expose provider secrets, access tokens, permanent media URLs, raw fingerprints, private answer keys, or unrestricted payment payloads.

### Overview

The overview read model may aggregate:

- Pending payment reviews.
- Pending refunds.
- Suspicious security events.
- Active and expired subscriptions.
- Active and revoked access grants.
- Content awaiting publication or release.
- Assessment review queue.
- Recent audit logs and admin actions.

Each aggregate must retain platform scope and a source timestamp. Aggregates are operational summaries, not authorization decisions and not a replacement for opening the authoritative domain record.

### Students

The student list read model may contain:

- Student identity summary.
- Academic profile summary.
- Account status.
- Redacted subscription/access summary.
- Redacted device/session summary.
- Risk flags derived from controlled security evidence.
- Recent audit/security event summary where the caller has permission.

### Student Detail

The student detail view is organized into:

- **Summary** — platform user, profile, lifecycle, and safe academic summary.
- **Access** — explicit grants, eligible sources, scopes, validity, revocation, and recent access decisions.
- **Devices & sessions** — redacted device/session state and controlled revocation affordances.
- **Payments/refunds** — redacted orders, payments, evidence, transactions, refunds, and commercial impact.
- **Learning evidence** — enrollment, progress, attempts, scores/review state, and preserved historical evidence.
- **Audit/security** — relevant append-only audit, admin, and security events.

### Commercial

The commercial read models cover:

- Orders.
- Payments.
- Manual payment evidence.
- Payment transactions.
- Refunds.
- Commercial access impact, shown as an evaluated relationship rather than an assumption.

Payment confirmation, transaction evidence, and subscription state must remain visually and contractually distinct from `access_grants`.

### Subscriptions and Seats

The read models cover:

- Subscription lifecycle.
- Individual or organization owner.
- Plan and policy snapshot.
- Seat capacity and assignment state.
- Seat replacement state.
- Resulting grant impact, if evaluated.

Seat assignment is a named entitlement capacity record. It must never be represented as shared credentials.

### Access Grants

The read model covers:

- Recipient.
- Source type and source ID.
- Scope type and scope ID.
- Validity window.
- Status and revocation.
- Policy/decision snapshot.
- Related access decisions.

The model must not imply that a grant bypasses release windows, resource policy, active session/device requirements, or platform checks.

### Content

The content model covers:

- Program, academic year, semester, subject, module, chapter, and lesson hierarchy.
- Lesson resources.
- Release rules and availability windows.
- Publication status.
- Content owner/admin assignment.

The hierarchy is platform-scoped and must preserve typed resource/subtype correspondence.

### Media

The media model covers:

- Video assets.
- Document assets.
- Delivery policy references.
- Playback sessions.
- Protected content authorizations.
- Watermark payload metadata, limited to approved minimum-necessary fields.
- Access decisions.
- Media incidents.

It must never expose permanent public MP4/PDF/file URLs, storage provider credentials, bearer tokens, raw storage keys, or unrestricted watermark payloads.

### Assessments

The assessment model covers:

- Quizzes.
- Assessments.
- Exam-period or scheduled-availability metadata.
- Future question-bank/composition model references.
- Attempts.
- Scoring and review state.
- Version and policy snapshots.

Learner answer keys, restricted rationales, internal reviewer notes, and sensitive response payloads are not returned unless a separate, explicit policy permits a redacted view.

### Operations

The operations model covers:

- Audit logs.
- Security events.
- Admin actions.
- Analytics events where relevant to an operational view.

Analytics is observational evidence only. It is never the financial, entitlement, access, or audit source of truth.

## 6. Admin Command Map

All commands are backend-mediated. The table describes minimum command expectations; exact permission identifiers must be finalized against the permission matrix before implementation.

| Command | Module | Target entity | Required permission | Required reason? | Idempotency key? | Correlation ID? | Policy validation? | Audit/admin/security event? | Notes |
|---|---|---|---|---|---|---|---|---|---|
| Suspend student | students | `users` / `student_profiles` | `admin.students.suspend` | Yes | Yes | Yes | Account/security policy | Audit + security | Preserve learning and financial history |
| Restore student | students | `users` / `student_profiles` | `admin.students.restore` | Yes | Yes | Yes | Account policy | Audit + security | Must not restore unrelated grants automatically |
| Update sensitive profile data through support flow | students | `users` / profile | Restricted support permission | Yes | Yes | Yes | Sensitive-change policy | Audit + security | OTP/support verification remains backend-owned |
| Revoke current session | security | `app_sessions` | `admin.sessions.revoke` | Yes | Yes | Yes | Session policy | Audit + security | Do not accept a client session as authority |
| Revoke all sessions | security | User sessions | `admin.sessions.revoke` | Yes | Yes | Yes | Session/account policy | Audit + security | Platform-scoped only |
| Revoke device | security | `devices` | `admin.devices.revoke` | Yes | Yes | Yes | Device policy | Audit + security | Fingerprint references remain redacted |
| Approve/reject device replacement | security | `device_replacements` | Restricted security permission | Yes | Yes | Yes | OTP/device policy | Audit + security | Preserve old/new device evidence |
| Review payment evidence | commercial | Payment/evidence | `admin.payments.review` | Yes | Yes | Yes | Payment policy | Audit + admin | Review does not itself issue access |
| Reconcile payment | commercial | `payments` / payment transaction | `admin.payments.review` | Yes | Yes | Yes | Reconciliation policy | Audit + admin + security where relevant | Append transaction evidence |
| Approve/reject refund | commercial | `refunds` | `admin.refunds.decide` | Yes | Yes | Yes | Refund policy | Audit + admin | Never delete original payment |
| Process refund | commercial | `refunds` / payment transaction | Restricted finance permission | Yes | Yes | Yes | Provider/manual processing policy | Audit + admin | Provider integration remains future work |
| Apply refund access effect | commercial/access | Subscription/grants | Restricted finance/access permission | Yes | Yes | Yes | Commercial/access policy | Audit + admin + security | Evaluate suspension/revocation; preserve history |
| Activate/evaluate subscription after commercial approval | subscriptions | `subscriptions` | Restricted commercial permission | Yes | Yes | Yes | Plan/policy/order lifecycle | Audit + admin | Does not directly authorize content |
| Approve/reject seat assignment | subscriptions/access | `seats` | `admin.seats.manage` | Yes | Yes | Yes | Capacity/recipient policy | Audit + admin + security | Named real user only |
| Approve/reject seat replacement | subscriptions/access | Seat replacement | `admin.seats.manage` | Yes | Yes | Yes | Replacement/abuse policy | Audit + admin + security | Reevaluate grants after decision |
| Issue admin exception grant | access | `access_grants` | `admin.grants.issue_exception` | Yes | Yes | Yes | Exception/scope policy | Audit + admin + security | Explicit scope, validity, source, and snapshot required |
| Revoke/suspend access grant | access | `access_grants` | `admin.grants.revoke` | Yes | Yes | Yes | Grant lifecycle policy | Audit + admin + security | Never erase historical access decisions |
| Run entitlement check | access | Commercial/access context | Restricted access permission | No, unless override follows | Yes | Yes | Entitlement policy | Audit if consequential | Read/evaluation result only unless it triggers a governed transition |
| Run protected-access check | access/media | Resource/grant/session/device | Restricted access permission | No, unless override follows | Yes | Yes | Full protected-access pipeline | Access decision + audit where admin initiated | Never returns durable delivery URL |
| Create/update hierarchy item | content | Academic hierarchy entity | `admin.content.read` plus authoring permission | Yes for mutation | Yes | Yes | Hierarchy/lifecycle policy | Audit + admin | No cross-platform parent references |
| Publish lesson | content | `lessons` | `admin.content.publish` | Yes | Yes | Yes | Publication/resource/release policy | Audit + admin | Does not expose asset URLs |
| Withdraw lesson | content | `lessons` | `admin.content.withdraw` | Yes | Yes | Yes | Withdrawal/active-delivery policy | Audit + admin + security if active delivery affected | Preserve history |
| Set release rule | content | `content_releases` / release rule | Restricted content permission | Yes | Yes | Yes | Release/timezone policy | Audit + admin | Manual override is separately recorded |
| Manual release override | content | Release rule/release | Restricted elevated content permission | Yes | Yes | Yes | Override policy/version | Audit + admin + security | Time-bounded and reasoned |
| Attach resource | content | `lesson_resources` | Restricted content permission | Yes | Yes | Yes | Resource subtype/hierarchy policy | Audit + admin | Resource type must match specialized asset |
| Replace resource metadata | content/media | Resource/asset metadata | Restricted content/media permission | Yes | Yes | Yes | Asset and publication policy | Audit + admin | Does not replace protected provider integration |
| Register asset metadata | media | Video/document asset | `admin.media.manage` | Yes | Yes | Yes | Resource subtype/delivery policy | Audit + admin | Storage reference remains private metadata |
| Update delivery policy | media | Asset/policy reference | `admin.media.manage` | Yes | Yes | Yes | Versioned media policy | Audit + admin + security | No durable URL generation |
| Withdraw asset | media | Video/document asset | `admin.media.manage` | Yes | Yes | Yes | Asset lifecycle/active playback policy | Audit + admin + security | Handle active playback through governed policy |
| Revoke playback session | media/security | `playback_sessions` | `admin.media.manage` or security permission | Yes | Yes | Yes | Playback/session policy | Audit + admin + security | Platform/user/session ownership required |
| Open media incident | media | Incident/reference | `admin.media.manage` | Yes | Yes | Yes | Incident policy | Audit + admin + security | Store redacted references only |
| Apply incident action | media/security | Incident/asset/session/grant | Restricted incident permission | Yes | Yes | Yes | Incident/access policy | Audit + admin + security | Any grant effect must be explicit |
| Publish assessment | assessments | `assessments` | Restricted assessment permission | Yes | Yes | Yes | Version/release policy | Audit + admin | Publish immutable version reference |
| Withdraw assessment | assessments | `assessments` | Restricted assessment permission | Yes | Yes | Yes | Assessment lifecycle policy | Audit + admin | Preserve attempts and answers |
| Invalidate attempt | assessments | `attempts` | `admin.assessments.review` | Yes | Yes | Yes | Attempt/integrity policy | Audit + admin + security | Preserve attempt/answer evidence |
| Manual review/moderation placeholder | assessments | Attempt/result | `admin.assessments.review` | Yes | Yes | Yes | Scoring/review policy | Audit + admin | Exact grading workflow remains future design |
| Release score/feedback placeholder | assessments | Result/review state | `admin.assessments.review` | Yes | Yes | Yes | Result-release policy | Audit + admin | Do not expose answer keys by default |
| Assign admin role | governance | `admin_user_roles` | `admin.roles.manage` | Yes | Yes | Yes | Role/elevated-access policy | Audit + admin + security | Same-platform target and role only |
| Revoke admin role | governance | `admin_user_roles` | `admin.roles.manage` | Yes | Yes | Yes | Role lifecycle policy | Audit + admin + security | Preserve assignment history |
| Update role permission placeholder | governance | `role_permissions` | `admin.roles.manage` | Yes | Yes | Yes | Governance/version policy | Audit + admin + security | Must not use user-editable metadata |
| Create/update policy set placeholder | governance | `policy_sets` | `admin.policies.manage` | Yes | Yes | Yes | Policy version/effective-period policy | Audit + admin + security | No silent rewrite of active snapshots |

## 7. Admin API Route Contract Draft

The following route map is a contract draft only. It does not create routes or runtime code. Every route requires a trusted authenticated request, exactly one active platform context, a platform-scoped admin authority check, target relationship validation, and redacted response serialization.

### Route-wide contract

- **Request context:** trusted authenticated subject, resolved platform, platform app user, admin user, active roles/permissions, correlation ID, and session/device context where the domain requires it.
- **Platform context:** required on every request; supplied through the trusted platform-resolution mechanism, not treated as an arbitrary body field.
- **Request bodies:** command bodies contain only intent, target-specific input, reason where required, idempotency key, and optional expected-version/concurrency information. They do not contain authority claims.
- **Responses:** use platform-scoped redacted read models or command outcomes containing status, target reference, outcome, correlation ID, and safe reason/message data.
- **Redaction:** no OTP values, secrets, access tokens, raw device fingerprints, payment instruments, unrestricted provider payloads, durable media URLs, storage credentials, answer keys, or private reviewer notes.
- **Audit:** every mutating route appends the appropriate audit/admin/security record; read routes may append access/audit telemetry where policy requires it.

### Identity and students

| Route | Purpose | Permission | Body summary | Response summary | Audit notes |
|---|---|---|---|---|---|
| `GET /v1/admin/students` | List platform students with filters/pagination | `admin.students.read` | Query filters, sort, cursor | Redacted student summaries | Read access may be logged |
| `GET /v1/admin/students/{id}` | Load student detail tabs/read models | `admin.students.read` | Tab/filter query | Redacted detail model | Sensitive-tab access may be logged |
| `POST /v1/admin/students/{id}/suspend` | Suspend student account/profile | `admin.students.suspend` | Reason, idempotency, correlation, expected version | Command outcome + updated status | Audit + security |
| `POST /v1/admin/students/{id}/restore` | Restore student account/profile | `admin.students.restore` | Reason, idempotency, correlation, expected version | Command outcome + updated status | Audit + security |
| `POST /v1/admin/students/{id}/sessions/revoke-all` | Revoke all platform sessions | `admin.sessions.revoke` | Reason, idempotency, correlation | Outcome + count summary | Audit + security |
| `POST /v1/admin/devices/{id}/revoke` | Revoke one platform device | `admin.devices.revoke` | Reason, idempotency, correlation | Outcome + redacted device status | Audit + security |

### Commerce

| Route | Purpose | Permission | Body summary | Response summary | Audit notes |
|---|---|---|---|---|---|
| `GET /v1/admin/orders` | List platform orders | `admin.payments.read` | Filters/pagination | Redacted order summaries | Read access may be logged |
| `GET /v1/admin/payments` | List payment review queue | `admin.payments.read` | Filters/pagination | Redacted payment summaries | No instruments/provider secrets |
| `GET /v1/admin/payments/{id}` | Payment/evidence/transaction detail | `admin.payments.read` | Detail query | Redacted payment detail | Evidence access may be logged |
| `POST /v1/admin/payments/{id}/review` | Approve/reject payment evidence | `admin.payments.review` | Decision, reason, idempotency, correlation, expected version | Outcome + payment status | Audit + admin |
| `POST /v1/admin/payments/{id}/reconcile` | Reconcile payment evidence/transaction state | `admin.payments.review` | Reconciliation result, reason, idempotency, correlation | Outcome + appended transaction reference | Audit + admin; append-only transaction evidence |
| `GET /v1/admin/refunds` | List platform refunds | `admin.refunds.read` | Filters/pagination | Redacted refund summaries | Read access may be logged |
| `GET /v1/admin/refunds/{id}` | Refund detail and commercial impact | `admin.refunds.read` | Detail query | Redacted refund detail | No instrument/provider secret |
| `POST /v1/admin/refunds/{id}/decision` | Approve/reject refund | `admin.refunds.decide` | Decision, reason, idempotency, correlation, expected version | Outcome + lifecycle status | Audit + admin |
| `POST /v1/admin/refunds/{id}/process` | Process approved refund | Restricted finance permission | Reason, idempotency, correlation, expected version | Outcome + processing status | Audit + admin; provider integration remains future |

### Subscriptions and access

| Route | Purpose | Permission | Body summary | Response summary | Audit notes |
|---|---|---|---|---|---|
| `GET /v1/admin/subscriptions` | List subscriptions and commercial lifecycle | `admin.subscriptions.read` | Filters/pagination | Redacted subscription summaries | Read access may be logged |
| `GET /v1/admin/subscriptions/{id}` | Subscription, owner, plan, seats, grant impact | `admin.subscriptions.read` | Detail query | Redacted detail model | Preserve terms snapshot references |
| `GET /v1/admin/seats` | List platform seat state | `admin.seats.manage` or read permission | Filters/pagination | Redacted seat summaries | No shared-credential implication |
| `POST /v1/admin/seat-replacements/{id}/decision` | Approve/reject replacement | `admin.seats.manage` | Decision, reason, idempotency, correlation | Outcome + replacement status | Audit + admin + security |
| `GET /v1/admin/access-grants` | List explicit grants | `admin.grants.read` | Filters/pagination | Grant/source/scope/validity summaries | Access read may be logged |
| `POST /v1/admin/access-grants` | Issue controlled admin exception grant | `admin.grants.issue_exception` | Recipient, scope, validity, reason, policy ref, idempotency, correlation | Grant outcome + redacted grant | Audit + admin + security |
| `POST /v1/admin/access-grants/{id}/revoke` | Revoke/suspend grant | `admin.grants.revoke` | Reason, idempotency, correlation, expected version | Outcome + grant status | Audit + admin + security |

### Content

| Route | Purpose | Permission | Body summary | Response summary | Audit notes |
|---|---|---|---|---|---|
| `GET /v1/admin/content/tree` | Load platform content hierarchy | `admin.content.read` | Scope/filter query | Redacted hierarchy/tree read model | Read access may be logged |
| `GET /v1/admin/lessons/{id}` | Load lesson/resources/releases | `admin.content.read` | Detail query | Redacted lesson detail; no durable media URL | Read access may be logged |
| `POST /v1/admin/lessons/{id}/publish` | Publish lesson | `admin.content.publish` | Reason, version, idempotency, correlation | Outcome + publication state | Audit + admin |
| `POST /v1/admin/lessons/{id}/withdraw` | Withdraw lesson | `admin.content.withdraw` | Reason, version, idempotency, correlation | Outcome + lifecycle state | Audit + admin; security if delivery affected |
| `POST /v1/admin/releases/{id}/override` | Apply manual release override | Restricted elevated content permission | Decision, window, reason, policy/version, idempotency, correlation | Outcome + release state | Audit + admin + security |

### Media

| Route | Purpose | Permission | Body summary | Response summary | Audit notes |
|---|---|---|---|---|---|
| `GET /v1/admin/media/assets` | List protected asset metadata | `admin.media.read` | Filters/pagination | Redacted asset summaries | No storage refs or durable URLs |
| `GET /v1/admin/media/assets/{id}` | Asset, policy, publication, incident detail | `admin.media.read` | Detail query | Redacted asset detail | Provider metadata redacted |
| `GET /v1/admin/media/access-decisions` | Search protected access decisions | `admin.media.read` or `admin.security.read` | Filters/pagination | Redacted allow/deny evidence | Do not expose grant secrets/tokens |
| `GET /v1/admin/media/playback-sessions` | Search playback lifecycle | `admin.media.read` | Filters/pagination | Redacted session summaries | No delivery tokens |
| `POST /v1/admin/media/playback-sessions/{id}/revoke` | Revoke playback session | `admin.media.manage` | Reason, idempotency, correlation | Outcome + session status | Audit + security |
| `POST /v1/admin/media/incidents` | Open media incident | `admin.media.manage` | Asset/session/reference, reason, evidence refs, idempotency, correlation | Incident outcome | Audit + admin + security |

### Assessments

| Route | Purpose | Permission | Body summary | Response summary | Audit notes |
|---|---|---|---|---|---|
| `GET /v1/admin/assessments` | List assessments/review state | `admin.assessments.read` | Filters/pagination | Redacted assessment summaries | Hide answer keys |
| `GET /v1/admin/assessments/{id}` | Assessment/version/policy detail | `admin.assessments.read` | Detail query | Redacted assessment detail | Restricted authoring fields omitted by default |
| `GET /v1/admin/attempts` | List attempts/review queue | `admin.assessments.read` | Filters/pagination | Redacted attempt summaries | Sensitive responses redacted |
| `GET /v1/admin/attempts/{id}` | Load attempt/review evidence | `admin.assessments.review` | Detail query | Policy-permitted attempt detail | Answer keys/private notes excluded |
| `POST /v1/admin/attempts/{id}/invalidate` | Invalidate attempt | `admin.assessments.review` | Reason, idempotency, correlation, expected version | Outcome + attempt state | Audit + admin + security |

### Operations and governance

| Route | Purpose | Permission | Body summary | Response summary | Audit notes |
|---|---|---|---|---|---|
| `GET /v1/admin/audit-logs` | Search audit evidence | `admin.audit.read` | Filters/pagination | Redacted immutable audit entries | Access may itself be logged |
| `GET /v1/admin/security-events` | Search security evidence | `admin.security.read` | Filters/pagination | Redacted security events | Sensitive metadata redacted |
| `GET /v1/admin/admin-actions` | Search admin command outcomes | `admin.audit.read` | Filters/pagination | Redacted admin-action entries | Immutable evidence |
| `GET /v1/admin/admin-users` | List platform admin users | `admin.roles.read` | Filters/pagination | Admin summaries, roles, expiry | No provider secrets |
| `GET /v1/admin/roles` | List platform roles/permissions | `admin.roles.read` | Filters/pagination | Role/permission summaries | No user-editable claim data |
| `POST /v1/admin/admin-users/{id}/roles` | Assign role | `admin.roles.manage` | Role, dates, reason, idempotency, correlation | Outcome + assignment summary | Audit + admin + security |
| `POST /v1/admin/admin-user-roles/{id}/revoke` | Revoke role assignment | `admin.roles.manage` | Reason, idempotency, correlation | Outcome + assignment status | Audit + admin + security |

## 8. Redaction Rules

The backend returns minimum-necessary information for the caller’s platform-scoped permission. Redaction is part of the contract, not a frontend formatting step.

- **OTP data:** never return OTP values, hashes, challenge secrets, delivery provider responses, or full destination material. Return purpose, lifecycle, expiry status, and safe timestamps only.
- **Phone/email:** mask or omit contact data unless the caller has an explicit support/identity permission. Never expose contact data from the wrong platform.
- **Device fingerprints:** return a stable redacted reference, device type, trust status, and lifecycle timestamps. Never return raw fingerprints or derived secrets.
- **Payment evidence:** return evidence status, claimed amount/currency, safe timestamps, reviewer outcome, and redacted evidence references. Never return raw credential images, full instrument details, or public evidence URLs.
- **Payment instruments:** never return card numbers, bank credentials, wallet secrets, authentication values, or provider tokens.
- **Provider payloads:** expose only normalized, redacted fields needed for reconciliation or support. Keep raw payloads behind protected references.
- **Access tokens:** never return app/session bearer tokens, playback tokens, signed URLs, or authorization secrets in admin read models.
- **Storage references:** return an internal opaque asset reference or normalized metadata only. Never return provider bucket paths or permanent public URLs.
- **Watermark payloads:** return approved minimum-necessary metadata such as status, template reference, and issuance time. Never return secrets, raw device data, payment data, or access tokens.
- **Assessment answer keys/rationales:** omit correct answers, grading keys, private rationales, item exposure controls, and reviewer notes unless a separately authorized review model explicitly permits a redacted field.
- **Audit before/after snapshots:** return normalized summaries or protected references. Do not expose raw sensitive payloads, secrets, or unrestricted historical copies.

## 9. Audit and Evidence Model

All evidence is platform-scoped, append-only, correlated, and redacted.

- **`audit_logs`:** broad immutable evidence for consequential domain and administrative state changes. Include actor, platform, target, action, reason, policy version, correlation ID, outcome, and protected before/after references.
- **`admin_actions`:** administrative command evidence. Include the platform-scoped admin user, command type, target, authorization reference, timestamp, outcome, reason, correlation ID, and idempotency result.
- **`security_events`:** authentication, OTP, device, session, access-denied, admin-security, abuse, and incident evidence. Include safe metadata references rather than secrets or raw fingerprints.
- **`access_decisions`:** immutable allow/deny evidence for resource access evaluation. Include platform, user, resource, grant reference where applicable, reason code, policy version/reference, and evaluation time.
- **`payment_transactions`:** append-only financial event evidence. A transaction records evidence of payment state; it does not itself activate a subscription or grant access.
- **`playback_sessions`:** short-lived protected delivery lifecycle evidence bound to platform, user, app session, device, grant, asset, and delivery policy. Playback session records are not durable media permissions.
- **Watermark evidence:** record only approved payload/template references, issuance/refresh time, playback linkage, and platform scope. Do not store or return unnecessary sensitive data.
- **Correlation IDs:** every command and consequential evaluation receives or generates a correlation ID carried through domain, audit, security, payment, access, and provider-adapter boundaries.
- **Idempotency keys:** every retryable mutation or externally consequential command requires an idempotency key. Replays return the original safe outcome or a deterministic conflict; they must not append duplicate state transitions.
- **Reason requirements:** suspension, restoration, revocation, override, refund, incident, invalidation, role, policy, and exception-grant commands require a meaningful reason. Reasons are redacted where necessary but remain available to authorized audit readers.
- **Append-only rule:** audit, security, admin-action, access-decision, transaction, playback, assessment-attempt, answer, and evidence history is never physically deleted or rewritten. Corrections are new governed records.

RLS, when introduced, must protect exposed application data but must not be used as the workflow engine. Backend command handlers validate permission, platform, target relationship, lifecycle, policy, reason, and idempotency before any mutation.

## 10. Permission Matrix

The following is an initial logical matrix. Every permission is evaluated within one active platform and never across Medway/Elite boundaries.

| Permission | Allows | Does not allow | Platform scope | Reason/audit |
|---|---|---|---|---|
| `admin.students.read` | Read redacted student summaries/details | Suspend, restore, change sensitive data, or access unrestricted secrets | Required | Read access may be logged; mutations require their own permission and audit |
| `admin.students.suspend` | Suspend a platform student account/profile | Delete history, revoke unrelated grants, or affect the other platform | Required | Reason and audit mandatory |
| `admin.students.restore` | Restore a suspended platform student | Auto-issue access or bypass current policy | Required | Reason and audit mandatory |
| `admin.sessions.revoke` | Revoke current/all platform sessions | Read or mutate sessions in another platform | Required | Reason and audit/security mandatory |
| `admin.devices.revoke` | Revoke a platform device | Read raw fingerprints or authorize content | Required | Reason and audit/security mandatory |
| `admin.payments.read` | Read redacted orders/payments/evidence/transactions | Confirm, reconcile, refund, or issue access | Required | Read access may be logged |
| `admin.payments.review` | Review payment evidence and reconcile normalized payment state | Directly activate access or call a provider from the browser | Required | Reason, idempotency, correlation, audit mandatory |
| `admin.refunds.read` | Read redacted refund state | Decide or process refunds | Required | Read access may be logged |
| `admin.refunds.decide` | Approve/reject a refund under policy | Process provider settlement or delete payment history | Required | Reason, idempotency, correlation, audit mandatory |
| `admin.subscriptions.read` | Read subscription lifecycle, owner, plan, policy, and impact | Activate subscription or issue grant directly | Required | Read access may be logged |
| `admin.seats.manage` | Manage authorized seat decisions/replacements | Create shared credentials or exceed policy capacity | Required | Reason, idempotency, correlation, audit/security mandatory |
| `admin.grants.read` | Read explicit grants and related decisions | Issue, revoke, or infer grants from other records | Required | Read access may be logged |
| `admin.grants.issue_exception` | Issue a controlled administrative exception grant | Bypass platform, validity, scope, policy, or audit checks | Required | Reason, policy reference, idempotency, correlation, audit/security mandatory |
| `admin.grants.revoke` | Revoke/suspend an explicit grant | Delete historical decisions or alter another platform | Required | Reason, idempotency, correlation, audit/security mandatory |
| `admin.content.read` | Read redacted platform hierarchy/resources/releases | Publish, withdraw, or expose protected media | Required | Read access may be logged |
| `admin.content.publish` | Publish a valid platform lesson/resource | Bypass release, subtype, policy, or asset checks | Required | Reason, version, idempotency, correlation, audit mandatory |
| `admin.content.withdraw` | Withdraw a platform lesson/resource | Delete learning history or silently revoke unrelated access | Required | Reason, version, idempotency, correlation, audit mandatory |
| `admin.media.read` | Read redacted asset, access, playback, watermark, incident data | Receive durable URLs, tokens, or raw storage data | Required | Read access may be logged |
| `admin.media.manage` | Manage asset metadata, policy, playback revocation, and incidents | Integrate providers, expose media URLs, or bypass protected access | Required | Reason, idempotency, correlation, audit/security mandatory |
| `admin.assessments.read` | Read redacted assessments and attempt summaries | View private keys/notes or change assessment state | Required | Read access may be logged |
| `admin.assessments.review` | Review, moderate, release placeholder results, invalidate attempts | Rewrite historical answers or bypass policy/version checks | Required | Reason, idempotency, correlation, audit/security mandatory |
| `admin.audit.read` | Read redacted audit and admin-action evidence | Delete, rewrite, or suppress evidence | Required | Access may itself be logged |
| `admin.security.read` | Read redacted security/access-denial evidence | Revoke or alter state without the relevant command permission | Required | Access may itself be logged |
| `admin.roles.read` | Read platform admin users, roles, and permissions | Assign/revoke roles or change role permissions | Required | Access may be logged |
| `admin.roles.manage` | Assign/revoke platform admin roles and governed permissions | Use client claims or cross-platform authority | Required | Reason, version, idempotency, correlation, audit/security mandatory |
| `admin.policies.read` | Read policy metadata and effective versions | Change policy or rewrite snapshots | Required | Access may be logged |
| `admin.policies.manage` | Create/update governed policy versions | Silently modify active policy or historical snapshots | Required | Reason, version, idempotency, correlation, audit/security mandatory |

## 11. Workflow Examples

### 11.1 Manual payment approval to access issuance

1. Resolve one active platform and authenticated admin authority.
2. Load the order, payment, evidence, plan, owner, and related records with same-platform validation.
3. Review payment evidence under `admin.payments.review`; record a reason, idempotency key, correlation ID, and review outcome.
4. Append a `payment_transactions` review/confirmation event and audit/admin evidence. Payment confirmation remains financial evidence only.
5. Evaluate commercial eligibility and activate or transition the subscription through a separate authorized command.
6. If organization-owned and applicable, create or evaluate named seats under capacity and recipient policy. A seat is never shared credentials.
7. Evaluate the eligible entitlement source under the effective policy.
8. Issue an explicit active `access_grant` only after platform, recipient, source, scope, validity, policy, and revocation checks pass.
9. Optionally create or maintain enrollment as participation context. Enrollment does not create the grant.
10. Append access, audit, admin, and security evidence for each consequential transition.

### 11.2 Refund completed to access effect

1. Resolve platform, refund, payment, order, subscription, owner, and active admin authority.
2. Decide the refund under policy with a required reason and append-only decision evidence.
3. Process or record completion through a controlled finance command; append a transaction/evidence event.
4. Evaluate the commercial effect separately from payment/refund state.
5. Suspend or revoke affected grants only through the access policy and explicit command path when required.
6. Preserve payments, transactions, refunds, subscriptions, seats, grants, enrollments, progress, playback evidence, attempts, certificates, audit logs, and security evidence.

### 11.3 Student suspected of account sharing

1. Load same-platform security events, access decisions, playback sessions, device summaries, and relevant admin history.
2. Keep raw fingerprints, tokens, and provider payloads behind protected references.
3. Evaluate the applicable abuse/device/session/grant policy.
4. If required, revoke sessions/devices and suspend or revoke grants through separately authorized commands.
5. Append security, admin, access-decision, and audit evidence with reason, correlation, and policy reference.
6. Do not affect the other platform or delete historical learning/commercial evidence.

### 11.4 Publish a protected video lesson

1. Validate content permission and resolve the target lesson/resource under one platform.
2. Validate hierarchy relationships, resource subtype, private asset metadata, content owner, and delivery policy.
3. Validate release rule, timezone, lifecycle, and effective policy version.
4. Execute the publish command with reason, expected version, idempotency key, and correlation ID.
5. Append publication/admin evidence.
6. Do not return a permanent MP4 URL. Learner delivery later requires the protected-access pipeline, short-lived authorization, playback session, and applicable watermark policy.

### 11.5 Assessment attempt invalidation

1. Resolve assessment-review permission and one platform.
2. Validate the student, assessment, attempt, enrollment when required, session/device context if relevant, and platform relationships.
3. Validate attempt lifecycle, assessment/policy version, integrity evidence, and expected version.
4. Require an invalidation reason and execute an idempotent invalidation command.
5. Append audit/admin/security evidence.
6. Preserve the attempt, answer snapshots, scoring/review evidence, and historical audit record.

## 12. Open Decisions

These issues were identified during the repository audit and are intentionally unresolved. They must be decided before implementation creates canonical contracts or persistence adapters.

- **Transaction naming:** `postgres-schema-v1.md`, authorization, payments, and subscription documents use `payment_transactions`; `erd-v1.md` uses `transactions`. Select one canonical logical name and update all dependent documents/types together.
- **Organization identity:** the schema/ERD use `organization_id`; current domain types use `organizationReference`. Decide whether organization is a first-class platform-scoped entity in the domain contract and preserve composite platform-safe relationships.
- **Plan policy relationship:** the schema describes `policy_set_id`; the current domain type exposes a `policyReferences` array. Decide cardinality and version semantics.
- **Subscription ownership:** documents require `owner_user_id XOR organization_id`; current domain types use `ownerUserId` and `organizationReference`. Decide the canonical owner representation and enforcement location.
- **Resource type values:** documentation uses `video`, `document`, `quiz`, `link`, `file`; current domain types use `video`, `document`, `link`, `download`. Decide whether `download` is replaced, renamed, or represented as a file/resource subtype.
- **Question type expansion:** current domain types are narrower than the assessment architecture’s future type model. Decide the first authoring/review contract and versioning boundary before exposing question authoring.
- **Attempt lifecycle labels:** current domain statuses differ from the more detailed assessment lifecycle. Decide canonical states and permitted transitions.
- **Optional enrollment:** assessment architecture allows enrollment to be required only where participation policy requires it; current `Attempt` requires `enrollmentId`. Decide whether the contract makes enrollment nullable and how policy expresses the requirement.
- **Access-grant scope coverage:** documentation lists product/package/program/subject/lesson/resource/asset scopes; current protected-content evaluation visibly covers only lesson/asset. Complete and test scope evaluation before offering broad exception-grant commands.
- **Protected-content evaluation completeness:** the current domain evaluator does not yet model every documented release-window, resource-policy, source-eligibility, playback, and authorization evidence concern. Decide which checks belong in the first backend command/query contract and which remain future modules.
- **Admin permission granularity:** decide whether finance, support, content ownership, media incident response, assessment review, and governance permissions require additional sub-permissions beyond the initial matrix.
- **Overview aggregation consistency:** decide freshness, pagination, failure isolation, and timestamp semantics when overview cards aggregate multiple domain read models.
- **Sensitive support flow:** decide the provider-neutral verification contract for sensitive profile changes and device replacement before implementing support commands.

