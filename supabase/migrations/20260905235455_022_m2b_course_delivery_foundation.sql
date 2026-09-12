begin;

-- Private course structure and participation only. None of these records
-- authorizes content delivery. No business or authority rows are created.
create table app.course_chapters (
  id uuid primary key default gen_random_uuid(),
  brand_course_id uuid not null,
  brand_id uuid not null,
  title varchar(240) not null check (title = btrim(title) and title <> ''),
  sort_order integer not null check (sort_order > 0),
  status text not null default 'draft' check (status in ('draft','published','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  version bigint not null default 1 check (version >= 1),
  unique (brand_course_id, sort_order),
  unique (id, brand_id),
  unique (id, brand_course_id, brand_id),
  foreign key (brand_course_id, brand_id) references app.brand_courses (id, brand_id) on delete restrict on update restrict
);
create index course_chapters_course_brand_idx on app.course_chapters (brand_course_id, brand_id);

create table app.course_lessons (
  id uuid primary key default gen_random_uuid(),
  course_chapter_id uuid not null,
  brand_course_id uuid not null,
  brand_id uuid not null,
  title varchar(240) not null check (title = btrim(title) and title <> ''),
  sort_order integer not null check (sort_order > 0),
  status text not null default 'draft' check (status in ('draft','published','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  version bigint not null default 1 check (version >= 1),
  unique (course_chapter_id, sort_order),
  unique (id, brand_id),
  unique (id, brand_course_id, brand_id),
  foreign key (course_chapter_id, brand_course_id, brand_id) references app.course_chapters (id, brand_course_id, brand_id) on delete restrict on update restrict,
  foreign key (brand_course_id, brand_id) references app.brand_courses (id, brand_id) on delete restrict on update restrict
);
create index course_lessons_chapter_course_brand_idx on app.course_lessons (course_chapter_id, brand_course_id, brand_id);
create index course_lessons_course_brand_idx on app.course_lessons (brand_course_id, brand_id);

create table app.lesson_resources (
  id uuid primary key default gen_random_uuid(),
  course_lesson_id uuid not null,
  brand_course_id uuid not null,
  brand_id uuid not null,
  resource_kind text not null check (resource_kind in ('video','document','quiz','link','file')),
  title varchar(240) not null check (title = btrim(title) and title <> ''),
  sort_order integer not null check (sort_order > 0),
  status text not null default 'draft' check (status in ('draft','published','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  version bigint not null default 1 check (version >= 1),
  unique (course_lesson_id, sort_order),
  foreign key (course_lesson_id, brand_course_id, brand_id) references app.course_lessons (id, brand_course_id, brand_id) on delete restrict on update restrict,
  foreign key (brand_course_id, brand_id) references app.brand_courses (id, brand_id) on delete restrict on update restrict
);
-- No downstream resource FK exists in M2B, so no speculative (id,brand_id) key.
create index lesson_resources_lesson_course_brand_idx on app.lesson_resources (course_lesson_id, brand_course_id, brand_id);
create index lesson_resources_course_brand_idx on app.lesson_resources (brand_course_id, brand_id);

create table app.course_releases (
  id uuid primary key default gen_random_uuid(),
  brand_course_id uuid not null,
  brand_id uuid not null,
  status text not null default 'draft' check (status in ('draft','published','archived')),
  available_from timestamptz not null,
  available_until timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  version bigint not null default 1 check (version >= 1),
  check (available_until is null or available_until > available_from),
  foreign key (brand_course_id, brand_id) references app.brand_courses (id, brand_id) on delete restrict on update restrict
);
-- At most one published release, even for disjoint windows. Archive the prior
-- release explicitly before publishing another. Draft/history rows may coexist.
create unique index course_releases_one_published_idx on app.course_releases (brand_course_id, brand_id) where status = 'published';
create index course_releases_course_brand_idx on app.course_releases (brand_course_id, brand_id);

create table app.course_enrollments (
  id uuid primary key default gen_random_uuid(),
  student_profile_id uuid not null,
  brand_course_id uuid not null,
  brand_id uuid not null,
  status text not null default 'active' check (status in ('active','completed','ended','archived')),
  enrolled_at timestamptz not null,
  completed_at timestamptz null,
  ended_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  version bigint not null default 1 check (version >= 1),
  unique (id, brand_course_id, brand_id),
  check ((status = 'completed') = (completed_at is not null)),
  check ((status in ('ended','archived')) = (ended_at is not null)),
  check (completed_at is null or completed_at >= enrolled_at),
  check (ended_at is null or ended_at >= enrolled_at),
  foreign key (student_profile_id, brand_id) references app.student_profiles (id, brand_id) on delete restrict on update restrict,
  foreign key (brand_course_id, brand_id) references app.brand_courses (id, brand_id) on delete restrict on update restrict
);
-- Ended/archived history is retained; only one current participation record.
create unique index course_enrollments_current_idx on app.course_enrollments (student_profile_id, brand_course_id) where status in ('active','completed');
create index course_enrollments_profile_brand_idx on app.course_enrollments (student_profile_id, brand_id);
create index course_enrollments_course_brand_idx on app.course_enrollments (brand_course_id, brand_id);

create table app.lesson_progress (
  id uuid primary key default gen_random_uuid(),
  course_enrollment_id uuid not null,
  course_lesson_id uuid not null,
  brand_course_id uuid not null,
  brand_id uuid not null,
  status text not null default 'not_started' check (status in ('not_started','in_progress','completed')),
  started_at timestamptz null,
  completed_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  version bigint not null default 1 check (version >= 1),
  unique (course_enrollment_id, course_lesson_id),
  check ((status = 'not_started' and started_at is null and completed_at is null)
      or (status = 'in_progress' and started_at is not null and completed_at is null)
      or (status = 'completed' and started_at is not null and completed_at is not null and completed_at >= started_at)),
  foreign key (course_enrollment_id, brand_course_id, brand_id) references app.course_enrollments (id, brand_course_id, brand_id) on delete restrict on update restrict,
  foreign key (course_lesson_id, brand_course_id, brand_id) references app.course_lessons (id, brand_course_id, brand_id) on delete restrict on update restrict,
  foreign key (brand_course_id, brand_id) references app.brand_courses (id, brand_id) on delete restrict on update restrict
);
create index lesson_progress_enrollment_course_brand_idx on app.lesson_progress (course_enrollment_id, brand_course_id, brand_id);
create index lesson_progress_lesson_course_brand_idx on app.lesson_progress (course_lesson_id, brand_course_id, brand_id);
create index lesson_progress_course_brand_idx on app.lesson_progress (brand_course_id, brand_id);

create trigger course_chapters_set_updated_at before update on app.course_chapters for each row execute function app.set_updated_at();
create trigger course_lessons_set_updated_at before update on app.course_lessons for each row execute function app.set_updated_at();
create trigger lesson_resources_set_updated_at before update on app.lesson_resources for each row execute function app.set_updated_at();
create trigger course_releases_set_updated_at before update on app.course_releases for each row execute function app.set_updated_at();
create trigger course_enrollments_set_updated_at before update on app.course_enrollments for each row execute function app.set_updated_at();
create trigger lesson_progress_set_updated_at before update on app.lesson_progress for each row execute function app.set_updated_at();

revoke all on app.course_chapters, app.course_lessons, app.lesson_resources, app.course_releases, app.course_enrollments, app.lesson_progress from public, anon, authenticated;
comment on table app.course_chapters is 'Private commercial course structure; never an entitlement.';
comment on table app.course_lessons is 'Private same-course and same-brand lesson structure; no delivery authorization.';
comment on table app.lesson_resources is 'Instructional resource metadata only; no content payload, storage binding, catalogue import, or delivery link.';
comment on table app.course_releases is 'Course availability only. Publication does not authorize a student.';
comment on table app.course_enrollments is 'Participation only; not payment proof or an AccessGrant.';
comment on table app.lesson_progress is 'Participation evidence only; completion never grants access.';

commit;
