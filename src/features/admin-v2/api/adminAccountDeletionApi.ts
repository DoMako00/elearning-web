import { extractApiErrorMessage, requireApiClient } from "../../../app/api/client";

type Envelope<T> = { ok: true; correlationId: string; data: T };
const key = () => crypto.randomUUID();

async function unwrap<T>(request: Promise<{ data?: unknown; error?: unknown }>): Promise<T> {
  const response = await request;
  if (response.error) throw new Error(extractApiErrorMessage(response.error, "Account request failed."));
  const payload = response.data as Envelope<T> | undefined;
  if (!payload?.data) throw new Error("The server returned an incomplete account response.");
  return payload.data;
}

export type DeletionKind = "student" | "admin";
export interface AccountDeletionPreview {
  targetKind: DeletionKind;
  targetProfileId: string;
  displayName: string;
  email: string;
  brandCodes: string[];
  affectedProfileCount: number;
}
export interface AccountDeletionResult {
  requestId: string;
  status: "pending" | "completed";
  targetKind: DeletionKind;
  targetProfileId: string;
  brandIds: string[];
  reason?: string;
}
export interface PendingAccountDeletion {
  id: string;
  targetKind: DeletionKind;
  targetProfileId: string;
  email: string | null;
  displayName: string;
  brandCodes: string[];
  attemptCount: number;
  lastErrorCode: string | null;
  createdAt: string;
}

export async function getAccountDeletionPreview(kind: DeletionKind, profileId: string): Promise<AccountDeletionPreview> {
  const api = await requireApiClient();
  const path = kind === "student"
    ? `/v1/admin/students/${encodeURIComponent(profileId)}/deletion-preview`
    : `/v1/admin/roles/admins/${encodeURIComponent(profileId)}/deletion-preview`;
  return unwrap<AccountDeletionPreview>(api.getJson(path));
}

export async function deleteAccountIdentity(kind: DeletionKind, profileId: string, input: { confirmationEmail: string; reason: string }): Promise<AccountDeletionResult> {
  const api = await requireApiClient();
  const path = kind === "student"
    ? `/v1/admin/students/${encodeURIComponent(profileId)}`
    : `/v1/admin/roles/admins/${encodeURIComponent(profileId)}`;
  return unwrap<AccountDeletionResult>(api.writeJson("DELETE", path, input, { headers: { "Idempotency-Key": key() } }));
}

export async function listPendingAccountDeletions(): Promise<PendingAccountDeletion[]> {
  const api = await requireApiClient();
  const result = await unwrap<{ items: PendingAccountDeletion[] }>(api.getJson("/v1/admin/account-deletions/pending"));
  return result.items;
}

export async function retryAccountDeletion(requestId: string): Promise<AccountDeletionResult> {
  const api = await requireApiClient();
  return unwrap<AccountDeletionResult>(api.writeJson("POST", `/v1/admin/account-deletions/${encodeURIComponent(requestId)}/retry`, {}, { headers: { "Idempotency-Key": key() } }));
}
