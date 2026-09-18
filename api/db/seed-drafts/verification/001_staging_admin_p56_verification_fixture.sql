-- Prompt 56A controlled staging-only Admin verification fixture.
-- Not a general application seed and never valid as production bootstrap data.
-- UUIDv5 namespace: 6ba7b810-9dad-11d1-80b4-00c04fd430c8.
-- UUIDv5 inputs use elearning.verification.staging.p56.v1/ followed by:
-- auth-identity, app-user, admin-profile-medway, admin-role-medway-m2,
-- and admin-role-assignment-medway-m2.
-- The controlled apply script owns BEGIN, transaction-local verification, and COMMIT/ROLLBACK.

INSERT INTO app.app_users (id, auth_user_id, primary_email, primary_phone, status)
SELECT
  'c3214c3c-349f-512c-8917-4053c19428a5'::uuid,
  '02694d40-9dec-5f53-a613-6fb946a2b0fa'::uuid,
  NULL,
  NULL,
  'active'
WHERE NOT EXISTS (
  SELECT 1 FROM app.app_users
  WHERE id = 'c3214c3c-349f-512c-8917-4053c19428a5'::uuid
     OR auth_user_id = '02694d40-9dec-5f53-a613-6fb946a2b0fa'::uuid
);

INSERT INTO app.admin_profiles (id, brand_id, app_user_id, display_name, status)
SELECT
  'ec1b84ae-bd54-57ba-9b38-0c88735f33af'::uuid,
  '37cb02d5-b44f-5c74-9768-077d1a187ead'::uuid,
  'c3214c3c-349f-512c-8917-4053c19428a5'::uuid,
  '__STAGING_VERIFY_ADMIN_P56__',
  'active'
WHERE NOT EXISTS (
  SELECT 1 FROM app.admin_profiles
  WHERE id = 'ec1b84ae-bd54-57ba-9b38-0c88735f33af'::uuid
     OR (brand_id = '37cb02d5-b44f-5c74-9768-077d1a187ead'::uuid AND app_user_id = 'c3214c3c-349f-512c-8917-4053c19428a5'::uuid)
);

INSERT INTO app.admin_roles (id, brand_id, code, name, description, status)
SELECT
  'd5443433-a172-5bf7-a628-08cb4b992a63'::uuid,
  '37cb02d5-b44f-5c74-9768-077d1a187ead'::uuid,
  'staging_verify_m2_admin',
  '__STAGING_VERIFY_M2_ADMIN__',
  'Prompt 56 staging-only M2 verification authority',
  'active'
WHERE NOT EXISTS (
  SELECT 1 FROM app.admin_roles
  WHERE id = 'd5443433-a172-5bf7-a628-08cb4b992a63'::uuid
     OR (brand_id = '37cb02d5-b44f-5c74-9768-077d1a187ead'::uuid AND code = 'staging_verify_m2_admin')
);

INSERT INTO app.admin_role_permissions (role_id, permission_id)
SELECT 'd5443433-a172-5bf7-a628-08cb4b992a63'::uuid, permission.id
FROM app.admin_permissions AS permission
WHERE permission.status = 'active'
  AND permission.code IN (
    'admin.instructors.create',
    'admin.instructors.update',
    'admin.brand_instructors.assign',
    'admin.brand_instructors.update',
    'admin.brand_courses.create',
    'admin.brand_courses.update',
    'admin.course_instructors.assign',
    'admin.course_instructors.update'
  )
  AND NOT EXISTS (
    SELECT 1 FROM app.admin_role_permissions AS existing
    WHERE existing.role_id = 'd5443433-a172-5bf7-a628-08cb4b992a63'::uuid
      AND existing.permission_id = permission.id
  );

INSERT INTO app.admin_role_assignments (
  id, brand_id, admin_profile_id, role_id, assigned_by_admin_profile_id, status
)
SELECT
  '4977dd88-9e0f-5a81-8d84-458e74481aac'::uuid,
  '37cb02d5-b44f-5c74-9768-077d1a187ead'::uuid,
  'ec1b84ae-bd54-57ba-9b38-0c88735f33af'::uuid,
  'd5443433-a172-5bf7-a628-08cb4b992a63'::uuid,
  NULL,
  'active'
WHERE NOT EXISTS (
  SELECT 1 FROM app.admin_role_assignments
  WHERE id = '4977dd88-9e0f-5a81-8d84-458e74481aac'::uuid
     OR (
       brand_id = '37cb02d5-b44f-5c74-9768-077d1a187ead'::uuid
       AND admin_profile_id = 'ec1b84ae-bd54-57ba-9b38-0c88735f33af'::uuid
       AND role_id = 'd5443433-a172-5bf7-a628-08cb4b992a63'::uuid
       AND status = 'active'
     )
);
