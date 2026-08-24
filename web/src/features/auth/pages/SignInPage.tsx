import { useState, type FormEvent } from "react";
import { ArrowRight, CheckCircle2, Eye, LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import securityShield from "../../../Assets/onboarding/security-shield.webp";
import { AuthButton, AuthTextField } from "../components/AuthControls";
import { AuthIllustrationCard } from "../components/AuthIllustrationCard";
import { AuthShell } from "../components/AuthShell";
import type { SignInMode } from "../types/authOnboarding.types";

export function SignInPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<SignInMode>("password");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors: Record<string, string> = {};
    if (!identifier.trim()) nextErrors.identifier = "Enter your email address or phone number.";
    if (mode === "password" && !password) nextErrors.password = "Enter your password.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length === 0) navigate("/auth/verify-otp");
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
        <p className="auth-eyebrow">Start your GreenLearn journey</p>
        <h1 id="auth-page-title">Welcome back <span aria-hidden="true">👋</span></h1>
        <p>Sign in to continue your learning journey.</p>
      </div>
      <div className="auth-mode-tabs" role="tablist" aria-label="Sign in method">
        <button type="button" role="tab" aria-selected={mode === "password"} className={mode === "password" ? "is-active" : ""} onClick={() => setMode("password")}><LockKeyhole aria-hidden="true" /> Password</button>
        <button type="button" role="tab" aria-selected={mode === "otp"} className={mode === "otp" ? "is-active" : ""} onClick={() => setMode("otp")}><Mail aria-hidden="true" /> OTP Login</button>
      </div>
      <form className="auth-form" onSubmit={submit} noValidate>
        <AuthTextField label="Email or phone number" name="identifier" autoComplete="username" placeholder="Enter your email or phone number" value={identifier} onChange={(event) => { setIdentifier(event.target.value); setErrors((current) => ({ ...current, identifier: "" })); }} error={errors.identifier} />
        {mode === "password" && <AuthTextField label="Password" name="password" type="password" autoComplete="current-password" placeholder="Enter your password" value={password} onChange={(event) => { setPassword(event.target.value); setErrors((current) => ({ ...current, password: "" })); }} error={errors.password} trailing={<Eye aria-hidden="true" />} />}
        <div className="auth-form__utility">
          <label className="auth-checkbox"><input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} /><span>Remember me</span></label>
          {mode === "password" && <button className="auth-link-button" type="button">Forgot password?</button>}
        </div>
        <AuthButton type="submit">Continue <ArrowRight aria-hidden="true" /></AuthButton>
        <div className="auth-divider"><span>or</span></div>
        <AuthButton type="button" variant="secondary" onClick={() => navigate("/auth/verify-otp")}><span className="auth-google-mark" aria-hidden="true">G</span> Continue with Google</AuthButton>
        <p className="auth-switch-copy">Don&apos;t have an account? <button type="button" className="auth-inline-link" onClick={() => navigate("/auth/register")}>Create account</button></p>
      </form>
    </AuthShell>
  );
}
