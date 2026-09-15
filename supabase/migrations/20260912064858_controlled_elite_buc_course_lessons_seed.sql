begin;

-- Compatibility migration retained because this version exists in linked
-- migration history. The controlled Elite/BUC course lesson data is an import,
-- not schema foundation, and is kept in:
--   supabase/imports/030_elite_buc_course_lessons_seed.sql
--
-- Supabase applies migrations before seed.sql, so executing this import from
-- the migration chain makes deterministic local resets fail when seed data is
-- intentionally disabled. Runtime validation should apply the import explicitly
-- after the base catalogue/brand seed prerequisites are present.

commit;
