import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Home, BookOpen, Compass, HelpCircle, ArrowLeft } from "lucide-react";
import { QuickActionTile } from "../shared/QuickActionTile";
import { BottomNav } from "../BottomNav";
import type { TabId } from "../ScreenStack/ScreenStackContext";

/* ── Inline SVG illustration — lost compass in the GreenLearn palette ─── */
const LostCompassIllustration: React.FC = () => (
  <svg
    viewBox="0 0 180 180"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    className="w-full h-full"
  >
    {/* Soft glow bg */}
    <circle cx="90" cy="90" r="72" fill="#d1fae5" opacity="0.5" />
    {/* Outer ring */}
    <circle cx="90" cy="90" r="56" stroke="#6ee7b7" strokeWidth="3" fill="white" />
    {/* Inner tick marks */}
    {[0, 45, 90, 135, 180, 225, 270, 315].map((deg, i) => {
      const rad = (deg * Math.PI) / 180;
      const x1 = 90 + 48 * Math.cos(rad);
      const y1 = 90 + 48 * Math.sin(rad);
      const x2 = 90 + 54 * Math.cos(rad);
      const y2 = 90 + 54 * Math.sin(rad);
      return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#a7f3d0" strokeWidth="2" strokeLinecap="round" />;
    })}
    {/* N/S/E/W labels */}
    <text x="90" y="46" textAnchor="middle" fontSize="10" fontWeight="700" fill="#059669">N</text>
    <text x="90" y="140" textAnchor="middle" fontSize="10" fontWeight="700" fill="#6ee7b7">S</text>
    <text x="136" y="93" textAnchor="middle" fontSize="10" fontWeight="700" fill="#6ee7b7">E</text>
    <text x="44" y="93" textAnchor="middle" fontSize="10" fontWeight="700" fill="#6ee7b7">W</text>
    {/* Compass needle — pointing diagonally (lost!) */}
    <line x1="90" y1="90" x2="115" y2="62" stroke="#059669" strokeWidth="4" strokeLinecap="round" />
    <polygon points="115,62 108,66 110,73" fill="#059669" />
    <line x1="90" y1="90" x2="65" y2="118" stroke="#fca5a5" strokeWidth="4" strokeLinecap="round" />
    <polygon points="65,118 72,114 70,107" fill="#fca5a5" />
    {/* Center dot */}
    <circle cx="90" cy="90" r="5" fill="#065f46" />
    {/* Question mark cloud */}
    <circle cx="138" cy="50" r="16" fill="#ecfdf5" stroke="#6ee7b7" strokeWidth="2" />
    <text x="138" y="56" textAnchor="middle" fontSize="18" fontWeight="900" fill="#059669">?</text>
    {/* Small leaf accent */}
    <ellipse cx="54" cy="130" rx="10" ry="6" fill="#a7f3d0" transform="rotate(-30 54 130)" />
    <ellipse cx="126" cy="128" rx="8" ry="5" fill="#6ee7b7" transform="rotate(20 126 128)" />
  </svg>
);

export const MobileNotFoundScreen: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabId>("home");

  const handleTabSelect = (tab: TabId) => {
    setActiveTab(tab);
    const routes: Record<TabId, string> = {
      home: "/",
      "my-courses": "/my-courses",
      explore: "/explore",
      calendar: "/calendar",
      settings: "/settings",
    };
    navigate(routes[tab]);
  };

  return (
    <div className=" h-dvh flex flex-col bg-slate-50 overflow-hidden">
      {/* Scrollable content area */}
      <div className="flex-1 overflow-y-auto pb-20">
        <div className="flex flex-col items-center justify-center min-h-full px-6 py-10 text-center">
          {/* Illustration */}
          <div className="w-44 h-44 mb-6">
            <LostCompassIllustration />
          </div>

          {/* 404 badge */}
          <span className="inline-block px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-[11px] font-extrabold tracking-widest uppercase mb-3">
            404
          </span>

          {/* Headline */}
          <h1 className="text-xl font-black text-slate-900 tracking-tight leading-snug max-w-xs">
            Oops — this page took a wrong turn
          </h1>

          {/* Subtext */}
          <p className="mt-2.5 text-sm text-slate-500 font-medium leading-relaxed max-w-xs">
            The page you're looking for doesn't exist or may have moved. No worries — your learning journey continues below.
          </p>

          {/* Primary CTA */}
          <button
            type="button"
            onClick={() => navigate("/")}
            className="mt-7 inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.97] text-white text-sm font-bold shadow-md transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 stroke-[2.2]" />
            Back to Dashboard
          </button>

          {/* Quick nav grid 2×2 */}
          <div className="mt-8 w-full max-w-xs">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">
              Quick navigation
            </p>
            <div className="grid grid-cols-2 gap-2.5">
              <QuickActionTile
                icon={<Home className="w-5 h-5" strokeWidth={2} />}
                title="Home"
                subtitle="Back to dashboard"
                onPress={() => navigate("/")}
              />
              <QuickActionTile
                icon={<BookOpen className="w-5 h-5" strokeWidth={2} />}
                title="My Courses"
                subtitle="Your enrolled courses"
                onPress={() => navigate("/my-courses")}
              />
              <QuickActionTile
                icon={<Compass className="w-5 h-5" strokeWidth={2} />}
                title="Explore"
                subtitle="Discover new paths"
                onPress={() => navigate("/explore")}
              />
              <QuickActionTile
                icon={<HelpCircle className="w-5 h-5" strokeWidth={2} />}
                title="Help Center"
                subtitle="Get support"
                onPress={() => navigate("/help")}
              />
            </div>
          </div>
        </div>
      </div>

      {/* BottomNav stays visible */}
      <BottomNav activeTab={activeTab} onTabSelect={handleTabSelect} />
    </div>
  );
};

export default MobileNotFoundScreen;
