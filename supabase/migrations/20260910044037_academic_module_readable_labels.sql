begin;

-- Keep canonical module codes stable for integration, but expose readable
-- labels for Admin catalogue/course-builder UX. These labels are display
-- aids, not a claim that the source code has been replaced.

with delta_semester_one as (
  select s.id as semester_id, i.id as institution_id
  from app.academic_institutions i
  join app.academic_levels l
    on l.academic_institution_id = i.id
   and l.level_number = 1
   and l.status = 'active'
  join app.academic_semesters s
    on s.academic_level_id = l.id
   and s.semester_number = 1
   and s.status = 'active'
  where i.normalized_code = 'delta'
    and i.status = 'active'
),
delta_only_modules(code, display_label, sort_order) as (
  values
    ('DELTA-ENG1', 'English 1', 98),
    ('DELTA-IT', 'Information Technology', 99)
)
update app.academic_modules m
set academic_institution_id = dso.institution_id,
    academic_semester_id = dso.semester_id,
    source_display_label = dom.display_label,
    sort_order = dom.sort_order
from delta_only_modules dom
cross join delta_semester_one dso
where m.code = dom.code
  and exists (
    select 1
    from app.academic_institutions current_i
    where current_i.id = m.academic_institution_id
      and current_i.normalized_code <> 'delta'
  )
  and not exists (
    select 1
    from app.academic_modules existing
    where existing.academic_institution_id = dso.institution_id
      and existing.normalized_code = upper(btrim(dom.code))
  );

with readable_labels(module_code, display_label) as (
  values
    ('1101 TSF', 'Tissue Structure & Function'),
    ('1102 ANA', 'Anatomy'),
    ('1103 CBG', 'Cell Biology & Genetics'),
    ('1104 BIO', 'Biochemistry'),
    ('1105 PMD', 'Professional Medical Development'),
    ('1106 ECX', 'Early Clinical Exposure'),
    ('1107 SIM', 'Simulation'),
    ('1208 IPP', 'Introduction to Physiology & Clinical Pharmacology'),
    ('1209 PAT', 'Pathology'),
    ('1210 MIC', 'Microbiology'),
    ('1211 PHE', 'Pharmacology'),
    ('1212 IMM', 'Immunology'),
    ('1213 SIM', 'Simulation'),
    ('1214 SBS', 'Social & Behavioural Sciences'),
    ('DELTA-ENG1', 'English 1'),
    ('DELTA-IT', 'Information Technology')
)
update app.academic_modules m
set source_display_label = rl.display_label
from readable_labels rl
where m.code = rl.module_code
  and m.source_display_label <> rl.display_label;

do $$
declare
  expected_labelled integer;
  actual_labelled integer;
  delta_only_wrong_count integer;
begin
  with readable_labels(module_code, display_label) as (
    values
      ('1101 TSF', 'Tissue Structure & Function'),
      ('1102 ANA', 'Anatomy'),
      ('1103 CBG', 'Cell Biology & Genetics'),
      ('1104 BIO', 'Biochemistry'),
      ('1105 PMD', 'Professional Medical Development'),
      ('1106 ECX', 'Early Clinical Exposure'),
      ('1107 SIM', 'Simulation'),
      ('1208 IPP', 'Introduction to Physiology & Clinical Pharmacology'),
      ('1209 PAT', 'Pathology'),
      ('1210 MIC', 'Microbiology'),
      ('1211 PHE', 'Pharmacology'),
      ('1212 IMM', 'Immunology'),
      ('1213 SIM', 'Simulation'),
      ('1214 SBS', 'Social & Behavioural Sciences'),
      ('DELTA-ENG1', 'English 1'),
      ('DELTA-IT', 'Information Technology')
  )
  select count(*)
  into expected_labelled
  from app.academic_modules m
  join readable_labels rl
    on rl.module_code = m.code;

  with readable_labels(module_code, display_label) as (
    values
      ('1101 TSF', 'Tissue Structure & Function'),
      ('1102 ANA', 'Anatomy'),
      ('1103 CBG', 'Cell Biology & Genetics'),
      ('1104 BIO', 'Biochemistry'),
      ('1105 PMD', 'Professional Medical Development'),
      ('1106 ECX', 'Early Clinical Exposure'),
      ('1107 SIM', 'Simulation'),
      ('1208 IPP', 'Introduction to Physiology & Clinical Pharmacology'),
      ('1209 PAT', 'Pathology'),
      ('1210 MIC', 'Microbiology'),
      ('1211 PHE', 'Pharmacology'),
      ('1212 IMM', 'Immunology'),
      ('1213 SIM', 'Simulation'),
      ('1214 SBS', 'Social & Behavioural Sciences'),
      ('DELTA-ENG1', 'English 1'),
      ('DELTA-IT', 'Information Technology')
  )
  select count(*)
  into actual_labelled
  from app.academic_modules m
  join readable_labels rl
    on rl.module_code = m.code
   and rl.display_label = m.source_display_label;

  select count(*)
  into delta_only_wrong_count
  from app.academic_modules m
  join app.academic_institutions i
    on i.id = m.academic_institution_id
  where m.code in ('DELTA-ENG1', 'DELTA-IT')
    and i.normalized_code <> 'delta';

  if expected_labelled > 0 and actual_labelled <> expected_labelled then
    raise exception 'academic module readable labels were not fully applied: expected %, got %',
      expected_labelled,
      actual_labelled;
  end if;

  if delta_only_wrong_count <> 0 then
    raise exception 'Delta-only modules remain outside Delta academic institution: %',
      delta_only_wrong_count;
  end if;
end $$;

commit;
