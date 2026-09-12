import { AUTHORITY_QUERY, COUNTS_QUERY, candidateSubject, captureSnapshot, classify, identical } from "./supabase-live-auth-only-verify.mjs";
function assert(value, message) { if (!value) throw new Error(message); }
const subject = "10000000-0000-4000-8000-000000000010";
const token = `x.${Buffer.from(JSON.stringify({ sub: subject })).toString("base64url")}.x`;
assert(candidateSubject(token) === subject, "candidate UUID subject");
assert(candidateSubject("bad") === undefined, "malformed subject");
assert(!/\b(insert|update|delete|merge|truncate|create|alter|drop|grant|revoke|call)\b/i.test(`${COUNTS_QUERY} ${AUTHORITY_QUERY}`), "query catalogue must remain read-only");
assert(/app\.academic_modules/.test(COUNTS_QUERY) && /app\.app_users/.test(AUTHORITY_QUERY), "application tables must be schema-qualified");
const queries = []; let released = 0; let ended = 0;
const pool = { async connect() { return { async query(input) { queries.push(typeof input === "string" ? input : input.text); if (typeof input !== "string" && input.text === COUNTS_QUERY) return { rows: [{ database_ok: true, academic_levels: 5, academic_semesters: 10, academic_modules: 60, admin_actions: 0, audit_logs: 0 }] }; if (typeof input !== "string" && input.text === AUTHORITY_QUERY) return { rows: [{ app_user_total: 1, app_user_active: 1, active_medway_profiles: 1, inactive_profiles: 0, active_roles: 1, inactive_roles: 0, catalogue_codes: 0, projected_codes: 0, curriculum_effective: false }] }; return { rows: [] }; }, release() { released++; } }; }, async end() { ended++; } };
const snapshot = await captureSnapshot(subject, async () => pool);
assert(snapshot.authority.appUser === "one_active" && snapshot.authority.scope === "one_active_medway" && snapshot.authority.curriculum === "absent", "authority classification");
assert(queries[0] === "begin transaction read only" && queries.at(-1) === "commit" && released === 1 && ended === 1, "fresh read-only transaction cleanup");
assert(identical(snapshot, snapshot), "identical snapshots pass");
assert(!identical(snapshot, { ...snapshot, counts: { ...snapshot.counts, admin_actions: 1 } }), "mutation delta fails");
assert(classify({ app_user_total: 0, app_user_active: 0, active_medway_profiles: 0, inactive_profiles: 0, active_roles: 0, inactive_roles: 0, catalogue_codes: 6, projected_codes: 0, curriculum_effective: false }).appUser === "missing", "missing app user classification");
console.log("live auth snapshot verifier selftest passed");
