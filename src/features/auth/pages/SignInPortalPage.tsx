import { useEffect, useRef, useState } from "react";
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
  UserRound,
} from "lucide-react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { getFallbackPublicBrands, listPublicBrands, type PublicBrand } from "../api/publicBrandCatalogApi";
import { SignInPage } from "./SignInPage";
import booksAndLeavesImg from "../../../assets/logins/books-and-leaves.webp";
import graduationCapImg from "../../../assets/logins/graduation-cap-diploma.webp";
import leafPlantImg from "../../../assets/logins/leaf-plant.webp";
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

export function SignInPortalPage() {
  const { brandCode, role: roleParam } = useParams<{ brandCode?: string; role?: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const catalog = usePublicBrands();

  // Initial slide: default to index 1 (Elite, the featured/popular center brand)
  const [brandSlide, setBrandSlide] = useState(1);
  const carouselTrackRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);

  const brandCount = catalog.brands.length || 1;
  const normalizedBrandSlide = ((brandSlide % brandCount) + brandCount) % brandCount;
  const brand = catalog.brands.find((item) => item.code.toLowerCase() === brandCode?.toLowerCase());
  const role = roleParam?.toLowerCase() as PortalRole | undefined;
  const validRole = role === "student" || role === "instructor" || role === "admin";
  const routeState = location.state;
  const navigateWithState = (path: string) => navigate(path, { state: routeState });

  const goToNext = () => setBrandSlide((prev) => (prev + 1) % brandCount);
  const goToPrev = () => setBrandSlide((prev) => (prev - 1 + brandCount) % brandCount);

  // Gesture handling for swipe navigation:
  // - Horizontal swipes when cards are side-by-side (desktop / tablet)
  // - Vertical swipes (top & bottom) when cards are stacked on top of each other (mobile)
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY, time: Date.now() };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;
    touchStartRef.current = null;

    const isStackedVertical = window.innerWidth < 900;

    if (isStackedVertical) {
      // Mobile / vertical stacked view:
      // Vertical swipe takes priority
      if (Math.abs(deltaY) > 35 && Math.abs(deltaY) > Math.abs(deltaX)) {
        if (deltaY < 0) {
          goToNext(); // Swiped up (bottom swipe) -> Next
        } else {
          goToPrev(); // Swiped down (top swipe) -> Prev
        }
      } else if (Math.abs(deltaX) > 35) {
        // Horizontal swipe also supported on mobile
        if (deltaX < 0) goToNext();
        else goToPrev();
      }
    } else {
      // Desktop / horizontal side-by-side view:
      // Horizontal swipe takes priority
      if (Math.abs(deltaX) > 35) {
        if (deltaX < 0) {
          goToNext(); // Swiped left -> Next
        } else {
          goToPrev(); // Swiped right -> Prev
        }
      }
    }
  };

  // Keyboard navigation support (Arrow keys)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        goToPrev();
      } else if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        goToNext();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [brandCount]);

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
      <main className="signin-portal">
        <PortalBackgroundDecorations />
        <header className="signin-portal__topbar">
          <a className="signin-portal__wordmark" href="/auth/sign-in">
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
        <section className="signin-portal__content">
          <button type="button" className="signin-portal__back" onClick={() => navigateWithState("/auth/sign-in")}>
            <ArrowLeft size={16} /> Change brand
          </button>
          <span className="signin-portal__eyebrow-pill">SELECT YOUR PORTAL</span>
          <div className="signin-portal__title-row">
            <div>
              <h1>Welcome to {brand.name}</h1>
              <p>Choose the workspace that matches your account.</p>
            </div>
            <span className="signin-portal__selected-brand">
              <Layers3 size={15} /> {brand.name}
            </span>
          </div>
          <div className="signin-portal__role-grid">
            {roles.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  type="button"
                  className="signin-portal__role-card"
                  key={item.id}
                  onClick={() => navigateWithState(`/auth/sign-in/${encodeURIComponent(brand.code)}/${item.id}`)}
                >
                  <span className={`signin-portal__role-icon is-${item.id}`}>
                    <Icon aria-hidden="true" />
                  </span>
                  <span className="signin-portal__role-copy">
                    <strong>{item.title}</strong>
                    <small>{item.detail}</small>
                  </span>
                  <ArrowRight className="signin-portal__role-arrow" size={18} />
                </button>
              );
            })}
          </div>
          <div className="signin-portal__footnote">
            <Info size={15} className="signin-portal__footnote-icon" aria-hidden="true" />
            <span>Your account access is verified securely for the selected brand.</span>
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

        {/* Carousel Container with Left/Right Arrows & Touch Gestures */}
        <div
          className="signin-portal__brand-carousel"
          aria-label="Available learning brands"
          aria-busy={catalog.loading}
          ref={carouselTrackRef}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* Left Arrow Button */}
          <button
            type="button"
            className="signin-portal__carousel-arrow is-previous"
            aria-label="Previous brand"
            onClick={goToPrev}
          >
            <ChevronLeft aria-hidden="true" size={24} />
          </button>

          {/* Cards Grid / Track */}
          <div className="signin-portal__brand-grid">
            {catalog.brands.map((item, index) => {
              const codeLower = item.code.toLowerCase();
              const isElite = codeLower === "elite";
              const isNexus = codeLower === "nexus";

              const brandThemeClass = isElite
                ? "is-brand-elite"
                : isNexus
                ? "is-brand-nexus"
                : "is-brand-medway";

              const isCurrentActive = index === normalizedBrandSlide;

              return (
                <button
                  type="button"
                  key={item.code}
                  className={`signin-portal__brand-card ${brandThemeClass} ${isCurrentActive ? "is-active-slide" : ""}`}
                  onClick={() => navigateWithState(`/auth/sign-in/${encodeURIComponent(item.code)}`)}
                >
                  {/* Popular Badge for Elite */}
                  {isElite && (
                    <span className="signin-portal__popular-badge">
                      <span className="signin-portal__popular-star">★</span> Popular
                    </span>
                  )}

                  {/* Organic Wave Mask inside Card Bottom */}
                  <svg
                    className="signin-portal__card-wave"
                    viewBox="0 0 360 90"
                    preserveAspectRatio="none"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M0,40 C90,12 210,65 360,28 L360,90 L0,90 Z"
                      fill="currentColor"
                    />
                  </svg>

                  {/* Left Brand Mark */}
                  <span className="signin-portal__brand-card-mark">
                    {item.logoUrl ? (
                      <img src={item.logoUrl} alt="" />
                    ) : (
                      <Layers3 aria-hidden="true" size={32} strokeWidth={2.4} />
                    )}
                  </span>

                  {/* Middle Copy */}
                  <span className="signin-portal__brand-card-copy">
                    <strong>{item.name}</strong>
                    <small>{item.description || `${item.name} learning workspace`}</small>
                  </span>

                  {/* Right Circle Arrow Button */}
                  <span className="signin-portal__brand-card-next">
                    <ArrowRight aria-hidden="true" size={19} />
                  </span>
                </button>
              );
            })}
          </div>

          {/* Right Arrow Button */}
          <button
            type="button"
            className="signin-portal__carousel-arrow is-next"
            aria-label="Next brand"
            onClick={goToNext}
          >
            <ChevronRight aria-hidden="true" size={24} />
          </button>
        </div>

        {/* Carousel Pagination Dots */}
        {catalog.brands.length > 1 && (
          <div className="signin-portal__carousel-dots" aria-label="Brand carousel position">
            {catalog.brands.map((item, index) => (
              <button
                type="button"
                key={item.code}
                className={index === normalizedBrandSlide ? "is-active" : ""}
                aria-label={`Show ${item.name}`}
                aria-current={index === normalizedBrandSlide ? "true" : undefined}
                onClick={() => setBrandSlide(index)}
              />
            ))}
          </div>
        )}

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
