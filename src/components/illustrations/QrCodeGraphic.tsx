import React from 'react';

interface QrCodeGraphicProps {
  size?: number;
  className?: string;
}

export const QrCodeGraphic: React.FC<QrCodeGraphicProps> = ({ size = 220, className = '' }) => {
  return (
    <div
      className={`relative inline-flex items-center justify-center overflow-hidden rounded-2xl border border-slate-100 bg-white p-3.5 shadow-md select-none ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        {/* Background */}
        <rect width="200" height="200" rx="12" fill="#FFFFFF" />

        {/* Top-Left Finder Pattern */}
        <rect x="16" y="16" width="48" height="48" rx="8" fill="#0B1535" />
        <rect x="22" y="22" width="36" height="36" rx="5" fill="#FFFFFF" />
        <rect x="28" y="28" width="24" height="24" rx="4" fill="#246BFD" />

        {/* Top-Right Finder Pattern */}
        <rect x="136" y="16" width="48" height="48" rx="8" fill="#0B1535" />
        <rect x="142" y="22" width="36" height="36" rx="5" fill="#FFFFFF" />
        <rect x="148" y="28" width="24" height="24" rx="4" fill="#246BFD" />

        {/* Bottom-Left Finder Pattern */}
        <rect x="16" y="136" width="48" height="48" rx="8" fill="#0B1535" />
        <rect x="22" y="142" width="36" height="36" rx="5" fill="#FFFFFF" />
        <rect x="28" y="148" width="24" height="24" rx="4" fill="#246BFD" />

        {/* Authentic Data Matrix Grid Blocks */}
        {/* Top area & Timing lines */}
        <rect x="74" y="20" width="8" height="8" rx="2" fill="#0B1535" />
        <rect x="90" y="20" width="8" height="8" rx="2" fill="#0B1535" />
        <rect x="106" y="20" width="16" height="8" rx="2" fill="#0B1535" />
        <rect x="74" y="36" width="16" height="8" rx="2" fill="#0B1535" />
        <rect x="98" y="36" width="8" height="8" rx="2" fill="#0B1535" />
        <rect x="114" y="36" width="12" height="8" rx="2" fill="#0B1535" />
        <rect x="74" y="52" width="8" height="8" rx="2" fill="#0B1535" />
        <rect x="90" y="52" width="16" height="8" rx="2" fill="#0B1535" />

        {/* Timing pattern */}
        <rect x="36" y="74" width="8" height="8" rx="2" fill="#0B1535" />
        <rect x="36" y="90" width="8" height="8" rx="2" fill="#0B1535" />
        <rect x="36" y="106" width="8" height="8" rx="2" fill="#0B1535" />
        <rect x="36" y="122" width="8" height="8" rx="2" fill="#0B1535" />

        <rect x="52" y="74" width="12" height="8" rx="2" fill="#0B1535" />
        <rect x="52" y="98" width="8" height="16" rx="2" fill="#0B1535" />
        <rect x="20" y="74" width="8" height="16" rx="2" fill="#0B1535" />
        <rect x="20" y="106" width="8" height="8" rx="2" fill="#0B1535" />

        {/* Right side data */}
        <rect x="136" y="74" width="16" height="8" rx="2" fill="#0B1535" />
        <rect x="160" y="74" width="8" height="16" rx="2" fill="#0B1535" />
        <rect x="176" y="74" width="8" height="8" rx="2" fill="#0B1535" />
        <rect x="136" y="90" width="8" height="16" rx="2" fill="#0B1535" />
        <rect x="152" y="90" width="16" height="8" rx="2" fill="#0B1535" />
        <rect x="176" y="98" width="8" height="16" rx="2" fill="#0B1535" />
        <rect x="144" y="114" width="16" height="8" rx="2" fill="#0B1535" />
        <rect x="168" y="114" width="8" height="8" rx="2" fill="#0B1535" />

        {/* Bottom area data */}
        <rect x="74" y="136" width="16" height="8" rx="2" fill="#0B1535" />
        <rect x="98" y="136" width="8" height="8" rx="2" fill="#0B1535" />
        <rect x="114" y="136" width="14" height="8" rx="2" fill="#0B1535" />
        <rect x="74" y="152" width="8" height="16" rx="2" fill="#0B1535" />
        <rect x="90" y="152" width="16" height="8" rx="2" fill="#0B1535" />
        <rect x="114" y="152" width="8" height="16" rx="2" fill="#0B1535" />
        <rect x="74" y="176" width="24" height="8" rx="2" fill="#0B1535" />
        <rect x="106" y="176" width="16" height="8" rx="2" fill="#0B1535" />

        <rect x="136" y="136" width="16" height="8" rx="2" fill="#0B1535" />
        <rect x="160" y="136" width="8" height="16" rx="2" fill="#0B1535" />
        <rect x="136" y="152" width="8" height="8" rx="2" fill="#0B1535" />
        <rect x="152" y="152" width="16" height="8" rx="2" fill="#0B1535" />
        <rect x="176" y="152" width="8" height="8" rx="2" fill="#0B1535" />
        <rect x="136" y="168" width="16" height="16" rx="2" fill="#0B1535" />
        <rect x="160" y="176" width="24" height="8" rx="2" fill="#0B1535" />

        {/* Center Logo Shield */}
        <rect
          x="75"
          y="75"
          width="50"
          height="50"
          rx="14"
          fill="#FFFFFF"
          stroke="#E2E8F0"
          strokeWidth="2"
          filter="drop-shadow(0 2px 4px rgba(0,0,0,0.1))"
        />
        <rect x="80" y="80" width="40" height="40" rx="10" fill="#246BFD" />

        {/* Heart + Recycle glyph at center */}
        <path
          d="M100 106L94 100C91 97 91 93 94 90C97 87 100 87 100 90C100 87 103 87 106 90C109 93 109 97 106 100L100 106Z"
          fill="#FFFFFF"
        />
        <circle cx="100" cy="94" r="1.5" fill="#34C759" />
      </svg>
      <span className="absolute inset-x-3 bottom-3 rounded-lg bg-[#0B1535]/90 px-2 py-1.5 text-center text-[10px] font-extrabold tracking-widest text-white uppercase">
        Nem használható • Helyőrző
      </span>
    </div>
  );
};
