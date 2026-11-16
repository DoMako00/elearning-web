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

  const brand = catalog.brands.find((item) => item.code.toLowerCase() === brandCode?.toLowerCase());
  const role = roleParam?.toLowerCase() as PortalRole | undefined;
  const validRole = role === "student" || role === "instructor" || role === "admin";
  const routeState = location.state;
  const navigateWithState = (path: string) => navigate(path, { state: routeState });

  // Responsive layout state (mobile stacked vs desktop horizontal)
  const [isMobile, setIsMobile] = useState(() => typeof window !== "undefined" && window.innerWidth < 900);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 900);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const N = catalog.brands.length || 1;
  // Extended brands list repeated 5 times for seamless, infinite looping
  const extendedBrands = Array.from({ length: 5 }, () => catalog.brands).flat();

  // Slide offset index in extendedBrands
  // Desktop: slideOffset = 3 places items [3: Medway, 4: Elite (center), 5: Nexus] in view!
  // Mobile: slideOffset = 4 places Elite (featured brand) in view!
  const [slideOffset, setSlideOffset] = useState(() => (typeof window !== "undefined" && window.innerWidth < 900 ? 4 : 3));
  const [enableTransition, setEnableTransition] = useState(true);

  // Dragging / swiping gesture state
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const hasMovedRef = useRef(false);

  // Active brand index in catalog.brands (0..N-1)
  // On desktop, the active center brand is at (slideOffset + 1)
  // On mobile, the active visible brand is at slideOffset
  const activeBrandIndex = ((slideOffset + (isMobile ? 0 : 1)) % N + N) % N;

  const goToNext = () => {
    setEnableTransition(true);
    setSlideOffset((prev) => prev + 1);
  };

  const goToPrev = () => {
    setEnableTransition(true);
    setSlideOffset((prev) => prev - 1);
  };

  // Seamless wrap handler when sliding past boundaries
  const handleTransitionEnd = () => {
    if (slideOffset >= 3 * N) {
      setEnableTransition(false);
      setSlideOffset((prev) => prev - N);
    } else if (slideOffset < N) {
      setEnableTransition(false);
      setSlideOffset((prev) => prev + N);
    }
  };

  // Re-enable CSS transitions after silent teleport wrap
  useEffect(() => {
    if (!enableTransition) {
      const timer = setTimeout(() => {
        setEnableTransition(true);
      }, 35);
      return () => clearTimeout(timer);
    }
  }, [enableTransition]);

  // Dot click navigation: takes the shortest circular path
  const handleDotClick = (targetIndex: number) => {
    if (targetIndex === activeBrandIndex) return;
    let diff = targetIndex - activeBrandIndex;
    if (diff > N / 2) diff -= N;
    if (diff < -N / 2) diff += N;
    setEnableTransition(true);
    setSlideOffset((prev) => prev + diff);
  };

  // Gesture handling:
  // - Horizontal swipes/drag when cards are next to each other (desktop)
  // - Vertical (top & bottom) swipes when cards are stacked on top of each other (mobile)
  const onStart = (clientX: number, clientY: number) => {
    dragStartRef.current = { x: clientX, y: clientY };
    setIsDragging(true);
    setDragOffset(0);
    hasMovedRef.current = false;
  };

  const onMove = (clientX: number, clientY: number) => {
    if (!isDragging || !dragStartRef.current) return;
    const dx = clientX - dragStartRef.current.x;
    const dy = clientY - dragStartRef.current.y;
    if (Math.abs(dx) > 6 || Math.abs(dy) > 6) {
      hasMovedRef.current = true;
    }

    if (isMobile) {
      // In vertical layout, vertical movement takes priority
      if (Math.abs(dy) > Math.abs(dx)) {
        setDragOffset(dy);
      } else {
        setDragOffset(dx);
      }
    } else {
      // In horizontal layout, horizontal movement takes priority
      setDragOffset(dx);
    }
  };

  const onEnd = (clientX: number, clientY: number) => {
    if (!isDragging || !dragStartRef.current) return;
    const dx = clientX - dragStartRef.current.x;
    const dy = clientY - dragStartRef.current.y;
    setIsDragging(false);
    setDragOffset(0);
    dragStartRef.current = null;

    if (isMobile) {
      // Mobile: vertical swipe (top/bottom) or horizontal swipe
      if (Math.abs(dy) > 35 && Math.abs(dy) > Math.abs(dx)) {
        if (dy < 0) goToNext(); // swiped up (bottom swipe) -> next
        else goToPrev(); // swiped down (top swipe) -> prev
      } else if (Math.abs(dx) > 35) {
        if (dx < 0) goToNext();
        else goToPrev();
      }
    } else {
      // Desktop: horizontal swipe (left/right)
      if (Math.abs(dx) > 35) {
        if (dx < 0) goToNext();
        else goToPrev();
      }
    }
  };

  // Keyboard navigation support (Arrow keys)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || (isMobile && e.key === "ArrowUp")) {
        goToPrev();
      } else if (e.key === "ArrowRight" || (isMobile && e.key === "ArrowDown")) {
        goToNext();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isMobile, N]);

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

  // Dynamic sliding track transform style
  const trackStyle: React.CSSProperties = isMobile
    ? {
        transform: `translateY(calc(-1 * ${slideOffset} * (168px + 14px) + ${dragOffset}px))`,
        transition: enableTransition && !isDragging ? "transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)" : "none",
      }
    : {
        transform: `translateX(calc(-1 * ${slideOffset} * (100% + 24px) / 3 + ${dragOffset}px))`,
        transition: enableTransition && !isDragging ? "transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)" : "none",
      };

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

        {/* Carousel Container with Left/Right Arrows & Touch/Mouse Drag Gestures */}
        <div
          className="signin-portal__brand-carousel"
          aria-label="Available learning brands"
          aria-busy={catalog.loading}
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

          {/* Carousel Viewport (Clips non-visible cards and handles swipes) */}
          <div
            className="signin-portal__carousel-viewport"
            onTouchStart={(e) => onStart(e.touches[0].clientX, e.touches[0].clientY)}
            onTouchMove={(e) => onMove(e.touches[0].clientX, e.touches[0].clientY)}
            onTouchEnd={(e) => onEnd(e.changedTouches[0].clientX, e.changedTouches[0].clientY)}
            onMouseDown={(e) => onStart(e.clientX, e.clientY)}
            onMouseMove={(e) => onMove(e.clientX, e.clientY)}
            onMouseUp={(e) => onEnd(e.clientX, e.clientY)}
            onMouseLeave={(e) => onEnd(e.clientX, e.clientY)}
          >
            {/* Sliding Carousel Track */}
            <div
              className={`signin-portal__carousel-track ${enableTransition ? "is-animated" : ""}`}
              style={trackStyle}
              onTransitionEnd={handleTransitionEnd}
            >
              {extendedBrands.map((item, index) => {
                const codeLower = item.code.toLowerCase();
                const isElite = codeLower === "elite";
                const isNexus = codeLower === "nexus";

                const brandThemeClass = isElite
                  ? "is-brand-elite"
                  : isNexus
                  ? "is-brand-nexus"
                  : "is-brand-medway";

                // Active card (the one in the center slot on desktop, or in view on mobile)
                const isCenterCard = index === slideOffset + (isMobile ? 0 : 1);

                return (
                  <button
                    type="button"
                    key={`${item.code}-${index}`}
                    className={`signin-portal__brand-card ${brandThemeClass} ${isCenterCard ? "is-active-slide" : ""}`}
                    onClick={() => {
                      if (hasMovedRef.current) return;
                      navigateWithState(`/auth/sign-in/${encodeURIComponent(item.code)}`);
                    }}
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
                className={index === activeBrandIndex ? "is-active" : ""}
                aria-label={`Show ${item.name}`}
                aria-current={index === activeBrandIndex ? "true" : undefined}
                onClick={() => handleDotClick(index)}
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
