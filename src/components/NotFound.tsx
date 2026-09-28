import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Home,
  BookOpen,
  Compass,
  HelpCircle,
  ArrowLeft,
} from "lucide-react";

/* ── Shared SVG illustration ────────────────────────────────────────── */
const LostCompassIllustration: React.FC = () => (
  <svg
    viewBox="0 0 220 220"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    className="w-full h-full"
  >
    {/* Glow */}
    <circle cx="110" cy="110" r="90" fill="#d1fae5" opacity="0.45" />
    {/* Outer ring */}
    <circle cx="110" cy="110" r="72" stroke="#6ee7b7" strokeWidth="3.5" fill="white" />
    {/* Tick marks */}
    {[0, 45, 90, 135, 180, 225, 270, 315].map((deg, i) => {
      const rad = (deg * Math.PI) / 180;
      const x1 = 110 + 62 * Math.cos(rad);
      const y1 = 110 + 62 * Math.sin(rad);
      const x2 = 110 + 70 * Math.cos(rad);
      const y2 = 110 + 70 * Math.sin(rad);
      return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#a7f3d0" strokeWidth="2.5" strokeLinecap="round" />;
    })}
    {/* Cardinal labels */}
    <text x="110" y="50" textAnchor="middle" fontSize="13" fontWeight="800" fill="#059669">N</text>
    <text x="110" y="176" textAnchor="middle" fontSize="13" fontWeight="800" fill="#6ee7b7">S</text>
    <text x="172" y="115" textAnchor="middle" fontSize="13" fontWeight="800" fill="#6ee7b7">E</text>
    <text x="48" y="115" textAnchor="middle" fontSize="13" fontWeight="800" fill="#6ee7b7">W</text>
    {/* Compass needle (pointing diagonally — lost!) */}
    <line x1="110" y1="110" x2="142" y2="74" stroke="#059669" strokeWidth="5" strokeLinecap="round" />
    <polygon points="142,74 133,80 136,89" fill="#059669" />
    <line x1="110" y1="110" x2="78" y2="146" stroke="#fca5a5" strokeWidth="5" strokeLinecap="round" />
    <polygon points="78,146 87,140 84,131" fill="#fca5a5" />
    {/* Center hub */}
    <circle cx="110" cy="110" r="7" fill="#065f46" />
    <circle cx="110" cy="110" r="3" fill="white" />
    {/* Question mark bubble */}
    <circle cx="164" cy="58" r="20" fill="#ecfdf5" stroke="#6ee7b7" strokeWidth="2.5" />
    <text x="164" y="66" textAnchor="middle" fontSize="22" fontWeight="900" fill="#059669">?</text>
    {/* Leaf accents */}
    <ellipse cx="62" cy="158" rx="13" ry="7" fill="#a7f3d0" transform="rotate(-30 62 158)" />
    <ellipse cx="155" cy="160" rx="10" ry="6" fill="#6ee7b7" transform="rotate(20 155 160)" />
    <ellipse cx="46" cy="74" rx="8" ry="5" fill="#d1fae5" transform="rotate(15 46 74)" />
  </svg>
);

/* ── Desktop quick-nav card ─────────────────────────────────────────── */
interface NavCardProps {
  icon: React.ReactNode;
  label: string;
  description: string;
  onClick: () => void;
}
const NavCard: React.FC<NavCardProps> = ({ icon, label, description, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="flex flex-col items-center gap-2 p-5 bg-white rounded-2xl border border-slate-100 shadow-xs hover:border-emerald-200 hover:shadow-md active:scale-[0.98] transition-all cursor-pointer text-center group"
  >
    <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
      {icon}
    </div>
    <span className="text-sm font-bold text-slate-800">{label}</span>
    <span className="text-xs text-slate-400 leading-snug">{description}</span>
  </button>
);

/* ── Desktop / iPad NotFound ────────────────────────────────────────── */
export const NotFound: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-emerald-50/30 to-slate-50 flex items-center justify-center p-6">
      <div className="flex flex-col items-center text-center max-w-2xl w-full">
        {/* Floating illustration */}
        <motion.div
          className="w-56 h-56 mb-8"
          animate={{ y: [0, -12, 0] }}
          transition={{
            duration: 3.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <LostCompassIllustration />
        </motion.div>

        {/* Badge */}
        <span className="inline-block px-4 py-1.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-extrabold tracking-widest uppercase mb-4">
          404 · Page Not Found
        </span>

        {/* Headline */}
        <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight leading-tight">
          Oops — this page took a wrong turn
        </h1>

        {/* Subtext */}
        <p className="mt-4 text-base text-slate-500 font-medium leading-relaxed max-w-md">
          The page you're looking for doesn't exist or may have moved. Don't worry — your learning journey is still right on track.
        </p>

        {/* Primary CTA */}
        <button
          type="button"
          onClick={() => navigate("/")}
          className="mt-8 inline-flex items-center gap-2.5 px-7 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.97] text-white text-sm font-bold shadow-lg shadow-emerald-200 transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 stroke-[2.2]" />
          Back to Dashboard
        </button>

        {/* Quick nav grid */}
        <div className="mt-12 w-full">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-5">
            Quick navigation
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <NavCard
              icon={<Home className="w-6 h-6" strokeWidth={2} />}
              label="Home"
              description="Back to dashboard"
              onClick={() => navigate("/")}
            />
            <NavCard
              icon={<BookOpen className="w-6 h-6" strokeWidth={2} />}
              label="My Courses"
              description="Your enrolled courses"
              onClick={() => navigate("/my-courses")}
            />
            <NavCard
              icon={<Compass className="w-6 h-6" strokeWidth={2} />}
              label="Explore"
              description="Discover new paths"
              onClick={() => navigate("/explore")}
            />
            <NavCard
              icon={<HelpCircle className="w-6 h-6" strokeWidth={2} />}
              label="Help Center"
              description="Get support"
              onClick={() => navigate("/help")}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
