import { InMemoryAdminPermissionResolver } from "./core/permissions";
import { InMemoryAdminPolicyValidator } from "./core/policies";
import { InMemoryAdminEvidenceWriter } from "./core/logging";
import { createAdminModule, createInMemoryAdminReadModels, type AdminModuleDependencies } from "./modules/admin";

/** Framework-independent composition root; no HTTP runtime is started here. */
export interface BackendApplication { readonly status: "configured-admin-core-boundary"; readonly admin: ReturnType<typeof createAdminModule>; readonly adminDependencies: AdminModuleDependencies; }
export function createApplication(): BackendApplication {
  const adminDependencies: AdminModuleDependencies = { permissionResolver: new InMemoryAdminPermissionResolver(), policyValidator: new InMemoryAdminPolicyValidator(), evidenceWriter: new InMemoryAdminEvidenceWriter(), readModels: createInMemoryAdminReadModels() };
  return { status: "configured-admin-core-boundary", admin: createAdminModule(adminDependencies), adminDependencies };
}