begin;
select plan(7);

select has_column('app','brand_courses','catalogue_presentation','BrandCourse stores commercial presentation mode.');
select ok((select column_default from information_schema.columns where table_schema='app' and table_name='brand_courses' and column_name='catalogue_presentation') like '%module_based%','BrandCourse presentation defaults to module_based.');
select ok((select count(*) from information_schema.check_constraints where constraint_name='brand_courses_catalogue_presentation_check')=1,'BrandCourse presentation check exists.');
select ok((select count(*) from pg_indexes where schemaname='app' and tablename='brand_courses' and indexname='brand_courses_catalogue_presentation_idx')=1,'BrandCourse presentation index exists.');

insert into app.educational_brands(id,code,name,slug)
values ('76000000-0000-4000-8000-000000000001','fixture-brand','Fixture Brand','fixture-brand');

insert into app.brand_courses(id,brand_id,code,title,classification)
values ('76000000-0000-4000-8000-000000000011','76000000-0000-4000-8000-000000000001','FIX-MOD','Module Based','standalone');

select is((select catalogue_presentation from app.brand_courses where id='76000000-0000-4000-8000-000000000011'),'module_based','Default course presentation is module_based.');

update app.brand_courses
set catalogue_presentation='subject_based'
where id='76000000-0000-4000-8000-000000000011';

select is((select catalogue_presentation from app.brand_courses where id='76000000-0000-4000-8000-000000000011'),'subject_based','Subject-based commercial packaging is accepted.');
select throws_ok($$update app.brand_courses set catalogue_presentation='invalid' where id='76000000-0000-4000-8000-000000000011'$$,'23514',null,'Invalid course presentation is rejected.');

select * from finish();
rollback;
