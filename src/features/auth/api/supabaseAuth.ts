import { env } from "../../../app/config/env";

const persistentStorageKey = "buc-elearning-auth-session";
const temporaryStorageKey = "buc-elearning-auth-session-tab";
/** Same-tab notification fired whenever the stored session is written or cleared. */
export const AUTH_SESSION_CHANGED_EVENT = "buc-elearning-auth-session-changed";
export const AUTH_SESSION_STORAGE_KEYS: readonly string[] = [persistentStorageKey, temporaryStorageKey];
const refreshLeewayMs = 60_000;

export interface SupabaseAuthenticatedUser {
  readonly id: string;
  readonly email: string | null;
}

interface StoredSession {
  readonly accessToken: string;
  readonly refreshToken: string;
  readonly expiresAt: number;
  readonly user: SupabaseAuthenticatedUser;
}

interface SupabaseTokenResponse {
  readonly access_token?: unknown;
  readonly refresh_token?: unknown;
  readonly expires_in?: unknown;
  readonly user?: { id?: unknown; email?: unknown };
}

export class SupabaseAuthClientError extends Error {}
/** The auth service could not be reached; the stored session may still be valid. */
export class SupabaseAuthNetworkError extends SupabaseAuthClientError {}

function notifySessionChanged(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(AUTH_SESSION_CHANGED_EVENT));
}

function canUseSupabaseAuth() {
  return Boolean(env.supabaseUrl && env.supabasePublishableKey);
}

function parseStoredSession(value: string | null): StoredSession | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value) as Record<string, unknown>;
    const user = parsed.user as Record<string, unknown> | undefined;
    if (typeof parsed.accessToken !== "string" || !parsed.accessToken || typeof parsed.refreshToken !== "string" || !parsed.refreshToken || typeof parsed.expiresAt !== "number" || !Number.isFinite(parsed.expiresAt) || !user || typeof user.id !== "string" || !user.id) return null;
    return { accessToken: parsed.accessToken, refreshToken: parsed.refreshToken, expiresAt: parsed.expiresAt, user: { id: user.id, email: typeof user.email === "string" ? user.email : null } };
  } catch {
    return null;
  }
}

function readStoredSession(): StoredSession | null {
  if (typeof window === "undefined") return null;
  return parseStoredSession(window.sessionStorage.getItem(temporaryStorageKey)) ?? parseStoredSession(window.localStorage.getItem(persistentStorageKey));
}

function clearStoredSession(notify = true): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(temporaryStorageKey);
  window.localStorage.removeItem(persistentStorageKey);
  if (notify) notifySessionChanged();
}

function persistSession(session: StoredSession, remember: boolean): void {
  if (typeof window === "undefined") return;
  clearStoredSession(false);
  const target = remember ? window.localStorage : window.sessionStorage;
  target.setItem(remember ? persistentStorageKey : temporaryStorageKey, JSON.stringify(session));
  notifySessionChanged();
}

function toSession(payload: SupabaseTokenResponse): StoredSession {
  const user = payload.user;
  if (typeof payload.access_token !== "string" || !payload.access_token || typeof payload.refresh_token !== "string" || !payload.refresh_token || typeof payload.expires_in !== "number" || !Number.isFinite(payload.expires_in) || !user || typeof user.id !== "string" || !user.id) throw new SupabaseAuthClientError("The authentication service returned an incomplete session.");
  return { accessToken: payload.access_token, refreshToken: payload.refresh_token, expiresAt: Date.now() + payload.expires_in * 1_000, user: { id: user.id, email: typeof user.email === "string" ? user.email : null } };
}

async function tokenRequest(grantType: "refresh_token", body: Readonly<Record<string, string>>): Promise<StoredSession> {
  if (!canUseSupabaseAuth()) throw new SupabaseAuthClientError("Supabase authentication is not configured for this web build.");
  let response: Response;
  try {
    response = await fetch(`${env.supabaseUrl}/auth/v1/token?grant_type=${grantType}`, { method: "POST", headers: { apikey: env.supabasePublishableKey, "content-type": "application/json", accept: "application/json" }, body: JSON.stringify(body) });
  } catch {
    throw new SupabaseAuthNetworkError("The authentication service could not be reached.");
  }
  const payload = await response.json().catch(() => ({})) as SupabaseTokenResponse;
  if (response.status >= 500) throw new SupabaseAuthNetworkError("The authentication service is temporarily unavailable.");
  if (!response.ok) throw new SupabaseAuthClientError("Your session has expired. Please sign in again.");
  return toSession(payload);
}

export async function restoreSupabaseSession(): Promise<StoredSession | null> {
  const session = readStoredSession();
  if (!session) return null;
  if (session.expiresAt > Date.now() + refreshLeewayMs) return session;
  try {
    const refreshed = await tokenRequest("refresh_token", { refresh_token: session.refreshToken });
    const remember = typeof window !== "undefined" && window.localStorage.getItem(persistentStorageKey) !== null;
    persistSession(refreshed, remember);
    return refreshed;
  } catch (error) {
    // A transient outage must not sign the student out; only a rejected
    // refresh token ends the stored session.
    if (!(error instanceof SupabaseAuthNetworkError)) clearStoredSession();
    return null;
  }
}

/** Synchronously reads the user id of the session this tab would use. */
export function readStoredAuthUserId(): string | null {
  return readStoredSession()?.user.id ?? null;
}

export interface ProviderSessionBundle { readonly accessToken:string; readonly refreshToken:string; readonly authUserId:string; readonly expiresAt:string; readonly email?:string|null; }

/**
 * Supabase invite links return a short-lived session in the URL fragment after
 * email confirmation. Verify that access token with Auth before trusting it,
 * then move the session into the same storage used by the OTP login flow.
 */
export async function acceptSupabaseInviteFromUrl(): Promise<ProviderSessionBundle | null> {
  if (typeof window === "undefined") return null;
  const fragment = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  if (fragment.get("type") !== "invite") return null;

  // Remove bearer credentials from browser history before making a request.
  window.history.replaceState(window.history.state, "", `${window.location.pathname}${window.location.search}`);

  const accessToken = fragment.get("access_token");
  const refreshToken = fragment.get("refresh_token");
  const expiresAtValue = fragment.get("expires_at");
  const expiresInValue = fragment.get("expires_in");
  const expiresAtSeconds = expiresAtValue ? Number(expiresAtValue) : Number.NaN;
  const expiresInSeconds = expiresInValue ? Number(expiresInValue) : Number.NaN;
  const hasAbsoluteExpiry = Number.isFinite(expiresAtSeconds) && expiresAtSeconds > 0;
  const hasRelativeExpiry = Number.isFinite(expiresInSeconds) && expiresInSeconds > 0;
  if (!accessToken || !refreshToken || (!hasAbsoluteExpiry && !hasRelativeExpiry)) {
    throw new SupabaseAuthClientError("The invitation link is incomplete. Ask your Admin to send a new invitation.");
  }
  const expiryMs = hasAbsoluteExpiry
    ? expiresAtSeconds * 1_000
    : Date.now() + expiresInSeconds * 1_000;
  if (!Number.isFinite(expiryMs) || expiryMs <= Date.now()) {
    throw new SupabaseAuthClientError("The invitation link is incomplete. Ask your Admin to send a new invitation.");
  }
  if (!canUseSupabaseAuth()) throw new SupabaseAuthClientError("Supabase authentication is not configured for this web build.");

  let response: Response;
  try {
    response = await fetch(`${env.supabaseUrl}/auth/v1/user`, {
      headers: { apikey: env.supabasePublishableKey, Authorization: `Bearer ${accessToken}`, accept: "application/json" },
    });
  } catch {
    throw new SupabaseAuthNetworkError("The invitation could not be verified. Check your connection and try again.");
  }
  if (!response.ok) throw new SupabaseAuthClientError("This invitation link is invalid or expired. Ask your Admin to send a new invitation.");

  const user = await response.json().catch(() => null) as { id?: unknown; email?: unknown; email_confirmed_at?: unknown; confirmed_at?: unknown } | null;
  if (!user || typeof user.id !== "string" || !user.id || (typeof user.email_confirmed_at !== "string" && typeof user.confirmed_at !== "string")) {
    throw new SupabaseAuthClientError("The confirmed invitation session is incomplete. Ask your Admin to send a new invitation.");
  }

  const session: ProviderSessionBundle = {
    accessToken,
    refreshToken,
    authUserId: user.id,
    expiresAt: new Date(expiryMs).toISOString(),
    email: typeof user.email === "string" ? user.email : null,
  };
  return session;
}

/** Creates a no-email Supabase identity for the one-time provisioned-account activation. */
export async function createAnonymousProviderSession(): Promise<ProviderSessionBundle> {
  if (!canUseSupabaseAuth()) throw new SupabaseAuthClientError("Supabase authentication is not configured for this web build.");
  let response:Response;
  try{response=await fetch(`${env.supabaseUrl}/auth/v1/signup`,{method:"POST",headers:{apikey:env.supabasePublishableKey,"content-type":"application/json",accept:"application/json"},body:JSON.stringify({data:{}})});}catch{throw new SupabaseAuthClientError("The authentication service could not be reached.");}
  const payload=await response.json().catch(()=>({})) as SupabaseTokenResponse;
  if(!response.ok)throw new SupabaseAuthClientError("First-time activation could not establish a secure session. Please try again.");
  const session=toSession(payload);
  return {accessToken:session.accessToken,refreshToken:session.refreshToken,authUserId:session.user.id,expiresAt:new Date(session.expiresAt).toISOString(),email:null};
}

export async function getSupabaseAccessToken(): Promise<string | null> {
  const session = await restoreSupabaseSession();
  return session?.accessToken ?? null;
}

export function clearSupabaseSession(): void {
  clearStoredSession();
}

/** Persists provider credentials only after the backend has accepted a device-bound session. */
export function persistProviderSession(input: Readonly<ProviderSessionBundle & { remember: boolean }>): void {
  const expiresAt = new Date(input.expiresAt).getTime();
  if (!input.accessToken || !input.refreshToken || !input.authUserId || !Number.isFinite(expiresAt)) {
    throw new SupabaseAuthClientError("The verified session is incomplete.");
  }
  persistSession({ accessToken: input.accessToken, refreshToken: input.refreshToken, expiresAt, user: { id: input.authUserId, email: input.email ?? null } }, input.remember);
}

export const persistVerifiedOtpSession=persistProviderSession;

export function isSupabaseAuthConfigured(): boolean {
  return canUseSupabaseAuth();
}
