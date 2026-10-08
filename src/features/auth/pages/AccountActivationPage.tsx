import { useState, type FormEvent } from "react";
import { ArrowRight, KeyRound, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../../../app/providers/AuthProvider";
import type { AuthBrand } from "../api/supabaseAuth";
import "../styles/SignInModern.css";

export function AccountActivationPage() {
  const auth = useAuth();
  const [brand, setBrand] = useState<AuthBrand>("elite");
  const [accountIdentifier, setAccountIdentifier] = useState("");
  const [setupCode, setSetupCode] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!accountIdentifier.trim() || !setupCode.trim()) { setError("Enter the account identifier and one-time setup code supplied by the Admin."); return; }
    if (!auth.configured) { setError("Supabase Google authentication is not configured for this deployment."); return; }
    setSubmitting(true); setError("");
    try { await auth.beginStudentAccountClaim({ brand, accountIdentifier, setupCode }); }
    catch (cause) { setSubmitting(false); setError(cause instanceof Error ? cause.message : "Account activation could not be started."); }
  }

  return <div className="signin-page"><aside className="signin-security-badge" aria-label="Security status"><ShieldCheck aria-hidden="true" /><span>Secure account activation</span></aside><div className="signin-layout"><div className="signin-form-col"><Link to="/auth/sign-in" className="signin-logo" aria-label="Return to sign in"><KeyRound aria-hidden="true" /><span className="signin-logo-text">GreenLearn</span></Link><h1 className="signin-title">Activate your account</h1><p className="signin-subtitle">Use the setup details provided by your Admin, then connect your verified Google account.</p><form className="signin-form" onSubmit={(event) => void submit(event)} noValidate><div className="signin-field-group"><label htmlFor="activation-brand" className="signin-field-label">Brand</label><select id="activation-brand" className="signin-input" value={brand} disabled={submitting} onChange={(event) => setBrand(event.target.value as AuthBrand)}><option value="medway">Medway</option><option value="elite">Elite</option><option value="nexus">Nexus</option></select></div><div className="signin-field-group"><label htmlFor="activation-identifier" className="signin-field-label">Account identifier</label><input id="activation-identifier" className="signin-input" autoComplete="off" value={accountIdentifier} disabled={submitting} onChange={(event) => setAccountIdentifier(event.target.value)} /></div><div className="signin-field-group"><label htmlFor="activation-code" className="signin-field-label">One-time setup code</label><input id="activation-code" className="signin-input" autoComplete="one-time-code" value={setupCode} disabled={submitting} onChange={(event) => setSetupCode(event.target.value)} /></div>{error && <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-medium" role="alert">{error}</div>}<p className="signin-subtitle">The code is consumed after the verified Google account is safely linked to this existing Student record.</p><button type="submit" className="signin-submit-btn" disabled={submitting}>{submitting ? "Opening Google…" : <><span>Continue with Google</span><ArrowRight aria-hidden="true" /></>}</button><Link className="signin-forgot-link" to="/auth/sign-in">Already activated? Sign in with Google</Link></form></div></div></div>;
}