import { parseStrictBearerToken } from "./strict-bearer";
import type { IncomingMessage } from "node:http";

function assert(value: unknown, message: string): asserts value { if (!value) throw new Error(message); }
function code(result: ReturnType<typeof parseStrictBearerToken>): string | undefined { return result.ok ? undefined : result.code; }
function request(headers: Record<string, string | string[] | undefined>, rawHeaders?: string[]): IncomingMessage {
  return { headers, rawHeaders } as unknown as IncomingMessage;
}

export function runStrictBearerSelfTest(): void {
  const token = "eyJhbGciOiJFUzI1NiIsImtpZCI6ImxvY2FsIn0.eyJzdWIiOiIxMjNlNDU2Ny1lODliLTEyZDMtYTQ1Ni00MjY2MTQxNzQwMDAifQ.signature";
  assert(parseStrictBearerToken(request({ authorization: `Bearer ${token}` })).ok, "valid Bearer header");
  assert(code(parseStrictBearerToken(request({}))) === "missing", "missing header");
  assert(code(parseStrictBearerToken(request({ authorization: "Basic abc" }))) === "malformed", "wrong scheme");
  assert(code(parseStrictBearerToken(request({ authorization: "Bearer  token" }))) === "malformed", "multiple spaces");
  assert(code(parseStrictBearerToken(request({ authorization: "Bearer " }))) === "malformed", "empty token");
  assert(code(parseStrictBearerToken(request({ authorization: ["Bearer one", "Bearer two"] }))) === "duplicate", "duplicate normalized header");
  assert(code(parseStrictBearerToken(request({ authorization: "Bearer one" }, ["Authorization", "Bearer one", "authorization", "Bearer two"]))) === "duplicate", "duplicate raw header");
  assert(code(parseStrictBearerToken(request({ authorization: `Bearer ${"a".repeat(8193)}` }))) === "oversized", "oversized token");
  assert(code(parseStrictBearerToken(request({ authorization: "Bearer not-a-jwt" }))) === "malformed", "non-compact JWT");
}

if (process.argv[1]?.endsWith("strict-bearer.selftest.js")) { runStrictBearerSelfTest(); console.log("strict Bearer selftest passed"); }
