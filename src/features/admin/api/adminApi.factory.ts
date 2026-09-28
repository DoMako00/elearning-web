import { env, type AdminDataSource } from "../../../app/config/env";
import { createHttpAdminApi } from "./adminApi.http";
import { createMockAdminApi } from "./adminApi.mock";
import type { AdminApi } from "./adminApi";

/** API mode is a development/staging skeleton only; selected frontend brand is never authorization. */
export function getAdminDataSource(): AdminDataSource {
  return env.adminDataSource;
}

export function getAdminApiBaseUrl(): string {
  return env.apiBaseUrl;
}

export function createAdminApiFromEnvironment(): AdminApi {
  return getAdminDataSource() === "api"
    ? createHttpAdminApi({ baseUrl: getAdminApiBaseUrl() })
    : createMockAdminApi();
}

export type { AdminDataSource };
