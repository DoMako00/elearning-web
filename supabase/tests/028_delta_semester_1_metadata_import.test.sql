begin;
select plan(22);

select is((select array_agg(code order by code) from app.educational_brands),array['elite','medway','nexus']::text[],'Controlled commercial brands are Elite, Medway, and Nexus.');
select is((select array_agg(code::text order by code) from app.academic_institutions),array['buc','delta']::text[],'Controlled academic institutions are BUC and Delta.');
select is((select count(*) from app.educational_brands where code in ('buc','delta')),0::bigint,'BUC and Delta are not commercial brands.');
select is((select count(*) from app.brand_academic_institution_access a join app.educational_brands b on b.id=a.brand_id join app.academic_institutions i on i.id=a.academic_institution_id where b.code in ('medway','elite','nexus') and i.code in ('buc','delta') and a.status='active'),6::bigint,'All three brands can build against BUC and Delta catalogues.');

select is((select count(*) from app.academic_modules m join app.academic_semesters s on s.id=m.academic_semester_id join app.academic_levels l on l.id=s.academic_level_id join app.academic_institutions i on i.id=l.academic_institution_id where i.code='buc' and l.level_number=1),14::bigint,'BUC Level 1 keeps the fourteen controlled modules.');
select is((select count(*) from app.academic_modules m join app.academic_semesters s on s.id=m.academic_semester_id join app.academic_levels l on l.id=s.academic_level_id join app.academic_institutions i on i.id=l.academic_institution_id where i.code='delta' and l.level_number=1 and s.semester_number=1 and m.code in ('DELTA-ENG1','DELTA-IT')),2::bigint,'Delta Level 1 Semester 1 has English 1 and IT.');
select is((select count(*) from app.academic_modules m join app.academic_semesters s on s.id=m.academic_semester_id join app.academic_levels l on l.id=s.academic_level_id join app.academic_institutions i on i.id=l.academic_institution_id where i.code='delta' and s.semester_number<>1),0::bigint,'Delta has no out-of-scope semester module.');
select is((select count(*) from app.brand_courses),0::bigint,'Controlled catalogue import creates no commercial courses.');
select is((select count(*) from app.course_chapters)+ (select count(*) from app.course_lessons)+ (select count(*) from app.lesson_resources)+ (select count(*) from app.course_releases),0::bigint,'Controlled catalogue import creates no course delivery structure.');

select is((select count(*) from app.academic_module_resources r join app.academic_modules m on m.id=r.academic_module_id where m.code in ('DELTA-ENG1','DELTA-IT') and r.resource_key like 'delta-s1-%'),28::bigint,'Prompt 028 imports 28 Delta Semester 1 resource metadata rows.');
select is((select count(*) from app.academic_module_resources r join app.academic_modules m on m.id=r.academic_module_id where m.code='DELTA-ENG1' and r.resource_key like 'delta-s1-eng1-%'),17::bigint,'Delta English 1 has 17 imported metadata rows.');
select is((select count(*) from app.academic_module_resources r join app.academic_modules m on m.id=r.academic_module_id where m.code='DELTA-IT' and r.resource_key like 'delta-s1-it-%'),11::bigint,'Delta IT has 11 imported metadata rows.');
select is((select count(*) from app.academic_module_resources r join app.academic_modules m on m.id=r.academic_module_id join app.academic_semesters s on s.id=m.academic_semester_id join app.academic_levels l on l.id=s.academic_level_id join app.academic_institutions i on i.id=l.academic_institution_id where r.resource_key like 'delta-s1-%' and i.code='delta' and l.level_number=1 and s.semester_number=1),28::bigint,'Every Prompt 028 resource maps to Delta Level 1 Semester 1.');

select is((select count(*) from app.academic_module_resources where resource_key like 'delta-s1-%' and source_provider='google_drive'),28::bigint,'Prompt 028 metadata is source-provider marked as Google Drive.');
select is((select count(*) from app.academic_module_resources where resource_key like 'delta-s1-%' and storage_object_path is not null),0::bigint,'Prompt 028 adds no storage object path.');
select is((select count(*) from app.academic_module_resources where resource_key like 'delta-s1-%' and publication_state <> 'not_published'),0::bigint,'Prompt 028 keeps every imported resource not published.');
select is((select count(*) from app.academic_module_resources where resource_key like 'delta-s1-%' and not approval_required),0::bigint,'Prompt 028 keeps approval required for every resource.');
select is((select count(*) from app.academic_module_resources where resource_key like 'delta-s1-%' and student_publish_default),0::bigint,'Prompt 028 adds no default student-publishable resource.');
select is((select count(*) from app.academic_module_resources where resource_key like 'delta-s1-%' and resource_type in ('video','recording') and approval_state <> 'pending_review'),0::bigint,'Delta audio/video resources remain pending review.');
select is((select count(*) from app.academic_module_resources where resource_key like 'delta-s1-%' and resource_type='slide_deck'),6::bigint,'Delta lecture decks are classified as slide decks.');
select is((select count(*) from app.academic_module_resources where resource_key like 'delta-s1-%' and source_relative_path not like 'Delta / Semester 1 /%'),0::bigint,'Delta source paths are explicitly namespaced.');
select is((select count(*) from information_schema.role_table_grants where table_schema='app' and table_name in ('academic_institutions','brand_academic_institution_access','academic_module_resources') and grantee in ('PUBLIC','anon','authenticated') and privilege_type in ('INSERT','UPDATE','DELETE','SELECT')),0::bigint,'Client roles have no direct catalogue/resource table privileges.');

select * from finish();
rollback;
