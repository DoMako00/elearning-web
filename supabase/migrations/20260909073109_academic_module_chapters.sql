begin;

-- Module codes are institution-scoped: BUC and Delta may legitimately share
-- the same medical code while remaining separate catalogue rows.
alter table app.academic_modules
  add column academic_institution_id uuid null,
  add constraint academic_modules_academic_institution_id_fkey
    foreign key (academic_institution_id) references app.academic_institutions (id) on delete restrict on update restrict;

alter table app.academic_modules
  drop constraint academic_modules_normalized_code_key,
  add constraint academic_modules_institution_code_key unique (academic_institution_id, normalized_code);

create index academic_modules_academic_institution_id_idx
  on app.academic_modules (academic_institution_id);

-- Chapter/topic metadata is intentionally separate from academic modules. A
-- module such as Anatomy or Biochemistry can therefore have an ordered,
-- reusable outline for each academic institution without turning every topic
-- into a new catalogue module.
create table app.academic_module_chapters (
  id uuid primary key default gen_random_uuid(),
  academic_module_id uuid not null,
  code varchar(80) not null,
  normalized_code varchar(80) generated always as (lower(btrim(code))) stored,
  title varchar(240) not null,
  sort_order integer not null,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  version bigint not null default 1,
  constraint academic_module_chapters_module_id_fkey
    foreign key (academic_module_id) references app.academic_modules (id) on delete restrict on update restrict,
  constraint academic_module_chapters_module_code_key unique (academic_module_id, normalized_code),
  constraint academic_module_chapters_module_sort_key unique (academic_module_id, sort_order),
  constraint academic_module_chapters_code_trimmed_check check (code = btrim(code) and code <> ''),
  constraint academic_module_chapters_title_trimmed_check check (title = btrim(title) and title <> ''),
  constraint academic_module_chapters_sort_order_check check (sort_order > 0),
  constraint academic_module_chapters_status_check check (status in ('active','retired')),
  constraint academic_module_chapters_version_check check (version >= 1)
);

create index academic_module_chapters_academic_module_id_idx
  on app.academic_module_chapters (academic_module_id);

create trigger academic_module_chapters_set_updated_at
  before update on app.academic_module_chapters
  for each row execute function app.set_updated_at();

revoke all on table app.academic_module_chapters from public, anon, authenticated;

comment on table app.academic_module_chapters is
  'Private ordered topic outline under an academic module; it is catalogue metadata, not course delivery content.';

commit;
