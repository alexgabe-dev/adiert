'use client';

import React from 'react';
import { motion, useReducedMotion } from 'motion/react';

export const HeroRecyclingScene: React.FC = () => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="relative w-full max-w-[540px] aspect-[1/0.92] mx-auto flex items-center justify-center p-2 select-none">
      {/* Background Soft Glow Aura */}
      <div className="absolute inset-4 bg-gradient-to-tr from-emerald-100/60 via-blue-100/40 to-sky-100/50 rounded-3xl filter blur-2xl -z-10 transform scale-95" />

      {/* Floating 50 Ft Coin (Top Left) */}
      <motion.div
        animate={shouldReduceMotion ? undefined : { y: [-4, 6, -4], rotate: [-2, 4, -2] }}
        transition={
          shouldReduceMotion ? undefined : { duration: 4.2, repeat: Infinity, ease: 'easeInOut' }
        }
        className="absolute top-4 left-6 z-20"
      >
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-300 via-amber-400 to-orange-400 p-0.5 shadow-lg border-2 border-white flex items-center justify-center">
          <div className="w-full h-full rounded-full border border-dashed border-amber-100/60 flex flex-col items-center justify-center leading-none text-amber-950">
            <span className="font-extrabold text-base tracking-tight">50</span>
            <span className="text-[9px] font-bold mt-[-1px]">Ft</span>
          </div>
        </div>
      </motion.div>

      {/* Floating Mini 50 Ft Coin (Bottom Right) */}
      <motion.div
        animate={shouldReduceMotion ? undefined : { y: [5, -5, 5], rotate: [4, -3, 4] }}
        transition={
          shouldReduceMotion
            ? undefined
            : { duration: 3.8, repeat: Infinity, ease: 'easeInOut', delay: 0.6 }
        }
        className="absolute bottom-10 right-4 z-20"
      >
        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-amber-300 to-amber-500 p-0.5 shadow-md border-2 border-white flex items-center justify-center">
          <div className="w-full h-full rounded-full border border-dashed border-amber-100/50 flex flex-col items-center justify-center leading-none text-amber-950">
            <span className="font-extrabold text-xs">50</span>
            <span className="text-[7px] font-bold">Ft</span>
          </div>
        </div>
      </motion.div>

      {/* Subtle Eco / Heart Sparkle (Top Right) */}
     

      {/* Main SVG Scene Container */}
      <svg
        viewBox="0 0 540 480"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-xl"
      >
        <defs>
          {/* Machine Gradients */}
          <linearGradient
            id="machineBody"
            x1="160"
            y1="40"
            x2="360"
            y2="440"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#1E8E3E" />
            <stop offset="0.6" stopColor="#137333" />
            <stop offset="1" stopColor="#0B5324" />
          </linearGradient>
          <linearGradient
            id="machineFrontPanel"
            x1="180"
            y1="60"
            x2="340"
            y2="400"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#2BB34B" />
            <stop offset="1" stopColor="#1A8738" />
          </linearGradient>
          <linearGradient
            id="screenGrad"
            x1="190"
            y1="90"
            x2="330"
            y2="190"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#0B1535" />
            <stop offset="1" stopColor="#162758" />
          </linearGradient>
          <linearGradient
            id="feederHole"
            x1="200"
            y1="210"
            x2="320"
            y2="310"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#06101E" />
            <stop offset="1" stopColor="#1A2A44" />
          </linearGradient>

          {/* Blue Bottle */}
          <linearGradient
            id="blueBottleGrad"
            x1="60"
            y1="180"
            x2="140"
            y2="420"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#60A5FA" />
            <stop offset="0.5" stopColor="#246BFD" />
            <stop offset="1" stopColor="#1D4ED8" />
          </linearGradient>

          {/* Purple Bottle */}
          <linearGradient
            id="purpleBottleGrad"
            x1="390"
            y1="190"
            x2="470"
            y2="420"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#C084FC" />
            <stop offset="0.5" stopColor="#8B5CF6" />
            <stop offset="1" stopColor="#6D28D9" />
          </linearGradient>

          {/* Aluminium Can */}
          <linearGradient
            id="canGrad"
            x1="360"
            y1="290"
            x2="420"
            y2="430"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#F3F4F6" />
            <stop offset="0.3" stopColor="#E5E7EB" />
            <stop offset="0.7" stopColor="#9CA3AF" />
            <stop offset="1" stopColor="#6B7280" />
          </linearGradient>

          {/* Receipt Paper */}
          <linearGradient
            id="receiptGrad"
            x1="270"
            y1="320"
            x2="330"
            y2="400"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#FFFFFF" />
            <stop offset="1" stopColor="#F9FAFB" />
          </linearGradient>
        </defs>

        {/* Base Shadow Floor */}
        <ellipse cx="270" cy="445" rx="220" ry="24" fill="#0B1535" fillOpacity="0.08" />
        <ellipse cx="260" cy="442" rx="140" ry="16" fill="#0B1535" fillOpacity="0.1" />

        {/* --- REpont Machine Body --- */}
        <g id="repont-machine">
          {/* Main Enclosure */}
          <rect
            x="170"
            y="50"
            width="180"
            height="375"
            rx="24"
            fill="url(#machineBody)"
            stroke="#34C759"
            strokeWidth="2"
          />

          {/* Light Bevel Edge */}
          <rect x="178" y="58" width="164" height="359" rx="18" fill="url(#machineFrontPanel)" />

          {/* Machine Header Branding Area */}
          <rect x="190" y="70" width="140" height="28" rx="8" fill="#0E441D" />
          <circle cx="205" cy="84" r="6" fill="#34C759" />
          <text
            x="250"
            y="89"
            textAnchor="middle"
            fill="#FFFFFF"
            fontSize="11"
            fontWeight="700"
            fontFamily="system-ui, sans-serif"
            letterSpacing="1"
          >
          
          </text>

          {/* Interactive Screen */}
          <rect
            x="190"
            y="106"
            width="140"
            height="96"
            rx="12"
            fill="url(#screenGrad)"
            stroke="#246BFD"
            strokeWidth="2"
          />

          {/* Screen Content: Donation Active */}
          <circle cx="212" cy="128" r="8" fill="#34C759" />
          <path
            d="M208 128L211 131L216 125"
            stroke="#FFFFFF"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          <text
            x="228"
            y="132"
            fill="#E2E8F0"
            fontSize="10"
            fontWeight="600"
            fontFamily="system-ui, sans-serif"
          >
            Adomány: Ádiért
          </text>

          <rect x="200" y="146" width="120" height="22" rx="6" fill="#246BFD" />
          <text
            x="260"
            y="161"
            textAnchor="middle"
            fill="#FFFFFF"
            fontSize="11"
            fontWeight="800"
            fontFamily="system-ui, sans-serif"
          >
            +50 Ft / palack
          </text>

          <rect x="200" y="174" width="70" height="14" rx="4" fill="#1E293B" />
          <text x="235" y="184" textAnchor="middle" fill="#38BDF8" fontSize="8" fontWeight="700">
            QR Beolvasva ✓
          </text>
          <circle cx="310" cy="181" r="5" fill="#34C759" />

          {/* Central Bottle Return Funnel / Hole */}
          <rect
            x="196"
            y="212"
            width="128"
            height="114"
            rx="20"
            fill="url(#feederHole)"
            stroke="#0E3D1A"
            strokeWidth="3"
          />

          {/* Glowing Insertion Ring */}
          <circle
            cx="260"
            cy="269"
            r="44"
            stroke="#34C759"
            strokeWidth="3.5"
            strokeDasharray="6 4"
          />
          <circle cx="260" cy="269" r="36" fill="#0A1628" />

          {/* Animated Arrow toward hole */}
          <path
            d="M260 252V278M252 270L260 278L268 270"
            stroke="#34C759"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Machine Lower Slot & Status */}
          <rect x="194" y="340" width="132" height="16" rx="4" fill="#0B2E15" />
          <rect x="210" y="346" width="40" height="4" rx="2" fill="#34C759" />
          <rect x="270" y="346" width="40" height="4" rx="2" fill="#E2E8F0" opacity="0.6" />

          {/* Receipt Eject Slot */}
          <rect x="264" y="364" width="56" height="5" rx="2" fill="#061A0C" />

          {/* Emerged Receipt Paper */}
          <g id="receipt-paper">
            <path
              d="M270 368H314V424L307 419L299 424L292 419L285 424L278 419L270 424V368Z"
              fill="url(#receiptGrad)"
              stroke="#E5E7EB"
              strokeWidth="1.5"
            />
            {/* Receipt Text / Barcode Lines */}
            <text
              x="292"
              y="380"
              textAnchor="middle"
              fill="#0B1535"
              fontSize="6.5"
              fontWeight="800"
            >
              
            </text>
            <text x="292" y="388" textAnchor="middle" fill="#246BFD" fontSize="6" fontWeight="700">
              
            </text>
            <line
              x1="275"
              y1="393"
              x2="309"
              y2="393"
              stroke="#CBD5E1"
              strokeWidth="1"
              strokeDasharray="2 1"
            />
            <text x="292" y="401" textAnchor="middle" fill="#0B1535" fontSize="7" fontWeight="800">
              50 Ft
            </text>
            <rect x="276" y="405" width="32" height="6" fill="#0B1535" opacity="0.8" rx="1" />
          </g>

          {/* Machine Feet */}
          <rect x="186" y="420" width="30" height="10" rx="3" fill="#0E3D1A" />
          <rect x="304" y="420" width="30" height="10" rx="3" fill="#0E3D1A" />
        </g>

        {/* --- LEFT: Blue Bottle Character --- */}
        <g id="blue-bottle" transform="translate(10, 0)">
          {/* Cap */}
          <rect x="80" y="160" width="24" height="14" rx="4" fill="#1E40AF" />
          <rect x="83" y="156" width="18" height="5" rx="1.5" fill="#3B82F6" />

          {/* Body */}
          <path
            d="M84 174H100C106 174 112 178 116 182L124 190C128 194 132 200 132 208V390C132 402 122 412 110 412H74C62 412 52 402 52 390V208C52 200 56 194 60 190L68 182C72 178 78 174 84 174Z"
            fill="url(#blueBottleGrad)"
          />

          {/* Highlight Specular */}
          <path
            d="M60 210C60 204 63 198 68 194L74 189V180H78V192L72 197C68 200 66 205 66 210V380C66 392 72 398 80 400V404C68 402 60 392 60 380V210Z"
            fill="#FFFFFF"
            fillOpacity="0.45"
          />

          {/* Face */}
          <circle cx="80" cy="235" r="4.5" fill="#0B1535" />
          <circle cx="82" cy="233" r="1.5" fill="#FFFFFF" />
          <circle cx="104" cy="235" r="4.5" fill="#0B1535" />
          <circle cx="106" cy="233" r="1.5" fill="#FFFFFF" />
          <circle cx="72" cy="242" r="4" fill="#FF8497" fillOpacity="0.5" />
          <circle cx="112" cy="242" r="4" fill="#FF8497" fillOpacity="0.5" />
          <path
            d="M86 244C86 250 98 250 98 244"
            stroke="#0B1535"
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          {/* Label */}
          <rect x="58" y="260" width="68" height="74" rx="8" fill="#FFFFFF" />
          <rect
            x="62"
            y="264"
            width="60"
            height="66"
            rx="6"
            stroke="#60A5FA"
            strokeWidth="1.5"
            strokeDasharray="3 2"
          />
          <text x="92" y="284" textAnchor="middle" fill="#246BFD" fontSize="10" fontWeight="800">
            50 Ft
          </text>
          <path
            d="M72 294H112M72 302H104M72 310H98"
            stroke="#93C5FD"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <circle cx="106" cy="310" r="3" fill="#246BFD" />
        </g>

        {/* --- RIGHT: Purple Bottle & Aluminium Can --- */}
        <g id="purple-bottle">
          {/* Purple Cap */}
          <rect x="424" y="170" width="22" height="14" rx="4" fill="#5B21B6" />
          <rect x="427" y="166" width="16" height="5" rx="1.5" fill="#A855F7" />

          {/* Purple Body */}
          <path
            d="M428 184H442C448 184 454 188 458 192L464 198C468 202 472 208 472 216V375C472 386 463 395 452 395H418C407 395 398 386 398 375V216C398 208 402 202 406 198L412 192C416 188 422 184 428 184Z"
            fill="url(#purpleBottleGrad)"
          />

          {/* Face */}
          <circle cx="424" cy="225" r="4" fill="#0B1535" />
          <circle cx="425.5" cy="223.5" r="1.5" fill="#FFFFFF" />
          <circle cx="446" cy="225" r="4" fill="#0B1535" />
          <circle cx="447.5" cy="223.5" r="1.5" fill="#FFFFFF" />
          <circle cx="417" cy="231" r="3.5" fill="#F472B6" fillOpacity="0.5" />
          <circle cx="453" cy="231" r="3.5" fill="#F472B6" fillOpacity="0.5" />
          <path
            d="M430 232C430 236 440 236 440 232"
            stroke="#0B1535"
            strokeWidth="2"
            strokeLinecap="round"
          />

          {/* Label */}
          <rect x="406" y="250" width="58" height="60" rx="8" fill="#FFFFFF" />
          <text x="435" y="272" textAnchor="middle" fill="#8B5CF6" fontSize="9" fontWeight="800">
            50 Ft
          </text>
          <path
            d="M416 282H454M416 290H446"
            stroke="#DDD6FE"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </g>

        {/* --- FRONT RIGHT: Aluminium Can --- */}
        <g id="alu-can">
          {/* Can Rim */}
          <ellipse
            cx="376"
            cy="320"
            rx="26"
            ry="7"
            fill="#E5E7EB"
            stroke="#9CA3AF"
            strokeWidth="1.5"
          />
          <ellipse cx="376" cy="320" rx="20" ry="5" fill="#9CA3AF" />

          {/* Can Tab */}
          <rect
            x="372"
            y="316"
            width="8"
            height="7"
            rx="2"
            fill="#D1D5DB"
            stroke="#6B7280"
            strokeWidth="1"
          />

          {/* Can Body */}
          <path
            d="M350 320V410C350 422 362 428 376 428C390 428 402 422 402 410V320"
            fill="url(#canGrad)"
          />

          {/* Can Face */}
          <circle cx="368" cy="354" r="3.5" fill="#0B1535" />
          <circle cx="384" cy="354" r="3.5" fill="#0B1535" />
          <path
            d="M372 362C372 365 380 365 380 362"
            stroke="#0B1535"
            strokeWidth="2"
            strokeLinecap="round"
          />

          {/* Can Graphic Logo */}
          <rect x="356" y="372" width="40" height="24" rx="4" fill="#EF4444" />
          <text x="376" y="387" textAnchor="middle" fill="#FFFFFF" fontSize="8" fontWeight="800">
            50 Ft
          </text>
        </g>

        {/* Small Friendly Green Bottle Mascot Standing in Front */}
        <g id="front-mascot" transform="translate(110, 270) scale(0.65)">
          {/* Cap */}
          <rect x="64" y="12" width="32" height="18" rx="5" fill="#137333" />
          {/* Body */}
          <path
            d="M68 30H92V48C92 56 100 62 108 66L116 70C122 73 126 79 126 86V184C126 198 114 210 100 210H60C46 210 34 198 34 184V86C34 79 38 73 44 70L52 66C60 62 68 56 68 48V30Z"
            fill="#34C759"
          />
          {/* Face */}
          <circle cx="64" cy="94" r="5" fill="#0B1535" />
          <circle cx="66" cy="92" r="1.8" fill="#FFFFFF" />
          <circle cx="96" cy="94" r="5" fill="#0B1535" />
          <circle cx="98" cy="92" r="1.8" fill="#FFFFFF" />
          <circle cx="54" cy="101" r="5" fill="#FF8497" fillOpacity="0.6" />
          <circle cx="106" cy="101" r="5" fill="#FF8497" fillOpacity="0.6" />
          <path
            d="M72 102C72 108 88 108 88 102"
            stroke="#0B1535"
            strokeWidth="3"
            strokeLinecap="round"
          />
          {/* Heart on chest */}
          <circle cx="80" cy="140" r="16" fill="#FFFFFF" />
          <path
            d="M80 148L73 141C70 138 70 134 73 131C76 128 80 128 80 131C80 128 84 128 87 131C90 134 90 138 87 141L80 148Z"
            fill="#246BFD"
          />
        </g>
      </svg>
    </div>
  );
};
