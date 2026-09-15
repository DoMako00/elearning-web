// LOCAL ONLY. Real Postgres + HTTP + JWT signature verification; no Auth users.
// All identity remapping and adversarial fixtures are rolled back in finally.
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { createServer } from 'node:http';
import { once } from 'node:events';
import { createRequire } from 'node:module';
import { Pool } from 'pg';
import { generateKeyPair, exportJWK, createLocalJWKSet, SignJWT } from 'jose';

const require = createRequire(import.meta.url);
const { createApplication } = require('../dist/app.js');
const { createHttpApp } = require('../dist/http/http-app.js');
const { SupabaseJwtJwksAuthIdentityAdapter } = require('../dist/infrastructure/supabase/supabase-jwt-adapter.js');
const { createStudentCourses } = require('../dist/modules/student/student-courses.js');
const pool = new Pool({ host: '127.0.0.1', port: 54322, database: 'postgres', user: 'postgres', password: 'postgres', ssl: false, max: 1, application_name: 'elearning-student-read-acceptance', connectionTimeoutMillis: 5000, query_timeout: 15000, statement_timeout: 10000 });
let client, application, server, stage = 'local-connection', passed = 0;
const check = (name, callback) => { stage = name; callback(); passed++; console.log(`PASS ${name}`); };

try {
  client = await pool.connect();
  await client.query('begin');
  const baseline = (await client.query(`select
    (select count(*)::integer from app.student_profiles) students,
    (select count(*)::integer from auth.users) auth_users,
    (select count(*)::integer from app.lesson_resources) resources,
    (select count(*)::integer from app.course_enrollments) enrollments`)).rows[0];
  check('controlled baseline requires imports 033, 030 and 034', () => {
    assert.equal(baseline.students, 5); assert.equal(baseline.resources, 0); assert.equal(baseline.enrollments, 0);
  });

  const environment = {
    NODE_ENV: 'test', AUTH_PROVIDER: 'supabase', PERSISTENCE_PROVIDER: 'supabase',
    SUPABASE_PROJECT_REF: 'abcdefghijklmnopqrst',
    // The injected test pool below is loopback only; production TLS is unchanged.
    SUPABASE_DB_URL: 'postgresql://postgres:postgres@127.0.0.1:54322/postgres?sslmode=verify-full',
    ADMIN_READ_MODEL_SOURCE: 'postgres', ADMIN_M2_READ_MODEL_SOURCE: 'postgres', ADMIN_COMMAND_SOURCE: 'mock',
  };
  const localPool = { query: (sql, values) => client.query(sql, [...values]), end: async () => {} };
  application = createApplication({ environment, poolFactory: () => localPool });
  assert.ok(application.studentCourses);
  check('mock runtime cannot supply student data', () => {
    assert.equal(createStudentCourses({ provider: 'mock' }, { AUTH_PROVIDER: 'supabase' }), undefined);
    assert.equal(createStudentCourses(application.persistence, { AUTH_PROVIDER: 'mock' }), undefined);
  });

  const { publicKey, privateKey } = await generateKeyPair('ES256');
  const jwk = await exportJWK(publicKey); jwk.kid = 'local-student-acceptance'; jwk.alg = 'ES256';
  const issuer = 'https://abcdefghijklmnopqrst.supabase.co/auth/v1';
  const auth = new SupabaseJwtJwksAuthIdentityAdapter({ projectRef: 'abcdefghijklmnopqrst', issuer, jwksUrl: `${issuer}/.well-known/jwks.json`, audience: 'authenticated', timeoutMs: 1000 }, { keySet: createLocalJWKSet({ keys: [jwk] }) });
  const subjects = {}, tokens = {}, profiles = {};
  const sign = (subject, expires = '5m', claims = {}) => new SignJWT(claims).setProtectedHeader({ alg: 'ES256', kid: jwk.kid }).setSubject(subject).setIssuer(issuer).setAudience('authenticated').setIssuedAt().setExpirationTime(expires).sign(privateKey);
  for (const brand of ['medway', 'elite', 'nexus']) {
    const fixture = (await client.query(`select p.id, p.app_user_id, p.brand_membership_id
      from app.student_profiles p join app.educational_brands b on b.id=p.brand_id
      join app.student_academic_profiles a on a.student_profile_id=p.id
      where b.code=$1 and a.email=$2`, [brand, `controlled.${brand}.01@example.test`])).rows;
    assert.equal(fixture.length, 1);
    profiles[brand] = fixture[0]; subjects[brand] = randomUUID();
    await client.query('update app.app_users set auth_user_id=$1 where id=$2', [subjects[brand], profiles[brand].app_user_id]);
    tokens[brand] = await sign(subjects[brand], '5m', { user_metadata: { brand: 'nexus', studentProfileId: profiles.nexus?.id ?? randomUUID() } });
  }
  server = createServer(createHttpApp({
    admin: application.admin, adminHttpContextResolver: application.adminHttpContextResolver,
    studentCourses: { ...application.studentCourses, auth },
    databaseReadinessProbe: async () => { await client.query('select 1'); },
    runtimeStatus: { mode: 'supabase', persistence: 'supabase', auth: 'supabase', adminOverviewSource: 'postgres', adminM2Source: 'postgres', adminCommandSource: 'mock' },
  }));
  server.listen(0, '127.0.0.1'); await once(server, 'listening');
  const origin = `http://127.0.0.1:${server.address().port}`;
  const request = async (path, token, options = {}) => {
    const result = await fetch(`${origin}${path}`, { signal: AbortSignal.timeout(15000), ...options, headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options.headers } });
    const body = await result.json();
    return { status: result.status, body, headers: result.headers };
  };
  const courses = {};
  for (const [brand, count, institution, presentation] of [['medway', 6, 'buc', 'subject_based'], ['elite', 5, 'buc', 'subject_based'], ['nexus', 8, 'delta', 'module_based']]) {
    stage = `visible ${brand} courses`;
    const result = await request('/v1/student/courses', tokens[brand]);
    check(stage, () => {
      assert.equal(result.status, 200); assert.equal(result.body.data.pagination.totalItems, count);
      courses[brand] = result.body.data.items;
      for (const course of courses[brand]) {
        assert.equal(course.brand.code, brand); assert.equal(course.academicInstitution.code, institution);
        assert.equal(course.academicLevel.levelNumber, 1); assert.equal(course.academicSemester.semesterNumber, 1);
        assert.equal(course.cataloguePresentation, presentation); assert.equal(course.unitLabel, presentation === 'subject_based' ? 'Subject' : 'Module');
        assert.equal(course.mediaSummary.lessonsWithMedia, 0); assert.equal(course.mediaSummary.pendingMediaLessons, 0);
      }
      assert.match(result.headers.get('cache-control'), /no-store/);
    });
  }
  const expected = { 'ELT-BIO': 10, 'ELT-PHY': 3, 'ELT-HIS': 9, 'ELT-CBG': 14, 'ELT-ANA': 13 };
  for (const course of courses.elite) {
    stage = `Elite outline ${course.code}`;
    const result = await request(`/v1/student/courses/${course.courseId}`, tokens.elite);
    const lessons = await request(`/v1/student/courses/${course.courseId}/lessons`, tokens.elite);
    check(stage, () => {
      assert.equal(result.status, 200); assert.equal(result.body.data.lessonCount, expected[course.code]);
      assert.equal(result.body.data.chapterCount, 1); assert.equal(result.body.data.chapters.length, 1);
      assert.equal(lessons.status, 200); assert.equal(lessons.body.data.lessons.length, expected[course.code]);
      assert.equal(result.body.data.academicUnit.label, course.title);
      for (const [index, lesson] of lessons.body.data.lessons.entries()) {
        assert.equal(lesson.sortOrder, index + 1); assert.equal(lesson.mediaStatus, 'no_media');
        assert.equal(lesson.resourceId, null); assert.equal(lesson.playbackAvailable, false);
      }
      const json = JSON.stringify(result.body);
      for (const forbidden of ['auth_user_id', 'app_user_id', 'student_profile_id', 'email', 'object_key', 'storage', 'http://', 'https://', 'duration']) assert.ok(!json.includes(forbidden));
      assert.ok(!json.includes(subjects.elite)); assert.ok(!json.includes(profiles.elite.id));
    });
  }
  const target = courses.elite.find(course => course.code === 'ELT-BIO');
  const path = `/v1/student/courses/${target.courseId}`;
  const responseCases = [
    ['missing token', '/v1/student/courses', undefined, 401],
    ['malformed token', '/v1/student/courses', 'invalid', 401],
    ['expired token', '/v1/student/courses', await sign(subjects.elite, Math.floor(Date.now() / 1000) - 120), 401],
    ['unmapped identity', '/v1/student/courses', await sign(randomUUID()), 403],
    ['cross brand selection', '/v1/student/courses?brand=nexus', tokens.elite, 403],
    ['cross brand course', path, tokens.nexus, 404],
    ['cross brand lessons', `${path}/lessons`, tokens.medway, 404],
    ['missing course', `/v1/student/courses/${randomUUID()}`, tokens.elite, 404],
    ['institution rejected as brand', '/v1/student/courses?brand=buc', tokens.elite, 400],
    ['all rejected as student scope', '/v1/student/courses?brand=all', tokens.elite, 400],
    ['placement override rejected', '/v1/student/courses?academicLevel=1', tokens.elite, 400],
    ['identity override rejected', '/v1/student/courses?studentId=anything', tokens.elite, 400],
    ['duplicate query rejected', '/v1/student/courses?brand=elite&brand=nexus', tokens.elite, 400],
    ['oversized page rejected', '/v1/student/courses?pageSize=101', tokens.elite, 400],
    ['course ID validated', '/v1/student/courses/not-a-uuid', tokens.elite, 400],
  ];
  for (const [name, route, token, status] of responseCases) {
    stage = name; const result = await request(route, token);
    check(name, () => assert.equal(result.status, status));
  }
  const page = await request('/v1/student/courses?brand=elite&pageSize=2', tokens.elite);
  check('pagination retains total', () => { assert.equal(page.body.data.items.length, 2); assert.equal(page.body.data.pagination.totalItems, 5); });
  const end = await request('/v1/student/courses?page=100', tokens.elite);
  check('empty page is truthful', () => assert.deepEqual(end.body.data.items, []));
  const method = await request(path, tokens.elite, { method: 'POST' });
  check('writes rejected', () => assert.equal(method.status, 405));

  async function mutation(name, sql, values, verify) {
    stage = name; await client.query('savepoint isolated_case');
    try { await client.query(sql, values); await verify(); passed++; console.log(`PASS ${name}`); }
    finally { await client.query('rollback to savepoint isolated_case'); await client.query('release savepoint isolated_case'); }
  }
  for (const status of ['draft', 'archived']) await mutation(`${status} course hidden`, 'update app.brand_courses set status=$1 where id=$2', [status, target.courseId], async () => {
    assert.equal((await request(path, tokens.elite)).status, 404);
    assert.equal((await request('/v1/student/courses', tokens.elite)).body.data.pagination.totalItems, 4);
  });
  await mutation('draft chapter hides its lessons and counts', 'update app.course_chapters set status=$1 where brand_course_id=$2', ['draft', target.courseId], async () => {
    const result = (await request(path, tokens.elite)).body.data;
    assert.equal(result.chapterCount, 0); assert.equal(result.lessonCount, 0); assert.deepEqual(result.chapters, []);
  });
  const targetLesson = (await request(`${path}/lessons`, tokens.elite)).body.data.lessons[0];
  await mutation('draft lesson hidden', 'update app.course_lessons set status=$1 where id=$2', ['draft', targetLesson.lessonId], async () => {
    assert.equal((await request(path, tokens.elite)).body.data.lessonCount, 9);
  });
  for (const status of ['draft', 'published', 'archived']) await mutation(`${status} resource remains nonplayable`, `insert into app.lesson_resources (course_lesson_id,brand_course_id,brand_id,resource_kind,title,sort_order,status)
    select id,brand_course_id,brand_id,'video','Local metadata fixture',1,$1 from app.course_lessons where id=$2`, [status, targetLesson.lessonId], async () => {
    const detail = (await request(path, tokens.elite)).body.data;
    const lesson = detail.chapters[0].lessons[0];
    assert.equal(lesson.mediaStatus, status === 'published' ? 'pending_media' : 'no_media');
    assert.equal(lesson.playbackAvailable, false);
    assert.equal(detail.mediaSummary.pendingMediaLessons, status === 'published' ? 1 : 0);
    assert.equal(detail.mediaSummary.lessonsWithMedia, 0);
  });
  await mutation('inactive membership denied', 'update app.brand_memberships set status=$1 where id=$2', ['ended', profiles.elite.brand_membership_id], async () => assert.equal((await request(path, tokens.elite)).status, 403));
  await mutation('expired membership denied', `update app.brand_memberships set valid_from=now()-interval '2 days', valid_until=now()-interval '1 day' where id=$1`, [profiles.elite.brand_membership_id], async () => assert.equal((await request(path, tokens.elite)).status, 403));
  await mutation('inactive app user denied', 'update app.app_users set status=$1 where id=$2', ['disabled', profiles.elite.app_user_id], async () => assert.equal((await request(path, tokens.elite)).status, 403));
  await mutation('inactive student denied', 'update app.student_profiles set status=$1 where id=$2', ['inactive', profiles.elite.id], async () => assert.equal((await request(path, tokens.elite)).status, 403));
  await mutation('inactive academic access denied', `update app.brand_academic_institution_access set status='inactive'
    where brand_id=(select brand_id from app.student_profiles where id=$1)`, [profiles.elite.id], async () => assert.equal((await request(path, tokens.elite)).status, 403));
  await mutation('other semester cannot read Year 1 Semester 1 course', `update app.student_academic_profiles a set academic_semester_id=s.id
    from app.academic_semesters s where a.student_profile_id=$1 and s.academic_level_id=a.academic_level_id and s.semester_number=2`, [profiles.elite.id], async () => {
    assert.equal((await request(path, tokens.elite)).status, 404);
    assert.deepEqual((await request('/v1/student/courses', tokens.elite)).body.data.items, []);
  });
  const extraMembership = randomUUID(), extraProfile = randomUUID();
  await mutation('multiple memberships require explicit selection', `insert into app.brand_memberships (id,app_user_id,brand_id,status)
    select $1,$2,brand_id,'active' from app.student_profiles where id=$3`, [extraMembership, profiles.elite.app_user_id, profiles.medway.id], async () => {
    await client.query(`insert into app.student_profiles (id,brand_membership_id,app_user_id,brand_id,status)
      select $1,id,app_user_id,brand_id,'active' from app.brand_memberships where id=$2`, [extraProfile, extraMembership]);
    await client.query(`insert into app.student_academic_profiles (student_profile_id,brand_id,full_name,email,academic_institution_id,academic_level_id,academic_semester_id)
      select $1,brand_id,'Local membership fixture','membership.fixture@example.test',academic_institution_id,academic_level_id,academic_semester_id
      from app.student_academic_profiles where student_profile_id=$2`, [extraProfile, profiles.medway.id]);
    assert.equal((await request('/v1/student/courses', tokens.elite)).status, 400);
    assert.equal((await request('/v1/student/courses?brand=elite', tokens.elite)).body.data.pagination.totalItems, 5);
    assert.equal((await request('/v1/student/courses?brand=medway', tokens.elite)).body.data.pagination.totalItems, 6);
  });

  for (const endpoint of ['/health', '/ready', '/openapi.json']) {
    stage = endpoint; const result = await request(endpoint);
    check(`${endpoint} returns valid JSON`, () => {
      assert.equal(result.status, 200);
      if (endpoint === '/openapi.json') for (const route of ['/v1/student/courses', '/v1/student/courses/{courseId}', '/v1/student/courses/{courseId}/lessons']) {
        assert.ok(result.body.paths[route].get); assert.deepEqual(result.body.paths[route].get.security, [{ BearerAuth: [] }]);
      }
    });
  }
  const docs = await fetch(`${origin}/docs`, { signal: AbortSignal.timeout(15000) });
  const html = await docs.text();
  check('docs returns the API Explorer', () => { assert.equal(docs.status, 200); assert.match(docs.headers.get('content-type'), /text\/html/); assert.match(html, /openapi\.json/); });
  const finalCounts = (await client.query(`select (select count(*)::integer from auth.users) auth_users, (select count(*)::integer from app.lesson_resources) resources, (select count(*)::integer from app.course_enrollments) enrollments`)).rows[0];
  check('no Auth users, resources or enrollments persisted by tests', () => { assert.equal(finalCounts.auth_users, baseline.auth_users); assert.equal(finalCounts.resources, 0); assert.equal(finalCounts.enrollments, 0); });
  console.log(`PASS ${passed} local student-course checks; JWT test keys only, no real student login claimed`);
} catch (error) {
  const category = error?.name === 'AssertionError' ? 'assertion' : error?.name === 'TimeoutError' ? 'timeout' : 'runtime-unavailable';
  console.error(`FAIL ${stage} category=${category}`); process.exitCode = 1;
} finally {
  if (server) { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); }
  if (client) {
    try { await client.query('rollback'); }
    catch { console.error('FAIL local-fixture-cleanup connection-unavailable'); process.exitCode = 1; }
    finally { client.release(true); }
  }
  if (application) await application.close();
  await pool.end();
}
