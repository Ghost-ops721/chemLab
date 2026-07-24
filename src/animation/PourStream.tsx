"use client";

import { useId } from "react";
import { usePrefersReducedMotion } from "./useFxClock";

export interface StreamPoint {
  x: number;
  y: number;
}

interface Props {
  from: StreamPoint;
  to: StreamPoint;
  color: string;
  /** Optional layered band colors leaving the source (immiscible pour). */
  layerColors?: string[];
  /** Restart key — typically pourAt / transferAt; remount via key from parent */
  activeKey: number | string;
  className?: string;
  /** When false, parent is outside stream phase — render nothing. */
  streaming?: boolean;
}

/**
 * Desk- or vessel-local SVG pour ribbon + droplets along a cubic arc.
 * Lifetime / phase is owned by the parent (stream only during stream phase).
 */
export function PourStream({
  from,
  to,
  color,
  layerColors,
  activeKey,
  className = "",
  streaming = true,
}: Props) {
  const reduced = usePrefersReducedMotion();
  const gradId = useId().replace(/:/g, "");

  if (!streaming) return null;
  if (reduced) {
    // Static end-pose cue: short ribbon stub + bloom at mouth
    return (
      <svg
        key={activeKey}
        className={`pointer-events-none absolute inset-0 h-full w-full overflow-visible ${className}`}
        aria-hidden
      >
        <line
          x1={from.x}
          y1={from.y}
          x2={(from.x + to.x) / 2}
          y2={(from.y + to.y) / 2}
          stroke={color}
          strokeWidth={6}
          strokeLinecap="round"
          opacity={0.55}
        />
        <circle cx={to.x} cy={to.y} r={10} fill={color} opacity={0.4} />
      </svg>
    );
  }

  const midX = (from.x + to.x) / 2;
  const midY = Math.min(from.y, to.y) - Math.abs(to.x - from.x) * 0.35 - 24;
  const d = `M${from.x} ${from.y} Q${midX} ${midY} ${to.x} ${to.y}`;

  const bands =
    layerColors && layerColors.length >= 2
      ? layerColors.slice(0, 3)
      : [color];

  const droplets = Array.from({ length: 11 }).map((_, i) => {
    const t = (i + 1) / 12;
    const p = quadPoint(from, { x: midX, y: midY }, to, t);
    return {
      ...p,
      i,
      r: 2.8 + (i % 3) * 1.2,
      fill: bands[i % bands.length]!,
    };
  });

  return (
    <svg
      key={activeKey}
      className={`pointer-events-none absolute inset-0 h-full w-full overflow-visible ${className}`}
      aria-hidden
    >
      <defs>
        <linearGradient id={`stream-${gradId}`} x1="0" y1="0" x2="0" y2="1">
          {bands.length === 1 ? (
            <>
              <stop offset="0%" stopColor={color} stopOpacity={0.35} />
              <stop offset="35%" stopColor={color} stopOpacity={1} />
              <stop offset="100%" stopColor={color} stopOpacity={0.7} />
            </>
          ) : (
            bands.map((c, i) => (
              <stop
                key={i}
                offset={`${(i / (bands.length - 1)) * 100}%`}
                stopColor={c}
                stopOpacity={0.95}
              />
            ))
          )}
        </linearGradient>
        <filter id={`stream-glow-${gradId}`} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="2.2" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {/* Thicker ribbon from tilted lip */}
      <path
        d={d}
        fill="none"
        stroke={`url(#stream-${gradId})`}
        strokeWidth={11}
        strokeLinecap="round"
        className="lab-pour-ribbon"
        filter={`url(#stream-glow-${gradId})`}
      />
      <path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth={5}
        strokeLinecap="round"
        opacity={0.95}
        className="lab-pour-ribbon"
        style={{ animationDelay: "0.05s" }}
      />
      {droplets.map((drop) => (
        <circle
          key={`${activeKey}-d-${drop.i}`}
          cx={drop.x}
          cy={drop.y}
          r={drop.r}
          fill={drop.fill}
          className="lab-pour-drop"
          style={{ animationDelay: `${drop.i * 0.045}s` }}
        />
      ))}
      <circle
        cx={to.x}
        cy={to.y}
        r={16}
        fill={color}
        className="lab-pour-bloom"
        opacity={0.6}
      />
    </svg>
  );
}

/** Local pour stream inside a vessel (lip → liquid surface), viewBox 0 0 100 140 */
export function VesselPourStream({
  lip,
  mouthY,
  color,
  activeKey,
  fillPct,
  streaming = true,
  layerColors,
}: {
  lip: { x: number; y: number };
  mouthY: number;
  color: string;
  activeKey: number | string;
  fillPct: number;
  streaming?: boolean;
  layerColors?: string[];
}) {
  const reduced = usePrefersReducedMotion();
  if (!streaming) return null;
  if (reduced) return null;

  const surfaceY = 30 + 92 * (1 - Math.min(82, fillPct) / 100);
  const to = { x: 50, y: Math.max(mouthY + 8, surfaceY) };
  // Stream from tilted lip (offset matches card pour pose)
  const from = { x: lip.x - 8, y: lip.y + 4 };
  const ctrl = { x: 72, y: (from.y + to.y) / 2 - 12 };
  const d = `M${from.x} ${from.y} Q${ctrl.x} ${ctrl.y} ${to.x} ${to.y}`;
  const band = layerColors?.[0] ?? color;

  return (
    <g key={activeKey} className="pointer-events-none">
      <path
        d={d}
        fill="none"
        stroke={band}
        strokeWidth={6.5}
        strokeLinecap="round"
        opacity={0.95}
        className="lab-pour-ribbon"
      />
      <path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth={2.5}
        strokeLinecap="round"
        opacity={0.7}
        className="lab-pour-ribbon"
        style={{ animationDelay: "0.06s" }}
      />
      {Array.from({ length: 8 }).map((_, i) => {
        const t = (i + 1) / 9;
        const p = quadPoint(from, ctrl, to, t);
        return (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={2.2 + (i % 3)}
            fill={layerColors?.[i % (layerColors.length || 1)] ?? color}
            className="lab-pour-drop"
            style={{ animationDelay: `${i * 0.04}s` }}
          />
        );
      })}
    </g>
  );
}

function quadPoint(
  a: StreamPoint,
  c: StreamPoint,
  b: StreamPoint,
  t: number,
): StreamPoint {
  const u = 1 - t;
  return {
    x: u * u * a.x + 2 * u * t * c.x + t * t * b.x,
    y: u * u * a.y + 2 * u * t * c.y + t * t * b.y,
  };
}
