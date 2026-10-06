import { useState, type FormEvent } from "react";
import {
  ArrowRight,
  BarChart3,
  Building2,
  Check,
  Mail,
  ShieldCheck,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../../app/providers/AuthProvider";
import authBotanicalBg from "../../../Assets/onboarding/auth-botanical-bg.jpg";
import "../styles/SignInModern.css";

export function SignInPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const auth = useAuth();

  const [identifier, setIdentifier] = useState("");
  const [brand, setBrand] = useState<"medway" | "elite" | "nexus">("medway");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"email" | "otp">("email");
  const [remember, setRemember] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState("");

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors: Record<string, string> = {};
    if (!identifier.trim()) nextErrors.identifier = "Enter your email address.";
    if (step === "otp" && !/^\d{8}$/.test(otp))
      nextErrors.otp = "Enter the 8-digit code from your email.";
    if (!auth.configured) {
      nextErrors.form =
        "This web build is missing its Supabase public authentication configuration.";
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    if (step === "email") {
      const result = await auth.requestEmailOtp(identifier, brand);
      setSubmitting(false);
      if (!result.success) {
        setErrors({ form: result.message });
        return;
      }
      setStep("otp");
      setNotice(
        "A sign-in code was sent if this account is eligible. Check your inbox.",
      );
      return;
    }

    const result = await auth.verifyEmailOtp({
      email: identifier,
      token: otp,
      brand,
      remember,
    });
    setSubmitting(false);
    if (!result.success) {
      setErrors({ form: result.message });
      return;
    }

    const redirect = (location.state as { from?: unknown } | null)?.from;
    navigate(
      typeof redirect === "string" && redirect.startsWith("/") ? redirect : "/",
      { replace: true },
    );
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
          <a
            href="/auth/sign-in"
            className="signin-logo"
            aria-label="GreenLearn home"
          >
            {/* GreenLearn Two-Leaf Mark SVG */}
            <svg
              className="w-10 h-10 shrink-0"
              viewBox="0 0 44 44"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              {/* Left darker leaf */}
              <path d="M8 28C8 17 18 8 26 8C26 19 19 28 8 28Z" fill="#166534" />
              {/* Right lighter leaf */}
              <path
                d="M17 34C17 22 28 14 36 14C36 26 29 34 17 34Z"
                fill="#22c55e"
              />
            </svg>
            <span className="signin-logo-text">GreenLearn</span>
          </a>

          {/* Heading */}
          <h1 className="signin-title">Welcome back</h1>
          <p className="signin-subtitle">
            Sign in to continue to your workspace.
          </p>

          {/* Form */}
          <form className="signin-form" onSubmit={submit} noValidate>
            {/* Email Field */}
            <div className="signin-field-group">
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
                    const nextEmail = e.target.value;
                    if (
                      step === "otp" &&
                      nextEmail.trim().toLowerCase() !==
                        identifier.trim().toLowerCase()
                    ) {
                      auth.cancelPendingLogin();
                      setStep("email");
                      setOtp("");
                      setNotice("");
                    }
                    setIdentifier(nextEmail);
                    setErrors((prev) => ({
                      ...prev,
                      identifier: "",
                      form: "",
                    }));
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
            </div>

            <div className="signin-field-group">
              <label htmlFor="signin-brand" className="signin-field-label">
                Brand workspace
              </label>
              <div className="signin-input-wrapper">
                <Building2 className="signin-input-icon" aria-hidden="true" />
                <select
                  id="signin-brand"
                  name="brand"
                  className="signin-input"
                  value={brand}
                  disabled={submitting}
                  onChange={(event) => {
                    const nextBrand = event.target.value as typeof brand;
                    if (nextBrand !== brand) {
                      auth.cancelPendingLogin();
                      setBrand(nextBrand);
                      setStep("email");
                      setOtp("");
                      setErrors({});
                      setNotice("");
                    }
                  }}
                >
                  <option value="medway">Medway</option>
                  <option value="elite">Elite</option>
                  <option value="nexus">Nexus</option>
                </select>
              </div>
              <p className="signin-subtitle">
                The backend checks your account’s access to this workspace.
              </p>
            </div>

            {step === "otp" && (
              <div className="signin-field-group">
                <label htmlFor="signin-otp" className="signin-field-label">
                  8-digit email code
                </label>
                <div
                  className={`signin-input-wrapper ${errors.otp ? "has-error" : ""}`}
                >
                  <Mail className="signin-input-icon" aria-hidden="true" />
                  <input
                    id="signin-otp"
                    type="text"
                    name="one-time-code"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    pattern="[0-9]{8}"
                    maxLength={8}
                    placeholder="Enter code"
                    value={otp}
                    onChange={(event) => {
                      setOtp(event.target.value.replace(/\D/g, "").slice(0, 8));
                      setErrors((current) => ({
                        ...current,
                        otp: "",
                        form: "",
                      }));
                    }}
                    className="signin-input"
                    aria-invalid={Boolean(errors.otp)}
                    aria-describedby={
                      errors.otp ? "signin-otp-error" : undefined
                    }
                  />
                </div>
                {errors.otp && (
                  <span
                    id="signin-otp-error"
                    className="signin-field-error"
                    role="alert"
                  >
                    {errors.otp}
                  </span>
                )}
                <p className="signin-subtitle">
                  Enter the latest code sent to {identifier}.
                </p>
              </div>
            )}

            {/* Keep the existing remember-me behavior for provider session storage. */}
            <div className="signin-utilities">
              <button
                type="button"
                className="signin-remember-btn"
                onClick={() => setRemember((prev) => !prev)}
                role="checkbox"
                aria-checked={remember}
              >
                <div
                  className={`signin-checkbox-box ${remember ? "checked" : ""}`}
                >
                  {remember && <Check className="w-3.5 h-3.5 stroke-3" />}
                </div>
                <span>Remember me</span>
              </button>

              {step === "otp" && (
                <button
                  type="button"
                  className="signin-forgot-link"
                  disabled={submitting}
                  onClick={async () => {
                    setSubmitting(true);
                    setErrors({});
                    const result = await auth.resendEmailOtp(identifier, brand);
                    setSubmitting(false);
                    if (!result.success) setErrors({ form: result.message });
                    else
                      setNotice(
                        "A new sign-in code was requested. Use the newest email.",
                      );
                  }}
                >
                  Resend code
                </button>
              )}
            </div>

            {notice && (
              <p className="signin-subtitle" role="status">
                {notice}
              </p>
            )}

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

            {step === "otp" && (
              <button
                type="button"
                className="signin-forgot-link"
                disabled={submitting}
                onClick={() => {
                  auth.cancelPendingLogin();
                  setStep("email");
                  setOtp("");
                  setErrors({});
                  setNotice("");
                }}
              >
                Use a different email
              </button>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="signin-submit-btn"
            >
              {submitting ? (
                <span>
                  {step === "email"
                    ? "Sending code…"
                    : "Verifying and establishing session…"}
                </span>
              ) : (
                <>
                  <span>
                    {step === "email"
                      ? "Send sign-in code"
                      : "Verify and continue"}
                  </span>
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Column: 3D Botanical Art & Floating Cards */}
        <aside className="signin-art-col" aria-hidden="true">
          {/* Background image */}
          <img src={authBotanicalBg} alt="" className="signin-art-background" />

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
                  <path
                    d="M12 6C15 6 18 8 18 11C15 11 12 9 12 6Z"
                    fill="#bbf7d0"
                  />
                  <path
                    d="M12 12C9 12 6 14 6 17C9 17 12 15 12 12Z"
                    fill="#bbf7d0"
                  />
                  <path
                    d="M12 15C15 15 17 16.5 17 19C15 19 12 17.5 12 15Z"
                    fill="#86efac"
                  />
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
