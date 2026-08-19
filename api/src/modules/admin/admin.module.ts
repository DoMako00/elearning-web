import type { AdminRequestContext } from "../../core/context";
import type { AdminPermissionResolver } from "../../core/permissions";
import type { AdminPolicyValidator } from "../../core/policies";
import type { AdminEvidenceWriter } from "../../core/logging";
import { getAdminOverview } from "./admin-overview.query";
import type { AdminReadModels } from "./in-memory-admin-read-models";
import { executeAdminCommandBoundary, type AdminCommandBoundaryDependencies, type AdminCommandBoundaryInput } from "./admin-command-boundary";

export interface AdminModuleDependencies { readonly permissionResolver: AdminPermissionResolver; readonly policyValidator: AdminPolicyValidator; readonly evidenceWriter: AdminEvidenceWriter; readonly readModels?: AdminReadModels; }
export function createAdminModule(dependencies: AdminModuleDependencies) {
  const readModels = dependencies.readModels;
  if (!readModels) throw new Error("Admin module requires read models for the current composition boundary.");
  const boundary: AdminCommandBoundaryDependencies = dependencies;
  return { queries: { getAdminOverview: (context: AdminRequestContext) => getAdminOverview(context, readModels) }, commands: { executeAdminCommandBoundary: <T>(input: AdminCommandBoundaryInput<T>) => executeAdminCommandBoundary(input, boundary) } };
}