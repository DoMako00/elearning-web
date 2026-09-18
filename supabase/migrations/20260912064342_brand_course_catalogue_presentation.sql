begin;

-- Compatibility migration retained because this version exists in linked
-- migration history. The preceding 20260912062755 migration owns the
-- catalogue_presentation schema change in this checkout.
alter table app.brand_courses
  add column if not exists catalogue_presentation text not null default 'module_based';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'brand_courses_catalogue_presentation_check'
      and conrelid = 'app.brand_courses'::regclass
  ) then
    alter table app.brand_courses
      add constraint brand_courses_catalogue_presentation_check
        check (catalogue_presentation in ('module_based','subject_based'));
  end if;
end $$;

create index if not exists brand_courses_catalogue_presentation_idx
  on app.brand_courses (brand_id, catalogue_presentation);

comment on column app.brand_courses.catalogue_presentation is
  'Commercial packaging mode for a course shell: module_based follows the academic module directly; subject_based is used when a brand packages first-year modules as named subjects.';

commit;
