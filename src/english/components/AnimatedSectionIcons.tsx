import React from 'react';

/**
 * 1) Speaking waveform: 7 bars SVG native animation (SMIL)
 * Each bar has its own duration and stretches from vertical center (y=22).
 */
export const SpeakingWaveform: React.FC<{ width?: number; height?: number; className?: string }> = ({
  width = 65,
  height = 44,
  className = '',
}) => (
  <svg
    width={width}
    height={height}
    viewBox="0 0 65 44"
    fill="#C5F82A"
    aria-hidden="true"
    className={className}
  >
    <rect x="0" y="15" width="5" height="14" rx="2.5">
      <animate attributeName="height" values="14;34;14" dur="1.1s" repeatCount="indefinite" />
      <animate attributeName="y" values="15;5;15" dur="1.1s" repeatCount="indefinite" />
    </rect>
    <rect x="10" y="7" width="5" height="30" rx="2.5">
      <animate attributeName="height" values="30;12;30" dur="1.3s" repeatCount="indefinite" />
      <animate attributeName="y" values="7;16;7" dur="1.3s" repeatCount="indefinite" />
    </rect>
    <rect x="20" y="12" width="5" height="20" rx="2.5">
      <animate attributeName="height" values="20;38;20" dur="1s" repeatCount="indefinite" />
      <animate attributeName="y" values="12;3;12" dur="1s" repeatCount="indefinite" />
    </rect>
    <rect x="30" y="1" width="5" height="42" rx="2.5">
      <animate attributeName="height" values="42;18;42" dur="1.4s" repeatCount="indefinite" />
      <animate attributeName="y" values="1;13;1" dur="1.4s" repeatCount="indefinite" />
    </rect>
    <rect x="40" y="9" width="5" height="26" rx="2.5">
      <animate attributeName="height" values="26;40;26" dur="1.2s" repeatCount="indefinite" />
      <animate attributeName="y" values="9;2;9" dur="1.2s" repeatCount="indefinite" />
    </rect>
    <rect x="50" y="5" width="5" height="34" rx="2.5">
      <animate attributeName="height" values="34;14;34" dur="1.5s" repeatCount="indefinite" />
      <animate attributeName="y" values="5;15;5" dur="1.5s" repeatCount="indefinite" />
    </rect>
    <rect x="60" y="14" width="5" height="16" rx="2.5">
      <animate attributeName="height" values="16;36;16" dur="1.1s" repeatCount="indefinite" />
      <animate attributeName="y" values="14;4;14" dur="1.1s" repeatCount="indefinite" />
    </rect>
  </svg>
);

/**
 * 2) Pulse ring around the Reading / Writing icon tile (52x52)
 */
export const TilePulseRing: React.FC<{ color?: string }> = ({ color = '#6CC7FF' }) => (
  <svg
    width="52"
    height="52"
    viewBox="0 0 52 52"
    fill="none"
    stroke={color}
    strokeWidth="1.5"
    style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible', pointerEvents: 'none' }}
    aria-hidden="true"
  >
    <rect x="1" y="1" width="50" height="50" rx="15" opacity="0">
      <animate attributeName="opacity" values=".55;0" dur="2.4s" repeatCount="indefinite" />
      <animate attributeName="x" values="1;-9" dur="2.4s" repeatCount="indefinite" />
      <animate attributeName="y" values="1;-9" dur="2.4s" repeatCount="indefinite" />
      <animate attributeName="width" values="50;70" dur="2.4s" repeatCount="indefinite" />
      <animate attributeName="height" values="50;70" dur="2.4s" repeatCount="indefinite" />
      <animate attributeName="rx" values="15;22" dur="2.4s" repeatCount="indefinite" />
    </rect>
  </svg>
);

/**
 * 3) Reading: book with a page that turns over to the left
 */
export const ReadingAnimatedBook: React.FC<{ size?: number }> = ({ size = 32 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="#6CC7FF"
    strokeWidth="1.7"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {/* book outline + spine */}
    <path d="M12 6.5C10.3 5 7.6 4.3 3.5 4.3v13.4c4.1 0 6.8.7 8.5 2.2 1.7-1.5 4.4-2.2 8.5-2.2V4.3c-4.1 0-6.8.7-8.5 2.2zM12 6.5v13.4" />
    {/* static text lines on both pages */}
    <path opacity=".55" d="M6 8.3h3.4M6 11.3h3.4M6 14.3h2.4M14.6 8.3H18M14.6 11.3H18M14.6 14.3H17" />
    {/* the turning page */}
    <polygon fill="rgba(108,199,255,.35)" points="12,6.5 20.5,4.3 20.5,17.7 12,19.9">
      <animate
        attributeName="points"
        dur="3.2s"
        repeatCount="indefinite"
        keyTimes="0;.1;.2;.3;.4;.8;.81;1"
        values="12,6.5 20.5,4.3 20.5,17.7 12,19.9;
                12,6.5 16.2,3.2 16.2,16.6 12,19.9;
                12,6.5 12,4.3 12,17.7 12,19.9;
                12,6.5 7.8,3.2 7.8,16.6 12,19.9;
                12,6.5 3.5,4.3 3.5,17.7 12,19.9;
                12,6.5 3.5,4.3 3.5,17.7 12,19.9;
                12,6.5 20.5,4.3 20.5,17.7 12,19.9;
                12,6.5 20.5,4.3 20.5,17.7 12,19.9"
      />
      <animate
        attributeName="opacity"
        dur="3.2s"
        repeatCount="indefinite"
        keyTimes="0;.5;.6;.9;1"
        values="1;1;0;0;1"
      />
    </polygon>
  </svg>
);

/**
 * 4) Writing: pencil drawing a wavy handwriting line
 */
export const WritingAnimatedPencil: React.FC<{ size?: number }> = ({ size = 32 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="#A99BFF"
    strokeWidth="1.7"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {/* handwriting line, drawn with pathLength normalization */}
    <path
      pathLength="1"
      strokeDasharray="1"
      strokeDashoffset="1"
      d="M3 19c1.1-2.6 2.2-2.6 3.3 0s2.2 2.6 3.3 0 2.2-2.6 3.3 0"
    >
      <animate
        attributeName="stroke-dashoffset"
        dur="3.2s"
        repeatCount="indefinite"
        keyTimes="0;.7;1"
        values="1;0;0"
      />
      <animate
        attributeName="opacity"
        dur="3.2s"
        repeatCount="indefinite"
        keyTimes="0;.88;1"
        values="1;1;0"
      />
    </path>
    {/* pencil: tip sits on the start of the line, then follows the wave */}
    <g transform="translate(3 19)">
      <g>
        <path
          transform="scale(.55)"
          strokeWidth="2.8"
          fill="rgba(169,155,255,.25)"
          d="M13.5-16.5a2.121 2.121 0 0 1 3 3L4-1l-4 1 1-4z"
        />
        <animateTransform
          attributeName="transform"
          type="translate"
          dur="3.2s"
          repeatCount="indefinite"
          keyTimes="0;.117;.233;.35;.467;.583;.7;.88;1"
          values="0 0;1.65 -1;3.3 0;4.95 1;6.6 0;8.25 -1;9.9 0;9.9 0;0 0"
        />
      </g>
    </g>
  </svg>
);
