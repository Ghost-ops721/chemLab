"use client";

import { useId, useRef, useState } from "react";
import { resolveGlassShape } from "./shapes";
import {
  LiquidSurface,
  type LiquidMotion,
} from "../LiquidSurface";
import { VesselEffects } from "../VesselEffects";
import { VesselPourStream } from "../PourStream";
import { fxAlive, useFxClock, usePrefersReducedMotion } from "../useFxClock";
import {
  FluidVesselCanvas,
  livePreviewToFluidState,
} from "../fluid3d";
import type { EngineResult, LiveVesselPreview, VesselFx } from "@/types";

interface Props {
  equipmentId: string;
  fillPct: number;
  fillColor: string;
  motion: LiquidMotion;
  result?: EngineResult;
  fx?: VesselFx;
  /** Live preview for fluid layers / effects (optional) */
  livePreview?: LiveVesselPreview;
  layerColors?: string[];
  stirLevel?: number;
  heatAttached?: boolean;
  className?: string;
  pouringCue?: boolean;
  tiltDeg?: number;
  /** Force SVG LiquidSurface instead of WebGL */
  force2d?: boolean;
  onGlassClick?: (e: React.MouseEvent) => void;
}

export function GlassVessel({
  equipmentId,
  fillPct,
  fillColor,
  motion,
  result,
  fx,
  livePreview,
  layerColors,
  stirLevel = 0,
  heatAttached,
  className = "",
  pouringCue,
  tiltDeg = 0,
  force2d = false,
  onGlassClick,
}: Props) {
  const geo = resolveGlassShape(equipmentId);
  const uid = useId().replace(/:/g, "");
  const clipId = `well-${uid}`;
  const glassGrad = `glass-${uid}`;
  const shineGrad = `shine-${uid}`;
  const now = useFxClock([fx?.pourAt, fx?.transferAt], 1200);
  const prefersReduced = usePrefersReducedMotion();
  const [webglFailed, setWebglFailed] = useState(false);
  const onFluidUnavailable = useRef(() => setWebglFailed(true)).current;

  const showPourStream =
    (fxAlive(fx?.pourAt, 900, now) ||
      (fxAlive(fx?.transferAt, 1100, now) &&
        fx?.transferRole === "target")) &&
    (fx?.pourColor || fillColor !== "transparent");

  const useFluid3d =
    !force2d && !prefersReduced && !webglFailed && fillPct > 0.5;

  const preview: LiveVesselPreview =
    livePreview != null
      ? {
          ...livePreview,
          fillColor: livePreview.fillColor ?? fillColor,
          fillPct: livePreview.fillPct ?? fillPct,
          layerColors: layerColors ?? livePreview.layerColors,
        }
      : {
          fillColor,
          fillPct,
          layerColors,
          ethanolPct: 0,
          oilLoadPct: 0,
          hazards: [],
          notes: [],
          effects: result?.effects ?? [],
        };

  const fluidState = livePreviewToFluidState(preview, {
    fx: fx ?? {},
    heatAttached: Boolean(heatAttached),
    stirLevel,
    lastResult: result,
    fillColorOverride: fillColor,
    fillPctOverride: fillPct,
    boiling: motion.boiling,
  });

  const wb = geo.wellBounds;
  const wellStyle = {
    left: `${wb.x}%`,
    top: `${(wb.y / 140) * 100}%`,
    width: `${wb.width}%`,
    height: `${(wb.height / 140) * 100}%`,
    borderRadius: wellRadius(equipmentId),
  } as const;

  const tiltStyle = {
    transform: tiltDeg ? `rotate(${tiltDeg}deg)` : undefined,
    transformOrigin: "50% 75%",
    transition: tiltDeg ? "transform 0.35s ease-out" : undefined,
  } as const;

  return (
    <div
      className={`relative aspect-[100/140] w-full select-none ${className}`}
      onClick={onGlassClick}
      title="Click liquid to stir"
    >
      <div className="absolute inset-0" style={tiltStyle}>
        {/* 1. Glass body + shadow (under liquid) */}
        <svg
          viewBox="0 0 100 140"
          className="absolute inset-0 h-full w-full overflow-visible"
          aria-hidden
        >
          <defs>
            <linearGradient id={glassGrad} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="rgba(255,255,255,0.55)" />
              <stop offset="45%" stopColor="rgba(200,230,220,0.18)" />
              <stop offset="100%" stopColor="rgba(143,192,181,0.28)" />
            </linearGradient>
          </defs>
          <ellipse
            cx="50"
            cy="132"
            rx="28"
            ry="4"
            fill="rgba(20,36,31,0.18)"
          />
          <path d={geo.outline} fill={`url(#${glassGrad})`} />
        </svg>

        {/* 2. WebGL liquid in well (between body and rim) */}
        {useFluid3d ? (
          <div
            className="pointer-events-none absolute z-[1] overflow-hidden"
            style={wellStyle}
          >
            <FluidVesselCanvas
              state={fluidState}
              onUnavailable={onFluidUnavailable}
            />
          </div>
        ) : null}

        {/* 3. 2D liquid + glass rim / shine / pour (above liquid) */}
        <svg
          viewBox="0 0 100 140"
          className="absolute inset-0 z-[2] h-full w-full overflow-visible"
          aria-hidden
        >
          <defs>
            <linearGradient id={shineGrad} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(255,255,255,0.5)" />
              <stop offset="40%" stopColor="rgba(255,255,255,0.05)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0)" />
            </linearGradient>
            <clipPath id={clipId}>
              <path d={geo.well} />
            </clipPath>
          </defs>

          {!useFluid3d ? (
            <LiquidSurface
              geometry={geo}
              fillPct={fillPct}
              fillColor={fillColor}
              motion={motion}
              clipId={clipId}
              reducedMotion={prefersReduced}
            />
          ) : null}

          <path
            d={geo.well}
            fill={`url(#${shineGrad})`}
            opacity={0.55}
            style={{ mixBlendMode: "soft-light" }}
          />

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

          <path
            d={geo.rim}
            fill="none"
            stroke="rgba(255,255,255,0.9)"
            strokeWidth={2.2}
            strokeLinecap="round"
          />

          {geo.ticks ? (
            <path
              d={geo.ticks}
              fill="none"
              stroke="rgba(20,36,31,0.28)"
              strokeWidth={0.8}
              strokeLinecap="round"
            />
          ) : null}

          <path
            d={leftEdgeHighlight(equipmentId)}
            fill="none"
            stroke="rgba(255,255,255,0.55)"
            strokeWidth={1.4}
            strokeLinecap="round"
            opacity={0.7}
          />

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
      </div>

      {/* CSS FX overlay — beside / on top of 3D liquid */}
      <div className="pointer-events-none absolute inset-[8%_12%_10%_12%] z-[3]">
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
        <div className="pointer-events-none absolute inset-0 z-[4] flex items-center justify-center">
          <span className="equation-pop rounded-full bg-lab-teal px-2.5 py-1 text-[10px] font-semibold text-white shadow-lg">
            Pour in
          </span>
        </div>
      ) : null}
    </div>
  );
}

function wellRadius(equipmentId: string): string {
  switch (equipmentId) {
    case "test-tube":
      return "0 0 50% 50%";
    case "flask":
      return "0 0 28% 28%";
    case "graduated-cylinder":
      return "0 0 40% 40%";
    default:
      return "0 0 12% 12%";
  }
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
