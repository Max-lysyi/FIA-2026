import React from 'react';

// CS Logo SVG — gradient teal→purple→pink, interlinked C and S letterform
const CSLogo: React.FC<{ size?: number }> = ({ size = 40 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <linearGradient id="cs-grad-c" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#00F2FE" />
        <stop offset="60%" stopColor="#818CF8" />
        <stop offset="100%" stopColor="#F43F5E" />
      </linearGradient>
      <linearGradient id="cs-grad-s" x1="100%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#F43F5E" />
        <stop offset="40%" stopColor="#818CF8" />
        <stop offset="100%" stopColor="#00F2FE" />
      </linearGradient>
    </defs>

    {/* C letter — bold rounded arc */}
    <path
      d="M48 18 C24 18 10 32 10 50 C10 68 24 82 48 82 C56 82 63 79 68 75"
      stroke="url(#cs-grad-c)"
      strokeWidth="12"
      strokeLinecap="round"
      fill="none"
    />

    {/* S letter — bold S-curve */}
    <path
      d="M55 28 C68 20 90 24 88 38 C86 48 68 48 62 52 C54 57 50 64 62 72 C70 78 86 76 90 68"
      stroke="url(#cs-grad-s)"
      strokeWidth="12"
      strokeLinecap="round"
      fill="none"
    />
  </svg>
);

export default CSLogo;
