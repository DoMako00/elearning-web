# M1 Migration Draft Plan

## Phase header

- **Phase:** 31
- **Scope:** Documentation/migration planning only
- **Server impact:** None
- **Commit rule:** Local commit only after validation passes
- **Push rule:** Do not push during this task
- **Deploy rule:** No deploy

## 1. Purpose

This document defines the intended first migration batch before SQL is written. It translates the finalized Prompt 30 decisions into a bounded identity and educational-brand foundation plan while leaving implementation questions visible for the later SQL-drafting phase.

It answers:

- What tables belong in M1?
- What tables are intentionally excluded?
- What brand-scope and integrity rules must be represented?
- What RLS/Data API gates apply?
- What must be validated before SQL authoring?
- What remains forbidden until later phases?

M1 is one application-platform foundation for the educational brands Medway and Elite. The canonical table name is `educational_brands`; scope fields remain concise as `brand_id`, `brand_code`, and `brand_memberships`. Legacy platform terminology is compatibility documentation only.

## 2. Non-goals

This phase includes:

- no SQL;
- no migration files or migrations directory;
- no migration application;
- no Supabase connection or SDK;
- no RLS policy implementation;
- no runtime integration;
- no provider implementation;
- no seed data;
- no deployment; and
- no production decision.

## 3. M1 scope

### A. Educational brand foundation

- `educational_brands`

This is the canonical M1 table for the Medway and Elite educational identities. It is not itself brand-scoped; it defines the brands that scope later records.

### B. Auth/application identity foundation

- `app_users`
- provider identity linkage/auth identity mapping concept

`app_users` are global application users. A provider-authenticated identity is an input to application identity resolution, not authorization.

### C. Brand membership foundation

- `brand_memberships`

Membership explicitly connects a global application user to one educational brand. Registration does not automatically create active brand membership.

### D. Brand-scoped profile foundation

- `student_profiles`
- `admin_profiles`

Both profile types are brand-scoped for v1 and use concise `brand_id` scope.

### E. Admin authorization foundation

- `admin_roles`
- `admin_permissions`
- `admin_role_permissions`
- `admin_role_assignments`

Permission meaning may be represented by a global catalog. Regardless of whether role definitions are global templates or brand-scoped rows, role assignments must be brand-scoped in v1.

### F. Audit/evidence dependency

Admin, profile, and membership activation commands require append-only evidence. A minimal audit/evidence foundation may be included only if required to activate these command boundaries; full audit, security, access, and operational evidence remains an M4 dependency. M1 does not silently introduce the complete M4 evidence model.

## 4. Explicitly out of M1

M1 intentionally excludes:

- learning/content hierarchy;
- lesson resources;
- commerce, products, offers, plans, or prices;
- orders, payments, transactions, or refunds;
- subscriptions, seats, enrollments, or `access_grants`;
- device and session tables;
- protected-media assets and policies;
- quizzes, assessments, attempts, and scoring;
- seed data;
- real RLS policy implementation, except that any earlier Data API exposure requires RLS before exposure;
- runtime adapter integration;
- admin command persistence;
- real Supabase Auth integration; and
- any provider, storage, CDN, payment, media, or notification integration.

M1 membership and profile records do not activate protected access. Commercial approval, seat/subscription state, and explicit access-grant issuance remain M3 concerns.

## 5. M1 table-planning matrix

| Table concept | Canonical table name | Purpose | Brand-scoped? | Key columns to plan | Important uniqueness constraints | Important foreign keys | Status/lifecycle fields | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Educational brand | `educational_brands` | Defines the educational identities available inside the one application platform. | No; it defines brands. | `id`, `code`, `name`, `slug`, `status`, `created_at`, `updated_at` | Unique `code`; unique `slug`; initial codes are `medway` and `elite`. | None in M1. | `active`, `inactive` | Do not use `brands` as the canonical table name; do not introduce `educational_brand_id`. |
| Application user | `app_users` | Global application account linked to provider identity. | No; global application user. | `id`, `auth_user_id` or `provider_user_id`, `primary_email`, `primary_phone`, `status`, `created_at`, `updated_at` | Provider identity unique; email/phone uniqueness strategy remains a pre-SQL question. | Provider identity mapping, if directly linked or separately modeled. | `active`, `disabled`; deleted/anonymized handling remains a later decision. | Existence of an `app_user` does not grant brand access. |
| Provider identity linkage | Auth identity linkage concept; possible `app_user_auth_identities` | Maps one or more provider identities to an application user. | No; identity linkage is global. | `id`, `app_user_id`, `provider`, `provider_user_id`, `status`, timestamps | Unique `(provider, provider_user_id)`; exact multi-provider rules remain open. | `app_user_id` → `app_users`. | `active`, `revoked` | Direct `auth_user_id` on `app_users` is the simpler v1 recommendation; a separate mapping table is better for multiple providers. Do not finalize implementation here. |
| Brand membership | `brand_memberships` | Explicit relationship between a global app user and an educational brand. | Yes, through `brand_id`. | `id`, `brand_id`, `app_user_id`, `status`, `membership_type`, `activated_at`, `suspended_at`, `expired_at`, `created_at`, `updated_at` | Either one active membership per `(app_user_id, brand_id)` or one historical membership row per pair; lifecycle choice remains a pre-SQL question. | `brand_id` → `educational_brands`; `app_user_id` → `app_users`. | `pending_payment`, `pending_review`, `active`, `suspended`, `expired`, `cancelled`, `rejected` | Membership is not automatically active after registration. Paid activation requires manual payment-reference verification and a backend command. |
| Student profile | `student_profiles` | Brand-specific academic and learner profile. | Yes. | `id`, `brand_id`, `app_user_id`, optional `membership_id`, `full_name`, `phone`, `email`, `academic_year`, `academic_term`, `university`, `student_id`, `status`, `created_at`, `updated_at` | `student_id` may be unique per brand if required; phone/email strategy must align with global identity rules. | `brand_id` → `educational_brands`; `app_user_id` → `app_users`; optional membership → `brand_memberships`. | `pending`, `active`, `suspended`, `archived` | Each profile belongs to exactly one brand. |
| Admin profile | `admin_profiles` | Brand-scoped administrative identity and lifecycle. | Yes for v1. | `id`, `brand_id`, `app_user_id`, `display_name`, `status`, `created_at`, `updated_at` | Unique `(app_user_id, brand_id)`. | `brand_id` → `educational_brands`; `app_user_id` → `app_users`. | `active`, `suspended`, `revoked` | Global/super admin is deferred; future support requires explicit scoped assignments. |
| Admin role definition | `admin_roles` | Defines reusable administrative role meaning. | Global template or brand-scoped row; assignments are always brand-scoped. | `id`, optional `brand_id`, `code`, `name`, `description`, `status` | Role code uniqueness depends on global-template versus brand-row choice. | Optional `brand_id` → `educational_brands`. | `active`, `inactive` | Recommend global role templates for reusable meaning, with brand-specific assignment enforcing scope; final physical choice remains pre-SQL. |
| Admin permission catalog | `admin_permissions` | Global catalog of reusable permission meanings. | No if permission meaning is global. | `id`, `code`, `description`, `category`, `status` | Unique permission `code`. | None in M1. | `active`, `inactive` | Permission meaning can be global because it is reusable across brands. |
| Admin role-permission join | `admin_role_permissions` | Connects roles to permission meanings. | Follows role model. | `role_id`, `permission_id` | Unique `(role_id, permission_id)`; add brand key if role rows are brand-scoped. | `role_id` → `admin_roles`; `permission_id` → `admin_permissions`. | Usually relationship presence only; lifecycle may follow role/permission. | Must preserve the selected role-scope model. |
| Admin role assignment | `admin_role_assignments` | Assigns a role to a brand-scoped admin profile. | Yes. | `id`, `brand_id`, `admin_profile_id`, `role_id`, `assigned_by`, `assigned_at`, `revoked_at`, `status` | Active assignment uniqueness must prevent unintended duplicate role grants; exact constraint remains pre-SQL. | `brand_id` → `educational_brands`; `admin_profile_id` → `admin_profiles`; `role_id` → `admin_roles`; `assigned_by` → `app_users` or admin actor reference. | `active`, `revoked` | Assignment `brand_id` must match the admin profile and the effective role scope. Permissions must not silently cross Medway/Elite. |
| Audit/evidence dependency | Minimal placeholder only if required; full M4 evidence model remains separate | Captures append-only evidence for M1 profile/membership/admin changes when command activation requires it. | Brand scope required when activity is brand-specific. | Actor, target, brand, reason, idempotency, result, timestamp, metadata/reference | Event idempotency/correlation strategy remains pre-SQL. | Brand and actor/target references as applicable. | Append-only event outcome | Do not expand this placeholder into full M4 audit/security/access persistence without a separate approval. |

## 6. M1 relationship plan

- `educational_brands.id` is referenced by every brand-scoped M1 table through concise `brand_id`.
- `app_users` remain global and do not carry a brand scope as their identity boundary.
- `brand_memberships` link `app_users` to `educational_brands`.
- `student_profiles` link a global app user to one `brand_id`, with optional `membership_id` only if the final lifecycle model requires it.
- `admin_profiles` link a global app user to one `brand_id`.
- `admin_role_assignments` link an admin profile, role, and `brand_id`.
- `admin_role_permissions` link roles to permissions while preserving the selected role-scope model.
- Every brand-scoped foreign-key relationship must prove matching `brand_id` values.
- Legacy `platform_id` and `platform_code` must not appear in the new M1 schema plan.

## 7. Brand integrity rules

- No Medway membership, profile, or admin assignment may reference the Elite `brand_id`, and vice versa.
- A child `brand_id` must match its parent `brand_id` for every brand-scoped relationship.
- `admin_role_assignments.brand_id` must match `admin_profiles.brand_id`.
- `student_profiles.brand_id` must match `brand_memberships.brand_id` when `membership_id` is used.
- A manual activation flow must not bypass the explicit membership and later access-grant model.
- An `app_user` alone grants no brand access.
- Registration and authentication alone grant no protected content access.
- Membership, profile, admin role, or permission state alone does not replace backend authorization evaluation.
- M1 must not introduce `platform_id`, `platform_code`, `educational_brand_id`, or `educational_brand_code`.

## 8. Lifecycle/status planning

These are planning-level names and must be confirmed again before SQL:

| Concept | Recommended statuses |
| --- | --- |
| `educational_brands` | `active`, `inactive` |
| `app_users` | `active`, `disabled`; deleted/anonymized candidate later if required |
| `brand_memberships` | `pending_payment`, `pending_review`, `active`, `suspended`, `expired`, `cancelled`, `rejected` |
| `student_profiles` | `pending`, `active`, `suspended`, `archived` |
| `admin_profiles` | `active`, `suspended`, `revoked` |
| `admin_role_assignments` | `active`, `revoked` |

## 9. Manual-payment activation dependency

M1 can create membership and profile foundations, including pending membership states. Actual payment-evidence, order, subscription, seat, and `access_grant` tables belong to M3.

Therefore:

- M1 must not imply access activation.
- A pending or active-looking M1 membership record is not by itself protected-content authority.
- Paid activation requires a later M3 flow with manual transfer/reference evidence, admin verification, commercial state transition, and explicit access-grant creation.
- Until M3 exists, mock/admin runtime behavior must not treat membership alone as protected content access.

## 10. RLS/Data API gate

- The app schema remains private and backend-mediated initially.
- M1 planning does not expose any table through Supabase/Data API.
- If an M1 table is exposed earlier, RLS must be designed and enabled before exposure, with explicit exposure approval.
- M7 remains the full RLS hardening, review, and testing phase.
- RLS is defense-in-depth and does not replace backend request context, brand validation, lifecycle checks, or authorization policy.

## 11. Migration ordering draft

Without writing SQL, the intended order is:

1. `educational_brands`
2. `app_users` and provider-auth identity linkage
3. `brand_memberships`
4. `student_profiles`
5. `admin_profiles`
6. `admin_permissions`
7. `admin_roles`
8. `admin_role_permissions`
9. `admin_role_assignments`
10. Optional minimal audit/evidence foundation if required for admin/profile/membership changes

No step includes migration application, seed data, runtime adapter wiring, or provider connection.

## 12. Open implementation questions before SQL

- Should UUIDs be generated in the database or by the application?
- Should v1 keep direct `auth_user_id` on `app_users`, or use a separate auth-identity mapping table for multiple providers?
- Should phone/email be globally unique, brand-level unique, or governed by a mixed identity strategy?
- Should `brand_memberships` have one row per user-brand forever, or multiple lifecycle rows per pair?
- Should `student_profiles` require `membership_id`, or is `(app_user_id, brand_id)` sufficient?
- Should `admin_roles` be global reusable templates or brand-scoped rows?
- Should `admin_permissions` be seeded in M1 or defined in a later admin phase?
- What exact timestamp convention and timezone handling will be used?
- What deleted/anonymized handling will be used for app users and profiles?
- Which indexes are required for future admin overview/read models?
- Which constraints are enforced by the database versus backend validation?
- Is the minimal audit/evidence foundation included in M1 or deferred entirely to M4?

## 13. M1 validation plan before SQL

The later SQL draft must verify:

- no `platform_id` or `platform_code` appears in the new M1 schema;
- `educational_brands` exists with canonical `medway` and `elite` code planning;
- `brand_id` is used for scoped tables;
- `app_users` are global;
- app-user existence does not grant access;
- `brand_memberships` are explicit;
- student and admin profiles are brand-scoped;
- admin role assignments are brand-scoped;
- uniqueness and foreign-key strategy is documented;
- no Supabase/Data API exposure exists without RLS;
- no seed data is included unless explicitly approved later; and
- no runtime code depends on M1 persistence before adapters are written.

## 14. Push checkpoint recommendation

After Prompt 31 is committed and full validation passes, the project may perform an intentional staging checkpoint push to `dev`. The push is not part of Prompt 31.

Recommended pre-push validation for that separate checkpoint:

- `git status`;
- API typecheck;
- API build;
- API runtime smoke;
- Web typecheck;
- Web build;
- container smoke; and
- Dokploy Compose configuration validation.

The command `git push origin dev` must be run only after explicit approval. Because `dev` uses an On Push Dokploy trigger, the push may redeploy staging. Monitor Dokploy logs after an approved push; this remains staging only, not production.

## 15. Next phase recommendation

### Prompt 32 — M1 SQL Draft Files

Prompt 32 may draft SQL migration files only if explicitly approved. Applying migrations remains forbidden until a later explicit apply phase. Supabase connection and provider integration remain separate work.

## 16. Prompt 32 status

Prompt 32 created non-applied M1 SQL drafts under [`api/db/migration-drafts/m1/`](../db/migration-drafts/m1/README.md) and recorded their review gates in the [M1 SQL Draft Review](m1-sql-draft-review.md). The SQL remains draft-only and unapplied; a separate SQL review is required before active migration authoring or application. The RLS/Data API gate is unchanged, and D36 continues to defer all seed data.

## 17. Prompt 33 review status

Prompt 33 completed the static [M1 SQL Draft Review Fixes](m1-sql-draft-review-fixes.md). No SQL change or application occurred. The review confirms the private draft boundary, same-brand integrity constraints, index/trigger plan, and continued RLS/Data API and D36 seed-data gates.

## 18. Prompt 35 staging-apply planning status

The [M1 Staging Migration Apply Plan](m1-staging-migration-apply-plan.md) now defines a future staging-only application runbook for the reviewed draft. SQL remains unapplied, and Prompt 36 requires explicit owner approval before any active migration artifact or staging mutation is created.

## 19. Prompt 36 staging-apply status

Prompt 36 applied the unchanged M1 draft once to Supabase staging ref `mgrsgibxuwgbxtdqprkw`; see the [M1 Staging Migration Apply Report](m1-staging-migration-apply-report.md). The schema has not been applied to production, and API, frontend, and Dokploy runtime remain mock-backed.
