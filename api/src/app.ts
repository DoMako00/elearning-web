import { InMemoryAdminPermissionResolver } from "./core/permissions";
import { InMemoryAdminPolicyValidator } from "./core/policies";
import { InMemoryAdminEvidenceWriter } from "./core/logging";
import { createAdminModule, createAdminOverviewReadModel, createAdminM2ReadModel, resolveAdminOverviewReadModelSource, resolveAdminM2ReadModelSource, type AdminModuleDependencies, type AdminOverviewReadModelSource, type AdminM2ReadModelSource } from "./modules/admin";
import { createPersistenceRuntimeComposition, type PersistenceRuntimeCompositionOptions } from "./infrastructure/persistence-runtime-composition";

/** Framework-independent composition root; no HTTP runtime is started here. */
export interface BackendApplication { readonly status: "configured-admin-core-boundary"; readonly admin: ReturnType<typeof createAdminModule>; readonly adminDependencies: AdminModuleDependencies; readonly persistence: ReturnType<typeof createPersistenceRuntimeComposition>; readonly adminOverviewSource: AdminOverviewReadModelSource; readonly adminM2Source: AdminM2ReadModelSource; close(): Promise<void>; }
export function createApplication(options: PersistenceRuntimeCompositionOptions = {}): BackendApplication {
  const environment = options.environment ?? process.env;
  const adminOverviewSource = resolveAdminOverviewReadModelSource(environment);
  const adminM2Source = resolveAdminM2ReadModelSource(environment);
  const persistence = createPersistenceRuntimeComposition(options);
  const adminDependencies: AdminModuleDependencies = {
    permissionResolver: new InMemoryAdminPermissionResolver(),
    policyValidator: new InMemoryAdminPolicyValidator(),
    evidenceWriter: new InMemoryAdminEvidenceWriter(),
    overviewReadModel: createAdminOverviewReadModel(adminOverviewSource, persistence),
    m2ReadModel: createAdminM2ReadModel(adminM2Source, persistence),
  };
  return { status: "configured-admin-core-boundary", admin: createAdminModule(adminDependencies), adminDependencies, persistence, adminOverviewSource, adminM2Source, close: () => persistence.close() };
}
