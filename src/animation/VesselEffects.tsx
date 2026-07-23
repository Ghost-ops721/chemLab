"use client";

import { useEffect, type CSSProperties } from "react";
import type { EngineResult, VesselFx } from "@/types";
import { labSound } from "@/desk/labSound";
import { resolveGlassShape } from "./glassware/shapes";
import { fxAlive, useFxClock } from "./useFxClock";

/** Keep tip inside the well: smaller swing for narrow glassware. */
const STIR_SWING_DEG: Record<string, number> = {
  beaker: 12,
  flask: 6,
  "test-tube": 6,
  "graduated-cylinder": 7,
};

/**
 * Horizontal inset of the rod clip relative to the FX overlay
 * (overlay is already inset ~12% from the SVG). Matches well width.
 */
const STIR_ROD_INSET_X: Record<string, string> = {
  beaker: "16%",
  flask: "38%",
  "test-tube": "34%",
  "graduated-cylinder": "30%",
};

interface Props {
  result?: EngineResult;
  fx?: VesselFx;
  stirLevel?: number;
  heatAttached?: boolean;
  coolAttached?: boolean;
  fillColor?: string;
  boiling?: boolean;
  equipmentId?: string;
}

export function VesselEffects({
  result,
  fx,
  stirLevel = 0,
  heatAttached,
  coolAttached,
  fillColor,
  boiling = false,
  equipmentId = "beaker",
}: Props) {
  const now = useFxClock(
    [fx?.pourAt, fx?.stirAt, fx?.shakeAt, fx?.mixAt, fx?.heatFlashAt, fx?.coolFlashAt, fx?.transferAt],
    2400,
  );

  const pouring = fxAlive(fx?.pourAt, 900, now) || fxAlive(fx?.transferAt, 1100, now);
  const stirring = fxAlive(fx?.stirAt, 1100, now) || stirLevel > 0;
  const mixing = fxAlive(fx?.mixAt, 1400, now);
  const heatFlash = fxAlive(fx?.heatFlashAt, 800, now);
  const coolFlash = fxAlive(fx?.coolFlashAt, 800, now);
  const transferringIn =
    fxAlive(fx?.transferAt, 1100, now) && fx?.transferRole === "target";
  const stirActive = fxAlive(fx?.stirAt, 1100, now);

  const gas = result?.effects.some((e) => e.kind === "gas" || e.kind === "bubble");
  const gasIntensity =
    result?.effects.find((e) => e.kind === "gas" || e.kind === "bubble")
      ?.intensity ?? "medium";
  const ppt = result?.effects.find((e) => e.kind === "precipitate");
  const heat = result?.effects.find((e) => e.kind === "heat");
  const smoke = result?.effects.some((e) => e.kind === "smoke");
  const hazard = result?.effects.some(
    (e) =>
      e.kind === "hazard" ||
      e.kind === "blast" ||
      e.kind === "flash" ||
      e.kind === "burst",
  );
  const blast = result?.effects.some((e) => e.kind === "blast");
  const flash = result?.effects.some((e) => e.kind === "flash");
  const foam = result?.effects.some((e) => e.kind === "foam");
  const glow = result?.effects.some((e) => e.kind === "glow");
  const sparkleFx = result?.effects.some((e) => e.kind === "sparkle");
  const dirty = result?.effects.some(
    (e) => e.kind === "dirty" || e.kind === "turbid",
  );
  const layerFx = result?.effects.find((e) => e.kind === "layer");
  const solidify = result?.effects.some((e) => e.kind === "solidify");
  const melt = result?.effects.some((e) => e.kind === "melt");
  const steam = result?.effects.some((e) => e.kind === "steam");
  const crystal = result?.effects.some((e) => e.kind === "crystal");
  const overflow = result?.effects.some((e) => e.kind === "overflow");
  const forceBoil =
    boiling || result?.effects.some((e) => e.kind === "boil");

  const bubbleCount =
    gasIntensity === "high" ? 14 : gasIntensity === "low" ? 5 : 9;
  const boilCount = forceBoil ? 8 : 0;

  useEffect(() => {
    if ((!gas && !forceBoil) || (!mixing && !forceBoil)) return;
    if (ppt && mixing) labSound.ppt();
    const id = window.setInterval(() => labSound.bubble(), forceBoil ? 320 : 220);
    return () => clearInterval(id);
  }, [gas, mixing, forceBoil, ppt]);

  // Gas bubbles linger after mix
  const gasVisible = Boolean(
    gas && (mixing || fxAlive(fx?.mixAt, 2800, now) || forceBoil),
  );
  const smokeCount = smoke
    ? result?.effects.find((e) => e.kind === "smoke")?.intensity === "high"
      ? 7
      : 5
    : 0;
  const pptColor =
    ppt?.value && ppt.value !== "transparent" ? ppt.value : "#c4b5a0";
  const splashColor = fx?.pourColor ?? fillColor ?? "var(--lab-glass, #8fc0b5)";
  const shapeId = resolveGlassShape(equipmentId).id;
  const stirDeg = STIR_SWING_DEG[shapeId] ?? 10;
  const stirInsetX = STIR_ROD_INSET_X[shapeId] ?? "18%";

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Surface hit ripples on pour */}
      {pouring || transferringIn
        ? [0, 1, 2].map((i) => (
            <span
              key={`ripple-${fx?.pourAt ?? fx?.transferAt}-${i}`}
              className="lab-ripple absolute left-1/2 top-[28%] -translate-x-1/2 rounded-full border border-white/50"
              style={{
                width: 12 + i * 14,
                height: 6 + i * 5,
                animationDelay: `${i * 0.08}s`,
              }}
            />
          ))
        : null}

      {/* Pour splash droplets */}
      {pouring
        ? Array.from({ length: 9 }).map((_, i) => (
            <span
              key={`splash-${fx?.pourAt ?? fx?.transferAt}-${i}`}
              className="lab-splash absolute rounded-full"
              style={{
                left: `${14 + i * 8}%`,
                top: "10%",
                width: 4 + (i % 3) * 2,
                height: 4 + (i % 3) * 2,
                background: splashColor,
                animationDelay: `${i * 0.035}s`,
              }}
            />
          ))
        : null}

      {/* Rim drip */}
      {pouring
        ? [0, 1].map((i) => (
            <span
              key={`drip-${i}`}
              className="lab-rim-drip absolute rounded-full"
              style={{
                left: `${62 + i * 10}%`,
                top: "4%",
                width: 3,
                height: 8,
                background: splashColor,
                animationDelay: `${0.12 + i * 0.1}s`,
              }}
            />
          ))
        : null}

      {/* Stirring rod — clipped to well so the tip never leaves the glass */}
      {stirring && (stirActive || stirLevel >= 1) ? (
        <div
          className="absolute inset-y-[6%] overflow-hidden"
          style={{ left: stirInsetX, right: stirInsetX }}
        >
          <div
            className={`lab-stir-rod absolute left-1/2 top-0 h-[88%] w-1 origin-top -translate-x-1/2 rounded-full bg-gradient-to-b from-stone-300 to-stone-500 ${
              stirActive ? "lab-stir-rod-active" : ""
            }`}
            style={
              {
                opacity: 0.35 + stirLevel * 0.15,
                ["--stir-deg"]: `${stirDeg}deg`,
              } as CSSProperties
            }
          />
        </div>
      ) : null}

      {/* Stir vortex */}
      {stirring && (stirActive || stirLevel >= 2) ? (
        <div
          className={`lab-swirl absolute inset-4 rounded-full border-2 border-white/40 ${
            stirActive ? "lab-swirl-active" : "lab-swirl-idle"
          }`}
          style={{ opacity: 0.3 + stirLevel * 0.15 }}
        />
      ) : null}

      {/* Mix shockwave + color bloom */}
      {mixing ? (
        <>
          <div
            key={`shock-${fx?.mixAt}`}
            className="lab-shock absolute inset-2 rounded-[1rem] border-2 border-lab-foam/70"
          />
          <div
            key={`bloom-${fx?.mixAt}`}
            className="lab-color-bloom absolute inset-3 rounded-full"
            style={{
              background: `radial-gradient(circle, ${splashColor}88, transparent 70%)`,
            }}
          />
        </>
      ) : null}

      {/* Reaction gas bubbles */}
      {gasVisible
        ? Array.from({ length: bubbleCount }).map((_, i) => (
            <span
              key={`b-${i}`}
              className="bubble absolute bottom-3 rounded-full bg-white/75 shadow-sm"
              style={{
                left: `${8 + ((i * 11) % 78)}%`,
                width: 3 + (i % 4) * 2,
                height: 3 + (i % 4) * 2,
                animationDelay: `${(i * 0.14) % 1.4}s`,
                animationDuration: `${1.2 + (i % 3) * 0.25}s`,
              }}
            />
          ))
        : null}

      {/* Continuous boil bubbles */}
      {forceBoil && !gas
        ? Array.from({ length: boilCount }).map((_, i) => (
            <span
              key={`boil-${i}`}
              className="bubble absolute bottom-4 rounded-full bg-white/60"
              style={{
                left: `${12 + ((i * 13) % 70)}%`,
                width: 2 + (i % 3),
                height: 2 + (i % 3),
                animationDelay: `${(i * 0.18) % 1.2}s`,
                animationDuration: `${0.9 + (i % 3) * 0.2}s`,
              }}
            />
          ))
        : null}

      {/* Layered immiscible bands */}
      {layerFx?.value ? (
        <div className="pointer-events-none absolute inset-x-[14%] bottom-[12%] top-[35%] overflow-hidden rounded-sm">
          {layerFx.value.split(",").map((color, i, arr) => (
            <div
              key={`layer-${i}`}
              className="absolute inset-x-0"
              style={{
                bottom: `${(i / arr.length) * 100}%`,
                height: `${100 / arr.length}%`,
                background: color,
                opacity: 0.55,
              }}
            />
          ))}
        </div>
      ) : null}

      {/* Foam head */}
      {foam ? (
        <div className="lab-foam-head absolute inset-x-[16%] top-[28%] h-4 overflow-hidden rounded-t-full bg-white/50">
          {Array.from({ length: 6 }).map((_, i) => (
            <span
              key={`foam-${i}`}
              className="lab-foam-bubble absolute rounded-full bg-white/80"
              style={{
                left: `${8 + i * 14}%`,
                width: 5 + (i % 3),
                height: 5 + (i % 3),
                top: `${(i % 2) * 3}px`,
              }}
            />
          ))}
        </div>
      ) : null}

      {/* Blast / flash / burst */}
      {(blast || flash) && (mixing || hazard) ? (
        <>
          <div className="lab-blast-shock absolute inset-0 rounded-[1rem] bg-lab-amber/30" />
          <div className="lab-flash-flare absolute inset-x-2 top-2 h-16 rounded-full bg-gradient-to-b from-amber-200/80 to-transparent" />
          {Array.from({ length: 10 }).map((_, i) => (
            <span
              key={`ember-${i}`}
              className="lab-blast-ember absolute h-1.5 w-1.5 rounded-full bg-orange-400"
              style={{
                left: `${10 + i * 8}%`,
                top: `${30 + (i % 4) * 10}%`,
                animationDelay: `${i * 0.04}s`,
              }}
            />
          ))}
        </>
      ) : null}

      {result?.effects.some((e) => e.kind === "burst") && mixing ? (
        <div className="lab-burst-ring absolute inset-1 rounded-full border-2 border-lab-hazard/80" />
      ) : null}

      {glow ? (
        <div
          className="lab-glow-bloom absolute inset-2 rounded-full"
          style={{
            background: `radial-gradient(circle, ${heat?.value ?? "#ff8a65"}88, transparent 70%)`,
          }}
        />
      ) : null}

      {dirty ? (
        <div className="lab-dirty-haze absolute inset-3 rounded-full bg-stone-600/25 blur-sm" />
      ) : null}

      {steam ? (
        <div className="lab-steam absolute inset-x-4 top-0 h-10 bg-gradient-to-t from-transparent to-white/40" />
      ) : null}

      {melt ? (
        <div className="lab-melt-drip absolute inset-x-[30%] top-[20%] h-8 w-2 rounded-full bg-amber-200/50" />
      ) : null}

      {solidify ? (
        <div className="lab-solidify-frost absolute inset-x-2 bottom-2 h-6 rounded-sm bg-sky-100/40" />
      ) : null}

      {crystal
        ? Array.from({ length: 7 }).map((_, i) => (
            <span
              key={`xtal-${i}`}
              className="lab-crystal absolute h-2 w-2 rotate-45 bg-sky-200/70"
              style={{
                left: `${18 + i * 10}%`,
                bottom: `${10 + (i % 3) * 6}%`,
              }}
            />
          ))
        : null}

      {overflow ? (
        <div className="lab-overflow absolute inset-x-[20%] top-[18%] h-3 rounded-full bg-lab-glass/50" />
      ) : null}

      {/* Precipitate: cloudy haze → settling flakes → bed */}
      {ppt ? (
        <>
          <div
            className={`lab-ppt-cloud absolute inset-3 rounded-full ${
              mixing ? "lab-ppt-cloud-active" : ""
            }`}
            style={{
              background: `radial-gradient(circle, ${pptColor}55, transparent 70%)`,
            }}
          />
          <div
            className="precipitate absolute inset-x-3 bottom-2 h-5 overflow-hidden rounded-sm lab-ppt-bed"
            style={{
              background: `linear-gradient(to top, ${pptColor}ee, ${pptColor}66 55%, ${pptColor}22)`,
              boxShadow: `0 0 12px ${pptColor}66`,
              animationDelay: mixing ? "0.35s" : "0s",
            }}
          >
            <div className="lab-ppt-grain absolute inset-0 opacity-50" />
          </div>
        </>
      ) : null}

      {/* Settling ppt flakes — linger after mix */}
      {ppt && (mixing || fxAlive(fx?.mixAt, 2200, now))
        ? Array.from({ length: 10 }).map((_, i) => (
            <span
              key={`flake-${i}`}
              className="lab-flake absolute rounded-sm"
              style={{
                left: `${14 + i * 8}%`,
                width: 4 + (i % 2),
                height: 3,
                background: pptColor,
                animationDelay: `${0.15 + i * 0.08}s`,
              }}
            />
          ))
        : null}

      {/* Exothermic shimmer / endothermic frost — secondary to glass */}
      {heat?.intensity === "exo" || heatAttached ? (
        <div
          className={`pointer-events-none absolute inset-0 rounded-[inherit] ${
            heat?.intensity === "exo" ? "lab-heat-exo" : "lab-heat-attached"
          }`}
        />
      ) : null}
      {heat?.intensity === "exo" || heatAttached ? (
        <div className="lab-heat-haze pointer-events-none absolute inset-x-3 top-1 h-8" />
      ) : null}
      {heat?.intensity === "endo" || coolAttached ? (
        <div className="lab-heat-endo pointer-events-none absolute inset-0 rounded-[inherit]">
          <div className="lab-frost absolute inset-x-1 top-0.5 h-5 rounded-t-lg" />
        </div>
      ) : null}

      {heatFlash ? (
        <div
          key={fx?.heatFlashAt}
          className="lab-heat-ignite pointer-events-none absolute inset-x-4 bottom-0 h-12"
        />
      ) : null}

      {coolFlash ? (
        <div
          key={fx?.coolFlashAt}
          className="lab-cool-flash pointer-events-none absolute inset-x-3 bottom-0 h-10"
        />
      ) : null}

      {smoke
        ? Array.from({ length: smokeCount }).map((_, i) => (
            <div
              key={`sm-${i}`}
              className="lab-smoke absolute rounded-full bg-stone-400/25 blur-md"
              style={{
                left: `${12 + i * 14}%`,
                top: `${2 + (i % 3) * 5}%`,
                width: 24 + i * 7,
                height: 14 + i * 4,
                animationDelay: `${i * 0.28}s`,
              }}
            />
          ))
        : null}

      {hazard ? (
        <div className="absolute inset-0 flex items-end justify-center pb-2 lab-hazard-pulse">
          <span className="rounded bg-red-600/90 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white/95 shadow">
            Hazard
          </span>
        </div>
      ) : null}

      {/* Sparkles on successful mix */}
      {(mixing && result?.ok) || sparkleFx
        ? Array.from({ length: 8 }).map((_, i) => (
            <span
              key={`sp-${i}`}
              className="lab-spark absolute h-1.5 w-1.5 rounded-full bg-amber-200"
              style={{
                left: `${12 + i * 10}%`,
                top: `${20 + (i % 4) * 12}%`,
                animationDelay: `${i * 0.05}s`,
              }}
            />
          ))
        : null}
    </div>
  );
}
