# Backend Authorization and RLS Strategy

## Persistence and request-context boundary

RLS is defense-in-depth. It must not replace trusted backend request context, active brand-scope resolution, admin command validation, lifecycle/policy checks, or append-only evidence requirements. The application boundary remains authoritative even when a future database adds RLS policies. See [Persistence and Auth Integration Boundary](persistence-auth-integration-boundary.md).

## Authority model

This strategy implements the schema in `postgres-schema-v1.md`. Backend authorization is the primary gate; PostgreSQL RLS is defense in depth for any `app` data exposed through Supabase. Frontend state, route visibility, enrollment, payment, subscription, seat, device, or a signed media URL is never authorization by itself.

`auth.users.id` may map to one `app.users` row per platform through `unique (platform_id, auth_user_id)`. Each protected request resolves one explicit `platform_id`, then exactly one active platform user. Medway rows, sessions, roles, grants, and devices cannot be read or reused for Elite.

## Protected request pipeline

1. Verify the Supabase access token and obtain `auth.users.id`; reject unauthenticated/expired tokens.
2. Resolve the requested platform from a trusted host/path/request selector; validate it against `platforms`.
3. Load exactly one active `app.users` row matching `(platform_id, auth_user_id)`.
4. Load and validate the app session, then any required recognized/unrevoked device; all records must match the same user and platform.
5. Resolve the requested lesson/resource/asset with `platform_id`; reject a platform mismatch before any entitlement lookup.
6. Evaluate source eligibility: active subscription, active assigned seat where required, active promotion, or audited administrative exception.
7. Evaluate an explicit active `access_grant`: same platform/user, permitted scope, valid time, not revoked/suspended.
8. Evaluate `content_releases` and the applicable versioned resource/playback policy.
9. Write an allow/deny `access_decision`. On allow only, issue a short-lived protected-content authorization/playback session and minimum-necessary watermark payload; write audit/security evidence.

Payment confirmation can support commercial eligibility, but does not itself grant access. Enrollment records participation, not entitlement. Subscription expiry invalidates future grant evaluation while preserving enrollment, progress, and assessment history.

## Access Decision Engine

The backend engine receives authenticated subject, platform, application user, request resource, session/device state, grant candidates, source state, release state, and policy references. It returns `allow | deny`, a reason code, policy/version references, correlation ID, and redacted input snapshot.

Minimum denial reasons: `unauthenticated`, `platform_mismatch`, `app_user_missing_or_inactive`, `session_invalid`, `device_revoked`, `subscription_expired_or_inactive`, `seat_missing_or_unassigned`, `grant_missing`, `grant_inactive`, `scope_mismatch`, `content_unreleased`, and `resource_policy_denied`. Decision records are evidence, never a replacement for re-evaluation on a new protected request.

## Identity, platform, and admin scope

- The same Supabase principal can have separate Medway and Elite `app.users` accounts; each request selects exactly one platform context.
- Platform selection must be supplied by a trusted backend-resolved route/host or explicit validated parameter, never inferred from a client-controlled role claim.
- `admin_users → admin_user_roles → roles → role_permissions` is platform-scoped. A valid Elite admin role has no meaning in Medway.
- Backend command handlers first validate permission, platform, target relationship, lifecycle/policy rules, then write audit records. RLS cannot replace this workflow validation.

## RLS recommendations

| Tables | Access model | Data API / RLS recommendation |
|---|---|---|
| `users`, `student_profiles` | Learner own-record read | Optionally exposed: authenticated user plus matching platform/user predicate; no direct privilege/status writes. |
| Public/eligible catalog hierarchy, releases, resources | Learner read | Prefer backend-filtered reads; if exposed, active platform plus eligible/public-release predicate only. |
| `enrollments`, `progress`, `attempts`, `attempt_answers` | Learner own evidence | Optional read with platform + ownership predicate; writes remain command-mediated until evidence rules are finalized. |
| `access_grants` | Sensitive learner state | Backend-mediated; optional read-only redacted summary, never direct issue/revoke. |
| `otp_challenges`, `devices`, `device_replacements`, `app_sessions` | Security lifecycle | Backend-mediated; no direct Data API writes. |
| `playback_sessions`, `access_decisions`, `protected_content_authorizations`, `watermark_payloads` | Protected media | Private/server-mediated; no direct browser access. |
| `platform_memberships`, `seats`, org subscriptions | Organization administration | Backend-mediated after active platform membership and permission validation. |
| `roles`, `permissions`, `admin_users`, `admin_user_roles`, `policy_sets`, promotions/catalog publication | Administration | Private/server-mediated; active platform-admin permission required. |
| `orders`, `payments`, `payment_transactions`, `refunds`, `subscriptions` | Finance/commercial | Private/server-mediated; no client writes. |
| `audit_logs`, `security_events`, `analytics_events`, `admin_actions` | Append-only operations | Private/server-mediated; no client write/delete. |

## RLS pseudocode (illustrative, not SQL)

```text
current_platform_user(platform_id):
  require auth.uid() is not null
  return app.users where auth_user_id = auth.uid()
    and platform_id = requested_platform_id and status = active

learner_select(row):
  allow only when current_platform_user(row.platform_id).id = row.user_id
  or a backend-approved eligible-content predicate is true

platform_admin(action, target):
  require active admin_user for current_platform_user(target.platform_id)
  require active role assignment with permission for action
  require target.platform_id = requested_platform_id
```

Policies must use `TO authenticated` plus non-null identity, platform, and ownership/permission predicates. Never grant broad access merely because a request is authenticated. Do not derive platform, role, or permission from `raw_user_meta_data` or other user-editable JWT data. Do not use unrestricted `SECURITY DEFINER`, RLS-bypassing views, or browser-held secret/service keys.

## Media and playback

Storage object names and signed URLs are transport mechanisms, not durable authorization. The backend runs the protected pipeline before issuing a short-lived authorization and delivery URL/token. Playback sessions bind the evaluated platform user, app session, grant, resource, and policy decision. Watermark payloads contain only approved template fields such as platform user display identity/session/time; never payment data, OTP material, raw device fingerprints, secrets, or access tokens. Playback does not update `progress` without separate completion-evidence evaluation.

## Finance and audit writes

Finance/payment/refund, policy, role, security, and audit writes are backend-only commands. Each command requires platform-scoped authority, validates expected lifecycle transitions and policy version, creates an immutable audit event, and uses idempotency/correlation keys where an external provider is involved. App code must not treat Data API RLS success as evidence that a financial or access workflow is valid.

Audit, security, admin-action, and access-decision records are append-only. Capture actor, platform, target/resource, result, correlation ID, redacted before/after reference, and timestamp. Redact credentials, raw OTPs, payment instruments, access tokens, and raw device fingerprints. Logs are not authorization inputs.

## Security mistakes to avoid

- Trusting frontend state, course visibility, or an auth identity without resolving platform-scoped `app.users`.
- Treating payment, subscription, seat, enrollment, or playback as a direct entitlement.
- Joining without `platform_id`, or allowing cross-platform IDs in a policy/function.
- Reusing Medway sessions, roles, grants, or devices in Elite.
- Trusting stale/user-editable JWT metadata for access decisions.
- Issuing long-lived media URLs or allowing direct client writes to finance, access, policy, audit, or security tables.

## Open decisions before implementation

- Platform selection and switching UX/token context; session revalidation frequency.
- Organization seat-administrator delegation, support impersonation, and emergency access.
- Exact device/concurrency/playback counters and refund-state effect on grants.
- DRM/storage delivery provider, watermark retention, incident response, and media abuse controls.
- Privacy, retention, erasure, regulatory audit obligations, and future cohort-release rules.
