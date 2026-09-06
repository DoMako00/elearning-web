import { execFile, spawn } from "node:child_process";
import { promisify } from "node:util";
import http from "node:http";
import net from "node:net";
import { setTimeout as delay } from "node:timers/promises";

const execFileAsync = promisify(execFile);
const API_IMAGE = "elearning-api:local";
const WEB_IMAGE = "elearning-web:local";
const API_CONTAINER = "elearning-api-smoke";
const WEB_CONTAINER = "elearning-web-smoke";
const API_HOST = "127.0.0.1";
const API_PORT = 3200;
const WEB_PORT = 8081;
const POLL_TIMEOUT_MS = 15_000;
const POLL_INTERVAL_MS = 250;
const LOG_LIMIT = 4_000;

const checks = [];
let apiStarted = false;
let webStarted = false;

function safeText(value, limit = 600) {
  return String(value).replace(/\s+/g, " ").trim().slice(0, limit);
}

function errorMessage(error) {
  return error instanceof Error ? error.message : safeText(error);
}

function recordPass(name) {
  checks.push({ name, passed: true });
}

function recordFail(name, error) {
  checks.push({ name, passed: false, details: errorMessage(error) });
}

async function runCheck(name, action) {
  try {
    await action();
    recordPass(name);
    return true;
  } catch (error) {
    recordFail(name, error);
    return false;
  }
}

async function docker(args, options = {}) {
  try {
    return await execFileAsync("docker", args, {
      cwd: process.cwd(),
      windowsHide: true,
      maxBuffer: 1024 * 1024,
      ...options,
    });
  } catch (error) {
    const detail = error?.stderr || error?.stdout || error;
    throw new Error(`docker ${args.join(" ")} failed: ${safeText(detail)}`);
  }
}

function checkPortFree(port) {
  return new Promise((resolve, reject) => {
    const probe = net.createServer();
    probe.once("error", () => reject(new Error(`Port ${port} is busy.`)));
    probe.listen(port, API_HOST, () => {
      probe.close((error) => {
        if (error) reject(new Error(`Port ${port} could not be released after probing.`));
        else resolve();
      });
    });
  });
}

function request(port, method, pathname) {
  return new Promise((resolve, reject) => {
    const requestObject = http.request({
      host: API_HOST,
      port,
      path: pathname,
      method,
      timeout: 2_000,
      headers: { accept: "application/json, text/html" },
    }, (response) => {
      const chunks = [];
      response.setEncoding("utf8");
      response.on("data", (chunk) => chunks.push(chunk));
      response.on("end", () => resolve({
        statusCode: response.statusCode ?? 0,
        headers: response.headers,
        body: chunks.join(""),
      }));
    });
    requestObject.on("timeout", () => requestObject.destroy(new Error("HTTP request timed out.")));
    requestObject.on("error", reject);
    requestObject.end();
  });
}

function assertStatus(response, expected, label) {
  if (response.statusCode !== expected) {
    throw new Error(`${label}: expected ${expected}, received ${response.statusCode}; body=${safeText(response.body)}`);
  }
}

function assertNon2xx(response, label) {
  if (response.statusCode >= 200 && response.statusCode < 300) {
    throw new Error(`${label}: expected non-2xx, received ${response.statusCode}; body=${safeText(response.body)}`);
  }
}

function assertBodyIncludes(response, text, label) {
  if (!response.body.toLowerCase().includes(text.toLowerCase())) {
    throw new Error(`${label}: response did not include ${text}; body=${safeText(response.body)}`);
  }
}

function assertHtml(response, label) {
  if (!/<(?:!doctype html|html\b)|id=["']root["']/i.test(response.body)) {
    throw new Error(`${label}: response did not look like the SPA HTML; body=${safeText(response.body)}`);
  }
}

async function waitForHttp(port, pathname, label) {
  const deadline = Date.now() + POLL_TIMEOUT_MS;
  let lastError = "no response";
  while (Date.now() < deadline) {
    try {
      const response = await request(port, "GET", pathname);
      if (response.statusCode === 200) return response;
      lastError = `status ${response.statusCode}: ${safeText(response.body)}`;
    } catch (error) {
      lastError = errorMessage(error);
    }
    await delay(POLL_INTERVAL_MS);
  }
  throw new Error(`${label} did not become ready within ${POLL_TIMEOUT_MS}ms (${lastError}).`);
}

async function printContainerLogs(name) {
  try {
    const result = await docker(["logs", "--tail", "100", name]);
    const output = safeText(`${result.stdout}\n${result.stderr}`, LOG_LIMIT);
    console.error(`[${name}] logs: ${output || "<no logs>"}`);
  } catch (error) {
    console.error(`[${name}] logs unavailable: ${safeText(errorMessage(error))}`);
  }
}

async function removeExactContainer(name) {
  try {
    await docker(["container", "inspect", name]);
  } catch {
    return;
  }
  await docker(["rm", "-f", name]);
}

async function stopExactContainer(name) {
  try {
    await docker(["stop", name]);
  } catch {
    try {
      await docker(["container", "inspect", name]);
    } catch {
      return;
    }
    await docker(["rm", "-f", name]);
  }
}

async function startContainer(args, name) {
  await docker(["run", "-d", "--rm", "--name", name, ...args]);
}

async function verifyDockerAndImages() {
  await runCheck("Docker available", async () => { await docker(["version"]); });
  if (!checks.at(-1).passed) return false;

  const imageChecks = [
    ["API image exists", API_IMAGE],
    ["Web image exists", WEB_IMAGE],
  ];
  let imagesReady = true;
  for (const [name, image] of imageChecks) {
    const ready = await runCheck(name, async () => { await docker(["image", "inspect", image]); });
    if (!ready) {
      imagesReady = false;
      console.error(`Missing image: ${image}`);
    }
  }
  if (!imagesReady) {
    console.error("Build the missing images with:");
    console.error("docker build -f deploy/docker/api.Dockerfile -t elearning-api:local .");
    console.error("docker build -f deploy/docker/web.Dockerfile -t elearning-web:local --build-arg VITE_ADMIN_DATA_SOURCE=mock --build-arg VITE_API_BASE_URL=http://localhost:3000 .");
  }
  return imagesReady;
}

async function verifyPortsAndCleanupOldContainers() {
  await removeExactContainer(API_CONTAINER);
  await removeExactContainer(WEB_CONTAINER);
  const apiFree = await runCheck("Port 3200 free", () => checkPortFree(API_PORT));
  const webFree = await runCheck("Port 8081 free", () => checkPortFree(WEB_PORT));
  return apiFree && webFree;
}

async function runApiChecks() {
  const started = await runCheck("API container started", async () => {
    await startContainer([
      "--publish", `${API_PORT}:3000`,
      "--env", "NODE_ENV=test",
      "--env", "API_HOST=0.0.0.0",
      "--env", "API_PORT=3000",
      "--env", "ADMIN_RUNTIME_MODE=mock",
      API_IMAGE,
    ], API_CONTAINER);
    apiStarted = true;
  });
  if (!started) {
    await printContainerLogs(API_CONTAINER);
    return false;
  }

  const ready = await runCheck("API /health ready", async () => {
    const response = await waitForHttp(API_PORT, "/health", "API /health");
    assertStatus(response, 200, "API /health");
  });
  if (!ready) {
    await printContainerLogs(API_CONTAINER);
    return false;
  }

  const apiChecks = [
    ["API /health", async () => {
      const response = await request(API_PORT, "GET", "/health");
      assertStatus(response, 200, "API /health");
      assertBodyIncludes(response, "status", "API /health");
    }],
    ["API /ready", async () => {
      const response = await request(API_PORT, "GET", "/ready");
      assertStatus(response, 200, "API /ready");
      assertBodyIncludes(response, "status", "API /ready");
    }],
    ["API missing brand rejected", async () => {
      assertNon2xx(await request(API_PORT, "GET", "/v1/admin/overview"), "API missing brand");
    }],
    ["API invalid brand rejected", async () => {
      assertNon2xx(await request(API_PORT, "GET", "/v1/admin/overview?brand=invalid"), "API invalid brand");
    }],
    ["API Medway overview", async () => {
      const response = await request(API_PORT, "GET", "/v1/admin/overview?brand=medway");
      assertStatus(response, 200, "API Medway overview");
      assertBodyIncludes(response, "medway", "API Medway overview");
    }],
    ["API Elite overview", async () => {
      const response = await request(API_PORT, "GET", "/v1/admin/overview?brand=elite");
      assertStatus(response, 200, "API Elite overview");
      assertBodyIncludes(response, "elite", "API Elite overview");
    }],
    ["API method guard", async () => {
      const response = await request(API_PORT, "POST", "/v1/admin/overview?brand=medway");
      assertStatus(response, 405, "API method guard");
    }],
    ["API 404", async () => {
      const response = await request(API_PORT, "GET", "/unknown");
      assertStatus(response, 404, "API 404");
    }],
  ];
  let passed = true;
  for (const [name, action] of apiChecks) {
    if (!(await runCheck(name, action))) passed = false;
  }
  return passed;
}

async function runWebChecks() {
  const started = await runCheck("Web container started", async () => {
    await startContainer(["--publish", `${WEB_PORT}:80`, WEB_IMAGE], WEB_CONTAINER);
    webStarted = true;
  });
  if (!started) {
    await printContainerLogs(WEB_CONTAINER);
    return false;
  }

  const ready = await runCheck("Web root ready", async () => {
    const response = await waitForHttp(WEB_PORT, "/", "Web root");
    assertStatus(response, 200, "Web root");
  });
  if (!ready) {
    await printContainerLogs(WEB_CONTAINER);
    return false;
  }

  const webChecks = [
    ["Web /", async () => {
      const response = await request(WEB_PORT, "GET", "/");
      assertStatus(response, 200, "Web /");
      assertHtml(response, "Web /");
    }],
    ["Web /admin SPA fallback", async () => {
      const response = await request(WEB_PORT, "GET", "/admin");
      assertStatus(response, 200, "Web /admin");
      assertHtml(response, "Web /admin");
    }],
    ["Web unknown route SPA fallback", async () => {
      const response = await request(WEB_PORT, "GET", "/definitely-not-a-real-route");
      assertStatus(response, 200, "Web unknown route");
      assertHtml(response, "Web unknown route");
    }],
  ];
  let passed = true;
  for (const [name, action] of webChecks) {
    if (!(await runCheck(name, action))) passed = false;
  }
  return passed;
}

async function cleanup() {
  let clean = true;
  for (const [name, started] of [[API_CONTAINER, apiStarted], [WEB_CONTAINER, webStarted]]) {
    if (!started) continue;
    try {
      await stopExactContainer(name);
    } catch (error) {
      clean = false;
      console.error(`Cleanup failed for ${name}: ${safeText(errorMessage(error))}`);
    }
  }
  return clean;
}

async function main() {
  let executionPassed = true;
  try {
    if (!(await verifyDockerAndImages())) executionPassed = false;
    if (executionPassed && !(await verifyPortsAndCleanupOldContainers())) executionPassed = false;
    if (executionPassed && !(await runApiChecks())) executionPassed = false;
    if (executionPassed && !(await runWebChecks())) executionPassed = false;
  } catch (error) {
    executionPassed = false;
    console.error(`Container smoke failed unexpectedly: ${safeText(errorMessage(error))}`);
  } finally {
    const clean = await cleanup();
    if (clean) recordPass("Cleanup");
    else recordFail("Cleanup", "Smoke container cleanup failed.");
  }

  console.log("\nContainer smoke checklist:");
  for (const check of checks) {
    console.log(`- ${check.name}: ${check.passed ? "PASS" : "FAIL"}${check.details ? ` (${safeText(check.details)})` : ""}`);
  }
  const passed = executionPassed && checks.length > 0 && checks.every((check) => check.passed);
  if (!passed) process.exitCode = 1;
}

await main();