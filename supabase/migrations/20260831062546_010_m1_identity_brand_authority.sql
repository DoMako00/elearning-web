begin;

create table app.educational_brands (
  id uuid not null default gen_random_uuid(),
  code text not null,
  name text not null,
  slug text not null,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  version bigint not null default 1,
  constraint educational_brands_pkey primary key (id),
  constraint educational_brands_code_key unique (code),
  constraint educational_brands_slug_key unique (slug),
  constraint educational_brands_status_check check (status in ('active', 'inactive')),
  constraint educational_brands_code_not_blank_check check (btrim(code) <> ''),
  constraint educational_brands_name_not_blank_check check (btrim(name) <> ''),
  constraint educational_brands_slug_not_blank_check check (btrim(slug) <> ''),
  constraint educational_brands_version_check check (version >= 1)
);

create table app.app_users (
  id uuid not null default gen_random_uuid(),
  auth_user_id uuid not null,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  version bigint not null default 1,
  constraint app_users_pkey primary key (id),
  constraint app_users_auth_user_id_key unique (auth_user_id),
  constraint app_users_status_check check (status in ('pending', 'active', 'suspended', 'disabled')),
  constraint app_users_version_check check (version >= 1)
);

create table app.brand_memberships (
  id uuid not null default gen_random_uuid(),
  app_user_id uuid not null,
  brand_id uuid not null,
  status text not null default 'pending',
  valid_from timestamptz not null default now(),
  valid_until timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  version bigint not null default 1,
  constraint brand_memberships_pkey primary key (id),
  constraint brand_memberships_app_user_id_fkey foreign key (app_user_id) references app.app_users (id) on delete restrict on update restrict,
  constraint brand_memberships_brand_id_fkey foreign key (brand_id) references app.educational_brands (id) on delete restrict on update restrict,
  constraint brand_memberships_identity_user_brand_key unique (id, app_user_id, brand_id),
  constraint brand_memberships_identity_brand_key unique (id, brand_id),
  constraint brand_memberships_status_check check (status in ('pending', 'active', 'suspended', 'ended', 'revoked')),
  constraint brand_memberships_validity_check check (valid_until is null or valid_until > valid_from),
  constraint brand_memberships_version_check check (version >= 1)
);
create unique index brand_memberships_active_user_brand_key on app.brand_memberships (app_user_id, brand_id) where status = 'active';
create index brand_memberships_user_brand_status_idx on app.brand_memberships (app_user_id, brand_id, status);
create index brand_memberships_brand_id_idx on app.brand_memberships (brand_id);

create table app.student_profiles (
  id uuid not null default gen_random_uuid(),
  brand_membership_id uuid not null,
  app_user_id uuid not null,
  brand_id uuid not null,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  version bigint not null default 1,
  constraint student_profiles_pkey primary key (id),
  constraint student_profiles_app_user_id_fkey foreign key (app_user_id) references app.app_users (id) on delete restrict on update restrict,
  constraint student_profiles_brand_id_fkey foreign key (brand_id) references app.educational_brands (id) on delete restrict on update restrict,
  constraint student_profiles_membership_identity_user_brand_fkey foreign key (brand_membership_id, app_user_id, brand_id) references app.brand_memberships (id, app_user_id, brand_id) on delete restrict on update restrict,
  constraint student_profiles_user_brand_key unique (app_user_id, brand_id),
  constraint student_profiles_identity_brand_key unique (id, brand_id),
  constraint student_profiles_status_check check (status in ('active', 'inactive', 'archived')),
  constraint student_profiles_version_check check (version >= 1)
);
create index student_profiles_brand_id_idx on app.student_profiles (brand_id);
create index student_profiles_membership_identity_user_brand_idx on app.student_profiles (brand_membership_id, app_user_id, brand_id);

create table app.admin_profiles (
  id uuid not null default gen_random_uuid(),
  app_user_id uuid not null,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  version bigint not null default 1,
  constraint admin_profiles_pkey primary key (id),
  constraint admin_profiles_app_user_id_fkey foreign key (app_user_id) references app.app_users (id) on delete restrict on update restrict,
  constraint admin_profiles_app_user_id_key unique (app_user_id),
  constraint admin_profiles_status_check check (status in ('active', 'suspended', 'disabled')),
  constraint admin_profiles_version_check check (version >= 1)
);

create table app.admin_permissions (
  id uuid not null default gen_random_uuid(),
  code text not null,
  description text not null,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  version bigint not null default 1,
  constraint admin_permissions_pkey primary key (id),
  constraint admin_permissions_code_key unique (code),
  constraint admin_permissions_code_shape_check check (code ~ '^admin[.][a-z0-9]+([.][a-z0-9]+)*$'),
  constraint admin_permissions_code_trimmed_check check (code = btrim(code)),
  constraint admin_permissions_description_not_blank_check check (btrim(description) <> ''),
  constraint admin_permissions_status_check check (status in ('active', 'retired')),
  constraint admin_permissions_version_check check (version >= 1)
);

create table app.admin_roles (
  id uuid not null default gen_random_uuid(),
  code text not null,
  name text not null,
  assignment_scope text not null default 'platform',
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  version bigint not null default 1,
  constraint admin_roles_pkey primary key (id),
  constraint admin_roles_code_key unique (code),
  constraint admin_roles_code_not_blank_check check (btrim(code) <> ''),
  constraint admin_roles_name_not_blank_check check (btrim(name) <> ''),
  constraint admin_roles_assignment_scope_check check (assignment_scope = 'platform'),
  constraint admin_roles_status_check check (status in ('active', 'retired')),
  constraint admin_roles_version_check check (version >= 1)
);

create table app.admin_role_permissions (
  admin_role_id uuid not null,
  admin_permission_id uuid not null,
  created_at timestamptz not null default now(),
  constraint admin_role_permissions_pkey primary key (admin_role_id, admin_permission_id),
  constraint admin_role_permissions_role_id_fkey foreign key (admin_role_id) references app.admin_roles (id) on delete restrict on update restrict,
  constraint admin_role_permissions_permission_id_fkey foreign key (admin_permission_id) references app.admin_permissions (id) on delete restrict on update restrict
);
create index admin_role_permissions_permission_id_idx on app.admin_role_permissions (admin_permission_id);

create table app.platform_admin_role_assignments (
  id uuid not null default gen_random_uuid(),
  admin_profile_id uuid not null,
  admin_role_id uuid not null,
  status text not null default 'active',
  valid_from timestamptz not null default now(),
  valid_until timestamptz null,
  assigned_by_admin_profile_id uuid null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  version bigint not null default 1,
  constraint platform_admin_role_assignments_pkey primary key (id),
  constraint platform_admin_role_assignments_profile_id_fkey foreign key (admin_profile_id) references app.admin_profiles (id) on delete restrict on update restrict,
  constraint platform_admin_role_assignments_role_id_fkey foreign key (admin_role_id) references app.admin_roles (id) on delete restrict on update restrict,
  constraint platform_admin_role_assignments_assigned_by_fkey foreign key (assigned_by_admin_profile_id) references app.admin_profiles (id) on delete restrict on update restrict,
  constraint platform_admin_role_assignments_status_check check (status in ('active', 'inactive', 'expired', 'revoked')),
  constraint platform_admin_role_assignments_validity_check check (valid_until is null or valid_until > valid_from),
  constraint platform_admin_role_assignments_version_check check (version >= 1)
);
create unique index platform_admin_role_assignments_active_profile_role_key on app.platform_admin_role_assignments (admin_profile_id, admin_role_id) where status = 'active';
create index platform_admin_role_assignments_profile_id_idx on app.platform_admin_role_assignments (admin_profile_id);
create index platform_admin_role_assignments_role_id_idx on app.platform_admin_role_assignments (admin_role_id);
create index platform_admin_role_assignments_assigned_by_idx on app.platform_admin_role_assignments (assigned_by_admin_profile_id) where assigned_by_admin_profile_id is not null;
create index platform_admin_role_assignments_status_validity_idx on app.platform_admin_role_assignments (status, valid_from, valid_until);

create trigger educational_brands_set_updated_at before update on app.educational_brands for each row execute function app.set_updated_at();
create trigger app_users_set_updated_at before update on app.app_users for each row execute function app.set_updated_at();
create trigger brand_memberships_set_updated_at before update on app.brand_memberships for each row execute function app.set_updated_at();
create trigger student_profiles_set_updated_at before update on app.student_profiles for each row execute function app.set_updated_at();
create trigger admin_profiles_set_updated_at before update on app.admin_profiles for each row execute function app.set_updated_at();
create trigger admin_permissions_set_updated_at before update on app.admin_permissions for each row execute function app.set_updated_at();
create trigger admin_roles_set_updated_at before update on app.admin_roles for each row execute function app.set_updated_at();
create trigger platform_admin_role_assignments_set_updated_at before update on app.platform_admin_role_assignments for each row execute function app.set_updated_at();

revoke all on all tables in schema app from public;
revoke all on all tables in schema app from anon;
revoke all on all tables in schema app from authenticated;

commit;
