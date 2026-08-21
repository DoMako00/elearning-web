import type { AdminRequestContext } from "../../core/context";
import type { AdminPermissionResolver } from "../../core/permissions";
import type { AdminPolicyValidator } from "../../core/policies";
import type { AdminEvidenceWriter } from "../../core/logging";
import { getAdminOverview } from "./admin-overview.query";
import type { AdminOverviewReadModel } from "./read-models";
import { executeAdminCommandBoundary, type AdminCommandBoundaryDependencies, type AdminCommandBoundaryInput } from "./admin-command-boundary";

export interface AdminModuleDependencies { readonly permissionResolver: AdminPermissionResolver; readonly policyValidator: AdminPolicyValidator; readonly evidenceWriter: AdminEvidenceWriter; readonly overviewReadModel?: AdminOverviewReadModel; }
export function createAdminModule(dependencies: AdminModuleDependencies) {
  const overviewReadModel = dependencies.overviewReadModel;
  if (!overviewReadModel) throw new Error("Admin module requires an overview read model for the current composition boundary.");
  const boundary: AdminCommandBoundaryDependencies = dependencies;
  return { queries: { getAdminOverview: (context: AdminRequestContext) => getAdminOverview(context, overviewReadModel) }, commands: { executeAdminCommandBoundary: <T>(input: AdminCommandBoundaryInput<T>) => executeAdminCommandBoundary(input, boundary) } };
}
