begin;

-- Controlled Elite delivery seed for BUC Level 1 / Semester 1 medical modules.
-- Creates draft commercial course shells and lesson titles only.
-- Does not upload files, publish releases, grant student access, or create
-- payment/access entitlements.

do $$
begin
  if not exists (select 1 from app.educational_brands where code = 'elite' and status = 'active') then
    raise exception using errcode = '23514', message = 'Elite brand prerequisite is missing.';
  end if;

  if not exists (select 1 from app.academic_institutions where code = 'buc' and status = 'active') then
    raise exception using errcode = '23514', message = 'BUC academic institution prerequisite is missing.';
  end if;

  if (
    select count(*)
    from app.academic_modules m
    join app.academic_institutions i
      on i.id = m.academic_institution_id
    where i.code = 'buc'
      and m.code in ('1101 TSF', '1102 ANA', '1103 CBG', '1104 BIO')
  ) <> 4 then
    raise exception using errcode = '23514', message = 'Required BUC modules are missing.';
  end if;
end $$;

with desired_courses(course_code, course_title, module_code) as (values
  ('ELT-BIO', 'Biochemistry Fundamentals', '1104 BIO'),
  ('ELT-PHY', 'Physiology Foundations', '1101 TSF'),
  ('ELT-HIS', 'Histology Foundations', '1101 TSF'),
  ('ELT-CBG', 'Cellular Biology and Genetics', '1103 CBG'),
  ('ELT-ANA', 'Anatomy Foundations', '1102 ANA')
), resolved as (
  select
    md5('elite-buc-course:' || dc.course_code)::uuid as course_id,
    b.id as brand_id,
    i.id as academic_institution_id,
    m.id as academic_module_id,
    dc.course_code,
    dc.course_title
  from desired_courses dc
  join app.educational_brands b
    on b.code = 'elite'
   and b.status = 'active'
  join app.academic_institutions i
    on i.code = 'buc'
   and i.status = 'active'
  join app.academic_modules m
    on m.academic_institution_id = i.id
   and m.code = dc.module_code
)
insert into app.brand_courses (
  id,
  brand_id,
  academic_institution_id,
  academic_module_id,
  code,
  title,
  classification,
  status
)
select
  course_id,
  brand_id,
  academic_institution_id,
  academic_module_id,
  course_code,
  course_title,
  'academic_module_offering',
  'draft'
from resolved
on conflict (brand_id, code) do nothing;

with elite_courses as (
  select c.id as course_id, c.brand_id, c.code
  from app.brand_courses c
  join app.educational_brands b
    on b.id = c.brand_id
  where b.code = 'elite'
    and c.code in ('ELT-BIO','ELT-PHY','ELT-HIS','ELT-CBG','ELT-ANA')
)
insert into app.course_chapters (
  id,
  brand_course_id,
  brand_id,
  title,
  sort_order,
  status
)
select
  md5('elite-buc-course-chapter:' || code || ':lessons')::uuid,
  course_id,
  brand_id,
  'Lessons',
  1,
  'draft'
from elite_courses
on conflict do nothing;

with desired_lessons(course_code, lesson_title, sort_order) as (values
  ('ELT-BIO', 'Carbohydrates', 1),
  ('ELT-BIO', 'Lipids', 2),
  ('ELT-BIO', 'Amino acids', 3),
  ('ELT-BIO', 'Protein', 4),
  ('ELT-BIO', 'Enzymes', 5),
  ('ELT-BIO', 'Glycolysis', 6),
  ('ELT-BIO', 'Gluconeogenesis', 7),
  ('ELT-BIO', 'Energy metabolism — Krebs cycle', 8),
  ('ELT-BIO', 'Beta oxidation', 9),
  ('ELT-BIO', 'Vitamins', 10),
  ('ELT-PHY', 'Body fluids and homeostasis', 1),
  ('ELT-PHY', 'Transport across cell membrane', 2),
  ('ELT-PHY', 'Nerve and action potential', 3),
  ('ELT-HIS', 'Microtechnique', 1),
  ('ELT-HIS', 'The cell — Part 1', 2),
  ('ELT-HIS', 'The cell — Part 2', 3),
  ('ELT-HIS', 'Nucleus and cell cycle', 4),
  ('ELT-HIS', 'Stem cell', 5),
  ('ELT-HIS', 'Epithelium', 6),
  ('ELT-HIS', 'Connective tissue', 7),
  ('ELT-HIS', 'Cartilage', 8),
  ('ELT-HIS', 'Bone', 9),
  ('ELT-CBG', 'Molecular structure and function', 1),
  ('ELT-CBG', 'DNA structure', 2),
  ('ELT-CBG', 'DNA replication', 3),
  ('ELT-CBG', 'DNA repair', 4),
  ('ELT-CBG', 'Genetic code', 5),
  ('ELT-CBG', 'Telomeres', 6),
  ('ELT-CBG', 'Transcription — Part 1', 7),
  ('ELT-CBG', 'Transcription — Part 2', 8),
  ('ELT-CBG', 'Translation — Part 1', 9),
  ('ELT-CBG', 'Translation — Part 2', 10),
  ('ELT-CBG', 'Translation — Part 3', 11),
  ('ELT-CBG', 'Genetic mutation', 12),
  ('ELT-CBG', 'Biology of cancer', 13),
  ('ELT-CBG', 'Regulation of gene expression', 14),
  ('ELT-ANA', 'Anatomical terminology', 1),
  ('ELT-ANA', 'Skin and fascia', 2),
  ('ELT-ANA', 'Bone', 3),
  ('ELT-ANA', 'Joints', 4),
  ('ELT-ANA', 'Muscle', 5),
  ('ELT-ANA', 'Respiratory system', 6),
  ('ELT-ANA', 'Cardiovascular system', 7),
  ('ELT-ANA', 'Urogenital system', 8),
  ('ELT-ANA', 'Digestive system', 9),
  ('ELT-ANA', 'Embryology — Part 1', 10),
  ('ELT-ANA', 'Embryology — Part 2', 11),
  ('ELT-ANA', 'Embryology — Part 3', 12),
  ('ELT-ANA', 'Embryology — Part 4', 13)
), resolved_lessons as (
  select
    md5('elite-buc-course-lesson:' || dl.course_code || ':' || dl.sort_order::text || ':' || lower(dl.lesson_title))::uuid as lesson_id,
    ch.id as course_chapter_id,
    c.id as brand_course_id,
    c.brand_id,
    dl.lesson_title,
    dl.sort_order
  from desired_lessons dl
  join app.brand_courses c
    on c.code = dl.course_code
  join app.educational_brands b
    on b.id = c.brand_id
   and b.code = 'elite'
  join app.course_chapters ch
    on ch.brand_course_id = c.id
   and ch.brand_id = c.brand_id
   and ch.sort_order = 1
)
insert into app.course_lessons (
  id,
  course_chapter_id,
  brand_course_id,
  brand_id,
  title,
  sort_order,
  status
)
select
  lesson_id,
  course_chapter_id,
  brand_course_id,
  brand_id,
  lesson_title,
  sort_order,
  'draft'
from resolved_lessons
on conflict do nothing;

do $$
begin
  if (
    select count(*)
    from app.brand_courses c
    join app.educational_brands b
      on b.id = c.brand_id
    join app.academic_institutions i
      on i.id = c.academic_institution_id
    where b.code = 'elite'
      and i.code = 'buc'
      and c.code in ('ELT-BIO','ELT-PHY','ELT-HIS','ELT-CBG','ELT-ANA')
  ) <> 5 then
    raise exception using errcode = '23514', message = 'Elite BUC course seed count mismatch.';
  end if;

  if (
    select count(*)
    from app.course_chapters ch
    join app.brand_courses c
      on c.id = ch.brand_course_id
    join app.educational_brands b
      on b.id = c.brand_id
    where b.code = 'elite'
      and c.code in ('ELT-BIO','ELT-PHY','ELT-HIS','ELT-CBG','ELT-ANA')
  ) <> 5 then
    raise exception using errcode = '23514', message = 'Elite BUC course chapter seed count mismatch.';
  end if;

  if (
    select count(*)
    from app.course_lessons ls
    join app.brand_courses c
      on c.id = ls.brand_course_id
    join app.educational_brands b
      on b.id = c.brand_id
    where b.code = 'elite'
      and c.code in ('ELT-BIO','ELT-PHY','ELT-HIS','ELT-CBG','ELT-ANA')
  ) <> 49 then
    raise exception using errcode = '23514', message = 'Elite BUC lesson seed count mismatch.';
  end if;
end $$;

commit;
