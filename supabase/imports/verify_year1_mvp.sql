-- Read-only aggregate verification. No student identities or contact values.
select b.code as brand, i.code as institution, l.level_number, s.semester_number,
  count(*) as student_profiles
from app.student_academic_profiles p
join app.student_profiles sp on sp.id = p.student_profile_id and sp.brand_id = p.brand_id
join app.educational_brands b on b.id = p.brand_id
join app.academic_institutions i on i.id = p.academic_institution_id
join app.academic_levels l on l.id = p.academic_level_id and l.academic_institution_id = i.id
join app.academic_semesters s on s.id = p.academic_semester_id and s.academic_level_id = l.id
group by b.code, i.code, l.level_number, s.semester_number order by b.code;

select b.code as brand, i.code as institution, l.level_number, s.semester_number,
  c.catalogue_presentation, c.status,
  count(distinct c.id) as courses, count(distinct ch.id) as chapters, count(distinct ls.id) as lessons
from app.brand_courses c
join app.educational_brands b on b.id = c.brand_id
join app.academic_institutions i on i.id = c.academic_institution_id
join app.academic_modules m on m.id = c.academic_module_id and m.academic_institution_id = i.id
join app.academic_semesters s on s.id = m.academic_semester_id
join app.academic_levels l on l.id = s.academic_level_id and l.academic_institution_id = i.id
left join app.course_chapters ch on ch.brand_course_id = c.id and ch.brand_id = c.brand_id
left join app.course_lessons ls on ls.course_chapter_id = ch.id and ls.brand_course_id = c.id and ls.brand_id = c.brand_id
where l.level_number = 1 and s.semester_number = 1
group by b.code, i.code, l.level_number, s.semester_number, c.catalogue_presentation, c.status order by b.code;

select c.code, c.title, count(ls.id) as lessons
from app.brand_courses c
join app.educational_brands b on b.id = c.brand_id and b.code = 'elite'
join app.academic_institutions i on i.id = c.academic_institution_id and i.code = 'buc'
left join app.course_lessons ls on ls.brand_course_id = c.id and ls.brand_id = c.brand_id
where c.code in ('ELT-BIO', 'ELT-PHY', 'ELT-HIS', 'ELT-CBG', 'ELT-ANA')
group by c.code, c.title order by c.code;

select (select count(*) from app.lesson_resources) as resource_metadata_rows,
  (select count(*) from app.course_enrollments) as enrollment_rows;
