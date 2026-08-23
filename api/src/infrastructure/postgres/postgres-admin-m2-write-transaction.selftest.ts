import type { AdminM2ActionEvidence } from "../../core/repositories";
import { fail, ok } from "../../shared";
import { adminCoreError } from "../../core/errors";
import { PostgresAdminM2WriteTransactionRunner, type PgWriteClientLike, type PgWritePoolLike } from "./postgres-admin-m2-write-transaction";

type QueryCall = { readonly text: string; readonly values: readonly unknown[] };
class FakeClient implements PgWriteClientLike {
  readonly calls: QueryCall[] = []; releases = 0; failAudit = false; failIdempotency = false;
  async query<Row extends Record<string, unknown>>(text: string, values: readonly unknown[] = []): Promise<{ rows: readonly Row[] }> {
    this.calls.push({ text, values }); const normalized = text.trim().toLowerCase();
    if (this.failIdempotency && normalized.startsWith("insert into app.admin_actions")) throw Object.assign(new Error("unsafe raw error"), { code: "23505", constraint: "admin_actions_idempotency_key" });
    if (this.failAudit && normalized.startsWith("insert into app.audit_logs")) throw Object.assign(new Error("unsafe raw error"), { code: "XX000" });
    if (["begin", "commit", "rollback"].includes(normalized)) return { rows: [] };
    if (normalized.includes("from app.educational_brands")) return { rows: [{ id: "brand" }] as unknown as readonly Row[] };
    if (normalized.startsWith("insert into app.instructors")) return { rows: [{ id: "10000000-0000-4000-8000-000000000010", display_name: "Dr. Test", professional_title: null, status: "active", updated_at: new Date("2026-08-23T00:00:00.000Z") }] as unknown as readonly Row[] };
    if (normalized.startsWith("insert into app.admin_actions")) return { rows: [{ id: "10000000-0000-4000-8000-000000000020" }] as unknown as readonly Row[] };
    if (normalized.startsWith("insert into app.audit_logs")) return { rows: [{ id: "10000000-0000-4000-8000-000000000021" }] as unknown as readonly Row[] };
    if (normalized.includes("from app.admin_actions")) return { rows: [] };
    return { rows: [] };
  }
  release(): void { this.releases += 1; }
}
class FakePool implements PgWritePoolLike { connects = 0; ends = 0; constructor(readonly client: FakeClient) {} async connect(): Promise<PgWriteClientLike> { this.connects += 1; return this.client; } async end(): Promise<void> { this.ends += 1; } }
function assert(value: unknown, message: string): asserts value { if (!value) throw new Error(message); }
const identity = { brandId: "10000000-0000-4000-8000-000000000001", adminProfileId: "10000000-0000-4000-8000-000000000002", commandName: "admin.m2.instructors.create", idempotencyKey: "key" };
const evidence = (targetId: string): AdminM2ActionEvidence => ({ identity, commandFingerprint: `v1:sha256:${"a".repeat(64)}`, targetType: "instructor", targetId, reason: "Reason", correlationId: "correlation", resultSummary: { instructorId: targetId }, beforeSummary: null, afterSummary: { id: targetId, displayName: "Dr. Test", professionalTitle: null, status: "active" }, metadata: { commandVersion: "v1" } });

export async function runPostgresAdminM2WriteTransactionSelfTest(): Promise<void> {
  const client = new FakeClient(); const pool = new FakePool(client); const runner = new PostgresAdminM2WriteTransactionRunner(pool);
  assert(pool.connects === 0 && client.calls.length === 0, "construction must not connect or query");
  const result = await runner.run("correlation", async (transaction) => {
    assert(await transaction.lockExecutionIdentity(identity), "execution identity did not lock");
    const created = await transaction.insertInstructor({ displayName: "Dr. Test", professionalTitle: null });
    assert(created.updatedAt === "2026-08-23T00:00:00.000Z", "pg Date was not normalized");
    const receipt = await transaction.writeEvidence(evidence(created.id));
    return ok(receipt);
  });
  assert(result.ok && client.calls[0]?.text === "BEGIN" && client.calls.at(-1)?.text === "COMMIT", "transaction did not commit once");
  assert(client.releases === 1, "client was not released after success");
  const sql = client.calls.map((call) => call.text).join("\n").toLowerCase();
  assert(!/\b(delete|create|alter|drop|grant|revoke|truncate|merge|copy)\b/.test(sql), "forbidden SQL was issued");
  assert(client.calls.filter((call) => /\$1/.test(call.text)).every((call) => call.values.length > 0), "parameterized SQL lost its values");
  assert(client.calls.filter((call) => call.text.startsWith("insert into app.admin_") || call.text.startsWith("insert into app.audit_")).length === 2, "evidence pair was not written exactly once");

  const deniedClient = new FakeClient(); const deniedRunner = new PostgresAdminM2WriteTransactionRunner(new FakePool(deniedClient));
  const denied = await deniedRunner.run("correlation", async () => fail(adminCoreError("policy_validation_failed", "Denied.", "correlation")));
  assert(!denied.ok && deniedClient.calls.map((call) => call.text).join(",") === "BEGIN,ROLLBACK" && deniedClient.releases === 1, "policy failure did not roll back and release");

  const auditClient = new FakeClient(); auditClient.failAudit = true; const auditRunner = new PostgresAdminM2WriteTransactionRunner(new FakePool(auditClient));
  const audit = await auditRunner.run("correlation", async (transaction) => { const created = await transaction.insertInstructor({ displayName: "Dr. Test", professionalTitle: null }); await transaction.writeEvidence(evidence(created.id)); return ok(created.id); });
  assert(!audit.ok && audit.error.code === "audit_write_failed" && auditClient.calls.at(-1)?.text === "ROLLBACK" && auditClient.releases === 1, "evidence failure did not roll back atomically");

  const raceClient = new FakeClient(); raceClient.failIdempotency = true; const raceRunner = new PostgresAdminM2WriteTransactionRunner(new FakePool(raceClient));
  const race = await raceRunner.run("correlation", async (transaction) => { const created = await transaction.insertInstructor({ displayName: "Dr. Test", professionalTitle: null }); await transaction.writeEvidence(evidence(created.id)); return ok(created.id); });
  assert(!race.ok && race.error.details?.reason === "idempotency_race" && raceClient.calls.at(-1)?.text === "ROLLBACK", "idempotency race was not distinguished after rollback");
  await runner.close(); await runner.close(); assert(pool.ends === 1, "pool close was not idempotent");
}

if (process.argv[1]?.endsWith("postgres-admin-m2-write-transaction.selftest.js")) runPostgresAdminM2WriteTransactionSelfTest().then(() => console.log("postgres Admin M2 write transaction selftest passed"));
