import { createInMemoryAdminReadModels } from "../in-memory-admin-read-models";
import { InMemoryAdminOverviewReadModel } from "./in-memory-admin-overview-read-model";

export type AdminOverviewReadModelSelfTestCaseResult = {
  readonly name: string;
  readonly passed: boolean;
  readonly details?: Record<string, unknown>;
};

export type AdminOverviewReadModelSelfTestRunResult = {
  readonly passed: boolean;
  readonly cases: readonly AdminOverviewReadModelSelfTestCaseResult[];
};

function assertEqual(actual: unknown, expected: unknown, message: string): void {
  if (actual !== expected) throw new Error(`${message}: expected ${String(expected)}, received ${String(actual)}`);
}

function assertTruthy(value: unknown, message: string): void {
  if (!value) throw new Error(message);
}

async function recordCase(
  cases: AdminOverviewReadModelSelfTestCaseResult[],
  name: string,
  run: () => Promise<void> | void,
): Promise<void> {
  try {
    await run();
    cases.push({ name, passed: true });
  } catch (error) {
    cases.push({ name, passed: false, details: { message: error instanceof Error ? error.message : "Unexpected self-test failure." } });
  }
}

function assertSuccess<T>(result: { readonly ok: boolean; readonly value?: T }): T {
  if (!result.ok || result.value === undefined) throw new Error("Expected a successful read-model result.");
  return result.value;
}

function assertFailure(result: { readonly ok: boolean; readonly error?: { readonly code: string } }, code: string): void {
  assertEqual(result.ok, false, "Expected a failed read-model result");
  assertEqual(result.error?.code, code, "Unexpected read-model failure code");
}

export async function runAdminOverviewReadModelSelfTest(): Promise<AdminOverviewReadModelSelfTestRunResult> {
  const cases: AdminOverviewReadModelSelfTestCaseResult[] = [];
  const legacy = createInMemoryAdminReadModels();
  const readModel = new InMemoryAdminOverviewReadModel(legacy);

  await recordCase(cases, "Medway overview resolves successfully", async () => {
    const result = await readModel.getOverview({ brandCode: "medway", correlationId: "admin-overview-read-model-medway" });
    const overview = assertSuccess(result);
    assertEqual(overview.brand.brandId, "brand-medway", "Medway brand ID");
    assertEqual(overview.brand.brandCode, "medway", "Medway brand code");
  });

  await recordCase(cases, "Elite overview resolves successfully", async () => {
    const result = await readModel.getOverview({ brandCode: "elite", correlationId: "admin-overview-read-model-elite" });
    const overview = assertSuccess(result);
    assertEqual(overview.brand.brandId, "brand-elite", "Elite brand ID");
    assertEqual(overview.brand.brandCode, "elite", "Elite brand code");
  });

  await recordCase(cases, "Medway and Elite overview outputs are brand-isolated", async () => {
    const medway = assertSuccess(await readModel.getOverview({ brandCode: "medway" }));
    const elite = assertSuccess(await readModel.getOverview({ brandCode: "elite" }));
    assertEqual(medway.brand.brandId, "brand-medway", "Medway canonical brand");
    assertEqual(elite.brand.brandId, "brand-elite", "Elite canonical brand");
    assertEqual(JSON.stringify(medway).includes("elite-"), false, "Medway overview must not include Elite fixture identifiers");
    assertEqual(JSON.stringify(elite).includes("med-"), false, "Elite overview must not include Medway fixture identifiers");
  });

  await recordCase(cases, "Invalid brand is rejected", async () => {
    const result = await readModel.getOverview({ brandCode: "invalid" });
    assertFailure(result, "brand_not_found");
  });

  await recordCase(cases, "Output retains current overview top-level sections", async () => {
    const overview = assertSuccess(await readModel.getOverview({ brandCode: "medway" }));
    for (const section of ["brand", "platform", "counts", "recent"] as const) {
      assertTruthy(section in overview, `Missing overview section: ${section}`);
    }
  });

  await recordCase(cases, "Mock read model matches existing Medway provider", async () => {
    const legacyOverview = legacy.getOverview("brand-medway");
    const adapterOverview = assertSuccess(await readModel.getOverview({ brandCode: "medway", brandId: "brand-medway" }));
    assertEqual(JSON.stringify(adapterOverview), JSON.stringify(legacyOverview), "Medway parity");
  });

  await recordCase(cases, "Mock read model matches existing Elite provider", async () => {
    const legacyOverview = legacy.getOverview("brand-elite");
    const adapterOverview = assertSuccess(await readModel.getOverview({ brandCode: "elite", brandId: "brand-elite" }));
    assertEqual(JSON.stringify(adapterOverview), JSON.stringify(legacyOverview), "Elite parity");
  });

  return { passed: cases.every((testCase) => testCase.passed), cases };
}
