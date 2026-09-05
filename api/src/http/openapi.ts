import type { HttpJsonResponse } from "./http-types";
import { createApiDocsHtml } from "./api-docs-template";

const json = (statusCode: number, body: Readonly<Record<string, unknown>>, headers?: Readonly<Record<string, string>>): HttpJsonResponse => ({ statusCode, body, headers });

const id = (name: string, required = true) => ({ name, in: "path", required, schema: { type: "string", format: "uuid" } });
const bearer = [{ BearerAuth: [] }];
const writeHeaders = [
  { name: "Authorization", in: "header", required: true, schema: { type: "string" }, description: "Bearer access token. Never stored by this documentation page." },
  { name: "Idempotency-Key", in: "header", required: true, schema: { type: "string", minLength: 1, maxLength: 128 }, description: "A unique key for one administrative command." },
];
const reason = { type: "string", minLength: 1, maxLength: 500 };
const version = { type: "integer", minimum: 1 };
const body = (properties: Record<string, unknown>, required: string[]) => ({ required: true, content: { "application/json": { schema: { type: "object", additionalProperties: false, properties, required } } } });
const response = (description: string) => ({ description, content: { "application/json": { schema: { type: "object" } } } });
const read = (summary: string) => ({ summary, security: bearer, responses: { "200": response("Successful response"), "401": response("Authentication required"), "403": response("Permission denied") } });
const write = (summary: string, requestBody: unknown) => ({ summary, security: bearer, requestBody, responses: { "200": response("Command accepted or replayed"), "201": response("Command applied"), "400": response("Invalid command"), "401": response("Authentication required"), "403": response("Permission denied"), "409": response("Version or idempotency conflict") } });

export const openApiDocument = {
  openapi: "3.1.0",
  info: { title: "BUC E-Learning Admin API", version: "1.0.0-local", description: "Local administrative API contract for the canonical M1, M2A, and M4A foundation. The private `app` schema is not exposed through Supabase Data API." },
  servers: [{ url: "/", description: "Current local API origin" }],
  tags: [{ name: "System" }, { name: "Admin overview" }, { name: "Academic catalogue" }, { name: "Instructors" }, { name: "Brand teaching" }],
  components: { securitySchemes: { BearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" } } },
  paths: {
    "/health": { get: { tags: ["System"], summary: "Liveness probe", responses: { "200": response("Service is alive") } } },
    "/ready": { get: { tags: ["System"], summary: "Readiness probe", responses: { "200": response("Service is ready") } } },
    "/v1/admin/overview": { get: { tags: ["Admin overview"], parameters: [{ name: "brand", in: "query", required: true, schema: { type: "string", enum: ["medway", "elite"] }, description: "Commercial brand whose overview is requested." }], ...read("Read the administrative overview") } },
    "/v1/admin/curriculum/levels": { get: { tags: ["Academic catalogue"], ...read("List academic levels") } },
    "/v1/admin/curriculum/semesters": { get: { tags: ["Academic catalogue"], parameters: [{ name: "levelId", in: "query", required: false, schema: { type: "string", format: "uuid" } }], ...read("List semesters; optionally filter by academic level") } },
    "/v1/admin/curriculum/modules": { get: { tags: ["Academic catalogue"], parameters: [{ name: "semesterId", in: "query", required: false, schema: { type: "string", format: "uuid" } }], ...read("List modules; optionally filter by semester") } },
    "/v1/admin/curriculum/modules/{moduleId}": { get: { tags: ["Academic catalogue"], parameters: [id("moduleId")], ...read("Read a module and aliases") } },
    "/v1/admin/instructors": {
      get: { tags: ["Instructors"], ...read("List global instructor identities") },
      post: { tags: ["Instructors"], parameters: writeHeaders, ...write("Create a global instructor identity", body({ code: { type: "string" }, displayName: { type: "string" }, reason }, ["code", "displayName", "reason"])) },
    },
    "/v1/admin/instructors/{instructorId}": {
      get: { tags: ["Instructors"], parameters: [id("instructorId")], ...read("Read one global instructor") },
      patch: { tags: ["Instructors"], parameters: [id("instructorId"), ...writeHeaders], ...write("Update global instructor identity", body({ code: { type: "string" }, displayName: { type: "string" }, expectedVersion: version, reason }, ["reason"])) },
    },
    "/v1/admin/instructors/{instructorId}/status": { patch: { tags: ["Instructors"], parameters: [id("instructorId"), ...writeHeaders], ...write("Change global instructor lifecycle", body({ status: { type: "string", enum: ["active", "inactive", "archived"] }, expectedVersion: version, reason }, ["status", "reason"])) } },
    "/v1/admin/instructors/{instructorId}/brands": { get: { tags: ["Instructors"], parameters: [id("instructorId")], ...read("List brand assignments for one instructor") } },
    "/v1/admin/brands/{brandId}/instructors": {
      get: { tags: ["Brand teaching"], parameters: [id("brandId")], ...read("List instructors assigned to one brand") },
      post: { tags: ["Brand teaching"], parameters: [id("brandId"), ...writeHeaders], ...write("Assign an instructor to a brand", body({ instructorId: { type: "string", format: "uuid" }, reason }, ["instructorId", "reason"])) },
    },
    "/v1/admin/brands/{brandId}/instructors/{instructorId}/status": { patch: { tags: ["Brand teaching"], parameters: [id("brandId"), id("instructorId"), ...writeHeaders], ...write("Change an instructor brand assignment", body({ status: { type: "string", enum: ["active", "inactive"] }, expectedVersion: version, reason }, ["status", "reason"])) } },
    "/v1/admin/brands/{brandId}/instructors/{instructorId}/courses": { get: { tags: ["Brand teaching"], parameters: [id("brandId"), id("instructorId")], ...read("List a brand instructor's course assignments") } },
    "/v1/admin/brands/{brandId}/courses": {
      get: { tags: ["Brand teaching"], parameters: [id("brandId")], ...read("List courses owned by one brand") },
      post: { tags: ["Brand teaching"], parameters: [id("brandId"), ...writeHeaders], ...write("Create a brand course", body({ code: { type: "string" }, title: { type: "string" }, classification: { type: "string", enum: ["academic_module_offering", "standalone"] }, academicModuleId: { type: ["string", "null"], format: "uuid" }, reason }, ["code", "title", "classification", "academicModuleId", "reason"])) },
    },
    "/v1/admin/brands/{brandId}/courses/{courseId}": {
      get: { tags: ["Brand teaching"], parameters: [id("brandId"), id("courseId")], ...read("Read a brand-owned course") },
      patch: { tags: ["Brand teaching"], parameters: [id("brandId"), id("courseId"), ...writeHeaders], ...write("Update a brand-owned course", body({ title: { type: "string" }, classification: { type: "string", enum: ["academic_module_offering", "standalone"] }, academicModuleId: { type: ["string", "null"], format: "uuid" }, expectedVersion: version, reason }, ["reason"])) },
    },
    "/v1/admin/brands/{brandId}/courses/{courseId}/status": { patch: { tags: ["Brand teaching"], parameters: [id("brandId"), id("courseId"), ...writeHeaders], ...write("Change brand course lifecycle", body({ status: { type: "string", enum: ["draft", "published", "archived"] }, expectedVersion: version, reason }, ["status", "reason"])) } },
    "/v1/admin/brands/{brandId}/courses/{courseId}/instructors": {
      get: { tags: ["Brand teaching"], parameters: [id("brandId"), id("courseId")], ...read("List instructors assigned to a brand course") },
      post: { tags: ["Brand teaching"], parameters: [id("brandId"), id("courseId"), ...writeHeaders], ...write("Assign a brand-approved instructor to a course", body({ instructorId: { type: "string", format: "uuid" }, reason }, ["instructorId", "reason"])) },
    },
    "/v1/admin/brands/{brandId}/courses/{courseId}/instructors/{instructorId}/status": { patch: { tags: ["Brand teaching"], parameters: [id("brandId"), id("courseId"), id("instructorId"), ...writeHeaders], ...write("Change a course instructor assignment", body({ status: { type: "string", enum: ["active", "inactive"] }, expectedVersion: version, reason }, ["status", "reason"])) } },
  },
} as const;

/*
 * The original first-pass explorer remains below temporarily as source history
 * while the standalone, OpenAPI-normalized explorer is served from
 * api-docs-template.ts. It is intentionally not part of the emitted response.
 */
/* const legacyDocsHtml = String.raw`<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>BUC Admin API</title>
<style>
:root{color-scheme:dark;--bg:#07130e;--panel:#0b1a12;--panel-2:#0f2419;--line:#214838;--line-2:#38634b;--text:#eaf8ef;--muted:#a9cdb6;--soft:#bfe7cb;--accent:#27a85e;--accent-2:#7ef0aa;--warn:#f2b84b;--danger:#ff7f7f;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;background:var(--bg);color:var(--text)}
*{box-sizing:border-box}
body{margin:0;min-height:100vh}
button,input,select,textarea{font:inherit}
button,input,select,textarea{border-radius:8px;border:1px solid var(--line-2);background:#0c2016;color:#f3fff7}
input,select,textarea{width:100%;min-height:44px;padding:10px 12px}
button{min-height:44px;padding:10px 14px;background:var(--accent);border-color:var(--accent);font-weight:800;cursor:pointer;transition:background-color .18s ease,border-color .18s ease,transform .18s ease}
button:hover{background:#35bf70;border-color:#35bf70}
button:active{transform:translateY(1px)}
button.secondary{background:#10261b;border-color:var(--line-2);color:var(--text)}
button.ghost{background:transparent;border-color:var(--line);color:var(--soft)}
button:focus-visible,input:focus-visible,select:focus-visible,textarea:focus-visible{outline:3px solid var(--accent-2);outline-offset:2px}
.head{padding:24px 30px;border-bottom:1px solid var(--line);background:linear-gradient(135deg,#0b2419,#07130e)}
.head-top{display:flex;align-items:flex-start;justify-content:space-between;gap:20px}
h1{margin:0;font-size:24px;letter-spacing:0}
.head p{margin:7px 0 0;color:var(--muted);line-height:1.5}
.mode{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end}
.chip{display:inline-flex;align-items:center;min-height:34px;padding:7px 10px;border-radius:999px;border:1px solid var(--line);background:#0d2117;color:var(--soft);font-size:12px;font-weight:800}
.bar{display:grid;grid-template-columns:minmax(280px,1fr) minmax(320px,560px);gap:16px;padding:16px 30px;border-bottom:1px solid #1d3d2e;background:#08150f}
.auth-panel{display:grid;grid-template-columns:1fr 1fr;gap:10px;padding:12px;border:1px solid var(--line);border-radius:12px;background:#0b1a12}
.auth-panel h2{grid-column:1/-1;margin:0;color:#d8f2df;font-size:13px;text-transform:uppercase;letter-spacing:.05em}
.auth-panel .wide{grid-column:1/-1}
.token-panel{display:grid;grid-template-columns:1fr auto auto;gap:10px;align-content:start}
.wrap{display:grid;grid-template-columns:340px minmax(0,1fr);min-height:calc(100vh - 157px)}
aside{border-right:1px solid #1d3d2e;padding:14px;overflow:auto}
.search{margin-bottom:10px}
.tag{margin:14px 0 7px;color:#d8f2df;font-size:12px;font-weight:900;text-transform:uppercase;letter-spacing:.04em}
.endpoint{display:block;width:100%;text-align:left;margin:7px 0;background:#0b1a12;border-color:#1d3d2e}
.endpoint.active{border-color:var(--accent);background:#10301f}
.method{display:inline-flex;align-items:center;justify-content:center;min-width:56px;min-height:24px;margin-right:8px;border-radius:6px;background:#102c1e;color:#7ef0aa;font-size:11px;font-weight:900}
.method.POST,.method.PATCH{background:#352812;color:#ffd884}
.path{display:block;margin-top:7px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12px;line-height:1.45;color:#d7efdf;word-break:break-word}
main{padding:24px;max-width:1180px}
.card{border:1px solid #28513a;border-radius:12px;padding:18px;background:var(--panel);box-shadow:0 18px 44px rgba(0,0,0,.18)}
.hidden{display:none!important}
.hero{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:16px;align-items:start;margin-bottom:16px}
h2{margin:0;font-size:20px;letter-spacing:0}
#summary{margin:7px 0 0;color:var(--muted);line-height:1.5}
.badge-line{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}
.section{margin-top:18px;padding-top:18px;border-top:1px solid #1a3a29}
.section-title{margin:0 0 10px;font-size:13px;text-transform:uppercase;letter-spacing:.05em;color:#d8f2df}
.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
.field label{display:block;font-size:12px;color:#afd0bb;margin:0 0 6px;font-weight:800}
.field small{display:block;margin-top:5px;color:#7da88d;line-height:1.4}
.actions{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-top:18px}
.result-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:18px}
pre{overflow:auto;background:#06100b;border:1px solid #1c3c2b;padding:14px;border-radius:8px;min-height:150px;color:#bff7d1;font-size:12px;line-height:1.55;white-space:pre-wrap}
.status{font-size:12px;color:var(--muted)}
.status.ok{color:var(--accent-2)}
.status.bad{color:var(--danger)}
.help{margin-top:10px;border:1px solid #2f553f;background:#0f2118;border-radius:8px;padding:12px;color:#cdeed7;line-height:1.5}
.help strong{color:#f5fff8}
.schema{margin-top:12px}
.schema summary{cursor:pointer;color:#afd0bb;font-weight:800}
textarea{min-height:120px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12px;line-height:1.5}
@media(prefers-reduced-motion:reduce){*{transition:none!important;scroll-behavior:auto!important}}
@media(max-width:900px){.wrap{grid-template-columns:1fr}aside{border-right:0;border-bottom:1px solid #1d3d2e;max-height:360px}.bar,.head-top,.hero,.auth-panel,.token-panel{grid-template-columns:1fr}.bar{display:grid}.mode{justify-content:flex-start}main{padding:16px}.grid{grid-template-columns:1fr}}
</style>
</head>
<body>
<header class="head">
  <div class="head-top">
    <div>
      <h1>BUC Admin API Explorer</h1>
      <p>واجهة جاهزة لتجربة Admin API محليًا. اختار endpoint، عدل الحقول العادية، وابعت الطلب من غير كتابة JSON يدويًا.</p>
      <p class="hint">Mock runtime: زر Use mock admin يضيف التوكن التجريبي. Supabase runtime يحتاج bearer token حقيقي من نظام الدخول.</p>
    </div>
    <div class="mode" aria-label="Runtime notes">
      <span class="chip">M1</span>
      <span class="chip">M2A</span>
      <span class="chip">M4A</span>
    </div>
  </div>
</header>
<section class="bar" aria-label="Authentication">
  <div class="token-panel">
    <input id="token" type="password" autocomplete="off" placeholder="Bearer token">
    <button id="mockToken" type="button">Use mock admin</button>
    <a href="/openapi.json" target="_blank" rel="noreferrer"><button class="secondary" type="button">Open JSON</button></a>
  </div>
  <form id="supabaseAuth" class="auth-panel" autocomplete="on">
    <h2>Real Supabase Auth</h2>
    <div class="field wide">
      <label for="supabaseUrl">Supabase URL</label>
      <input id="supabaseUrl" type="url" autocomplete="off" placeholder="https://project-ref.supabase.co">
    </div>
    <div class="field wide">
      <label for="supabaseKey">Publishable key</label>
      <input id="supabaseKey" type="password" autocomplete="off" placeholder="sb_publishable_...">
    </div>
    <div class="field">
      <label for="authEmail">Email</label>
      <input id="authEmail" type="email" autocomplete="username" placeholder="admin@example.com">
    </div>
    <div class="field">
      <label for="authPassword">Password</label>
      <input id="authPassword" type="password" autocomplete="current-password" placeholder="Password">
    </div>
    <button id="realLogin" type="submit">Sign in and use token</button>
    <button id="clearAuth" class="secondary" type="button">Clear auth</button>
    <small id="authStatus" class="wide">No real Supabase session in this tab.</small>
  </form>
</section>
<div class="wrap">
  <aside aria-label="API endpoints">
    <input id="filter" class="search" type="search" placeholder="Search endpoints">
    <div id="list"></div>
  </aside>
  <main>
    <div id="empty" class="card">اختار endpoint من الشمال. ابدأ بـ Overview أو Curriculum lists لأنها لا تحتاج IDs.</div>
    <section id="detail" class="card hidden">
      <div class="hero">
        <div>
          <h2 id="title"></h2>
          <p id="summary"></p>
          <div id="badges" class="badge-line"></div>
        </div>
        <button id="fillDemo" class="ghost" type="button">Fill demo values</button>
      </div>
      <div id="paramsBlock" class="section hidden">
        <h3 class="section-title">Path and Query</h3>
        <div id="paramFields" class="grid"></div>
      </div>
      <div id="bodyBlock" class="section hidden">
        <h3 class="section-title">Request Body</h3>
        <div id="bodyFields" class="grid"></div>
      </div>
      <div id="keyRow" class="section hidden">
        <h3 class="section-title">Command Key</h3>
        <div class="grid">
          <div class="field">
            <label for="key">Idempotency-Key</label>
            <input id="key" autocomplete="off" placeholder="example-command-001">
            <small>مطلوب فقط مع POST/PATCH. الزر التجريبي يملأه تلقائيًا.</small>
          </div>
        </div>
      </div>
      <div class="actions">
        <button id="send" type="button">Send request</button>
        <button id="copyUrl" class="secondary" type="button">Copy URL</button>
        <button id="clear" class="ghost" type="button">Clear result</button>
      </div>
      <div class="result-head">
        <h3 class="section-title">Response</h3>
        <span id="status" class="status">No request sent</span>
      </div>
      <div id="help" class="help hidden"></div>
      <pre id="result" aria-live="polite">No request sent.</pre>
      <details class="schema">
        <summary>Advanced: raw generated request JSON</summary>
        <textarea id="debugJson" readonly>{}</textarea>
      </details>
    </section>
  </main>
</div>
<script>
let api;
let selected;
const q = s => document.querySelector(s);
const list = q('#list');
const state = { params: {}, body: {} };
const writeMethods = ['POST','PATCH','PUT','DELETE'];
const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const byId = id => document.getElementById(id);
const isWrite = () => selected && writeMethods.includes(selected.method.toUpperCase());
const configuredSupabaseUrl = ${JSON.stringify(process.env.SUPABASE_URL?.trim() || "")};
const configuredSupabasePublishableKey = ${JSON.stringify(process.env.SUPABASE_PUBLISHABLE_KEY?.trim() || "")};
const schemaForBody = op => op.requestBody && op.requestBody.content && op.requestBody.content['application/json'] && op.requestBody.content['application/json'].schema;
const schemaLabel = schema => Array.isArray(schema && schema.type) ? schema.type.join(' or ') : ((schema && schema.format) || (schema && schema.type) || 'text');
const demoValue = (name, schema, where) => {
  if (schema && schema.enum) return schema.enum[0];
  if (name === 'brand') return 'medway';
  if (name === 'reason') return 'Local API explorer test';
  if (name === 'expectedVersion') return 1;
  if (name === 'classification') return 'standalone';
  if (name === 'status') return 'active';
  if (name === 'academicModuleId' && where === 'body') return null;
  if (name.toLowerCase().includes('code')) return 'LOCAL-DEMO-001';
  if (name.toLowerCase().includes('title')) return 'Local demo course';
  if (name.toLowerCase().includes('displayname')) return 'Local Demo Instructor';
  if ((schema && schema.format === 'uuid') || name.toLowerCase().endsWith('id')) return '';
  return '';
};
const readField = field => {
  if (field.dataset.nullable === 'true' && field.value === '__null__') return null;
  if (field.dataset.type === 'number') return Number(field.value);
  return field.value;
};
const makeField = (kind, name, schema, required) => {
  const wrap = document.createElement('div');
  wrap.className = 'field';
  const id = kind + '-' + name.replace(/[^a-z0-9]/gi, '-');
  const label = document.createElement('label');
  label.htmlFor = id;
  label.textContent = name + (required ? ' *' : '');
  let input;
  if (schema && schema.enum) {
    input = document.createElement('select');
    for (const item of schema.enum) {
      const option = document.createElement('option');
      option.value = String(item);
      option.textContent = String(item);
      input.append(option);
    }
  } else if (Array.isArray(schema && schema.type) && schema.type.includes('null')) {
    input = document.createElement('select');
    const textOption = document.createElement('option');
    textOption.value = '';
    textOption.textContent = 'Use text value';
    const nullOption = document.createElement('option');
    nullOption.value = '__null__';
    nullOption.textContent = 'null';
    input.append(textOption, nullOption);
    input.dataset.nullable = 'true';
  } else {
    input = document.createElement('input');
    input.type = schema && schema.type === 'integer' ? 'number' : 'text';
    input.dataset.type = schema && schema.type === 'integer' ? 'number' : 'text';
  }
  input.id = id;
  input.dataset.kind = kind;
  input.dataset.name = name;
  input.dataset.required = required ? 'true' : 'false';
  input.value = demoValue(name, schema, kind);
  input.addEventListener('input', updateDebug);
  input.addEventListener('change', updateDebug);
  const hint = document.createElement('small');
  hint.textContent = (kind === 'path' ? 'Path parameter' : kind === 'query' ? 'Query parameter' : 'Body field') + ' · ' + schemaLabel(schema);
  wrap.append(label, input, hint);
  return wrap;
};
const setStatus = (text, cls) => {
  const el = q('#status');
  el.className = 'status' + (cls ? ' ' + cls : '');
  el.textContent = text;
};
const updateDebug = () => {
  const params = {};
  const body = {};
  document.querySelectorAll('[data-kind]').forEach(field => {
    const name = field.dataset.name;
    const value = readField(field);
    if (field.dataset.kind === 'body') {
      if (value !== '' || field.dataset.required === 'true') body[name] = value;
    } else if (value !== '') {
      params[name] = value;
    }
  });
  state.params = params;
  state.body = body;
  q('#debugJson').value = JSON.stringify({ params, body, idempotencyKey: q('#key').value }, null, 2);
};
const renderBadges = op => {
  q('#badges').innerHTML = '';
  const tags = [];
  if (op.tags) tags.push.apply(tags, op.tags);
  tags.push(isWrite() ? 'Write command' : 'Read request');
  for (const tag of tags) {
    const span = document.createElement('span');
    span.className = 'chip';
    span.textContent = tag;
    q('#badges').append(span);
  }
};
const show = (path, method, op, button) => {
  selected = { path, method, op };
  document.querySelectorAll('.endpoint').forEach(x => x.classList.remove('active'));
  if (button) button.classList.add('active');
  q('#empty').classList.add('hidden');
  q('#detail').classList.remove('hidden');
  q('#title').textContent = method.toUpperCase() + ' ' + path;
  q('#summary').textContent = op.summary || '';
  q('#paramFields').innerHTML = '';
  q('#bodyFields').innerHTML = '';
  const params = (op.parameters || []).filter(p => p.in === 'path' || p.in === 'query');
  for (const param of params) q('#paramFields').append(makeField(param.in, param.name, param.schema || {}, Boolean(param.required)));
  const bodySchema = schemaForBody(op);
  const required = new Set((bodySchema && bodySchema.required) || []);
  const properties = (bodySchema && bodySchema.properties) || {};
  for (const name of Object.keys(properties)) q('#bodyFields').append(makeField('body', name, properties[name] || {}, required.has(name)));
  q('#paramsBlock').classList.toggle('hidden', params.length === 0);
  q('#bodyBlock').classList.toggle('hidden', Object.keys(properties).length === 0);
  q('#keyRow').classList.toggle('hidden', !isWrite());
  q('#key').value = isWrite() ? 'local-command-' + Date.now() : '';
  q('#help').classList.add('hidden');
  q('#help').textContent = '';
  q('#result').textContent = 'No request sent.';
  setStatus('Ready', '');
  renderBadges(op);
  updateDebug();
};
const buildUrl = () => {
  updateDebug();
  let path = selected.path;
  const query = new URLSearchParams();
  for (const param of selected.op.parameters || []) {
    const value = state.params[param.name];
    if (param.in === 'path') path = path.replace('{' + param.name + '}', encodeURIComponent(String(value || '')));
    if (param.in === 'query' && value !== undefined && String(value).trim()) query.set(param.name, String(value));
  }
  return query.size ? path + '?' + query.toString() : path;
};
const explain = (status, payload) => {
  let code = '';
  try { code = JSON.parse(payload).error && JSON.parse(payload).error.code || ''; } catch {}
  if (status === 400 && code === 'brand_required') return '<strong>Brand مطلوب.</strong> اختار medway أو elite من حقل brand فوق ثم ابعت الطلب مرة تانية.';
  if (status === 401) return '<strong>Auth ناقص.</strong> في وضع mock اضغط Use mock admin. في Supabase mode لازم bearer token حقيقي.';
  if (status === 403) return '<strong>صلاحيات غير كافية.</strong> التوكن الموجود لا يملك permission المطلوبة للـ endpoint.';
  if (status === 404) return '<strong>العنصر غير موجود.</strong> لو endpoint فيه ID، استخدم ID راجع من list endpoint الأول.';
  if (status >= 400) return '<strong>الطلب فشل.</strong> راجع الحقول المطلوبة والقيم المختارة.';
  return '';
};
const authStatus = (text, cls) => {
  const el = q('#authStatus');
  el.className = 'wide status' + (cls ? ' ' + cls : '');
  el.textContent = text;
};
const normalizeSupabaseUrl = value => {
  try {
    const url = new URL(value.trim());
    const local = ['localhost','127.0.0.1','::1'].includes(url.hostname);
    if (url.protocol !== 'https:' && !(local && url.protocol === 'http:')) return '';
    url.pathname = url.pathname.replace(/\/+$/, '');
    url.search = '';
    url.hash = '';
    url.username = '';
    url.password = '';
    return url.toString().replace(/\/$/, '');
  } catch {
    return '';
  }
};
const signInWithPassword = async event => {
  event.preventDefault();
  const url = normalizeSupabaseUrl(q('#supabaseUrl').value);
  const key = q('#supabaseKey').value.trim();
  const email = q('#authEmail').value.trim();
  const password = q('#authPassword').value;
  if (!url || !key || !email || !password) {
    authStatus('Fill Supabase URL, publishable key, email, and password.', 'bad');
    return;
  }
  authStatus('Signing in...', '');
  try {
    const response = await fetch(url + '/auth/v1/token?grant_type=password', {
      method: 'POST',
      headers: { apikey: key, 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || typeof payload.access_token !== 'string' || !payload.access_token) {
      authStatus('Sign in failed. Check email/password and Supabase Auth settings.', 'bad');
      return;
    }
    q('#token').value = payload.access_token;
    q('#token').type = 'password';
    authStatus('Signed in. Access token is ready for API requests in this tab.', 'ok');
  } catch {
    authStatus('Supabase Auth could not be reached from this browser tab.', 'bad');
  }
};
fetch('/openapi.json').then(r => r.json()).then(x => {
  api = x;
  const groups = {};
  for (const [path, item] of Object.entries(x.paths)) {
    for (const [method, op] of Object.entries(item)) {
      const tag = (op.tags && op.tags[0]) || 'Other';
      if (!groups[tag]) groups[tag] = [];
      groups[tag].push({ path, method, op });
    }
  }
  for (const [tag, endpoints] of Object.entries(groups)) {
    const title = document.createElement('div');
    title.className = 'tag';
    title.textContent = tag;
    list.append(title);
    for (const endpoint of endpoints) {
      const button = document.createElement('button');
      button.className = 'endpoint';
      button.dataset.search = (tag + ' ' + endpoint.method + ' ' + endpoint.path + ' ' + (endpoint.op.summary || '')).toLowerCase();
      button.innerHTML = '<span class="method ' + endpoint.method.toUpperCase() + '">' + endpoint.method.toUpperCase() + '</span><span>' + esc(endpoint.op.summary || '') + '</span><span class="path">' + esc(endpoint.path) + '</span>';
      button.onclick = () => show(endpoint.path, endpoint.method, endpoint.op, button);
      list.append(button);
    }
  }
}).catch(() => q('#empty').textContent = 'Unable to load the API contract.');
q('#filter').addEventListener('input', event => {
  const value = event.target.value.trim().toLowerCase();
  document.querySelectorAll('.endpoint').forEach(button => button.classList.toggle('hidden', value && !button.dataset.search.includes(value)));
});
q('#mockToken').onclick = () => {
  q('#token').value = 'mock-auth-medway-admin-001';
  q('#token').type = 'text';
  setStatus('Mock admin token ready', 'ok');
};
q('#supabaseAuth').addEventListener('submit', signInWithPassword);
q('#clearAuth').onclick = () => {
  q('#token').value = '';
  q('#authPassword').value = '';
  authStatus('Cleared this tab auth fields.', '');
};
if (configuredSupabaseUrl) q('#supabaseUrl').value = configuredSupabaseUrl;
if (configuredSupabasePublishableKey) q('#supabaseKey').value = configuredSupabasePublishableKey;
if (configuredSupabaseUrl && configuredSupabasePublishableKey) authStatus('Supabase Auth config loaded from this API process.', 'ok');
q('#fillDemo').onclick = () => {
  if (!selected) return;
  document.querySelectorAll('[data-kind]').forEach(field => {
    const param = (selected.op.parameters || []).find(p => p.name === field.dataset.name);
    const bodySchema = schemaForBody(selected.op);
    const schema = field.dataset.kind === 'body' ? ((bodySchema && bodySchema.properties && bodySchema.properties[field.dataset.name]) || {}) : ((param && param.schema) || {});
    field.value = demoValue(field.dataset.name, schema, field.dataset.kind);
  });
  if (isWrite()) q('#key').value = 'local-command-' + Date.now();
  updateDebug();
};
q('#copyUrl').onclick = async () => {
  if (!selected) return;
  try {
    await navigator.clipboard.writeText(location.origin + buildUrl());
    setStatus('URL copied', 'ok');
  } catch {
    setStatus('Copy failed', 'bad');
  }
};
q('#clear').onclick = () => {
  q('#result').textContent = 'No request sent.';
  q('#help').classList.add('hidden');
  setStatus('Ready', '');
};
q('#send').onclick = async () => {
  if (!selected) return;
  try {
    const missing = Array.from(document.querySelectorAll('[data-required="true"]')).filter(field => !String(readField(field) ?? '').trim()).map(field => field.dataset.name);
    if (missing.length) {
      q('#help').innerHTML = '<strong>Missing fields:</strong> ' + missing.map(esc).join(', ');
      q('#help').classList.remove('hidden');
      setStatus('Fix required fields', 'bad');
      return;
    }
    const url = buildUrl();
    const headers = { Accept: 'application/json' };
    const token = q('#token').value.trim();
    if (token) headers.Authorization = 'Bearer ' + token;
    if (isWrite()) {
      headers['Content-Type'] = 'application/json';
      headers['Idempotency-Key'] = q('#key').value.trim();
    }
    setStatus('Sending...', '');
    const response = await fetch(url, { method: selected.method.toUpperCase(), headers, body: isWrite() ? JSON.stringify(state.body) : undefined });
    const text = await response.text();
    q('#result').textContent = 'HTTP ' + response.status + '\n' + text;
    const hint = explain(response.status, text);
    q('#help').innerHTML = hint;
    q('#help').classList.toggle('hidden', !hint);
    setStatus('HTTP ' + response.status, response.ok ? 'ok' : 'bad');
  } catch {
    q('#result').textContent = 'Request could not be sent.';
    q('#help').innerHTML = '<strong>Request blocked.</strong> تأكد إن السيرفر شغال على نفس origin وافتح /docs من نفس البورت.';
    q('#help').classList.remove('hidden');
    setStatus('Request failed', 'bad');
  }
};
</script>
</body>
</html>`; */

export const openApiResponse = (): HttpJsonResponse => json(200, openApiDocument, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" });
export const apiDocsResponse = (): HttpJsonResponse => ({ statusCode: 200, body: {}, rawBody: createApiDocsHtml({ supabaseUrl: process.env.SUPABASE_URL?.trim() || "", supabasePublishableKey: process.env.SUPABASE_PUBLISHABLE_KEY?.trim() || "" }), headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } });
