-- Controlled, non-production acceptance records for the Admin Students read model.
--
-- This import deliberately does not create auth.users records, passwords, roles,
-- grants, access grants, devices, sessions, or payment/subscription data.
-- Execute only in a named non-production environment after local validation.
-- The five rows are visibly controlled acceptance records, not production students.

begin;

create temporary table controlled_admin_students (
  seed_key text primary key,
  brand_code text not null,
  academic_institution_code text not null,
  full_name varchar(160) not null,
  email varchar(320) not null,
  student_code varchar(64) not null,
  level_number integer not null,
  semester_number integer not null,
  program_label varchar(160) not null,
  expected_graduation_date date not null
) on commit drop;

insert into controlled_admin_students (
  seed_key,
  brand_code,
  academic_institution_code,
  full_name,
  email,
  student_code,
  level_number,
  semester_number,
  program_label,
  expected_graduation_date
)
values
  (
    'medway-buc-y1-s1-01',
    'medway',
    'buc',
    'Controlled Medway Student 01',
    'controlled.medway.01@example.test',
    'CTL-MED-001',
    1,
    1,
    'Medicine - controlled acceptance record',
    date '2031-06-30'
  ),
  (
    'medway-buc-y1-s1-02',
    'medway',
    'buc',
    'Controlled Medway Student 02',
    'controlled.medway.02@example.test',
    'CTL-MED-002',
    1,
    1,
    'Medicine - controlled acceptance record',
    date '2031-06-30'
  ),
  (
    'elite-buc-y1-s1-01',
    'elite',
    'buc',
    'Controlled Elite Student 01',
    'controlled.elite.01@example.test',
    'CTL-ELT-001',
    1,
    1,
    'Medicine - controlled acceptance record',
    date '2031-06-30'
  ),
  (
    'elite-buc-y1-s1-02',
    'elite',
    'buc',
    'Controlled Elite Student 02',
    'controlled.elite.02@example.test',
    'CTL-ELT-002',
    1,
    1,
    'Medicine - controlled acceptance record',
    date '2031-06-30'
  ),
  (
    'nexus-delta-y1-s1-01',
    'nexus',
    'delta',
    'Controlled Nexus Student 01',
    'controlled.nexus.01@example.test',
    'CTL-NEX-001',
    1,
    1,
    'Medicine - controlled acceptance record',
    date '2031-06-30'
  );

do $$
declare
  expected_brand_count integer;
  expected_institution_count integer;
  expected_placement_count integer;
  inaccessible_row_count integer;
begin
  select count(*)
  into expected_brand_count
  from app.educational_brands
  where status = 'active'
    and code in ('medway', 'elite', 'nexus');

  if expected_brand_count <> 3 then
    raise exception using
      errcode = '23514',
      message = 'Controlled Admin Students import requires active Medway, Elite, and Nexus brands.';
  end if;

  select count(distinct institution.code)
  into expected_institution_count
  from controlled_admin_students source
  join app.academic_institutions institution
    on institution.code = source.academic_institution_code
   and institution.status = 'active';

  if expected_institution_count <> (
    select count(distinct academic_institution_code)
    from controlled_admin_students
  ) then
    raise exception using
      errcode = '23514',
      message = 'Controlled Admin Students import requires every selected academic institution to be active.';
  end if;

  select count(*)
  into expected_placement_count
  from controlled_admin_students source
  join app.academic_institutions institution
    on institution.code = source.academic_institution_code
   and institution.status = 'active'
  join app.academic_levels level
    on level.academic_institution_id = institution.id
   and level.status = 'active'
   and level.level_number = source.level_number
  join app.academic_semesters semester
    on semester.academic_level_id = level.id
   and semester.status = 'active'
   and semester.semester_number = source.semester_number;

  if expected_placement_count <> (select count(*) from controlled_admin_students) then
    raise exception using
      errcode = '23514',
      message = 'Controlled Admin Students import requires every selected academic placement to be active.';
  end if;

  select count(*)
  into inaccessible_row_count
  from controlled_admin_students source
  left join app.educational_brands brand
    on brand.code = source.brand_code
   and brand.status = 'active'
  left join app.academic_institutions institution
    on institution.code = source.academic_institution_code
   and institution.status = 'active'
  left join app.brand_academic_institution_access access
    on access.brand_id = brand.id
   and access.academic_institution_id = institution.id
   and access.status = 'active'
  where access.id is null;

  if inaccessible_row_count <> 0 then
    raise exception using
      errcode = '23514',
      message = 'Controlled Admin Students import found a brand without active access to its selected academic institution.';
  end if;
end;
$$;

insert into app.app_users (
  id,
  auth_user_id,
  status
)
select
  md5('controlled-admin-students:app-user:' || source.seed_key)::uuid,
  md5('controlled-admin-students:auth-subject:' || source.seed_key)::uuid,
  'active'
from controlled_admin_students source
on conflict (id) do nothing;

insert into app.brand_memberships (
  id,
  app_user_id,
  brand_id,
  status
)
select
  md5('controlled-admin-students:membership:' || source.seed_key)::uuid,
  md5('controlled-admin-students:app-user:' || source.seed_key)::uuid,
  brand.id,
  'active'
from controlled_admin_students source
join app.educational_brands brand
  on brand.code = source.brand_code
 and brand.status = 'active'
on conflict (id) do nothing;

insert into app.student_profiles (
  id,
  brand_membership_id,
  app_user_id,
  brand_id,
  status
)
select
  md5('controlled-admin-students:student-profile:' || source.seed_key)::uuid,
  md5('controlled-admin-students:membership:' || source.seed_key)::uuid,
  md5('controlled-admin-students:app-user:' || source.seed_key)::uuid,
  brand.id,
  'active'
from controlled_admin_students source
join app.educational_brands brand
  on brand.code = source.brand_code
 and brand.status = 'active'
on conflict (id) do nothing;

insert into app.student_academic_profiles (
  id,
  student_profile_id,
  brand_id,
  full_name,
  email,
  student_code,
  academic_institution_id,
  academic_level_id,
  academic_semester_id,
  program_label,
  expected_graduation_date
)
select
  md5('controlled-admin-students:academic-profile:' || source.seed_key)::uuid,
  md5('controlled-admin-students:student-profile:' || source.seed_key)::uuid,
  brand.id,
  source.full_name,
  source.email,
  source.student_code,
  institution.id,
  level.id,
  semester.id,
  source.program_label,
  source.expected_graduation_date
from controlled_admin_students source
join app.educational_brands brand
  on brand.code = source.brand_code
 and brand.status = 'active'
join app.academic_institutions institution
  on institution.code = source.academic_institution_code
 and institution.status = 'active'
join app.academic_levels level
  on level.academic_institution_id = institution.id
 and level.level_number = source.level_number
 and level.status = 'active'
join app.academic_semesters semester
  on semester.academic_level_id = level.id
 and semester.semester_number = source.semester_number
 and semester.status = 'active'
on conflict (id) do nothing;

do $$
declare
  verified_row_count integer;
  expected_row_count integer;
begin
  select count(*) into expected_row_count from controlled_admin_students;

  select count(*)
  into verified_row_count
  from controlled_admin_students source
  join app.educational_brands brand
    on brand.code = source.brand_code
   and brand.status = 'active'
  join app.academic_institutions institution
    on institution.code = source.academic_institution_code
   and institution.status = 'active'
  join app.academic_levels level
    on level.academic_institution_id = institution.id
   and level.level_number = source.level_number
   and level.status = 'active'
  join app.academic_semesters semester
    on semester.academic_level_id = level.id
   and semester.semester_number = source.semester_number
   and semester.status = 'active'
  join app.app_users app_user
    on app_user.id = md5('controlled-admin-students:app-user:' || source.seed_key)::uuid
   and app_user.auth_user_id = md5('controlled-admin-students:auth-subject:' || source.seed_key)::uuid
   and app_user.status = 'active'
  join app.brand_memberships membership
    on membership.id = md5('controlled-admin-students:membership:' || source.seed_key)::uuid
   and membership.app_user_id = app_user.id
   and membership.brand_id = brand.id
   and membership.status = 'active'
  join app.student_profiles student_profile
    on student_profile.id = md5('controlled-admin-students:student-profile:' || source.seed_key)::uuid
   and student_profile.brand_membership_id = membership.id
   and student_profile.app_user_id = app_user.id
   and student_profile.brand_id = brand.id
   and student_profile.status = 'active'
  join app.student_academic_profiles academic_profile
    on academic_profile.id = md5('controlled-admin-students:academic-profile:' || source.seed_key)::uuid
   and academic_profile.student_profile_id = student_profile.id
   and academic_profile.brand_id = brand.id
   and academic_profile.full_name = source.full_name
   and academic_profile.email = source.email
   and academic_profile.student_code = source.student_code
   and academic_profile.academic_institution_id = institution.id
   and academic_profile.academic_level_id = level.id
   and academic_profile.academic_semester_id = semester.id
   and academic_profile.program_label = source.program_label
   and academic_profile.expected_graduation_date = source.expected_graduation_date;

  if verified_row_count <> expected_row_count then
    raise exception using
      errcode = '23514',
      message = 'Controlled Admin Students import did not verify every expected student academic profile.';
  end if;
end;
$$;

commit;
