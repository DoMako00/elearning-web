import { createServer } from "node:net";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const host = "127.0.0.1";
const port = 3100;
const baseUrl = `http://${host}:${port}`;
const startupTimeoutMs = 5_000;
const shutdownTimeoutMs = 2_000;
const logLimit = 4_000;
const unsafePayloadTerms = ["stack", "trace", "token", "secret", "password", "providerpayload", "rawpayload"];
const apiDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function appendBounded(current, chunk) {
  const next = `${current}${chunk}`;
  return next.length <= logLimit ? next : next.slice(-logLimit);
}

function wait(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function safeSnippet(value) {
  return String(value)
    .replace(/stack|trace|token|secret|password|providerpayload|rawpayload/gi, "[redacted]")
    .slice(0, 500);
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(`${message}: expected ${String(expected)}, received ${String(actual)}`);
  }
}

function assertTruthy(value, message) {
  if (!value) throw new Error(message);
}

function assertNoUnsafeErrorPayload(body) {
  const serialized = JSON.stringify(body).toLowerCase();
  for (const term of unsafePayloadTerms) {
    if (serialized.includes(term)) {
      throw new Error(`Unsafe error payload term detected: ${term}`);
    }
  }
}

function ensurePortAvailable() {
  return new Promise((resolve, reject) => {
    const probe = createServer();
    probe.once("error", () => reject(new Error(`Runtime smoke port ${port} is unavailable. Stop the process using ${host}:${port} and retry.`)));
    probe.listen(port, host, () => {
      probe.close((error) => {
        if (error) {
          reject(new Error("Runtime smoke could not release its local port probe."));
          return;
        }
        resolve();
      });
    });
  });
}

async function request(method, pathname, headers = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 2_000);
  try {
    const requestedBrand = new URL(pathname, baseUrl).searchParams.get("brand");
    const effectiveHeaders = method === "GET" && pathname.startsWith("/v1/admin/") && !Object.hasOwn(headers, "authorization")
      ? { authorization: `Bearer mock-auth-${requestedBrand === "elite" ? "elite" : "medway"}-admin-001`, ...headers }
      : headers;
    const response = await fetch(`${baseUrl}${pathname}`, { method, headers: effectiveHeaders, signal: controller.signal });
    const text = await response.text();
    let body;
    try {
      body = JSON.parse(text);
    } catch {
      throw new Error(`${method} ${pathname} returned invalid JSON: ${safeSnippet(text)}`);
    }
    return { status: response.status, headers: response.headers, body, text };
  } finally {
    clearTimeout(timeout);
  }
}

async function waitForHealth(child) {
  const deadline = Date.now() + startupTimeoutMs;
  let lastFailure = "no response";
  while (Date.now() < deadline) {
    if (child.exitCode !== null) {
      throw new Error(`API process exited before readiness (exit code ${String(child.exitCode)}).`);
    }
    try {
      const response = await request("GET", "/health");
      if (response.status === 200 && response.body?.status === "ok") return;
      lastFailure = `status ${response.status}: ${safeSnippet(response.text)}`;
    } catch (error) {
      lastFailure = error instanceof Error ? error.message : "health request failed";
    }
    await wait(100);
  }
  throw new Error(`API process did not become healthy within ${startupTimeoutMs}ms (${lastFailure}).`);
}

function createRuntimeChild() {
  const environment = {
    API_PORT: String(port),
    API_HOST: host,
    ADMIN_RUNTIME_MODE: "mock",
    NODE_ENV: "test",
  };
  return spawn(process.execPath, ["dist/main.js"], {
    cwd: apiDirectory,
    env: environment,
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
  });
}

async function stopChild(child) {
  if (!child || child.exitCode !== null) return { stopped: true, forced: false };

  const exited = new Promise((resolve) => child.once("exit", () => resolve(true)));
  child.kill("SIGTERM");
  if (await Promise.race([exited, wait(shutdownTimeoutMs).then(() => false)])) {
    return { stopped: true, forced: false };
  }

  child.kill("SIGKILL");
  if (await Promise.race([exited, wait(shutdownTimeoutMs).then(() => false)])) {
    return { stopped: true, forced: true };
  }
  return { stopped: false, forced: true };
}

async function run() {
  await ensurePortAvailable();
  let child;
  let stdout = "";
  let stderr = "";
  const passed = [];

  try {
    child = createRuntimeChild();
    child.stdout.on("data", (chunk) => { stdout = appendBounded(stdout, chunk.toString()); });
    child.stderr.on("data", (chunk) => { stderr = appendBounded(stderr, chunk.toString()); });
    const childError = new Promise((_, reject) => child.once("error", (error) => reject(error)));
    await Promise.race([waitForHealth(child), childError]);

    const checks = [
      ["health", async () => {
        const response = await request("GET", "/health");
        assertEqual(response.status, 200, "Health status");
        assertEqual(response.body.status, "ok", "Health body status");
        assertEqual(response.body.service, "api", "Health service");
        assertEqual(response.body.runtime, "http-api", "Health runtime");
        assertEqual(response.body.mode, "mock", "Health runtime mode");
        assertEqual(response.body.providers?.persistence, "mock", "Health persistence provider");
        assertEqual(response.body.providers?.auth, "mock", "Health auth provider");
        assertEqual(response.body.providers?.adminCommandSource, "mock", "Health command provider");
        assertTruthy(response.headers.get("x-correlation-id"), "Health correlation header");
      }],
      ["ready", async () => {
        const response = await request("GET", "/ready");
        assertEqual(response.status, 200, "Readiness status");
        assertEqual(response.body.status, "ready", "Readiness body status");
        assertEqual(response.body.checks?.adminModule, "ok", "Admin module readiness");
        assertEqual(response.body.checks?.providers, "configured", "Provider readiness");
        assertEqual(response.body.checks?.database, "not_configured", "Database readiness");
        assertEqual(response.body.checks?.auth, "mock", "Auth readiness");
      }],
      ["OpenAPI contract", async () => {
        const response = await request("GET", "/openapi.json");
        assertEqual(response.status, 200, "OpenAPI status");
        assertEqual(response.body.openapi, "3.1.0", "OpenAPI version");
        assertTruthy(response.body.paths?.["/v1/admin/instructors"], "Instructor contract path");
        assertTruthy(response.body.paths?.["/v1/admin/brands/{brandId}/courses/{courseId}/instructors"], "Course instructor contract path");
        assertTruthy(response.headers.get("content-type")?.includes("application/json"), "OpenAPI content type");
      }],
      ["API documentation page", async () => {
        const response = await fetch(`${baseUrl}/docs`);
        const page = await response.text();
        assertEqual(response.status, 200, "Documentation status");
        assertTruthy(response.headers.get("content-type")?.includes("text/html"), "Documentation content type");
        assertTruthy(page.includes("BUC E-Learning API"), "Documentation title");
        assertTruthy(page.includes("/openapi.json"), "Documentation contract link");
        assertTruthy(page.includes("readDashboardSession"), "Documentation must use the active dashboard session");
        assertTruthy(!page.includes("supabaseUrl"), "Documentation must not request Supabase environment values");
        assertTruthy(!page.includes("Use mock admin"), "Documentation must not promote mock authentication");
      }],
      ["M2 curriculum levels are mock-empty", async () => {
        const response = await request("GET", "/v1/admin/curriculum/levels");
        assertEqual(response.status, 200, "Curriculum levels status");
        assertEqual(response.body.ok, true, "Curriculum levels response");
        assertTruthy(Array.isArray(response.body.data) && response.body.data.length === 0, "Curriculum levels must be empty in mock runtime");
      }],
      ["M2 instructors are mock-empty", async () => {
        const response = await request("GET", "/v1/admin/instructors");
        assertEqual(response.status, 200, "Instructors status");
        assertEqual(response.body.ok, true, "Instructors response");
        assertTruthy(Array.isArray(response.body.data) && response.body.data.length === 0, "Instructors must be empty in mock runtime");
      }],
      ["overview missing brand", async () => {
        const response = await request("GET", "/v1/admin/overview");
        assertEqual(response.status, 400, "Missing brand status");
        assertEqual(response.body.ok, false, "Missing brand response");
        assertTruthy(response.headers.get("x-correlation-id"), "Missing brand correlation header");
        assertTruthy(response.body.error?.message, "Missing brand safe error message");
        assertNoUnsafeErrorPayload(response.body);
      }],
      ["overview invalid brand", async () => {
        const response = await request("GET", "/v1/admin/overview?brand=unknown");
        assertEqual(response.status, 400, "Invalid brand status");
        assertEqual(response.body.ok, false, "Invalid brand response");
        assertTruthy(!Object.hasOwn(response.body, "data"), "Invalid brand must not load overview data");
        assertNoUnsafeErrorPayload(response.body);
      }],
      ["medway overview", async () => {
        const response = await request("GET", "/v1/admin/overview?brand=medway", { "x-correlation-id": "runtime-smoke-medway-001" });
        assertEqual(response.status, 200, "Medway overview status");
        assertEqual(response.body.ok, true, "Medway overview response");
        assertEqual(response.body.correlationId, "runtime-smoke-medway-001", "Medway correlation ID");
        assertEqual(response.body.brand?.brandCode, "medway", "Medway brand code");
        assertEqual(response.body.brand?.brandId, "brand-medway", "Medway brand ID");
        assertTruthy(response.body.data, "Medway overview data");
      }],
      ["elite overview", async () => {
        const response = await request("GET", "/v1/admin/overview?brand=elite", { "x-correlation-id": "runtime-smoke-elite-001" });
        assertEqual(response.status, 200, "Elite overview status");
        assertEqual(response.body.ok, true, "Elite overview response");
        assertEqual(response.body.correlationId, "runtime-smoke-elite-001", "Elite correlation ID");
        assertEqual(response.body.brand?.brandCode, "elite", "Elite brand code");
        assertEqual(response.body.brand?.brandId, "brand-elite", "Elite brand ID");
        assertTruthy(response.body.data, "Elite overview data");
      }],
      ["method not allowed", async () => {
        const response = await request("POST", "/v1/admin/overview?brand=medway");
        assertEqual(response.status, 405, "Method-not-allowed status");
        assertTruthy(response.headers.get("allow")?.includes("GET"), "Method-not-allowed Allow header");
        assertEqual(response.body.ok, false, "Method-not-allowed response");
        assertNoUnsafeErrorPayload(response.body);
      }],
      ["not found", async () => {
        const response = await request("GET", "/unknown");
        assertEqual(response.status, 404, "Not-found status");
        assertEqual(response.body.ok, false, "Not-found response");
        assertTruthy(response.headers.get("x-correlation-id"), "Not-found correlation header");
        assertNoUnsafeErrorPayload(response.body);
      }],
    ];

    for (const [name, check] of checks) {
      try {
        await check();
        passed.push(name);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown smoke-check failure.";
        throw new Error(`${name} failed: ${message}`);
      }
    }

    console.log("Runtime smoke passed:");
    for (const name of passed) console.log(`- ${name}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected runtime smoke failure.";
    console.error(`Runtime smoke failed: ${message}`);
    if (stdout) console.error(`API stdout: ${safeSnippet(stdout)}`);
    if (stderr) console.error(`API stderr: ${safeSnippet(stderr)}`);
    process.exitCode = 1;
  } finally {
    const shutdown = await stopChild(child);
    if (!shutdown.stopped) {
      console.error("Runtime smoke failed: API child process did not stop.");
      process.exitCode = 1;
    } else if (shutdown.forced) {
      console.warn("Runtime smoke warning: API child required forced termination.");
    } else if (child) {
      console.log("Runtime smoke server stopped cleanly.");
    }
  }
}

await run();
