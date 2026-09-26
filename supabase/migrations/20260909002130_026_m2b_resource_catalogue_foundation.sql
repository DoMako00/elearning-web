begin;

-- M2B extends the private M021 academic-reference metadata table.  This is
-- metadata-only: Drive remains the source system, and storage/delivery stays
-- deliberately unavailable until a separately approved phase.
alter table app.academic_module_resources
  drop constraint academic_module_resources_publication_state_check;

alter table app.academic_module_resources
  drop constraint academic_module_resources_sensitive_initial_state_check,
  drop constraint academic_module_resources_restricted_state_check,
  drop constraint academic_module_resources_1105_pmd_state_check;

alter table app.academic_module_resources
  add column source_provider text null,
  add column source_drive_file_id text null,
  add column source_title text null,
  add column source_file_size_bytes bigint null,
  add column source_folder_path text null,
  add column resource_type text not null default 'unknown',
  add column resource_category text not null default 'unknown',
  add column approval_state text not null default 'imported',
  add column visibility_state text not null default 'internal',
  add column manual_review_required boolean not null default true,
  add column approval_required boolean not null default true,
  add column student_publish_default boolean not null default false;

alter table app.academic_module_resources
  add constraint academic_module_resources_source_provider_check
    check (source_provider is null or source_provider in ('google_drive')),
  add constraint academic_module_resources_source_drive_id_trimmed_check
    check (source_drive_file_id is null or (source_drive_file_id = btrim(source_drive_file_id) and source_drive_file_id <> '')),
  add constraint academic_module_resources_source_title_trimmed_check
    check (source_title is null or (source_title = btrim(source_title) and source_title <> '')),
  add constraint academic_module_resources_source_size_check
    check (source_file_size_bytes is null or source_file_size_bytes >= 0),
  add constraint academic_module_resources_source_folder_path_trimmed_check
    check (source_folder_path is null or (source_folder_path = btrim(source_folder_path) and source_folder_path <> '')),
  add constraint academic_module_resources_google_drive_provenance_check
    check (
      source_provider <> 'google_drive'
      or (
        source_drive_file_id is not null
        and source_title is not null
        and mime_type is not null
        and source_folder_path is not null
      )
    ),
  add constraint academic_module_resources_resource_type_check
    check (resource_type in ('lecture_pdf','slide_deck','summary_pdf','practical_material','question_bank','assessment_file','placement_test','recording','video','unknown')),
  add constraint academic_module_resources_resource_category_check
    check (resource_category in ('lecture','summary','practical','assessment','placement','session','recording','support','unknown')),
  add constraint academic_module_resources_approval_state_check
    check (approval_state in ('imported','draft','pending_review','approved','rejected','blocked')),
  add constraint academic_module_resources_visibility_state_check
    check (visibility_state in ('internal','restricted','draft')),
  add constraint academic_module_resources_m2b_defaults_check
    check (approval_required and not student_publish_default),
  add constraint academic_module_resources_unknown_review_check
    check (
      resource_type <> 'unknown'
      or (manual_review_required and approval_state <> 'approved' and publication_state in ('unpublished','not_published'))
    ),
  add constraint academic_module_resources_protected_type_check
    check (
      resource_type not in ('question_bank','assessment_file','placement_test')
      or (
        visibility_state = 'restricted'
        and approval_required
        and not student_publish_default
        and publication_state in ('unpublished','not_published')
      )
    ),
  add constraint academic_module_resources_media_review_check
    check (
      resource_type not in ('video','recording')
      and resource_category <> 'session'
      or (
        approval_required
        and not student_publish_default
        and publication_state in ('unpublished','not_published')
      )
    ),
  add constraint academic_module_resources_storage_deferred_check
    check (storage_object_path is null),
  add constraint academic_module_resources_no_m2b_publication_check
    check (publication_state in ('unpublished','not_published','archived','retired')),
  add constraint academic_module_resources_publication_state_check
    check (publication_state in ('unpublished','not_published','published','publish_approved','archived','retired'));

alter table app.academic_module_resources
  add constraint academic_module_resources_sensitive_initial_state_check check (
    resource_classification not in ('assessment', 'administrative')
    or (distribution_review_status in ('restricted', 'blocked_restricted') and publication_state in ('unpublished','not_published') and storage_object_path is null)
  ),
  add constraint academic_module_resources_restricted_state_check check (
    distribution_review_status not in ('restricted', 'blocked_restricted')
    or (publication_state in ('unpublished','not_published') and storage_object_path is null)
  ),
  add constraint academic_module_resources_1105_pmd_state_check check (
    academic_module_id <> '40000000-0000-4000-8000-000000000005'::uuid
    or (distribution_review_status = 'blocked_restricted' and publication_state in ('unpublished','not_published') and storage_object_path is null)
  );

alter table app.academic_module_resources
  alter column publication_state set default 'not_published';

create unique index academic_module_resources_source_drive_file_id_key
  on app.academic_module_resources (source_drive_file_id)
  where source_drive_file_id is not null;
create index academic_module_resources_provider_type_idx
  on app.academic_module_resources (source_provider, resource_type, resource_category);

comment on table app.academic_module_resources is
  'Private academic-reference resource metadata. M2B Drive provenance is metadata only; no storage, delivery, entitlement, or student publication.';
comment on column app.academic_module_resources.source_provider is
  'Controlled source provider. M2B permits google_drive metadata only.';
comment on column app.academic_module_resources.source_drive_file_id is
  'Google Drive file identifier for deduplication; never a learner-facing URL.';
comment on column app.academic_module_resources.storage_object_path is
  'Reserved for a separately approved private storage phase; M2B requires NULL.';

revoke all on table app.academic_module_resources from public, anon, authenticated;

commit;
