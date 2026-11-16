import { useState, type FormEvent } from "react";
import {
  ArrowRight,
  BookOpen,
  Check,
  Mail,
  ShieldCheck,
} from "lucide-react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../../../app/providers/AuthProvider";
import { activateProvisionedStudent, IdentityApiError, initiateOtpLogin, verifyOtp } from "../api/identityApi";
import { getAdminOverview } from "../../admin-v2/api/adminOperationsApi";
import { getAdminWorkspace } from "../../admin-v2/api/adminRolesApi";
import { assignLocation } from "../../../shared/utils/hardNavigation";
import { toBrandCode } from "../../../shared/domain/brandInstitution";
import "../styles/SignInModern.css";

type PortalRole = "student" | "instructor" | "admin";
interface SignInPageProps { brandCode?: string; brandName?: string; role?: PortalRole }

export function SignInPage({ brandCode = "elite", brandName = "Elite", role = "student" }: SignInPageProps) {
  const location = useLocation();
  const auth = useAuth();
  const returnTo = (location.state as { from?: unknown } | null)?.from;
  const [studentMode, setStudentMode] = useState<"activate" | "signin">("activate");
  const mode = role === "student" ? studentMode : "signin";
  const [identifier, setIdentifier] = useState("");
  const [accountIdentifier, setAccountIdentifier] = useState("");
  const [setupCode, setSetupCode] = useState("");
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [otp, setOtp] = useState("");
  const [remember, setRemember] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors: Record<string, string> = {};
    if(mode==="activate"){
      if(!accountIdentifier.trim())nextErrors.accountIdentifier="Enter the Account Identifier provided by your Admin.";
      if(!setupCode.trim())nextErrors.setupCode="Enter your one-time Setup Code.";
    }else{
      if (!identifier.trim()) nextErrors.identifier = "Enter your verified email address.";
      if (challengeId && !/^\d{6,8}$/.test(otp.trim())) nextErrors.otp = "Enter the one-time code sent to your email.";
    }
    if (!auth.configured) {
      nextErrors.form =
        "This web build is missing its Supabase public authentication configuration.";
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    try {
      if(mode==="activate"){
        await activateProvisionedStudent({brand: brandCode,accountIdentifier,setupCode,remember});
        setSetupCode("");
        assignLocation("/");
      }else if (!challengeId) {
        const challenge = await initiateOtpLogin({ email: identifier, brand: brandCode });
        setChallengeId(challenge.challengeId);
      } else {
        await verifyOtp({ challengeId, code: otp, email: identifier, remember });
        const savedDestination = typeof returnTo === "string" && returnTo.startsWith("/") && !returnTo.startsWith("//") ? returnTo : null;
        let adminDestination: string | null = null;
        try {
          const workspace = await getAdminWorkspace();
          adminDestination = workspace.workspace === "instructor" ? "/admin/instructor" : "/admin";
        } catch (workspaceError) {
          const wsStatus = (workspaceError as { status?: number }).status;
          if (wsStatus !== 403 && wsStatus !== 404) throw workspaceError;
          const knownBrandCode = toBrandCode(brandCode);
          if (knownBrandCode) {
            try { await getAdminOverview(knownBrandCode); adminDestination = "/admin"; }
            catch (overviewError) {
              const status = (overviewError as { status?: number }).status;
              if (status !== 403 && status !== 404) throw overviewError;
            }
          }
        }
        if (adminDestination) {
          const isInstructorDestination = adminDestination === "/admin/instructor";
          const canReturn = isInstructorDestination ? savedDestination?.startsWith("/admin/instructor") : savedDestination === "/admin" || savedDestination?.startsWith("/admin/");
          assignLocation(canReturn ? savedDestination! : adminDestination);
        } else {
          assignLocation(savedDestination?.startsWith("/") && !savedDestination.startsWith("//") && !savedDestination.startsWith("/admin") ? savedDestination : "/");
        }
      }
    } catch (error) {
      const loginEligibilityFailure = error instanceof IdentityApiError && error.code === "student_email_link_required";
      const loginEligibilityMessage = role === "admin"
        ? `This email is not recognized as an active Admin for ${brandName}. Ask your platform owner to review your Admin access.`
        : role === "instructor"
          ? `This email is not recognized as an active Instructor for ${brandName}. Ask your administrator to review your Instructor access.`
          : `Email sign-in is unavailable for ${brandName}. Students must activate their provisioned account and link a verified real email.`;
      setErrors({ form: loginEligibilityFailure
        ? loginEligibilityMessage
        : error instanceof Error ? error.message : "Unable to complete sign-in." });
    } finally { setSubmitting(false); }
  };

  return (
    <main className="signin-page signin-portal signin-portal--credentials">
      <header className="signin-portal__topbar">
        <a className="signin-portal__wordmark" href="/auth/sign-in" aria-label="GreenLearn sign in">
          <span className="signin-portal__brand-mark"><BookOpen aria-hidden="true" /></span>
          <span><strong>GreenLearn</strong><small>Learning workspace</small></span>
        </a>
        <span className="signin-portal__secure"><ShieldCheck aria-hidden="true" /> Secure sign in</span>
      </header>
      <div className="signin-layout">
        {/* Left Column: Sign-in Form */}
        <div className="signin-form-col">
          {/* Heading */}
          <a className="signin-selected-brand" href={`/auth/sign-in/${encodeURIComponent(brandCode)}`}><ArrowRight className="is-back" aria-hidden="true" /> {brandName} <span>·</span> Change role</a>
          <h1 className="signin-title">{role === "student" ? mode === "activate" ? "Activate your account" : "Student sign in" : `${role === "admin" ? "Admin" : "Instructor"} sign in`}</h1>
          <p className="signin-subtitle">{role === "student" ? mode === "activate" ? "Use the one-time details provided by your Admin. Link your verified email after activation." : "Sign in to your student learning workspace." : `Use your verified ${role === "admin" ? "Admin" : "Instructor"} email for ${brandName}.`}</p>
          {role === "student" && <div className="signin-role-tabs" role="tablist" aria-label="Student account access type">
            <button type="button" role="tab" aria-selected={mode === "activate"} onClick={() => {setStudentMode("activate");setChallengeId(null);setErrors({});}}>Activate account</button>
            <button type="button" role="tab" aria-selected={mode === "signin"} onClick={() => {setStudentMode("signin");setChallengeId(null);setErrors({});}}>Sign in</button>
          </div>}

          {auth.status === "authenticated" && !submitting ? (
            <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900" role="status">
              <p className="font-semibold">You&apos;re already signed in{auth.user?.name && auth.user.name !== "Authenticated user" ? ` as ${auth.user.name}` : ""}.</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" className="min-h-11 rounded-xl bg-emerald-700 px-4 font-semibold text-white" onClick={() => assignLocation(typeof returnTo === "string" && returnTo.startsWith("/") && !returnTo.startsWith("//") ? returnTo : role === "admin" ? "/admin" : role === "instructor" ? "/admin/instructor" : "/")}>Continue</button>
                <button type="button" className="min-h-11 rounded-xl border border-emerald-300 bg-white px-4 font-semibold text-emerald-800" onClick={() => void auth.signOut({ revokeServerSession: true })}>Sign out</button>
              </div>
            </div>
          ) : null}

          {/* Form */}
          <form className="signin-form" onSubmit={submit} noValidate>
            {mode === "activate" ? <>
            <div className="signin-field-group">
              <label htmlFor="signin-account-id" className="signin-field-label">Account Identifier</label>
              <input id="signin-account-id" value={accountIdentifier} onChange={e=>setAccountIdentifier(e.target.value)} className="signin-input" autoComplete="off" />
              {errors.accountIdentifier && <span className="signin-field-error" role="alert">{errors.accountIdentifier}</span>}
            </div>
            <div className="signin-field-group">
              <label htmlFor="signin-setup-code" className="signin-field-label">One-time Setup Code</label>
              <input id="signin-setup-code" type="password" value={setupCode} onChange={e=>setSetupCode(e.target.value)} className="signin-input" autoComplete="one-time-code" />
              {errors.setupCode && <span className="signin-field-error" role="alert">{errors.setupCode}</span>}
            </div>
            </> : <div className="signin-field-group">
              <label htmlFor="signin-email" className="signin-field-label">
                Email address
              </label>
              <div
                className={`signin-input-wrapper ${
                  errors.identifier ? "has-error" : ""
                }`}
              >
                <Mail className="signin-input-icon" aria-hidden="true" />
                <input
                  id="signin-email"
                  type="email"
                  name="email"
                  autoComplete="username"
                  placeholder="you@company.com"
                  value={identifier}
                  onChange={(e) => {
                    setIdentifier(e.target.value);
                    setErrors((prev) => ({ ...prev, identifier: "", form: "" }));
                  }}
                  className="signin-input"
                  aria-invalid={Boolean(errors.identifier)}
                />
              </div>
              {errors.identifier && (
                <span className="signin-field-error" role="alert">
                  {errors.identifier}
                </span>
              )}
            </div>}

            {/* OTP field appears only after the backend has issued a challenge. */}
            {mode === "signin" && challengeId && (
            <div className="signin-field-group">
              <label htmlFor="signin-otp" className="signin-field-label">
                One-time code
              </label>
              <div
                className={`signin-input-wrapper ${
                  errors.otp ? "has-error" : ""
                }`}
              >
                <input
                  id="signin-otp"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder="123456"
                  value={otp}
                  onChange={(e) => {
                    setOtp(e.target.value.replace(/\D/g, ""));
                    setErrors((prev) => ({ ...prev, otp: "", form: "" }));
                  }}
                  className="signin-input"
                  aria-invalid={Boolean(errors.otp)}
                />
              </div>
              {errors.otp && (
                <span className="signin-field-error" role="alert">
                  {errors.otp}
                </span>
              )}
            </div>
            )}

            {/* Utilities: Remember me + Forgot password */}
            {mode === "signin" && <div className="signin-utilities">
              <button
                type="button"
                className="signin-remember-btn"
                onClick={() => setRemember((prev) => !prev)}
                role="checkbox"
                aria-checked={remember}
              >
                <div
                  className={`signin-checkbox-box ${
                    remember ? "checked" : ""
                  }`}
                >
                  {remember && <Check className="w-3.5 h-3.5 stroke-3" />}
                </div>
                <span>Remember me</span>
              </button>

              <span className="signin-forgot-link">Email OTP only · phone is not a login method</span>
            </div>}

            {/* Form Error Notification */}
            {errors.form && (
              <div
                className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-medium"
                role="alert"
              >
                {errors.form}
              </div>
            )}

            {!auth.configured && (
              <div
                className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs"
                role="status"
              >
                Authentication is not configured in this deployment. Add
                VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY, then
                rebuild.
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="signin-submit-btn"
            >
              {submitting ? (
                  <span>{challengeId ? "Verifying…" : "Sending code…"}</span>
              ) : (
                <>
                  <span>{mode === "activate" ? "Activate account" : challengeId ? "Verify code" : "Send code"}</span>
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </>
              )}
            </button>
          </form>
        </div>

      </div>
      <footer className="signin-portal__footer">GreenLearn <span>·</span> Secure learning platform</footer>
    </main>
  );
}
