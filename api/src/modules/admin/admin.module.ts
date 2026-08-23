import type { AdminRequestContext } from "../../core/context";
import type { AdminPermissionResolver } from "../../core/permissions";
import type { AdminPolicyValidator } from "../../core/policies";
import type { AdminEvidenceWriter } from "../../core/logging";
import { getAdminOverview } from "./admin-overview.query";
import type { AdminOverviewReadModel, AdminM2ReadModel } from "./read-models";
import { executeAdminCommandBoundary, type AdminCommandBoundaryDependencies, type AdminCommandBoundaryInput } from "./admin-command-boundary";
import type { AdminM2CommandExecutor } from "./commands";

export interface AdminModuleDependencies { readonly permissionResolver: AdminPermissionResolver; readonly policyValidator: AdminPolicyValidator; readonly evidenceWriter: AdminEvidenceWriter; readonly overviewReadModel?: AdminOverviewReadModel; readonly m2ReadModel?: AdminM2ReadModel; readonly m2CommandExecutor?: AdminM2CommandExecutor; }
export function createAdminModule(dependencies: AdminModuleDependencies) {
  const overviewReadModel = dependencies.overviewReadModel;
  const m2ReadModel = dependencies.m2ReadModel;
  if (!overviewReadModel) throw new Error("Admin module requires an overview read model for the current composition boundary.");
  if (!m2ReadModel) throw new Error("Admin module requires an M2 read model for the current composition boundary.");
  const boundary: AdminCommandBoundaryDependencies = dependencies;
  return { queries: { getAdminOverview: (context: AdminRequestContext) => getAdminOverview(context, overviewReadModel), m2: m2ReadModel }, commands: { executeAdminCommandBoundary: <T>(input: AdminCommandBoundaryInput<T>) => executeAdminCommandBoundary(input, boundary), m2: dependencies.m2CommandExecutor } };
}
