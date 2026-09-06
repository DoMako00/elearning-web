import { useState, type FormEvent } from "react";
import { ArrowRight, CheckCircle2, LockKeyhole, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import securityShield from "../../../Assets/onboarding/security-shield.webp";
import { AuthButton, AuthTextField } from "../components/AuthControls";
import { AuthIllustrationCard } from "../components/AuthIllustrationCard";
import { AuthShell } from "../components/AuthShell";

export function RegisterPage() {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors: Record<string, string> = {};
    if (!identifier.trim()) nextErrors.identifier = "Enter your email address or phone number.";
    if (!password) nextErrors.password = "Create a password.";
    if (!confirmation) nextErrors.confirmation = "Confirm your password.";
    else if (password !== confirmation) nextErrors.confirmation = "Passwords do not match.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length === 0) navigate("/auth/verify-otp");
  };

  const illustration = (
    <AuthIllustrationCard image={securityShield} alt="Shield and lock representing protected learning data" title="A secure start to your learning journey.">
      <ul className="auth-benefit-list">
        <li><ShieldCheck aria-hidden="true" /> Your details stay protected</li>
        <li><LockKeyhole aria-hidden="true" /> Continue with secure verification</li>
        <li><CheckCircle2 aria-hidden="true" /> Personalize your learning next</li>
      </ul>
    </AuthIllustrationCard>
  );

  return (
    <AuthShell step="sign-in" stepNumber={1} stepLabel="Create account" aside={illustration}>
      <div className="auth-heading">
        <p className="auth-eyebrow">Join GreenLearn</p>
        <h1 id="auth-page-title">Create your account</h1>
        <p>Start with your login details, then we&apos;ll help you personalize your learning.</p>
      </div>
      <form className="auth-form" onSubmit={submit} noValidate>
        <AuthTextField label="Email or phone number" name="identifier" autoComplete="username" placeholder="Enter your email or phone number" value={identifier} onChange={(event) => { setIdentifier(event.target.value); setErrors((current) => ({ ...current, identifier: "" })); }} error={errors.identifier} />
        <AuthTextField label="Create password" name="password" type="password" autoComplete="new-password" placeholder="Create a password" value={password} onChange={(event) => { setPassword(event.target.value); setErrors((current) => ({ ...current, password: "" })); }} error={errors.password} />
        <AuthTextField label="Confirm password" name="confirmation" type="password" autoComplete="new-password" placeholder="Confirm your password" value={confirmation} onChange={(event) => { setConfirmation(event.target.value); setErrors((current) => ({ ...current, confirmation: "" })); }} error={errors.confirmation} />
        <AuthButton type="submit">Create account <ArrowRight aria-hidden="true" /></AuthButton>
        <p className="auth-switch-copy">Already have an account? <button type="button" className="auth-inline-link" onClick={() => navigate("/auth/sign-in")}>Sign in</button></p>
      </form>
    </AuthShell>
  );
}
