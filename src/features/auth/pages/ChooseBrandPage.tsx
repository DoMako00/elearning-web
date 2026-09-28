import { useRef, useState, type FormEvent } from "react";
import { ArrowRight, Award, Clock3, Laptop, LockKeyhole, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AccessStateCard } from "../components/AccessStateCard";
import { AuthButton } from "../components/AuthControls";
import { AuthShell } from "../components/AuthShell";
import { BrandChoiceCard } from "../components/BrandChoiceCard";
import { brandOptions } from "../data/authOnboarding.mock";
import type { BrandId } from "../types/authOnboarding.types";

export function ChooseBrandPage() {
  const navigate = useNavigate();
  const brandGroupRef = useRef<HTMLFieldSetElement>(null);
  const [selectedBrand, setSelectedBrand] = useState<BrandId>("medway");
  const [error, setError] = useState("");
  const selected = brandOptions.find((brand) => brand.id === selectedBrand);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selected) {
      setError("Choose a learning brand to continue.");
      return;
    }
    navigate("/auth/access-pending", { state: { brand: selected.id } });
  };

  return (
    <AuthShell
      step="choose-brand"
      stepNumber={4}
      stepLabel="Choose Brand & Access"
      aside={
        <div className="auth-benefits-card">
          <h2>Built around your learning</h2>
          <ul className="auth-benefit-list">
            <li><ShieldCheck aria-hidden="true" /> High-quality medical content</li>
            <li><Clock3 aria-hidden="true" /> Learn at your own pace</li>
            <li><Award aria-hidden="true" /> Certificates and progress tracking</li>
            <li><Laptop aria-hidden="true" /> Access on all your devices</li>
          </ul>
        </div>
      }
    >
      <div className="auth-heading auth-heading--compact">
        <p className="auth-eyebrow">Choose your path</p>
        <h1 id="auth-page-title">Choose your learning brand</h1>
        <p>Each brand offers specialized medical learning paths.</p>
      </div>
      <form className="auth-form auth-brand-form" onSubmit={submit} noValidate>
        <fieldset id="auth-brand-options" ref={brandGroupRef} className="auth-brand-grid" tabIndex={-1} aria-describedby={error ? "brand-error" : undefined}>
          <legend className="sr-only">Learning brand</legend>
          {brandOptions.map((brand) => <BrandChoiceCard key={brand.id} brand={brand} selected={selectedBrand === brand.id} onSelect={() => { setSelectedBrand(brand.id); setError(""); }} />)}
        </fieldset>
        {error && <span id="brand-error" className="auth-field__error" role="alert">{error}</span>}
        <AccessStateCard
          icon={<LockKeyhole />}
          title="No active access yet"
          description={<><p>You don’t have an active subscription for {selected?.name ?? "this brand"}.</p><p>Subscribe to unlock premium courses and resources.</p></>}
          actions={<><AuthButton type="submit">Continue to payment <ArrowRight aria-hidden="true" /></AuthButton><AuthButton type="button" variant="secondary" onClick={() => brandGroupRef.current?.focus()}>Back to brands</AuthButton></>}
        />
      </form>
    </AuthShell>
  );
}
