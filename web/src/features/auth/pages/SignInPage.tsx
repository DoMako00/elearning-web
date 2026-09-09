import { useState, type FormEvent } from "react";
import {
  ArrowRight,
  BarChart3,
  Check,
  Eye,
  EyeOff,
  Lock,
  Mail,
  ShieldCheck,
  X,
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
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSent, setForgotSent] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors: Record<string, string> = {};
    if (!identifier.trim()) nextErrors.identifier = "Enter your email address.";
    if (!password) nextErrors.password = "Enter your password.";
    if (!auth.configured) {
      nextErrors.form =
        "This web build is missing its Supabase public authentication configuration.";
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    const result = await auth.signInWithPassword({
      email: identifier,
      password,
      remember,
    });
    setSubmitting(false);

    if (!result.success) {
      setErrors({ form: result.message });
      return;
    }

    const redirect = (location.state as { from?: unknown } | null)?.from;
    navigate(
      typeof redirect === "string" && redirect.startsWith("/")
        ? redirect
        : "/admin",
      { replace: true }
    );
  };

  const handleForgotPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) return;
    setForgotSent(true);
    setTimeout(() => {
      setForgotModalOpen(false);
      setForgotSent(false);
      setForgotEmail("");
    }, 2500);
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
          <a href="/auth/sign-in" className="signin-logo" aria-label="GreenLearn home">
            {/* GreenLearn Two-Leaf Mark SVG */}
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
            </div>

            {/* Password Field */}
            <div className="signin-field-group">
              <label htmlFor="signin-password" className="signin-field-label">
                Password
              </label>
              <div
                className={`signin-input-wrapper ${
                  errors.password ? "has-error" : ""
                }`}
              >
                <Lock className="signin-input-icon" aria-hidden="true" />
                <input
                  id="signin-password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  autoComplete="current-password"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setErrors((prev) => ({ ...prev, password: "", form: "" }));
                  }}
                  className="signin-input"
                  aria-invalid={Boolean(errors.password)}
                />
                <button
                  type="button"
                  className="signin-password-toggle"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" aria-hidden="true" />
                  ) : (
                    <Eye className="w-5 h-5" aria-hidden="true" />
                  )}
                </button>
              </div>
              {errors.password && (
                <span className="signin-field-error" role="alert">
                  {errors.password}
                </span>
              )}
            </div>

            {/* Utilities: Remember me + Forgot password */}
            <div className="signin-utilities">
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
                  {remember && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>
                <span>Remember me</span>
              </button>

              <button
                type="button"
                className="signin-forgot-link"
                onClick={() => {
                  setForgotEmail(identifier);
                  setForgotModalOpen(true);
                }}
              >
                Forgot password?
              </button>
            </div>

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
                <span>Signing in…</span>
              ) : (
                <>
                  <span>Continue</span>
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

      {/* Forgot Password Modal */}
      {forgotModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-200"
          onClick={() => setForgotModalOpen(false)}
        >
          <div
            className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl border border-slate-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900">
                Reset your password
              </h3>
              <button
                type="button"
                onClick={() => setForgotModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {forgotSent ? (
              <div className="py-4 text-center">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center mb-3">
                  <Check className="w-6 h-6 stroke-[2.5]" />
                </div>
                <h4 className="text-base font-semibold text-slate-900 mb-1">
                  Reset link sent
                </h4>
                <p className="text-sm text-slate-500">
                  If an account exists for {forgotEmail}, you will receive a
                  password reset email shortly.
                </p>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword}>
                <p className="text-sm text-slate-500 mb-4">
                  Enter your email address and we'll send you a link to reset
                  your password.
                </p>
                <div className="mb-4">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email address
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="you@company.com"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10"
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => setForgotModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl text-sm font-medium bg-[#1d6e41] text-white hover:bg-[#165834]"
                  >
                    Send reset link
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
