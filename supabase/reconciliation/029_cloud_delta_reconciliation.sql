begin;

-- Safe additive reconciliation for the already-seeded Cloud catalogue.
-- Existing rows are never deleted or overwritten; only NULL institution links
-- are completed and missing controlled rows are inserted.
insert into app.educational_brands (id, code, name, slug, status) values
  ('10000000-0000-4000-8000-000000000001','medway','Medway','medway','active'),
  ('10000000-0000-4000-8000-000000000002','elite','Elite','elite','active'),
  ('10000000-0000-4000-8000-000000000003','nexus','Nexus','nexus','active')
on conflict do nothing;

insert into app.academic_institutions (id, code, display_name, slug, status) values
  ('15000000-0000-4000-8000-000000000001','buc','BUC','buc','active'),
  ('15000000-0000-4000-8000-000000000002','delta','Delta University','delta','active')
on conflict do nothing;

insert into app.brand_academic_institution_access (id, brand_id, academic_institution_id, status) values
  ('16000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','15000000-0000-4000-8000-000000000001','active'),
  ('16000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000001','15000000-0000-4000-8000-000000000002','active'),
  ('16000000-0000-4000-8000-000000000003','10000000-0000-4000-8000-000000000002','15000000-0000-4000-8000-000000000001','active'),
  ('16000000-0000-4000-8000-000000000004','10000000-0000-4000-8000-000000000002','15000000-0000-4000-8000-000000000002','active'),
  ('16000000-0000-4000-8000-000000000005','10000000-0000-4000-8000-000000000003','15000000-0000-4000-8000-000000000001','active'),
  ('16000000-0000-4000-8000-000000000006','10000000-0000-4000-8000-000000000003','15000000-0000-4000-8000-000000000002','active')
on conflict do nothing;

insert into app.academic_levels (id, academic_institution_id, level_number, display_title, sort_order, status) values
  ('20000000-0000-4000-8000-000000000001','15000000-0000-4000-8000-000000000001',1,'Level 1',1,'active'),
  ('20000000-0000-4000-8000-000000000101','15000000-0000-4000-8000-000000000002',1,'Level 1',1,'active')
on conflict do nothing;

-- The old Cloud seed created one unscoped Level 1 and two semesters. Complete
-- that missing relationship only when it is still NULL.
update app.academic_levels l
set academic_institution_id = '15000000-0000-4000-8000-000000000001'::uuid
where l.academic_institution_id is null
  and l.level_number = 1
  and l.display_title = 'Level 1';

insert into app.academic_semesters (id, academic_level_id, semester_number, display_title, sort_order, status) values
  ('30000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000001',1,'Semester 1',1,'active'),
  ('30000000-0000-4000-8000-000000000002','20000000-0000-4000-8000-000000000001',2,'Semester 2',2,'active'),
  ('30000000-0000-4000-8000-000000000101','20000000-0000-4000-8000-000000000101',1,'Semester 1',1,'active'),
  ('30000000-0000-4000-8000-000000000102','20000000-0000-4000-8000-000000000101',2,'Semester 2',2,'active')
on conflict do nothing;

update app.academic_modules m
set academic_institution_id = '15000000-0000-4000-8000-000000000001'::uuid
from app.academic_semesters s
join app.academic_levels l on l.id = s.academic_level_id
where m.academic_semester_id = s.id
  and l.academic_institution_id = '15000000-0000-4000-8000-000000000001'::uuid
  and m.academic_institution_id is null;

insert into app.academic_modules (id, academic_semester_id, academic_institution_id, code, source_display_label, sort_order, review_status)
select md5('delta-shared-module:' || m.code)::uuid,
       case when s.semester_number = 1 then '30000000-0000-4000-8000-000000000101'::uuid else '30000000-0000-4000-8000-000000000102'::uuid end,
       '15000000-0000-4000-8000-000000000002'::uuid,
       m.code, m.source_display_label, m.sort_order, m.review_status
from app.academic_modules m
join app.academic_semesters s on s.id = m.academic_semester_id
join app.academic_levels l on l.id = s.academic_level_id
where l.academic_institution_id = '15000000-0000-4000-8000-000000000001'::uuid
on conflict do nothing;

insert into app.academic_modules (id, academic_semester_id, academic_institution_id, code, source_display_label, sort_order, review_status) values
  ('40000000-0000-4000-8000-000000000101','30000000-0000-4000-8000-000000000101','15000000-0000-4000-8000-000000000002','DELTA-ENG1','English 1',101,'unreviewed'),
  ('40000000-0000-4000-8000-000000000102','30000000-0000-4000-8000-000000000101','15000000-0000-4000-8000-000000000002','DELTA-IT','IT',102,'unreviewed')
on conflict do nothing;

with topic(module_code, topic_code, title, sort_order) as (values
  ('1104 BIO','biochemistry-01-carbohydrates','Carbohydrates',1),
  ('1104 BIO','biochemistry-02-lipids','Lipids',2),
  ('1104 BIO','biochemistry-03-amino-acids','Amino acids',3),
  ('1104 BIO','biochemistry-04-protein','Protein',4),
  ('1104 BIO','biochemistry-05-enzymes','Enzymes',5),
  ('1104 BIO','biochemistry-06-glycolysis','Glycolysis',6),
  ('1104 BIO','biochemistry-07-gluconeogenesis','Gluconeogenesis',7),
  ('1104 BIO','biochemistry-08-krebs-cycle','Energy metabolism — Krebs cycle',8),
  ('1104 BIO','biochemistry-09-beta-oxidation','Beta oxidation',9),
  ('1104 BIO','biochemistry-10-vitamins','Vitamins',10),
  ('1101 TSF','physiology-01-body-fluids-homeostasis','Body fluids and Homeostasis',1),
  ('1101 TSF','physiology-02-transport-cell-membrane','Transport across cell membrane',2),
  ('1101 TSF','physiology-03-nerve-action-potential','Nerve and action potential',3),
  ('1101 TSF','histology-01-microtechnique','Microtechnique',4),
  ('1101 TSF','histology-02-cell-part-1','The cell — Part 1',5),
  ('1101 TSF','histology-03-cell-part-2','The cell — Part 2',6),
  ('1101 TSF','histology-04-nucleus-cell-cycle','Nucleus and cell cycle',7),
  ('1101 TSF','histology-05-stem-cell','Stem cell',8),
  ('1101 TSF','histology-06-epithelium','Epithelium',9),
  ('1101 TSF','histology-07-connective-tissue','Connective tissue',10),
  ('1101 TSF','histology-08-cartilage','Cartilage',11),
  ('1101 TSF','histology-09-bone','Bone',12),
  ('1103 CBG','cbg-01-molecular-structure-function','Molecular structure and function',1),
  ('1103 CBG','cbg-02-dna-structure','DNA structure',2),
  ('1103 CBG','cbg-03-dna-replication','DNA replication',3),
  ('1103 CBG','cbg-04-dna-repair','DNA repair',4),
  ('1103 CBG','cbg-05-genetic-code','Genetic code',5),
  ('1103 CBG','cbg-06-telomeres','Telomeres',6),
  ('1103 CBG','cbg-07-transcription-part-1','Transcription — Part 1',7),
  ('1103 CBG','cbg-08-transcription-part-2','Transcription — Part 2',8),
  ('1103 CBG','cbg-09-translation-part-1','Translation — Part 1',9),
  ('1103 CBG','cbg-10-translation-part-2','Translation — Part 2',10),
  ('1103 CBG','cbg-11-translation-part-3','Translation — Part 3',11),
  ('1103 CBG','cbg-12-genetic-mutation','Genetic mutation',12),
  ('1103 CBG','cbg-13-biology-cancer','Biology of cancer',13),
  ('1103 CBG','cbg-14-regulation-gene-expression','Regulation of gene expression',14),
  ('1102 ANA','anatomy-01-anatomical-terminology','Anatomical terminology',1),
  ('1102 ANA','anatomy-02-skin-fascia','Skin and fascia',2),
  ('1102 ANA','anatomy-03-bone','Bone',3),
  ('1102 ANA','anatomy-04-joints','Joints',4),
  ('1102 ANA','anatomy-05-muscle','Muscle',5),
  ('1102 ANA','anatomy-06-respiratory-system','Respiratory system',6),
  ('1102 ANA','anatomy-07-cardiovascular-system','Cardiovascular system',7),
  ('1102 ANA','anatomy-08-urogenital-system','Urogenital system',8),
  ('1102 ANA','anatomy-09-digestive-system','Digestive system',9),
  ('1102 ANA','anatomy-10-embryology-part-1','Embryology — Part 1',10),
  ('1102 ANA','anatomy-11-embryology-part-2','Embryology — Part 2',11),
  ('1102 ANA','anatomy-12-embryology-part-3','Embryology — Part 3',12),
  ('1102 ANA','anatomy-13-embryology-part-4','Embryology — Part 4',13)
), targets as (
  select m.id, m.code
  from app.academic_modules m
  join app.academic_semesters s on s.id = m.academic_semester_id
  join app.academic_levels l on l.id = s.academic_level_id
  where l.academic_institution_id in ('15000000-0000-4000-8000-000000000001'::uuid,'15000000-0000-4000-8000-000000000002'::uuid)
)
insert into app.academic_module_chapters (id, academic_module_id, code, title, sort_order, status)
select md5('academic-module-chapter:' || t.id::text || ':' || x.topic_code)::uuid,
       t.id, x.topic_code, x.title, x.sort_order, 'active'
from targets t join topic x on x.module_code = t.code
on conflict do nothing;

-- Fail closed if the controlled Cloud catalogue is not complete.
do $$
begin
  if (select count(*) from app.educational_brands where code in ('medway','elite','nexus')) <> 3
     or (select count(*) from app.academic_institutions where code in ('buc','delta')) <> 2
     or (select count(*) from app.brand_academic_institution_access) <> 6
     or (select count(*) from app.academic_levels) <> 2
     or (select count(*) from app.academic_semesters) <> 4
     or (select count(*) from app.academic_modules) <> 30
     or (select count(*) from app.academic_modules where academic_institution_id = '15000000-0000-4000-8000-000000000002'::uuid) <> 16
     or (select count(*) from app.academic_module_chapters) <> 98
     or (select count(*) from app.academic_module_chapters c join app.academic_modules m on m.id = c.academic_module_id where m.academic_institution_id = '15000000-0000-4000-8000-000000000002'::uuid) <> 49 then
    raise exception using errcode = '23514', message = 'Controlled Delta catalogue reconciliation count mismatch';
  end if;
end $$;

commit;
