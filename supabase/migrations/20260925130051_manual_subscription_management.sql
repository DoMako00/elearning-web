begin;

-- Manual/offline payment evidence is metadata only. A group purchase is
-- recorded against one student in this MVP; group_size and per-student price
-- are commercial metadata and do not grant other students access.
create table app.manual_subscription_orders (
  id uuid primary key default gen_random_uuid(),
  student_profile_id uuid not null,
  brand_id uuid not null,
  plan_code text not null check (plan_code in ('single_subject','promo_individual_4','promo_group_3','promo_group_5')),
  status text not null default 'pending' check (status in ('pending','approved','rejected','cancelled')),
  subject_count integer not null check (subject_count > 0),
  group_size integer not null default 1 check (group_size in (1,3,5)),
  amount_paid numeric(12,2) not null check (amount_paid >= 0),
  list_price numeric(12,2) null check (list_price is null or list_price >= amount_paid),
  currency char(3) not null default 'EGP' check (currency = 'EGP'),
  promo_deadline date null,
  external_payment_reference text null check (external_payment_reference is null or length(btrim(external_payment_reference)) between 1 and 240),
  evidence_note text null check (evidence_note is null or length(evidence_note) <= 2000),
  admin_notes text null check (admin_notes is null or length(admin_notes) <= 4000),
  reviewed_by_admin_profile_id uuid null references app.admin_profiles(id) on delete restrict on update restrict,
  reviewed_at timestamptz null,
  review_note text null check (review_note is null or length(review_note) <= 2000),
  rejection_reason text null check (rejection_reason is null or length(btrim(rejection_reason)) between 1 and 1000),
  idempotency_key text not null check (idempotency_key ~ '^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  version bigint not null default 1 check (version >= 1),
  unique (brand_id, idempotency_key),
  unique (id, brand_id),
  foreign key (student_profile_id, brand_id) references app.student_profiles(id, brand_id) on delete restrict on update restrict,
  check ((status = 'pending' and reviewed_at is null and reviewed_by_admin_profile_id is null)
      or (status <> 'pending' and reviewed_at is not null and reviewed_by_admin_profile_id is not null)),
  check ((status = 'rejected') = (rejection_reason is not null)),
  check ((plan_code = 'single_subject' and subject_count = 1 and group_size = 1)
      or (plan_code = 'promo_individual_4' and subject_count = 4 and group_size = 1)
      or (plan_code = 'promo_group_3' and subject_count = 4 and group_size = 3)
      or (plan_code = 'promo_group_5' and subject_count = 4 and group_size = 5))
);
create index manual_subscription_orders_status_created_idx on app.manual_subscription_orders(status, created_at desc);
create index manual_subscription_orders_student_brand_created_idx on app.manual_subscription_orders(student_profile_id, brand_id, created_at desc);
create index manual_subscription_orders_brand_created_idx on app.manual_subscription_orders(brand_id, created_at desc);

create table app.manual_subscription_order_courses (
  order_id uuid not null,
  brand_id uuid not null,
  brand_course_id uuid not null,
  created_at timestamptz not null default now(),
  primary key (order_id, brand_course_id),
  foreign key (order_id, brand_id) references app.manual_subscription_orders(id, brand_id) on delete restrict on update restrict,
  foreign key (brand_course_id, brand_id) references app.brand_courses(id, brand_id) on delete restrict on update restrict
);
create index manual_subscription_order_courses_course_brand_idx on app.manual_subscription_order_courses(brand_course_id, brand_id);

create trigger manual_subscription_orders_set_updated_at
  before update on app.manual_subscription_orders
  for each row execute function app.set_updated_at();

revoke all on app.manual_subscription_orders, app.manual_subscription_order_courses from public, anon, authenticated;
comment on table app.manual_subscription_orders is 'Private Admin record of offline/manual course subscription requests; it records evidence metadata, not processor transactions.';
comment on column app.manual_subscription_orders.group_size is 'Promotional group size metadata. Enrollment remains scoped to student_profile_id in this MVP.';
comment on column app.manual_subscription_orders.evidence_note is 'Admin-entered reference/description only; no file upload or storage object is implied.';

commit;
