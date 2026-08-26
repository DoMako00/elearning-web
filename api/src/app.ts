import { InMemoryAdminPermissionResolver } from "./core/permissions";
import { InMemoryAdminPolicyValidator } from "./core/policies";
import { InMemoryAdminEvidenceWriter } from "./core/logging";
import { createAdminModule, createAdminOverviewReadModel, createAdminM2ReadModel, createAdminM2CommandRuntime, createAdminHttpRequestContextResolver, resolveAdminOverviewReadModelSource, resolveAdminM2ReadModelSource, resolveAdminCommandSource, type AdminModuleDependencies, type AdminOverviewReadModelSource, type AdminM2ReadModelSource, type AdminCommandSource } from "./modules/admin";
import { createPersistenceRuntimeComposition, type PersistenceRuntimeCompositionOptions } from "./infrastructure/persistence-runtime-composition";
import type { PostgresWritePoolFactory } from "./infrastructure/postgres";
import { createAdminReadVerifierDiagnostics, type AdminReadVerifierDiagnostics } from "./modules/admin/admin-read-verifier-diagnostics";

/** Framework-independent composition root; no HTTP runtime is started here. */
export interface BackendApplicationOptions extends PersistenceRuntimeCompositionOptions { readonly writePoolFactory?: PostgresWritePoolFactory; }
export interface BackendApplication { readonly status: "configured-admin-core-boundary"; readonly admin: ReturnType<typeof createAdminModule>; readonly adminDependencies: AdminModuleDependencies; readonly adminHttpContextResolver: ReturnType<typeof createAdminHttpRequestContextResolver>; readonly persistence: ReturnType<typeof createPersistenceRuntimeComposition>; readonly adminOverviewSource: AdminOverviewReadModelSource; readonly adminM2Source: AdminM2ReadModelSource; readonly adminCommandSource: AdminCommandSource; readonly adminReadVerifierDiagnostics?: AdminReadVerifierDiagnostics; close(): Promise<void>; }
export function createApplication(options: BackendApplicationOptions = {}): BackendApplication {
  const environment = options.environment ?? process.env;
  const adminOverviewSource = resolveAdminOverviewReadModelSource(environment);
  const adminM2Source = resolveAdminM2ReadModelSource(environment);
  const adminCommandSource = resolveAdminCommandSource(environment);
  const adminReadVerifierDiagnostics = createAdminReadVerifierDiagnostics(environment);
  const persistence = createPersistenceRuntimeComposition(options);
  const adminHttpContextResolver = createAdminHttpRequestContextResolver({ persistence, environment });
  const permissionResolver = new InMemoryAdminPermissionResolver();
  const commandRuntime = createAdminM2CommandRuntime({ source: adminCommandSource, persistence, permissionResolver, environment, poolFactory: options.writePoolFactory });
  const m2ReadModel = createAdminM2ReadModel(adminM2Source, persistence);
  const adminDependencies: AdminModuleDependencies = {
    permissionResolver,
    policyValidator: new InMemoryAdminPolicyValidator(),
    evidenceWriter: new InMemoryAdminEvidenceWriter(),
    overviewReadModel: createAdminOverviewReadModel(adminOverviewSource, persistence),
    m2ReadModel: adminReadVerifierDiagnostics ? adminReadVerifierDiagnostics.wrap(m2ReadModel) : m2ReadModel,
    m2CommandExecutor: commandRuntime.executor,
  };
  let closePromise: Promise<void> | undefined;
  return { status: "configured-admin-core-boundary", admin: createAdminModule(adminDependencies), adminDependencies, adminHttpContextResolver, persistence, adminOverviewSource, adminM2Source, adminCommandSource, ...(adminReadVerifierDiagnostics ? { adminReadVerifierDiagnostics } : {}), close: () => { if (!closePromise) closePromise = Promise.all([commandRuntime.close(), persistence.close()]).then(() => undefined); return closePromise; } };
}
