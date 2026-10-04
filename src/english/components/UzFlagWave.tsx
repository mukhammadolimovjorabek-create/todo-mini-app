import React, { useId } from 'react';

const SLICES = 15;
// fewer = lighter for old phones (e.g. 10)
const STEP = 60 / SLICES;
// width of one slice in flag units
const STARS: [number, number][] = [
  [13.5, 2.2], [16, 2.2], [18.5, 2.2],
  [12.5, 4.8], [15, 4.8], [17.5, 4.8],
  [20, 4.8],
  [11.5, 7.4], [14, 7.4], [16.5, 7.4],
  [19, 7.4], [21.5, 7.4],
];

export function UzFlagWave({ width = 42 }: { width?: number }) {
  const id = useId().replace(/:/g, '');
  const height = (width * 38) / 60;

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 -4 60 38"
      aria-hidden="true"
      className="uz-flag block"
    >
      <defs>
        <g id={`${id}-flag`}>
          <rect width="60" height="10" fill="#0099B5" />
          <rect y="10" width="60" height=".7" fill="#CE1126" />
          <rect y="10.7" width="60" height="8.6" fill="#FFFFFF" />
          <rect y="19.3" width="60" height=".7" fill="#CE1126" />
          <rect y="20" width="60" height="10" fill="#1EB53A" />
          <circle cx="8" cy="5" r="3.4" fill="#FFFFFF" />
          <circle cx="9.3" cy="4.6" r="3" fill="#0099B5" />
          {STARS.map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r=".85" fill="#FFFFFF" />
          ))}
        </g>
      </defs>
      {Array.from({ length: SLICES }, (_, i) => {
        const amp = (0.5 + (2.3 * i) / (SLICES - 1)).toFixed(2); // bigger toward the free edge
        const delay = (-i * 0.11).toFixed(2); // phase shift per slice
        const x = i * STEP;
        return (
          <svg
            key={i}
            x={x}
            y={-4}
            width={STEP + 0.5}
            height="38"
            viewBox={`${x} -4 ${STEP + 0.5} 38`}
          >
            <g
              className="uz-flag__slice"
              style={{ ['--a' as string]: amp, animationDelay: `${delay}s` } as React.CSSProperties}
            >
              <use href={`#${id}-flag`} />
              <rect
                x={x}
                y="0"
                width={STEP + 0.5}
                height="30"
                fill="#000"
                className="uz-flag__shade"
                style={{ animationDelay: `${delay}s` }}
              />
            </g>
          </svg>
        );
      })}
    </svg>
  );
}
