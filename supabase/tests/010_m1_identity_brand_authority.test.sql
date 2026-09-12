begin;

select plan(39);

select is((select count(*) from information_schema.tables where table_schema = 'app' and table_name in ('educational_brands','app_users','brand_memberships','student_profiles','admin_profiles','admin_permissions','admin_roles','admin_role_permissions','platform_admin_role_assignments')), 9::bigint, 'Exactly nine M1 tables exist.');
select is((select count(*) from information_schema.tables where table_schema = 'app' and table_name in ('educational_brands','app_users','brand_memberships','student_profiles','admin_profiles','admin_permissions','admin_roles','admin_role_permissions','platform_admin_role_assignments')), 9::bigint, 'The canonical nine M1 tables exist without constraining later app migrations.');
select is((select count(*) from app.educational_brands), 0::bigint, 'No brand is seeded.');
select is((select count(*) from app.app_users), 0::bigint, 'No AppUser is seeded.');
select is((select count(*) from app.platform_admin_role_assignments), 0::bigint, 'No Platform Owner assignment is seeded.');
select is((select count(*) from app.admin_roles), 0::bigint, 'No role is seeded.');
select is((select count(*) from app.admin_permissions), 0::bigint, 'No permission is seeded.');
select is((select count(*) from app.brand_memberships), 0::bigint, 'No membership is seeded.');
select is((select count(*) from app.student_profiles), 0::bigint, 'No StudentProfile is seeded.');
select is((select count(*) from app.admin_profiles), 0::bigint, 'No AdminProfile is seeded.');
select is((select count(*) from app.admin_role_permissions), 0::bigint, 'No role-permission relation is seeded.');
select is((select count(*) from pg_policies where schemaname = 'app'), 0::bigint, 'No RLS policy exists for private app tables.');
select ok(not has_table_privilege('public', 'app.app_users', 'select'), 'PUBLIC has no app table privilege.');
select ok(not has_table_privilege('anon', 'app.app_users', 'select'), 'anon has no app table privilege.');
select ok(not has_table_privilege('authenticated', 'app.app_users', 'select'), 'authenticated has no app table privilege.');
select is((select count(*) from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='app' and p.prosecdef), 0::bigint, 'No app function is SECURITY DEFINER.');
select is((select count(*) from (select expected.table_name from (values ('educational_brands'),('app_users'),('brand_memberships'),('student_profiles'),('admin_profiles'),('admin_permissions'),('admin_roles'),('platform_admin_role_assignments')) as expected(table_name) left join pg_class c on c.relname = expected.table_name left join pg_namespace n on n.oid = c.relnamespace and n.nspname = 'app' left join pg_trigger t on t.tgrelid = c.oid and not t.tgisinternal and t.tgfoid = 'app.set_updated_at()'::regprocedure where n.nspname = 'app' group by expected.table_name having count(t.oid) = 1) as m1_triggers), 8::bigint, 'Each mutable M1 table has exactly one app.set_updated_at trigger.');
select is((select count(*) from information_schema.columns where table_schema='app' and table_name='app_users' and column_name='email'), 0::bigint, 'AppUser has no copied email column.');
select is((select count(*) from information_schema.columns where table_schema='app' and table_name='admin_profiles' and column_name='brand_id'), 0::bigint, 'AdminProfile has no brand authority column.');
select is((select count(*) from information_schema.columns where table_schema='app' and table_name='platform_admin_role_assignments' and column_name='brand_id'), 0::bigint, 'Platform assignment has no brand column.');
select is((select string_agg(a.attname, ',' order by k.ordinality) from pg_index i cross join unnest(i.indkey) with ordinality k(attnum, ordinality) join pg_attribute a on a.attrelid=i.indrelid and a.attnum=k.attnum where i.indexrelid='app.student_profiles_membership_identity_user_brand_idx'::regclass), 'brand_membership_id,app_user_id,brand_id', 'StudentProfile composite FK index has the required leading columns.');
select is((select string_agg(a.attname, ',' order by k.ordinality) from pg_index i cross join unnest(i.indkey) with ordinality k(attnum, ordinality) join pg_attribute a on a.attrelid=i.indrelid and a.attnum=k.attnum where i.indexrelid='app.platform_admin_role_assignments_profile_id_idx'::regclass), 'admin_profile_id', 'Platform assignment profile FK has a complete full child index.');
select is((select count(*) from information_schema.columns where table_schema='app' and table_name='app_users' and column_name in ('email','password','phone','brand_id','role','access_status','enrollment_status','device_id')), 0::bigint, 'AppUser contains no copied identity, brand, authority, access, enrollment, or device columns.');
select is((with fk as (select c.conrelid, c.conkey from pg_constraint c join pg_namespace n on n.oid=c.connamespace where c.contype='f' and n.nspname='app'), uncovered as (select 1 from fk f where not exists (select 1 from pg_index i where i.indrelid=f.conrelid and i.indisvalid and i.indisready and ((i.indpred is null) or pg_get_expr(i.indpred,i.indrelid) = '(assigned_by_admin_profile_id IS NOT NULL)') and array(select k.attnum::smallint from unnest(i.indkey) with ordinality k(attnum, ordinality) where k.ordinality <= array_length(f.conkey,1) order by k.ordinality) = f.conkey)) select count(*) from uncovered), 0::bigint, 'Every M1 foreign key has a complete ordered child-side index.');
select is((select count(*) from (values ('public'),('anon'),('authenticated')) r(role_name) cross join (select table_name from information_schema.tables where table_schema='app' and table_type='BASE TABLE') t cross join (values ('select'),('insert'),('update'),('delete')) p(privilege_name) where has_table_privilege(r.role_name, format('app.%I',t.table_name), p.privilege_name)), 0::bigint, 'PUBLIC, anon, and authenticated have no DML privilege on any M1 table.');

insert into app.educational_brands (code,name,slug) values ('test-medway','Test Medway','test-medway'), ('test-elite','Test Elite','test-elite');
insert into app.app_users (auth_user_id,status) values (gen_random_uuid(),'active');
insert into app.brand_memberships (app_user_id,brand_id,status)
select u.id,b.id,'active' from app.app_users u cross join app.educational_brands b;

select is((select count(*) from app.brand_memberships), 2::bigint, 'One AppUser can have independent active memberships in two brands.');
select throws_ok($$insert into app.brand_memberships (app_user_id,brand_id,status) select u.id,b.id,'active' from app.app_users u cross join app.educational_brands b limit 1$$, '23505', null, 'Duplicate active membership is rejected.');
select throws_ok($$insert into app.brand_memberships (app_user_id,brand_id,status) select u.id,b.id,'invalid' from app.app_users u cross join app.educational_brands b limit 1$$, '23514', null, 'Invalid membership status is rejected.');
select throws_ok($$insert into app.brand_memberships (app_user_id,brand_id,status,valid_from,valid_until) select u.id,b.id,'active',now(),now() from app.app_users u cross join app.educational_brands b limit 1$$, '23514', null, 'Invalid membership validity window is rejected.');
insert into app.brand_memberships (app_user_id,brand_id,status) select u.id,b.id,'ended' from app.app_users u cross join app.educational_brands b limit 1;
select is((select count(*) from app.brand_memberships where status='ended'), 1::bigint, 'Historical ended membership may coexist.');

insert into app.student_profiles (brand_membership_id,app_user_id,brand_id,status)
select m.id,m.app_user_id,m.brand_id,'active' from app.brand_memberships m where m.status='active';
select is((select count(*) from app.student_profiles), 2::bigint, 'One AppUser can have one StudentProfile in each brand.');
select throws_ok($$insert into app.student_profiles (brand_membership_id,app_user_id,brand_id,status) select m.id,m.app_user_id,m.brand_id,'active' from app.brand_memberships m where m.status='active' limit 1$$, '23505', null, 'Second profile in one user-brand is rejected.');
insert into app.app_users (auth_user_id,status) values (gen_random_uuid(),'active');
select throws_ok($$insert into app.student_profiles (brand_membership_id,app_user_id,brand_id,status) select m.id,u.id,b.id,'active' from app.brand_memberships m cross join app.app_users u cross join app.educational_brands b where m.status='active' and u.id <> m.app_user_id and b.id <> m.brand_id limit 1$$, '23503', null, 'Profile membership and direct brand must match.');

insert into app.admin_profiles (app_user_id,status) select id,'active' from app.app_users order by created_at limit 1;
insert into app.admin_roles (code,name,assignment_scope) values ('platform_owner','Platform Owner','platform');
insert into app.admin_permissions (code,description) values ('admin.overview.read','test permission');
insert into app.admin_role_permissions (admin_role_id,admin_permission_id) select r.id,p.id from app.admin_roles r cross join app.admin_permissions p;
insert into app.platform_admin_role_assignments (admin_profile_id,admin_role_id,status) select ap.id,r.id,'active' from app.admin_profiles ap cross join app.admin_roles r;
select is((select count(*) from app.platform_admin_role_assignments), 1::bigint, 'Platform assignment capability accepts a platform role.');
select throws_ok($$insert into app.platform_admin_role_assignments (admin_profile_id,admin_role_id,status) select ap.id,r.id,'active' from app.admin_profiles ap cross join app.admin_roles r$$, '23505', null, 'Duplicate active profile-role assignment is rejected.');
select throws_ok($$insert into app.admin_permissions (code,description) values ('subscription.read','forbidden')$$, '23514', null, 'Unprefixed permission code is rejected.');
select throws_ok($$insert into app.admin_roles (code,name,assignment_scope) values ('invalid','Invalid','brand')$$, '23514', null, 'Non-platform role scope is rejected.');

update app.educational_brands set name='Test Medway Updated', version=999 where code='test-medway';
select is((select version from app.educational_brands where code='test-medway'), 2::bigint, 'Update trigger owns and increments version once.');
select ok((select updated_at >= created_at from app.educational_brands where code='test-medway'), 'Update trigger supplies server authored updated_at.');

select * from finish();
rollback;
