interface CourseArtProps {
  artType: "javascript" | "react" | "design" | "node" | "data" | "devops" | "ai";
}

export function ExploreCourseArt({ artType }: CourseArtProps) {
  switch (artType) {
    case "javascript":
      return (
        <div className="explore-card-art explore-card-art--javascript" aria-hidden="true">
          <svg viewBox="0 0 340 160" preserveAspectRatio="xMidYMid slice" fill="none">
            <defs>
              <pattern id="jsGridLines" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#f1dc50" strokeWidth="0.8" strokeOpacity="0.35" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="#fbe789" />
            <rect width="100%" height="100%" fill="url(#jsGridLines)" />

            <circle cx="270" cy="45" r="44" fill="#18181b" />
            <circle cx="210" cy="125" r="15" fill="#f59e0b" opacity="0.85" />
            <rect x="238" y="75" width="50" height="50" fill="#facc15" stroke="#18181b" strokeWidth="2" />
            
            <path d="M270 45 L 270 150" stroke="#18181b" strokeWidth="1.8" strokeDasharray="3 3" />
            <path d="M210 125 L 315 125" stroke="#18181b" strokeWidth="1.5" />
            <circle cx="270" cy="125" r="4.5" fill="#18181b" />

            <text
              x="32"
              y="112"
              fill="#18181b"
              fontFamily="system-ui, -apple-system, sans-serif"
              fontSize="84"
              fontWeight="900"
              letterSpacing="-3"
            >
              JS
            </text>
          </svg>
        </div>
      );

    case "react":
      return (
        <div className="explore-card-art explore-card-art--react" aria-hidden="true">
          <svg viewBox="0 0 340 160" preserveAspectRatio="xMidYMid slice" fill="none">
            <defs>
              <linearGradient id="reactCardBg" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ebfaf2" />
                <stop offset="100%" stopColor="#f4fbf7" />
              </linearGradient>
            </defs>
            <rect width="100%" height="100%" fill="url(#reactCardBg)" />

            <path d="M 0 0 L 85 0 L 0 85 Z" fill="#045637" opacity="0.9" />
            <path d="M 340 160 L 265 160 L 340 85 Z" fill="#045637" opacity="0.9" />

            <path d="M40 140 Q 140 60 240 130 T 340 70" stroke="#a7f3d0" strokeWidth="1.2" fill="none" />
            <path d="M80 160 Q 180 80 280 150" stroke="#a7f3d0" strokeWidth="1" fill="none" />

            <g transform="translate(170, 80)">
              <ellipse cx="0" cy="0" rx="68" ry="24" stroke="#059669" strokeWidth="2.2" transform="rotate(0)" />
              <ellipse cx="0" cy="0" rx="68" ry="24" stroke="#059669" strokeWidth="2.2" transform="rotate(60)" />
              <ellipse cx="0" cy="0" rx="68" ry="24" stroke="#059669" strokeWidth="2.2" transform="rotate(120)" />
              <circle cx="0" cy="0" r="9" fill="#10b981" />
              <circle cx="0" cy="0" r="4" fill="#ffffff" />
            </g>
          </svg>
        </div>
      );

    case "design":
      return (
        <div className="explore-card-art explore-card-art--design" aria-hidden="true">
          <svg viewBox="0 0 340 160" preserveAspectRatio="xMidYMid slice" fill="none">
            <defs>
              <linearGradient id="designBg" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f3e8ff" />
                <stop offset="100%" stopColor="#fbf7ff" />
              </linearGradient>
            </defs>
            <rect width="100%" height="100%" fill="url(#designBg)" />

            <text
              x="28"
              y="110"
              fill="#581c87"
              fontFamily="Georgia, serif"
              fontSize="82"
              fontWeight="bold"
            >
              A
            </text>

            <g stroke="#7e22ce" strokeWidth="1.5" fill="none">
              <rect x="145" y="60" width="42" height="42" rx="6" />
              <circle cx="230" cy="55" r="22" fill="#d8b4fe" fillOpacity="0.45" />
              <path d="M187 81 L 270 81" strokeDasharray="3 3" />
              <rect x="225" y="65" width="44" height="44" rx="8" stroke="#6b21a8" strokeWidth="1.8" />
              <path d="M233 76 L 261 104" />
            </g>
            <circle cx="268" cy="38" r="4" fill="#a855f7" />
          </svg>
        </div>
      );

    case "node":
      return (
        <div className="explore-card-art explore-card-art--node" aria-hidden="true">
          <svg viewBox="0 0 340 160" preserveAspectRatio="xMidYMid slice" fill="none">
            <defs>
              <linearGradient id="nodeBg" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#042617" />
                <stop offset="100%" stopColor="#02140c" />
              </linearGradient>
            </defs>
            <rect width="100%" height="100%" fill="url(#nodeBg)" />

            <g stroke="#166534" strokeWidth="1.2" strokeOpacity="0.5">
              <path d="M 20 80 H 75 L 100 45 H 200" />
              <path d="M 50 125 H 120 L 145 98 H 280" />
              <circle cx="75" cy="80" r="3" fill="#22c55e" />
              <circle cx="200" cy="45" r="3" fill="#22c55e" />
            </g>

            <text
              x="42"
              y="100"
              fill="#ffffff"
              fontFamily="system-ui, -apple-system, sans-serif"
              fontSize="48"
              fontWeight="900"
              letterSpacing="-2"
            >
              node
            </text>

            <g transform="translate(230, 80)">
              <polygon
                points="0,-34 30,-17 30,17 0,34 -30,17 -30,-17"
                stroke="#22c55e"
                strokeWidth="2.2"
                fill="#0a331f"
              />
              <text
                x="0"
                y="7"
                fill="#4ade80"
                textAnchor="middle"
                fontFamily="system-ui, sans-serif"
                fontSize="16"
                fontWeight="bold"
              >
                JS
              </text>
            </g>
          </svg>
        </div>
      );

    case "data":
      return (
        <div className="explore-card-art explore-card-art--data" aria-hidden="true">
          <svg viewBox="0 0 340 160" preserveAspectRatio="xMidYMid slice" fill="none">
            <defs>
              <linearGradient id="dataBg" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#082f49" />
                <stop offset="100%" stopColor="#031a29" />
              </linearGradient>
              <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#38bdf8" />
                <stop offset="100%" stopColor="#0284c7" />
              </linearGradient>
            </defs>
            <rect width="100%" height="100%" fill="url(#dataBg)" />

            <g stroke="#0369a1" strokeWidth="0.8" strokeOpacity="0.3" strokeDasharray="3 3">
              <line x1="30" y1="35" x2="310" y2="35" />
              <line x1="30" y1="70" x2="310" y2="70" />
              <line x1="30" y1="105" x2="310" y2="105" />
            </g>

            <rect x="50" y="75" width="24" height="50" rx="4" fill="url(#barGrad)" opacity="0.75" />
            <rect x="90" y="55" width="24" height="70" rx="4" fill="url(#barGrad)" opacity="0.85" />
            <rect x="130" y="85" width="24" height="40" rx="4" fill="url(#barGrad)" opacity="0.65" />
            <rect x="170" y="40" width="24" height="85" rx="4" fill="url(#barGrad)" opacity="0.95" />
            <rect x="210" y="60" width="24" height="65" rx="4" fill="url(#barGrad)" opacity="0.8" />
            <rect x="250" y="30" width="24" height="95" rx="4" fill="#38bdf8" />

            <path
              d="M 62 70 Q 144 26 262 26"
              stroke="#7dd3fc"
              strokeWidth="2.2"
              fill="none"
            />
            <circle cx="262" cy="26" r="4.5" fill="#ffffff" />
          </svg>
        </div>
      );

    case "devops":
      return (
        <div className="explore-card-art explore-card-art--devops" aria-hidden="true">
          <svg viewBox="0 0 340 160" preserveAspectRatio="xMidYMid slice" fill="none">
            <defs>
              <linearGradient id="devopsBg" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#0f2b30" />
                <stop offset="100%" stopColor="#061619" />
              </linearGradient>
            </defs>
            <rect width="100%" height="100%" fill="url(#devopsBg)" />

            <g transform="translate(170, 80)">
              <path
                d="M -54,0 C -54,-30 -14,-30 0,0 C 14,30 54,30 54,0 C 54,-30 14,-30 0,0 C -14,30 -54,30 -54,0 Z"
                stroke="#2dd4bf"
                strokeWidth="3.5"
                fill="none"
              />
              <circle cx="-30" cy="-16" r="3.5" fill="#99f6e4" />
              <circle cx="30" cy="16" r="3.5" fill="#99f6e4" />
            </g>
          </svg>
        </div>
      );

    case "ai":
      return (
        <div className="explore-card-art explore-card-art--ai" aria-hidden="true">
          <svg viewBox="0 0 340 160" preserveAspectRatio="xMidYMid slice" fill="none">
            <defs>
              <linearGradient id="aiBg" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#2b0f5e" />
                <stop offset="100%" stopColor="#0e0520" />
              </linearGradient>
            </defs>
            <rect width="100%" height="100%" fill="url(#aiBg)" />

            <g stroke="#c084fc" strokeWidth="1.2" strokeOpacity="0.6">
              <line x1="55" y1="45" x2="140" y2="80" />
              <line x1="55" y1="115" x2="140" y2="80" />
              <line x1="140" y1="80" x2="225" y2="45" />
              <line x1="140" y1="80" x2="225" y2="115" />
              <line x1="225" y1="45" x2="285" y2="80" />
              <line x1="225" y1="115" x2="285" y2="80" />
            </g>

            <circle cx="55" cy="45" r="7" fill="#a855f7" />
            <circle cx="55" cy="115" r="7" fill="#a855f7" />
            <circle cx="140" cy="80" r="12" fill="#d8b4fe" />
            <circle cx="225" cy="45" r="9" fill="#c084fc" />
            <circle cx="225" cy="115" r="9" fill="#c084fc" />
            <circle cx="285" cy="80" r="7" fill="#e9d5ff" />
          </svg>
        </div>
      );
  }
}
