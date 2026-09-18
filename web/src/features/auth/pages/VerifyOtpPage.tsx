import { useState, type FormEvent } from "react";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import otpPhoneSecurity from "../../../Assets/onboarding/otp-phone-security.webp";
import { AuthButton } from "../components/AuthControls";
import { AuthIllustrationCard } from "../components/AuthIllustrationCard";
import { AuthShell } from "../components/AuthShell";
import { OtpInput } from "../components/OtpInput";

export function VerifyOtpPage() {
  const navigate = useNavigate();
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!code.every((digit) => /^\d$/.test(digit))) {
      setError("Enter all six digits to continue.");
      return;
    }
    setError("");
    navigate("/auth/complete-profile");
  };

  return (
    <AuthShell
      step="verify-otp"
      stepNumber={2}
      stepLabel="Verify OTP"
      aside={<AuthIllustrationCard image={otpPhoneSecurity} alt="Phone with secure verification check" title="Quick and secure" description="This extra step helps us keep your account safe." />}
    >
      <div className="auth-heading">
        <p className="auth-eyebrow">One-time verification</p>
        <h1 id="auth-page-title">Verify your phone number</h1>
        <p>Enter the 6-digit code we sent to <strong>+20 ***-4567</strong> <button type="button" className="auth-inline-link" onClick={() => navigate("/auth/sign-in")}>Change</button></p>
      </div>
      <form className="auth-form auth-form--otp" onSubmit={submit} noValidate>
        <OtpInput value={code} onChange={(next) => { setCode(next); setError(""); }} error={error} />
        <div className="auth-resend">
          <span>Didn’t receive the code?</span>
          <span>Resend code in <strong>00:45</strong></span>
        </div>
        <AuthButton type="submit">Verify <ArrowRight aria-hidden="true" /></AuthButton>
        <p className="auth-trust-note"><ShieldCheck aria-hidden="true" /> We never share your number with anyone.</p>
      </form>
    </AuthShell>
  );
}
