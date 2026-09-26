/**
 * Typed API client -- auto-generated contract, auth-aware.
 *
 * Usage:
 *   import { makeApiClient } from "../../app/api/client";
 *
 *   const api = await makeApiClient();
 *   const { data, error } = await api.GET("/v1/student/courses", {
 *     params: { query: { page: 1, pageSize: 25 } },
 *   });
 *
 * Notes:
 *  - makeApiClient() resolves the Supabase access token on every call so it
 *    is always fresh (Supabase refreshes the session automatically).
 *  - Returns null when the user is not signed in.
 *  - The paths type comes from the generated api-schema.d.ts; run
 *    npm run generate:api-types after any backend OpenAPI change.
 */

import type { paths } from "../../types/api-schema.d";
import { getSupabaseAccessToken } from "../../features/auth/api/supabaseAuth";
import { env } from "../config/env";

export interface RequestOptions {
  params?: {
    query?: Record<string, unknown>;
    path?: Record<string, unknown>;
  };
  body?: unknown;
  headers?: Record<string, string>;
  signal?: AbortSignal;
}

export type ApiResponse<T> =
  | { data: T; error?: never; response: Response }
  | { data?: never; error: unknown; response: Response };

export class ApiClient {
  constructor(private readonly baseUrl: string, private readonly token: string) {}

  private async request<T>(
    method: string,
    endpoint: string,
    options?: RequestOptions
  ): Promise<ApiResponse<T>> {
    let url = `${this.baseUrl}${endpoint}`;

    if (options?.params?.path) {
      for (const [key, value] of Object.entries(options.params.path)) {
        url = url.replace(`{${key}}`, encodeURIComponent(String(value)));
      }
    }

    if (options?.params?.query) {
      const searchParams = new URLSearchParams();
      for (const [key, value] of Object.entries(options.params.query)) {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      }
      const queryString = searchParams.toString();
      if (queryString) {
        url += (url.includes("?") ? "&" : "?") + queryString;
      }
    }

    const headers = new Headers(options?.headers || {});
    headers.set("Authorization", `Bearer ${this.token}`);
    if (options?.body && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: options?.body ? JSON.stringify(options.body) : undefined,
        signal: options?.signal,
      });

      let json: any = null;
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        try {
          json = await response.json();
        } catch {
          json = null;
        }
      }

      if (!response.ok) {
        return { error: json ?? { message: response.statusText }, response };
      }

      return { data: json as T, response };
    } catch (err) {
      return {
        error: err,
        response: new Response(null, { status: 500, statusText: "Network Error" }),
      };
    }
  }

  GET<P extends keyof paths & string>(
    path: P,
    options?: paths[P] extends { get: { parameters?: infer Params } }
      ? Params extends { query?: infer Q; path?: infer Pth }
        ? { params?: { query?: Q; path?: Pth }; signal?: AbortSignal }
        : RequestOptions
      : RequestOptions
  ): Promise<
    paths[P] extends { get: { responses: { 200: { content: { "application/json": infer R } } } } }
      ? ApiResponse<R>
      : ApiResponse<any>
  > {
    return this.request("GET", path, options) as any;
  }

  POST<P extends keyof paths & string>(
    path: P,
    options?: any
  ): Promise<ApiResponse<any>> {
    return this.request("POST", path, options);
  }

  PATCH<P extends keyof paths & string>(
    path: P,
    options?: any
  ): Promise<ApiResponse<any>> {
    return this.request("PATCH", path, options);
  }

  DELETE<P extends keyof paths & string>(
    path: P,
    options?: any
  ): Promise<ApiResponse<any>> {
    return this.request("DELETE", path, options);
  }
}

/**
 * Creates a fully typed client for the GreenLearn API.
 *
 * Returns null if the user is not authenticated (no token available).
 * Call this inside React Query queryFn / mutationFn so the token is
 * always fresh per request.
 */
export async function makeApiClient(): Promise<ApiClient | null> {
  const baseUrl = env.apiBaseUrl.trim().replace(/\/$/, "");
  if (!baseUrl) {
    console.warn("[api/client] VITE_API_BASE_URL is not set -- requests will fail.");
  }

  const token = await getSupabaseAccessToken();
  if (!token) return null;

  return new ApiClient(baseUrl, token);
}

/**
 * Like makeApiClient() but throws ApiClientUnauthenticatedError instead of
 * returning null. Useful inside React Query where you want automatic error
 * boundaries to handle the unauthenticated state.
 */
export async function requireApiClient(): Promise<ApiClient> {
  const client = await makeApiClient();
  if (!client) throw new ApiClientUnauthenticatedError();
  return client;
}

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------

export class ApiClientUnauthenticatedError extends Error {
  constructor() {
    super("Sign in to continue.");
    this.name = "ApiClientUnauthenticatedError";
  }
}

/**
 * Narrows an openapi-fetch error response into a human-readable message.
 * The backend wraps every error as { ok: false, error: { code, message } }.
 */
export function extractApiErrorMessage(
  error: unknown,
  fallback = "An unexpected error occurred.",
): string {
  if (error instanceof ApiClientUnauthenticatedError) return error.message;

  if (
    error !== null &&
    typeof error === "object" &&
    "message" in error &&
    typeof (error as { message?: unknown }).message === "string"
  ) {
    return (error as { message: string }).message || fallback;
  }

  return fallback;
}
