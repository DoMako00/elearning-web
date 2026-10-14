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

  /** Typed adapter escape hatch for newly mounted backend paths before the
   * generated OpenAPI client types have been refreshed. Requests still share
   * this client's bearer, JSON, abort and normalized-error behavior. */
  getJson<T>(endpoint: string, options?: Pick<RequestOptions, "signal">): Promise<ApiResponse<T>> {
    return this.request<T>("GET", endpoint, options);
  }

  /** Fetch a protected same-origin backend document with the current bearer.
   * Used for issued documents whose API response is intentionally not JSON. */
  async getBlob(endpoint: string, options?: Pick<RequestOptions, "signal">): Promise<ApiResponse<Blob>> {
    if (!endpoint.startsWith("/") || endpoint.startsWith("//")) {
      return { error: new Error("A relative API path is required."), response: new Response(null, { status: 400 }) };
    }
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: "GET",
        headers: { Authorization: `Bearer ${this.token}` },
        signal: options?.signal,
      });
      if (!response.ok) {
        let error: unknown = { message: "The protected document could not be opened." };
        if (response.headers.get("content-type")?.includes("application/json")) {
          try { error = await response.json(); } catch { /* keep safe generic error */ }
        }
        return { error, response };
      }
      return { data: await response.blob(), response };
    } catch (error) {
      return { error, response: new Response(null, { status: 500, statusText: "Network Error" }) };
    }
  }

  /** Upload bytes directly to a short-lived backend-signed HTTPS URL. The
   * browser never sends its API bearer to object storage. */
  async putSignedObject(url: string, body: Blob, headers: Readonly<Record<string, string>>, signal?: AbortSignal): Promise<ApiResponse<undefined>> {
    let parsed: URL;
    try { parsed = new URL(url); } catch {
      return { error: new Error("The private upload URL is invalid."), response: new Response(null, { status: 400 }) };
    }
    if (parsed.protocol !== "https:") {
      return { error: new Error("The private upload requires HTTPS."), response: new Response(null, { status: 400 }) };
    }
    try {
      const response = await fetch(parsed.toString(), { method: "PUT", headers: { ...headers }, body, signal });
      if (!response.ok) {
        return { error: new Error(`The private file upload failed (HTTP ${response.status}).`), response };
      }
      return { data: undefined, response };
    } catch {
      return { error: new Error("The private file upload could not reach storage."), response: new Response(null, { status: 500, statusText: "Network Error" }) };
    }
  }

  writeJson<T>(method: "POST" | "PATCH" | "PUT" | "DELETE", endpoint: string, body?: unknown, options?: Pick<RequestOptions, "signal" | "headers">): Promise<ApiResponse<T>> {
    return this.request<T>(method, endpoint, { ...options, ...(body === undefined ? {} : { body }) });
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

  if (!baseUrl) return null;
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

  if (
    error !== null &&
    typeof error === "object" &&
    "error" in error &&
    (error as { error?: unknown }).error !== null &&
    typeof (error as { error?: unknown }).error === "object" &&
    "message" in ((error as { error: Record<string, unknown> }).error) &&
    typeof (error as { error: { message?: unknown } }).error.message === "string"
  ) {
    return (error as { error: { message: string } }).error.message || fallback;
  }

  return fallback;
}
