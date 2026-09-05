import { useState, type FormEvent } from "react";
import { ArrowRight, CheckCircle2, Eye, LockKeyhole, ShieldCheck } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import securityShield from "../../../Assets/onboarding/security-shield.webp";
import { useAuth } from "../../../app/providers/AuthProvider";
import { AuthButton, AuthTextField } from "../components/AuthControls";
import { AuthIllustrationCard } from "../components/AuthIllustrationCard";
import { AuthShell } from "../components/AuthShell";

export function SignInPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const auth = useAuth();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors: Record<string, string> = {};
    if (!identifier.trim()) nextErrors.identifier = "Enter your email address.";
    if (!password) nextErrors.password = "Enter your password.";
    if (!auth.configured) nextErrors.form = "This web build is missing its Supabase public authentication configuration.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    setSubmitting(true);
    const result = await auth.signInWithPassword({ email: identifier, password, remember });
    setSubmitting(false);
    if (!result.success) {
      setErrors({ form: result.message });
      return;
    }
    const redirect = (location.state as { from?: unknown } | null)?.from;
    navigate(typeof redirect === "string" && redirect.startsWith("/admin") ? redirect : "/admin", { replace: true });
  };

  const illustration = (
    <AuthIllustrationCard image={securityShield} alt="Shield and lock representing protected learning data" title="Your learning. Your data. Always protected.">
      <ul className="auth-benefit-list">
        <li><ShieldCheck aria-hidden="true" /> Secure and encrypted</li>
        <li><LockKeyhole aria-hidden="true" /> Private and confidential</li>
        <li><CheckCircle2 aria-hidden="true" /> Trusted by students</li>
      </ul>
    </AuthIllustrationCard>
  );

  return (
    <AuthShell step="sign-in" stepNumber={1} stepLabel="Sign in" aside={illustration}>
      <div className="auth-heading">
        <p className="auth-eyebrow">BUC E-Learning administration</p>
        <h1 id="auth-page-title">Welcome back</h1>
        <p>Sign in with your approved administrator account to open the dashboard.</p>
      </div>
      <form className="auth-form" onSubmit={submit} noValidate>
        <AuthTextField label="Email address" name="identifier" type="email" autoComplete="username" placeholder="Enter your administrator email" value={identifier} onChange={(event) => { setIdentifier(event.target.value); setErrors((current) => ({ ...current, identifier: "", form: "" })); }} error={errors.identifier} />
        <AuthTextField label="Password" name="password" type="password" autoComplete="current-password" placeholder="Enter your password" value={password} onChange={(event) => { setPassword(event.target.value); setErrors((current) => ({ ...current, password: "", form: "" })); }} error={errors.password} trailing={<Eye aria-hidden="true" />} />
        <div className="auth-form__utility">
          <label className="auth-checkbox"><input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} /><span>Remember me</span></label>
          <button className="auth-link-button" type="button" disabled>Forgot password?</button>
        </div>
        {errors.form && <p className="auth-field__error" role="alert">{errors.form}</p>}
        <AuthButton type="submit" disabled={submitting || !auth.configured}>{submitting ? "Signing in…" : <>Continue <ArrowRight aria-hidden="true" /></>}</AuthButton>
        <p className="auth-switch-copy">Administrator accounts are provisioned by the platform owners.</p>
      </form>
    </AuthShell>
  );
}
