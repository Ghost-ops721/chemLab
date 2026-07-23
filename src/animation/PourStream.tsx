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
  /** Restart key — typically pourAt / transferAt; remount via key from parent */
  activeKey: number | string;
  className?: string;
}

/**
 * Desk- or vessel-local SVG pour ribbon + droplets along a cubic arc.
 * Lifetime is owned by the parent (unmount when FX window ends).
 */
export function PourStream({
  from,
  to,
  color,
  activeKey,
  className = "",
}: Props) {
  const reduced = usePrefersReducedMotion();
  const gradId = useId().replace(/:/g, "");

  if (reduced) return null;

  const midX = (from.x + to.x) / 2;
  const midY = Math.min(from.y, to.y) - Math.abs(to.x - from.x) * 0.35 - 24;
  const d = `M${from.x} ${from.y} Q${midX} ${midY} ${to.x} ${to.y}`;

  const droplets = Array.from({ length: 7 }).map((_, i) => {
    const t = (i + 1) / 8;
    const p = quadPoint(from, { x: midX, y: midY }, to, t);
    return { ...p, i, r: 2.2 + (i % 3) };
  });

  return (
    <svg
      key={activeKey}
      className={`pointer-events-none absolute inset-0 h-full w-full overflow-visible ${className}`}
      aria-hidden
    >
      <defs>
        <linearGradient id={`stream-${gradId}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.15} />
          <stop offset="40%" stopColor={color} stopOpacity={0.95} />
          <stop offset="100%" stopColor={color} stopOpacity={0.5} />
        </linearGradient>
      </defs>
      <path
        d={d}
        fill="none"
        stroke={`url(#stream-${gradId})`}
        strokeWidth={5}
        strokeLinecap="round"
        className="lab-pour-ribbon"
      />
      <path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        opacity={0.85}
        className="lab-pour-ribbon"
        style={{ animationDelay: "0.05s" }}
      />
      {droplets.map((drop) => (
        <circle
          key={`${activeKey}-d-${drop.i}`}
          cx={drop.x}
          cy={drop.y}
          r={drop.r}
          fill={color}
          className="lab-pour-drop"
          style={{ animationDelay: `${drop.i * 0.05}s` }}
        />
      ))}
      <circle
        cx={to.x}
        cy={to.y}
        r={10}
        fill={color}
        className="lab-pour-bloom"
        opacity={0.45}
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
}: {
  lip: { x: number; y: number };
  mouthY: number;
  color: string;
  activeKey: number | string;
  fillPct: number;
}) {
  const reduced = usePrefersReducedMotion();
  if (reduced) return null;

  const surfaceY = 30 + 92 * (1 - Math.min(82, fillPct) / 100);
  const to = { x: 50, y: Math.max(mouthY + 8, surfaceY) };
  const from = { x: lip.x - 6, y: lip.y + 2 };
  const ctrl = { x: 70, y: (from.y + to.y) / 2 - 10 };
  const d = `M${from.x} ${from.y} Q${ctrl.x} ${ctrl.y} ${to.x} ${to.y}`;

  return (
    <g key={activeKey} className="pointer-events-none">
      <path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth={3.5}
        strokeLinecap="round"
        opacity={0.85}
        className="lab-pour-ribbon"
      />
      {Array.from({ length: 5 }).map((_, i) => {
        const t = (i + 1) / 6;
        const p = quadPoint(from, ctrl, to, t);
        return (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={1.8 + (i % 2)}
            fill={color}
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
