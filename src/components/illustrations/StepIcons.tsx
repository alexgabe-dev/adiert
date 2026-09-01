import React from 'react';

interface StepIconProps {
  type: 'bottles' | 'repont' | 'camera' | 'upload' | 'trophy';
  size?: number;
  className?: string;
}

export const StepIcon: React.FC<StepIconProps> = ({ type, size = 56, className = '' }) => {
  return (
    <div
      className={`inline-flex items-center justify-center rounded-2xl p-2.5 transition-transform duration-300 group-hover:scale-110 ${className}`}
      style={{ width: size, height: size }}
    >
      {type === 'bottles' && (
        <svg
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          {/* Green Bottle */}
          <rect x="14" y="6" width="6" height="4" rx="1.5" fill="#137333" />
          <path
            d="M15 10H19C21 10 23 12 24 14L25 16C26 18 27 20 27 23V38C27 41 25 43 22 43H12C9 43 7 41 7 38V23C7 20 8 18 9 16L10 14C11 12 13 10 15 10Z"
            fill="#34C759"
          />
          <rect x="9" y="24" width="16" height="10" rx="2" fill="#FFFFFF" opacity="0.9" />
          <line
            x1="12"
            y1="29"
            x2="22"
            y2="29"
            stroke="#34C759"
            strokeWidth="2"
            strokeLinecap="round"
          />

          {/* Blue Bottle (behind) */}
          <rect x="28" y="10" width="6" height="4" rx="1.5" fill="#1D4ED8" />
          <path
            d="M29 14H33C35 14 37 16 38 18L39 20C40 22 41 24 41 26V40C41 42 39 44 37 44H27C25 44 23 42 23 40V26C23 24 24 22 25 20L26 18C27 16 27 14 29 14Z"
            fill="#246BFD"
          />

          {/* 50 Ft Badge */}
          <circle cx="36" cy="18" r="8" fill="#FFB020" />
          <text x="36" y="21" textAnchor="middle" fill="#78350F" fontSize="7" fontWeight="800">
            50
          </text>
        </svg>
      )}

      {type === 'repont' && (
        <svg
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          {/* Machine kiosk */}
          <rect x="8" y="6" width="32" height="38" rx="6" fill="#137333" />
          <rect x="12" y="10" width="24" height="12" rx="3" fill="#0B1535" />
          <text x="24" y="18" textAnchor="middle" fill="#34C759" fontSize="6" fontWeight="bold">
            REPONT
          </text>

          {/* Intake funnel */}
          <circle cx="24" cy="30" r="8" fill="#06101E" stroke="#34C759" strokeWidth="1.5" />
          <circle cx="24" cy="30" r="4" fill="#34C759" />
          <path d="M24 28V32M22 30H26" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      )}

      {type === 'camera' && (
        <svg
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          {/* Receipt behind */}
          <path d="M12 6H28L34 12V28H12V6Z" fill="#F1F5F9" stroke="#CBD5E1" strokeWidth="1.5" />
          <line
            x1="16"
            y1="14"
            x2="26"
            y2="14"
            stroke="#94A3B8"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <line
            x1="16"
            y1="18"
            x2="28"
            y2="18"
            stroke="#94A3B8"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <line
            x1="16"
            y1="22"
            x2="24"
            y2="22"
            stroke="#246BFD"
            strokeWidth="1.5"
            strokeLinecap="round"
          />

          {/* Camera Phone Lens */}
          <rect x="18" y="16" width="24" height="26" rx="5" fill="#246BFD" />
          <circle cx="30" cy="28" r="7" fill="#0B1535" stroke="#FFFFFF" strokeWidth="1.5" />
          <circle cx="30" cy="28" r="3" fill="#60A5FA" />
          <circle cx="36" cy="20" r="1.5" fill="#FFB020" />
        </svg>
      )}

      {type === 'upload' && (
        <svg
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          {/* Cloud upload / School selector */}
          <rect
            x="8"
            y="10"
            width="32"
            height="30"
            rx="6"
            fill="#EFF6FF"
            stroke="#3B82F6"
            strokeWidth="1.5"
          />
          <rect x="14" y="16" width="20" height="4" rx="2" fill="#93C5FD" />

          {/* Upload arrow */}
          <circle cx="24" cy="29" r="9" fill="#246BFD" />
          <path
            d="M24 33V25M20 28L24 24L28 28"
            stroke="#FFFFFF"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}

      {type === 'trophy' && (
        <svg
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          {/* Golden Trophy Cup */}
          <path d="M14 10H34V22C34 27.5 29.5 32 24 32C18.5 32 14 27.5 14 22V10Z" fill="#FFB020" />
          <path d="M14 14H8C8 20 12 22 14 22V14Z" fill="#D97706" />
          <path d="M34 14H40C40 20 36 22 34 22V14Z" fill="#D97706" />

          {/* Base */}
          <rect x="22" y="32" width="4" height="6" fill="#D97706" />
          <rect x="16" y="38" width="16" height="4" rx="2" fill="#78350F" />

          {/* Star on trophy */}
          <circle cx="24" cy="20" r="3" fill="#FFFFFF" />
          {/* Heart above */}
          <path
            d="M24 4L22 6C21 7 21 8 22 9C23 10 24 10 24 9C24 10 25 10 26 9C27 8 27 7 26 6L24 4Z"
            fill="#EF4444"
          />
        </svg>
      )}
    </div>
  );
};
