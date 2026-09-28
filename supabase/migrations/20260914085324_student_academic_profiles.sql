begin;

-- A private, per-commercial-brand-student extension. This intentionally does
-- not use auth.users: app.student_profiles remains the ownership and brand
-- boundary for the student record.
alter table app.academic_levels
  add constraint academic_levels_identity_institution_key unique (id, academic_institution_id);

alter table app.academic_semesters
  add constraint academic_semesters_identity_level_key unique (id, academic_level_id);

create table app.student_academic_profiles (
  id uuid primary key default gen_random_uuid(),
  student_profile_id uuid not null,
  brand_id uuid not null,
  full_name varchar(160) not null,
  email varchar(320) not null,
  student_code varchar(64) null,
  academic_institution_id uuid not null,
  academic_level_id uuid not null,
  academic_semester_id uuid not null,
  program_label varchar(160) null,
  expected_graduation_date date null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  version bigint not null default 1,
  constraint student_academic_profiles_student_profile_key unique (student_profile_id),
  constraint student_academic_profiles_student_brand_fkey
    foreign key (student_profile_id, brand_id)
    references app.student_profiles (id, brand_id) on delete restrict on update restrict,
  constraint student_academic_profiles_institution_fkey
    foreign key (academic_institution_id)
    references app.academic_institutions (id) on delete restrict on update restrict,
  constraint student_academic_profiles_level_institution_fkey
    foreign key (academic_level_id, academic_institution_id)
    references app.academic_levels (id, academic_institution_id) on delete restrict on update restrict,
  constraint student_academic_profiles_semester_level_fkey
    foreign key (academic_semester_id, academic_level_id)
    references app.academic_semesters (id, academic_level_id) on delete restrict on update restrict,
  constraint student_academic_profiles_full_name_trimmed_check
    check (full_name = btrim(full_name) and full_name <> ''),
  constraint student_academic_profiles_email_trimmed_check
    check (email = btrim(email) and email <> ''),
  constraint student_academic_profiles_student_code_trimmed_check
    check (student_code is null or (student_code = btrim(student_code) and student_code <> '')),
  constraint student_academic_profiles_program_label_trimmed_check
    check (program_label is null or (program_label = btrim(program_label) and program_label <> '')),
  constraint student_academic_profiles_version_check check (version >= 1)
);

create unique index student_academic_profiles_institution_code_key
  on app.student_academic_profiles (academic_institution_id, student_code)
  where student_code is not null;
create index student_academic_profiles_brand_level_idx
  on app.student_academic_profiles (brand_id, academic_level_id);
create index student_academic_profiles_brand_institution_idx
  on app.student_academic_profiles (brand_id, academic_institution_id);
create index student_academic_profiles_semester_level_idx
  on app.student_academic_profiles (academic_semester_id, academic_level_id);

create function app.enforce_student_academic_profile_brand_access()
returns trigger
language plpgsql
set search_path = app, pg_temp
as $$
begin
  if not exists (
    select 1
    from app.brand_academic_institution_access as access
    where access.brand_id = new.brand_id
      and access.academic_institution_id = new.academic_institution_id
      and access.status = 'active'
  ) then
    raise exception using
      errcode = '23514',
      message = 'student academic profile requires active commercial brand academic institution access';
  end if;
  return new;
end;
$$;

create trigger student_academic_profiles_enforce_brand_access
  before insert or update of brand_id, academic_institution_id
  on app.student_academic_profiles
  for each row execute function app.enforce_student_academic_profile_brand_access();
create trigger student_academic_profiles_set_updated_at
  before update on app.student_academic_profiles
  for each row execute function app.set_updated_at();

revoke all on table app.student_academic_profiles from public, anon, authenticated;
revoke all on function app.enforce_student_academic_profile_brand_access() from public, anon, authenticated;

comment on table app.student_academic_profiles is
  'Private identity and academic placement extension owned by one commercial-brand student profile. BUC and Delta remain academic institutions, never commercial brands.';
comment on column app.student_academic_profiles.email is
  'Private contact value. Authorized Admin Students reads return only a masked representation.';
comment on column app.student_academic_profiles.student_code is
  'Optional institution-scoped student code. Authorized Admin Students reads return only a masked representation.';

commit;
