// Dependency-isolated contract/security tests. This does not prove database data.
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { createServer } from 'node:http';
import { once } from 'node:events';
import { createRequire } from 'node:module';
import { generateKeyPair, exportJWK, createLocalJWKSet, SignJWT } from 'jose';
const require = createRequire(import.meta.url);
const { createApplication } = require('../dist/app.js');
const { createHttpApp } = require('../dist/http/http-app.js');
const { PostgresStudentCourseReadModel } = require('../dist/modules/student/student-course-read-model.js');
const { SupabaseJwtJwksAuthIdentityAdapter } = require('../dist/infrastructure/supabase/supabase-jwt-adapter.js');
const { assertReadOnlySelect } = require('../dist/infrastructure/postgres/postgres-read-transport.js');
const subject = randomUUID(), courseId = randomUUID(), lessonId = randomUUID(), chapterId = randomUUID();
const lesson = { lessonId, chapterId, title: 'Contract fixture', sortOrder: 1, status: 'published', mediaStatus: 'no_media', resourceId: null, playbackAvailable: false };
const item = { courseId, title: 'Contract fixture', code: 'TEST', brand: { code: 'elite', name: 'Elite' }, academicInstitution: { code: 'buc', name: 'BUC' }, academicLevel: { levelNumber: 1, title: 'Level 1' }, academicSemester: { semesterNumber: 1, title: 'Semester 1' }, cataloguePresentation: 'subject_based', unitLabel: 'Subject', status: 'published', chapterCount: 1, lessonCount: 1, mediaSummary: { totalLessons: 1, lessonsWithMedia: 0, pendingMediaLessons: 0 }, updatedAt: new Date().toISOString() };
const detail = { ...item, academicUnit: { code: 'TEST', label: 'Contract fixture' }, chapters: [{ chapterId, title: 'Lessons', sortOrder: 1, status: 'published', lessons: [lesson] }] };
let mode = 'normal', calls = [], stage = 'setup', passed = 0, server;
const transport = { query: async request => {
  assertReadOnlySelect(request.text); calls.push(request);
  assert.ok(!request.text.includes(subject));
  if (mode === 'unavailable') throw new Error('Private database diagnostic must not escape');
  if (request.label === 'student.course-scope') return { rows: mode === 'no-scope' ? [] : mode === 'multiple' ? [{ brand: 'elite' }, { brand: 'medway' }] : [{ brand: 'elite' }] };
  if (request.label === 'student.courses.list') return { rows: [{ items: mode === 'empty' ? [] : [item], total: mode === 'empty' ? 0 : 1 }] };
  return { rows: mode === 'missing' ? [] : [{ item: detail }] };
} };
const application = createApplication({ environment: {} });
const check = (name, fn) => { stage = name; fn(); passed++; console.log(`PASS ${name}`); };
try {
  const { publicKey, privateKey } = await generateKeyPair('ES256');
  const jwk = await exportJWK(publicKey); jwk.kid = 'isolated-test'; jwk.alg = 'ES256';
  const issuer = 'https://abcdefghijklmnopqrst.supabase.co/auth/v1';
  const auth = new SupabaseJwtJwksAuthIdentityAdapter({ projectRef: 'abcdefghijklmnopqrst', issuer, jwksUrl: `${issuer}/.well-known/jwks.json`, audience: 'authenticated', timeoutMs: 1000 }, { keySet: createLocalJWKSet({ keys: [jwk] }) });
  const sign = (overrides = {}) => new SignJWT({ user_metadata: { brand: 'nexus', studentProfileId: randomUUID() } }).setProtectedHeader({ alg: 'ES256', kid: jwk.kid }).setSubject(subject).setIssuer(overrides.issuer ?? issuer).setAudience(overrides.audience ?? 'authenticated').setIssuedAt().setExpirationTime(overrides.expires ?? '5m').sign(privateKey);
  const token = await sign();
  server = createServer(createHttpApp({ admin: application.admin, studentCourses: { auth, readModel: new PostgresStudentCourseReadModel(transport) } }));
  server.listen(0, '127.0.0.1'); await once(server, 'listening');
  const origin = `http://127.0.0.1:${server.address().port}`;
  const get = async (path, bearer = token, method = 'GET') => {
    const result = await fetch(origin + path, { method, signal: AbortSignal.timeout(5000), headers: bearer ? { Authorization: `Bearer ${bearer}` } : {} });
    return { status: result.status, body: await result.json(), headers: result.headers };
  };
  const list = await get('/v1/student/courses?brand=elite');
  check('list contract and private cache policy', () => { assert.equal(list.status, 200); assert.deepEqual(list.body.data.items, [item]); assert.match(list.headers.get('cache-control'), /no-store/); });
  check('authority comes from verified subject, not user metadata', () => { assert.deepEqual(calls[0].values, [subject, 'elite']); assert.equal(calls[1].values[1], 'elite'); });
  const found = await get(`/v1/student/courses/${courseId}`);
  check('detail contract', () => assert.deepEqual(found.body.data, detail));
  const lessons = await get(`/v1/student/courses/${courseId}/lessons`);
  check('lessons flatten in chapter order without media URLs', () => assert.deepEqual(lessons.body.data, { courseId, cataloguePresentation: 'subject_based', unitLabel: 'Subject', lessons: [lesson] }));
  const invalid = [
    ['missing bearer', '/v1/student/courses', '', 401],
    ['malformed bearer', '/v1/student/courses', 'broken', 401],
    ['wrong issuer', '/v1/student/courses', await sign({ issuer: 'https://different.example.test' }), 401],
    ['wrong audience', '/v1/student/courses', await sign({ audience: 'anon' }), 401],
    ['expired JWT', '/v1/student/courses', await sign({ expires: Math.floor(Date.now() / 1000) - 120 }), 401],
    ['invalid course ID', '/v1/student/courses/invalid', token, 400],
    ['institution as brand', '/v1/student/courses?brand=delta', token, 400],
    ['all as brand', '/v1/student/courses?brand=all', token, 400],
    ['duplicate brand', '/v1/student/courses?brand=elite&brand=nexus', token, 400],
    ['identity override', '/v1/student/courses?studentId=override', token, 400],
    ['placement override', '/v1/student/courses?academicSemester=override', token, 400],
    ['oversized page', '/v1/student/courses?pageSize=101', token, 400],
    ['noncanonical page', '/v1/student/courses?page=1e2', token, 400],
    ['detail pagination rejected', `/v1/student/courses/${courseId}?page=1`, token, 400],
  ];
  for (const [name, path, bearer, status] of invalid) {
    stage = name; calls = []; const result = await get(path, bearer);
    check(name, () => { assert.equal(result.status, status); assert.equal(calls.length, 0); });
  }
  for (const [scenario, path, status] of [['no-scope', '/v1/student/courses', 403], ['multiple', '/v1/student/courses', 400], ['unavailable', '/v1/student/courses', 503], ['missing', `/v1/student/courses/${courseId}`, 404], ['empty', '/v1/student/courses', 200]]) {
    mode = scenario; stage = scenario; const result = await get(path);
    check(scenario, () => { assert.equal(result.status, status); assert.ok(!JSON.stringify(result.body).includes('Private database')); if (scenario === 'empty') assert.deepEqual(result.body.data.items, []); });
  }
  mode = 'normal';
  const write = await get('/v1/student/courses', token, 'POST');
  check('read routes reject writes', () => assert.equal(write.status, 405));
  for (const path of ['/health', '/ready', '/openapi.json']) {
    const result = await get(path, '');
    check(`${path} JSON`, () => {
      assert.equal(result.status, 200);
      if (path === '/openapi.json') {
        for (const route of ['/v1/student/courses', '/v1/student/courses/{courseId}', '/v1/student/courses/{courseId}/lessons']) assert.ok(result.body.paths[route].get);
        assert.equal(result.body.components.schemas.StudentLessonItem.properties.playbackAvailable.const, false);
      }
    });
  }
  const docs = await fetch(origin + '/docs', { signal: AbortSignal.timeout(5000) }); const html = await docs.text();
  check('docs HTML', () => { assert.equal(docs.status, 200); assert.match(html, /openapi\.json/); });
  console.log(`PASS ${passed} dependency-isolated checks; no populated database acceptance claimed`);
} catch (error) {
  console.error(`FAIL ${stage} category=${error?.name === 'AssertionError' ? 'assertion' : 'runtime'}`); process.exitCode = 1;
} finally {
  if (server) { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); }
  await application.close();
}
