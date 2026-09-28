begin;
select plan(21);

select is((select count(*) from information_schema.tables where table_schema='app' and table_name in ('academic_institutions','brand_academic_institution_access')),2::bigint,'M028 creates academic institution scope tables.');
select is((select count(*) from information_schema.columns where table_schema='app' and table_name='academic_levels' and column_name='academic_institution_id'),1::bigint,'AcademicLevel can be scoped to an academic institution.');
select is((select count(*) from information_schema.columns where table_schema='app' and table_name='brand_courses' and column_name='academic_institution_id'),1::bigint,'BrandCourse records the selected academic institution.');
select is((select count(*) from app.academic_institutions),0::bigint,'M028 creates no academic institution rows without seed.');
select is((select count(*) from app.brand_academic_institution_access),0::bigint,'M028 creates no brand-to-institution access rows without seed.');

insert into app.academic_institutions (id, code, display_name, slug) values
  ('79000000-0000-4000-8000-000000000001','buc-fixture','BUC Fixture','buc-fixture'),
  ('79000000-0000-4000-8000-000000000002','delta-fixture','Delta Fixture','delta-fixture');

select throws_ok($$insert into app.academic_institutions (code, display_name, slug) values ('buc-fixture','Duplicate','buc-fixture-2')$$,'23505',null,'Academic institution code is unique.');
select throws_ok($$insert into app.academic_institutions (code, display_name, slug) values ('other-fixture','Duplicate','buc-fixture')$$,'23505',null,'Academic institution slug is unique.');
select throws_ok($$insert into app.academic_institutions (code, display_name, slug, status) values ('bad-fixture','Bad','bad-fixture','paused')$$,'23514',null,'Academic institution status is constrained.');

insert into app.academic_levels (id, academic_institution_id, level_number, display_title, sort_order) values
  ('79000000-0000-4000-8000-000000000003','79000000-0000-4000-8000-000000000001',1,'BUC Level 1',1),
  ('79000000-0000-4000-8000-000000000004','79000000-0000-4000-8000-000000000002',1,'Delta Level 1',1);

select lives_ok($$select 1 from app.academic_levels where level_number=1 group by academic_institution_id$$,'The same level number can exist under different academic institutions.');
select throws_ok($$insert into app.academic_levels (academic_institution_id, level_number, display_title, sort_order) values ('79000000-0000-4000-8000-000000000001',1,'Duplicate BUC Level 1',2)$$,'23505',null,'Level number remains unique within one academic institution.');

insert into app.educational_brands (id, code, name, slug) values
  ('79000000-0000-4000-8000-000000000005','medway-fixture','Medway Fixture','medway-fixture'),
  ('79000000-0000-4000-8000-000000000006','nexus-fixture','Nexus Fixture','nexus-fixture');

insert into app.brand_academic_institution_access (id, brand_id, academic_institution_id) values
  ('79000000-0000-4000-8000-000000000007','79000000-0000-4000-8000-000000000005','79000000-0000-4000-8000-000000000001'),
  ('79000000-0000-4000-8000-000000000008','79000000-0000-4000-8000-000000000006','79000000-0000-4000-8000-000000000002');

select throws_ok($$insert into app.brand_academic_institution_access (brand_id, academic_institution_id) values ('79000000-0000-4000-8000-000000000005','79000000-0000-4000-8000-000000000001')$$,'23505',null,'Brand-to-institution access is unique.');
select throws_ok($$insert into app.brand_academic_institution_access (brand_id, academic_institution_id, status) values ('79000000-0000-4000-8000-000000000005','79000000-0000-4000-8000-000000000002','paused')$$,'23514',null,'Brand-to-institution access status is constrained.');

insert into app.academic_semesters (id, academic_level_id, semester_number, display_title, sort_order) values
  ('79000000-0000-4000-8000-000000000009','79000000-0000-4000-8000-000000000003',1,'Semester 1',1);
insert into app.academic_modules (id, academic_semester_id, code, source_display_label, sort_order) values
  ('79000000-0000-4000-8000-000000000010','79000000-0000-4000-8000-000000000009','FIX-101','Fixture Module',1);

select throws_ok($$insert into app.brand_courses (brand_id, academic_module_id, code, title, classification) values ('79000000-0000-4000-8000-000000000005','79000000-0000-4000-8000-000000000010','BAD-101','Bad Course','academic_module_offering')$$,'23514',null,'Academic module offerings must select an academic institution.');
select lives_ok($$insert into app.brand_courses (brand_id, academic_institution_id, academic_module_id, code, title, classification) values ('79000000-0000-4000-8000-000000000005','79000000-0000-4000-8000-000000000001','79000000-0000-4000-8000-000000000010','OK-101','Good Course','academic_module_offering')$$,'Academic module offering with selected institution is accepted.');

select is((with f as (select c.conrelid, c.conkey from pg_constraint c join pg_class rel on rel.oid=c.conrelid join pg_namespace ns on ns.oid=rel.relnamespace where c.contype='f' and ns.nspname='app' and rel.relname in ('academic_institutions','academic_levels','brand_courses','brand_academic_institution_access')), u as (select f.* from f where not exists (select 1 from pg_index i where i.indrelid=f.conrelid and i.indpred is null and (select array_agg(k.attnum order by k.ordinality) from unnest(i.indkey) with ordinality k(attnum,ordinality) where k.ordinality <= array_length(f.conkey,1))=f.conkey)) select count(*) from u),0::bigint,'Every M028 foreign key has a complete non-partial ordered child index.');
select is((select count(*) from pg_trigger t join pg_class c on c.oid=t.tgrelid join pg_namespace n on n.oid=c.relnamespace join pg_proc p on p.oid=t.tgfoid where n.nspname='app' and not t.tgisinternal and c.relname in ('academic_institutions','brand_academic_institution_access') and p.oid='app.set_updated_at()'::regprocedure),2::bigint,'M028 mutable tables use app.set_updated_at.');
select is((select count(*) from information_schema.role_table_grants where table_schema='app' and table_name in ('academic_institutions','brand_academic_institution_access') and grantee in ('PUBLIC','anon','authenticated') and privilege_type in ('INSERT','UPDATE','DELETE','SELECT')),0::bigint,'Client roles have no M028 table privileges.');
select is((select count(*) from pg_policies where schemaname='app' and tablename in ('academic_institutions','brand_academic_institution_access')),0::bigint,'M028 adds no RLS policies.');
select is((select count(*) from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='app' and p.prosecdef),0::bigint,'M028 adds no SECURITY DEFINER function.');
select is((select count(*) from app.educational_brands where code in ('buc','delta')),0::bigint,'BUC and Delta remain absent from commercial brands.');
select is((select count(*) from app.brand_courses where academic_institution_id is null and classification='academic_module_offering'),0::bigint,'No academic offering fixture bypasses institution selection.');

select * from finish();
rollback;
