import { useState, type FormEvent } from "react";
import {
  ArrowRight,
  BarChart3,
  Check,
  Mail,
  ShieldCheck,
} from "lucide-react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../../../app/providers/AuthProvider";
import { activateProvisionedStudent, IdentityApiError, initiateOtpLogin, verifyOtp, type BrandCode } from "../api/identityApi";
import { getAdminOverview } from "../../admin-v2/api/adminOperationsApi";
import { getAdminWorkspace } from "../../admin-v2/api/adminRolesApi";
import { assignLocation } from "../../../shared/utils/hardNavigation";
import authBotanicalBg from "../../../Assets/onboarding/auth-botanical-bg.jpg";
import { BrandLogo } from "../../../components/brand/BrandLogo";
import { NEXUS_LOGO_URL } from "../../../shared/brandAssets";
import "../styles/SignInModern.css";

export function SignInPage() {
  const location = useLocation();
  const auth = useAuth();
  const returnTo = (location.state as { from?: unknown } | null)?.from;
  const adminReturn = typeof returnTo === "string" && returnTo.startsWith("/admin");

  const [mode, setMode] = useState<"activate" | "signin">(adminReturn ? "signin" : "activate");
  const [brand, setBrand] = useState<BrandCode>("elite");
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
        await activateProvisionedStudent({brand,accountIdentifier,setupCode,remember});
        setSetupCode("");
        assignLocation("/");
      }else if (!challengeId) {
        const challenge = await initiateOtpLogin({ email: identifier, brand });
        setChallengeId(challenge.challengeId);
      } else {
        await verifyOtp({ challengeId, code: otp, email: identifier, remember });
        const savedDestination = typeof returnTo === "string" && returnTo.startsWith("/") && !returnTo.startsWith("//") ? returnTo : null;
        // First: check the workspace endpoint — works for both super admins and instructors.
        let adminDestination: string | null = null;
        try {
          const workspace = await getAdminWorkspace();
          if (workspace.workspace === "instructor") {
            adminDestination = "/admin/instructor";
          } else {
            adminDestination = "/admin";
          }
        } catch (workspaceError) {
          const wsStatus = (workspaceError as { status?: number }).status;
          if (wsStatus !== 403 && wsStatus !== 404) {
            // Network / server error — fall back to optimistic /admin so the layout can decide.
            adminDestination = "/admin";
          }
        }
        // If workspace check didn't resolve, try the super-admin overview as a secondary check.
        if (!adminDestination) {
          for (const adminBrand of ["elite", "medway", "nexus"] as const) {
            try { await getAdminOverview(adminBrand); adminDestination = "/admin"; break; }
            catch (error) {
              const status = (error as { status?: number }).status;
              if (status !== 403 && status !== 404) { adminDestination = "/admin"; break; }
            }
          }
        }
        if (adminDestination) {
          assignLocation(savedDestination?.startsWith("/admin") ? savedDestination : adminDestination);
        } else {
          assignLocation(savedDestination?.startsWith("/admin") ? "/" : savedDestination ?? "/");
        }
      }
    } catch (error) {
      const loginEligibilityFailure = error instanceof IdentityApiError && error.code === "student_email_link_required";
      const loginEligibilityMessage = adminReturn
        ? "This email is not recognized as an active Admin for the selected brand. Choose the correct brand or ask the platform owner to review your Admin access."
        : "Email sign-in is unavailable for the selected brand. Students must activate their provisioned account and link a verified real email; Admins must have current role access to that brand.";
      setErrors({ form: loginEligibilityFailure
        ? loginEligibilityMessage
        : error instanceof Error ? error.message : "Unable to complete sign-in." });
    } finally { setSubmitting(false); }
  };

  return (
    <div className="signin-page">
      {/* Top Right Security Badge */}
      <aside className="signin-security-badge" aria-label="Security status">
        <ShieldCheck aria-hidden="true" />
        <span>Secure learning platform</span>
      </aside>

      <div className="signin-layout">
        {/* Left Column: Sign-in Form */}
        <div className="signin-form-col">
          {/* Logo */}
          <a href="/auth/sign-in" className="signin-logo" aria-label={brand === "nexus" ? "Nexus sign in" : "GreenLearn home"}>
            {brand === "nexus" ? (
              <BrandLogo brandName="Nexus" src={NEXUS_LOGO_URL} className="signin-brand-logo" />
            ) : (
              <svg
                className="w-10 h-10 shrink-0"
                viewBox="0 0 44 44"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                {/* Left darker leaf */}
                <path
                  d="M8 28C8 17 18 8 26 8C26 19 19 28 8 28Z"
                  fill="#166534"
                />
                {/* Right lighter leaf */}
                <path
                  d="M17 34C17 22 28 14 36 14C36 26 29 34 17 34Z"
                  fill="#22c55e"
                />
              </svg>
            )}
            {brand !== "nexus" ? <span className="signin-logo-text">GreenLearn</span> : null}
          </a>

          {/* Heading */}
          <h1 className="signin-title">{mode === "activate" ? "Activate your account" : "Sign in"}</h1>
          <p className="signin-subtitle">{mode === "activate" ? "Use the one-time details provided by your Admin. You can link your real email in Settings after activation." : adminReturn ? "Use your verified Admin email to receive a one-time code." : "For students who have already linked and verified a real email."}</p>
          <div className="flex gap-2 mb-5" role="tablist" aria-label="Account access type">
            <button type="button" role="tab" aria-selected={mode === "activate"} onClick={() => {setMode("activate");setChallengeId(null);setErrors({});}} className="px-3 py-2 rounded-xl border border-emerald-700 text-sm font-semibold" style={{background:mode === "activate"?"#ecfdf3":"white",color:"#166534"}}>Activate your account</button>
            <button type="button" role="tab" aria-selected={mode === "signin"} onClick={() => {setMode("signin");setChallengeId(null);setErrors({});}} className="px-3 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700">Sign in</button>
          </div>

          {auth.status === "authenticated" && !submitting ? (
            <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900" role="status">
              <p className="font-semibold">You&apos;re already signed in{auth.user?.name && auth.user.name !== "Authenticated user" ? ` as ${auth.user.name}` : ""}.</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" className="min-h-11 rounded-xl bg-emerald-700 px-4 font-semibold text-white" onClick={() => assignLocation(adminReturn && typeof returnTo === "string" ? returnTo : typeof returnTo === "string" && returnTo.startsWith("/") && !returnTo.startsWith("//") ? returnTo : "/")}>Continue</button>
                <button type="button" className="min-h-11 rounded-xl border border-emerald-300 bg-white px-4 font-semibold text-emerald-800" onClick={() => void auth.signOut({ revokeServerSession: true })}>Sign out</button>
              </div>
            </div>
          ) : null}

          {/* Form */}
          <form className="signin-form" onSubmit={submit} noValidate>
            <div className="signin-field-group">
              <label htmlFor="signin-brand" className="signin-field-label">{mode === "activate" ? "Learning brand" : "Account brand"}</label>
              <select id="signin-brand" value={brand} onChange={(e)=>setBrand(e.target.value as BrandCode)} className="signin-input">
                <option value="medway">Medway</option><option value="elite">Elite</option><option value="nexus">Nexus</option>
              </select>
            </div>
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

        {/* Right Column: 3D Botanical Art & Floating Cards */}
        <aside className="signin-art-col" aria-hidden="true">
          {/* Background image */}
          <img
            src={authBotanicalBg}
            alt=""
            className="signin-art-background"
          />

          {/* Smooth blend gradient on the left edge */}
          <div className="signin-art-overlay-gradient" />

          {/* 3 Floating Cards matching the design */}
          <div className="signin-floating-cards">
            {/* Card 1: Course Syllabus */}
            <div className="signin-card-syllabus">
              <div className="signin-card-syllabus-icon">
                {/* Botanical leaf icon */}
                <svg
                  className="w-7 h-7"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#166534"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 2L12 22" />
                  <path d="M12 6C15 6 18 8 18 11C15 11 12 9 12 6Z" fill="#bbf7d0" />
                  <path d="M12 12C9 12 6 14 6 17C9 17 12 15 12 12Z" fill="#bbf7d0" />
                  <path d="M12 15C15 15 17 16.5 17 19C15 19 12 17.5 12 15Z" fill="#86efac" />
                </svg>
              </div>
              <div>
                <h3 className="signin-card-title">Course Syllabus</h3>
                <div className="signin-skeleton-line wide" />
                <div className="signin-skeleton-line short" />
              </div>
            </div>

            {/* Card 2: Learning Progress */}
            <div className="signin-card-progress">
              <div className="signin-card-progress-icon">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div className="signin-card-progress-content">
                <div className="signin-card-progress-header">
                  <span>Learning Progress</span>
                  <span>75%</span>
                </div>
                <div className="signin-progress-track">
                  <div className="signin-progress-bar" />
                </div>
              </div>
            </div>

            {/* Card 3: Protected Workspace */}
            <div className="signin-card-workspace">
              <div className="signin-card-workspace-icon">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="signin-card-title">Protected workspace</h3>
                <div className="signin-skeleton-line wide" />
                <div className="signin-skeleton-line short" />
              </div>
            </div>
          </div>
        </aside>
      </div>

    </div>
  );
}
