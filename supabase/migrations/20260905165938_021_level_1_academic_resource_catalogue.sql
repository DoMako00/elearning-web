begin;

-- Private BUC Level 1 academic-reference metadata only. Migration 021 is
-- intentionally data-free; controlled resource rows belong in seed.sql.
create table app.academic_module_resources (
  id uuid not null default gen_random_uuid(),
  academic_module_id uuid not null,
  resource_key varchar(80) not null,
  source_relative_path text not null,
  display_name text not null,
  file_format text not null,
  mime_type text null,
  resource_classification text not null,
  distribution_review_status text not null default 'unreviewed',
  publication_state text not null default 'unpublished',
  storage_object_path text null,
  source_modified_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  version bigint not null default 1,
  constraint academic_module_resources_pkey primary key (id),
  constraint academic_module_resources_module_id_fkey foreign key (academic_module_id) references app.academic_modules (id) on delete restrict on update restrict,
  constraint academic_module_resources_resource_key_key unique (resource_key),
  constraint academic_module_resources_source_path_key unique (source_relative_path),
  constraint academic_module_resources_resource_key_trimmed_check check (resource_key = btrim(resource_key) and resource_key <> ''),
  constraint academic_module_resources_source_path_trimmed_check check (source_relative_path = btrim(source_relative_path) and source_relative_path <> ''),
  constraint academic_module_resources_display_name_trimmed_check check (display_name = btrim(display_name) and display_name <> ''),
  constraint academic_module_resources_storage_path_trimmed_check check (storage_object_path is null or (storage_object_path = btrim(storage_object_path) and storage_object_path <> '')),
  constraint academic_module_resources_version_check check (version >= 1),
  constraint academic_module_resources_file_format_check check (file_format in ('pdf', 'docx', 'pptx', 'google_doc', 'jpeg', 'ppt', 'shortcut', 'mp4', 'heif', 'm4a', 'pptm', 'txt', 'binary', 'zip', 'xlsx')),
  constraint academic_module_resources_classification_check check (resource_classification in ('lecture', 'recorded_lecture', 'practical', 'revision', 'supplementary', 'assessment', 'administrative', 'unknown')),
  constraint academic_module_resources_review_status_check check (distribution_review_status in ('unreviewed', 'restricted', 'blocked_restricted', 'approved', 'rejected')),
  constraint academic_module_resources_publication_state_check check (publication_state in ('unpublished', 'published', 'archived')),
  constraint academic_module_resources_published_storage_check check (publication_state <> 'published' or storage_object_path is not null),
  constraint academic_module_resources_sensitive_initial_state_check check (
    resource_classification not in ('assessment', 'administrative')
    or (distribution_review_status in ('restricted', 'blocked_restricted') and publication_state = 'unpublished' and storage_object_path is null)
  ),
  constraint academic_module_resources_restricted_state_check check (
    distribution_review_status not in ('restricted', 'blocked_restricted')
    or (publication_state = 'unpublished' and storage_object_path is null)
  ),
  constraint academic_module_resources_1105_pmd_state_check check (
    academic_module_id <> '40000000-0000-4000-8000-000000000005'::uuid
    or (distribution_review_status = 'blocked_restricted' and publication_state = 'unpublished' and storage_object_path is null)
  )
);

comment on table app.academic_module_resources is 'Private BUC academic-reference file metadata; not commercial course content or a student access grant.';
comment on column app.academic_module_resources.source_relative_path is 'Human-readable BUC Level 1-relative source hierarchy with no Drive identifiers or URLs.';
comment on column app.academic_module_resources.storage_object_path is 'Reserved for a separately approved private Storage ingestion; NULL for the Prompt 6C controlled seed.';

create index academic_module_resources_academic_module_id_idx
  on app.academic_module_resources (academic_module_id);
create index academic_module_resources_module_classification_path_idx
  on app.academic_module_resources (academic_module_id, resource_classification, source_relative_path);

create trigger academic_module_resources_set_updated_at
before update on app.academic_module_resources
for each row execute function app.set_updated_at();

revoke all on table app.academic_module_resources from public;
revoke all on table app.academic_module_resources from anon;
revoke all on table app.academic_module_resources from authenticated;

commit;
