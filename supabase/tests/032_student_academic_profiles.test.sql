begin;
select plan(14);

select is((select count(*) from information_schema.tables where table_schema = 'app' and table_name = 'student_academic_profiles'), 1::bigint, 'M032 creates the private student academic profile extension.');
select is((select count(*) from app.student_academic_profiles), 0::bigint, 'M032 creates no production student profile rows.');

insert into app.educational_brands (id, code, name, slug) values
  ('82000000-0000-4000-8000-000000000001', 'medway-student-fixture', 'Medway Student Fixture', 'medway-student-fixture'),
  ('82000000-0000-4000-8000-000000000002', 'elite-student-fixture', 'Elite Student Fixture', 'elite-student-fixture');
insert into app.app_users (id, auth_user_id) values
  ('82000000-0000-4000-8000-000000000003', '82000000-0000-4000-8000-000000000004'),
  ('82000000-0000-4000-8000-000000000005', '82000000-0000-4000-8000-000000000006');
insert into app.brand_memberships (id, app_user_id, brand_id) values
  ('82000000-0000-4000-8000-000000000007', '82000000-0000-4000-8000-000000000003', '82000000-0000-4000-8000-000000000001'),
  ('82000000-0000-4000-8000-000000000008', '82000000-0000-4000-8000-000000000005', '82000000-0000-4000-8000-000000000002');
insert into app.student_profiles (id, brand_membership_id, app_user_id, brand_id) values
  ('82000000-0000-4000-8000-000000000009', '82000000-0000-4000-8000-000000000007', '82000000-0000-4000-8000-000000000003', '82000000-0000-4000-8000-000000000001'),
  ('82000000-0000-4000-8000-000000000010', '82000000-0000-4000-8000-000000000008', '82000000-0000-4000-8000-000000000005', '82000000-0000-4000-8000-000000000002');
insert into app.academic_institutions (id, code, display_name, slug) values
  ('82000000-0000-4000-8000-000000000011', 'buc-student-fixture', 'BUC Student Fixture', 'buc-student-fixture'),
  ('82000000-0000-4000-8000-000000000012', 'delta-student-fixture', 'Delta Student Fixture', 'delta-student-fixture');
insert into app.academic_levels (id, academic_institution_id, level_number, display_title, sort_order) values
  ('82000000-0000-4000-8000-000000000013', '82000000-0000-4000-8000-000000000011', 1, 'BUC Level 1', 1),
  ('82000000-0000-4000-8000-000000000014', '82000000-0000-4000-8000-000000000012', 1, 'Delta Level 1', 1);
insert into app.academic_semesters (id, academic_level_id, semester_number, display_title, sort_order) values
  ('82000000-0000-4000-8000-000000000015', '82000000-0000-4000-8000-000000000013', 1, 'Semester 1', 1),
  ('82000000-0000-4000-8000-000000000016', '82000000-0000-4000-8000-000000000014', 1, 'Semester 1', 1);
insert into app.brand_academic_institution_access (brand_id, academic_institution_id, status) values
  ('82000000-0000-4000-8000-000000000001', '82000000-0000-4000-8000-000000000011', 'active'),
  ('82000000-0000-4000-8000-000000000002', '82000000-0000-4000-8000-000000000011', 'active'),
  ('82000000-0000-4000-8000-000000000002', '82000000-0000-4000-8000-000000000012', 'active');

select lives_ok($$insert into app.student_academic_profiles (student_profile_id, brand_id, full_name, email, student_code, academic_institution_id, academic_level_id, academic_semester_id, program_label) values ('82000000-0000-4000-8000-000000000009','82000000-0000-4000-8000-000000000001','Student Fixture','student.fixture@example.test','BUC-001','82000000-0000-4000-8000-000000000011','82000000-0000-4000-8000-000000000013','82000000-0000-4000-8000-000000000015','Medicine')$$, 'An active commercial brand to academic institution relationship permits one profile extension.');
select throws_ok($$insert into app.student_academic_profiles (student_profile_id, brand_id, full_name, email, academic_institution_id, academic_level_id, academic_semester_id) values ('82000000-0000-4000-8000-000000000009','82000000-0000-4000-8000-000000000001','Second Profile','second@example.test','82000000-0000-4000-8000-000000000011','82000000-0000-4000-8000-000000000013','82000000-0000-4000-8000-000000000015')$$, '23505', null, 'A student profile owns at most one academic profile extension.');
select throws_ok($$insert into app.student_academic_profiles (student_profile_id, brand_id, full_name, email, academic_institution_id, academic_level_id, academic_semester_id) values ('82000000-0000-4000-8000-000000000010','82000000-0000-4000-8000-000000000002','Wrong Institution','wrong@example.test','82000000-0000-4000-8000-000000000011','82000000-0000-4000-8000-000000000014','82000000-0000-4000-8000-000000000016')$$, '23503', null, 'A selected level must belong to the selected academic institution.');
select throws_ok($$insert into app.student_academic_profiles (student_profile_id, brand_id, full_name, email, academic_institution_id, academic_level_id, academic_semester_id) values ('82000000-0000-4000-8000-000000000010','82000000-0000-4000-8000-000000000002','Wrong Semester','semester@example.test','82000000-0000-4000-8000-000000000012','82000000-0000-4000-8000-000000000014','82000000-0000-4000-8000-000000000015')$$, '23503', null, 'A selected semester must belong to the selected level.');
select throws_ok($$insert into app.student_academic_profiles (student_profile_id, brand_id, full_name, email, academic_institution_id, academic_level_id, academic_semester_id) values ('82000000-0000-4000-8000-000000000010','82000000-0000-4000-8000-000000000002',' Trimmed ','trim@example.test','82000000-0000-4000-8000-000000000012','82000000-0000-4000-8000-000000000014','82000000-0000-4000-8000-000000000016')$$, '23514', null, 'Names must be nonblank and trimmed.');
update app.brand_academic_institution_access set status = 'inactive' where brand_id = '82000000-0000-4000-8000-000000000002' and academic_institution_id = '82000000-0000-4000-8000-000000000012';
select throws_ok($$insert into app.student_academic_profiles (student_profile_id, brand_id, full_name, email, academic_institution_id, academic_level_id, academic_semester_id) values ('82000000-0000-4000-8000-000000000010','82000000-0000-4000-8000-000000000002','Inactive Access','inactive@example.test','82000000-0000-4000-8000-000000000012','82000000-0000-4000-8000-000000000014','82000000-0000-4000-8000-000000000016')$$, '23514', null, 'Inactive commercial brand access cannot be used for placement.');
select is((select count(*) from information_schema.role_table_grants where table_schema = 'app' and table_name = 'student_academic_profiles' and grantee in ('PUBLIC', 'anon', 'authenticated') and privilege_type in ('SELECT', 'INSERT', 'UPDATE', 'DELETE')), 0::bigint, 'Client roles have no student academic profile table privileges.');
select is((select count(*) from pg_policies where schemaname = 'app' and tablename = 'student_academic_profiles'), 0::bigint, 'The private extension adds no RLS policy.');
select is((select count(*) from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'app' and p.proname = 'enforce_student_academic_profile_brand_access' and p.prosecdef), 0::bigint, 'The access-enforcement trigger is not SECURITY DEFINER.');
select is((select count(*) from pg_trigger t join pg_class c on c.oid = t.tgrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'app' and c.relname = 'student_academic_profiles' and not t.tgisinternal), 2::bigint, 'The extension has context and updated-at triggers.');
select is((select count(*) from app.educational_brands where code in ('buc', 'delta')), 0::bigint, 'BUC and Delta remain academic institutions rather than commercial brands.');
select is((select count(*) from app.student_academic_profiles where email = 'student.fixture@example.test'), 1::bigint, 'The private extension holds the source email only inside app.');

select * from finish();
rollback;
