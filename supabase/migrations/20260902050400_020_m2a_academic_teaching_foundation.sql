begin;

-- Complete the historical nullable M1 FK index so the chain has general
-- child-side coverage; the pre-existing partial index remains valid for its
-- filtered query workload.
create index platform_admin_role_assignments_assigned_by_admin_profile_id_complete_idx
  on app.platform_admin_role_assignments (assigned_by_admin_profile_id);

-- M2A keeps shared BUC academic reference separate from commercial brand
-- offerings. source_display_label is bounded folder-label evidence only; it is
-- not a reviewed expanded official module title.
create table app.academic_levels (
  id uuid not null default gen_random_uuid(),
  level_number integer not null,
  display_title varchar(80) not null,
  sort_order integer not null,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  version bigint not null default 1,
  constraint academic_levels_pkey primary key (id),
  constraint academic_levels_level_number_key unique (level_number),
  constraint academic_levels_level_number_positive_check check (level_number > 0),
  constraint academic_levels_display_title_trimmed_check check (display_title = btrim(display_title) and display_title <> ''),
  constraint academic_levels_sort_order_positive_check check (sort_order > 0),
  constraint academic_levels_status_check check (status in ('active', 'retired')),
  constraint academic_levels_version_check check (version >= 1)
);

create table app.academic_semesters (
  id uuid not null default gen_random_uuid(),
  academic_level_id uuid not null,
  semester_number integer not null,
  display_title varchar(80) not null,
  sort_order integer not null,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  version bigint not null default 1,
  constraint academic_semesters_pkey primary key (id),
  constraint academic_semesters_level_id_fkey foreign key (academic_level_id) references app.academic_levels (id) on delete restrict on update restrict,
  constraint academic_semesters_level_number_key unique (academic_level_id, semester_number),
  constraint academic_semesters_number_positive_check check (semester_number > 0),
  constraint academic_semesters_display_title_trimmed_check check (display_title = btrim(display_title) and display_title <> ''),
  constraint academic_semesters_sort_order_positive_check check (sort_order > 0),
  constraint academic_semesters_status_check check (status in ('active', 'retired')),
  constraint academic_semesters_version_check check (version >= 1)
);
create index academic_semesters_academic_level_id_idx on app.academic_semesters (academic_level_id);

create table app.academic_modules (
  id uuid not null default gen_random_uuid(),
  academic_semester_id uuid not null,
  code varchar(32) not null,
  normalized_code varchar(32) generated always as (upper(btrim(code))) stored,
  source_display_label varchar(160) not null,
  sort_order integer not null,
  review_status text not null default 'unreviewed',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  version bigint not null default 1,
  constraint academic_modules_pkey primary key (id),
  constraint academic_modules_semester_id_fkey foreign key (academic_semester_id) references app.academic_semesters (id) on delete restrict on update restrict,
  constraint academic_modules_normalized_code_key unique (normalized_code),
  constraint academic_modules_code_trimmed_check check (code = btrim(code) and code <> ''),
  constraint academic_modules_source_display_label_trimmed_check check (source_display_label = btrim(source_display_label) and source_display_label <> ''),
  constraint academic_modules_sort_order_positive_check check (sort_order > 0),
  constraint academic_modules_review_status_check check (review_status in ('unreviewed', 'approved', 'blocked', 'retired')),
  constraint academic_modules_version_check check (version >= 1)
);
comment on column app.academic_modules.source_display_label is 'Bounded Drive-derived folder-label evidence; not a reviewed expanded official module title.';
create index academic_modules_academic_semester_id_idx on app.academic_modules (academic_semester_id);

create table app.academic_module_aliases (
  id uuid not null default gen_random_uuid(),
  academic_module_id uuid not null,
  alias_value varchar(80) not null,
  normalized_alias varchar(80) generated always as (upper(btrim(alias_value))) stored,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  version bigint not null default 1,
  constraint academic_module_aliases_pkey primary key (id),
  constraint academic_module_aliases_module_id_fkey foreign key (academic_module_id) references app.academic_modules (id) on delete restrict on update restrict,
  constraint academic_module_aliases_normalized_alias_key unique (normalized_alias),
  constraint academic_module_aliases_value_trimmed_check check (alias_value = btrim(alias_value) and alias_value <> ''),
  constraint academic_module_aliases_status_check check (status in ('active', 'retired')),
  constraint academic_module_aliases_version_check check (version >= 1)
);
create index academic_module_aliases_academic_module_id_idx on app.academic_module_aliases (academic_module_id);

create table app.instructors (
  id uuid not null default gen_random_uuid(),
  code varchar(32) not null,
  display_name varchar(160) not null,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  version bigint not null default 1,
  constraint instructors_pkey primary key (id),
  constraint instructors_code_key unique (code),
  constraint instructors_code_trimmed_check check (code = btrim(code) and code <> ''),
  constraint instructors_display_name_trimmed_check check (display_name = btrim(display_name) and display_name <> ''),
  constraint instructors_status_check check (status in ('active', 'inactive', 'archived')),
  constraint instructors_version_check check (version >= 1)
);

create table app.instructor_brand_assignments (
  id uuid not null default gen_random_uuid(),
  instructor_id uuid not null,
  brand_id uuid not null,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  version bigint not null default 1,
  constraint instructor_brand_assignments_pkey primary key (id),
  constraint instructor_brand_assignments_instructor_id_fkey foreign key (instructor_id) references app.instructors (id) on delete restrict on update restrict,
  constraint instructor_brand_assignments_brand_id_fkey foreign key (brand_id) references app.educational_brands (id) on delete restrict on update restrict,
  constraint instructor_brand_assignments_instructor_brand_key unique (instructor_id, brand_id),
  constraint instructor_brand_assignments_identity_brand_key unique (id, brand_id),
  constraint instructor_brand_assignments_status_check check (status in ('active', 'inactive')),
  constraint instructor_brand_assignments_version_check check (version >= 1)
);
create index instructor_brand_assignments_instructor_id_idx on app.instructor_brand_assignments (instructor_id);
create index instructor_brand_assignments_brand_id_idx on app.instructor_brand_assignments (brand_id);

create table app.brand_courses (
  id uuid not null default gen_random_uuid(),
  brand_id uuid not null,
  academic_module_id uuid null,
  code varchar(48) not null,
  title varchar(200) not null,
  classification text not null,
  status text not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  version bigint not null default 1,
  constraint brand_courses_pkey primary key (id),
  constraint brand_courses_brand_id_fkey foreign key (brand_id) references app.educational_brands (id) on delete restrict on update restrict,
  constraint brand_courses_academic_module_id_fkey foreign key (academic_module_id) references app.academic_modules (id) on delete restrict on update restrict,
  constraint brand_courses_brand_code_key unique (brand_id, code),
  constraint brand_courses_identity_brand_key unique (id, brand_id),
  constraint brand_courses_code_trimmed_check check (code = btrim(code) and code <> ''),
  constraint brand_courses_title_trimmed_check check (title = btrim(title) and title <> ''),
  constraint brand_courses_classification_check check ((classification = 'academic_module_offering' and academic_module_id is not null) or (classification = 'standalone' and academic_module_id is null)),
  constraint brand_courses_status_check check (status in ('draft', 'published', 'archived')),
  constraint brand_courses_version_check check (version >= 1)
);
create index brand_courses_brand_id_idx on app.brand_courses (brand_id);
create index brand_courses_academic_module_id_idx on app.brand_courses (academic_module_id);

create table app.course_instructor_assignments (
  id uuid not null default gen_random_uuid(),
  brand_id uuid not null,
  course_id uuid not null,
  instructor_brand_assignment_id uuid not null,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  version bigint not null default 1,
  constraint course_instructor_assignments_pkey primary key (id),
  constraint course_instructor_assignments_course_brand_fkey foreign key (course_id, brand_id) references app.brand_courses (id, brand_id) on delete restrict on update restrict,
  constraint course_instructor_assignments_instructor_brand_fkey foreign key (instructor_brand_assignment_id, brand_id) references app.instructor_brand_assignments (id, brand_id) on delete restrict on update restrict,
  constraint course_instructor_assignments_course_instructor_key unique (course_id, instructor_brand_assignment_id),
  constraint course_instructor_assignments_status_check check (status in ('active', 'inactive')),
  constraint course_instructor_assignments_version_check check (version >= 1)
);
create index course_instructor_assignments_course_brand_idx on app.course_instructor_assignments (course_id, brand_id);
create index course_instructor_assignments_instructor_brand_idx on app.course_instructor_assignments (instructor_brand_assignment_id, brand_id);

create trigger academic_levels_set_updated_at before update on app.academic_levels for each row execute function app.set_updated_at();
create trigger academic_semesters_set_updated_at before update on app.academic_semesters for each row execute function app.set_updated_at();
create trigger academic_modules_set_updated_at before update on app.academic_modules for each row execute function app.set_updated_at();
create trigger academic_module_aliases_set_updated_at before update on app.academic_module_aliases for each row execute function app.set_updated_at();
create trigger instructors_set_updated_at before update on app.instructors for each row execute function app.set_updated_at();
create trigger instructor_brand_assignments_set_updated_at before update on app.instructor_brand_assignments for each row execute function app.set_updated_at();
create trigger brand_courses_set_updated_at before update on app.brand_courses for each row execute function app.set_updated_at();
create trigger course_instructor_assignments_set_updated_at before update on app.course_instructor_assignments for each row execute function app.set_updated_at();

revoke all on table app.academic_levels, app.academic_semesters, app.academic_modules, app.academic_module_aliases, app.instructors, app.instructor_brand_assignments, app.brand_courses, app.course_instructor_assignments from public;
revoke all on table app.academic_levels, app.academic_semesters, app.academic_modules, app.academic_module_aliases, app.instructors, app.instructor_brand_assignments, app.brand_courses, app.course_instructor_assignments from anon;
revoke all on table app.academic_levels, app.academic_semesters, app.academic_modules, app.academic_module_aliases, app.instructors, app.instructor_brand_assignments, app.brand_courses, app.course_instructor_assignments from authenticated;

commit;
