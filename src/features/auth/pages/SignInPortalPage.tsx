import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  Info,
  Layers3,
  RefreshCw,
  ShieldCheck,
  Sprout,
  UserRound,
} from "lucide-react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { getFallbackPublicBrands, listPublicBrands, type PublicBrand } from "../api/publicBrandCatalogApi";
import { SignInPage } from "./SignInPage";
import booksAndLeavesImg from "../../../Assets/logins/books-and-leaves.webp";
import graduationCapImg from "../../../Assets/logins/graduation-cap-diploma.webp";
import leafPlantImg from "../../../Assets/logins/leaf-plant.webp";
import studentDoctorImg from "../../../Assets/logins/student-doctor.png";
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
    void listPublicBrands(controller.signal)
      .then((result) => {
        if (controller.signal.aborted) return;
        setBrands(result.brands);
        setSource(result.source);
        setError("");
      })
      .catch((cause: unknown) => {
        if (controller.signal.aborted) return;
        setBrands(getFallbackPublicBrands());
        setSource("fallback");
        setError(cause instanceof Error ? cause.message : "Learning brands could not be loaded.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [retry]);

  return { brands, loading, source, error, refresh: () => setRetry((value) => value + 1) };
}

/* 4-point star SVG sparkle */
function SparkleStar({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5L12 0Z" />
    </svg>
  );
}

/* Background artwork, rolling hill masks, contour wave strokes, dot grid, and floating assets */
function PortalBackgroundDecorations() {
  return (
    <div className="signin-portal__decorations" aria-hidden="true">
      {/* Top Left Wavy Contour Strokes */}
      <svg className="signin-portal__contour-svg is-top-left" viewBox="0 0 520 480" fill="none">
        <path d="M-60 60 C140 40 240 160 260 360" stroke="#22c55e" strokeWidth="1.6" strokeOpacity="0.22" />
        <path d="M-60 120 C170 95 280 220 310 420" stroke="#22c55e" strokeWidth="1.3" strokeOpacity="0.16" />
        <path d="M-60 180 C200 155 320 280 350 480" stroke="#22c55e" strokeWidth="1.1" strokeOpacity="0.11" />
      </svg>

      {/* Top Left 4x5 Dot Matrix */}
      <div className="signin-portal__dot-matrix">
        {Array.from({ length: 20 }).map((_, i) => (
          <span key={i} className="signin-portal__dot" />
        ))}
      </div>

      {/* Top Right Radial Halo behind Graduation Cap */}
      <div className="signin-portal__glow-halo is-top-right" />

      {/* Sparkles Top Right */}
      <SparkleStar className="signin-portal__sparkle is-sparkle-1" />
      <SparkleStar className="signin-portal__sparkle is-sparkle-2" />

      {/* Graduation Cap & Diploma Image */}
      <img
        src={graduationCapImg}
        alt=""
        className="signin-portal__float-asset is-grad-cap"
      />

      {/* Bottom Left Rolling Hill Curves */}
      <svg className="signin-portal__hill-svg is-bottom-left" viewBox="0 0 720 260" preserveAspectRatio="none" fill="none">
        <path d="M-60 260 C120 180 320 190 540 260 Z" fill="rgba(215, 245, 225, 0.45)" />
        <path d="M-60 260 C80 195 250 205 460 260 Z" fill="rgba(235, 251, 241, 0.88)" stroke="rgba(22, 163, 74, 0.22)" strokeWidth="1.5" />
      </svg>

      {/* Books and Leaves Image resting on the bottom-left hill curve */}
      <img
        src={booksAndLeavesImg}
        alt=""
        className="signin-portal__float-asset is-books"
      />

      {/* Bottom Right Rolling Hill Curve */}
      <svg className="signin-portal__hill-svg is-bottom-right" viewBox="0 0 640 240" preserveAspectRatio="none" fill="none">
        <path d="M180 240 C340 165 500 155 680 135 L680 240 Z" fill="rgba(235, 251, 241, 0.88)" stroke="rgba(22, 163, 74, 0.22)" strokeWidth="1.5" />
      </svg>

      {/* Leaf Plant Asset (anchored at bottom-right corner, roughly 50% in view) */}
      <img
        src={leafPlantImg}
        alt=""
        className="signin-portal__float-asset is-leaf-plant"
      />
    </div>
  );
}

function BrandCard({
  brand,
  onSelect,
}: {
  brand: PublicBrand;
  onSelect: (brand: PublicBrand) => void;
}) {
  const code = brand.code.toLowerCase();
  const themeClass = code === "nexus"
    ? "is-brand-nexus"
    : code === "elite"
      ? "is-brand-elite"
      : code === "medway"
        ? "is-brand-medway"
        : "is-brand-default";

  return (
    <button
      type="button"
      className={`signin-portal__brand-card ${themeClass}`}
      onClick={() => onSelect(brand)}
    >
      <svg
        className="signin-portal__card-wave"
        viewBox="0 0 360 90"
        preserveAspectRatio="none"
        fill="none"
        aria-hidden="true"
      >
        <path d="M0,40 C90,12 210,65 360,28 L360,90 L0,90 Z" fill="currentColor" />
      </svg>

      <span className="signin-portal__brand-card-mark">
        {brand.logoUrl ? (
          <img src={brand.logoUrl} alt="" />
        ) : (
          <Layers3 aria-hidden="true" size={32} strokeWidth={2.4} />
        )}
      </span>

      <span className="signin-portal__brand-card-copy">
        <strong>{brand.name}</strong>
        <small>{brand.description || `${brand.name} learning workspace`}</small>
      </span>

      <span className="signin-portal__brand-card-next" aria-hidden="true">
        <ArrowRight size={19} />
      </span>
    </button>
  );
}

function BrandCarousel({
  brands,
  loading,
  onSelect,
  onRetry,
}: {
  brands: PublicBrand[];
  loading: boolean;
  onSelect: (brand: PublicBrand) => void;
  onRetry: () => void;
}) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [visibleCount, setVisibleCount] = useState(() => {
    if (typeof window === "undefined") return 3;
    if (window.innerWidth <= 600) return 1;
    if (window.innerWidth <= 1023) return 2;
    return 3;
  });
  const [startIndex, setStartIndex] = useState(0);
  const isCarousel = brands.length > 3;

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!isCarousel || !viewport) return;

    const updateVisibleCount = () => {
      const firstCard = viewport.querySelector<HTMLButtonElement>(".signin-portal__brand-card");
      const track = firstCard?.parentElement;
      if (!firstCard || !track) return;

      const gap = Number.parseFloat(window.getComputedStyle(track).columnGap) || 0;
      const cardWidth = firstCard.getBoundingClientRect().width;
      if (cardWidth <= 0) return;

      const count = Math.max(1, Math.floor((viewport.clientWidth + gap + 1) / (cardWidth + gap)));
      setVisibleCount(count);
    };

    updateVisibleCount();
    const observer = new ResizeObserver(updateVisibleCount);
    observer.observe(viewport);
    return () => observer.disconnect();
  }, [brands.length, isCarousel]);

  const maxStart = Math.max(0, brands.length - visibleCount);
  const pageStarts = Array.from(
    { length: Math.ceil(brands.length / visibleCount) },
    (_, page) => Math.min(page * visibleCount, maxStart),
  ).filter((start, index, all) => index === 0 || start !== all[index - 1]);
  const currentPage = pageStarts.reduce(
    (page, start, index) => (start <= startIndex ? index : page),
    0,
  );
  const indicatorStart = Math.max(0, Math.min(currentPage - 3, pageStarts.length - 7));
  const visiblePages = pageStarts.slice(indicatorStart, indicatorStart + 7);

  const scrollToIndex = (index: number) => {
    const viewport = viewportRef.current;
    const card = viewport?.querySelectorAll<HTMLButtonElement>(".signin-portal__brand-card")[index];
    if (!viewport || !card) return;

    const left = card.getBoundingClientRect().left - viewport.getBoundingClientRect().left + viewport.scrollLeft;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    viewport.scrollTo({ left, behavior: reducedMotion ? "auto" : "smooth" });
    setStartIndex(index);
  };

  useEffect(() => {
    setStartIndex((current) => Math.min(current, maxStart));
  }, [maxStart]);

  const handleScroll = () => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const viewportLeft = viewport.getBoundingClientRect().left;
    const cards = Array.from(viewport.querySelectorAll<HTMLButtonElement>(".signin-portal__brand-card"));
    let nearestIndex = 0;
    let nearestDistance = Number.POSITIVE_INFINITY;

    cards.forEach((card, index) => {
      const distance = Math.abs(card.getBoundingClientRect().left - viewportLeft);
      if (distance < nearestDistance) {
        nearestIndex = index;
        nearestDistance = distance;
      }
    });

    const nextIndex = Math.min(nearestIndex, maxStart);
    setStartIndex((current) => (current === nextIndex ? current : nextIndex));
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    const nextPage = Math.max(0, Math.min(pageStarts.length - 1, currentPage + (event.key === "ArrowRight" ? 1 : -1)));
    scrollToIndex(pageStarts[nextPage] ?? 0);
  };

  if (!brands.length) {
    return (
      <div className="signin-portal__empty-brands" role="status" aria-busy={loading}>
        <strong>No learning brands are available right now.</strong>
        <span>Try again in a moment to check the public brand catalog.</span>
        <button type="button" onClick={onRetry}><RefreshCw size={14} /> Retry</button>
      </div>
    );
  }

  if (!isCarousel) {
    return (
      <div
        className={`signin-portal__brand-grid ${brands.length === 3 ? "has-three-brands" : ""}`}
        role="group"
        aria-label="Available learning brands"
        aria-busy={loading}
      >
        {brands.map((brand) => <BrandCard key={brand.code} brand={brand} onSelect={onSelect} />)}
      </div>
    );
  }

  return (
    <>
      <div
        className="signin-portal__brand-carousel"
        role="group"
        aria-label="Available learning brands"
        aria-roledescription="carousel"
        aria-busy={loading}
      >
        <button
          type="button"
          className="signin-portal__carousel-arrow is-previous"
          aria-label="Previous brands"
          disabled={currentPage === 0}
          onClick={() => scrollToIndex(pageStarts[currentPage - 1] ?? 0)}
        >
          <ChevronLeft aria-hidden="true" size={24} />
        </button>

        <div
          ref={viewportRef}
          className="signin-portal__carousel-viewport"
          role="region"
          aria-label="Brand carousel items"
          tabIndex={0}
          onScroll={handleScroll}
          onKeyDown={handleKeyDown}
        >
          <div className="signin-portal__carousel-track">
            {brands.map((brand) => <BrandCard key={brand.code} brand={brand} onSelect={onSelect} />)}
          </div>
        </div>

        <button
          type="button"
          className="signin-portal__carousel-arrow is-next"
          aria-label="Next brands"
          disabled={currentPage === pageStarts.length - 1}
          onClick={() => scrollToIndex(pageStarts[currentPage + 1] ?? maxStart)}
        >
          <ChevronRight aria-hidden="true" size={24} />
        </button>
      </div>

      <div className="signin-portal__carousel-dots" role="group" aria-label="Brand pages">
        {visiblePages.map((pageStart) => {
          const pageIndex = pageStarts.indexOf(pageStart);
          const firstBrand = pageStart + 1;
          const lastBrand = Math.min(brands.length, pageStart + visibleCount);
          return (
            <button
              type="button"
              key={pageStart}
              className={pageIndex === currentPage ? "is-active" : ""}
              aria-label={`Show brands ${firstBrand} through ${lastBrand} of ${brands.length}`}
              aria-current={pageIndex === currentPage ? "page" : undefined}
              onClick={() => scrollToIndex(pageStart)}
            />
          );
        })}
      </div>
    </>
  );
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
    return (
      <main className="signin-portal" aria-busy="true">
        <PortalBackgroundDecorations />
        <div className="signin-portal__loading">
          <span className="signin-portal__brand-mark">
            <BookOpen aria-hidden="true" />
          </span>
          <strong>Loading your sign-in options</strong>
        </div>
      </main>
    );
  }

  if (brandCode && !brand) {
    return (
      <main className="signin-portal">
        <PortalBackgroundDecorations />
        <section className="signin-portal__message">
          <span className="signin-portal__brand-mark">
            <BookOpen aria-hidden="true" />
          </span>
          <h1>Brand unavailable</h1>
          <p>This learning brand is not currently available for sign-in.</p>
          {catalog.error && <small role="status">{catalog.error}</small>}
          <button type="button" className="signin-portal__primary" onClick={() => navigateWithState("/auth/sign-in")}>
            <ArrowLeft size={17} /> Choose another brand
          </button>
          {catalog.error && (
            <button type="button" className="signin-portal__retry" onClick={catalog.refresh}>
              <RefreshCw size={15} /> Retry loading brands
            </button>
          )}
        </section>
      </main>
    );
  }

  if (brand && !validRole) {
    const roles: Array<{ id: PortalRole; title: string; detail: string; icon: typeof GraduationCap }> = [
      { id: "student", title: "Student", detail: "Open your classes, assignments, and learning progress.", icon: GraduationCap },
      { id: "instructor", title: "Instructor", detail: "Manage courses, student work, and teaching materials.", icon: UserRound },
      { id: "admin", title: "Admin", detail: "Manage your learning organization and review activity.", icon: ShieldCheck },
    ];
    return (
      <main className="signin-portal signin-portal--roles">
        <PortalBackgroundDecorations />
        <header className="signin-portal__topbar">
          <a className="signin-portal__wordmark" href="/auth/sign-in">
            <span className="signin-portal__brand-mark">
              <Sprout aria-hidden="true" />
            </span>
            <strong>{brand.name}</strong>
          </a>
          <span className="signin-portal__secure">
            <span className="signin-portal__secure-badge">
              <Check size={12} strokeWidth={3} />
            </span>
            <span>Secure sign in</span>
          </span>
        </header>
        <section className="signin-portal__role-content">
          <aside className="signin-portal__role-intro">
            <button type="button" className="signin-portal__back" onClick={() => navigateWithState("/auth/sign-in")}>
              <ArrowLeft size={16} /> Change brand
            </button>
            <span className="signin-portal__eyebrow-pill">YOUR NEXT CHAPTER STARTS HERE</span>
            <h1>Welcome to <span>{brand.name}</span></h1>
            <p>Your personalized learning journey starts here.</p>
            <ul className="signin-portal__benefits">
              <li><GraduationCap aria-hidden="true" /><span>Learn at your own pace</span></li>
              <li><Layers3 aria-hidden="true" /><span>Track your progress</span></li>
              <li><ShieldCheck aria-hidden="true" /><span>Achieve your goals</span></li>
            </ul>
          </aside>
          <div className="signin-portal__role-grid signin-portal__role-grid--showcase">
            {roles.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  type="button"
                  className={`signin-portal__role-card is-${item.id}`}
                  key={item.id}
                  onClick={() => navigateWithState(`/auth/sign-in/${encodeURIComponent(brand.code)}/${item.id}`)}
                >
                  {item.id === "student" ? (
                    <>
                      <span className="signin-portal__popular-badge"><span aria-hidden="true">★</span> Most popular</span>
                      <span className="signin-portal__student-art" aria-hidden="true">
                        <img src={studentDoctorImg} alt="" />
                      </span>
                      <span className="signin-portal__student-info">
                        <span className="signin-portal__role-icon is-student"><Icon aria-hidden="true" /></span>
                        <span className="signin-portal__role-copy">
                          <strong>{item.title}</strong>
                          <small>Access your courses, track progress and achieve your goals.</small>
                        </span>
                      </span>
                      <span className="signin-portal__role-action">Continue as Student <ArrowRight size={20} /></span>
                    </>
                  ) : (
                    <>
                      <span className={`signin-portal__role-icon is-${item.id}`}><Icon aria-hidden="true" /></span>
                      <span className="signin-portal__role-copy">
                        <strong>{item.title}</strong>
                        <small>{item.id === "instructor" ? "Create courses, manage your classes and inspire students." : "Manage the platform, users and system settings."}</small>
                      </span>
                      <span className="signin-portal__role-action is-outline">Continue as {item.title} <ArrowRight size={18} /></span>
                    </>
                  )}
                </button>
              );
            })}
          </div>
          <div className="signin-portal__footnote signin-portal__footnote--roles">
            <Info size={15} className="signin-portal__footnote-icon" aria-hidden="true" />
            <span>Your account is secure and protected</span>
          </div>
        </section>
      </main>
    );
  }

  // Brand Selector Main Screen (matches reference UI)
  return (
    <main className="signin-portal">
      <PortalBackgroundDecorations />

      {/* Top Navigation Bar */}
      <header className="signin-portal__topbar">
        <a className="signin-portal__wordmark" href="/auth/sign-in" aria-label="GreenLearn Learning workspace">
          <span className="signin-portal__brand-mark">
            <BookOpen aria-hidden="true" />
          </span>
          <span>
            <strong>GreenLearn</strong>
            <small>Learning workspace</small>
          </span>
        </a>
        <span className="signin-portal__secure">
          <span className="signin-portal__secure-badge">
            <Check size={12} strokeWidth={3} />
          </span>
          <span>Secure sign in</span>
        </span>
      </header>

      {/* Hero & Brand Carousel Section */}
      <section className="signin-portal__content signin-portal__content--brands">
        {/* Welcome Back Pill */}
        <div className="signin-portal__eyebrow-pill">
          <span className="signin-portal__star-icon">★</span>
          <span>Welcome Back</span>
        </div>

        {/* Main Title */}
        <h1 className="signin-portal__hero-title">
          Choose your<br />
          <span className="signin-portal__hero-accent">learning</span> brand
        </h1>

        {/* Subtitle */}
        <p className="signin-portal__intro">
          Select your organization to continue to the right sign-in options.
        </p>

        {catalog.error && (
          <div className="signin-portal__catalog-notice" role="status">
            <span>{catalog.error} Showing the currently configured brands.</span>
            <button type="button" onClick={catalog.refresh}>
              <RefreshCw size={14} /> Retry
            </button>
          </div>
        )}

        <BrandCarousel
          brands={catalog.brands}
          loading={catalog.loading}
          onSelect={(item) => navigateWithState(`/auth/sign-in/${encodeURIComponent(item.code)}`)}
          onRetry={catalog.refresh}
        />

        {catalog.loading && <p className="signin-portal__loading-note" role="status">Checking available brands…</p>}

        {/* Footnote with subtle hairline dividers */}
        {catalog.source === "fallback" && !catalog.error && (
          <div className="signin-portal__footnote">
            <Info size={15} className="signin-portal__footnote-icon" aria-hidden="true" />
            <span>Brand options are ready to sync with the public brand catalog.</span>
          </div>
        )}
      </section>
    </main>
  );
}
