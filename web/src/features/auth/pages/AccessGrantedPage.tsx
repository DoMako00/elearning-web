import { ArrowRight, CalendarCheck, Check, ShieldCheck, UserRound } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { AccessStateCard } from "../components/AccessStateCard";
import { AuthButton } from "../components/AuthControls";
import { AuthShell } from "../components/AuthShell";
import type { BrandId } from "../types/authOnboarding.types";

interface GrantedLocationState { brand?: BrandId }

export function AccessGrantedPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const brand = (location.state as GrantedLocationState | null)?.brand === "elite" ? "Elite" : "Medway";

  return (
    <AuthShell step="access-granted" stepNumber={5} stepLabel="You’re all set!" compact>
      <div className="auth-success-mark" aria-hidden="true"><Check /></div>
      <div className="auth-heading auth-heading--centered">
        <p className="auth-status-kicker"><ShieldCheck aria-hidden="true" /> Mock access preview</p>
        <h1 id="auth-page-title">Welcome to {brand}!</h1>
        <p>Your access is now active in this frontend preview.</p>
      </div>
      <AccessStateCard
        tone="success"
        icon={<ShieldCheck />}
        title={`${brand} Subscription`}
        description={<div className="auth-subscription-details"><span><UserRound aria-hidden="true" /> Individual plan</span><span><CalendarCheck aria-hidden="true" /> Valid until 24 August 2027 (mock date)</span></div>}
        actions={<AuthButton type="button" onClick={() => navigate("/my-courses")}>Go to My Courses <ArrowRight aria-hidden="true" /></AuthButton>}
      />
      <p className="auth-local-disclaimer">UI state only — no backend subscription, session, payment, or protected-content grant has been created.</p>
    </AuthShell>
  );
}
