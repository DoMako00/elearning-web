import { createStudentCourses, type StudentCourses } from "./modules/student/student-courses";
import { InMemoryAdminPermissionResolver } from "./core/permissions";
import { InMemoryAdminPolicyValidator } from "./core/policies";
import { InMemoryAdminEvidenceWriter } from "./core/logging";
import { createAdminModule, createAdminOverviewReadModel, createAdminM2ReadModel, createAdminM2CommandRuntime, createAdminHttpRequestContextResolver, resolveAdminOverviewReadModelSource, resolveAdminM2ReadModelSource, resolveAdminCommandSource, type AdminModuleDependencies, type AdminOverviewReadModelSource, type AdminM2ReadModelSource, type AdminCommandSource } from "./modules/admin";
import { createPersistenceRuntimeComposition, type PersistenceRuntimeCompositionOptions } from "./infrastructure/persistence-runtime-composition";
import type { PostgresWritePoolFactory } from "./infrastructure/postgres";
import { createAdminReadVerifierDiagnostics, type AdminReadVerifierDiagnostics } from "./modules/admin/admin-read-verifier-diagnostics";
import { EmptyAdminStudentsReadModel, PostgresAdminStudentsReadModel } from "./modules/admin/read-models/admin-students-read-model";
import { createAdminOperationsExecutor } from "./modules/admin/operations";

/** Framework-independent composition root; no HTTP runtime is started here. */
export interface BackendApplicationOptions extends PersistenceRuntimeCompositionOptions { readonly writePoolFactory?: PostgresWritePoolFactory; }
export interface BackendApplication { readonly studentCourses?: StudentCourses; readonly status: "configured-admin-core-boundary"; readonly admin: ReturnType<typeof createAdminModule>; readonly adminDependencies: AdminModuleDependencies; readonly adminHttpContextResolver: ReturnType<typeof createAdminHttpRequestContextResolver>; readonly persistence: ReturnType<typeof createPersistenceRuntimeComposition>; readonly adminOverviewSource: AdminOverviewReadModelSource; readonly adminM2Source: AdminM2ReadModelSource; readonly adminCommandSource: AdminCommandSource; readonly adminReadVerifierDiagnostics?: AdminReadVerifierDiagnostics; close(): Promise<void>; }
export function createApplication(options: BackendApplicationOptions = {}): BackendApplication {
  const environment = options.environment ?? process.env;
  const adminOverviewSource = resolveAdminOverviewReadModelSource(environment);
  const adminM2Source = resolveAdminM2ReadModelSource(environment);
  const adminCommandSource = resolveAdminCommandSource(environment);
  const adminReadVerifierDiagnostics = createAdminReadVerifierDiagnostics(environment);
  const persistence = createPersistenceRuntimeComposition(options);
  const studentCourses = createStudentCourses(persistence, environment);
  const adminHttpContextResolver = createAdminHttpRequestContextResolver({ persistence, environment });
  const permissionResolver = new InMemoryAdminPermissionResolver();
  const commandRuntime = createAdminM2CommandRuntime({ source: adminCommandSource, persistence, permissionResolver, environment, poolFactory: options.writePoolFactory });
  const operationsExecutor = persistence.provider === "supabase" ? createAdminOperationsExecutor(environment, options.writePoolFactory) : undefined;
  const m2ReadModel = createAdminM2ReadModel(adminM2Source, persistence);
  const adminDependencies: AdminModuleDependencies = {
    permissionResolver,
    policyValidator: new InMemoryAdminPolicyValidator(),
    evidenceWriter: new InMemoryAdminEvidenceWriter(),
    overviewReadModel: createAdminOverviewReadModel(adminOverviewSource, persistence),
    m2ReadModel: adminReadVerifierDiagnostics ? adminReadVerifierDiagnostics.wrap(m2ReadModel) : m2ReadModel,
    studentsReadModel: persistence.provider === "supabase" && persistence.readTransport ? new PostgresAdminStudentsReadModel(persistence.readTransport) : new EmptyAdminStudentsReadModel(),
    m2CommandExecutor: commandRuntime.executor,
    operationsExecutor,
  };
  let closePromise: Promise<void> | undefined;
  return { studentCourses, status: "configured-admin-core-boundary", admin: createAdminModule(adminDependencies), adminDependencies, adminHttpContextResolver, persistence, adminOverviewSource, adminM2Source, adminCommandSource, ...(adminReadVerifierDiagnostics ? { adminReadVerifierDiagnostics } : {}), close: () => { if (!closePromise) closePromise = Promise.all([commandRuntime.close(), operationsExecutor?.close() ?? Promise.resolve(), persistence.close()]).then(() => undefined); return closePromise; } };
}
