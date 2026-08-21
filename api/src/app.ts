import { InMemoryAdminPermissionResolver } from "./core/permissions";
import { InMemoryAdminPolicyValidator } from "./core/policies";
import { InMemoryAdminEvidenceWriter } from "./core/logging";
import { createAdminModule, createInMemoryAdminReadModels, type AdminModuleDependencies } from "./modules/admin";
import { createPersistenceRuntimeComposition, type PersistenceRuntimeCompositionOptions } from "./infrastructure/persistence-runtime-composition";

/** Framework-independent composition root; no HTTP runtime is started here. */
export interface BackendApplication { readonly status: "configured-admin-core-boundary"; readonly admin: ReturnType<typeof createAdminModule>; readonly adminDependencies: AdminModuleDependencies; readonly persistence: ReturnType<typeof createPersistenceRuntimeComposition>; close(): Promise<void>; }
export function createApplication(options: PersistenceRuntimeCompositionOptions = {}): BackendApplication {
  const adminDependencies: AdminModuleDependencies = { permissionResolver: new InMemoryAdminPermissionResolver(), policyValidator: new InMemoryAdminPolicyValidator(), evidenceWriter: new InMemoryAdminEvidenceWriter(), readModels: createInMemoryAdminReadModels() };
  const persistence = createPersistenceRuntimeComposition(options);
  return { status: "configured-admin-core-boundary", admin: createAdminModule(adminDependencies), adminDependencies, persistence, close: () => persistence.close() };
}
