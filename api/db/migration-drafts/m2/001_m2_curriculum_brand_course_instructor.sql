/*
 * ============================================================================
 * PROMPT 44 — M2 DRAFT ONLY / NOT AN APPROVED OR APPLIED MIGRATION
 * ============================================================================
 *
 * Prerequisite: the reviewed M1 private app schema, including
 * app.educational_brands and app.set_updated_at(), exists in the target only
 * after a separately approved migration phase.
 *
 * - Do not apply this file without explicit migration-application approval.
 * - This draft contains structures only and no data rows.
 * - No RLS, policies, grants, Data API exposure, or public-schema objects are
 *   defined here.
 * - The app schema remains private and backend-mediated.
 * - No legacy platform identifiers are active M2 identifiers.
 * - Academic reference data does not create enrollment, subscription, payment,
 *   or protected-content access.
 * - The PDM/PDM-like source code around 1105 remains unverified and is not
 *   represented by a row in this draft.
 * ============================================================================
 */

create table app.academic_levels (
  id uuid primary key default gen_random_uuid(),
  level_number integer not null,
  display_name text not null,
  sort_order integer not null,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint academic_levels_level_number_key unique (level_number),
  constraint academic_levels_sort_order_key unique (sort_order),
  constraint academic_levels_level_number_check check (level_number > 0),
  constraint academic_levels_sort_order_check check (sort_order > 0),
  constraint academic_levels_status_check
    check (status in ('active', 'inactive'))
);

create table app.academic_semesters (
  id uuid primary key default gen_random_uuid(),
  level_id uuid not null,
  semester_number integer not null,
  display_name text not null,
  phase text not null,
  sort_order integer not null,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint academic_semesters_level_id_fkey
    foreign key (level_id) references app.academic_levels (id)
    on delete no action,
  constraint academic_semesters_semester_number_key unique (semester_number),
  constraint academic_semesters_level_sort_order_key
    unique (level_id, sort_order),
  constraint academic_semesters_semester_number_check
    check (semester_number > 0),
  constraint academic_semesters_sort_order_check check (sort_order > 0),
  constraint academic_semesters_phase_check
    check (phase in ('phase_i', 'phase_ii')),
  constraint academic_semesters_status_check
    check (status in ('active', 'inactive'))
);

create index academic_semesters_level_id_idx
  on app.academic_semesters (level_id);

create table app.academic_modules (
  id uuid primary key default gen_random_uuid(),
  semester_id uuid not null,
  module_code text not null,
  title text not null,
  sort_order integer not null,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint academic_modules_semester_id_fkey
    foreign key (semester_id) references app.academic_semesters (id)
    on delete no action,
  constraint academic_modules_module_code_key unique (module_code),
  constraint academic_modules_semester_sort_order_key
    unique (semester_id, sort_order),
  constraint academic_modules_module_code_check
    check (length(trim(module_code)) > 0),
  constraint academic_modules_sort_order_check check (sort_order > 0),
  constraint academic_modules_status_check
    check (status in ('active', 'inactive'))
);

create index academic_modules_semester_id_idx
  on app.academic_modules (semester_id);

create table app.instructors (
  id uuid primary key default gen_random_uuid(),
  display_name text not null,
  professional_title text,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint instructors_display_name_check
    check (length(trim(display_name)) > 0),
  constraint instructors_status_check
    check (status in ('active', 'inactive'))
);

create table app.brand_instructors (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null,
  instructor_id uuid not null,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint brand_instructors_brand_id_fkey
    foreign key (brand_id) references app.educational_brands (id)
    on delete no action,
  constraint brand_instructors_instructor_id_fkey
    foreign key (instructor_id) references app.instructors (id)
    on delete no action,
  constraint brand_instructors_brand_instructor_key
    unique (brand_id, instructor_id),
  constraint brand_instructors_id_brand_key
    unique (id, brand_id),
  constraint brand_instructors_status_check
    check (status in ('active', 'inactive'))
);

create index brand_instructors_brand_id_idx
  on app.brand_instructors (brand_id);

create index brand_instructors_instructor_id_idx
  on app.brand_instructors (instructor_id);

create table app.brand_courses (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null,
  academic_module_id uuid,
  course_code text not null,
  title text not null,
  course_scope text not null,
  status text not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint brand_courses_brand_id_fkey
    foreign key (brand_id) references app.educational_brands (id)
    on delete no action,
  constraint brand_courses_academic_module_id_fkey
    foreign key (academic_module_id) references app.academic_modules (id)
    on delete no action,
  constraint brand_courses_brand_code_key
    unique (brand_id, course_code),
  constraint brand_courses_id_brand_key
    unique (id, brand_id),
  constraint brand_courses_course_code_check
    check (length(trim(course_code)) > 0),
  constraint brand_courses_title_check
    check (length(trim(title)) > 0),
  constraint brand_courses_scope_check
    check (course_scope in ('curriculum', 'standalone')),
  constraint brand_courses_curriculum_module_check
    check (course_scope <> 'curriculum' or academic_module_id is not null),
  constraint brand_courses_status_check
    check (status in ('draft', 'published', 'archived'))
);

create index brand_courses_brand_id_idx
  on app.brand_courses (brand_id);

create index brand_courses_academic_module_id_idx
  on app.brand_courses (academic_module_id)
  where academic_module_id is not null;

create index brand_courses_brand_module_idx
  on app.brand_courses (brand_id, academic_module_id)
  where academic_module_id is not null;

create index brand_courses_brand_status_idx
  on app.brand_courses (brand_id, status);

create table app.course_instructors (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null,
  brand_id uuid not null,
  instructor_id uuid not null,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint course_instructors_course_brand_fkey
    foreign key (course_id, brand_id)
    references app.brand_courses (id, brand_id)
    on delete no action,
  constraint course_instructors_brand_instructor_fkey
    foreign key (brand_id, instructor_id)
    references app.brand_instructors (brand_id, instructor_id)
    on delete no action,
  constraint course_instructors_course_instructor_key
    unique (course_id, instructor_id),
  constraint course_instructors_status_check
    check (status in ('active', 'inactive'))
);

create index course_instructors_course_id_idx
  on app.course_instructors (course_id);

create index course_instructors_instructor_id_idx
  on app.course_instructors (instructor_id);

create index course_instructors_brand_id_idx
  on app.course_instructors (brand_id);

create trigger academic_levels_set_updated_at
before update on app.academic_levels
for each row execute function app.set_updated_at();

create trigger academic_semesters_set_updated_at
before update on app.academic_semesters
for each row execute function app.set_updated_at();

create trigger academic_modules_set_updated_at
before update on app.academic_modules
for each row execute function app.set_updated_at();

create trigger instructors_set_updated_at
before update on app.instructors
for each row execute function app.set_updated_at();

create trigger brand_instructors_set_updated_at
before update on app.brand_instructors
for each row execute function app.set_updated_at();

create trigger brand_courses_set_updated_at
before update on app.brand_courses
for each row execute function app.set_updated_at();

create trigger course_instructors_set_updated_at
before update on app.course_instructors
for each row execute function app.set_updated_at();

/*
 * Prompt 44 ends here. M2 is not applied, seeded, exposed, or connected to
 * runtime composition. Student-profile academic FKs remain deferred pending
 * a compatibility/backfill decision.
 */
