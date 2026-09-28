begin;

select pg_advisory_xact_lock(hashtext('backend-mvp-a-year1-import'));

-- Controlled MVP structure. Apply explicitly to local/staging after import 030.
-- Published here means a visible shell/outline, not playable or entitled media.
-- Academic resource/Drive metadata is not copied to commercial resources.
create temporary table year1_shells on commit drop as
select md5('controlled-year1-shell:' || b.code || ':' || m.code)::uuid as id,
  b.id as brand_id, i.id as institution_id, m.id as module_id,
  (case b.code when 'medway' then 'MED' else 'NEX' end || '-Y1-' || replace(m.code, ' ', '-')) as code,
  m.source_display_label as title,
  case b.code when 'medway' then 'subject_based' else 'module_based' end as presentation
from app.educational_brands b
join app.academic_institutions i
  on i.code = case b.code when 'medway' then 'buc' when 'nexus' then 'delta' end and i.status = 'active'
join app.brand_academic_institution_access a
  on a.brand_id = b.id and a.academic_institution_id = i.id and a.status = 'active'
join app.academic_levels l on l.academic_institution_id = i.id and l.level_number = 1 and l.status = 'active'
join app.academic_semesters s on s.academic_level_id = l.id and s.semester_number = 1 and s.status = 'active'
join app.academic_modules m on m.academic_semester_id = s.id and m.academic_institution_id = i.id
where b.status = 'active' and b.code in ('medway', 'nexus') and m.review_status in ('unreviewed', 'approved');

do $$
begin
  if (select count(*) from year1_shells where presentation = 'subject_based') <> 6
    or (select count(*) from year1_shells where presentation = 'module_based') <> 8 then
    raise exception 'Controlled Year 1 catalogue prerequisites do not match the accepted inventory.';
  end if;
end $$;

-- Existing catalogue rows are prerequisites, never manufactured by this import.
-- Each commercial brand must already have the intended institution and outline.
do $$
begin
  if exists (select 1 from (values ('medway'), ('nexus')) expected(brand_code)
    left join app.educational_brands b on b.code = expected.brand_code
    left join year1_shells d on d.brand_id = b.id
    left join app.academic_module_chapters o on o.academic_module_id = d.module_id and o.status = 'active'
    group by expected.brand_code
    having count(o.id) <> 49) then
    raise exception using errcode = 'P0001', message = 'YEAR1_OUTLINE_COUNT_MISMATCH';
  end if;
  if exists (select 1 from year1_shells where title is null or btrim(title) = '') then
    raise exception using errcode = 'P0001', message = 'YEAR1_READABLE_LABEL_MISSING';
  end if;
  if exists (select 1 from app.brand_courses c
    join app.educational_brands b on b.id = c.brand_id
    join app.academic_institutions i on i.id = c.academic_institution_id
    join app.academic_modules m on m.id = c.academic_module_id and m.academic_institution_id = i.id
    join app.academic_semesters s on s.id = m.academic_semester_id and s.semester_number = 1
    join app.academic_levels l on l.id = s.academic_level_id and l.level_number = 1
    where b.code in ('medway', 'elite', 'nexus')
      and (i.code <> case b.code when 'nexus' then 'delta' else 'buc' end
        or c.catalogue_presentation <> case b.code when 'nexus' then 'module_based' else 'subject_based' end)) then
    raise exception using errcode = 'P0001', message = 'YEAR1_EXISTING_PLACEMENT_MISMATCH';
  end if;
end $$;
insert into app.brand_courses (id, brand_id, academic_institution_id, academic_module_id, code, title, classification, status, catalogue_presentation)
select id, brand_id, institution_id, module_id, code, title, 'academic_module_offering', 'draft', presentation
from year1_shells on conflict do nothing;

-- Refuse collisions or changed/archived rows instead of repairing owner content.
do $$
begin
  if (select count(*) from year1_shells d join app.brand_courses c on c.id = d.id
    and c.brand_id = d.brand_id and c.academic_institution_id = d.institution_id
    and c.academic_module_id = d.module_id and c.code = d.code and c.title = d.title
    and c.catalogue_presentation = d.presentation and c.classification = 'academic_module_offering'
    and c.status in ('draft', 'published')) <> (select count(*) from year1_shells) then
    raise exception 'Controlled Year 1 course identity or lifecycle conflict.';
  end if;
end $$;

insert into app.course_chapters (id, brand_course_id, brand_id, title, sort_order, status)
select md5('controlled-year1-chapter:' || d.id::text)::uuid, d.id, d.brand_id, 'Lessons', 1, 'draft'
from year1_shells d
where exists (select 1 from app.academic_module_chapters o where o.academic_module_id = d.module_id and o.status = 'active')
on conflict do nothing;

insert into app.course_lessons (id, course_chapter_id, brand_course_id, brand_id, title, sort_order, status)
select md5('controlled-year1-lesson:' || d.id::text || ':' || o.code)::uuid,
  md5('controlled-year1-chapter:' || d.id::text)::uuid, d.id, d.brand_id, o.title, o.sort_order, 'draft'
from year1_shells d
join app.academic_module_chapters o on o.academic_module_id = d.module_id and o.status = 'active'
on conflict do nothing;

do $$
begin
  if exists (select 1 from year1_shells d
    join app.academic_module_chapters o on o.academic_module_id = d.module_id and o.status = 'active'
    where not exists (select 1 from app.course_lessons ls
      join app.course_chapters ch on ch.id = ls.course_chapter_id and ch.brand_course_id = d.id and ch.brand_id = d.brand_id
      where ls.id = md5('controlled-year1-lesson:' || d.id::text || ':' || o.code)::uuid
        and ch.id = md5('controlled-year1-chapter:' || d.id::text)::uuid
        and ch.title = 'Lessons' and ch.sort_order = 1 and ch.status in ('draft', 'published')
        and ls.brand_course_id = d.id and ls.brand_id = d.brand_id and ls.title = o.title
        and ls.sort_order = o.sort_order and ls.status in ('draft', 'published'))) then
    raise exception 'Controlled Year 1 outline conflict.';
  end if;
end $$;

-- Include only the exact course and child identities owned by import 030.
create temporary table year1_elite on commit drop as
select c.id, c.brand_id, c.code from app.brand_courses c
join app.educational_brands b on b.id = c.brand_id and b.code = 'elite' and b.status = 'active'
join app.academic_institutions i on i.id = c.academic_institution_id and i.code = 'buc' and i.status = 'active'
join app.brand_academic_institution_access a on a.brand_id = b.id and a.academic_institution_id = i.id and a.status = 'active'
join app.academic_modules m on m.id = c.academic_module_id and m.academic_institution_id = i.id
join app.academic_semesters s on s.id = m.academic_semester_id and s.semester_number = 1 and s.status = 'active'
join app.academic_levels l on l.id = s.academic_level_id and l.academic_institution_id = i.id and l.level_number = 1 and l.status = 'active'
where c.id = md5('elite-buc-course:' || c.code)::uuid
  and ((c.code in ('ELT-PHY', 'ELT-HIS') and m.code = '1101 TSF')
    or (c.code = 'ELT-BIO' and m.code = '1104 BIO') or (c.code = 'ELT-CBG' and m.code = '1103 CBG')
    or (c.code = 'ELT-ANA' and m.code = '1102 ANA'))
  and c.catalogue_presentation = 'subject_based' and c.status in ('draft', 'published')
  and m.review_status in ('unreviewed', 'approved');

create temporary table year1_publish_lessons on commit drop as
select ls.id from year1_shells d
join app.academic_module_chapters o on o.academic_module_id = d.module_id and o.status = 'active'
join app.course_lessons ls on ls.id = md5('controlled-year1-lesson:' || d.id::text || ':' || o.code)::uuid
union all
select ls.id from year1_elite e
join app.course_chapters ch on ch.id = md5('elite-buc-course-chapter:' || e.code || ':lessons')::uuid
  and ch.brand_course_id = e.id and ch.brand_id = e.brand_id and ch.title = 'Lessons'
  and ch.sort_order = 1 and ch.status in ('draft', 'published')
join app.course_lessons ls on ls.course_chapter_id = ch.id and ls.brand_course_id = e.id and ls.brand_id = e.brand_id
  and ls.id = md5('elite-buc-course-lesson:' || e.code || ':' || ls.sort_order::text || ':' || lower(ls.title))::uuid
  and ls.status in ('draft', 'published');

do $$
begin
  if (select count(*) from year1_elite) <> 5
    or exists (select 1 from year1_elite e
      where (select count(*) from app.course_lessons ls join year1_publish_lessons p on p.id = ls.id where ls.brand_course_id = e.id) <>
        case e.code when 'ELT-BIO' then 10 when 'ELT-PHY' then 3 when 'ELT-HIS' then 9 when 'ELT-CBG' then 14 when 'ELT-ANA' then 13 end) then
    raise exception 'Apply and verify import 030 before publishing controlled Year 1 structure.';
  end if;
end $$;

-- Stop on extra or changed rows; never overwrite unrelated courses or delivery.
do $$
begin
  if exists (select 1 from year1_shells d
    where (select count(*) from app.course_lessons ls where ls.brand_course_id = d.id and ls.brand_id = d.brand_id)
        <> (select count(*) from app.academic_module_chapters o where o.academic_module_id = d.module_id and o.status = 'active')
      or (select count(*) from app.course_chapters ch where ch.brand_course_id = d.id and ch.brand_id = d.brand_id)
        <> case when exists (select 1 from app.academic_module_chapters o where o.academic_module_id = d.module_id and o.status = 'active') then 1 else 0 end) then
    raise exception using errcode = 'P0001', message = 'YEAR1_DELIVERY_COUNT_MISMATCH';
  end if;
  if exists (select 1 from year1_elite e join app.brand_courses c on c.id = e.id
    where c.classification <> 'academic_module_offering'
      or c.title <> case e.code
        when 'ELT-BIO' then 'Biochemistry Fundamentals'
        when 'ELT-PHY' then 'Physiology Foundations'
        when 'ELT-HIS' then 'Histology Foundations'
        when 'ELT-CBG' then 'Cellular Biology and Genetics'
        when 'ELT-ANA' then 'Anatomy Foundations' end
      or (select count(*) from app.course_chapters ch where ch.brand_course_id = e.id and ch.brand_id = e.brand_id) <> 1
      or (select count(*) from app.course_lessons ls where ls.brand_course_id = e.id and ls.brand_id = e.brand_id)
        <> case e.code when 'ELT-BIO' then 10 when 'ELT-PHY' then 3 when 'ELT-HIS' then 9 when 'ELT-CBG' then 14 when 'ELT-ANA' then 13 end) then
    raise exception using errcode = 'P0001', message = 'YEAR1_ELITE_MANIFEST_MISMATCH';
  end if;
  if exists (select 1 from app.brand_courses c
    join app.educational_brands b on b.id = c.brand_id
    join app.academic_modules m on m.id = c.academic_module_id and m.academic_institution_id = c.academic_institution_id
    join app.academic_semesters s on s.id = m.academic_semester_id and s.semester_number = 1
    join app.academic_levels l on l.id = s.academic_level_id and l.level_number = 1
    where b.code in ('medway', 'elite', 'nexus')
      and not exists (select 1 from year1_shells d where d.id = c.id)
      and not exists (select 1 from year1_elite e where e.id = c.id)) then
    raise exception using errcode = 'P0001', message = 'YEAR1_UNEXPECTED_COURSES_PRESENT';
  end if;
end $$;
update app.course_lessons ls set status = 'published'
where ls.status = 'draft' and ls.id in (select id from year1_publish_lessons);
update app.course_chapters ch set status = 'published'
where ch.status = 'draft' and ch.id in (
  select md5('controlled-year1-chapter:' || id::text)::uuid from year1_shells
  union all select md5('elite-buc-course-chapter:' || code || ':lessons')::uuid from year1_elite);
update app.brand_courses c set status = 'published'
where c.status = 'draft' and (c.id in (select id from year1_shells) or c.id in (select id from year1_elite));

do $$
begin
  if (select count(*) from year1_publish_lessons p
      join app.course_lessons ls on ls.id = p.id and ls.status = 'published'
      join app.course_chapters ch on ch.id = ls.course_chapter_id and ch.brand_course_id = ls.brand_course_id
        and ch.brand_id = ls.brand_id and ch.status = 'published'
      join app.brand_courses c on c.id = ls.brand_course_id and c.brand_id = ls.brand_id and c.status = 'published') <> 147
    or (select count(*) from app.brand_courses c where c.status = 'published'
      and (c.id in (select id from year1_shells) or c.id in (select id from year1_elite))) <> 19 then
    raise exception using errcode = 'P0001', message = 'YEAR1_PUBLISHED_AGGREGATE_MISMATCH';
  end if;
end $$;
commit;
