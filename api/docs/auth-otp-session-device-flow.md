# Auth, OTP, Session, and Device Flow

## Scope and invariants

This is backend design only. Supabase `auth.users` is the global authentication identity; `app.users` is the platform-scoped business account, uniquely resolved by `(platform_id, auth_user_id)`. Every request resolves one active platform before identity work. A Medway user/session/device/profile never supplies Elite access, and authentication alone never grants a course or protected resource.

Normal registration and OTP verification are mandatory. Google login is not part of v1. OTP delivery, retry limits, session duration, device limits/replacement rules, and retention are future versioned policy decisions.

## Platform resolution

1. Resolve a platform from a trusted host, path, or backend-validated request selector.
2. Verify `platforms.status = active`; bind `platform_id` and correlation ID to the request.
3. Every lookup and created record (`otp_challenges`, `users`, `student_profiles`, `devices`, `app_sessions`, audit/security events) uses that platform.
4. Reject an identifier whose referenced record has another platform before loading entitlement or profile state.

## Registration flow

1. `POST /v1/auth/registration/initiate` resolves platform; normalizes email/phone and validates required profile input.
2. The future provider adapter creates or locates `auth.users`; it does not decide platform membership or content access.
3. Create/locate one pending `app.users` record for `(platform_id, auth_user_id)`, without copying commercial, role, device, session, grant, or enrollment state from another platform.
4. Create/update `student_profiles` with full name, normalized phone, academic term/year, university, student ID, and platform-scoped email reference.
5. Create an `otp_challenges` row for `registration`; delivery is an adapter responsibility. Store only destination reference, purpose, status, expiry, and redacted provider reference—not raw OTP.
6. After valid OTP verification, activate the platform user, register/validate the first device, create an app session, and append audit/security events.

An existing global auth identity may add a second platform account only by running this explicit platform registration. It does not inherit Medway/Elite access.

## Login and OTP flow

1. `POST /v1/auth/login/initiate` resolves platform and asks the future authentication adapter to verify credentials.
2. Resolve exactly one active `app.users` row for `(platform_id, auth_user_id)`; deny if absent, pending, disabled, or platform-mismatched.
3. Create a purpose-bound OTP challenge when login policy requires it; `POST /v1/auth/otp/verify` verifies platform, user, purpose, destination reference, expiry, unused status, and configured attempt/rate policy.
4. Mark a challenge terminal on success, expiry, cancellation, or failure threshold. A verified challenge is single-use and cannot satisfy a different platform, user, purpose, or destination.
5. On successful verified login, run device validation/registration and create an application session. Return session context only—not subscription, grant, or content access approval.

## Auth-to-app-user mapping and student profile

`auth.users.id` is the provider identity. `app.users` owns platform-scoped email/display/status fields and points to it through `auth_user_id`. `student_profiles` has one active profile per platform user and includes: `full_name`, normalized `phone_number`, `academic_term_or_year`, `university`, `student_id`, and email reference. Sensitive data is redacted from logs and changes require audit events.

## First-device registration and app session creation

After first verified registration/login, `POST /v1/devices/register-or-validate` derives a privacy-safe application-managed device reference from permitted contextual signals. Never use MAC address, IMEI, raw hardware identifiers, or a browser fingerprint as the sole proof of identity. Create/update `devices` with user/platform, trust state, first/last seen, and revocation fields.

`POST /v1/sessions/create` creates `app_sessions` only after valid auth, platform user, OTP state, and device policy. Bind session to platform/user/device, issued/expiry/revocation fields, and correlation ID. Session expiry, user disablement, logout, admin revocation, or device revocation makes future protected checks fail.

Device replacement is a separate `device_replacements` command: authenticate user, require replacement-purpose OTP, validate policy, preserve old/new device evidence, revoke/limit sessions as policy requires, and audit the result.

## Sensitive email/phone change

1. Require active platform user, current secure session, and sensitive-action policy.
2. Create purpose-bound OTP challenge for the proposed normalized destination.
3. Verify challenge before changing the profile/user contact field; do not overwrite on initiation.
4. Record prior/new values as protected/redacted audit references, emit a security event, and invalidate/review sessions according to policy.

## Logout, revocation, and support override

- `POST /v1/sessions/logout` revokes only the identified current platform session.
- `POST /v1/sessions/revoke-all` revokes every active application session for the platform user; a future adapter also revokes provider sessions as required.
- Security/admin revocation validates platform-scoped permission, target relationship, reason, and policy; it records `admin_actions`, `audit_logs`, and `security_events`.
- Admin/support may change permitted profile/account data only through a backend command, active platform role/permission, explicit reason, and immutable audit record. No support override creates content access unless it creates an approved, expiring `access_grant` through the authorization workflow.

## Related schema tables

| Concern | Tables |
|---|---|
| Platform and identity | `platforms`, `users`, `student_profiles`, `otp_challenges` |
| Device/session | `devices`, `device_replacements`, `app_sessions` |
| Administration | `admin_users`, `admin_user_roles`, `roles`, `permissions`, `role_permissions` |
| Evidence | `audit_logs`, `security_events`, `admin_actions` |
| Subsequent protected access | `subscriptions`, `seats`, `access_grants`, `content_releases`, resources/assets, playback/decision tables |

## API route map (contracts only)

| Route | Purpose |
|---|---|
| `POST /v1/auth/registration/initiate` | Validate platform/profile and initiate registration OTP. |
| `POST /v1/auth/registration/verify` | Verify registration OTP and activate platform user. |
| `POST /v1/auth/registration/complete` | Validate/register device and create first session. |
| `POST /v1/auth/login/initiate` | Verify future provider credential and initiate required OTP. |
| `POST /v1/auth/otp/verify` | Verify a purpose-bound OTP challenge. |
| `POST /v1/auth/login/complete` | Register/validate device and create app session. |
| `GET /v1/sessions/current`; `POST /v1/sessions/logout`; `POST /v1/sessions/revoke-all` | Session introspection and revocation. |
| `GET /v1/devices`; `POST /v1/devices/register-or-validate`; `POST /v1/devices/replacement/*` | Device lifecycle. |
| `POST /v1/account/email-change/*`; `POST /v1/account/phone-change/*` | OTP-gated contact updates. |
| `POST /v1/admin/users/{id}/account-update`; `POST /v1/admin/users/{id}/security-revoke` | Audited platform-admin/support commands. |

## Validation and abuse controls

Validate platform activity, normalized email/phone, required profile fields, verified OTP purpose/destination/expiry/one-time state, active user/session/device state, platform-safe ownership, idempotency key, and correlation ID. Defend against account enumeration, OTP brute force/replay/flooding, credential stuffing, cross-platform confusion, session fixation, lost-device takeover, support impersonation, stale sessions, and sensitive-data logging. Rate limiting, attempt thresholds, lockout/recovery, and delivery-provider behavior are policy-controlled.

## Access after authentication

Protected requests still execute the authorization strategy: platform, active app user, valid session/device, eligible subscription/seat/promotion/exception source, explicit active grant, content release window, and resource policy. Authentication, profile creation, device validation, or session creation never bypasses that decision.

## Audit and security events

Record registration started/verified/failed, login succeeded/failed, OTP issued/verified/expired/blocked, device registered/revoked/replaced, session created/revoked/expired, email/phone change initiated/verified/applied, account disabled/enabled, and support/admin override attempt/result. Store actor, platform, target, correlation ID, result, and redacted metadata; never log credentials, raw OTPs, access tokens, payment data, raw hardware IDs, or complete contact values.

## Open decisions

Platform switching/token context; password/credential policy; OTP channel/provider and delivery guarantees; rate limits and recovery; session duration/revalidation; device trust/concurrency/replacement rules; support impersonation; identity verification; retention/erasure; and incident response remain unresolved before implementation.
