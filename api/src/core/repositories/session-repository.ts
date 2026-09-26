import type { AppSession } from "../../domain";
import type { BrandScopedQuery, BrandScopedLookup, AppUserId, SessionId } from "../persistence";
import type { RepositoryResult } from "../persistence";

export interface SessionRepository {
  findSessionById(input: BrandScopedLookup<SessionId>): Promise<RepositoryResult<AppSession>>;
  findActiveSessionsForUser(input: BrandScopedLookup<AppUserId>): Promise<RepositoryResult<readonly AppSession[]>>;
  revokeSession(input: BrandScopedLookup<SessionId> & { readonly reason: string; readonly idempotencyKey: string }): Promise<RepositoryResult<void>>;
  recordSessionEvent(input: { readonly sessionId: SessionId; readonly brand: BrandScopedQuery["brand"]; readonly eventType: string; readonly correlationId?: string }): Promise<RepositoryResult<void>>;
}

