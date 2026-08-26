import { existsSync, readFileSync } from "node:fs";
import { X509Certificate } from "node:crypto";
import { pathToFileURL } from "node:url";
import { classifyPostgresTarget } from "./postgres-target-classifier.mjs";
import { createReadOnlySnapshot, compareReadOnlySnapshots } from "./read-only-admin-snapshot.mjs";
import { classifyPhaseAError, createPhaseADiagnostic, safePhaseAOutput } from "./phase-a-postgres-diagnostics.mjs";

const PROJECT_REF = "mgrsgibxuwgbxtdqprkw";
const REQUIRED = ["SUPABASE_LIVE_AUTH_BOOTSTRAP", "SUPABASE_LIVE_AUTH_TARGET_ENVIRONMENT", "SUPABASE_PROJECT_REF", "SUPABASE_LIVE_AUTH_BOOTSTRAP_USER_ID", "SUPABASE_LIVE_AUTH_MEDWAY_BRAND_ID", "SUPABASE_LIVE_AUTH_DB_TARGET_CONFIRMED", "SUPABASE_DB_URL", "PGSSLROOTCERT"];
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function mark(diagnostic, stage) { diagnostic.lastSuccessfulStage = stage; }
function failedStage(error, fallback) { return typeof error?.phaseAStage === "string" ? error.phaseAStage : fallback; }

/**
 * Future Phase A composition only. It has no environment loader, network call,
 * SQL text, or public entrypoint; the future approved runner supplies fixed
 * gates and fixed read-only snapshot operations through these narrow hooks.
 */
export async function runPhaseAReadOnlyAudit(dependencies) {
  const diagnostic = createPhaseADiagnostic();
  let pool;
  let client;
  let baseline;
  try {
    await dependencies.validateGates(); mark(diagnostic, "gates");
    await dependencies.validateTarget(); mark(diagnostic, "target_classification");
    await dependencies.readCertificate(); mark(diagnostic, "certificate_parse");
    pool = await dependencies.createPool(); mark(diagnostic, "pool_initialization");
    client = await pool.connect(); diagnostic.connectionAcquired = true; mark(diagnostic, "connection_acquisition");
    baseline = await dependencies.captureSnapshot(client, "baseline", diagnostic);
    const final = await dependencies.captureSnapshot(client, "final", diagnostic);
    diagnostic.snapshotStage = "snapshot_comparison";
    if (!dependencies.identical(baseline, final)) throw Object.assign(new Error("snapshot difference"), { phaseAStage: "snapshot_comparison" });
    mark(diagnostic, "snapshot_comparison");
  } catch (error) {
    const stage = failedStage(error, diagnostic.lastSuccessfulStage === "none" ? "gates" : "connection_acquisition");
    diagnostic.firstFailedStage = stage;
    diagnostic.snapshotStage = stage.startsWith("baseline_") || stage.startsWith("final_") ? stage : diagnostic.snapshotStage;
    diagnostic.category = classifyPhaseAError(error, stage);
  } finally {
    try { if (client) { await client.release(); diagnostic.clientReleased = "yes"; } } catch { diagnostic.clientReleased = "no"; diagnostic.category = "CLEANUP_FAILED"; diagnostic.firstFailedStage ??= "cleanup"; }
    try { if (pool) { await pool.end(); diagnostic.poolClosed = "yes"; } } catch { diagnostic.poolClosed = "no"; diagnostic.category = "CLEANUP_FAILED"; diagnostic.firstFailedStage ??= "cleanup"; }
  }
  return Object.freeze({ diagnostic: Object.freeze({ ...diagnostic }), snapshot: baseline, output: safePhaseAOutput(diagnostic) });
}

function missingGates(environment) {
  const missing = REQUIRED.filter((name) => typeof environment[name] !== "string" || environment[name].trim() === "");
  if (environment.SUPABASE_LIVE_AUTH_BOOTSTRAP !== "true" && !missing.includes("SUPABASE_LIVE_AUTH_BOOTSTRAP")) missing.push("SUPABASE_LIVE_AUTH_BOOTSTRAP");
  if (environment.SUPABASE_LIVE_AUTH_TARGET_ENVIRONMENT !== "staging" && !missing.includes("SUPABASE_LIVE_AUTH_TARGET_ENVIRONMENT")) missing.push("SUPABASE_LIVE_AUTH_TARGET_ENVIRONMENT");
  if (environment.SUPABASE_PROJECT_REF !== PROJECT_REF && !missing.includes("SUPABASE_PROJECT_REF")) missing.push("SUPABASE_PROJECT_REF");
  if (environment.SUPABASE_LIVE_AUTH_DB_TARGET_CONFIRMED !== "true" && !missing.includes("SUPABASE_LIVE_AUTH_DB_TARGET_CONFIRMED")) missing.push("SUPABASE_LIVE_AUTH_DB_TARGET_CONFIRMED");
  if (environment.NODE_TLS_REJECT_UNAUTHORIZED === "0") missing.push("NODE_TLS_REJECT_UNAUTHORIZED");
  for (const name of ["SUPABASE_LIVE_AUTH_BOOTSTRAP_USER_ID", "SUPABASE_LIVE_AUTH_MEDWAY_BRAND_ID"]) if (typeof environment[name] === "string" && !UUID.test(environment[name])) missing.push(name);
  if (typeof environment.SUPABASE_DB_URL === "string" && classifyPostgresTarget(environment.SUPABASE_DB_URL, PROJECT_REF) !== "supabase_session_pooler") missing.push("SUPABASE_DB_URL");
  return [...new Set(missing)];
}

function eligible(snapshot) {
  const a = snapshot.authority;
  return a.authUser === "exactly_one" && a.medwayBrand === "one_active" && !["ambiguous", "inactive"].includes(a.appUser) && !["ambiguous", "cross_brand_conflict"].includes(a.adminScope) && a.eliteAuthority === "absent" && a.roleAssignment !== "ambiguous" && a.curriculum === "absent";
}

export async function executePhaseA(environment = process.env, dependencies = {}) {
  const gates = missingGates(environment);
  if (gates.length) return `MISSING_GATES\n${gates.join("\n")}`;
  const readCertificate = dependencies.readCertificate ?? ((path) => readFileSync(path, "utf8"));
  const parseCertificate = dependencies.parseCertificate ?? ((value) => new X509Certificate(value));
  const createPool = dependencies.createPool ?? (async (certificate) => { const { Pool } = await import("pg"); return new Pool({ connectionString: environment.SUPABASE_DB_URL, max: 1, connectionTimeoutMillis: 5000, query_timeout: 5000, ssl: { ca: certificate, rejectUnauthorized: true } }); });
  let certificate;
  const result = await runPhaseAReadOnlyAudit({
    validateGates: async () => {}, validateTarget: async () => {},
    readCertificate: async () => { const path = environment.PGSSLROOTCERT; if (!existsSync(path)) throw Object.assign(new Error("certificate"), { phaseAStage: "certificate_read" }); certificate = readCertificate(path); if (!certificate.trim()) throw Object.assign(new Error("certificate"), { phaseAStage: "certificate_read" }); try { parseCertificate(certificate); } catch { throw Object.assign(new Error("certificate"), { phaseAStage: "certificate_parse" }); } },
    createPool: async () => createPool(certificate),
    captureSnapshot: (client, phase, diagnostic) => createReadOnlySnapshot(client, { authUserId: environment.SUPABASE_LIVE_AUTH_BOOTSTRAP_USER_ID, brandId: environment.SUPABASE_LIVE_AUTH_MEDWAY_BRAND_ID }, phase, diagnostic),
    identical: compareReadOnlySnapshots,
  });
  if (result.diagnostic.category !== "NONE") return result.output;
  const snapshot = result.snapshot;
  const a = snapshot.authority;
  return [`auth_user=${a.authUser}`, `app_user_mapping=${a.appUser}`, `medway_brand=${a.medwayBrand}`, `admin_scope=${a.adminScope}`, `elite_authority=${a.eliteAuthority}`, `role_assignment=${a.roleAssignment}`, `read_permission_catalogue=${a.catalogue}`, `read_permission_projection=${a.projection}`, `curriculum_read_permission=${a.curriculum}`, "baseline_final=equal", `phase_b_proposal_eligibility=${eligible(snapshot) ? "ready" : "not_safe"}`, eligible(snapshot) ? "PHASE_B_PROPOSAL_READY" : "PHASE_B_NOT_SAFE"].join("\n");
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  executePhaseA().then((value) => process.stdout.write(`${value}\n`)).catch(() => { process.stdout.write("PHASE_A_DIAGNOSTIC\nlast_successful_stage=none\nfirst_failed_stage=gates\ndiagnostic_category=GATE_VALIDATION_FAILED\nconnection_acquired=no\nread_only_transaction_started=no\nread_only_transaction_ended=not_started\nsnapshot_stage=not_reached\nsql_queries_executed=no\nmutation_attempted=no\nclient_released=not_created\npool_closed=not_created\nPHASE_A_DIAGNOSTIC_INCONCLUSIVE\n"); process.exitCode = 2; });
}
