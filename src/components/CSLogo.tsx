import React from 'react';

// CS Logo SVG — exact recreation of shapes and distances from reference photo
const CSLogo: React.FC<{ size?: number }> = ({ size = 40 }) => {
  const width = size * 1.5;
  const height = size;

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 150 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Exact gradient for 'C': Cyan (#00F2FE) -> Purple -> Coral/Red (#FF2A54) */}
        <linearGradient id="cs-grad-c" x1="20%" y1="10%" x2="80%" y2="90%">
          <stop offset="0%" stopColor="#00F2FE" />
          <stop offset="65%" stopColor="#7F00FF" />
          <stop offset="100%" stopColor="#FF2A54" />
        </linearGradient>
        {/* Exact gradient for 'S': Magenta (#E600FA) -> Cyan Blue (#00C9FF) */}
        <linearGradient id="cs-grad-s" x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%" stopColor="#E600FA" />
          <stop offset="45%" stopColor="#7F00FF" />
          <stop offset="100%" stopColor="#00F2FE" />
        </linearGradient>
      </defs>

      {/* C Letter: Center at X:42, Radius:31, Stroke: 15. Smooth rounded arch */}
      <path
        d="M 65 28 A 30 30 0 1 0 65 72"
        stroke="url(#cs-grad-c)"
        strokeWidth="15"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />

      {/* S Letter: Center at X:106. Wide and elegant, matching the photo exactly */}
      <path
        d="M 125 28 
           C 125 15, 87 15, 87 32 
           C 87 48, 125 48, 125 66 
           C 125 83, 87 83, 87 71"
        stroke="url(#cs-grad-s)"
        strokeWidth="15"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
};

export default CSLogo;
export { CSLogo };
