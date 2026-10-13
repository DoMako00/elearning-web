import { env } from "../../../app/config/env";
import { createAnonymousProviderSession, getSupabaseAccessToken, persistProviderSession } from "./supabaseAuth";

export type BrandCode = "medway" | "elite" | "nexus";
export class IdentityApiError extends Error {
  constructor(readonly code: string, message: string) { super(message); this.name = "IdentityApiError"; }
}

function key() { return crypto.randomUUID(); }
function baseUrl() { return env.apiBaseUrl.replace(/\/$/, ""); }
async function request<T>(path: string, body: Record<string, unknown>, options?: { token?: string; idempotency?: boolean }): Promise<T> {
  if (!baseUrl()) throw new IdentityApiError("api_not_configured", "This web build is missing VITE_API_BASE_URL.");
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (options?.idempotency !== false) headers["Idempotency-Key"] = key();
  if (options?.token) headers.Authorization = `Bearer ${options.token}`;
  const response = await fetch(`${baseUrl()}${path}`, { method: "POST", headers, body: JSON.stringify(body) });
  const payload = await response.json().catch(() => ({})) as { data?: T; error?: { code?: string; message?: string } };
  if (!response.ok || !payload.data) throw new IdentityApiError(payload.error?.code ?? `http_${response.status}`, payload.error?.message ?? "The request could not be completed.");
  return payload.data;
}

const deviceKey=()=>{
  const storageKey="greenlearn-device-key";
  let value=window.localStorage.getItem(storageKey);
  if(!value){value=crypto.randomUUID();window.localStorage.setItem(storageKey,value);}
  return value;
};
function deviceClassification(){
  const ua=navigator.userAgent;
  const platform=/iPad/i.test(ua)||(/Macintosh/i.test(ua)&&navigator.maxTouchPoints>1)?"iPad":/iPhone|Android.*Mobile|Windows Phone/i.test(ua)?"mobile phone":/Android/i.test(ua)?"tablet":/Macintosh|Mac OS/i.test(ua)?"laptop":/Windows|Linux/i.test(ua)?"desktop":"desktop";
  const browser=/Edg\//.test(ua)?"Edge":/Firefox\//.test(ua)?"Firefox":/Chrome\//.test(ua)?"Chrome":/Safari\//.test(ua)?"Safari":"Browser";
  return {deviceKey:deviceKey(),platform,browser};
}

export async function activateProvisionedStudent(input:Readonly<{brand:BrandCode;accountIdentifier:string;setupCode:string;remember:boolean}>){
  const claim=await request<{claimTicket:string}>("/v1/auth/account-claim",{brand:input.brand,accountIdentifier:input.accountIdentifier.trim(),setupCode:input.setupCode.trim()});
  const provider=await createAnonymousProviderSession();
  const device=deviceClassification();
  await request("/v1/auth/account-claim/complete",{claimTicket:claim.claimTicket,...device},{token:provider.accessToken});
  persistProviderSession({...provider,remember:input.remember});
}

export async function initiateOtpLogin(input: Readonly<{ email: string; brand: BrandCode }>) {
  return request<{ challengeId: string }>("/v1/auth/login/initiate", { email: input.email.trim(), brand: input.brand });
}

export async function verifyOtp(input: Readonly<{ challengeId: string; code: string; email: string; remember: boolean }>) {
  const verified = await verifyOtpProof({challengeId:input.challengeId,code:input.code});
  await request("/v1/auth/login/complete",{challengeId:input.challengeId,...deviceClassification()},{token:verified.accessToken,idempotency:false});
  persistProviderSession({ ...verified, email: input.email, remember: input.remember });
  return verified;
}

export async function verifyOtpProof(input:Readonly<{challengeId:string;code:string}>){
  return request<{ accessToken: string; refreshToken: string; authUserId: string; expiresAt: string }>("/v1/auth/otp/verify", { challengeId: input.challengeId, code: input.code.trim() }, { idempotency: false });
}

export async function initiateStudentEmailLink(email:string,stepUpBearerToken?:string){
  const token=await getSupabaseAccessToken();if(!token)throw new IdentityApiError("unauthenticated","Your session has expired. Sign in again.");
  return stepUpBearerToken
    ? request<{linkTicket:string;expiresAt:string}>("/v1/auth/email/replacement/initiate",{email:email.trim(),stepUpBearerToken},{token})
    : request<{linkTicket:string;expiresAt:string}>("/v1/auth/email/link/initiate",{email:email.trim()},{token});
}
export async function completeStudentEmailLink(input:Readonly<{linkTicket:string;code:string;remember?:boolean}>){
  const device=deviceClassification();
  const result=await request<{provider:{accessToken:string;refreshToken:string;authUserId:string;expiresAt:string};session:unknown}>("/v1/auth/email/link/complete",{linkTicket:input.linkTicket,code:input.code.trim(),...device},{idempotency:false});
  persistProviderSession({...result.provider,remember:input.remember??true});
  return result;
}
export async function getStudentAuthMethods(){
  const token=await getSupabaseAccessToken();if(!token)throw new IdentityApiError("unauthenticated","Your session has expired. Sign in again.");
  const response=await fetch(`${baseUrl()}/v1/auth/methods`,{headers:{Authorization:`Bearer ${token}`}});
  const payload=await response.json().catch(()=>({})) as {data?:{verifiedEmail?:string;brandCode?:BrandCode};error?:{code?:string;message?:string}};
  if(!response.ok||!payload.data)throw new IdentityApiError(payload.error?.code??`http_${response.status}`,payload.error?.message??"Could not read linked email status.");
  return payload.data;
}
