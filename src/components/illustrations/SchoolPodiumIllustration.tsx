import React from 'react';

interface SchoolPodiumIllustrationProps {
  rank: 1 | 2 | 3;
  className?: string;
}

export const SchoolPodiumIllustration: React.FC<SchoolPodiumIllustrationProps> = ({
  rank,
  className = '',
}) => {
  const roofColor = rank === 1 ? '#F59E0B' : rank === 2 ? '#94A3B8' : '#D97706';
  const wallColor = rank === 1 ? '#FEF3C7' : rank === 2 ? '#F1F5F9' : '#FFEDD5';
  const accentColor = rank === 1 ? '#D97706' : rank === 2 ? '#64748B' : '#B45309';

  return (
    <div className={`w-full max-w-[140px] h-[72px] mx-auto select-none ${className}`}>
      <svg
        viewBox="0 0 140 70"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        {/* Main Building Base */}
        <rect
          x="25"
          y="24"
          width="90"
          height="42"
          rx="4"
          fill={wallColor}
          stroke={accentColor}
          strokeWidth="1.5"
        />

        {/* Central Entrance / Tower */}
        <rect
          x="52"
          y="14"
          width="36"
          height="52"
          rx="3"
          fill="#FFFFFF"
          stroke={accentColor}
          strokeWidth="1.5"
        />

        {/* Triangular Gables / Roof */}
        <path d="M50 14L70 2L90 14H50Z" fill={roofColor} stroke={accentColor} strokeWidth="1.5" />

        {/* Clock or Bell in Tower */}
        <circle cx="70" cy="22" r="5" fill="#FFFFFF" stroke={accentColor} strokeWidth="1.2" />
        <line
          x1="70"
          y1="22"
          x2="70"
          y2="19"
          stroke={accentColor}
          strokeWidth="1"
          strokeLinecap="round"
        />
        <line
          x1="70"
          y1="22"
          x2="72"
          y2="22"
          stroke={accentColor}
          strokeWidth="1"
          strokeLinecap="round"
        />

        {/* Windows */}
        <rect x="33" y="30" width="12" height="12" rx="2" fill="#93C5FD" opacity="0.8" />
        <rect x="33" y="48" width="12" height="12" rx="2" fill="#93C5FD" opacity="0.8" />

        <rect x="95" y="30" width="12" height="12" rx="2" fill="#93C5FD" opacity="0.8" />
        <rect x="95" y="48" width="12" height="12" rx="2" fill="#93C5FD" opacity="0.8" />

        {/* Double Door */}
        <rect x="62" y="46" width="16" height="20" rx="2" fill={accentColor} />
        <line x1="70" y1="46" x2="70" y2="66" stroke="#FFFFFF" strokeWidth="1" />

        {/* Flag Pole atop roof */}
        <line x1="70" y1="2" x2="70" y2="-6" stroke={accentColor} strokeWidth="1.5" />
        <path d="M70 -6L78 -3L70 0V-6Z" fill={rank === 1 ? '#EF4444' : '#246BFD'} />
      </svg>
    </div>
  );
};
