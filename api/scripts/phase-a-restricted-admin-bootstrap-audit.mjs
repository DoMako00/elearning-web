import { classifyPhaseAError, createPhaseADiagnostic, safePhaseAOutput } from "./phase-a-postgres-diagnostics.mjs";

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
  try {
    await dependencies.validateGates(); mark(diagnostic, "gates");
    await dependencies.validateTarget(); mark(diagnostic, "target_classification");
    await dependencies.readCertificate(); mark(diagnostic, "certificate_parse");
    pool = await dependencies.createPool(); mark(diagnostic, "pool_initialization");
    client = await pool.connect(); diagnostic.connectionAcquired = true; mark(diagnostic, "connection_acquisition");
    const baseline = await dependencies.captureSnapshot(client, "baseline", diagnostic);
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
  return Object.freeze({ diagnostic: Object.freeze({ ...diagnostic }), output: safePhaseAOutput(diagnostic) });
}
