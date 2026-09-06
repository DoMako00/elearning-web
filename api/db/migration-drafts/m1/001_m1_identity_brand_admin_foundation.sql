/*
 * ============================================================================
 * PROMPT 32 — DRAFT ONLY / NOT AN APPROVED OR APPLIED MIGRATION
 * ============================================================================
 *
 * - Do not apply this file without explicit migration-application approval.
 * - This draft contains no seed data.
 * - This draft does not enable RLS or create RLS policies.
 * - The app schema remains private and backend-mediated initially.
 * - RLS design, enablement, review, testing, and explicit exposure approval are
 *   required before any table is exposed through the Supabase/Data API.
 * - New schema identifiers use brand terminology. Legacy platform_id and
 *   platform_code, and long educational_brand_id / educational_brand_code
 *   forms, must not become active identifiers in the new schema.
 * - Full audit/evidence persistence remains an M4 dependency.
 *
 * UUID review gate:
 * This draft uses gen_random_uuid(). Confirm PostgreSQL/Supabase availability
 * and the pgcrypto/extension policy before migration application. No extension
 * is created or version-pinned by this draft.
 * ============================================================================
 */

create schema if not exists app;

-- Keep the internal schema private. Prompt 32 intentionally grants no access
-- to Supabase Data API roles.
revoke all on schema app from public;

-- Draft timestamp utility. It is intentionally security-invoker (the default)
-- and is not part of a public API surface.
create or replace function app.set_updated_at()
returns trigger
language plpgsql
set search_path = pg_catalog
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke all on function app.set_updated_at() from public;

create table app.educational_brands (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  name text not null,
  slug text not null,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint educational_brands_code_key unique (code),
  constraint educational_brands_slug_key unique (slug),
  constraint educational_brands_code_format_check
    check (code ~ '^[a-z][a-z0-9_-]*$'),
  constraint educational_brands_status_check
    check (status in ('active', 'inactive'))
);

-- Initial canonical codes are medway and elite. D36 defers their seed rows.

create table app.app_users (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null,
  primary_email text,
  primary_phone text,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint app_users_auth_user_id_key unique (auth_user_id),
  constraint app_users_status_check
    check (status in ('active', 'disabled', 'anonymized'))
);

-- Direct auth_user_id linkage is the v1 draft direction. A hard foreign key to
-- auth.users is intentionally omitted pending Supabase-specific review.
-- Existence in app_users does not grant brand membership or protected access.

create index app_users_primary_email_lower_idx
  on app.app_users (lower(primary_email))
  where primary_email is not null;

create index app_users_primary_phone_idx
  on app.app_users (primary_phone)
  where primary_phone is not null;

create table app.brand_memberships (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null,
  app_user_id uuid not null,
  membership_type text not null default 'student',
  status text not null default 'pending_payment',
  activated_at timestamptz,
  suspended_at timestamptz,
  expired_at timestamptz,
  cancelled_at timestamptz,
  rejected_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint brand_memberships_brand_id_fkey
    foreign key (brand_id) references app.educational_brands (id),
  constraint brand_memberships_app_user_id_fkey
    foreign key (app_user_id) references app.app_users (id),
  constraint brand_memberships_brand_app_user_key
    unique (brand_id, app_user_id),
  constraint brand_memberships_id_brand_key
    unique (id, brand_id),
  constraint brand_memberships_type_check
    check (membership_type in ('student', 'admin_candidate', 'staff')),
  constraint brand_memberships_status_check
    check (
      status in (
        'pending_payment',
        'pending_review',
        'active',
        'suspended',
        'expired',
        'cancelled',
        'rejected'
      )
    )
);

create index brand_memberships_brand_status_idx
  on app.brand_memberships (brand_id, status);

create index brand_memberships_app_user_id_idx
  on app.brand_memberships (app_user_id);

-- Membership is not entitlement. Paid activation still requires the M3
-- commercial review, subscription/seat flow, access grant, and backend policy.

create table app.student_profiles (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null,
  app_user_id uuid not null,
  brand_membership_id uuid not null,
  full_name text not null,
  phone text,
  email text,
  academic_year text,
  academic_term text,
  university text,
  student_id text,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint student_profiles_brand_id_fkey
    foreign key (brand_id) references app.educational_brands (id),
  constraint student_profiles_app_user_id_fkey
    foreign key (app_user_id) references app.app_users (id),
  constraint student_profiles_brand_membership_id_fkey
    foreign key (brand_membership_id) references app.brand_memberships (id),
  constraint student_profiles_membership_brand_fkey
    foreign key (brand_membership_id, brand_id)
    references app.brand_memberships (id, brand_id),
  constraint student_profiles_brand_app_user_key
    unique (brand_id, app_user_id),
  constraint student_profiles_status_check
    check (status in ('pending', 'active', 'suspended', 'archived'))
);

create unique index student_profiles_brand_student_id_key
  on app.student_profiles (brand_id, student_id)
  where student_id is not null;

create index student_profiles_brand_status_idx
  on app.student_profiles (brand_id, status);

create index student_profiles_app_user_id_idx
  on app.student_profiles (app_user_id);

create index student_profiles_membership_brand_idx
  on app.student_profiles (brand_membership_id, brand_id);

-- A brand-scoped profile does not create another brand profile and does not
-- grant protected content access.

create table app.admin_profiles (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null,
  app_user_id uuid not null,
  display_name text not null,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint admin_profiles_brand_id_fkey
    foreign key (brand_id) references app.educational_brands (id),
  constraint admin_profiles_app_user_id_fkey
    foreign key (app_user_id) references app.app_users (id),
  constraint admin_profiles_brand_app_user_key
    unique (brand_id, app_user_id),
  constraint admin_profiles_id_brand_key
    unique (id, brand_id),
  constraint admin_profiles_status_check
    check (status in ('active', 'suspended', 'revoked'))
);

create index admin_profiles_brand_status_idx
  on app.admin_profiles (brand_id, status);

create index admin_profiles_app_user_id_idx
  on app.admin_profiles (app_user_id);

-- Global/super-admin behavior is deferred by D08.

create table app.admin_permissions (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  category text not null,
  description text,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint admin_permissions_code_key unique (code),
  constraint admin_permissions_status_check
    check (status in ('active', 'deprecated', 'disabled'))
);

-- Permission meanings are global and reusable. D36 defers permission seeds.

create table app.admin_roles (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null,
  code text not null,
  name text not null,
  description text,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint admin_roles_brand_id_fkey
    foreign key (brand_id) references app.educational_brands (id),
  constraint admin_roles_brand_code_key unique (brand_id, code),
  constraint admin_roles_id_brand_key unique (id, brand_id),
  constraint admin_roles_status_check
    check (status in ('active', 'disabled', 'archived'))
);

create index admin_roles_brand_status_idx
  on app.admin_roles (brand_id, status);

-- Roles are brand-scoped for v1. A global role-template model requires a later
-- explicit decision and must not be introduced as a nullable-brand bypass.

create table app.admin_role_permissions (
  role_id uuid not null,
  permission_id uuid not null,
  created_at timestamptz not null default now(),
  constraint admin_role_permissions_pkey
    primary key (role_id, permission_id),
  constraint admin_role_permissions_role_id_fkey
    foreign key (role_id) references app.admin_roles (id),
  constraint admin_role_permissions_permission_id_fkey
    foreign key (permission_id) references app.admin_permissions (id)
);

create index admin_role_permissions_permission_id_idx
  on app.admin_role_permissions (permission_id);

create table app.admin_role_assignments (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null,
  admin_profile_id uuid not null,
  role_id uuid not null,
  assigned_by_admin_profile_id uuid,
  assigned_at timestamptz not null default now(),
  revoked_at timestamptz,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint admin_role_assignments_brand_id_fkey
    foreign key (brand_id) references app.educational_brands (id),
  constraint admin_role_assignments_profile_brand_fkey
    foreign key (admin_profile_id, brand_id)
    references app.admin_profiles (id, brand_id),
  constraint admin_role_assignments_role_brand_fkey
    foreign key (role_id, brand_id)
    references app.admin_roles (id, brand_id),
  constraint admin_role_assignments_assigner_brand_fkey
    foreign key (assigned_by_admin_profile_id, brand_id)
    references app.admin_profiles (id, brand_id),
  constraint admin_role_assignments_status_check
    check (status in ('active', 'revoked'))
);

create unique index admin_role_assignments_active_key
  on app.admin_role_assignments (brand_id, admin_profile_id, role_id)
  where status = 'active';

create index admin_role_assignments_brand_profile_status_idx
  on app.admin_role_assignments (brand_id, admin_profile_id, status);

create index admin_role_assignments_role_brand_idx
  on app.admin_role_assignments (role_id, brand_id);

create index admin_role_assignments_assigner_brand_idx
  on app.admin_role_assignments (assigned_by_admin_profile_id, brand_id)
  where assigned_by_admin_profile_id is not null;

-- Full append-only audit/evidence tables are intentionally not drafted here.
-- Admin command activation must wait for M4 evidence persistence or a separately
-- approved minimal audit foundation.

create trigger educational_brands_set_updated_at
before update on app.educational_brands
for each row execute function app.set_updated_at();

create trigger app_users_set_updated_at
before update on app.app_users
for each row execute function app.set_updated_at();

create trigger brand_memberships_set_updated_at
before update on app.brand_memberships
for each row execute function app.set_updated_at();

create trigger student_profiles_set_updated_at
before update on app.student_profiles
for each row execute function app.set_updated_at();

create trigger admin_profiles_set_updated_at
before update on app.admin_profiles
for each row execute function app.set_updated_at();

create trigger admin_permissions_set_updated_at
before update on app.admin_permissions
for each row execute function app.set_updated_at();

create trigger admin_roles_set_updated_at
before update on app.admin_roles
for each row execute function app.set_updated_at();

create trigger admin_role_assignments_set_updated_at
before update on app.admin_role_assignments
for each row execute function app.set_updated_at();

/*
 * END OF PROMPT 32 DRAFT.
 * No grants, seed data, RLS policies, or migration-application commands follow.
 */
