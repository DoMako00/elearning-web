import { internalErrorResponse } from "./json-response";
import type { HttpJsonResponse } from "../http-types";
/** Converts unexpected exceptions to a redacted response. */
export function safeErrorResponse(correlationId: string, _error: unknown): HttpJsonResponse { return internalErrorResponse(correlationId); }
