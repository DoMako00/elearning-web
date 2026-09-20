-- Aggregate-only acceptance verifier. No IDs, names, email addresses, codes,
-- credentials, storage locations, or private resource metadata are returned.
-- Safe for a confirmed target with a read-only auditor session.
-- A failed condition raises a fixed classification and rolls back this read-only transaction.
begin transaction read only;
with expected(brand, institution, presentation, expected_courses, expected_lessons) as (values
  ('elite', 'buc', 'subject_based', 5, 49),
  ('medway', 'buc', 'subject_based', 6, 49),
  ('nexus', 'delta', 'module_based', 8, 49)
), actual as (
  select b.code as brand, i.code as institution, c.catalogue_presentation as presentation,
    count(distinct c.id) as courses,
    count(distinct c.id) filter (where c.status = 'published') as published_courses,
    count(distinct ch.id) as chapters,
    count(distinct ch.id) filter (where ch.status = 'published' and c.status = 'published') as published_chapters,
    count(distinct ls.id) as lessons,
    count(distinct ls.id) filter (where ls.status = 'published' and ch.status = 'published' and c.status = 'published') as published_lessons
  from app.brand_courses c
  join app.educational_brands b on b.id = c.brand_id and b.status = 'active'
  join app.academic_institutions i on i.id = c.academic_institution_id and i.status = 'active'
  join app.brand_academic_institution_access a on a.brand_id = b.id and a.academic_institution_id = i.id and a.status = 'active'
  join app.academic_modules m on m.id = c.academic_module_id and m.academic_institution_id = i.id
    and m.review_status in ('unreviewed', 'approved')
  join app.academic_semesters s on s.id = m.academic_semester_id and s.semester_number = 1 and s.status = 'active'
  join app.academic_levels l on l.id = s.academic_level_id and l.academic_institution_id = i.id and l.level_number = 1 and l.status = 'active'
  left join app.course_chapters ch on ch.brand_course_id = c.id and ch.brand_id = c.brand_id
  left join app.course_lessons ls on ls.course_chapter_id = ch.id and ls.brand_course_id = c.id and ls.brand_id = c.brand_id
  where b.code in ('elite', 'medway', 'nexus')
  group by b.code, i.code, c.catalogue_presentation
)
select e.brand, e.institution, 1 as level_number, 1 as semester_number, e.presentation,
  e.expected_courses, coalesce(a.courses, 0) as courses, coalesce(a.published_courses, 0) as published_courses,
  coalesce(a.chapters, 0) as chapters, coalesce(a.published_chapters, 0) as published_chapters,
  e.expected_lessons, coalesce(a.lessons, 0) as lessons, coalesce(a.published_lessons, 0) as published_lessons,
  coalesce(a.courses = e.expected_courses and a.published_courses = e.expected_courses
    and a.lessons = e.expected_lessons and a.published_lessons = e.expected_lessons
    and a.chapters = a.published_chapters, false) as passed
from expected e left join actual a on a.brand = e.brand and a.institution = e.institution and a.presentation = e.presentation;

with expected(code, title, expected_lessons) as (values
  ('ELT-BIO', 'Biochemistry Fundamentals', 10),
  ('ELT-PHY', 'Physiology Foundations', 3),
  ('ELT-HIS', 'Histology Foundations', 9),
  ('ELT-CBG', 'Cellular Biology and Genetics', 14),
  ('ELT-ANA', 'Anatomy Foundations', 13)
), actual as (
  select c.code, c.title, count(distinct c.id) as courses,
    count(ls.id) as lessons,
    count(ls.id) filter (where c.status = 'published' and ch.status = 'published' and ls.status = 'published') as published_lessons
  from app.brand_courses c
  join app.educational_brands b on b.id = c.brand_id and b.code = 'elite'
  join app.academic_institutions i on i.id = c.academic_institution_id and i.code = 'buc'
  join app.academic_modules m on m.id = c.academic_module_id and m.academic_institution_id = i.id
  join app.academic_semesters s on s.id = m.academic_semester_id and s.semester_number = 1
  join app.academic_levels l on l.id = s.academic_level_id and l.academic_institution_id = i.id and l.level_number = 1
  left join app.course_chapters ch on ch.brand_course_id = c.id and ch.brand_id = c.brand_id
  left join app.course_lessons ls on ls.course_chapter_id = ch.id and ls.brand_course_id = c.id and ls.brand_id = c.brand_id
  where c.catalogue_presentation = 'subject_based'
  group by c.code, c.title
)
select e.code, e.title, e.expected_lessons, coalesce(a.lessons, 0) as lessons,
  coalesce(a.published_lessons, 0) as published_lessons,
  coalesce(a.courses = 1 and a.lessons = e.expected_lessons and a.published_lessons = e.expected_lessons, false) as passed
from expected e left join actual a on a.code = e.code and a.title = e.title;

select count(*) as contradictory_year1_courses
from app.brand_courses c
join app.educational_brands b on b.id = c.brand_id
join app.academic_institutions i on i.id = c.academic_institution_id
join app.academic_modules m on m.id = c.academic_module_id and m.academic_institution_id = i.id
join app.academic_semesters s on s.id = m.academic_semester_id and s.semester_number = 1
join app.academic_levels l on l.id = s.academic_level_id and l.academic_institution_id = i.id and l.level_number = 1
where b.code in ('elite', 'medway', 'nexus')
  and (i.code <> case b.code when 'nexus' then 'delta' else 'buc' end
    or c.catalogue_presentation <> case b.code when 'nexus' then 'module_based' else 'subject_based' end);

-- Profile and Auth linkage are separate from course imports. A label is not proof
-- of a usable bearer, and a synthetic application-side subject is not an Auth user.
select b.code as brand,
  case i.code when 'buc' then 'buc' when 'delta' then 'delta' else 'other' end as institution,
  l.level_number, s.semester_number,
  count(*) as student_profiles,
  count(*) filter (where p.full_name ~* '^controlled\M') as labeled_controlled_profiles,
  count(*) filter (where au.id is not null) as profiles_with_auth_subject,
  count(*) filter (where p.full_name ~* '^controlled\M' and au.id is not null) as labeled_controlled_profiles_with_auth_subject
from app.student_academic_profiles p
join app.student_profiles sp on sp.id = p.student_profile_id and sp.brand_id = p.brand_id and sp.status = 'active'
join app.app_users u on u.id = sp.app_user_id and u.status = 'active'
join app.brand_memberships bm on bm.id = sp.brand_membership_id and bm.app_user_id = u.id and bm.brand_id = p.brand_id and bm.status = 'active'
join app.educational_brands b on b.id = p.brand_id and b.status = 'active'
join app.academic_institutions i on i.id = p.academic_institution_id
join app.academic_levels l on l.id = p.academic_level_id and l.academic_institution_id = i.id
join app.academic_semesters s on s.id = p.academic_semester_id and s.academic_level_id = l.id
left join auth.users au on au.id = u.auth_user_id
where b.code in ('elite', 'medway', 'nexus') and l.level_number = 1 and s.semester_number = 1
group by b.code, i.code, l.level_number, s.semester_number order by b.code;

-- Informational counts only: these tables do not prove playback or entitlement.
select (select count(*) from app.lesson_resources) as resource_metadata_rows,
  (select count(*) from app.course_enrollments) as enrollment_rows;

do $$
begin
  if exists (select 1 from (
with expected(brand, institution, presentation, expected_courses, expected_lessons) as (values
  ('elite', 'buc', 'subject_based', 5, 49),
  ('medway', 'buc', 'subject_based', 6, 49),
  ('nexus', 'delta', 'module_based', 8, 49)
), actual as (
  select b.code as brand, i.code as institution, c.catalogue_presentation as presentation,
    count(distinct c.id) as courses,
    count(distinct c.id) filter (where c.status = 'published') as published_courses,
    count(distinct ch.id) as chapters,
    count(distinct ch.id) filter (where ch.status = 'published' and c.status = 'published') as published_chapters,
    count(distinct ls.id) as lessons,
    count(distinct ls.id) filter (where ls.status = 'published' and ch.status = 'published' and c.status = 'published') as published_lessons
  from app.brand_courses c
  join app.educational_brands b on b.id = c.brand_id and b.status = 'active'
  join app.academic_institutions i on i.id = c.academic_institution_id and i.status = 'active'
  join app.brand_academic_institution_access a on a.brand_id = b.id and a.academic_institution_id = i.id and a.status = 'active'
  join app.academic_modules m on m.id = c.academic_module_id and m.academic_institution_id = i.id
    and m.review_status in ('unreviewed', 'approved')
  join app.academic_semesters s on s.id = m.academic_semester_id and s.semester_number = 1 and s.status = 'active'
  join app.academic_levels l on l.id = s.academic_level_id and l.academic_institution_id = i.id and l.level_number = 1 and l.status = 'active'
  left join app.course_chapters ch on ch.brand_course_id = c.id and ch.brand_id = c.brand_id
  left join app.course_lessons ls on ls.course_chapter_id = ch.id and ls.brand_course_id = c.id and ls.brand_id = c.brand_id
  where b.code in ('elite', 'medway', 'nexus')
  group by b.code, i.code, c.catalogue_presentation
)
select e.brand, e.institution, 1 as level_number, 1 as semester_number, e.presentation,
  e.expected_courses, coalesce(a.courses, 0) as courses, coalesce(a.published_courses, 0) as published_courses,
  coalesce(a.chapters, 0) as chapters, coalesce(a.published_chapters, 0) as published_chapters,
  e.expected_lessons, coalesce(a.lessons, 0) as lessons, coalesce(a.published_lessons, 0) as published_lessons,
  coalesce(a.courses = e.expected_courses and a.published_courses = e.expected_courses
    and a.lessons = e.expected_lessons and a.published_lessons = e.expected_lessons
    and a.chapters = a.published_chapters, false) as passed
from expected e left join actual a on a.brand = e.brand and a.institution = e.institution and a.presentation = e.presentation
) gate where not gate.passed) then
    raise exception using errcode = 'P0001', message = 'YEAR1_PLACEMENT_AGGREGATES_FAILED';
  end if;
  if exists (select 1 from (
with expected(code, title, expected_lessons) as (values
  ('ELT-BIO', 'Biochemistry Fundamentals', 10),
  ('ELT-PHY', 'Physiology Foundations', 3),
  ('ELT-HIS', 'Histology Foundations', 9),
  ('ELT-CBG', 'Cellular Biology and Genetics', 14),
  ('ELT-ANA', 'Anatomy Foundations', 13)
), actual as (
  select c.code, c.title, count(distinct c.id) as courses,
    count(ls.id) as lessons,
    count(ls.id) filter (where c.status = 'published' and ch.status = 'published' and ls.status = 'published') as published_lessons
  from app.brand_courses c
  join app.educational_brands b on b.id = c.brand_id and b.code = 'elite'
  join app.academic_institutions i on i.id = c.academic_institution_id and i.code = 'buc'
  join app.academic_modules m on m.id = c.academic_module_id and m.academic_institution_id = i.id
  join app.academic_semesters s on s.id = m.academic_semester_id and s.semester_number = 1
  join app.academic_levels l on l.id = s.academic_level_id and l.academic_institution_id = i.id and l.level_number = 1
  left join app.course_chapters ch on ch.brand_course_id = c.id and ch.brand_id = c.brand_id
  left join app.course_lessons ls on ls.course_chapter_id = ch.id and ls.brand_course_id = c.id and ls.brand_id = c.brand_id
  where c.catalogue_presentation = 'subject_based'
  group by c.code, c.title
)
select e.code, e.title, e.expected_lessons, coalesce(a.lessons, 0) as lessons,
  coalesce(a.published_lessons, 0) as published_lessons,
  coalesce(a.courses = 1 and a.lessons = e.expected_lessons and a.published_lessons = e.expected_lessons, false) as passed
from expected e left join actual a on a.code = e.code and a.title = e.title
) gate where not gate.passed) then
    raise exception using errcode = 'P0001', message = 'YEAR1_ELITE_SUBJECT_COUNTS_FAILED';
  end if;
  if (select contradictory_year1_courses from (
select count(*) as contradictory_year1_courses
from app.brand_courses c
join app.educational_brands b on b.id = c.brand_id
join app.academic_institutions i on i.id = c.academic_institution_id
join app.academic_modules m on m.id = c.academic_module_id and m.academic_institution_id = i.id
join app.academic_semesters s on s.id = m.academic_semester_id and s.semester_number = 1
join app.academic_levels l on l.id = s.academic_level_id and l.academic_institution_id = i.id and l.level_number = 1
where b.code in ('elite', 'medway', 'nexus')
  and (i.code <> case b.code when 'nexus' then 'delta' else 'buc' end
    or c.catalogue_presentation <> case b.code when 'nexus' then 'module_based' else 'subject_based' end)
) gate) <> 0 then
    raise exception using errcode = 'P0001', message = 'YEAR1_CONTRADICTORY_PLACEMENT_FAILED';
  end if;
end $$;

commit;
