begin;
create table app.manual_subscription_idempotency (
  brand_id uuid not null references app.educational_brands(id) on delete restrict on update restrict,
  operation text not null check (operation in ('student_create','order_create','order_approve','order_reject')),
  idempotency_key text not null check (idempotency_key ~ '^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$'),
  request_fingerprint char(64) not null check (request_fingerprint ~ '^[0-9a-f]{64}$'),
  response_status smallint not null check (response_status between 200 and 299),
  response_data jsonb not null check (jsonb_typeof(response_data) = 'object'),
  created_at timestamptz not null default now(),
  primary key (brand_id, operation, idempotency_key)
);
revoke all on app.manual_subscription_idempotency from public, anon, authenticated;
comment on table app.manual_subscription_idempotency is 'Private replay records for Admin manual student and subscription commands; fingerprints never retain submitted passwords or evidence files.';
commit;
