/*
 * ============================================================================
 * M4 DRAFT ONLY / NOT AN ACTIVE OR APPLIED MIGRATION
 * ============================================================================
 *
 * Purpose: minimal private-schema audit foundation for future backend-mediated
 * Admin commands. It is a prerequisite for transactional M2 write execution.
 *
 * Prerequisites: the separately approved M1 private app schema, including
 * educational_brands and admin_profiles, exists in the approved target.
 *
 * This review-only DDL creates durable successful-command receipts and their
 * one-to-one audit evidence. It contains no M2 domain write path, seed data,
 * RLS/policies/grants, Data API exposure, public-schema objects, functions, or
 * triggers. Do not apply without separate review and staging authorization.
 * ============================================================================
 */

create table app.admin_actions (
  id uuid not null default gen_random_uuid(),
  brand_id uuid not null,
  admin_profile_id uuid not null,
  command_name varchar(128) not null,
  target_type varchar(64) not null,
  target_id varchar(128) not null,
  outcome varchar(16) not null default 'succeeded',
  reason text not null,
  correlation_id varchar(128) not null,
  request_id varchar(128),
  idempotency_key varchar(255) not null,
  command_fingerprint varchar(80) not null,
  policy_set_id varchar(128),
  expected_version varchar(128),
  result_summary jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint admin_actions_pkey primary key (id),
  constraint admin_actions_brand_id_fkey
    foreign key (brand_id) references app.educational_brands (id)
    on delete no action,
  constraint admin_actions_profile_brand_fkey
    foreign key (admin_profile_id, brand_id)
    references app.admin_profiles (id, brand_id)
    on delete no action,
  constraint admin_actions_command_name_check
    check (length(trim(command_name)) > 0),
  constraint admin_actions_target_type_check
    check (length(trim(target_type)) > 0),
  constraint admin_actions_target_id_check
    check (length(trim(target_id)) > 0),
  constraint admin_actions_outcome_check
    check (outcome = 'succeeded'),
  constraint admin_actions_reason_check
    check (length(trim(reason)) > 0 and char_length(reason) <= 500),
  constraint admin_actions_correlation_id_check
    check (length(trim(correlation_id)) > 0),
  constraint admin_actions_idempotency_key_check
    check (length(trim(idempotency_key)) > 0),
  constraint admin_actions_command_fingerprint_check
    check (command_fingerprint ~ '^[a-z0-9_-]+:sha256:[0-9a-f]{64}$'),
  constraint admin_actions_result_summary_check
    check (result_summary is null or jsonb_typeof(result_summary) = 'object'),
  constraint admin_actions_metadata_check
    check (jsonb_typeof(metadata) = 'object'),
  constraint admin_actions_idempotency_key
    unique (brand_id, admin_profile_id, command_name, idempotency_key)
);

create index admin_actions_brand_created_at_idx
  on app.admin_actions (brand_id, created_at desc);

create index admin_actions_admin_profile_created_at_idx
  on app.admin_actions (admin_profile_id, created_at desc);

create index admin_actions_target_created_at_idx
  on app.admin_actions (target_type, target_id, created_at desc);

create index admin_actions_correlation_id_idx
  on app.admin_actions (correlation_id);

create table app.audit_logs (
  id uuid not null default gen_random_uuid(),
  admin_action_id uuid not null,
  brand_id uuid not null,
  admin_profile_id uuid not null,
  action varchar(128) not null,
  target_type varchar(64) not null,
  target_id varchar(128) not null,
  outcome varchar(16) not null default 'succeeded',
  reason text not null,
  correlation_id varchar(128) not null,
  idempotency_key varchar(255) not null,
  before_summary jsonb,
  after_summary jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint audit_logs_pkey primary key (id),
  constraint audit_logs_admin_action_id_key unique (admin_action_id),
  constraint audit_logs_admin_action_id_fkey
    foreign key (admin_action_id) references app.admin_actions (id)
    on delete no action,
  constraint audit_logs_brand_id_fkey
    foreign key (brand_id) references app.educational_brands (id)
    on delete no action,
  constraint audit_logs_profile_brand_fkey
    foreign key (admin_profile_id, brand_id)
    references app.admin_profiles (id, brand_id)
    on delete no action,
  constraint audit_logs_action_check
    check (length(trim(action)) > 0),
  constraint audit_logs_target_type_check
    check (length(trim(target_type)) > 0),
  constraint audit_logs_target_id_check
    check (length(trim(target_id)) > 0),
  constraint audit_logs_outcome_check
    check (outcome = 'succeeded'),
  constraint audit_logs_reason_check
    check (length(trim(reason)) > 0 and char_length(reason) <= 500),
  constraint audit_logs_correlation_id_check
    check (length(trim(correlation_id)) > 0),
  constraint audit_logs_idempotency_key_check
    check (length(trim(idempotency_key)) > 0),
  constraint audit_logs_before_summary_check
    check (before_summary is null or jsonb_typeof(before_summary) = 'object'),
  constraint audit_logs_after_summary_check
    check (jsonb_typeof(after_summary) = 'object'),
  constraint audit_logs_metadata_check
    check (jsonb_typeof(metadata) = 'object')
);

create index audit_logs_brand_created_at_idx
  on app.audit_logs (brand_id, created_at desc);

create index audit_logs_target_created_at_idx
  on app.audit_logs (target_type, target_id, created_at desc);

/*
 * Deliberately absent:
 * - INSERT/UPDATE/DELETE seed or data operations
 * - RLS, policies, grants, Data API exposure, views, functions, or triggers
 * - updated_at columns: evidence is append-only by application policy
 * - M2 write tables, academic-reference changes, or domain-target polymorphic FKs
 */
