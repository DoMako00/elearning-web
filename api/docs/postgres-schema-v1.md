# PostgreSQL / Supabase Schema Draft v1

> **Legacy logical draft:** Review [Postgres/Supabase Schema Alignment Review](postgres-supabase-schema-alignment-review.md) before deriving migrations. Future schema work uses canonical brand terminology; legacy platform terminology and compatibility aliases remain transitional only.

> Do not derive migrations from this document until the blockers in the [Schema Decision Register](schema-decision-register.md) are resolved.

## Scope

Logical schema only: no SQL is applied and no migration is created. Application data lives in a private `app` schema; Supabase-managed `auth` and `storage` schemas remain provider-owned. `platforms` contains `medway` and `elite`. Every `app` table below, except `platforms`, has `id uuid PK`, `platform_id uuid NOT NULL`, `created_at timestamptz NOT NULL`, and `updated_at timestamptz` where mutable.

`app.users.auth_user_id uuid NOT NULL references auth.users(id)` supports one login identity with separately scoped Medway/Elite business accounts. `unique (platform_id, auth_user_id)` is required. All cross-table foreign keys must be composite `(platform_id, foreign_id)`, preventing cross-platform references.

## Enums and common rules

Enums: `platform_code (medway, elite)`, lifecycle/account/content/release statuses, `payment_status`, `transaction_status`, `refund_status`, `subscription_status`, `seat_status`, `grant_status`, `session_status`, `device_status`, `attempt_status`, `resource_type (video, document, quiz, link, file)`, grant `source_type`, and grant `scope_type`.

Status enums describe lifecycle only. Prices, seat/device/playback/replacement/refund limits and timing are never enums/check constants: they are versioned `policy_sets` references and immutable plan/order/subscription snapshots.

## Tables, columns, and keys

### Platform, identity, administration

| Table | Additional columns | Foreign keys / constraints |
|---|---|---|
| `platforms` | `code`, `display_name`, `default_timezone`, `status` | PK `id`; unique `code`; no `platform_id`. |
| `users` | `auth_user_id`, `email`, `display_name`, `status`, `disabled_at` | `auth_user_id → auth.users`; unique `(platform_id, auth_user_id)` and `(platform_id, normalized_email)`. |
| `student_profiles` | `user_id`, `status`, `academic_profile_ref` | unique `(platform_id, user_id)`; user FK. |
| `otp_challenges` | `user_id nullable`, `purpose`, `destination_ref`, `status`, `expires_at`, `verified_at` | user FK when present. |
| `organizations` | `legal_name`, `display_name`, `status` | unique `(platform_id, legal_name)`. |
| `platform_memberships` | `user_id`, `organization_id nullable`, `membership_type`, `status`, `ended_at` | unique active membership per user/organization/type. |
| `admin_users` | `user_id`, `status`, `elevated_access_expires_at` | unique `(platform_id, user_id)`. |
| `roles`, `permissions` | `code`, `name/description`, `status` | unique `(platform_id, code)`. |
| `role_permissions` | `role_id`, `permission_id` | unique `(platform_id, role_id, permission_id)`. |
| `admin_user_roles` | `admin_user_id`, `role_id`, `starts_at`, `ends_at`, `status` | role assignment history. |

### Catalog and commercial

| Table | Additional columns | Foreign keys / constraints |
|---|---|---|
| `policy_sets` | `name`, `version`, `document_ref`, `effective_from/to`, `status` | unique `(platform_id, name, version)`. |
| `products`, `packages`, `offers` | codes, titles, type/audience, status | package/offer codes unique per platform; `offers.package_id → packages`. |
| `package_products` | `package_id`, `product_id` | unique `(platform_id, package_id, product_id)`. |
| `plans` | `offer_id`, `version`, `currency`, `price_definition_ref`, `policy_set_id`, effective dates, `terms_ref` | unique `(platform_id, offer_id, version)`. |
| `promotions` | `code`, `policy_set_id`, benefit/eligibility refs, dates, status | code unique per platform. |
| `orders` | `user_id nullable`, `organization_id nullable`, `plan_id`, `promotion_id nullable`, `status`, `terms_snapshot` | check: exactly one owner reference. |
| `payments` | `order_id`, method, amount, currency, status, `confirmed_at` | payment state is independent. |
| `payment_transactions` | `payment_id`, provider_ref, type, amount, currency, status, `processed_at` | transaction evidence is append-only. |
| `refunds` | `payment_id`, `policy_set_id`, amount, reason, status, `processed_at` | no deletion/rewrite of payment. |
| `subscriptions` | `order_id`, `plan_id`, owner user/org nullable pair, status, starts/ends/renews, `terms_snapshot` | check: exactly one owner; expiry never deletes learning evidence. |
| `seats` | `subscription_id`, `assigned_user_id nullable`, status, assigned/revoked timestamps | one active assignee per seat; capacity comes from policy, not a check. |
| `access_grants` | `user_id`, source type/id, scope type/id, status, valid/revoked timestamps, snapshot | explicit grant only; source includes subscription, seat, promotion, or admin exception. |

### Learning and protected content

| Table | Additional columns / foreign keys |
|---|---|
| `programs`, `academic_years`, `semesters` | hierarchy FKs: year → program, semester → year; code/label/date/status fields. |
| `subjects`, `modules`, `chapters`, `lessons` | subject → program/year/semester; module → subject; chapter → module; lesson → chapter; ordered sequence and status. |
| `content_releases` | `lesson_id`, `available_from`, `available_until nullable`, `timezone`, `status`; global platform-calendar window. |
| `lesson_resources` | `lesson_id`, `resource_type`, `title`, `sequence`, `status`; only video/document resources may have specialized asset rows. |
| `video_assets`, `document_assets` | `lesson_resource_id unique`, storage/content hash refs, `policy_set_id`, status. |
| `quizzes`, `assessments`, `questions` | quiz → lesson/resource + assessment; question → assessment; policy/scoring references. |
| `enrollments` | `student_user_id`, program/subject nullable target pair, status, enrolled/completed timestamps; participation only. |
| `progress` | `enrollment_id`, `lesson_id`, status, completion evidence, timestamps; video playback never writes completion alone. |
| `attempts`, `attempt_answers` | attempt → assessment/user/enrollment; answers → attempt/question snapshot; immutable assessment evidence. |

### Security and operations

| Table | Additional columns / foreign keys |
|---|---|
| `devices` | `user_id`, fingerprint reference, type, trust status, seen/revoked timestamps. |
| `device_replacements` | user/old/new device IDs, OTP challenge, policy set, status. |
| `app_sessions` | `user_id`, `device_id nullable`, issued/expiry/revoked times, status. |
| `playback_sessions` | user/app session/device/grant/asset IDs, issued/expiry/status; delivery only. |
| `access_decisions` | user, grant nullable, resource, allow/deny reason, evaluated timestamp; append-only. |
| `protected_content_authorizations` | access decision, delivery policy, allow/deny result. |
| `watermark_payloads` | playback session, template ref, issued timestamp; minimum-necessary generated metadata only. |
| `audit_logs`, `analytics_events`, `security_events`, `admin_actions` | actor/resource/correlation/payload references as relevant; append-only operational records. |

## Indexes and constraints

- Index every composite FK with `platform_id` first. Add tenant indexes on `(platform_id, status)` for mutable lifecycle tables.
- Active access: partial index on `access_grants (platform_id, user_id, scope_type, scope_id, valid_until)` where `status = 'active' and revoked_at is null`.
- Active commercial: subscriptions `(platform_id, status, ends_at)`; seats `(platform_id, subscription_id, assigned_user_id)` where active/assigned; payments/refunds by lifecycle and time.
- Learning: release window `(platform_id, lesson_id, available_from)`; enrollments/progress by learner and status; attempts by learner/assessment/time.
- Security/events: sessions and devices by user/current state; playback/authorization/audit/analytics/security tables by `(platform_id, occurred_at desc)`.
- Checks: owner XOR on orders/subscriptions; positive monetary amounts; release end after start; session/grant end after start; resource subtype matches `lesson_resources.resource_type`; all platform-scoped FKs use composite platform-safe keys.

## RLS and Data API notes

- Keep `app` private or expose only selected learner-read tables; privileged commercial, role, policy, audit, security, and payment tables remain server-mediated.
- If any `app` table is exposed, enable RLS and grant only required roles. Policies use `TO authenticated` **and** controlled ownership/platform predicates; authentication alone is not authorization.
- Resolve memberships and permissions from application tables or controlled app metadata, never user-editable JWT metadata. Do not expose Supabase secret/service keys to `web`.
- Future views require `security_invoker = true` where supported; privileged functions require separate security review and restricted execution.

## Soft delete and retention

Use status plus `archived_at`, `ended_at`, `revoked_at`, `cancelled_at`, or retention-governed anonymization. Never physically delete financial records, subscriptions, historical seats, grants, sessions, decisions, audit/security/admin logs, enrollments, progress, attempts, or answers. Subscription expiry stops future access through grant evaluation/revocation but preserves learning history.

## Migration order

1. Extensions, `app` schema, enums, platforms, policy sets.
2. Auth-linked users, organizations/memberships, RBAC, RLS foundation.
3. Academic/content/resource/release structures.
4. Catalog, offers, plans, promotions, commercial records.
5. Subscriptions, seats, explicit grants, enrollment/progress/assessment.
6. Devices, sessions, playback/watermark, operations/audit events.
7. Indexes, RLS policies, advisor/security review, fixtures.

## Open decisions before final schema

Tax/invoicing/legal entities; multicurrency and promotion stacking; organization invitation/offboarding and seat transfer; refund approval/revocation timing; concurrency/device/playback accounting; DRM/download/watermark retention; assessment versioning/certificates; privacy/erasure/data residency; and future cohort or enrollment-relative release audiences.
