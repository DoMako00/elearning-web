# Protected Media, Playback Authorization, PDF Protection, and Dynamic Watermarking

## Scope and security objective

This is backend design only. It aligns with the platform, authorization/RLS, authentication/session/device, subscription/seat/access, payment/refund, and learning-content architectures. It does not create SQL, migrations, executable RLS policies, API runtime code, permanent public URLs, storage/CDN/DRM/player/PDF-renderer/watermark service integrations, or frontend media screens.

The objective is controlled access, shortened exposure, deterrence, traceability, detection, and response. Browser software cannot perfectly prevent screenshots, screen recording, browser extensions, camera capture, or an authorized user sharing material. Watermarking and protected delivery make misuse harder and more attributable; they do not guarantee impossible-to-copy content.

Every protected asset, resource, authorization, playback session, watermark payload, storage reference, access decision, and incident record has one `platform_id`. A Medway video or document cannot be delivered through Elite user, grant, session, device, subscription, seat, or authorization state, and vice versa.

## Protected asset and storage boundary

`video_assets` and `document_assets` are platform-scoped specializations of `lesson_resources`. A video or document asset is valid only when its resource type, lesson, hierarchy placement, policy, and platform match. Asset storage references are private implementation metadata, not learner-facing URLs.

Private storage or protected streaming is the delivery boundary. A future provider adapter may issue a stream manifest reference, a signed object request, or a provider-specific delivery token only after backend authorization. Such artifacts are short-lived, audience-bound transport credentials; they are never stored as permanent public MP4, PDF, or file links and are not treated as authorization on a later request.

`policy_sets` and resource-specific policy references govern asset publication, streaming/download mode, signed-authorization duration, watermark requirement, view accounting, concurrency, seeking/rewatch, device requirements, and incident response. No fixed number of views, devices, concurrent streams, or days is embedded in the architecture.

## Mandatory protected-request pipeline

Every protected video, PDF, file, or controlled link request follows the same backend decision pipeline:

1. Resolve the requested platform from trusted backend context and validate the active platform.
2. Verify the authenticated subject and load exactly one active platform-scoped `users` record.
3. Validate the `app_sessions` record and any policy-required recognized/unrevoked `devices` record.
4. Resolve the lesson, `lesson_resources` row, and asset with the same platform; deny a mismatch before entitlement lookup.
5. Evaluate the eligible entitlement source: active individual subscription, active assigned seat, active promotion/free entitlement, or audited administrative exception.
6. Evaluate an explicit active `access_grants` record for user, scope, dates, source state, and revocation/suspension status.
7. Evaluate release availability and the effective resource/delivery policy.
8. Evaluate concurrency, view, download, and other policy controls.
9. Append an allow/deny `access_decisions` record. On allow only, issue a short-lived `protected_content_authorizations` record and the relevant video playback/document delivery authorization; create a `playback_sessions` record for streaming activity and minimum-necessary watermark metadata when required.

Authentication, app-session/device success, payment confirmation, subscription existence, seat assignment, enrollment, progress, an old playback session, or an old signed URL is individually insufficient to authorize delivery. The frontend can request authorization and use a returned short-lived delivery artifact; it never decides access or receives a permanent origin URL.

## Video playback model

`playback_sessions` represent a short-lived, auditable delivery session—not a user login, device registration, access grant, view count, lesson completion, or entitlement. A session binds the platform user, active app session, optional required device, active grant, resource/video asset, authorization decision, applicable policy/version, issued/expiry/revocation state, and correlation ID.

On approved playback, the backend creates a session and a short-lived authorization/token appropriate for a future protected streaming adapter. Playback-session renewal, heartbeat, and end events require ownership and platform validation; a renewal repeats relevant session, device, grant, release, and policy checks. Expiry, grant revocation, user/session/device revocation, release withdrawal, concurrency violation, or policy outcome prevents future renewal and may terminate provider delivery through a future adapter.

Students may seek forward, seek backward, and rewatch by default. Restrictions are enforced only when an effective resource/course policy says so. The system must distinguish transport retries, playback-session renewal, stream start, meaningful consumption, replay, and a policy-defined view-counting event. View accounting is append-only, idempotent, and policy evaluated; it must not count every network retry as a new view.

Concurrent-playback evaluation uses active sessions and a versioned policy scope, which may be user, subscription/seat, device, resource, or asset. Heartbeat cadence, stale-session cleanup, allowed concurrent count, conflict behavior, and support override are configuration/implementation decisions, not hard-coded limits.

## PDF and document model

Protected document access first creates `protected_content_authorizations` after the full pipeline. The policy determines one of these delivery modes:

| Policy mode | Delivery behavior |
|---|---|
| `view_only` | Backend issues short-lived view authorization; no download action is authorized. |
| `download_allowed` | Backend may issue an auditable, short-lived download authorization. |
| `watermarked_view` | View authorization requires a policy-approved dynamic watermark rendering/overlay path. |
| `watermarked_download` | Downloadable derivative/copy is watermarked and auditable before delivery. |

Download permission is a policy decision, not an implication of subscription or resource visibility. A downloaded copy cannot be reliably recalled after delivery, so policies must acknowledge this risk and record authorization/download evidence. Future provider-specific generation and rendering choices remain outside this document.

## Link and file handling

Links and files are `lesson_resources`, not bypasses around protected access. A protected link is resolved only after authorization and can use a short-lived backend redirect or destination authorization reference; the backend validates any allowed destination against policy. A protected file is served from private storage through a short-lived policy-compliant authorization. Only explicitly approved public resources may point to durable public destinations, and their publication remains platform-scoped and auditable.

## Dynamic watermarking

`watermark_payloads` records the issuance of minimum-necessary, traceable watermark metadata tied to a platform-scoped playback/document authorization and, where relevant, a `playback_sessions` record. The payload is generated by the backend and signed or otherwise bound to the authorization for a future renderer; it is not a durable frontend identity claim.

The approved field allowlist is policy/template controlled. Permitted fields may include a learner display name, student identifier, partially masked phone, platform label, session/resource reference, and issue time. It excludes raw phone numbers, payment data, OTP material, access tokens, passwords, secret keys, raw device fingerprints, and unrelated sensitive profile data.

Watermark templates define placement, opacity, formatting, rotation cadence, and per-session variant behavior. A future renderer moves or refreshes the mark periodically while streaming/viewing, using policy-controlled placement variants and time/session references. Client overlay rendering alone is not security: it may be used as a presentation mechanism but must not be represented as capture prevention. Stronger server-side/DRM/provider rendering remains a future adapter decision.

## Progress and completion

Playback telemetry may contribute watched seconds, watched percentage, last position, and resource-consumption evidence through the learning progress workflow. It does not itself create lesson completion, assessment success, next-lesson access, or a new entitlement. Completion, prerequisites, and unlocking remain separately evaluated versioned learning policies; 100% video consumption is required only where an explicit content policy enables it.

## Admin media-management flow

1. An authorized platform content manager resolves platform and scoped content-owner/admin permission.
2. The backend registers or replaces private video/document asset metadata, validates resource type and platform ownership, and attaches an effective delivery policy.
3. The manager configures an approved watermark template/allowlist and publishes, withdraws, or revokes the resource through a backend command.
4. The backend appends audit/admin evidence for asset, policy, publication, watermark, and revocation actions.
5. Existing learner progress, assessment evidence, delivery decisions, and historical audit evidence are retained when assets are withdrawn/replaced.

No client directly writes storage location, policy set, watermark allowlist, protected authorization, playback session, access decision, or media revocation state.

## Student playback and document-access flow

1. The frontend asks the backend for resource access; it does not construct media URLs or rely on visible course cards.
2. The backend executes the protected-request pipeline and returns a redacted denial or a short-lived authorization/delivery artifact.
3. For streaming, the client uses the approved transient artifact and sends future policy-approved heartbeats/renewal/end telemetry. For documents, it requests a separate view or download authorization when policy permits.
4. The backend re-evaluates relevant state on renewal/sensitive requests and records delivery evidence.
5. The client submits progress evidence separately; playback authorization and session creation do not mark a lesson complete.

## Leak and abuse investigation flow

When suspected leakage, sharing, automated extraction, policy abuse, or a watermark match is reported, support/security resolves the platform and preserves the correlated `access_decisions`, protected authorizations, playback sessions, watermark issuances, session/device references, policy versions, view/telemetry evidence, and actor/admin actions. Sensitive values remain redacted and access is restricted to authorized investigators.

Authorized security/admin commands may suspend future grants, revoke app/playback sessions, revoke devices, withdraw assets, block delivery, or create an expiring administrative exception as policy requires. They do not delete academic history, commercial evidence, or append-only operational logs. Investigation thresholds, automated detection, appeals, and incident communications remain configurable operational policy.

## Related schema tables

| Concern | Tables / future logical refinement |
|---|---|
| Resource and asset metadata | `lesson_resources`, `video_assets`, `document_assets`, `content_releases`, `policy_sets` |
| Authorization and delivery | `access_grants`, `access_decisions`, `protected_content_authorizations`, `playback_sessions`, `watermark_payloads` |
| Identity/commercial inputs | `users`, `app_sessions`, `devices`, `subscriptions`, `seats`, `promotions`, `enrollments` |
| Learning evidence | `progress`, `attempts`, `attempt_answers` |
| Operations and response | `audit_logs`, `security_events`, `analytics_events`, `admin_actions` |

Provider-specific asset rendition, token, watermark-rendering, telemetry, and incident-link structures are future logical schema refinements only.

## API route map (contracts only)

| Route | Purpose |
|---|---|
| `POST /v1/protected-access/check` | Evaluate platform, identity, session/device, grant, release, and effective resource policy. |
| `POST /v1/resources/{id}/playback-authorizations` | Issue a short-lived video authorization and `playback_session` when allowed. |
| `POST /v1/playback-sessions/{id}/renew`; `POST /v1/playback-sessions/{id}/heartbeat`; `POST /v1/playback-sessions/{id}/end` | Controlled playback lifecycle signals. |
| `POST /v1/resources/{id}/document-authorizations`; `POST /v1/document-authorizations/{id}/download` | Issue policy-controlled document view/download authorization. |
| `GET /v1/playback-sessions/{id}/watermark`; `POST /v1/playback-sessions/{id}/watermark/refresh` | Return/refresh a minimal, authorization-bound watermark payload. |
| `GET /v1/resources/{id}/access-status` | Redacted current availability/access status; never a durable delivery URL. |
| `POST /v1/admin/assets`; `POST /v1/admin/assets/{id}/publish`; `POST /v1/admin/assets/{id}/revoke` | Platform-authorized asset lifecycle controls. |
| `POST /v1/admin/media-policies`; `POST /v1/admin/watermark-templates`; `POST /v1/admin/media-incidents/{id}/decision` | Controlled policy, template, and incident-response commands. |

## Validation, auditing, and edge cases

Validate platform-safe composite relationships; active app user/session/device state; grant recipient/scope/validity/revocation; eligible source lifecycle; release availability; asset/resource subtype match; policy version/effective period; authorization expiry and one-time/replay constraints; playback-session ownership; heartbeat ordering; watermark template allowlist; private storage reference; and platform-scoped admin authority.

Append immutable, redacted evidence for access denials; authorization issue/expiry/revocation; playback start/renewal/heartbeat/end; policy concurrency/view denials; document views/downloads; watermark issue/refresh/rotation metadata; asset replacement/publication/withdrawal; suspected leaks; investigation outcomes; and admin/security actions. Logs record platform, actor, resource, target, reason, policy version, correlation ID, outcome, and redacted data, never secrets or full sensitive payloads.

Handle cross-platform IDs; stale/expired/replayed authorization; session/device/grant revocation during playback; concurrency conflict; missed heartbeat; asset replacement/withdrawal during delivery; release-window expiry; transient provider delivery failure; duplicate/out-of-order telemetry; a policy change during an active session; watermark rendering failure; lost offline client state; download after policy changes; and retention/anonymization requests without destroying governed evidence.

## Open decisions before implementation

- Storage/CDN/DRM/provider choice, stream protocol, rendition/key management, and provider authentication/revocation capabilities.
- Client player/PDF-renderer design, server-side versus overlay watermark renderer, watermark template fields/placement/rotation, and accessibility treatment.
- Authorization/token lifetime, refresh semantics, streaming heartbeat cadence, concurrent-playback scope/count/conflict behavior, and view-accounting definition.
- PDF download model, derivative watermark generation, link destination allowlists, offline behavior, and document/file virus/content review.
- Abuse detection thresholds, automated extraction signals, investigator workflow, response/appeal procedures, and support emergency access.
- Privacy, watermark/telemetry retention, export/erasure obligations, legal restrictions, and regional-hosting requirements.
