import React from "react";

export const RobotIllustration: React.FC<{ className?: string }> = ({ className = "w-44 h-40" }) => {
  return (
    <div className={`relative flex items-center justify-center select-none pointer-events-none ${className}`}>
      {/* Background Soft Glow Aura */}
      <div className="absolute inset-0 bg-emerald-300/30 rounded-full blur-2xl transform scale-90 -translate-y-2" />

      {/* Speech bubble "Need help? We're here for you!" */}
      <div className="absolute -top-3 left-4 sm:-top-4 sm:left-2 bg-white/95 backdrop-blur-sm border border-emerald-100 px-3 py-1.5 rounded-2xl shadow-sm z-10 animate-bounce-subtle">
        <p className="text-[11px] font-bold text-gray-800 leading-tight">Need help?</p>
        <p className="text-[10px] text-emerald-600 font-medium">We're here for you!</p>
        <div className="absolute -bottom-1.5 right-4 w-3 h-3 bg-white border-r border-b border-emerald-100 rotate-45" />
      </div>

      <svg
        viewBox="0 0 280 240"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full object-contain relative z-1 drop-shadow-md"
      >
        {/* Soft floating leaves in background */}
        <path
          d="M40 130 C30 110, 50 85, 75 90 C85 105, 70 135, 40 130 Z"
          fill="#34d399"
          fillOpacity="0.25"
        />
        <path
          d="M230 60 C245 45, 270 55, 265 80 C245 85, 225 75, 230 60 Z"
          fill="#10b981"
          fillOpacity="0.22"
        />

        {/* Stack of Learning Books on Left */}
        {/* Bottom Book (Dark Emerald) */}
        <g id="book-stack">
          {/* Bottom book */}
          <path
            d="M60 170 C75 160, 110 160, 125 170 L125 185 C110 175, 75 175, 60 185 Z"
            fill="#059669"
          />
          <path
            d="M60 185 C75 175, 110 175, 125 185 C125 185, 120 192, 105 192 C75 192, 60 185, 60 185 Z"
            fill="#047857"
          />
          <path
            d="M125 170 C140 160, 175 160, 190 170 L190 185 C175 175, 140 175, 125 185 Z"
            fill="#10b981"
          />
          <path
            d="M125 185 C140 175, 175 175, 190 185 C190 185, 175 192, 145 192 C130 192, 125 185, 125 185 Z"
            fill="#059669"
          />

          {/* Book page pages */}
          <path
            d="M62 165 C77 155, 110 155, 125 165 L125 170 C110 160, 77 160, 62 170 Z"
            fill="#F8FAFC"
          />
          <path
            d="M125 165 C140 155, 173 155, 188 165 L188 170 C173 160, 140 160, 125 170 Z"
            fill="#F1F5F9"
          />

          {/* Top book (Bright Emerald) */}
          <path
            d="M55 145 C70 135, 105 135, 120 145 L120 160 C105 150, 70 150, 55 160 Z"
            fill="#10B981"
          />
          <path
            d="M120 145 C135 135, 170 135, 185 145 L185 160 C170 150, 135 150, 120 160 Z"
            fill="#34D399"
          />
          <path
            d="M57 140 C72 130, 105 130, 120 140 L120 145 C105 135, 72 135, 57 145 Z"
            fill="#FFFFFF"
          />
          <path
            d="M120 140 C135 130, 168 130, 183 140 L183 145 C168 135, 135 135, 120 145 Z"
            fill="#F8FAFC"
          />
        </g>

        {/* GreenLearn Mascot Robot */}
        <g id="greenlearn-robot">
          {/* Head Antenna */}
          <line x1="200" y1="45" x2="200" y2="70" stroke="#10b981" strokeWidth="4" strokeLinecap="round" />
          <circle cx="200" cy="40" r="7" fill="#059669" />
          <circle cx="200" cy="40" r="3" fill="#6ee7b7" />

          {/* Head Shape */}
          <rect
            x="152"
            y="65"
            width="96"
            height="76"
            rx="32"
            fill="#FFFFFF"
            stroke="#E2E8F0"
            strokeWidth="3"
          />

          {/* Head side ears / headphones */}
          <rect x="144" y="86" width="10" height="34" rx="5" fill="#10B981" />
          <rect x="246" y="86" width="10" height="34" rx="5" fill="#10B981" />

          {/* Screen Face Area (Dark Emerald Rounded Visor) */}
          <rect
            x="162"
            y="75"
            width="76"
            height="54"
            rx="22"
            fill="#064E3B"
          />

          {/* Glowing Happy Eyes (Smiling Arcs) */}
          <path
            d="M174 97 Q181 90 188 97"
            stroke="#34D399"
            strokeWidth="4"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M212 97 Q219 90 226 97"
            stroke="#34D399"
            strokeWidth="4"
            strokeLinecap="round"
            fill="none"
          />

          {/* Rosy Cheeks */}
          <circle cx="172" cy="107" r="4" fill="#059669" fillOpacity="0.8" />
          <circle cx="228" cy="107" r="4" fill="#059669" fillOpacity="0.8" />

          {/* Subtle Mouth Smile */}
          <path
            d="M195 112 Q200 116 205 112"
            stroke="#A7F3D0"
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="none"
          />

          {/* Robot Neck */}
          <rect x="190" y="141" width="20" height="10" rx="3" fill="#CBD5E1" />

          {/* Robot Body */}
          <rect
            x="166"
            y="150"
            width="68"
            height="56"
            rx="20"
            fill="#FFFFFF"
            stroke="#E2E8F0"
            strokeWidth="3"
          />

          {/* Green Chest Emblem with Leaf Icon */}
          <circle cx="200" cy="174" r="14" fill="#ECFDF5" />
          <path
            d="M200 166 C194 170, 194 179, 200 183 C206 179, 206 170, 200 166 Z"
            fill="#10B981"
          />

          {/* Robot Arms */}
          {/* Left Arm resting on books */}
          <path
            d="M166 162 C150 166, 140 178, 148 190 C154 195, 165 186, 168 180"
            stroke="#FFFFFF"
            strokeWidth="8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Right Arm waving / resting */}
          <path
            d="M234 162 C248 168, 255 180, 248 190 C242 195, 234 186, 232 180"
            stroke="#FFFFFF"
            strokeWidth="8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      </svg>
    </div>
  );
};
