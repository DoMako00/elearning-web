export function AssignmentsEmptyIllustration() {
  return (
    <svg
      viewBox="0 0 240 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="gl-assignments-empty-ill"
    >
      <defs>
        {/* Soft background glow */}
        <radialGradient
          id="gl-ill-glow"
          cx="0"
          cy="0"
          r="1"
          gradientUnits="userSpaceOnUse"
          gradientTransform="translate(120 100) rotate(90) scale(95 110)"
        >
          <stop stopColor="#20a862" stopOpacity="0.12" />
          <stop offset="0.65" stopColor="#34d399" stopOpacity="0.05" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>

        {/* Board subtle gradient */}
        <linearGradient id="gl-ill-board" x1="60" y1="30" x2="180" y2="180" gradientUnits="userSpaceOnUse">
          <stop stopColor="#f8faf9" />
          <stop offset="1" stopColor="#edf4f0" />
        </linearGradient>

        {/* Paper gradient */}
        <linearGradient id="gl-ill-paper" x1="75" y1="45" x2="165" y2="175" gradientUnits="userSpaceOnUse">
          <stop stopColor="#ffffff" />
          <stop offset="1" stopColor="#f7faf8" />
        </linearGradient>

        {/* Leaf gradient */}
        <linearGradient id="gl-ill-leaf" x1="165" y1="125" x2="200" y2="165" gradientUnits="userSpaceOnUse">
          <stop stopColor="#34d399" />
          <stop offset="1" stopColor="#059669" />
        </linearGradient>

        {/* Badge gradient */}
        <linearGradient id="gl-ill-badge" x1="130" y1="110" x2="170" y2="150" gradientUnits="userSpaceOnUse">
          <stop stopColor="#20a862" />
          <stop offset="1" stopColor="#15803d" />
        </linearGradient>

        {/* Soft drop shadow */}
        <filter id="gl-ill-shadow" x="35" y="20" width="170" height="170" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
          <feDropShadow dx="0" dy="8" stdDeviation="12" floodColor="#0f291e" floodOpacity="0.08" />
        </filter>
      </defs>

      {/* Atmospheric ambient glow */}
      <circle cx="120" cy="100" r="95" fill="url(#gl-ill-glow)" />

      {/* Behind Page Sheet (Layer 2) */}
      <rect
        x="72"
        y="36"
        width="104"
        height="136"
        rx="14"
        transform="rotate(4 124 104)"
        fill="#e6efe9"
        stroke="#d5e3da"
        strokeWidth="1.5"
      />

      {/* Main Board Container */}
      <g filter="url(#gl-ill-shadow)">
        <rect
          x="64"
          y="32"
          width="112"
          height="144"
          rx="16"
          fill="url(#gl-ill-board)"
          stroke="#cadbd0"
          strokeWidth="1.5"
        />

        {/* Inner Clean Paper */}
        <rect
          x="72"
          y="44"
          width="96"
          height="124"
          rx="10"
          fill="url(#gl-ill-paper)"
          stroke="#e2ebe5"
          strokeWidth="1"
        />

        {/* Stylized Paper Lines */}
        <rect x="84" y="66" width="46" height="5" rx="2.5" fill="#20a862" fillOpacity="0.35" />
        <rect x="84" y="80" width="72" height="4" rx="2" fill="#d2e0d7" />
        <rect x="84" y="92" width="60" height="4" rx="2" fill="#d2e0d7" />
        <rect x="84" y="104" width="68" height="4" rx="2" fill="#e2ede6" />
        <rect x="84" y="116" width="42" height="4" rx="2" fill="#e2ede6" />

        {/* Checklist Item bullets */}
        <circle cx="88" cy="134" r="3" fill="#20a862" fillOpacity="0.4" />
        <rect x="96" y="132" width="48" height="4" rx="2" fill="#d2e0d7" />

        <circle cx="88" cy="146" r="3" fill="#20a862" fillOpacity="0.4" />
        <rect x="96" y="144" width="36" height="4" rx="2" fill="#d2e0d7" />

        {/* Clipboard Top Clip */}
        <rect x="100" y="24" width="40" height="14" rx="5" fill="#475569" />
        <rect x="108" y="21" width="24" height="6" rx="3" fill="#64748b" />
        <circle cx="120" cy="31" r="2.5" fill="#e2e8f0" />
      </g>

      {/* Floating Checkmark / Completion Badge */}
      <g transform="translate(142, 114)">
        <circle cx="20" cy="20" r="18" fill="url(#gl-ill-badge)" />
        <circle cx="20" cy="20" r="18" stroke="#ffffff" strokeWidth="2.5" />
        {/* Checkmark icon */}
        <path
          d="M13 20.5L17.5 25L27 15.5"
          stroke="#ffffff"
          strokeWidth="2.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>

      {/* GreenLearn Sprouting Leaf (Brand Symbolism) */}
      <g transform="translate(176, 126)">
        <path
          d="M0 26C0 26 12 24 18 16C24 8 22 0 22 0C22 0 14 2 8 10C2 18 0 26 0 26Z"
          fill="url(#gl-ill-leaf)"
        />
        <path
          d="M2 24C6 19 12 12 20 2"
          stroke="#ffffff"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeOpacity="0.6"
        />
      </g>

      {/* Subtle organic sparkles / dust particles */}
      <circle cx="56" cy="74" r="2.5" fill="#34d399" fillOpacity="0.7" />
      <circle cx="188" cy="62" r="2" fill="#20a862" fillOpacity="0.5" />
      <path
        d="M50 120L51.5 125L56.5 126.5L51.5 128L50 133L48.5 128L43.5 126.5L48.5 125L50 120Z"
        fill="#20a862"
        fillOpacity="0.45"
      />
      <path
        d="M192 100L193 103.5L196.5 104.5L193 105.5L192 109L191 105.5L187.5 104.5L191 103.5L192 100Z"
        fill="#34d399"
        fillOpacity="0.5"
      />
    </svg>
  );
}

export function AssessmentsEmptyIllustration() {
  return (
    <svg
      viewBox="0 0 240 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="gl-assignments-empty-ill"
    >
      <defs>
        <radialGradient
          id="gl-ill-assess-glow"
          cx="0"
          cy="0"
          r="1"
          gradientUnits="userSpaceOnUse"
          gradientTransform="translate(120 100) rotate(90) scale(95 110)"
        >
          <stop stopColor="#20a862" stopOpacity="0.12" />
          <stop offset="0.65" stopColor="#10b981" stopOpacity="0.05" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>

        <linearGradient id="gl-ill-assess-card" x1="60" y1="35" x2="180" y2="175" gradientUnits="userSpaceOnUse">
          <stop stopColor="#ffffff" />
          <stop offset="1" stopColor="#f3f8f5" />
        </linearGradient>

        <linearGradient id="gl-ill-assess-badge" x1="130" y1="110" x2="170" y2="150" gradientUnits="userSpaceOnUse">
          <stop stopColor="#20a862" />
          <stop offset="1" stopColor="#0d7a46" />
        </linearGradient>

        <filter id="gl-ill-assess-shadow" x="35" y="24" width="170" height="166" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
          <feDropShadow dx="0" dy="8" stdDeviation="12" floodColor="#0f291e" floodOpacity="0.08" />
        </filter>
      </defs>

      <circle cx="120" cy="100" r="95" fill="url(#gl-ill-assess-glow)" />

      {/* Layered Test Cards */}
      <rect
        x="68"
        y="42"
        width="104"
        height="128"
        rx="14"
        transform="rotate(-5 120 106)"
        fill="#e6efe9"
        stroke="#d3e2d8"
        strokeWidth="1.5"
      />

      <g filter="url(#gl-ill-assess-shadow)">
        <rect
          x="66"
          y="36"
          width="108"
          height="136"
          rx="16"
          fill="url(#gl-ill-assess-card)"
          stroke="#cadbd0"
          strokeWidth="1.5"
        />

        {/* Quiz Header Bar */}
        <rect x="78" y="50" width="84" height="18" rx="6" fill="#eaf6ef" />
        <rect x="88" y="56" width="34" height="6" rx="3" fill="#20a862" />
        <rect x="138" y="56" width="14" height="6" rx="3" fill="#86efac" />

        {/* Question options */}
        <circle cx="88" cy="84" r="5" fill="#f0fdf4" stroke="#20a862" strokeWidth="1.5" />
        <circle cx="88" cy="84" r="2.5" fill="#20a862" />
        <rect x="100" y="82" width="56" height="4" rx="2" fill="#334155" />

        <circle cx="88" cy="102" r="5" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1.5" />
        <rect x="100" y="100" width="48" height="4" rx="2" fill="#94a3b8" />

        <circle cx="88" cy="120" r="5" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1.5" />
        <rect x="100" y="118" width="52" height="4" rx="2" fill="#94a3b8" />

        {/* Progress pill indicator */}
        <rect x="78" y="142" width="84" height="6" rx="3" fill="#e2e8f0" />
        <rect x="78" y="142" width="36" height="6" rx="3" fill="#20a862" />
      </g>

      {/* Floating Clock / Timer Icon */}
      <g transform="translate(144, 112)">
        <circle cx="20" cy="20" r="18" fill="url(#gl-ill-assess-badge)" />
        <circle cx="20" cy="20" r="18" stroke="#ffffff" strokeWidth="2.5" />
        <circle cx="20" cy="20" r="12" fill="none" stroke="#ffffff" strokeWidth="1.8" strokeOpacity="0.85" />
        <path d="M20 13V20L24 23" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </g>

      {/* Subtle organic sparkles */}
      <circle cx="54" cy="70" r="2.5" fill="#20a862" fillOpacity="0.5" />
      <circle cx="190" cy="68" r="2" fill="#34d399" fillOpacity="0.6" />
      <path
        d="M48 126L49.5 130L53.5 131.5L49.5 133L48 137L46.5 133L42.5 131.5L46.5 130L48 126Z"
        fill="#20a862"
        fillOpacity="0.4"
      />
    </svg>
  );
}
