import { env } from "../../../app/config/env";

const persistentStorageKey = "buc-elearning-auth-session";
const temporaryStorageKey = "buc-elearning-auth-session-tab";
const deviceKeyStorageKey = "buc-elearning-device-key";
const refreshLeewayMs = 60_000;
const googleContinuationStorageKey = "buc-elearning-google-continuation";

export type AuthBrand = "medway" | "elite" | "nexus";

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

interface ApiEnvelope<T> {
  readonly ok?: unknown;
  readonly data?: T;
}

interface LoginChallenge {
  readonly challengeId: string;
  readonly email: string;
  readonly brand: AuthBrand;
}

interface InitiationAttempt {
  readonly email: string;
  readonly brand: AuthBrand;
  readonly idempotencyKey: string;
}

interface VerifiedLogin {
  readonly challengeId: string;
  readonly email: string;
  readonly brand: AuthBrand;
  readonly remember: boolean;
  readonly session: StoredSession;
}

export class SupabaseAuthClientError extends Error {
  constructor(
    message: string,
    readonly status = 0,
  ) {
    super(message);
    this.name = "SupabaseAuthClientError";
  }
}

let pendingChallenge: LoginChallenge | null = null;
let initiationAttempt: InitiationAttempt | null = null;
let verifiedLogin: VerifiedLogin | null = null;

function canUseSupabaseAuth() {
  return Boolean(
    env.apiBaseUrl && env.supabaseUrl && env.supabasePublishableKey,
  );
}

function parseStoredSession(value: string | null): StoredSession | null {
  if (!value) return null;

  try {
    const parsed = JSON.parse(value) as Record<string, unknown>;
    const user = parsed.user as Record<string, unknown> | undefined;
    if (
      typeof parsed.accessToken !== "string" ||
      !parsed.accessToken ||
      typeof parsed.refreshToken !== "string" ||
      !parsed.refreshToken ||
      typeof parsed.expiresAt !== "number" ||
      !Number.isFinite(parsed.expiresAt) ||
      !user ||
      typeof user.id !== "string" ||
      !user.id
    ) {
      return null;
    }

    return {
      accessToken: parsed.accessToken,
      refreshToken: parsed.refreshToken,
      expiresAt: parsed.expiresAt,
      user: {
        id: user.id,
        email: typeof user.email === "string" ? user.email : null,
      },
    };
  } catch {
    return null;
  }
}

function readStoredSession(): StoredSession | null {
  if (typeof window === "undefined") return null;
  return (
    parseStoredSession(window.sessionStorage.getItem(temporaryStorageKey)) ??
    parseStoredSession(window.localStorage.getItem(persistentStorageKey))
  );
}

function clearStoredSession(): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(temporaryStorageKey);
  window.localStorage.removeItem(persistentStorageKey);
}

function persistSession(session: StoredSession, remember: boolean): void {
  if (typeof window === "undefined") return;
  clearStoredSession();
  const target = remember ? window.localStorage : window.sessionStorage;
  target.setItem(
    remember ? persistentStorageKey : temporaryStorageKey,
    JSON.stringify(session),
  );
}

function toSession(payload: SupabaseTokenResponse): StoredSession {
  const user = payload.user;
  if (
    typeof payload.access_token !== "string" ||
    !payload.access_token ||
    typeof payload.refresh_token !== "string" ||
    !payload.refresh_token ||
    typeof payload.expires_in !== "number" ||
    !Number.isFinite(payload.expires_in) ||
    !user ||
    typeof user.id !== "string" ||
    !user.id
  ) {
    throw new SupabaseAuthClientError(
      "The authentication service returned an incomplete session.",
    );
  }

  return {
    accessToken: payload.access_token,
    refreshToken: payload.refresh_token,
    expiresAt: Date.now() + payload.expires_in * 1_000,
    user: {
      id: user.id,
      email: typeof user.email === "string" ? user.email : null,
    },
  };
}

function createUuid(): string {
  if (typeof crypto === "undefined") {
    throw new SupabaseAuthClientError(
      "This browser cannot create a secure device identifier.",
    );
  }

  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();

  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0"));
  return [
    hex.slice(0, 4).join(""),
    hex.slice(4, 6).join(""),
    hex.slice(6, 8).join(""),
    hex.slice(8, 10).join(""),
    hex.slice(10, 16).join(""),
  ].join("-");
}

function getDeviceKey(): string {
  if (typeof window === "undefined") return createUuid();

  try {
    const existing = window.localStorage.getItem(deviceKeyStorageKey);
    if (existing && /^[0-9a-f-]{36}$/i.test(existing)) return existing;

    const deviceKey = createUuid();
    window.localStorage.setItem(deviceKeyStorageKey, deviceKey);
    return deviceKey;
  } catch {
    return createUuid();
  }
}

function browserFamily(): string {
  const userAgent = typeof navigator === "undefined" ? "" : navigator.userAgent;
  if (/Edg\//.test(userAgent)) return "Edge";
  if (/Firefox\//.test(userAgent)) return "Firefox";
  if (/Chrome\//.test(userAgent) || /CriOS\//.test(userAgent)) return "Chrome";
  if (/Safari\//.test(userAgent)) return "Safari";
  return "Other";
}

function platformFamily(): string {
  const userAgent = typeof navigator === "undefined" ? "" : navigator.userAgent;
  if (/Android/i.test(userAgent)) return "Android";
  if (/iPhone|iPad|iPod/i.test(userAgent)) return "iOS";
  if (/Windows/i.test(userAgent)) return "Windows";
  if (/Macintosh|Mac OS/i.test(userAgent)) return "macOS";
  if (/Linux/i.test(userAgent)) return "Linux";
  return "Web";
}

function authMessageForStatus(
  status: number,
  action: "request" | "verify" | "complete",
) {
  if (status === 400) {
    return action === "verify"
      ? "That sign-in code is invalid or expired. Request a new code and try again."
      : "Check the email address and selected brand, then try again.";
  }
  if (status === 401) {
    return action === "verify"
      ? "That sign-in code is invalid or expired. Request a new code and try again."
      : "Sign in again to establish a valid backend session.";
  }
  if (status === 403) {
    return "This account is not authorized for the selected brand. Choose its assigned brand and try again.";
  }
  if (status === 409) {
    return "This sign-in attempt is no longer current. Request a new code and try again.";
  }
  if (status === 426) {
    return "Secure HTTPS is required for sign-in. Open the approved secure address and try again.";
  }
  if (status === 429) {
    return "Too many sign-in attempts. Wait a moment before requesting another code.";
  }
  if (status === 503) {
    return "Sign-in is temporarily unavailable. Try again shortly.";
  }
  return action === "complete"
    ? "Your account was verified, but its secure session could not be established. Retry once; if it continues, contact support."
    : "The authentication service could not be reached. Check your connection and try again.";
}

async function refreshProviderSession(
  session: StoredSession,
): Promise<StoredSession> {
  if (!canUseSupabaseAuth()) {
    throw new SupabaseAuthClientError(
      "Supabase authentication is not configured for this web build.",
    );
  }

  let response: Response;
  try {
    response = await fetch(
      `${env.supabaseUrl}/auth/v1/token?grant_type=refresh_token`,
      {
        method: "POST",
        headers: {
          apikey: env.supabasePublishableKey,
          "content-type": "application/json",
          accept: "application/json",
        },
        body: JSON.stringify({ refresh_token: session.refreshToken }),
      },
    );
  } catch {
    throw new SupabaseAuthClientError(
      "The authentication service could not be reached.",
    );
  }

  if (!response.ok) {
    throw new SupabaseAuthClientError(
      "Your session has expired. Please sign in again.",
      response.status,
    );
  }

  const payload = (await response
    .json()
    .catch(() => ({}))) as SupabaseTokenResponse;
  return toSession(payload);
}

async function requestPlatformApi<T>(
  path: string,
  options: Readonly<{
    body?: Readonly<Record<string, string>>;
    accessToken?: string;
    idempotencyKey?: string;
  }> = {},
): Promise<{ readonly status: number; readonly data: T }> {
  if (!env.apiBaseUrl) {
    throw new SupabaseAuthClientError(
      "The backend API is not configured for this web build.",
    );
  }

  const headers: Record<string, string> = {
    Accept: "application/json",
    "X-Correlation-Id": createUuid(),
  };
  if (options.body) headers["Content-Type"] = "application/json";
  if (options.accessToken) {
    headers.Authorization = `Bearer ${options.accessToken}`;
  }
  if (options.idempotencyKey) {
    headers["Idempotency-Key"] = options.idempotencyKey;
  }

  let response: Response;
  try {
    response = await fetch(`${env.apiBaseUrl}${path}`, {
      method: options.body ? "POST" : "GET",
      headers,
      ...(options.body ? { body: JSON.stringify(options.body) } : {}),
    });
  } catch {
    throw new SupabaseAuthClientError(
      "The backend authentication service could not be reached.",
    );
  }

  const payload = (await response
    .json()
    .catch(() => null)) as ApiEnvelope<T> | null;
  if (!response.ok) {
    throw new SupabaseAuthClientError(
      authMessageForStatus(
        response.status,
        path.includes("otp/verify")
          ? "verify"
          : path.includes("login/complete")
            ? "complete"
            : "request",
      ),
      response.status,
    );
  }
  if (payload?.ok !== true || payload.data === undefined) {
    throw new SupabaseAuthClientError(
      "The backend returned an invalid authentication response.",
      response.status,
    );
  }

  return { status: response.status, data: payload.data };
}

async function hasActiveBackendSession(
  accessToken: string,
): Promise<boolean | null> {
  try {
    await requestPlatformApi<{ readonly id?: unknown }>(
      "/v1/sessions/current",
      {
        accessToken,
      },
    );
    return true;
  } catch (error) {
    if (
      error instanceof SupabaseAuthClientError &&
      [401, 403].includes(error.status)
    ) {
      return false;
    }
    return null;
  }
}

async function completeBackendLogin(input: VerifiedLogin): Promise<void> {
  const body = {
    challengeId: input.challengeId,
    deviceKey: getDeviceKey(),
    platform: platformFamily(),
    browser: browserFamily(),
  };

  try {
    await requestPlatformApi("/v1/auth/login/complete", {
      body,
      accessToken: input.session.accessToken,
    });
  } catch (error) {
    // A response can be lost after the backend commits. Confirm the session
    // before asking the user to repeat a one-time code.
    const activeSession = await hasActiveBackendSession(
      input.session.accessToken,
    );
    if (!activeSession) throw error;
  }

  persistSession(input.session, input.remember);
  pendingChallenge = null;
  initiationAttempt = null;
  verifiedLogin = null;
}

export async function restoreSupabaseSession(): Promise<StoredSession | null> {
  let session = readStoredSession();
  if (!session) return null;

  if (session.expiresAt <= Date.now() + refreshLeewayMs) {
    try {
      session = await refreshProviderSession(session);
      const remember =
        typeof window !== "undefined" &&
        window.localStorage.getItem(persistentStorageKey) !== null;
      persistSession(session, remember);
    } catch {
      clearStoredSession();
      return null;
    }
  }

  const backendSession = await hasActiveBackendSession(session.accessToken);
  if (backendSession === false) {
    clearStoredSession();
    return null;
  }
  return session;
}

export async function requestSupabaseEmailOtp(
  email: string,
  brand: AuthBrand,
  options: Readonly<{ resend?: boolean }> = {},
): Promise<void> {
  const normalizedEmail = email.trim().toLowerCase();
  const canReuseAttempt =
    !options.resend &&
    initiationAttempt?.email === normalizedEmail &&
    initiationAttempt.brand === brand;
  const attempt: InitiationAttempt = canReuseAttempt
    ? initiationAttempt!
    : {
        email: normalizedEmail,
        brand,
        idempotencyKey: createUuid(),
      };

  initiationAttempt = attempt;
  pendingChallenge = null;
  verifiedLogin = null;

  const result = await requestPlatformApi<{ readonly challengeId?: unknown }>(
    "/v1/auth/login/initiate",
    {
      body: { email: normalizedEmail, brand },
      idempotencyKey: attempt.idempotencyKey,
    },
  );
  if (typeof result.data.challengeId !== "string") {
    throw new SupabaseAuthClientError(
      "The backend returned an invalid sign-in challenge.",
    );
  }

  pendingChallenge = {
    challengeId: result.data.challengeId,
    email: normalizedEmail,
    brand,
  };
  initiationAttempt = null;
}

export async function resendSupabaseEmailOtp(
  email: string,
  brand: AuthBrand,
): Promise<void> {
  return requestSupabaseEmailOtp(email, brand, { resend: true });
}

export async function verifySupabaseEmailOtp(
  input: Readonly<{
    email: string;
    token: string;
    brand: AuthBrand;
    remember: boolean;
  }>,
): Promise<SupabaseAuthenticatedUser> {
  const email = input.email.trim().toLowerCase();
  const challenge = pendingChallenge;
  if (
    !challenge ||
    challenge.email !== email ||
    challenge.brand !== input.brand
  ) {
    throw new SupabaseAuthClientError(
      "This sign-in challenge has expired. Request a new code and try again.",
      409,
    );
  }

  if (
    verifiedLogin?.challengeId === challenge.challengeId &&
    verifiedLogin.email === email &&
    verifiedLogin.brand === input.brand
  ) {
    const retry = verifiedLogin;
    await completeBackendLogin(retry);
    return retry.session.user;
  }

  const result = await requestPlatformApi<{
    readonly accessToken?: unknown;
    readonly refreshToken?: unknown;
    readonly authUserId?: unknown;
    readonly expiresAt?: unknown;
  }>("/v1/auth/otp/verify", {
    body: { challengeId: challenge.challengeId, code: input.token.trim() },
  });

  const expiry =
    typeof result.data.expiresAt === "string"
      ? Date.parse(result.data.expiresAt)
      : Number.NaN;
  if (
    typeof result.data.accessToken !== "string" ||
    typeof result.data.refreshToken !== "string" ||
    typeof result.data.authUserId !== "string" ||
    !Number.isFinite(expiry)
  ) {
    throw new SupabaseAuthClientError(
      "The backend returned an incomplete verified session.",
    );
  }

  const session: StoredSession = {
    accessToken: result.data.accessToken,
    refreshToken: result.data.refreshToken,
    expiresAt: expiry,
    user: { id: result.data.authUserId, email },
  };
  verifiedLogin = {
    challengeId: challenge.challengeId,
    email,
    brand: input.brand,
    remember: input.remember,
    session,
  };

  await completeBackendLogin(verifiedLogin);
  return session.user;
}

interface GoogleContinuation {
  readonly kind: "login" | "claim";
  readonly brand: AuthBrand;
  readonly remember: boolean;
  readonly verifier: string;
  readonly state: string;
  readonly claimTicket?: string;
  readonly linkNonce?: string;
}

function base64Url(bytes: Uint8Array): string {
  let value = "";
  bytes.forEach((byte) => { value += String.fromCharCode(byte); });
  return btoa(value).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function randomBase64Url(size = 32): string {
  const bytes = crypto.getRandomValues(new Uint8Array(size));
  return base64Url(bytes);
}

async function pkceChallenge(verifier: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
  return base64Url(new Uint8Array(digest));
}

function saveGoogleContinuation(continuation: GoogleContinuation): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(googleContinuationStorageKey, JSON.stringify(continuation));
}

function readGoogleContinuation(): GoogleContinuation | null {
  if (typeof window === "undefined") return null;
  try {
    const value = JSON.parse(window.sessionStorage.getItem(googleContinuationStorageKey) ?? "null") as Partial<GoogleContinuation> | null;
    if (!value || (value.kind !== "login" && value.kind !== "claim") || !isAuthBrand(value.brand) || typeof value.verifier !== "string" || typeof value.state !== "string" || typeof value.remember !== "boolean") return null;
    if (value.kind === "claim" && (typeof value.claimTicket !== "string" || typeof value.linkNonce !== "string")) return null;
    return value as GoogleContinuation;
  } catch { return null; }
}

function clearGoogleContinuation(): void {
  if (typeof window !== "undefined") window.sessionStorage.removeItem(googleContinuationStorageKey);
}

function isAuthBrand(value: unknown): value is AuthBrand {
  return value === "medway" || value === "elite" || value === "nexus";
}

async function startGoogleOAuth(continuation: Omit<GoogleContinuation, "verifier" | "state">): Promise<void> {
  if (!canUseSupabaseAuth() || typeof window === "undefined" || !crypto.subtle) throw new SupabaseAuthClientError("Supabase Google authentication is not configured for this web build.");
  const verifier = randomBase64Url(48);
  const state = randomBase64Url(24);
  const challenge = await pkceChallenge(verifier);
  saveGoogleContinuation({ ...continuation, verifier, state });
  const callback = `${window.location.origin}/auth/callback`;
  const authorize = new URL(`${env.supabaseUrl}/auth/v1/authorize`);
  authorize.searchParams.set("provider", "google");
  authorize.searchParams.set("redirect_to", callback);
  authorize.searchParams.set("code_challenge", challenge);
  authorize.searchParams.set("code_challenge_method", "s256");
  authorize.searchParams.set("state", state);
  window.location.assign(authorize.toString());
}

async function exchangeGoogleCode(code: string, verifier: string): Promise<StoredSession> {
  let response: Response;
  try {
    response = await fetch(`${env.supabaseUrl}/auth/v1/token?grant_type=pkce`, {
      method: "POST",
      headers: { apikey: env.supabasePublishableKey, "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({ auth_code: code, code_verifier: verifier }),
    });
  } catch { throw new SupabaseAuthClientError("The authentication service could not be reached."); }
  if (!response.ok) throw new SupabaseAuthClientError("Google sign-in could not be completed. Start again and choose your Google account.", response.status);
  return toSession((await response.json().catch(() => ({}))) as SupabaseTokenResponse);
}

export async function beginStudentGoogleLogin(brand: AuthBrand, remember = true): Promise<void> {
  await startGoogleOAuth({ kind: "login", brand, remember });
}

export async function beginStudentAccountClaim(input: Readonly<{ brand: AuthBrand; accountIdentifier: string; setupCode: string; remember?: boolean }>): Promise<void> {
  const claim = await requestPlatformApi<{ readonly claimTicket?: unknown }>("/v1/auth/account-claim", { body: { brand: input.brand, accountIdentifier: input.accountIdentifier.trim(), setupCode: input.setupCode.trim() } });
  if (typeof claim.data.claimTicket !== "string") throw new SupabaseAuthClientError("The account activation service returned an invalid claim context.");
  const linked = await requestPlatformApi<{ readonly linkNonce?: unknown }>("/v1/auth/account-claim/google/initiate", { body: { claimTicket: claim.data.claimTicket } });
  if (typeof linked.data.linkNonce !== "string") throw new SupabaseAuthClientError("The account activation service returned an invalid Google link context.");
  await startGoogleOAuth({ kind: "claim", brand: input.brand, remember: input.remember ?? true, claimTicket: claim.data.claimTicket, linkNonce: linked.data.linkNonce });
}

export async function completeStudentGoogleCallback(): Promise<SupabaseAuthenticatedUser> {
  if (typeof window === "undefined") throw new SupabaseAuthClientError("Google sign-in must finish in a browser.");
  const continuation = readGoogleContinuation();
  const query = new URLSearchParams(window.location.search);
  const code = query.get("code");
  const state = query.get("state");
  if (!continuation || !code || state !== continuation.state) { clearGoogleContinuation(); throw new SupabaseAuthClientError("This Google sign-in callback is invalid or expired. Start again.", 409); }
  const session = await exchangeGoogleCode(code, continuation.verifier);
  if (continuation.kind === "claim") {
    await requestPlatformApi("/v1/auth/account-claim/google/complete", { body: { claimTicket: continuation.claimTicket!, linkNonce: continuation.linkNonce!, deviceKey: getDeviceKey(), platform: platformFamily(), browser: browserFamily() }, accessToken: session.accessToken });
  } else {
    await requestPlatformApi("/v1/auth/google/session", { body: { brand: continuation.brand, deviceKey: getDeviceKey(), platform: platformFamily(), browser: browserFamily() }, accessToken: session.accessToken });
  }
  persistSession(session, continuation.remember);
  clearGoogleContinuation();
  window.history.replaceState({}, document.title, "/");
  return session.user;
}
export async function getSupabaseAccessToken(): Promise<string | null> {
  const session = readStoredSession();
  if (!session) return null;
  if (session.expiresAt > Date.now() + refreshLeewayMs) {
    return session.accessToken;
  }

  try {
    const refreshed = await refreshProviderSession(session);
    const remember =
      typeof window !== "undefined" &&
      window.localStorage.getItem(persistentStorageKey) !== null;
    persistSession(refreshed, remember);
    return refreshed.accessToken;
  } catch {
    clearStoredSession();
    return null;
  }
}

export function cancelPendingSupabaseLogin(): void {
  pendingChallenge = null;
  initiationAttempt = null;
  verifiedLogin = null;
}

export function clearSupabaseSession(): void {
  const session = readStoredSession();
  if (session && env.apiBaseUrl) {
    void fetch(`${env.apiBaseUrl}/v1/sessions/logout`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        "X-Correlation-Id": createUuid(),
      },
    }).catch(() => undefined);
  }

  clearStoredSession();
  cancelPendingSupabaseLogin();
}

export function isSupabaseAuthConfigured(): boolean {
  return canUseSupabaseAuth();
}
