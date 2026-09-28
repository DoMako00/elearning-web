import { createApplication } from "../../../app";
import { repositoryErr, repositoryOk, type RepositoryResult } from "../../../core/persistence";
import type { M1EducationalBrand, M1EducationalBrandReadRepository } from "../../../core/repositories";
import { PostgresAdminOverviewReadModel } from "./postgres-admin-overview-read-model";
import { AdminOverviewReadModelConfigurationError, resolveAdminOverviewReadModelSource } from "./admin-overview-source";

class FakePool {
  queryCount = 0;
  endCount = 0;
  async query<Row extends Record<string, unknown>>(): Promise<{ readonly rows: readonly Row[] }> {
    this.queryCount += 1;
    return { rows: [] };
  }
  async end(): Promise<void> {
    this.endCount += 1;
  }
}

class FakeEducationalBrandRepository implements M1EducationalBrandReadRepository {
  readonly calls: string[] = [];

  constructor(private readonly byCode: Readonly<Record<string, RepositoryResult<M1EducationalBrand>>>) {}

  async findEducationalBrandById(): Promise<RepositoryResult<M1EducationalBrand>> {
    return repositoryErr({ code: "not_found", message: "not found" });
  }

  async findEducationalBrandByCode(input: { readonly code: "medway" | "elite" }): Promise<RepositoryResult<M1EducationalBrand>> {
    this.calls.push(input.code);
    return this.byCode[input.code] ?? repositoryErr({ code: "not_found", message: "not found" });
  }
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function activeBrand(code: "medway" | "elite", id: string): M1EducationalBrand {
  return { id, code, name: code === "medway" ? "Medway" : "Elite", slug: code, status: "active", createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" };
}

export async function runAdminOverviewSourceSelfTest(): Promise<void> {
  assert(resolveAdminOverviewReadModelSource({}) === "mock", "missing source must default to mock");
  assert(resolveAdminOverviewReadModelSource({ ADMIN_READ_MODEL_SOURCE: "mock" }) === "mock", "mock source invalid");
  assert(resolveAdminOverviewReadModelSource({ ADMIN_READ_MODEL_SOURCE: "postgres" }) === "postgres", "postgres source invalid");
  try {
    resolveAdminOverviewReadModelSource({ ADMIN_READ_MODEL_SOURCE: "invalid" });
    throw new Error("invalid source must fail");
  } catch (error) {
    assert(error instanceof AdminOverviewReadModelConfigurationError, "invalid source must use safe configuration error");
  }

  const mockApplication = createApplication({ environment: { PERSISTENCE_PROVIDER: "mock", ADMIN_READ_MODEL_SOURCE: "mock" } });
  assert(mockApplication.persistence.provider === "mock" && mockApplication.adminOverviewSource === "mock", "mock matrix case invalid");
  await mockApplication.close();

  const supabaseMockPool = new FakePool();
  const supabaseMockApplication = createApplication({
    environment: { PERSISTENCE_PROVIDER: "supabase", ADMIN_READ_MODEL_SOURCE: "mock", SUPABASE_DB_URL: "postgresql://test.invalid/db?sslmode=verify-full" },
    poolFactory: () => supabaseMockPool,
  });
  assert(supabaseMockApplication.persistence.provider === "supabase" && supabaseMockApplication.adminOverviewSource === "mock", "supabase/mock matrix case invalid");
  assert(supabaseMockPool.queryCount === 0, "supabase/mock construction must not query");
  await supabaseMockApplication.close();

  const supabasePostgresPool = new FakePool();
  const supabasePostgresApplication = createApplication({
    environment: { PERSISTENCE_PROVIDER: "supabase", ADMIN_READ_MODEL_SOURCE: "postgres", SUPABASE_DB_URL: "postgresql://test.invalid/db?sslmode=verify-full" },
    poolFactory: () => supabasePostgresPool,
  });
  assert(supabasePostgresApplication.persistence.provider === "supabase" && supabasePostgresApplication.adminOverviewSource === "postgres", "supabase/postgres matrix case invalid");
  assert(supabasePostgresPool.queryCount === 0, "supabase/postgres construction must not query");
  await supabasePostgresApplication.close();

  try {
    createApplication({ environment: { PERSISTENCE_PROVIDER: "mock", ADMIN_READ_MODEL_SOURCE: "postgres" } });
    throw new Error("mock/postgres must fail");
  } catch (error) {
    assert(error instanceof AdminOverviewReadModelConfigurationError, "mock/postgres must fail safely");
  }

  const repository = new FakeEducationalBrandRepository({
    medway: repositoryOk(activeBrand("medway", "uuid-medway")),
    elite: repositoryOk(activeBrand("elite", "uuid-elite")),
  });
  const postgresReadModel = new PostgresAdminOverviewReadModel(repository);
  assert(repository.calls.length === 0, "read model construction must not query repositories");
  const medway = await postgresReadModel.getOverview({ brandCode: "medway" });
  assert(medway.ok && medway.value.brand.brandId === "uuid-medway", "Medway brand was not resolved canonically");
  if (medway.ok) {
    assert(Object.values(medway.value.counts).every((count) => count === 0), "unsupported M1 metrics must be zero");
    assert(medway.value.recent.auditLogs.length === 0 && medway.value.recent.adminActions.length === 0 && medway.value.recent.securityEvents.length === 0, "unsupported M1 recent data must be empty");
  }
  assert(repository.calls.join(",") === "medway", "brand lookup must be scoped to requested code only");

  const failedRepository = new FakeEducationalBrandRepository({
    medway: repositoryErr({ code: "query_failed", message: "sensitive provider detail" }),
  });
  const failed = await new PostgresAdminOverviewReadModel(failedRepository).getOverview({ brandCode: "medway" });
  assert(!failed.ok && failed.error.code === "query_failed" && !failed.error.message.includes("sensitive"), "repository failure must be sanitized without fallback");
}

if (process.argv[1]?.endsWith("admin-overview-source.selftest.js")) {
  runAdminOverviewSourceSelfTest().then(() => console.log("admin overview source selftest passed"));
}
