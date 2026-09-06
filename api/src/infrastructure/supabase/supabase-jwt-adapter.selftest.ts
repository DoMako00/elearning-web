import { resolveSupabaseAuthConfiguration } from "./supabase-auth-config";
import { SupabaseJwtJwksAuthIdentityAdapter } from "./supabase-jwt-adapter";

const issuer = "https://abcdefghijklmnopqrst.supabase.co/auth/v1";
const subject = "123e4567-e89b-12d3-a456-426614174000";

function assert(value: unknown, message: string): asserts value { if (!value) throw new Error(message); }
function assertEqual(actual: unknown, expected: unknown, message: string): void { if (actual !== expected) throw new Error(`${message}: expected ${String(expected)}, received ${String(actual)}`); }

async function fixture() {
  const { createLocalJWKSet, exportJWK, generateKeyPair } = await import("jose");
  const { privateKey, publicKey } = await generateKeyPair("ES256");
  const jwk = await exportJWK(publicKey);
  const kid = "selftest-es256-1";
  const keySet = createLocalJWKSet({ keys: [{ ...jwk, kid, alg: "ES256", use: "sig" }] });
  return { privateKey, keySet, kid };
}

async function token(privateKey: any, kid: string, claims: Record<string, unknown> = {}, header: Record<string, string> = {}) {
  const { SignJWT } = await import("jose");
  const now = Math.floor(Date.now() / 1000);
  return new SignJWT({ iss: issuer, aud: "authenticated", sub: subject, iat: now, exp: now + 300, ...claims })
    .setProtectedHeader({ alg: "ES256", kid, ...header })
    .sign(privateKey);
}

function environment(overrides: Record<string, string | undefined> = {}) {
  return { SUPABASE_PROJECT_REF: "abcdefghijklmnopqrst", ...overrides };
}

export async function runSupabaseJwtAdapterSelfTest(): Promise<void> {
  const { privateKey, keySet, kid } = await fixture();
  const configuration = resolveSupabaseAuthConfiguration(environment());
  const adapter = new SupabaseJwtJwksAuthIdentityAdapter(configuration, { keySet });
  const valid = await token(privateKey, kid);
  const verified = await adapter.verifyRequestAuth({ bearerToken: valid, correlationId: "supabase-jwt-selftest" });
  assert(verified.ok, "valid local asymmetric JWT must verify");
  assertEqual(verified.value.provider, "supabase", "provider");
  assertEqual(verified.value.subject, subject, "subject");
  assertEqual(verified.value.authIdentityId, subject, "identity ID");
  assert(!("role" in verified.value) && !("permissions" in verified.value) && !("rawToken" in verified.value), "principal must contain no authority or token");

  const jose = await import("jose");
  const rsa = await jose.generateKeyPair("RS256");
  const rsaJwk = await jose.exportJWK(rsa.publicKey);
  const rsaAdapter = new SupabaseJwtJwksAuthIdentityAdapter(configuration, {
    keySet: jose.createLocalJWKSet({ keys: [{ ...rsaJwk, kid: "selftest-rs256-1", alg: "RS256", use: "sig" }] }),
  });
  const rsaToken = await token(rsa.privateKey, "selftest-rs256-1", {}, { alg: "RS256" });
  const rsaVerified = await rsaAdapter.verifyRequestAuth({ bearerToken: rsaToken, correlationId: "rs256" });
  assert(rsaVerified.ok, "valid local RSA asymmetric JWT must verify");

  for (const [name, claims, expected] of [
    ["wrong issuer", { iss: "https://wrong.example/auth/v1" }, "authentication_invalid"],
    ["wrong audience", { aud: "anon" }, "authentication_invalid"],
    ["expired", { exp: Math.floor(Date.now() / 1000) - 120 }, "authentication_invalid"],
    ["future iat", { iat: Math.floor(Date.now() / 1000) + 61 }, "authentication_invalid"],
    ["missing subject", { sub: undefined }, "authentication_invalid"],
    ["non UUID subject", { sub: "not-a-uuid" }, "authentication_invalid"],
    ["role metadata ignored", { role: "service_role", app_metadata: { permissions: ["admin.roles.manage"] }, user_metadata: { role: "admin" } }, "ok"],
  ] as const) {
    const result = await adapter.verifyRequestAuth({ bearerToken: await token(privateKey, kid, claims), correlationId: name });
    if (expected === "ok") assert(result.ok, `${name} must still authenticate`); else assert(!result.ok && result.error.code === expected, `${name} must fail authentication`);
  }
  const unknownKid = await token(privateKey, "unknown-kid");
  const unknownResult = await adapter.verifyRequestAuth({ bearerToken: unknownKid, correlationId: "unknown-kid" });
  assert(!unknownResult.ok, "unknown kid must fail closed");
  const malformed = await adapter.verifyRequestAuth({ bearerToken: "not.a.jwt", correlationId: "malformed" });
  assert(!malformed.ok, "malformed token must fail closed");
  const unsigned = await adapter.verifyRequestAuth({ bearerToken: "eyJhbGciOiJub25lIn0.eyJzdWIiOiIxMjNlNDU2Ny1lODliLTEyZDMtYTQ1Ni00MjY2MTQxNzQwMDAifQ.", correlationId: "unsigned" });
  assert(!unsigned.ok, "unsigned token must fail closed");
  const lookup = await adapter.getAuthIdentityById({ authIdentityId: subject as never, correlationId: "lookup" });
  assert(!lookup.ok && lookup.error.code === "authentication_invalid", "identity lookup must not call a provider");
}

if (process.argv[1]?.endsWith("supabase-jwt-adapter.selftest.js")) runSupabaseJwtAdapterSelfTest().then(() => console.log("Supabase JWT adapter selftest passed"));
