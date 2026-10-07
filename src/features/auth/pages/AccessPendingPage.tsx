import { ArrowLeft, ArrowRight, Check, Clock3, CreditCard, LoaderCircle } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { AccessStateCard } from "../components/AccessStateCard";
import { AuthButton } from "../components/AuthControls";
import { AuthShell } from "../components/AuthShell";
import type { BrandId } from "../types/authOnboarding.types";

interface PendingLocationState { brand?: BrandId }

export function AccessPendingPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const brand = (location.state as PendingLocationState | null)?.brand === "elite" ? "Elite" : "Medway";

  return (
    <AuthShell step="choose-brand" stepNumber={4} stepLabel="Access Pending" pending compact>
      <div className="auth-heading auth-heading--centered">
        <p className="auth-status-kicker"><Clock3 aria-hidden="true" /> Mock payment status</p>
        <h1 id="auth-page-title">Payment under review</h1>
        <p>We’ve received your request and we’re verifying your payment.</p>
      </div>
      <AccessStateCard
        tone="pending"
        icon={<LoaderCircle />}
        title={`${brand} access is not active yet`}
        description={<><p>Selected brand: <strong>{brand}</strong></p><p>Payment method: manual transfer • Demo reference GL-2026-081</p></>}
      />
      <ol className="auth-timeline" aria-label="Payment review timeline">
        <li className="is-complete"><span><Check aria-hidden="true" /></span><div><strong>Payment submitted</strong><small>Request received</small></div></li>
        <li className="is-current"><span><Clock3 aria-hidden="true" /></span><div><strong>Under review</strong><small>Mock review in progress</small></div></li>
        <li><span><CreditCard aria-hidden="true" /></span><div><strong>Access granted</strong><small>Available after approval</small></div></li>
      </ol>
      <div className="auth-page-actions">
        <AuthButton type="button" onClick={() => navigate("/auth/access-granted", { state: { brand: brand.toLowerCase() } })}>Check status <ArrowRight aria-hidden="true" /></AuthButton>
        <AuthButton type="button" variant="secondary" onClick={() => navigate("/auth/choose-brand")}><ArrowLeft aria-hidden="true" /> Back to brand selection</AuthButton>
      </div>
      <p className="auth-local-disclaimer">Demo preview: “Check status” advances to the granted UI state without processing a payment or issuing access.</p>
    </AuthShell>
  );
}
