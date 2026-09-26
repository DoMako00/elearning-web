begin;

-- Manual commercial operations for the current MVP:
-- Admins create offline subscription orders from dashboard evidence, then
-- approval grants course participation through app.course_enrollments.
-- Payment remains external to the website; this stores review metadata only.

create table app.manual_subscription_orders (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null,
  student_profile_id uuid not null,
  plan_code text not null,
  status text not null default 'pending_review',
  currency char(3) not null default 'EGP',
  price_per_student integer not null,
  student_count integer not null default 1,
  subject_count integer not null,
  promo_ends_on date null,
  payment_method text not null default 'bank_transfer',
  payment_reference text null,
  payment_evidence_note text null,
  created_by_admin_profile_id uuid not null,
  reviewed_by_admin_profile_id uuid null,
  reviewed_at timestamptz null,
  review_reason text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  version bigint not null default 1,
  constraint manual_subscription_orders_brand_fkey
    foreign key (brand_id)
    references app.educational_brands (id) on delete restrict on update restrict,
  constraint manual_subscription_orders_student_profile_fkey
    foreign key (student_profile_id, brand_id)
    references app.student_profiles (id, brand_id) on delete restrict on update restrict,
  constraint manual_subscription_orders_created_by_admin_fkey
    foreign key (created_by_admin_profile_id)
    references app.admin_profiles (id) on delete restrict on update restrict,
  constraint manual_subscription_orders_reviewed_by_admin_fkey
    foreign key (reviewed_by_admin_profile_id)
    references app.admin_profiles (id) on delete restrict on update restrict,
  constraint manual_subscription_orders_plan_code_check
    check (plan_code in ('single_course_manual','oct10_four_subjects_individual','oct10_four_subjects_group3','oct10_four_subjects_group5')),
  constraint manual_subscription_orders_status_check
    check (status in ('pending_review','approved','rejected','cancelled')),
  constraint manual_subscription_orders_currency_check
    check (currency = 'EGP'),
  constraint manual_subscription_orders_positive_price_check
    check (price_per_student > 0),
  constraint manual_subscription_orders_student_count_check
    check (student_count in (1,3,5)),
  constraint manual_subscription_orders_subject_count_check
    check (subject_count between 1 and 5),
  constraint manual_subscription_orders_payment_method_check
    check (payment_method in ('bank_transfer','cash','wallet','other')),
  constraint manual_subscription_orders_payment_reference_trimmed_check
    check (payment_reference is null or (payment_reference = btrim(payment_reference) and payment_reference <> '')),
  constraint manual_subscription_orders_payment_evidence_note_trimmed_check
    check (payment_evidence_note is null or (payment_evidence_note = btrim(payment_evidence_note) and payment_evidence_note <> '')),
  constraint manual_subscription_orders_review_reason_trimmed_check
    check (review_reason is null or (review_reason = btrim(review_reason) and review_reason <> '')),
  constraint manual_subscription_orders_review_status_check
    check (
      (status = 'pending_review' and reviewed_by_admin_profile_id is null and reviewed_at is null)
      or (status in ('approved','rejected','cancelled') and reviewed_by_admin_profile_id is not null and reviewed_at is not null)
    ),
  constraint manual_subscription_orders_version_check check (version >= 1)
);

create table app.manual_subscription_order_courses (
  order_id uuid not null,
  brand_course_id uuid not null,
  brand_id uuid not null,
  created_at timestamptz not null default now(),
  constraint manual_subscription_order_courses_pkey primary key (order_id, brand_course_id),
  constraint manual_subscription_order_courses_order_fkey
    foreign key (order_id)
    references app.manual_subscription_orders (id) on delete restrict on update restrict,
  constraint manual_subscription_order_courses_course_fkey
    foreign key (brand_course_id, brand_id)
    references app.brand_courses (id, brand_id) on delete restrict on update restrict
);

create index manual_subscription_orders_brand_status_idx
  on app.manual_subscription_orders (brand_id, status, created_at desc);
create index manual_subscription_orders_student_status_idx
  on app.manual_subscription_orders (student_profile_id, status, created_at desc);
create index manual_subscription_order_courses_course_idx
  on app.manual_subscription_order_courses (brand_course_id, brand_id);

create trigger manual_subscription_orders_set_updated_at
  before update on app.manual_subscription_orders
  for each row execute function app.set_updated_at();

revoke all on table app.manual_subscription_orders from public, anon, authenticated;
revoke all on table app.manual_subscription_order_courses from public, anon, authenticated;

comment on table app.manual_subscription_orders is
  'Admin-only offline subscription review records. Approval grants selected courses through app.course_enrollments; payment capture remains outside the website.';
comment on column app.manual_subscription_orders.payment_evidence_note is
  'Human review note/reference only. Do not store transfer screenshots here; R2/private storage is a separate future boundary.';

commit;
