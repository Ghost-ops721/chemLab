import React from "react";
import { useCurrentFrame, interpolate } from "remotion";
import { colors } from "../theme";

/** A stylized Erlenmeyer flask matching the product's glassware silhouette. */
export const Vessel: React.FC<{
  width?: number;
  fillColor?: string;
  fillLevel?: number; // 0..1
  wobble?: boolean;
}> = ({ width = 220, fillColor = colors.teal, fillLevel = 0.55, wobble }) => {
  const frame = useCurrentFrame();
  const meniscus = Math.sin(frame / 6) * 3;
  const rotate = wobble ? Math.sin(frame / 4) * 1.4 : 0;
  const h = width * 1.35;
  const fillTop = h * (1 - fillLevel) + 30;

  return (
    <svg
      width={width}
      height={h}
      viewBox="0 0 200 270"
      style={{
        filter: "drop-shadow(0 18px 30px rgba(0,0,0,0.35))",
        transform: `rotate(${rotate}deg)`,
      }}
    >
      <defs>
        <clipPath id="flaskClip">
          <path d="M78 20 H122 V80 L172 220 Q180 240 160 240 H40 Q20 240 28 220 L78 80 Z" />
        </clipPath>
        <linearGradient id="glassSheen" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="rgba(255,255,255,0.55)" />
          <stop offset="45%" stopColor="rgba(255,255,255,0.08)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0.02)" />
        </linearGradient>
      </defs>

      <rect
        x={0}
        y={(fillTop / 270) * 270}
        width={200}
        height={270}
        fill={fillColor}
        opacity={0.92}
        clipPath="url(#flaskClip)"
      />
      <path
        d={`M20 ${fillTop} Q60 ${fillTop + meniscus} 100 ${fillTop} T180 ${fillTop}`}
        stroke="rgba(255,255,255,0.5)"
        strokeWidth={2}
        fill="none"
        clipPath="url(#flaskClip)"
      />

      <path
        d="M78 20 H122 V80 L172 220 Q180 240 160 240 H40 Q20 240 28 220 L78 80 Z"
        fill="url(#glassSheen)"
        stroke={colors.ink}
        strokeWidth={5}
        strokeLinejoin="round"
      />
      <rect x={74} y={12} width={52} height={14} rx={4} fill={colors.ink} />
    </svg>
  );
};
