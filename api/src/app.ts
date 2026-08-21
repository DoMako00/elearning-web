import { InMemoryAdminPermissionResolver } from "./core/permissions";
import { InMemoryAdminPolicyValidator } from "./core/policies";
import { InMemoryAdminEvidenceWriter } from "./core/logging";
import { createAdminModule, createAdminOverviewReadModel, resolveAdminOverviewReadModelSource, type AdminModuleDependencies, type AdminOverviewReadModelSource } from "./modules/admin";
import { createPersistenceRuntimeComposition, type PersistenceRuntimeCompositionOptions } from "./infrastructure/persistence-runtime-composition";

/** Framework-independent composition root; no HTTP runtime is started here. */
export interface BackendApplication { readonly status: "configured-admin-core-boundary"; readonly admin: ReturnType<typeof createAdminModule>; readonly adminDependencies: AdminModuleDependencies; readonly persistence: ReturnType<typeof createPersistenceRuntimeComposition>; readonly adminOverviewSource: AdminOverviewReadModelSource; close(): Promise<void>; }
export function createApplication(options: PersistenceRuntimeCompositionOptions = {}): BackendApplication {
  const environment = options.environment ?? process.env;
  const adminOverviewSource = resolveAdminOverviewReadModelSource(environment);
  const persistence = createPersistenceRuntimeComposition(options);
  const adminDependencies: AdminModuleDependencies = {
    permissionResolver: new InMemoryAdminPermissionResolver(),
    policyValidator: new InMemoryAdminPolicyValidator(),
    evidenceWriter: new InMemoryAdminEvidenceWriter(),
    overviewReadModel: createAdminOverviewReadModel(adminOverviewSource, persistence),
  };
  return { status: "configured-admin-core-boundary", admin: createAdminModule(adminDependencies), adminDependencies, persistence, adminOverviewSource, close: () => persistence.close() };
}
