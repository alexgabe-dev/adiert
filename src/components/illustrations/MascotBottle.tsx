import React from 'react';

interface MascotBottleProps {
  size?: number;
  className?: string;
  expression?: 'happy' | 'excited' | 'wink';
  badge?: string;
}

export const MascotBottle: React.FC<MascotBottleProps> = ({
  size = 120,
  className = '',
  expression = 'happy',
  badge,
}) => {
  return (
    <div
      className={`relative inline-flex items-center justify-center select-none ${className}`}
      style={{ width: size, height: size * 1.35 }}
    >
      <svg
        viewBox="0 0 160 220"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-md transition-transform duration-300 hover:scale-105"
      >
        <defs>
          <linearGradient
            id="capGrad"
            x1="60"
            y1="10"
            x2="100"
            y2="40"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#1E8E3E" />
            <stop offset="1" stopColor="#137333" />
          </linearGradient>
          <linearGradient
            id="bottleBody"
            x1="40"
            y1="50"
            x2="120"
            y2="210"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#48D86A" />
            <stop offset="0.5" stopColor="#34C759" />
            <stop offset="1" stopColor="#28A745" />
          </linearGradient>
          <linearGradient
            id="bottleHighlight"
            x1="50"
            y1="60"
            x2="60"
            y2="190"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#FFFFFF" stopOpacity="0.6" />
            <stop offset="1" stopColor="#FFFFFF" stopOpacity="0.05" />
          </linearGradient>
          <linearGradient
            id="labelGrad"
            x1="45"
            y1="115"
            x2="115"
            y2="155"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#FFFFFF" />
            <stop offset="1" stopColor="#F0F9F3" />
          </linearGradient>
          <filter id="clayShadow" x="-10%" y="-10%" width="130%" height="130%">
            <feDropShadow dx="0" dy="8" stdDeviation="6" floodColor="#1b632c" floodOpacity="0.25" />
          </filter>
        </defs>

        {/* Bottle Cap */}
        <rect
          x="64"
          y="12"
          width="32"
          height="18"
          rx="5"
          fill="url(#capGrad)"
          filter="url(#clayShadow)"
        />
        <rect x="68" y="8" width="24" height="6" rx="2" fill="#2BB34B" />
        <line
          x1="72"
          y1="15"
          x2="72"
          y2="25"
          stroke="#2BB34B"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <line
          x1="80"
          y1="15"
          x2="80"
          y2="25"
          stroke="#2BB34B"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <line
          x1="88"
          y1="15"
          x2="88"
          y2="25"
          stroke="#2BB34B"
          strokeWidth="2"
          strokeLinecap="round"
        />

        {/* Neck */}
        <path
          d="M68 30H92V48C92 56 100 62 108 66L116 70C122 73 126 79 126 86V184C126 198 114 210 100 210H60C46 210 34 198 34 184V86C34 79 38 73 44 70L52 66C60 62 68 56 68 48V30Z"
          fill="url(#bottleBody)"
          filter="url(#clayShadow)"
        />

        {/* Gloss / Specular Highlights */}
        <path
          d="M44 86C44 80 47 75 52 72L58 69C64 66 70 61 70 54V34H74V52C74 60 68 66 62 69L56 72C52 74 50 78 50 82V180C50 190 56 198 66 200V204C52 202 44 192 44 180V86Z"
          fill="url(#bottleHighlight)"
        />

        {/* Waist grip indentations */}
        <path
          d="M34 100C38 100 42 104 42 108C42 112 38 116 34 116"
          stroke="#259B3F"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <path
          d="M126 100C122 100 118 104 118 108C118 112 122 116 126 116"
          stroke="#259B3F"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <path
          d="M34 165C38 165 42 169 42 173C42 177 38 181 34 181"
          stroke="#259B3F"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <path
          d="M126 165C122 165 118 169 118 173C118 177 122 181 126 181"
          stroke="#259B3F"
          strokeWidth="3"
          strokeLinecap="round"
        />

        {/* Face */}
        {expression === 'wink' ? (
          <>
            <circle cx="62" cy="94" r="5" fill="#0B1535" />
            <path
              d="M92 95C95 91 101 91 104 95"
              stroke="#0B1535"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </>
        ) : expression === 'excited' ? (
          <>
            <circle cx="64" cy="94" r="6" fill="#0B1535" />
            <circle cx="66" cy="92" r="2.5" fill="#FFFFFF" />
            <circle cx="96" cy="94" r="6" fill="#0B1535" />
            <circle cx="98" cy="92" r="2.5" fill="#FFFFFF" />
          </>
        ) : (
          <>
            {/* Happy Eyes */}
            <circle cx="64" cy="94" r="5" fill="#0B1535" />
            <circle cx="66" cy="92" r="1.8" fill="#FFFFFF" />
            <circle cx="96" cy="94" r="5" fill="#0B1535" />
            <circle cx="98" cy="92" r="1.8" fill="#FFFFFF" />
          </>
        )}

        {/* Rosy Cheeks */}
        <circle cx="54" cy="101" r="5" fill="#FF8497" fillOpacity="0.6" />
        <circle cx="106" cy="101" r="5" fill="#FF8497" fillOpacity="0.6" />

        {/* Smile */}
        <path
          d="M72 102C72 108 88 108 88 102"
          stroke="#0B1535"
          strokeWidth="3"
          strokeLinecap="round"
        />

        {/* Center Eco Label */}
        <rect x="44" y="118" width="72" height="42" rx="10" fill="url(#labelGrad)" />
        <rect
          x="46"
          y="120"
          width="68"
          height="38"
          rx="8"
          stroke="#34C759"
          strokeWidth="1.5"
          strokeDasharray="3 2"
        />

        {/* 50 Ft badge on label */}
        <circle cx="62" cy="139" r="12" fill="#246BFD" />
        <text
          x="62"
          y="143"
          textAnchor="middle"
          fill="#FFFFFF"
          fontSize="10"
          fontWeight="bold"
          fontFamily="sans-serif"
        >
          50
        </text>
        <path
          d="M80 132H102M80 139H98M80 146H94"
          stroke="#246BFD"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <circle cx="98" cy="146" r="3" fill="#34C759" />

        {/* Small Hands / Arms */}
        <path
          d="M34 112C26 114 20 120 22 126C24 132 30 130 36 124"
          stroke="#34C759"
          strokeWidth="4"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M126 112C134 114 140 120 138 126C136 132 130 130 124 124"
          stroke="#34C759"
          strokeWidth="4"
          strokeLinecap="round"
          fill="none"
        />
      </svg>

      {badge && (
        <span className="absolute -bottom-2 bg-blue-600 text-white font-bold text-xs px-2.5 py-0.5 rounded-full shadow-sm border-2 border-white">
          {badge}
        </span>
      )}
    </div>
  );
};
