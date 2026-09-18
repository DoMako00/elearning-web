begin;

-- Commercial brands can package the same academic catalogue differently.
-- The academic module remains the reference anchor; this field only controls
-- how the commercial course is presented to admins/students.
alter table app.brand_courses
  add column catalogue_presentation text not null default 'module_based',
  add constraint brand_courses_catalogue_presentation_check
    check (catalogue_presentation in ('module_based','subject_based'));

create index brand_courses_catalogue_presentation_idx
  on app.brand_courses (brand_id, catalogue_presentation);

comment on column app.brand_courses.catalogue_presentation is
  'Commercial packaging mode for a course shell: module_based follows the academic module directly; subject_based is used when a brand packages first-year modules as named subjects.';

commit;
