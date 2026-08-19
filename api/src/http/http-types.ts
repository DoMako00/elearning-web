import type { createAdminModule } from "../modules/admin";

export type AdminModule = ReturnType<typeof createAdminModule>;

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "OPTIONS";
export interface HttpRequestContext { readonly method: HttpMethod; readonly url: string; readonly headers: Readonly<Record<string, string | undefined>>; readonly correlationId: string; }
export interface HttpJsonResponse { readonly statusCode: number; readonly body: Readonly<Record<string, unknown>>; readonly headers?: Readonly<Record<string, string>>; }
export type HttpRouteHandler = (request: HttpRequestContext) => HttpJsonResponse | Promise<HttpJsonResponse>;
export interface HttpRuntimeConfig { readonly port: number; readonly host?: string; readonly runtimeMode: "mock"; readonly serviceName: "api"; }
export interface HttpAppDependencies { readonly admin: AdminModule; readonly config?: HttpRuntimeConfig; }
