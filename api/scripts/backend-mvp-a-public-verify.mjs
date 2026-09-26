import { pathToFileURL } from "node:url";

// Fixed public/no-bearer GET baseline. No credentials, redirects, arbitrary URL
// input, response bodies, internal IDs, environment loading, or writes.
const base = "http://72.61.87.212:8080/api";
const cases = [
  ["health", "/health", 200, "health"], ["ready", "/ready", 200, "ready"],
  ["versioned_health", "/v1/health", 200, "health"], ["versioned_ready", "/v1/ready", 200, "ready"],
  ["openapi", "/openapi.json", 200, "openapi"], ["docs", "/docs", 200, "html"],
  ["student_no_bearer", "/v1/student/courses?brand=elite&page=1&pageSize=25", 401, "denial"],
  ["admin_no_bearer", "/v1/admin/curriculum/institutions", 401, "denial"],
];
async function boundedText(response) {
  const chunks = []; let size = 0;
  for await (const chunk of response.body ?? []) {
    size += chunk.byteLength;
    if (size > 2 * 1024 * 1024) throw new Error("response_limit");
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString("utf8");
}
export async function verifyPublicBaseline(fetchImpl = fetch) {
  const results = [];
  for (const [id, path, expectedStatus, kind] of cases) {
    try {
      const response = await fetchImpl(base + path, {
        method: "GET", redirect: "error", signal: AbortSignal.timeout(15000),
        headers: { Accept: kind === "html" ? "text/html" : "application/json" },
      });
      const text = await boundedText(response);
      let body;
      if (kind !== "html") { try { body = JSON.parse(text); } catch {} }
      const assertions = {
        expected_status: response.status === expectedStatus,
        content_type: response.headers.get("content-type")?.includes(kind === "html" ? "text/html" : "application/json") === true,
        correlation_header: Boolean(response.headers.get("x-correlation-id")),
        response_contract: kind === "html" ? /<!doctype html/i.test(text)
          : kind === "health" ? body?.status === "ok"
          : kind === "ready" ? body?.status === "ready"
          : kind === "openapi" ? typeof body?.openapi === "string" && Boolean(body?.paths?.["/v1/student/courses"]?.get)
          : body?.ok === false && body?.error?.code === "unauthenticated" && (body.data === undefined || body.data === null),
      };
      const failedAssertions = Object.keys(assertions).filter(key => !assertions[key]);
      results.push({ id, status: failedAssertions.length ? "failed" : "passed", httpStatus: response.status, failedAssertions });
    } catch { results.push({ id, status: "blocked", reason: "request_or_response_unavailable" }); }
  }
  return { suite: "backend_mvp_a_public_baseline", generatedAt: new Date().toISOString(),
    evidence: "existing_deployment_public_http_only", deploymentOfThisBranchConfirmed: false,
    authenticatedAcceptance: "not_run", databaseAcceptance: "not_run", testSpriteExecution: "not_run",
    acceptanceComplete: false, productionMutationsAttempted: 0, results };
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (process.argv.slice(2).join(" ") !== "--public-baseline") {
    process.stdout.write("Use --public-baseline to run the fixed read-only live checks.\n"); process.exitCode = 2;
  } else {
    const report = await verifyPublicBaseline();
    process.stdout.write(JSON.stringify(report, null, 2) + "\n");
    process.exitCode = report.results.some(item => item.status === "failed") ? 1 : report.results.some(item => item.status === "blocked") ? 2 : 0;
  }
}

