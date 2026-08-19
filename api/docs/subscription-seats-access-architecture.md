# Subscription, Seats, Entitlement, and Access-Grant Architecture

## Invariants

All commercial and authorization state is platform-scoped. A Medway subscription, plan, payment, seat, entitlement, grant, device, session, enrollment, or role never unlocks Elite content. `User`, `app.users`, payment, subscription, seat, enrollment, and `access_grant` are separate concepts. Authentication/device/session success does not grant content access.

A paid individual subscription has one real platform-student owner. A Duo subscription is individually owned: its purchaser occupies one assigned seat and its other seat is assigned to another real platform user. Group subscriptions are organization-owned. Seats never represent shared credentials; every seat member has distinct authentication, app-user mapping, devices, sessions, enrollments, progress, quiz attempts, certificates, playback history, and grants.

## Subscription model

`subscriptions` belongs to one platform, one `orders` row, one versioned `plans` row, and exactly one commercial owner (`owner_user_id` xor `organization_id`). It snapshots accepted commercial terms and policy references. `payments`, `payment_transactions`, and `refunds` record money state; they do not directly authorize content. Subscription lifecycle determines whether a commercial entitlement source is eligible for evaluation, not whether a learner may bypass an `access_grant`.

Pricing, renewal/grace, seats, transfer/replacement, devices, playback, refund, and view rules are policy-set references/snapshots. No fixed price, seat count, device count, view count, refund window, or replacement count is modeled as a code constant.

## Seat model and permissions

`seats` are named platform-scoped capacity under Duo/group subscriptions. An assigned seat has one active `assigned_user_id`; a user may never occupy a seat via a shared login. Historical assignment, grant, progress, and attempt records remain associated with the original user.

| Actor | May do | Must not do |
|---|---|---|
| Individual owner | View subscription, request support assignment/replacement, occupy own individual/Duo owner seat | Directly rotate/reassign a seat or impersonate a member. |
| Duo second member | Accept assigned seat, use own learning account | Manage owner billing or replace either seat. |
| Organization admin | Request/manage assignments under assigned platform permission and policy | Exceed policy capacity or create shared credentials. |
| Seat member | Learn using own grants/progress | Transfer/revoke any seat or alter billing. |
| Support/admin | Approve/reject assignment/replacement with reason and audit | Bypass platform/permission/policy checks. |

## Entitlement sources and grants

Valid sources are: active individual subscription, active assigned seat on an active Duo/group subscription, active promotion/free entitlement, or expiring audited administrative exception. Promotion/free access creates an explicit source and `access_grant`; it is never a fake zero-value payment.

Grant issuance validates: platform equality for source/recipient/scope; active source lifecycle; active assigned seat when source is a seat; recipient active platform user; permitted product/package/program/subject/lesson/resource scope; validity window; policy version; and absence of revocation. The resulting `access_grants` record contains source type/id, scope type/id, user, validity/revocation fields, and decision snapshot.

Protected content later evaluates platform, app user, session, device, eligible source, explicit active grant, release window, and resource policy. Enrollment is created/maintained separately for participation and does not create a grant.

## Flows

### Individual subscription

1. Platform-scoped individual order selects plan and completes future commercial confirmation.
2. Backend activates an individual subscription only after policy-defined commercial eligibility.
3. Entitlement evaluation selects the owner as recipient and creates explicit grant(s).
4. Enrollment may be created for covered learning scope; protected requests still evaluate grant and delivery policy.

### Duo and group subscription

1. Duo order is owned by the purchaser; group order/subscription is owned by an organization.
2. Policy-defined seats are created after eligible activation; Duo owner receives the first seat assignment.
3. Additional members receive assignment invitation/request and must be a real active platform user before acceptance.
4. Each accepted assignment independently produces recipient-specific grants and learning records.

### Seat assignment/replacement

Assignment validates platform, active source subscription, available policy capacity, active real recipient, no conflicting assignment, requester authority, and correlation/idempotency key. It writes assignment and audit evidence, then evaluates grants.

Replacement is never a student self-service rotation. Owner/organization admin requests it; support/admin validates platform-scoped permission, reason, original assignment, recipient eligibility, policy and abuse signals. Approval ends/revokes the old assignment/grants as policy requires, creates the new assignment, reevaluates grants, and writes `audit_logs`, `security_events`, and `admin_actions`. Original learning history remains with the original user.

### Expiry, renewal, cancellation, and refund

Expiry/cancellation/refund state invalidates future paid-source eligibility and causes grant suspension/revocation evaluation. It preserves payments, subscriptions, assignment history, enrollment, progress, attempts, certificates, watch history, and audits. Renewal activates new/continued commercial eligibility and reevaluates or extends grants under current accepted terms; it never assumes a previous expired grant remains valid.

## Related tables

| Concern | Tables |
|---|---|
| Commercial | `orders`, `payments`, `payment_transactions`, `refunds`, `plans`, `policy_sets`, `promotions`, `subscriptions` |
| Ownership/capacity | `users`, `organizations`, `platform_memberships`, `seats` |
| Authorization/learning | `access_grants`, `enrollments`, `progress`, `attempts`, `content_releases`, learning resources/assets |
| Security/evidence | `devices`, `app_sessions`, `playback_sessions`, `access_decisions`, `audit_logs`, `security_events`, `admin_actions` |

## API route map (contracts only)

| Route | Purpose |
|---|---|
| `GET /v1/subscriptions/{id}`; `GET /v1/subscriptions/mine` | Redacted platform-scoped status. |
| `POST /v1/subscriptions/{id}/renew`; `POST /v1/subscriptions/{id}/entitlement-check` | Backend commercial/eligibility commands. |
| `GET /v1/subscriptions/{id}/seats`; `POST /v1/seats/{id}/assignment-request`; `POST /v1/seats/{id}/accept` | Seat visibility/request/acceptance. |
| `POST /v1/seats/{id}/replacement-request`; `POST /v1/admin/seat-replacements/{id}/decision` | Audited support replacement. |
| `GET /v1/access-grants/mine`; `POST /v1/admin/access-grants`; `POST /v1/admin/access-grants/{id}/revoke` | Redacted grant read and controlled exceptions. |
| `POST /v1/entitlements/check`; `POST /v1/protected-access/check` | Backend entitlement and protected-content checks. |
| `POST /v1/admin/promotions/{id}/grant` | Authorized explicit promotional/free grant. |

## Validation, audit, and abuse prevention

Validate composite platform ownership on every source/recipient/resource; owner XOR; active lifecycle; assigned-seat state; policy version; source/grant time windows; non-revocation; recipient identity; reason; idempotency; and correlation IDs. Detect/prevent cross-platform assignment, shared credentials, repeated rotation/replacement abuse, disabled/dormant recipients, concurrent-session/device policy violations, fraudulent support overrides, grant reuse, and payment/refund state confusion.

Audit subscription activation/suspension/expiry/renewal/cancellation, commercial confirmation, grant issue/revoke/suspend, promotion/exception grants, seat request/assignment/acceptance/replacement, denials, refund/cancellation impact, and admin/support actions. Events include actor, platform, target, reason, policy version, correlation ID, result, and redacted metadata.

## Open decisions

Seat invitation/acceptance expiry; exact Duo transfer policy; organization admin delegation/offboarding; refund/cancellation grant timing; certificate status after expiry/refund; promotion stacking; upgrade/downgrade/proration; unpaid grace; device/concurrency/view policy; fraud-review thresholds; and retention requirements remain unresolved before implementation.
