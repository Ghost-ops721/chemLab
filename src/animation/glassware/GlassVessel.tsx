"use client";

import { useId } from "react";
import { resolveGlassShape } from "./shapes";
import {
  LiquidSurface,
  type LiquidMotion,
} from "../LiquidSurface";
import { VesselEffects } from "../VesselEffects";
import { VesselPourStream } from "../PourStream";
import { fxAlive, useFxClock } from "../useFxClock";
import type { EngineResult, VesselFx } from "@/types";

interface Props {
  equipmentId: string;
  fillPct: number;
  fillColor: string;
  motion: LiquidMotion;
  result?: EngineResult;
  fx?: VesselFx;
  stirLevel?: number;
  heatAttached?: boolean;
  className?: string;
  pouringCue?: boolean;
  tiltDeg?: number;
  onGlassClick?: (e: React.MouseEvent) => void;
}

export function GlassVessel({
  equipmentId,
  fillPct,
  fillColor,
  motion,
  result,
  fx,
  stirLevel = 0,
  heatAttached,
  className = "",
  pouringCue,
  tiltDeg = 0,
  onGlassClick,
}: Props) {
  const geo = resolveGlassShape(equipmentId);
  const uid = useId().replace(/:/g, "");
  const clipId = `well-${uid}`;
  const glassGrad = `glass-${uid}`;
  const shineGrad = `shine-${uid}`;
  const now = useFxClock([fx?.pourAt, fx?.transferAt], 1200);
  const showPourStream =
    (fxAlive(fx?.pourAt, 900, now) ||
      (fxAlive(fx?.transferAt, 1100, now) &&
        fx?.transferRole === "target")) &&
    (fx?.pourColor || fillColor !== "transparent");

  return (
    <div
      className={`relative aspect-[100/140] w-full select-none ${className}`}
      onClick={onGlassClick}
      title="Click liquid to stir"
    >
      <svg
        viewBox="0 0 100 140"
        className="h-full w-full overflow-visible"
        style={{
          transform: tiltDeg ? `rotate(${tiltDeg}deg)` : undefined,
          transformOrigin: "50% 75%",
          transition: tiltDeg ? "transform 0.35s ease-out" : undefined,
        }}
        aria-hidden
      >
        <defs>
          <linearGradient id={glassGrad} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="rgba(255,255,255,0.55)" />
            <stop offset="45%" stopColor="rgba(200,230,220,0.18)" />
            <stop offset="100%" stopColor="rgba(143,192,181,0.28)" />
          </linearGradient>
          <linearGradient id={shineGrad} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(255,255,255,0.5)" />
            <stop offset="40%" stopColor="rgba(255,255,255,0.05)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </linearGradient>
          <clipPath id={clipId}>
            <path d={geo.well} />
          </clipPath>
        </defs>

        {/* Soft contact shadow */}
        <ellipse
          cx="50"
          cy="132"
          rx="28"
          ry="4"
          fill="rgba(20,36,31,0.18)"
        />

        {/* Glass body fill */}
        <path d={geo.outline} fill={`url(#${glassGrad})`} />

        {/* Liquid */}
        <LiquidSurface
          geometry={geo}
          fillPct={fillPct}
          fillColor={fillColor}
          motion={motion}
          clipId={clipId}
        />

        {/* Interior refraction strip */}
        <path
          d={geo.well}
          fill={`url(#${shineGrad})`}
          opacity={0.55}
          style={{ mixBlendMode: "soft-light" }}
        />

        {/* Glass outline */}
        <path
          d={geo.outline}
          fill="none"
          stroke="rgba(255,255,255,0.75)"
          strokeWidth={1.6}
          strokeLinejoin="round"
        />
        <path
          d={geo.outline}
          fill="none"
          stroke="rgba(26,107,92,0.35)"
          strokeWidth={0.7}
          strokeLinejoin="round"
        />

        {/* Rim */}
        <path
          d={geo.rim}
          fill="none"
          stroke="rgba(255,255,255,0.9)"
          strokeWidth={2.2}
          strokeLinecap="round"
        />

        {/* Graduation ticks */}
        {geo.ticks ? (
          <path
            d={geo.ticks}
            fill="none"
            stroke="rgba(20,36,31,0.28)"
            strokeWidth={0.8}
            strokeLinecap="round"
          />
        ) : null}

        {/* Left edge highlight (refraction) */}
        <path
          d={leftEdgeHighlight(equipmentId)}
          fill="none"
          stroke="rgba(255,255,255,0.55)"
          strokeWidth={1.4}
          strokeLinecap="round"
          opacity={0.7}
        />

        {/* Local pour stream into this vessel */}
        {showPourStream ? (
          <VesselPourStream
            lip={geo.lip}
            mouthY={geo.mouth.y}
            color={fx?.pourColor ?? fillColor}
            activeKey={fx?.pourAt ?? fx?.transferAt ?? 0}
            fillPct={fillPct}
          />
        ) : null}
      </svg>

      {/* HTML FX overlay aligned to glass */}
      <div className="pointer-events-none absolute inset-[8%_12%_10%_12%]">
        <VesselEffects
          result={result}
          fx={fx}
          stirLevel={stirLevel}
          heatAttached={heatAttached}
          fillColor={fillColor === "transparent" ? undefined : fillColor}
          boiling={motion.boiling}
          equipmentId={equipmentId}
        />
      </div>

      {pouringCue ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span className="equation-pop rounded-full bg-lab-teal px-2.5 py-1 text-[10px] font-semibold text-white shadow-lg">
            Pour in
          </span>
        </div>
      ) : null}
    </div>
  );
}

function leftEdgeHighlight(equipmentId: string) {
  switch (equipmentId) {
    case "flask":
      return "M44 30 L30 110";
    case "test-tube":
      return "M42 20 L42 100";
    case "graduated-cylinder":
      return "M40 22 L40 110";
    default:
      return "M28 34 L28 112";
  }
}

export { resolveGlassShape } from "./shapes";
