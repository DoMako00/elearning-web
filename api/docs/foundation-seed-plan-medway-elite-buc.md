# Prompt 49 - Controlled Foundation Seed Plan

Status: the approved Prompt 50 controlled staging seed completed successfully. The original planning rationale and non-executable manifest below remain the source authority; see [the sanitized staging apply report](foundation-seed-staging-apply-report.md) for the applied 77-row result. This document is not an executable seed artifact.

No database connection, staging read, seed execution, migration, executable seed file, runtime change, frontend change, production access, push, or deployment is part of Prompt 49.

## 1. Evidence boundary

The plan is grounded in the applied M1/M2 schema definitions and the connected Google Drive source folder:

`https://drive.google.com/drive/folders/1UGaROPkd9OLw4egnjSIAxc6OEJPtoYEK`

The folder contains `Academic Advising/Med departments programs.pdf`, a 13-page School of Medicine program/study-plan document. Its study-plan tables explicitly identify Badr University in Cairo, the School of Medicine, the Bachelor of Medicine and Surgery program, five academic levels, ten semesters, and the Phase I/Phase II split. The tables provide coded module titles and semester placement.

The connected folder exposes `Academic Advising`, `Level 1`, `Level 2`, `Level 3`, `Extra Resources`, `Basic Life Support Course`, and `Incision Academy`. Level 1-3 semester folders contain many coded module folders, which corroborates the study-plan structure. Levels 4-5 were not present as top-level folders in the observed listing. Folder names and supplementary-area names are corroborating context, not sufficient evidence by themselves for a canonical module title, brand course, or instructor.

### Evidence classification

| Evidence class | Meaning in this plan |
|---|---|
| `confirmed_source` | Directly stated by the cited PDF table or the reviewed repository schema. |
| `owner_required` | The concept may be valid, but product ownership, brand assignment, or lifecycle must be approved before seeding. |
| `source_missing` | The required identity, code, title, placement, or relationship is not available from the inspected sources. |
| `excluded` | Outside this foundation seed, regardless of whether it may be valid later. |

## 2. Prompt 50 recommendation

Prompt 50 should seed only the shared foundation reference set:

- exactly two educational brands: Medway and Elite;
- five BUC Medicine academic levels;
- ten BUC Medicine academic semesters;
- 60 explicitly coded and titled academic modules from the study-plan tables;
- no instructors, brand-instructor associations, brand courses, or course-instructor assignments.

The formal PDF lists `PDM1105 Professional Development` in Level 1, First Semester, but the connected Drive folder is named `1105 PMD`. Because the two source representations disagree, `PDM1105` is deferred until the owner confirms the canonical code. The following are not rows in the 60-module recommendation because they have no usable academic module code or are placeholders: `UNI -1`, `UNI -2`, unnamed elective requirements, faculty electives, and `---` entries.

Academic reference rows do not create enrollment, access, pricing, content visibility, instructor ownership, or student identity.

## 3. Exact schema and legal values

These are planning columns copied from the reviewed M1/M2 schema. `created_at` and `updated_at` remain database-managed fields in Prompt 50 and are not natural-key fields.

| Table | Columns relevant to the plan | Legal values / constraints |
|---|---|---|
| `app.educational_brands` | `id`, `code`, `name`, `slug`, `status` | `code` is lowercase-format text; `code` and `slug` are unique; status `active` or `inactive`. |
| `app.academic_levels` | `id`, `level_number`, `display_name`, `sort_order`, `status` | Positive level/sort numbers; level number and sort order unique; status `active` or `inactive`. |
| `app.academic_semesters` | `id`, `level_id`, `semester_number`, `display_name`, `phase`, `sort_order`, `status` | Positive numbers; semester number unique; `(level_id, sort_order)` unique; phase `phase_i` or `phase_ii`; status `active` or `inactive`. |
| `app.academic_modules` | `id`, `semester_id`, `module_code`, `title`, `sort_order`, `status` | Non-empty code/title; module code unique; `(semester_id, sort_order)` unique; status `active` or `inactive`. |
| `app.instructors` | `id`, `display_name`, `professional_title`, `status` | Display name required; status `active` or `inactive`. |
| `app.brand_instructors` | `id`, `brand_id`, `instructor_id`, `status` | Both parents required; `(brand_id, instructor_id)` unique; status `active` or `inactive`. |
| `app.brand_courses` | `id`, `brand_id`, `academic_module_id`, `course_code`, `title`, `course_scope`, `status` | Brand and code required; scope `curriculum` or `standalone`; curriculum requires a module; status `draft`, `published`, or `archived`; same brand may have multiple module courses. |
| `app.course_instructors` | `id`, `course_id`, `brand_id`, `instructor_id`, `status` | Composite same-brand foreign keys; `(course_id, instructor_id)` unique; status `active` or `inactive`. |

## 4. Natural keys and deterministic identity

Natural keys are manifest labels only; no natural-key column is added to the schema.

| Domain | Natural-key convention |
|---|---|
| Brands | `medway`, `elite` |
| Levels | `buc-medicine-level-1` through `buc-medicine-level-5` |
| Semesters | `buc-medicine-semester-1` through `buc-medicine-semester-10` |
| Modules | `buc-medicine-module-<module_code>`, only for an explicitly sourced code |
| Instructors | Deferred until a person name is source-confirmed and owner-approved. |
| Brand courses | Deferred until a brand, course code, title, scope, lifecycle, and owner decision are confirmed. |

Prompt 50 uses the following locked, deterministic UUIDv5 derivation for every approved foundation row. The namespace is the standard DNS UUIDv5 namespace, `6ba7b810-9dad-11d1-80b4-00c04fd430c8`; the name is the UTF-8 byte sequence `elearning.foundation.staging.v1/<natural-key>`. The natural keys are the brand, level, semester, and approved-module keys in the tables below. PDM1105 is excluded from this derivation because it is not an approved manifest row. Prompt 50 must generate the 77 literals once outside the database, verify that they are unique, and place only the reviewed literals in its controlled staging seed artifact and sanitized apply report. A matching natural key with a different ID is a conflict, not an exact match.

The literals are not generated by runtime and are not included in Prompt 49 because this document is a plan rather than an executable manifest. Every level, semester, and module reference must point to the reviewed literal for its parent.

The future apply should be guarded and idempotent: first confirm the target contains zero rows or exact manifest-equivalent rows; abort on any same-natural-key/different-value conflict; then write only approved rows inside one transaction. A later re-run requires the same explicit staging authorization and exact-value preflight. No silent corrective overwrite is permitted.

## 5. Source evidence register

The module rows below are individually supported by the PDF study-plan tables. PDF page references use the one-based physical PDF page and the table heading where available.

| Entity / candidate | Proposed value | Source location | What the source supports | Confidence | Decision |
|---|---|---|---|---|---|
| Educational brand | `medway` / Medway | M1 schema notes; Prompt 43-48 boundary docs | Medway is a canonical educational brand under the platform. | confirmed_source + owner boundary | `include_in_prompt_50` |
| Educational brand | `elite` / Elite | M1 schema notes; Prompt 43-48 boundary docs | Elite is a canonical educational brand under the platform. | confirmed_source + owner boundary | `include_in_prompt_50` |
| BUC curriculum | Levels 1-5 | PDF p. 5-13, study-plan headings | The study plan is divided into five levels. | confirmed_source | `include_in_prompt_50` |
| BUC curriculum | Semesters 1-10 | PDF p. 4, program description and p. 5-13 tables | The program contains ten semesters, with two semesters per level. | confirmed_source | `include_in_prompt_50` |
| Phase mapping | Semesters 1-5 = `phase_i`; 6-10 = `phase_ii` | PDF p. 4, program description | The program divides study into semesters 1-5 and 6-10. | confirmed_source | `include_in_prompt_50` |
| Module | Every coded row in the module manifest below except PDM1105 | PDF p. 5-13, study-plan tables; corroborating Level 1-3 Drive folders | Code, title, and semester placement are explicitly printed; Drive folders corroborate many code prefixes. | confirmed_source | `include_in_prompt_50` |
| Module | `PDM1105` in PDF / `1105 PMD` Drive folder | PDF p. 5, Level 1 - First Semester; Drive `Level 1/Semester 1/1105 PMD` | The formal PDF prints `PDM1105 Professional Development`, while the connected Drive folder uses the transposed label `1105 PMD`. | conflicting_source | `defer_source_missing` |
| Module | `UNI -1`, `UNI -2` | PDF p. 7, Level 2 - First/Second Semester | These are university requirements without a stable academic module code. | source-supported but not safe as M2 module rows | `defer_source_missing` |
| Module | Unnamed/elective/faculty elective rows | PDF p. 7-13 | Placeholder or elective labels lack a stable code/title suitable for the M2 module contract. | source-supported concept, incomplete identity | `defer_source_missing` |
| Module | Extra Resources | Connected Drive `Extra Resources` folder | The folder contains reference books, but no evidence proves academic-module status or semester placement. | source_missing | `defer_source_missing` |
| Brand course | Basic Life Support Course | Connected Drive `Basic Life Support Course` folder | The folder contains supplementary PDFs, but no source confirms brand, course code, scope, or lifecycle. | source_missing + owner_required | `defer_owner_decision` |
| Brand course | Incision Academy | Connected Drive `Incision Academy` folder | The folder contains supplementary materials, but no source confirms brand, course code, scope, or lifecycle. | source_missing + owner_required | `defer_owner_decision` |
| Instructor | Any person identity | No accessible instructor source | No source-confirmed display name, title, or brand association is available. | source_missing | `defer_source_missing` |
| Brand instructor | Any association | No accessible instructor/ownership source | Association cannot be inferred from a subject or folder name. | source_missing + owner_required | `defer_owner_decision` |
| Course instructor | Any assignment | No approved courses or instructors | Both parents and same-brand association are absent. | source_missing + owner_required | `defer_owner_decision` |

## 6. Non-executable seed manifest tables

The following tables are documentation tables only. They are not SQL, are not executable, and do not constitute an apply script.

### 6.1 `app.educational_brands`

| Natural key | `code` | `name` | `slug` | `status` | Decision | Notes |
|---|---|---|---|---|---|---|
| `medway` | `medway` | `Medway` | `medway` | `active` | `include_in_prompt_50` | Canonical brand boundary. No memberships or users. |
| `elite` | `elite` | `Elite` | `elite` | `active` | `include_in_prompt_50` | Canonical brand boundary. No memberships or users. |

### 6.2 `app.academic_levels`

| Natural key | `level_number` | `display_name` | `sort_order` | `status` | Decision |
|---|---:|---|---:|---|---|
| `buc-medicine-level-1` | 1 | Level 1 | 1 | `active` | `include_in_prompt_50` |
| `buc-medicine-level-2` | 2 | Level 2 | 2 | `active` | `include_in_prompt_50` |
| `buc-medicine-level-3` | 3 | Level 3 | 3 | `active` | `include_in_prompt_50` |
| `buc-medicine-level-4` | 4 | Level 4 | 4 | `active` | `include_in_prompt_50` |
| `buc-medicine-level-5` | 5 | Level 5 | 5 | `active` | `include_in_prompt_50` |

### 6.3 `app.academic_semesters`

| Natural key | `semester_number` | Parent level | `display_name` | `phase` | `sort_order` | `status` | Decision |
|---|---:|---|---|---|---:|---|---|
| `buc-medicine-semester-1` | 1 | Level 1 | Semester 1 | `phase_i` | 1 | `active` | `include_in_prompt_50` |
| `buc-medicine-semester-2` | 2 | Level 1 | Semester 2 | `phase_i` | 2 | `active` | `include_in_prompt_50` |
| `buc-medicine-semester-3` | 3 | Level 2 | Semester 3 | `phase_i` | 1 | `active` | `include_in_prompt_50` |
| `buc-medicine-semester-4` | 4 | Level 2 | Semester 4 | `phase_i` | 2 | `active` | `include_in_prompt_50` |
| `buc-medicine-semester-5` | 5 | Level 3 | Semester 5 | `phase_i` | 1 | `active` | `include_in_prompt_50` |
| `buc-medicine-semester-6` | 6 | Level 3 | Semester 6 | `phase_ii` | 2 | `active` | `include_in_prompt_50` |
| `buc-medicine-semester-7` | 7 | Level 4 | Semester 7 | `phase_ii` | 1 | `active` | `include_in_prompt_50` |
| `buc-medicine-semester-8` | 8 | Level 4 | Semester 8 | `phase_ii` | 2 | `active` | `include_in_prompt_50` |
| `buc-medicine-semester-9` | 9 | Level 5 | Semester 9 | `phase_ii` | 1 | `active` | `include_in_prompt_50` |
| `buc-medicine-semester-10` | 10 | Level 5 | Semester 10 | `phase_ii` | 2 | `active` | `include_in_prompt_50` |

### 6.4 `app.academic_modules`

Each row below is one proposed module. `sort_order` is the printed order within its semester. Titles preserve the source wording; no code or title is inferred. The PDM1105 row is shown for auditability but is deferred because its Drive folder uses the conflicting PMD spelling.

| Natural key | `module_code` | `title` | Semester | `sort_order` | Status | Source | Decision |
|---|---|---|---:|---:|---|---|---|
| `buc-medicine-module-TSF1101` | `TSF1101` | The Human Body (Tissue Structure & Function) | 1 | 1 | `active` | PDF p. 5 | `include_in_prompt_50` |
| `buc-medicine-module-ANA1102` | `ANA1102` | General Anatomical Principles | 1 | 2 | `active` | PDF p. 5 | `include_in_prompt_50` |
| `buc-medicine-module-CBG1103` | `CBG1103` | Molecular Cell Biology & Genetics | 1 | 3 | `active` | PDF p. 5 | `include_in_prompt_50` |
| `buc-medicine-module-BIO1104` | `BIO1104` | Principles of Medical Biochemistry and metabolism | 1 | 4 | `active` | PDF p. 5 | `include_in_prompt_50` |
| `buc-medicine-module-PDM1105` | `PDM1105` | Professional Development | 1 | 5 | deferred | PDF p. 5; conflicting Drive folder `1105 PMD` | `defer_source_missing` |
| `buc-medicine-module-ECX1106` | `ECX1106` | Early clinical Exposure 1 | 1 | 6 | `active` | PDF p. 5 | `include_in_prompt_50` |
| `buc-medicine-module-SIM1107` | `SIM1107` | Basic Surgical Skills | 1 | 7 | `active` | PDF p. 5 | `include_in_prompt_50` |
| `buc-medicine-module-IPP1208` | `IPP1208` | Introduction to Physiology & Clinical Pharmacology | 2 | 1 | `active` | PDF p. 6 | `include_in_prompt_50` |
| `buc-medicine-module-PAT1209` | `PAT1209` | Pathophysiology of Diseases | 2 | 2 | `active` | PDF p. 6 | `include_in_prompt_50` |
| `buc-medicine-module-MIC1210` | `MIC1210` | Infections | 2 | 3 | `active` | PDF p. 6 | `include_in_prompt_50` |
| `buc-medicine-module-PHE1211` | `PHE1211` | Concepts of Public Health & Epidemiology-I | 2 | 4 | `active` | PDF p. 6 | `include_in_prompt_50` |
| `buc-medicine-module-IMM1212` | `IMM1212` | Immune system | 2 | 5 | `active` | PDF p. 6 | `include_in_prompt_50` |
| `buc-medicine-module-SIM1213` | `SIM1213` | Simulation center- 1 | 2 | 6 | `active` | PDF p. 6 | `include_in_prompt_50` |
| `buc-medicine-module-SBS1214` | `SBS1214` | Social & Behavioral Sciences | 2 | 7 | `active` | PDF p. 6 | `include_in_prompt_50` |
| `buc-medicine-module-MSK2115` | `MSK2115` | Musculoskeletal System | 3 | 1 | `active` | PDF p. 7 | `include_in_prompt_50` |
| `buc-medicine-module-CVS2116` | `CVS2116` | Cardiovascular System | 3 | 2 | `active` | PDF p. 7 | `include_in_prompt_50` |
| `buc-medicine-module-RES2117` | `RES2117` | Respiratory system | 3 | 3 | `active` | PDF p. 7 | `include_in_prompt_50` |
| `buc-medicine-module-ECX2118` | `ECX2118` | Early clinical exposure-II | 3 | 4 | `active` | PDF p. 7 | `include_in_prompt_50` |
| `buc-medicine-module-GIT2219` | `GIT2219` | Gastrointestinal System (Including Nutrition and metabolism) | 4 | 1 | `active` | PDF p. 8 | `include_in_prompt_50` |
| `buc-medicine-module-EDH2220` | `EDH2220` | Principles of Endocrinology. | 4 | 2 | `active` | PDF p. 8 | `include_in_prompt_50` |
| `buc-medicine-module-HEM2221` | `HEM2221` | Principles of Hematology | 4 | 3 | `active` | PDF p. 8 | `include_in_prompt_50` |
| `buc-medicine-module-PHE2222` | `PHE2222` | Concepts of Public Health & Epidemiology-II | 4 | 4 | `active` | PDF p. 8 | `include_in_prompt_50` |
| `buc-medicine-module-ECX2223` | `ECX2223` | Early clinical exposure-III | 4 | 5 | `active` | PDF p. 8 | `include_in_prompt_50` |
| `buc-medicine-module-REP3124` | `REP3124` | Reproductive system | 5 | 1 | `active` | PDF p. 9 | `include_in_prompt_50` |
| `buc-medicine-module-URN3125` | `URN3125` | Urinary system | 5 | 2 | `active` | PDF p. 9 | `include_in_prompt_50` |
| `buc-medicine-module-EBM3126` | `EBM3126` | Evidence Based Medicine | 5 | 3 | `active` | PDF p. 9 | `include_in_prompt_50` |
| `buc-medicine-module-NHN3127` | `NHN3127` | Nervous System & Head and Neck | 5 | 4 | `active` | PDF p. 9 | `include_in_prompt_50` |
| `buc-medicine-module-SIM3128` | `SIM3128` | Simulation center -II | 5 | 5 | `active` | PDF p. 9 | `include_in_prompt_50` |
| `buc-medicine-module-MED3229` | `MED3229` | Medicine I: Introduction to general medicine. | 6 | 1 | `active` | PDF p. 10 | `include_in_prompt_50` |
| `buc-medicine-module-MED3230` | `MED3230` | Medicine II: Hematology, endocrinology. | 6 | 2 | `active` | PDF p. 10 | `include_in_prompt_50` |
| `buc-medicine-module-SUR3231` | `SUR3231` | Surgery I: (Wound Healing, bleeding, shock, blood transfusion, haemostasis, surgical infections, postoperative complications, surgical nutrition (enteral and parenteral), Surgery of head and neck, lymphatic system. | 6 | 3 | `active` | PDF p. 10 | `include_in_prompt_50` |
| `buc-medicine-module-SUR3232` | `SUR3232` | Surgery II: Thyroid and Para thyroid, supra renal gland, abdominal wall and hernias. Vascular surgery & Plastic surgery | 6 | 4 | `active` | PDF p. 10 | `include_in_prompt_50` |
| `buc-medicine-module-FMT3233` | `FMT3233` | Forensic medicine and toxicology | 6 | 5 | `active` | PDF p. 10 | `include_in_prompt_50` |
| `buc-medicine-module-MED4134` | `MED4134` | Medicine III: Liver-biliary system; Nutrition, GIT. | 7 | 1 | `active` | PDF p. 11 | `include_in_prompt_50` |
| `buc-medicine-module-MED4135` | `MED4135` | Medicine IV: Rheumatology and clinical immunology; Tropical medicine | 7 | 2 | `active` | PDF p. 11 | `include_in_prompt_50` |
| `buc-medicine-module-PED4136` | `PED4136` | Child Healthcare Pediatrics & Pediatric Surgery -I | 7 | 3 | `active` | PDF p. 11 | `include_in_prompt_50` |
| `buc-medicine-module-PED4137` | `PED4137` | Child Healthcare Pediatrics & Pediatric Surgery -II | 7 | 4 | `active` | PDF p. 11 | `include_in_prompt_50` |
| `buc-medicine-module-SUR4138` | `SUR4138` | Surgery III: GIT, Liver-biliary system, pancreas, abdomen and peritoneum, breast | 7 | 5 | `active` | PDF p. 11 | `include_in_prompt_50` |
| `buc-medicine-module-OBG4239` | `OBG4239` | Maternal Healthcare Obstetrics & Gynecology-I | 8 | 1 | `active` | PDF p. 12 | `include_in_prompt_50` |
| `buc-medicine-module-OBG4240` | `OBG4240` | Maternal Healthcare Obstetrics & Gynecology-II | 8 | 2 | `active` | PDF p. 12 | `include_in_prompt_50` |
| `buc-medicine-module-MED4241` | `MED4241` | Medicine-V: (Cardiology & Chest) | 8 | 3 | `active` | PDF p. 12 | `include_in_prompt_50` |
| `buc-medicine-module-MED4242` | `MED4242` | Medicine-VI: (Clinical Psychiatry) | 8 | 4 | `active` | PDF p. 12 | `include_in_prompt_50` |
| `buc-medicine-module-MED4243` | `MED4243` | Medicine-VII: (Neurology) | 8 | 5 | `active` | PDF p. 12 | `include_in_prompt_50` |
| `buc-medicine-module-SUR4244` | `SUR4244` | Surgery IV: (Neurosurgery) | 8 | 6 | `active` | PDF p. 12 | `include_in_prompt_50` |
| `buc-medicine-module-EXM4245` | `EXM4245` | Preparing for USMLE step I | 8 | 7 | `active` | PDF p. 12 | `include_in_prompt_50` |
| `buc-medicine-module-MED5146` | `MED5146` | Medicine VIII: Clinical investigations (laboratory, hematology infection control and radiology). | 9 | 1 | `active` | PDF p. 13 | `include_in_prompt_50` |
| `buc-medicine-module-SUR5147` | `SUR5147` | Surgery V: Anesthesia (Including pain management and intensive care); Oncology -principles. | 9 | 2 | `active` | PDF p. 13 | `include_in_prompt_50` |
| `buc-medicine-module-SUR5148` | `SUR5148` | Surgery VI: Orthopedics (Including fractures & dislocations); Trauma, Cardiothoracic surgery | 9 | 3 | `active` | PDF p. 13 | `include_in_prompt_50` |
| `buc-medicine-module-EXM5149` | `EXM5149` | Preparing for USMLE step II | 9 | 4 | `active` | PDF p. 13 | `include_in_prompt_50` |
| `buc-medicine-module-AGR5150` | `AGR5150` | Advanced Genetics and regenerative medicine | 9 | 5 | `active` | PDF p. 13 | `include_in_prompt_50` |
| `buc-medicine-module-RPP5151` | `RPP5151` | Student Research Project I | 9 | 6 | `active` | PDF p. 13 | `include_in_prompt_50` |
| `buc-medicine-module-EXM5152` | `EXM5152` | Preparing for USMLE step II CS | 9 | 7 | `active` | PDF p. 13 | `include_in_prompt_50` |
| `buc-medicine-module-MED5153` | `MED5153` | Medicine-IX: (Dermatology) | 9 | 8 | `active` | PDF p. 13 | `include_in_prompt_50` |
| `buc-medicine-module-OPT5254` | `OPT5254` | Ophthalmology | 10 | 1 | `active` | PDF p. 13 | `include_in_prompt_50` |
| `buc-medicine-module-FAM5255` | `FAM5255` | Family Medicine | 10 | 2 | `active` | PDF p. 13 | `include_in_prompt_50` |
| `buc-medicine-module-SUR5256` | `SUR5256` | Surgery VII: Urology (Including surgical anuria) | 10 | 3 | `active` | PDF p. 13 | `include_in_prompt_50` |
| `buc-medicine-module-MED5257` | `MED5257` | Medicine X: Nephrology | 10 | 4 | `active` | PDF p. 13 | `include_in_prompt_50` |
| `buc-medicine-module-ENT5258` | `ENT5258` | Ear, Nose and Throat | 10 | 5 | `active` | PDF p. 13 | `include_in_prompt_50` |
| `buc-medicine-module-GER5259` | `GER5259` | Gerontology & Home Care (Integrated Medical/ Surgical Approach) | 10 | 6 | `active` | PDF p. 13 | `include_in_prompt_50` |
| `buc-medicine-module-RPP5260` | `RPP5260` | Research projects & Students Publication | 10 | 7 | `active` | PDF p. 13 | `include_in_prompt_50` |
| `buc-medicine-module-EMR5261` | `EMR5261` | Emergencies (Medical & Surgical - Integrated) | 10 | 8 | `active` | PDF p. 13 | `include_in_prompt_50` |

Note: the PDF contains 13 physical pages. The final two study-plan tables are on physical pages 12 and 13, with the source table headings identifying Level 5. Prompt 50 should re-check the final page labels against the source file before applying the manifest; the row decisions do not depend on page numbering.

### 6.5 `app.instructors`

| Natural key | `display_name` | `professional_title` | `status` | Decision | Reason |
|---|---|---|---|---|---|
| None | None | None | None | `defer_source_missing` | No instructor person identity is source-confirmed in the inspected materials. |

### 6.6 `app.brand_instructors`

| Natural key | Brand | Instructor | `status` | Decision | Reason |
|---|---|---|---|---|---|
| None | None | None | None | `defer_owner_decision` | No instructor and no approved brand association exist. A shared instructor would be one global instructor with one association per approved brand. |

### 6.7 `app.brand_courses`

| Natural key | Brand | `course_code` | `title` | `course_scope` | Module | `status` | Decision | Reason |
|---|---|---|---|---|---|---|---|---|
| None | None | None | None | None | None | None | `defer_owner_decision` | Academic modules do not automatically become brand courses. Basic Life Support Course, Incision Academy, Extra Resources, and any Medway/Elite course require owner-confirmed identity and placement. |

### 6.8 `app.course_instructors`

| Natural key | Brand | Course | Instructor | `status` | Decision | Reason |
|---|---|---|---|---|---|---|
| None | None | None | None | None | `defer_owner_decision` | Deferred until a course, global instructor, brand association, and same-brand relationship are all approved. |

## 7. Explicitly excluded foundation domains

Prompt 50 must not plan or create rows for `app_users`, `student_profiles`, `admin_profiles`, `brand_memberships`, admin roles, admin permissions, role assignments, subscriptions, seats, payments, orders, access grants, enrollment, lessons, chapters, videos, PDFs, quizzes, attempts, progress, devices, sessions, protected media, watermarking, or any other commercial, access, student, or runtime record.

Medway and Elite are brands only. The BUC levels, semesters, and modules are shared academic references only. No foundation row implies access, enrollment, pricing, content publication, instructor ownership, or login identity.

## 8. Future Prompt 50 apply and verification gates

Prompt 50 must be separately authorized and staging-only for project `mgrsgibxuwgbxtdqprkw`. It must use credentials supplied outside Git, lock out production, and perform no runtime, frontend, deployment, or push operation.

Before any data write, Prompt 50 must run read-only checks for:

1. target project/database identity and staging environment;
2. private `app` schema and intact M1/M2 tables;
3. current row counts in all seed tables;
4. conflicting brand codes/slugs;
5. conflicting level numbers/sort orders;
6. conflicting semester numbers, parent levels, phases, or sort orders;
7. conflicting module codes, titles, semester parents, or sort orders;
8. absence of unexpected existing foundation rows unless they exactly match the reviewed manifest;
9. unchanged RLS, policies, grants, and Data API exposure.

The future transaction may write only the approved two brands, five levels, ten semesters, and 60 coded modules. It must abort on any natural-key collision with different values. It must not add instructors, associations, courses, assignments, users, or access/commercial data.

After the transaction, Prompt 50 must perform read-only verification of exact row counts, deterministic IDs, parent relationships, phase mapping, all module code/title/semester placements, no unexpected rows, and no access/commercial side effects. Admin M2 API verification remains a later separately authorized staging-read activity; it is not part of Prompt 49.

## 9. Validation and handoff

Prompt 49 validation is documentation-only:

- verify clean `dev`, fetch `origin/dev`, and confirm no remote advancement requiring integration;
- run `git diff --check` and inspect the complete changed-file list;
- confirm the only tracked change is this Markdown document;
- scan for executable seed artifacts, SQL files, migration files, runtime/frontend/package/Docker/Compose/Dokploy changes, credentials, database URLs, certificate paths, and secret-shaped values;
- confirm no database connection, staging read, seed execution, SQL execution, Supabase MCP use, production access, push, or deployment occurred.

The required local commit is:

`docs(api): plan foundation seed data`

### Prompt 50 outcome

Prompt 50 applied the approved manifest once to the staging project `mgrsgibxuwgbxtdqprkw`: two brands, five levels, ten semesters, and 60 academic modules. The controlled apply inserted 77 rows because every approved key was absent at preflight. No deferred domain was mutated, and the unresolved PDM1105/`1105 PMD` conflict remains deferred and absent. The applied controlled seed and verification evidence are recorded in [the staging apply report](foundation-seed-staging-apply-report.md).
