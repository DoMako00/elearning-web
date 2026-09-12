export const PhaseAStages = Object.freeze([
  "gates", "target_classification", "certificate_read", "certificate_parse", "pool_initialization", "connection_acquisition", "tls_and_database_authentication", "database_identity_transaction_begin", "database_identity_query", "database_identity_transaction_end", "baseline_transaction_begin", "baseline_fixed_counts", "baseline_auth_user", "baseline_app_user", "baseline_medway_brand", "baseline_admin_scope", "baseline_role_assignment", "baseline_permission_catalogue", "baseline_permission_projection", "baseline_normalization", "baseline_transaction_end", "final_transaction_begin", "final_fixed_counts", "final_auth_user", "final_app_user", "final_medway_brand", "final_admin_scope", "final_role_assignment", "final_permission_catalogue", "final_permission_projection", "final_normalization", "final_transaction_end", "snapshot_comparison", "cleanup",
]);

export const PhaseACategories = Object.freeze(["GATE_VALIDATION_FAILED", "TARGET_VALIDATION_FAILED", "CERTIFICATE_READ_FAILED", "CERTIFICATE_PARSE_FAILED", "POOL_INITIALIZATION_FAILED", "DNS_UNRESOLVED", "IPV6_UNAVAILABLE", "NETWORK_UNREACHABLE", "CONNECTION_TIMEOUT", "CONNECTION_REFUSED", "CONNECTION_RESET", "NETWORK_RESTRICTED_OR_FILTERED", "TLS_CA_REJECTED", "TLS_HOSTNAME_MISMATCH", "TLS_NEGOTIATION_FAILED", "DATABASE_AUTHENTICATION_FAILED", "DATABASE_ACCOUNT_RESTRICTED", "DATABASE_UNAVAILABLE", "READ_ONLY_TRANSACTION_BEGIN_FAILED", "READ_ONLY_TRANSACTION_END_FAILED", "DATABASE_IDENTITY_MISMATCH", "SCHEMA_OBJECT_MISSING", "COLUMN_OR_SCHEMA_MISMATCH", "QUERY_PERMISSION_DENIED", "PARAMETER_TYPE_MISMATCH", "QUERY_TIMEOUT", "RESULT_SHAPE_UNEXPECTED", "DATA_CLASSIFICATION_AMBIGUOUS", "SNAPSHOT_NORMALIZATION_FAILED", "SNAPSHOT_DIFFERENCE_DETECTED", "CONNECTION_FAILED_OTHER", "QUERY_FAILED_OTHER", "CLEANUP_FAILED", "NONE"]);

const connectionStages = new Set(["certificate_read", "certificate_parse", "pool_initialization", "connection_acquisition", "tls_and_database_authentication"]);
const queryStages = new Set(PhaseAStages.filter((stage) => stage.includes("transaction") || stage.includes("baseline_") || stage.includes("final_") || stage === "snapshot_comparison"));

export function classifyPhaseAError(error, stage) {
  if (typeof error?.phaseACategory === "string" && PhaseACategories.includes(error.phaseACategory) && error.phaseACategory !== "NONE") return error.phaseACategory;
  if (stage === "gates") return "GATE_VALIDATION_FAILED";
  if (stage === "target_classification") return "TARGET_VALIDATION_FAILED";
  if (stage === "certificate_read") return "CERTIFICATE_READ_FAILED";
  if (stage === "certificate_parse") return "CERTIFICATE_PARSE_FAILED";
  if (stage === "pool_initialization") return "POOL_INITIALIZATION_FAILED";
  if (stage === "cleanup") return "CLEANUP_FAILED";
  if (stage.endsWith("transaction_begin")) return "READ_ONLY_TRANSACTION_BEGIN_FAILED";
  if (stage.endsWith("transaction_end")) return "READ_ONLY_TRANSACTION_END_FAILED";
  if (stage === "snapshot_comparison") return "SNAPSHOT_DIFFERENCE_DETECTED";
  const code = typeof error?.code === "string" ? error.code : "";
  const sqlState = typeof error?.sqlState === "string" ? error.sqlState : typeof error?.code === "string" && /^[0-9A-Z]{5}$/.test(error.code) ? error.code : "";
  if (code === "ENOTFOUND" || code === "EAI_AGAIN") return "DNS_UNRESOLVED";
  if (code === "ENETUNREACH" || code === "EHOSTUNREACH") return "NETWORK_UNREACHABLE";
  if (code === "ETIMEDOUT") return "CONNECTION_TIMEOUT";
  if (code === "ECONNREFUSED") return "CONNECTION_REFUSED";
  if (code === "ECONNRESET") return "CONNECTION_RESET";
  if (["SELF_SIGNED_CERT_IN_CHAIN", "UNABLE_TO_VERIFY_LEAF_SIGNATURE", "CERT_HAS_EXPIRED", "UNABLE_TO_GET_ISSUER_CERT_LOCALLY"].includes(code)) return "TLS_CA_REJECTED";
  if (["ERR_TLS_CERT_ALTNAME_INVALID", "ERR_TLS_HOSTNAME_MISMATCH"].includes(code)) return "TLS_HOSTNAME_MISMATCH";
  if (code.startsWith("ERR_SSL_") || code.startsWith("ERR_TLS_")) return "TLS_NEGOTIATION_FAILED";
  if (["28P01", "28000"].includes(sqlState)) return "DATABASE_AUTHENTICATION_FAILED";
  if (sqlState === "42501") return connectionStages.has(stage) ? "DATABASE_ACCOUNT_RESTRICTED" : "QUERY_PERMISSION_DENIED";
  if (["3D000", "57P01", "57P02", "57P03"].includes(sqlState)) return "DATABASE_UNAVAILABLE";
  if (["3F000", "42P01"].includes(sqlState)) return "SCHEMA_OBJECT_MISSING";
  if (sqlState === "42703") return "COLUMN_OR_SCHEMA_MISMATCH";
  if (["22P02", "42804"].includes(sqlState)) return "PARAMETER_TYPE_MISMATCH";
  if (["57014", "55P03"].includes(sqlState)) return "QUERY_TIMEOUT";
  if (connectionStages.has(stage)) return "CONNECTION_FAILED_OTHER";
  return queryStages.has(stage) ? "QUERY_FAILED_OTHER" : "QUERY_FAILED_OTHER";
}

export function terminalFor(category) {
  if (category === "NONE") return "PHASE_A_RETRY_READY";
  if (category === "CLEANUP_FAILED") return "PHASE_A_DIAGNOSTIC_INCONCLUSIVE";
  if (["GATE_VALIDATION_FAILED", "TARGET_VALIDATION_FAILED", "CERTIFICATE_READ_FAILED", "CERTIFICATE_PARSE_FAILED", "POOL_INITIALIZATION_FAILED", "DNS_UNRESOLVED", "IPV6_UNAVAILABLE", "NETWORK_UNREACHABLE", "CONNECTION_TIMEOUT", "CONNECTION_REFUSED", "CONNECTION_RESET", "NETWORK_RESTRICTED_OR_FILTERED", "TLS_CA_REJECTED", "TLS_HOSTNAME_MISMATCH", "TLS_NEGOTIATION_FAILED", "DATABASE_AUTHENTICATION_FAILED", "DATABASE_ACCOUNT_RESTRICTED", "DATABASE_UNAVAILABLE", "CONNECTION_FAILED_OTHER"].includes(category)) return "PHASE_A_CONNECTION_REMEDIATION_REQUIRED";
  return "PHASE_A_QUERY_REMEDIATION_REQUIRED";
}

export function createPhaseADiagnostic() {
  return { lastSuccessfulStage: "none", firstFailedStage: undefined, category: "NONE", connectionAcquired: false, transactionStarted: false, transactionEnded: "not_started", snapshotStage: "not_reached", sqlQueriesExecuted: false, clientReleased: "not_created", poolClosed: "not_created" };
}

export function safePhaseAOutput(diagnostic) {
  return ["PHASE_A_DIAGNOSTIC", `last_successful_stage=${diagnostic.lastSuccessfulStage}`, `first_failed_stage=${diagnostic.firstFailedStage ?? "none"}`, `diagnostic_category=${diagnostic.category}`, `connection_acquired=${diagnostic.connectionAcquired ? "yes" : "no"}`, `read_only_transaction_started=${diagnostic.transactionStarted ? "yes" : "no"}`, `read_only_transaction_ended=${diagnostic.transactionEnded}`, `snapshot_stage=${diagnostic.snapshotStage}`, `sql_queries_executed=${diagnostic.sqlQueriesExecuted ? "yes" : "no"}`, "mutation_attempted=no", `client_released=${diagnostic.clientReleased}`, `pool_closed=${diagnostic.poolClosed}`, terminalFor(diagnostic.category)].join("\n");
}
