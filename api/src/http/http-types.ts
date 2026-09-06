import type { createAdminModule } from "../modules/admin";
import type { AdminHttpRequestContextResolver } from "../core/context";

export type AdminModule = ReturnType<typeof createAdminModule>;

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "OPTIONS";
export interface HttpRequestContext { readonly method: HttpMethod; readonly url: string; readonly headers: Readonly<Record<string, string | undefined>>; readonly correlationId: string; readonly requestId: string; }
export interface HttpJsonResponse { readonly statusCode: number; readonly body: Readonly<Record<string, unknown>>; readonly headers?: Readonly<Record<string, string>>; readonly rawBody?: string; }
export type HttpRouteHandler = (request: HttpRequestContext) => HttpJsonResponse | Promise<HttpJsonResponse>;
export interface HttpRuntimeConfig { readonly port: number; readonly host?: string; readonly runtimeMode: "mock" | "supabase"; readonly serviceName: "api"; }
export interface HttpRuntimeStatus {
  readonly mode: "mock" | "supabase";
  readonly persistence: "mock" | "supabase";
  readonly auth: "mock" | "supabase";
  readonly adminOverviewSource: "mock" | "postgres";
  readonly adminM2Source: "mock" | "postgres";
  readonly adminCommandSource: "mock" | "postgres";
}
export type DatabaseReadinessProbe = () => Promise<void>;
export interface HttpAppDependencies { readonly admin: AdminModule; readonly adminHttpContextResolver?: AdminHttpRequestContextResolver; readonly config?: HttpRuntimeConfig; readonly runtimeStatus?: HttpRuntimeStatus; readonly databaseReadinessProbe?: DatabaseReadinessProbe; }
