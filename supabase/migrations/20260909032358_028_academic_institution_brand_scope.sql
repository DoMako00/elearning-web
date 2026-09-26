begin;

-- Academic institutions are source catalogues such as BUC and Delta. They are
-- deliberately separate from commercial educational brands such as Medway,
-- Elite, and Nexus.
create table app.academic_institutions (
  id uuid primary key default gen_random_uuid(),
  code varchar(32) not null,
  normalized_code varchar(32) generated always as (lower(btrim(code))) stored,
  display_name varchar(160) not null,
  slug varchar(80) not null,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  version bigint not null default 1,
  constraint academic_institutions_normalized_code_key unique (normalized_code),
  constraint academic_institutions_slug_key unique (slug),
  constraint academic_institutions_code_trimmed_check check (code = btrim(code) and code <> ''),
  constraint academic_institutions_display_name_trimmed_check check (display_name = btrim(display_name) and display_name <> ''),
  constraint academic_institutions_slug_trimmed_check check (slug = btrim(slug) and slug <> ''),
  constraint academic_institutions_status_check check (status in ('active','retired')),
  constraint academic_institutions_version_check check (version >= 1)
);

alter table app.academic_levels
  add column academic_institution_id uuid null,
  add constraint academic_levels_academic_institution_id_fkey
    foreign key (academic_institution_id) references app.academic_institutions (id) on delete restrict on update restrict;

alter table app.academic_levels
  drop constraint academic_levels_level_number_key,
  add constraint academic_levels_institution_level_number_key unique (academic_institution_id, level_number);

create index academic_levels_academic_institution_id_idx
  on app.academic_levels (academic_institution_id);

alter table app.brand_courses
  add column academic_institution_id uuid null,
  add constraint brand_courses_academic_institution_id_fkey
    foreign key (academic_institution_id) references app.academic_institutions (id) on delete restrict on update restrict,
  add constraint brand_courses_academic_institution_required_check
    check (classification <> 'academic_module_offering' or academic_institution_id is not null);

create index brand_courses_academic_institution_id_idx
  on app.brand_courses (academic_institution_id);

create table app.brand_academic_institution_access (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null,
  academic_institution_id uuid not null,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  version bigint not null default 1,
  constraint brand_academic_institution_access_brand_id_fkey
    foreign key (brand_id) references app.educational_brands (id) on delete restrict on update restrict,
  constraint brand_academic_institution_access_institution_id_fkey
    foreign key (academic_institution_id) references app.academic_institutions (id) on delete restrict on update restrict,
  constraint brand_academic_institution_access_brand_institution_key unique (brand_id, academic_institution_id),
  constraint brand_academic_institution_access_status_check check (status in ('active','inactive')),
  constraint brand_academic_institution_access_version_check check (version >= 1)
);

create index brand_academic_institution_access_brand_id_idx
  on app.brand_academic_institution_access (brand_id);
create index brand_academic_institution_access_institution_id_idx
  on app.brand_academic_institution_access (academic_institution_id);

create trigger academic_institutions_set_updated_at
  before update on app.academic_institutions
  for each row execute function app.set_updated_at();
create trigger brand_academic_institution_access_set_updated_at
  before update on app.brand_academic_institution_access
  for each row execute function app.set_updated_at();

revoke all on table app.academic_institutions, app.brand_academic_institution_access from public, anon, authenticated;

comment on table app.academic_institutions is
  'Private academic catalogue owners such as BUC and Delta. Not a commercial brand.';
comment on table app.brand_academic_institution_access is
  'Private mapping that permits a commercial brand to build offerings from an academic institution catalogue.';
comment on column app.brand_courses.academic_institution_id is
  'Selected academic catalogue for a commercial course. API commands must keep this aligned with any linked academic module.';

commit;
