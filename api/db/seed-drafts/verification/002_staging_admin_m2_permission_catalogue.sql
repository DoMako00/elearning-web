-- Prompt 56B controlled staging-only Admin M2 permission catalogue.
-- UUIDv5 namespace: 6ba7b810-9dad-11d1-80b4-00c04fd430c8 (DNS).
-- UUIDv5 input: elearning.admin.permission.v1/<permission-code>.

insert into app.admin_permissions (id, code, category, description, status)
select 'e291ccf1-a18e-5fab-9966-8b0bcedf517d', 'admin.instructors.create', 'instructors', 'Create global instructors.', 'active'
where not exists (
  select 1 from app.admin_permissions
  where id = 'e291ccf1-a18e-5fab-9966-8b0bcedf517d'
     or code = 'admin.instructors.create'
);

insert into app.admin_permissions (id, code, category, description, status)
select 'ea97a4ad-89dc-5edc-b3ba-b50ab5417ce5', 'admin.instructors.update', 'instructors', 'Update global instructors.', 'active'
where not exists (
  select 1 from app.admin_permissions
  where id = 'ea97a4ad-89dc-5edc-b3ba-b50ab5417ce5'
     or code = 'admin.instructors.update'
);

insert into app.admin_permissions (id, code, category, description, status)
select 'f108bfdf-5cf7-50dd-bd15-a3a792580be4', 'admin.brand_instructors.assign', 'brand_instructors', 'Assign global instructors to a brand.', 'active'
where not exists (
  select 1 from app.admin_permissions
  where id = 'f108bfdf-5cf7-50dd-bd15-a3a792580be4'
     or code = 'admin.brand_instructors.assign'
);

insert into app.admin_permissions (id, code, category, description, status)
select '126b7c16-95ae-5058-9c2b-8a53631fd6f0', 'admin.brand_instructors.update', 'brand_instructors', 'Update brand instructor associations.', 'active'
where not exists (
  select 1 from app.admin_permissions
  where id = '126b7c16-95ae-5058-9c2b-8a53631fd6f0'
     or code = 'admin.brand_instructors.update'
);

insert into app.admin_permissions (id, code, category, description, status)
select '09cc729c-a607-5c64-b591-fb4ab640f3bf', 'admin.brand_courses.create', 'brand_courses', 'Create brand courses.', 'active'
where not exists (
  select 1 from app.admin_permissions
  where id = '09cc729c-a607-5c64-b591-fb4ab640f3bf'
     or code = 'admin.brand_courses.create'
);

insert into app.admin_permissions (id, code, category, description, status)
select 'cc76a74a-3ec8-5281-a729-33cd712aec0e', 'admin.brand_courses.update', 'brand_courses', 'Update brand courses.', 'active'
where not exists (
  select 1 from app.admin_permissions
  where id = 'cc76a74a-3ec8-5281-a729-33cd712aec0e'
     or code = 'admin.brand_courses.update'
);

insert into app.admin_permissions (id, code, category, description, status)
select '98573182-688b-5c32-9304-e886997b8e3b', 'admin.course_instructors.assign', 'course_instructors', 'Assign instructors to brand courses.', 'active'
where not exists (
  select 1 from app.admin_permissions
  where id = '98573182-688b-5c32-9304-e886997b8e3b'
     or code = 'admin.course_instructors.assign'
);

insert into app.admin_permissions (id, code, category, description, status)
select '93947542-fa93-50bf-8db1-2d068441bae2', 'admin.course_instructors.update', 'course_instructors', 'Update course instructor assignments.', 'active'
where not exists (
  select 1 from app.admin_permissions
  where id = '93947542-fa93-50bf-8db1-2d068441bae2'
     or code = 'admin.course_instructors.update'
);
