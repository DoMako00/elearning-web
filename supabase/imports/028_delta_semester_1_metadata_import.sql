begin;

create temporary table expected_delta_semester_1_resources_028 (
  id uuid primary key,
  module_code text not null,
  resource_key text not null unique,
  source_relative_path text not null unique,
  display_name text not null,
  file_format text not null,
  mime_type text not null,
  resource_classification text not null,
  distribution_review_status text not null,
  publication_state text not null,
  storage_object_path text null,
  source_modified_at timestamptz null,
  source_provider text not null,
  source_drive_file_id text not null unique,
  source_title text not null,
  source_file_size_bytes bigint not null,
  source_folder_path text not null,
  resource_type text not null,
  resource_category text not null,
  approval_state text not null,
  visibility_state text not null,
  manual_review_required boolean not null,
  approval_required boolean not null,
  student_publish_default boolean not null
) on commit drop;

insert into expected_delta_semester_1_resources_028 (
  id, module_code, resource_key, source_relative_path, display_name, file_format, mime_type,
  resource_classification, distribution_review_status, publication_state, storage_object_path, source_modified_at,
  source_provider, source_drive_file_id, source_title, source_file_size_bytes, source_folder_path,
  resource_type, resource_category, approval_state, visibility_state, manual_review_required, approval_required, student_publish_default
) values
  ('78000000-0000-4000-8000-000000000001','DELTA-ENG1','delta-s1-eng1-0001','Delta / Semester 1 / English 1 / Lectures / Lec 1 Medical suffix and prefix','Lec 1 Medical suffix and prefix','pdf','application/pdf','lecture','unreviewed','not_published',null,'2025-12-26T11:48:15.876Z','google_drive','1AwZov7euobSeC83DKZUz8UPyl0BYOjUW','Lec 1 Medical suffix and prefix',1571806,'Delta / Semester 1 / English 1 / Lectures','lecture_pdf','lecture','pending_review','draft',false,true,false),
  ('78000000-0000-4000-8000-000000000002','DELTA-ENG1','delta-s1-eng1-0002','Delta / Semester 1 / English 1 / Lectures / Lec 2 body parts','Lec 2 body parts','pdf','application/pdf','lecture','unreviewed','not_published',null,'2025-12-26T11:49:20.070Z','google_drive','11DtrBjps_yEwSfmkZxXhsACod_hbk7to','Lec 2 body parts',1190514,'Delta / Semester 1 / English 1 / Lectures','lecture_pdf','lecture','pending_review','draft',false,true,false),
  ('78000000-0000-4000-8000-000000000003','DELTA-ENG1','delta-s1-eng1-0003','Delta / Semester 1 / English 1 / Lectures / Lec 3 Circulatory sys, Nervous sys & Digestive sys.pdf','Lec 3 Circulatory sys, Nervous sys & Digestive sys.pdf','pdf','application/pdf','lecture','unreviewed','not_published',null,'2025-12-26T11:49:29.404Z','google_drive','1XPs0mR1gIatucwZb5jCM_VZE8IeTQVis','Lec 3 Circulatory sys, Nervous sys & Digestive sys.pdf',1544133,'Delta / Semester 1 / English 1 / Lectures','lecture_pdf','lecture','pending_review','draft',false,true,false),
  ('78000000-0000-4000-8000-000000000004','DELTA-ENG1','delta-s1-eng1-0004','Delta / Semester 1 / English 1 / Lectures / Lec 4 respiratory sys urinary sys musculoskeletal sys.pdf','Lec 4 respiratory sys urinary sys musculoskeletal sys.pdf','pdf','application/pdf','lecture','unreviewed','not_published',null,'2025-12-26T11:49:37.905Z','google_drive','1mV6rZY0Kqjg_wPpMKiWvySdrPHVT3h7T','Lec 4 respiratory sys urinary sys musculoskeletal sys.pdf',1416426,'Delta / Semester 1 / English 1 / Lectures','lecture_pdf','lecture','pending_review','draft',false,true,false),
  ('78000000-0000-4000-8000-000000000005','DELTA-ENG1','delta-s1-eng1-0005','Delta / Semester 1 / English 1 / Lectures / Lec 5 how to write a paragraph in handout','Lec 5 how to write a paragraph in handout','pdf','application/pdf','lecture','unreviewed','not_published',null,'2025-12-26T11:49:57.059Z','google_drive','1GHnMttFSVFc-JXuOhIxnxet-nlgg6Cbk','Lec 5 how to write a paragraph in handout',1554015,'Delta / Semester 1 / English 1 / Lectures','lecture_pdf','lecture','pending_review','draft',false,true,false),
  ('78000000-0000-4000-8000-000000000006','DELTA-ENG1','delta-s1-eng1-0006','Delta / Semester 1 / English 1 / Lectures / Lec 6 health problems vocab and lay terms - Copy.pdf','Lec 6 health problems vocab and lay terms - Copy.pdf','pdf','application/pdf','lecture','unreviewed','not_published',null,'2025-12-26T11:50:10.881Z','google_drive','1COlppmcCUfVgOqq9MnOsbbTdPywxC58-','Lec 6 health problems vocab and lay terms - Copy.pdf',1254745,'Delta / Semester 1 / English 1 / Lectures','lecture_pdf','lecture','pending_review','draft',false,true,false),
  ('78000000-0000-4000-8000-000000000007','DELTA-ENG1','delta-s1-eng1-0007','Delta / Semester 1 / English 1 / Lectures / Lec 7 word formation nouns','Lec 7 word formation nouns','pdf','application/pdf','lecture','unreviewed','not_published',null,'2025-12-26T11:50:22.107Z','google_drive','1JKF6qD61WXwtx_aehhclumGh7dLSxEXV','Lec 7 word formation nouns',1240390,'Delta / Semester 1 / English 1 / Lectures','lecture_pdf','lecture','pending_review','draft',false,true,false),
  ('78000000-0000-4000-8000-000000000008','DELTA-ENG1','delta-s1-eng1-0008','Delta / Semester 1 / English 1 / Lectures / Lec 8 Abbreviations','Lec 8 Abbreviations','pdf','application/pdf','lecture','unreviewed','not_published',null,'2025-12-26T11:50:30.951Z','google_drive','1TKOxEqakpnMvMK-KU-dppfCxnL0qQ4Vj','Lec 8 Abbreviations',1234905,'Delta / Semester 1 / English 1 / Lectures','lecture_pdf','lecture','pending_review','draft',false,true,false),
  ('78000000-0000-4000-8000-000000000009','DELTA-ENG1','delta-s1-eng1-0009','Delta / Semester 1 / English 1 / Records / L1 Medical suffix and prefix','L1 Medical suffix and prefix','binary','audio/mpeg','recorded_lecture','restricted','not_published',null,'2025-11-26T13:21:54.370Z','google_drive','10Ro1-R8iAkdSDpYPf3SoUmQWKUS-TQOY','L1 Medical suffix and prefix',55944000,'Delta / Semester 1 / English 1 / Records','recording','recording','pending_review','restricted',false,true,false),
  ('78000000-0000-4000-8000-000000000010','DELTA-ENG1','delta-s1-eng1-0010','Delta / Semester 1 / English 1 / Records / L2 Procedures','L2 Procedures','m4a','audio/mp4','recorded_lecture','restricted','not_published',null,'2025-11-26T13:21:47.263Z','google_drive','1yBFQqJbaRWhhhCoOyrafKvajcUDklChl','L2 Procedures',20423233,'Delta / Semester 1 / English 1 / Records','video','recording','pending_review','draft',false,true,false),
  ('78000000-0000-4000-8000-000000000011','DELTA-ENG1','delta-s1-eng1-0011','Delta / Semester 1 / English 1 / Records / L3 Body Parts','L3 Body Parts','binary','audio/mpeg','recorded_lecture','restricted','not_published',null,'2025-11-26T13:21:42.058Z','google_drive','16qZkEMZ8kH5qc733o8vTto_v4EDP4438','L3 Body Parts',43601600,'Delta / Semester 1 / English 1 / Records','recording','recording','pending_review','restricted',false,true,false),
  ('78000000-0000-4000-8000-000000000012','DELTA-ENG1','delta-s1-eng1-0012','Delta / Semester 1 / English 1 / Records / L6 How to write a paragraph in handout','L6 How to write a paragraph in handout','m4a','audio/x-m4a','recorded_lecture','restricted','not_published',null,'2025-11-26T13:22:27.563Z','google_drive','1jifyYiSYkZ73LefCA9mFi9aGwUr-SmSS','L6 How to write a paragraph in handout',15534140,'Delta / Semester 1 / English 1 / Records','recording','recording','pending_review','restricted',false,true,false),
  ('78000000-0000-4000-8000-000000000013','DELTA-ENG1','delta-s1-eng1-0013','Delta / Semester 1 / English 1 / Records / L7 word formation nouns','L7 word formation nouns','m4a','audio/x-m4a','recorded_lecture','restricted','not_published',null,'2025-12-26T11:51:14.173Z','google_drive','1hbRYe02vpz8V9vYiQ-XZkJ13vaIUwGlj','L7 word formation nouns',11054484,'Delta / Semester 1 / English 1 / Records','recording','recording','pending_review','restricted',false,true,false),
  ('78000000-0000-4000-8000-000000000014','DELTA-ENG1','delta-s1-eng1-0014','Delta / Semester 1 / English 1 / Summaries / Lec 1. .pdf','Lec 1. .pdf','pdf','application/pdf','revision','unreviewed','not_published',null,'2025-10-10T16:21:12.397Z','google_drive','1ZLTxF1TTc8XCqHXgtlc1w3_mNq9c5Zq4','Lec 1. .pdf',8661911,'Delta / Semester 1 / English 1 / Summaries','summary_pdf','summary','pending_review','draft',false,true,false),
  ('78000000-0000-4000-8000-000000000015','DELTA-ENG1','delta-s1-eng1-0015','Delta / Semester 1 / English 1 / Summaries / Lec 3 pdf','Lec 3 pdf','pdf','application/pdf','revision','unreviewed','not_published',null,'2025-10-19T06:43:42.909Z','google_drive','1iaZpJ7vJeJq0m9VIEG2O4cZk18Ghb5ZR','Lec 3 pdf',92442,'Delta / Semester 1 / English 1 / Summaries','summary_pdf','summary','pending_review','draft',false,true,false),
  ('78000000-0000-4000-8000-000000000016','DELTA-ENG1','delta-s1-eng1-0016','Delta / Semester 1 / English 1 / Summaries / Lecture 1 pdf','Lecture 1 pdf','pdf','application/pdf','revision','unreviewed','not_published',null,'2025-10-19T06:43:58.803Z','google_drive','14ubnU6Ye4wBl24R6ez1VDVKjnJLxJkVG','Lecture 1 pdf',310894,'Delta / Semester 1 / English 1 / Summaries','summary_pdf','summary','pending_review','draft',false,true,false),
  ('78000000-0000-4000-8000-000000000017','DELTA-ENG1','delta-s1-eng1-0017','Delta / Semester 1 / English 1 / Summaries / Lecture 3 pdf','Lecture 3 pdf','pdf','application/pdf','revision','unreviewed','not_published',null,'2025-10-19T19:46:47.806Z','google_drive','1ougOIP-yHA9kVnNHWl-4F0V3Iot-SDR_','Lecture 3 pdf',896286,'Delta / Semester 1 / English 1 / Summaries','summary_pdf','summary','pending_review','draft',false,true,false),
  ('78000000-0000-4000-8000-000000000018','DELTA-IT','delta-s1-it-0001','Delta / Semester 1 / IT / Lectures / Lec 1-3 Introduction to IT','Lec 1-3 Introduction to IT','ppt','application/vnd.ms-powerpoint','lecture','unreviewed','not_published',null,'2025-12-26T11:41:52.808Z','google_drive','1CnVx9MXRCDv6tQ2P2mxd0NSdmyFPwXsR','Lec 1-3 Introduction to IT',8637440,'Delta / Semester 1 / IT / Lectures','slide_deck','lecture','pending_review','draft',false,true,false),
  ('78000000-0000-4000-8000-000000000019','DELTA-IT','delta-s1-it-0002','Delta / Semester 1 / IT / Lectures / Lec 4 Applications','Lec 4 Applications','ppt','application/vnd.ms-powerpoint','lecture','unreviewed','not_published',null,'2025-12-26T11:42:52.832Z','google_drive','1Ew9v4oF7Y6pw1BLfqAP_EG3z2EwbrF0k','Lec 4 Applications',34940928,'Delta / Semester 1 / IT / Lectures','slide_deck','lecture','pending_review','draft',false,true,false),
  ('78000000-0000-4000-8000-000000000020','DELTA-IT','delta-s1-it-0003','Delta / Semester 1 / IT / Lectures / Lec 5 Operating System','Lec 5 Operating System','ppt','application/vnd.ms-powerpoint','lecture','unreviewed','not_published',null,'2025-12-26T11:38:05.090Z','google_drive','1wWIYmEiYOkIzJa1o6yXDKLIqsKPN6GP6','Lec 5 Operating System',5285888,'Delta / Semester 1 / IT / Lectures','slide_deck','lecture','pending_review','draft',false,true,false),
  ('78000000-0000-4000-8000-000000000021','DELTA-IT','delta-s1-it-0004','Delta / Semester 1 / IT / Lectures / Lec 6 Flowchart','Lec 6 Flowchart','pptx','application/vnd.openxmlformats-officedocument.presentationml.presentation','lecture','unreviewed','not_published',null,'2025-12-26T11:39:06.428Z','google_drive','1MFMKUxfWj83wMqBtPxCIdWhVyr3EGn_1','Lec 6 Flowchart',198105,'Delta / Semester 1 / IT / Lectures','slide_deck','lecture','pending_review','draft',false,true,false),
  ('78000000-0000-4000-8000-000000000022','DELTA-IT','delta-s1-it-0005','Delta / Semester 1 / IT / Lectures / Lec 7 Network and Internet','Lec 7 Network and Internet','ppt','application/vnd.ms-powerpoint','lecture','unreviewed','not_published',null,'2025-12-26T11:39:52.257Z','google_drive','1bz7EWU7PywvC9cs5Cg0mxDsO3o1DVp1x','Lec 7 Network and Internet',7785472,'Delta / Semester 1 / IT / Lectures','slide_deck','lecture','pending_review','draft',false,true,false),
  ('78000000-0000-4000-8000-000000000023','DELTA-IT','delta-s1-it-0006','Delta / Semester 1 / IT / Lectures / Lec 8 Introduction to programming','Lec 8 Introduction to programming','pptx','application/vnd.openxmlformats-officedocument.presentationml.presentation','lecture','unreviewed','not_published',null,'2025-12-26T11:41:10.034Z','google_drive','1pLkEhqEh-QYabPdUBv-4nlqI0lIK8lL7','Lec 8 Introduction to programming',1487875,'Delta / Semester 1 / IT / Lectures','slide_deck','lecture','pending_review','draft',false,true,false),
  ('78000000-0000-4000-8000-000000000024','DELTA-IT','delta-s1-it-0007','Delta / Semester 1 / IT / Records / Lecture 1 Introduction to IT.m4a','Lecture 1 Introduction to IT.m4a','m4a','audio/mp4','recorded_lecture','restricted','not_published',null,'2025-11-10T12:35:44.921Z','google_drive','1F-IHpDeTJGWMPCkaOTRmpgwO-Fiyoxdj','Lecture 1 Introduction to IT.m4a',14611167,'Delta / Semester 1 / IT / Records','video','recording','pending_review','draft',false,true,false),
  ('78000000-0000-4000-8000-000000000025','DELTA-IT','delta-s1-it-0008','Delta / Semester 1 / IT / Records / Lecture 2 Introduction to IT.m4a','Lecture 2 Introduction to IT.m4a','m4a','audio/mp4','recorded_lecture','restricted','not_published',null,'2025-11-10T12:35:55.473Z','google_drive','1yI0M1kCr9Qa4VduY5FL3uYy2--ajhCtP','Lecture 2 Introduction to IT.m4a',86173060,'Delta / Semester 1 / IT / Records','video','recording','pending_review','draft',false,true,false),
  ('78000000-0000-4000-8000-000000000026','DELTA-IT','delta-s1-it-0009','Delta / Semester 1 / IT / Records / Lecture 3 introduction to IT.m4a','Lecture 3 introduction to IT.m4a','m4a','audio/x-m4a','recorded_lecture','restricted','not_published',null,'2025-11-10T12:36:11.567Z','google_drive','1QtgqRgd4GJjUUhl_VNb8MuX4qHMzig75','Lecture 3 introduction to IT.m4a',23436546,'Delta / Semester 1 / IT / Records','recording','recording','pending_review','restricted',false,true,false),
  ('78000000-0000-4000-8000-000000000027','DELTA-IT','delta-s1-it-0010','Delta / Semester 1 / IT / Records / Lecture 4 Introduction to IT.m4a','Lecture 4 Introduction to IT.m4a','m4a','audio/x-m4a','recorded_lecture','restricted','not_published',null,'2025-10-24T09:30:28.146Z','google_drive','12WmAU2_7Qc4YTKJNW4hOiz2uovu9BAlb','Lecture 4 Introduction to IT.m4a',13034676,'Delta / Semester 1 / IT / Records','recording','recording','pending_review','restricted',false,true,false),
  ('78000000-0000-4000-8000-000000000028','DELTA-IT','delta-s1-it-0011','Delta / Semester 1 / IT / Summaries / Lectures 1,2,3 pdf','Lectures 1,2,3 pdf','pdf','application/pdf','revision','unreviewed','not_published',null,'2025-10-19T17:47:00.045Z','google_drive','1wHO863i1k_bwahQfcw-wN_F1r9lhohoP','Lectures 1,2,3 pdf',86252,'Delta / Semester 1 / IT / Summaries','summary_pdf','summary','pending_review','draft',false,true,false);

do $$
begin
  if (select count(*) from expected_delta_semester_1_resources_028) <> 28 then
    raise exception using errcode = '23514', message = 'Prompt 028 Delta manifest cardinality mismatch.';
  end if;

  if exists (
    select 1
    from expected_delta_semester_1_resources_028 e
    join app.academic_module_resources r
      on r.id = e.id
      or r.resource_key = e.resource_key
      or r.source_relative_path = e.source_relative_path
      or r.source_drive_file_id = e.source_drive_file_id
    where (r.resource_key, r.source_relative_path, r.display_name, r.file_format, r.mime_type,
           r.resource_classification, r.distribution_review_status, r.publication_state,
           r.storage_object_path, r.source_provider, r.source_drive_file_id, r.source_title,
           r.source_file_size_bytes, r.source_folder_path, r.resource_type, r.resource_category,
           r.approval_state, r.visibility_state, r.manual_review_required, r.approval_required,
           r.student_publish_default)
          is distinct from
          (e.resource_key, e.source_relative_path, e.display_name, e.file_format, e.mime_type,
           e.resource_classification, e.distribution_review_status, e.publication_state,
           e.storage_object_path, e.source_provider, e.source_drive_file_id, e.source_title,
           e.source_file_size_bytes, e.source_folder_path, e.resource_type, e.resource_category,
           e.approval_state, e.visibility_state, e.manual_review_required, e.approval_required,
           e.student_publish_default)
  ) then
    raise exception using errcode = '23514', message = 'Prompt 028 Delta import conflict.';
  end if;
end;
$$;

insert into app.academic_module_resources (
  id, academic_module_id, resource_key, source_relative_path, display_name, file_format, mime_type,
  resource_classification, distribution_review_status, publication_state, storage_object_path,
  source_modified_at, source_provider, source_drive_file_id, source_title, source_file_size_bytes,
  source_folder_path, resource_type, resource_category, approval_state, visibility_state,
  manual_review_required, approval_required, student_publish_default
)
select
  e.id, m.id, e.resource_key, e.source_relative_path, e.display_name, e.file_format, e.mime_type,
  e.resource_classification, e.distribution_review_status, e.publication_state, e.storage_object_path,
  e.source_modified_at, e.source_provider, e.source_drive_file_id, e.source_title, e.source_file_size_bytes,
  e.source_folder_path, e.resource_type, e.resource_category, e.approval_state, e.visibility_state,
  e.manual_review_required, e.approval_required, e.student_publish_default
from expected_delta_semester_1_resources_028 e
join app.academic_modules m on m.code = e.module_code
join app.academic_semesters s on s.id = m.academic_semester_id and s.semester_number = 1
join app.academic_levels l on l.id = s.academic_level_id and l.level_number = 1
join app.academic_institutions i on i.id = l.academic_institution_id and i.code = 'delta'
on conflict do nothing;

commit;
