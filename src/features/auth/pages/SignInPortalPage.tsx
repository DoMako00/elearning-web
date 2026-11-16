import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, BookOpen, GraduationCap, Layers3, RefreshCw, ShieldCheck, UserRound } from "lucide-react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { getFallbackPublicBrands, listPublicBrands, type PublicBrand } from "../api/publicBrandCatalogApi";
import { SignInPage } from "./SignInPage";
import "../styles/sign-in-portal.css";

type PortalRole = "student" | "instructor" | "admin";

function usePublicBrands() {
  const [brands, setBrands] = useState<PublicBrand[]>(getFallbackPublicBrands());
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState<"api" | "fallback">("fallback");
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    void listPublicBrands(controller.signal).then((result) => {
      if (controller.signal.aborted) return;
      setBrands(result.brands);
      setSource(result.source);
      setError("");
    }).catch((cause: unknown) => {
      if (controller.signal.aborted) return;
      setBrands(getFallbackPublicBrands());
      setSource("fallback");
      setError(cause instanceof Error ? cause.message : "Learning brands could not be loaded.");
    }).finally(() => {
      if (!controller.signal.aborted) setLoading(false);
    });
    return () => controller.abort();
  }, [retry]);

  return { brands, loading, source, error, refresh: () => setRetry((value) => value + 1) };
}

export function SignInPortalPage() {
  const { brandCode, role: roleParam } = useParams<{ brandCode?: string; role?: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const catalog = usePublicBrands();
  const brand = catalog.brands.find((item) => item.code.toLowerCase() === brandCode?.toLowerCase());
  const role = roleParam?.toLowerCase() as PortalRole | undefined;
  const validRole = role === "student" || role === "instructor" || role === "admin";
  const routeState = location.state;
  const navigateWithState = (path: string) => navigate(path, { state: routeState });

  if (brandCode && roleParam && validRole && brand) {
    return <SignInPage key={`${brand.code}:${role}`} brandCode={brand.code} brandName={brand.name} role={role} />;
  }

  if (catalog.loading && (brandCode || roleParam)) {
    return <main className="signin-portal" aria-busy="true"><div className="signin-portal__loading"><span className="signin-portal__brand-mark"><BookOpen aria-hidden="true" /></span><strong>Loading your sign-in options</strong></div></main>;
  }

  if (brandCode && !brand) {
    return <main className="signin-portal"><section className="signin-portal__message"><span className="signin-portal__brand-mark"><BookOpen aria-hidden="true" /></span><h1>Brand unavailable</h1><p>This learning brand is not currently available for sign-in.</p>{catalog.error && <small role="status">{catalog.error}</small>}<button type="button" className="signin-portal__primary" onClick={() => navigateWithState("/auth/sign-in")}><ArrowLeft size={17} /> Choose another brand</button>{catalog.error && <button type="button" className="signin-portal__retry" onClick={catalog.refresh}><RefreshCw size={15} /> Retry loading brands</button>}</section></main>;
  }

  if (brand && !validRole) {
    const roles: Array<{ id: PortalRole; title: string; detail: string; icon: typeof GraduationCap }> = [
      { id: "student", title: "Student", detail: "Open your classes, assignments, and learning progress.", icon: GraduationCap },
      { id: "instructor", title: "Instructor", detail: "Manage courses, student work, and teaching materials.", icon: UserRound },
      { id: "admin", title: "Admin", detail: "Manage your learning organization and review activity.", icon: ShieldCheck },
    ];
    return <main className="signin-portal">
      <header className="signin-portal__topbar"><a className="signin-portal__wordmark" href="/auth/sign-in"><span className="signin-portal__brand-mark"><BookOpen aria-hidden="true" /></span><span><strong>GreenLearn</strong><small>Learning workspace</small></span></a><span className="signin-portal__secure"><ShieldCheck size={16} /> Secure sign in</span></header>
      <section className="signin-portal__content">
        <button type="button" className="signin-portal__back" onClick={() => navigateWithState("/auth/sign-in")}><ArrowLeft size={16} /> Change brand</button>
        <span className="signin-portal__eyebrow">SELECT YOUR PORTAL</span>
        <div className="signin-portal__title-row"><div><h1>Welcome to {brand.name}</h1><p>Choose the workspace that matches your account.</p></div><span className="signin-portal__selected-brand"><Layers3 size={15} /> {brand.name}</span></div>
        <div className="signin-portal__role-grid">{roles.map((item) => { const Icon = item.icon; return <button type="button" className="signin-portal__role-card" key={item.id} onClick={() => navigateWithState(`/auth/sign-in/${encodeURIComponent(brand.code)}/${item.id}`)}><span className={`signin-portal__role-icon is-${item.id}`}><Icon aria-hidden="true" /></span><span className="signin-portal__role-copy"><strong>{item.title}</strong><small>{item.detail}</small></span><ArrowRight className="signin-portal__role-arrow" size={18} /></button>; })}</div>
        <p className="signin-portal__footnote">Your account access is verified securely for the selected brand.</p>
      </section>
      <footer className="signin-portal__footer">GreenLearn <span>·</span> Secure learning platform</footer>
    </main>;
  }

  return <main className="signin-portal">
    <header className="signin-portal__topbar"><a className="signin-portal__wordmark" href="/auth/sign-in"><span className="signin-portal__brand-mark"><BookOpen aria-hidden="true" /></span><span><strong>GreenLearn</strong><small>Learning workspace</small></span></a><span className="signin-portal__secure"><ShieldCheck size={16} /> Secure sign in</span></header>
    <section className="signin-portal__content signin-portal__content--brands">
      <span className="signin-portal__eyebrow">WELCOME BACK</span>
      <h1>Choose your learning brand</h1>
      <p className="signin-portal__intro">Select your organization to continue to the right sign-in options.</p>
      {catalog.error && <div className="signin-portal__catalog-notice" role="status"><span>{catalog.error} Showing the currently configured brands.</span><button type="button" onClick={catalog.refresh}><RefreshCw size={14} /> Retry</button></div>}
      <div className="signin-portal__brand-grid" aria-label="Available learning brands" aria-busy={catalog.loading}>
        {catalog.brands.map((item, index) => <button type="button" className="signin-portal__brand-card" key={item.code} onClick={() => navigateWithState(`/auth/sign-in/${encodeURIComponent(item.code)}`)}>
          <span className={`signin-portal__brand-card-mark is-brand-${index % 4}`}>{item.logoUrl ? <img src={item.logoUrl} alt="" /> : <Layers3 aria-hidden="true" />}</span>
          <span className="signin-portal__brand-card-copy"><strong>{item.name}</strong><small>{item.description}</small></span>
          <ArrowRight className="signin-portal__role-arrow" size={18} />
        </button>)}
      </div>
      {catalog.loading && <p className="signin-portal__loading-note" role="status">Checking available brands…</p>}
      {catalog.source === "fallback" && !catalog.error && <p className="signin-portal__footnote">Brand options are ready to sync with the public brand catalog.</p>}
    </section>
    <footer className="signin-portal__footer">GreenLearn <span>·</span> Secure learning platform</footer>
  </main>;
}
