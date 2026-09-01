import React from 'react';

interface Coin50FtProps {
  size?: number;
  className?: string;
  animate?: boolean;
}

export const Coin50Ft: React.FC<Coin50FtProps> = ({
  size = 54,
  className = '',
  animate = false,
}) => {
  return (
    <div
      className={`inline-flex items-center justify-center select-none ${animate ? 'hover:rotate-12 transition-transform duration-300' : ''} ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-md"
      >
        <defs>
          <linearGradient
            id="coinOuter"
            x1="15"
            y1="15"
            x2="85"
            y2="85"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#F9D423" />
            <stop offset="0.5" stopColor="#FFB020" />
            <stop offset="1" stopColor="#E67E22" />
          </linearGradient>
          <linearGradient
            id="coinInner"
            x1="20"
            y1="20"
            x2="80"
            y2="80"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#FFEAA7" />
            <stop offset="0.6" stopColor="#FDCB6E" />
            <stop offset="1" stopColor="#E17055" />
          </linearGradient>
          <linearGradient
            id="coinRim"
            x1="10"
            y1="10"
            x2="90"
            y2="90"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#FFF" stopOpacity="0.8" />
            <stop offset="1" stopColor="#D35400" stopOpacity="0.4" />
          </linearGradient>
        </defs>

        {/* Outer Ring */}
        <circle
          cx="50"
          cy="50"
          r="46"
          fill="url(#coinOuter)"
          stroke="url(#coinRim)"
          strokeWidth="2.5"
        />

        {/* Inner Milled Border */}
        <circle
          cx="50"
          cy="50"
          r="39"
          stroke="#FFF"
          strokeOpacity="0.4"
          strokeWidth="1.5"
          strokeDasharray="3 2"
        />

        {/* Inner Field */}
        <circle cx="50" cy="50" r="36" fill="url(#coinInner)" />

        {/* Embossed Value Text */}
        <text
          x="50"
          y="49"
          textAnchor="middle"
          fill="#8A4500"
          fontSize="26"
          fontWeight="800"
          fontFamily="system-ui, -apple-system, sans-serif"
          letterSpacing="-1"
        >
          50
        </text>
        <text
          x="50"
          y="68"
          textAnchor="middle"
          fill="#8A4500"
          fontSize="13"
          fontWeight="700"
          fontFamily="system-ui, -apple-system, sans-serif"
        >
          Ft
        </text>

        {/* Subtle Specular Arc */}
        <path
          d="M25 32C32 24 42 20 54 20"
          stroke="#FFFFFF"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeOpacity="0.75"
        />
        <circle cx="62" cy="22" r="2" fill="#FFFFFF" fillOpacity="0.8" />
      </svg>
    </div>
  );
};
