begin;

-- M4A is private, backend-owned command evidence. It intentionally creates no
-- command, audit, role, identity, or Platform Owner bootstrap rows.
create table app.admin_command_receipts (
  id uuid not null default gen_random_uuid(),
  actor_admin_profile_id uuid not null,
  scope_kind text not null,
  brand_id uuid null,
  command_name varchar(128) not null,
  target_type varchar(64) not null,
  target_id uuid not null,
  idempotency_key varchar(128) not null,
  request_fingerprint char(64) not null,
  correlation_id varchar(128) null,
  outcome text not null,
  result_summary jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint admin_command_receipts_pkey primary key (id),
  constraint admin_command_receipts_actor_id_fkey foreign key (actor_admin_profile_id) references app.admin_profiles (id) on delete restrict on update restrict,
  constraint admin_command_receipts_brand_id_fkey foreign key (brand_id) references app.educational_brands (id) on delete restrict on update restrict,
  constraint admin_command_receipts_actor_idempotency_key_key unique (actor_admin_profile_id, idempotency_key),
  constraint admin_command_receipts_scope_brand_check check (
    (scope_kind = 'brand' and brand_id is not null)
    or (scope_kind in ('global', 'shared') and brand_id is null)
  ),
  constraint admin_command_receipts_command_name_check check (command_name = btrim(command_name) and command_name <> ''),
  constraint admin_command_receipts_target_type_check check (target_type = btrim(target_type) and target_type <> ''),
  constraint admin_command_receipts_idempotency_key_check check (idempotency_key = btrim(idempotency_key) and idempotency_key <> ''),
  constraint admin_command_receipts_fingerprint_check check (request_fingerprint ~ '^[0-9a-f]{64}$'),
  constraint admin_command_receipts_correlation_id_check check (correlation_id is null or (correlation_id = btrim(correlation_id) and correlation_id <> '')),
  constraint admin_command_receipts_outcome_check check (outcome in ('succeeded', 'replayed', 'no_op')),
  constraint admin_command_receipts_result_summary_check check (jsonb_typeof(result_summary) = 'object' and octet_length(result_summary::text) <= 32768)
);

create index admin_command_receipts_brand_created_at_idx on app.admin_command_receipts (brand_id, created_at);
create index admin_command_receipts_target_created_at_idx on app.admin_command_receipts (target_type, target_id, created_at);

create table app.admin_audit_events (
  id uuid not null default gen_random_uuid(),
  receipt_id uuid not null,
  actor_admin_profile_id uuid not null,
  scope_kind text not null,
  brand_id uuid null,
  command_name varchar(128) not null,
  target_type varchar(64) not null,
  target_id uuid not null,
  reason text not null,
  before_summary jsonb null,
  after_summary jsonb null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint admin_audit_events_pkey primary key (id),
  constraint admin_audit_events_receipt_id_key unique (receipt_id),
  constraint admin_audit_events_receipt_id_fkey foreign key (receipt_id) references app.admin_command_receipts (id) on delete restrict on update restrict,
  constraint admin_audit_events_actor_id_fkey foreign key (actor_admin_profile_id) references app.admin_profiles (id) on delete restrict on update restrict,
  constraint admin_audit_events_brand_id_fkey foreign key (brand_id) references app.educational_brands (id) on delete restrict on update restrict,
  constraint admin_audit_events_scope_brand_check check (
    (scope_kind = 'brand' and brand_id is not null)
    or (scope_kind in ('global', 'shared') and brand_id is null)
  ),
  constraint admin_audit_events_command_name_check check (command_name = btrim(command_name) and command_name <> ''),
  constraint admin_audit_events_target_type_check check (target_type = btrim(target_type) and target_type <> ''),
  constraint admin_audit_events_reason_check check (btrim(reason) <> ''),
  constraint admin_audit_events_before_summary_check check (before_summary is null or (jsonb_typeof(before_summary) = 'object' and octet_length(before_summary::text) <= 32768)),
  constraint admin_audit_events_after_summary_check check (after_summary is null or (jsonb_typeof(after_summary) = 'object' and octet_length(after_summary::text) <= 32768)),
  constraint admin_audit_events_metadata_check check (jsonb_typeof(metadata) = 'object' and octet_length(metadata::text) <= 32768)
);

create index admin_audit_events_actor_created_at_idx on app.admin_audit_events (actor_admin_profile_id, created_at);
create index admin_audit_events_brand_created_at_idx on app.admin_audit_events (brand_id, created_at);
create index admin_audit_events_target_created_at_idx on app.admin_audit_events (target_type, target_id, created_at);

create function app.reject_m4a_immutable_change()
returns trigger
language plpgsql
security invoker
set search_path = pg_catalog, app
as $$
begin
  raise exception using
    errcode = '55000',
    message = 'M4A command receipts and audit events are immutable.';
end;
$$;

create function app.enforce_admin_audit_receipt_consistency()
returns trigger
language plpgsql
security invoker
set search_path = pg_catalog, app
as $$
declare
  receipt app.admin_command_receipts%rowtype;
begin
  select * into receipt
  from app.admin_command_receipts
  where id = new.receipt_id;

  if not found
     or receipt.outcome <> 'succeeded'
     or receipt.actor_admin_profile_id <> new.actor_admin_profile_id
     or receipt.scope_kind <> new.scope_kind
     or receipt.brand_id is distinct from new.brand_id
     or receipt.command_name <> new.command_name
     or receipt.target_type <> new.target_type
     or receipt.target_id <> new.target_id then
    raise exception using
      errcode = '23514',
      message = 'Audit event must match one succeeded command receipt.';
  end if;

  return new;
end;
$$;

create trigger admin_command_receipts_reject_update_delete
before update or delete on app.admin_command_receipts
for each row execute function app.reject_m4a_immutable_change();

create trigger admin_audit_events_reject_update_delete
before update or delete on app.admin_audit_events
for each row execute function app.reject_m4a_immutable_change();

create trigger admin_audit_events_enforce_receipt_consistency
before insert on app.admin_audit_events
for each row execute function app.enforce_admin_audit_receipt_consistency();

revoke all on table app.admin_command_receipts from public;
revoke all on table app.admin_command_receipts from anon;
revoke all on table app.admin_command_receipts from authenticated;
revoke all on table app.admin_audit_events from public;
revoke all on table app.admin_audit_events from anon;
revoke all on table app.admin_audit_events from authenticated;
revoke all on function app.reject_m4a_immutable_change() from public;
revoke all on function app.reject_m4a_immutable_change() from anon;
revoke all on function app.reject_m4a_immutable_change() from authenticated;
revoke all on function app.enforce_admin_audit_receipt_consistency() from public;
revoke all on function app.enforce_admin_audit_receipt_consistency() from anon;
revoke all on function app.enforce_admin_audit_receipt_consistency() from authenticated;

commit;
