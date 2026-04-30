import React from "react";

export const AuthixLogo = ({ size = 40, showText = false, className = "" }) => {
  const id = React.useId();
  return (
    <div className={`flex items-center gap-3 ${className}`} data-testid="authix-logo">
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Authix"
      >
        <defs>
          <linearGradient id={`${id}-grad`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00E5FF" />
            <stop offset="100%" stopColor="#007AFF" />
          </linearGradient>
          <linearGradient id={`${id}-shine`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.35)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </linearGradient>
          <filter id={`${id}-glow`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="1.6" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Shield */}
        <path
          d="M32 3 L58 12 V30 C58 46 46 56 32 61 C18 56 6 46 6 30 V12 Z"
          fill="#0A0A0E"
          stroke={`url(#${id}-grad)`}
          strokeWidth="2.5"
          filter={`url(#${id}-glow)`}
        />
        <path
          d="M32 3 L58 12 V30 C58 46 46 56 32 61 Z"
          fill={`url(#${id}-shine)`}
          opacity="0.12"
        />

        {/* Stylized A */}
        <path
          d="M22 44 L32 16 L42 44 M26 36 H38"
          fill="none"
          stroke={`url(#${id}-grad)`}
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter={`url(#${id}-glow)`}
        />

        {/* Lock dot */}
        <circle cx="32" cy="50" r="2.4" fill="#00E5FF" filter={`url(#${id}-glow)`} />
      </svg>
      {showText && (
        <span
          className="chivo font-black tracking-tight text-xl text-white"
          style={{ letterSpacing: "-0.04em" }}
        >
          AUTHIX
        </span>
      )}
    </div>
  );
};

export default AuthixLogo;
