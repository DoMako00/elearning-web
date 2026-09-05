import type { IncomingMessage, ServerResponse } from "node:http";
import { createTestAdminRequestContext } from "../core/context";
import { repositoryErr, repositoryOk } from "../core/persistence";
import { createHttpApp } from "./http-app";
import type { AdminModule } from "./http-types";

const medwayBrandId = "10000000-0000-4000-8000-000000000001";
const eliteBrandId = "10000000-0000-4000-8000-000000000003";
function assert(value: unknown, message: string): asserts value { if (!value) throw new Error(message); }

async function invoke(handler: ReturnType<typeof createHttpApp>, path: string, headers: Record<string, string> = {}, rawHeaders?: readonly string[]): Promise<number> {
  let output = "";
  const response = { statusCode: 200, setHeader() {}, end(value?: string) { output = value ?? ""; } } as unknown as ServerResponse;
  const request = { method: "GET", url: path, headers, rawHeaders, async *[Symbol.asyncIterator]() {} } as unknown as IncomingMessage;
  await handler(request, response);
  assert(output, "route must return JSON");
  return response.statusCode;
}

export async function runAdminReadAuthorizationSelfTest(): Promise<void> {
  let reads = 0;
  const admin = { queries: { getAdminOverview: async () => { reads += 1; return repositoryOk({}); }, m2: { listAcademicLevels: async () => { reads += 1; return repositoryOk([]); } } } } as unknown as AdminModule;
  const allowed = createTestAdminRequestContext({ brandId: medwayBrandId, brandCode: "medway", permissions: ["admin.platform.admin.read"] });
  let resolverResult: ReturnType<typeof repositoryOk<typeof allowed>> | ReturnType<typeof repositoryErr> = repositoryOk(allowed);
  const resolver = { async resolve(input: { readonly requestedBrandCode?: "medway" | "elite" }) { return input.requestedBrandCode === "elite" ? repositoryErr({ code: "permission_denied", message: "denied" }) : resolverResult; } };
  const handler = createHttpApp({ admin, adminHttpContextResolver: resolver });
  const valid = { authorization: "Bearer mock-auth-medway-admin-001" };

  assert(await invoke(handler, "/v1/admin/curriculum/levels") === 401, "missing bearer must be rejected");
  assert(Number(reads) === 0, "missing bearer reached protected read");
  assert(await invoke(handler, "/v1/admin/curriculum/levels", { authorization: "Bearer invalid" }) === 401, "malformed bearer must be rejected");
  assert(Number(reads) === 0, "malformed bearer reached protected read");
  assert(await invoke(handler, "/v1/admin/curriculum/levels", valid, ["authorization", valid.authorization, "authorization", valid.authorization]) === 401, "duplicate bearer must be rejected");
  assert(Number(reads) === 0, "duplicate bearer reached protected read");

  resolverResult = repositoryErr({ code: "provider_unavailable", message: "unavailable" });
  assert(await invoke(handler, "/v1/admin/curriculum/levels", valid) === 503, "unavailable resolver must map safely");
  assert(Number(reads) === 0, "unavailable resolver reached protected read");
  resolverResult = repositoryErr({ code: "permission_denied", message: "denied" });
  assert(await invoke(handler, "/v1/admin/curriculum/levels", valid) === 403, "denied resolver must map safely");
  assert(Number(reads) === 0, "denied resolver reached protected read");

  const withoutCurriculumPermission = createTestAdminRequestContext({ brandId: medwayBrandId, brandCode: "medway", permissions: ["admin.audit.read"] });
  resolverResult = repositoryOk(withoutCurriculumPermission);
  assert(await invoke(handler, "/v1/admin/curriculum/levels", valid) === 403, "missing read permission must be denied");
  assert(Number(reads) === 0, "missing read permission reached protected read");

  resolverResult = repositoryOk(allowed);
  assert(await invoke(handler, "/v1/admin/curriculum/levels", valid) === 200, "authorized shared curriculum read must succeed");
  assert(Number(reads) === 1, "authorized shared curriculum read did not execute once");
  assert(await invoke(handler, "/v1/admin/overview?brand=elite", valid) === 403, "cross-brand overview must be denied");
  assert(Number(reads) === 1, "cross-brand overview reached protected model");
  assert(await invoke(handler, `/v1/admin/brands/${eliteBrandId}/courses`, valid) === 403, "cross-brand course read must be denied");
  assert(Number(reads) === 1, "cross-brand course read reached protected model");
}

if (process.argv[1]?.endsWith("admin-read-authorization.selftest.js")) runAdminReadAuthorizationSelfTest().then(() => console.log("admin read authorization selftest passed"));
