import React from "react";

/**
 * Pure-SVG visual representation of an image captcha.
 * Renders the code with per-character rotation, skew, jitter,
 * random noise dots, and distortion lines.
 */
export default function CaptchaImage({ code = "A7KP5N", width = 340, height = 120 }) {
  const uid = React.useId();
  const chars = Array.from(code);

  // Deterministic pseudo-random so the demo stays stable
  const seed = (i) => {
    const x = Math.sin(i * 9301 + 49297) * 233280;
    return x - Math.floor(x);
  };

  // Noise dots
  const dots = Array.from({ length: 90 }).map((_, i) => ({
    x: seed(i + 1) * width,
    y: seed(i + 200) * height,
    r: 0.6 + seed(i + 400) * 1.6,
    o: 0.15 + seed(i + 600) * 0.55,
  }));

  // Wavy distortion lines
  const lines = Array.from({ length: 4 }).map((_, i) => {
    const y = 20 + i * 25 + seed(i + 10) * 10;
    const cx = width / 2 + (seed(i + 50) - 0.5) * 40;
    const cy = y + (seed(i + 70) - 0.5) * 40;
    return `M 0 ${y} Q ${cx} ${cy} ${width} ${y + (seed(i + 90) - 0.5) * 20}`;
  });

  const palette = ["#00E5FF", "#00D2FF", "#66F0FF", "#7ED4FF", "#9AE9FF"];

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      height={height}
      role="img"
      aria-label={`Captcha image`}
      style={{
        borderRadius: 12,
        background:
          "linear-gradient(180deg, #0A0A0E 0%, #141418 100%)",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <defs>
        <pattern id={`${uid}-grid`} width="16" height="16" patternUnits="userSpaceOnUse">
          <path
            d="M 16 0 L 0 0 0 16"
            fill="none"
            stroke="rgba(0,210,255,0.08)"
            strokeWidth="0.5"
          />
        </pattern>
      </defs>

      <rect width={width} height={height} fill={`url(#${uid}-grid)`} />

      {/* Distortion lines */}
      {lines.map((d, i) => (
        <path
          key={i}
          d={d}
          fill="none"
          stroke={palette[i % palette.length]}
          strokeWidth={1.2}
          opacity={0.35}
        />
      ))}

      {/* Noise dots */}
      {dots.map((d, i) => (
        <circle
          key={i}
          cx={d.x}
          cy={d.y}
          r={d.r}
          fill={palette[i % palette.length]}
          opacity={d.o}
        />
      ))}

      {/* Characters */}
      {chars.map((ch, i) => {
        const step = width / (chars.length + 1);
        const x = step * (i + 1);
        const y = height / 2 + (seed(i + 2) - 0.5) * 18;
        const rot = (seed(i + 3) - 0.5) * 40;
        const skew = (seed(i + 4) - 0.5) * 18;
        const size = 44 + (seed(i + 5) - 0.5) * 10;
        const color = palette[i % palette.length];
        return (
          <g
            key={i}
            transform={`translate(${x} ${y}) rotate(${rot}) skewX(${skew})`}
          >
            <text
              textAnchor="middle"
              dominantBaseline="middle"
              fontFamily="'Chivo', ui-sans-serif, system-ui"
              fontWeight="900"
              fontSize={size}
              fill={color}
              style={{
                filter:
                  "drop-shadow(0 0 8px rgba(0,229,255,0.55)) drop-shadow(0 2px 4px rgba(0,0,0,0.6))",
              }}
            >
              {ch}
            </text>
          </g>
        );
      })}

      {/* Foreground veil */}
      <rect
        width={width}
        height={height}
        fill="url(#noise-veil)"
        opacity="0.04"
        pointerEvents="none"
      />
    </svg>
  );
}
