"use client";

import { useRef, useState, type RefObject } from "react";
import { useDroppable } from "@dnd-kit/core";
import type { DeskVessel } from "@/types";
import { EQUIPMENT_BY_ID } from "@/domains/chemistry/data/equipment";
import { getChemical } from "@/domains/chemistry/data/chemicals";
import { vesselDropId } from "@/drag/types";
import { GlassVessel } from "@/animation/glassware/GlassVessel";
import { fxAlive, useFxClock } from "@/animation/useFxClock";
import { useDeskStore } from "@/store/deskStore";
import { useAuthStore } from "@/store/authStore";
import { showToast } from "@/gamification/ToastHost";
import { tryMixVessel, tryShakeVessel } from "@/lab/labActions";
import { labCopy } from "@/lab/labCopy";
import { snapAlignPosition, VESSEL_CARD } from "@/desk/vesselLayout";
import {
  capacityMlForEquipment,
  getVesselContents,
  totalMl,
} from "@/desk/vesselContents";

interface Props {
  vessel: DeskVessel;
  deskRef: RefObject<HTMLElement | null>;
}

export function VesselSlot({ vessel, deskRef }: Props) {
  const { setNodeRef, isOver } = useDroppable({
    id: vesselDropId(vessel.instanceId),
    data: { type: "vessel", vesselId: vessel.instanceId },
  });

  const activeVesselId = useDeskStore((s) => s.activeVesselId);
  const setActiveVessel = useDeskStore((s) => s.setActiveVessel);
  const clearVessel = useDeskStore((s) => s.clearVessel);
  const removeVessel = useDeskStore((s) => s.removeVessel);
  const stirVessel = useDeskStore((s) => s.stirVessel);
  const toggleHeat = useDeskStore((s) => s.toggleHeat);
  const toggleCool = useDeskStore((s) => s.toggleCool);
  const removeLastChemical = useDeskStore((s) => s.removeLastChemical);
  const moveVessel = useDeskStore((s) => s.moveVessel);
  const transferVesselContents = useDeskStore((s) => s.transferVesselContents);
  const setChemicalAmount = useDeskStore((s) => s.setChemicalAmount);

  const dragOffset = useRef<{ dx: number; dy: number } | null>(null);
  const [dragging, setDragging] = useState(false);

  const now = useFxClock(
    [vessel.fx.shakeAt, vessel.fx.mixAt, vessel.fx.pourAt, vessel.fx.transferAt],
    1800,
  );

  const eq = EQUIPMENT_BY_ID[vessel.equipmentId];
  const isActive = activeVesselId === vessel.instanceId;
  const result = vessel.lastResult;
  const contents = getVesselContents(vessel);
  const preview = vessel.livePreview;
  const hazard =
    result?.effects.some(
      (e) =>
        e.kind === "hazard" ||
        e.kind === "blast" ||
        e.kind === "flash" ||
        e.kind === "burst",
    ) || preview?.hazards.some((h) => h.level === "danger");
  const canMix =
    contents.length >= 2 || (contents.length >= 1 && vessel.heatAttached);
  const labBlocked = useAuthStore((s) => s.isLabBlocked());

  const hasBoilable = contents.some((c) => {
    const chem = getChemical(c.chemicalId);
    return (
      chem?.state === "aqueous" ||
      chem?.state === "liquid" ||
      chem?.id === "h2o" ||
      Boolean(chem?.isFuel)
    );
  });
  const boiling =
    Boolean(vessel.heatAttached && hasBoilable) ||
    Boolean(preview?.effects.some((e) => e.kind === "boil"));

  const fillColor =
    result?.effects.find((e) => e.kind === "color")?.value ??
    preview?.fillColor ??
    (contents.length
      ? getChemical(contents[contents.length - 1]!.chemicalId)?.color
      : undefined) ??
    "transparent";

  const capacityMl = capacityMlForEquipment(vessel.equipmentId);
  const usedMl = totalMl(contents);
  const fillPct =
    preview?.fillPct ??
    (contents.length === 0
      ? 0
      : Math.min(82, 12 + (usedMl / capacityMl) * 70));

  // Merge live FX into a synthetic result for VesselEffects when not yet mixed
  const fxResult =
    result ??
    (preview?.effects.length
      ? {
          ok: true,
          products: [],
          effects: preview.effects,
          discoveryId: "live-preview",
        }
      : undefined);

  const shaking = fxAlive(vessel.fx.shakeAt, 700, now);
  const mixing = fxAlive(vessel.fx.mixAt, 900, now);
  const pouring = fxAlive(vessel.fx.pourAt, 900, now);
  const transferring = fxAlive(vessel.fx.transferAt, 1100, now);
  const isSource = transferring && vessel.fx.transferRole === "source";

  const pourIntensity =
    pouring || (transferring && vessel.fx.transferRole === "target") ? 1 : 0;

  const tiltDeg = isSource ? -28 : shaking ? Math.sin(now / 40) * 8 : 0;

  function onMovePointerDown(e: React.PointerEvent) {
    if ((e.target as HTMLElement).closest("button, [data-no-drag]")) return;
    e.stopPropagation();
    setActiveVessel(vessel.instanceId);
    const desk = deskRef.current;
    if (!desk) return;
    const rect = desk.getBoundingClientRect();
    dragOffset.current = {
      dx: e.clientX - rect.left - vessel.position.x,
      dy: e.clientY - rect.top - vessel.position.y,
    };
    setDragging(true);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }

  function onMovePointerMove(e: React.PointerEvent) {
    if (!dragOffset.current || !dragging) return;
    const desk = deskRef.current;
    if (!desk) return;
    const rect = desk.getBoundingClientRect();
    moveVessel(vessel.instanceId, {
      x: e.clientX - rect.left - dragOffset.current.dx,
      y: e.clientY - rect.top - dragOffset.current.dy,
    });
  }

  function onMovePointerUp(e: React.PointerEvent) {
    const wasDragging = dragging;
    dragOffset.current = null;
    setDragging(false);
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }

    if (!wasDragging) return;

    const latest =
      useDeskStore.getState().vessels.find(
        (v) => v.instanceId === vessel.instanceId,
      ) ?? vessel;
    const latestContents = getVesselContents(latest);

    // Vessel→vessel pour: if released overlapping another vessel, transfer
    const others = useDeskStore
      .getState()
      .vessels.filter((v) => v.instanceId !== vessel.instanceId);
    const target = findOverlapTarget(latest, others);
    if (target && latestContents.length > 0) {
      const ok = transferVesselContents(vessel.instanceId, target.instanceId);
      if (ok) {
        showToast(
          labCopy.pouringInto(
            EQUIPMENT_BY_ID[target.equipmentId]?.name ?? "vessel",
          ),
        );
        return;
      }
    }

    // Otherwise snap / align with a nearby card when close enough
    const snapped = snapAlignPosition(
      latest.position,
      others.map((v) => v.position),
    );
    if (snapped) {
      moveVessel(vessel.instanceId, snapped);
    }
  }

  return (
    <div
      ref={setNodeRef}
      role="button"
      tabIndex={0}
      style={{
        left: vessel.position.x,
        top: vessel.position.y,
      }}
      onPointerDown={onMovePointerDown}
      onPointerMove={onMovePointerMove}
      onPointerUp={onMovePointerUp}
      onPointerCancel={onMovePointerUp}
      onDoubleClick={(e) => {
        e.stopPropagation();
        if (canMix) tryMixVessel(vessel.instanceId);
        else stirVessel(vessel.instanceId);
      }}
      onClick={() => setActiveVessel(vessel.instanceId)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          setActiveVessel(vessel.instanceId);
        }
        if (e.key === "m" || e.key === "M") {
          if (canMix) tryMixVessel(vessel.instanceId);
        }
        if (e.key === "s" || e.key === "S") {
          stirVessel(vessel.instanceId);
        }
        if (e.key === "h" || e.key === "H") {
          toggleHeat(vessel.instanceId);
        }
        if (e.key === "c" || e.key === "C") {
          toggleCool(vessel.instanceId);
        }
      }}
      className={`group absolute z-10 w-[11.5rem] select-none rounded-2xl border p-2.5 touch-none ${
        dragging
          ? "z-30 cursor-grabbing scale-[1.03] shadow-2xl"
          : "cursor-grab transition-[left,top,box-shadow,transform,border-color,background-color] duration-200"
      } ${shaking ? "lab-vessel-shake" : ""} ${mixing ? "lab-vessel-pop" : ""} ${
        isSource ? "lab-vessel-pour-tilt" : ""
      } ${
        hazard
          ? "border-lab-hazard bg-lab-hazard/10 shadow-[0_0_28px_rgba(180,35,24,0.35)]"
          : isOver
            ? "scale-[1.04] border-lab-teal bg-white/95 shadow-xl"
            : isActive
              ? "border-lab-teal/80 bg-white/90 shadow-lg ring-2 ring-lab-teal/25"
              : "border-white/35 bg-white/55 shadow-md backdrop-blur-[2px] hover:border-white/70 hover:bg-white/80"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[11px] font-semibold tracking-wide text-lab-ink">
            {eq?.name ?? "Vessel"}
          </p>
          <p className="text-[9px] uppercase tracking-wider text-lab-muted">
            Drag onto another to pour
          </p>
        </div>
        <div
          className="flex gap-0.5 opacity-80 transition group-hover:opacity-100"
          data-no-drag
        >
          <button
            type="button"
            className="rounded-md px-1.5 py-0.5 text-[10px] text-lab-muted hover:bg-lab-wash hover:text-lab-ink"
            onClick={(e) => {
              e.stopPropagation();
              clearVessel(vessel.instanceId);
            }}
          >
            Clear
          </button>
          <button
            type="button"
            aria-label="Remove vessel"
            className="rounded-md px-1.5 py-0.5 text-[10px] text-lab-muted hover:bg-lab-hazard/15 hover:text-lab-hazard"
            onClick={(e) => {
              e.stopPropagation();
              removeVessel(vessel.instanceId);
            }}
          >
            ✕
          </button>
        </div>
      </div>

      {/* Bunsen stand under glass */}
      {vessel.heatAttached ? (
        <div className="lab-burner pointer-events-none absolute -bottom-2 left-1/2 z-0 h-5 w-16 -translate-x-1/2 rounded-b-md bg-lab-desk">
          <div className="absolute -top-3 left-1/2 flex -translate-x-1/2 gap-0.5">
            <span className="lab-flame inline-block h-4 w-2 rounded-full bg-lab-amber" />
            <span className="lab-flame lab-flame-delay inline-block h-5 w-2.5 rounded-full bg-lab-amber/70" />
            <span className="lab-flame inline-block h-3.5 w-2 rounded-full bg-lab-amber/90" />
          </div>
        </div>
      ) : null}

      {/* Ice bath under glass */}
      {vessel.coolAttached ? (
        <div className="lab-ice-bath pointer-events-none absolute -bottom-2 left-1/2 z-0 h-5 w-16 -translate-x-1/2 rounded-b-md bg-sky-900/80">
          <div className="absolute -top-2 left-1/2 flex -translate-x-1/2 gap-0.5">
            <span className="lab-ice-cube inline-block h-2.5 w-2.5 rounded-sm bg-sky-200/90" />
            <span className="lab-ice-cube lab-ice-delay inline-block h-3 w-3 rounded-sm bg-sky-100/80" />
            <span className="lab-ice-cube inline-block h-2 w-2.5 rounded-sm bg-sky-200/70" />
          </div>
        </div>
      ) : null}

      <div data-no-drag className="relative mt-1">
        <GlassVessel
          equipmentId={vessel.equipmentId}
          fillPct={fillPct}
          fillColor={fillColor}
          motion={{
            pourIntensity,
            stirLevel: vessel.stirLevel,
            shaking,
            boiling,
            transferringOut: Boolean(isSource),
          }}
          result={fxResult}
          fx={vessel.fx}
          livePreview={preview}
          layerColors={preview?.layerColors}
          stirLevel={vessel.stirLevel}
          heatAttached={vessel.heatAttached}
          coolAttached={vessel.coolAttached}
          pouringCue={isOver}
          tiltDeg={tiltDeg}
          onGlassClick={(e) => {
            e.stopPropagation();
            stirVessel(vessel.instanceId);
          }}
        />
        {vessel.stirLevel > 0 ? (
          <div className="absolute right-1 top-1 rounded-full bg-black/35 px-1.5 py-0.5 text-[9px] text-lab-foam">
            Stir ×{vessel.stirLevel}
          </div>
        ) : null}
        {usedMl > 0 ? (
          <div className="absolute left-1 top-1 rounded-full bg-black/35 px-1.5 py-0.5 font-mono text-[9px] text-lab-foam">
            {usedMl.toFixed(1)}/{capacityMl} ml
          </div>
        ) : null}
      </div>

      <ul
        className="mt-1.5 min-h-[2rem] space-y-1 text-[11px] text-lab-muted"
        data-no-drag
      >
        {contents.length === 0 ? (
          <li className="italic text-lab-muted/80">Awaiting chemicals…</li>
        ) : (
          contents.map((entry, idx) => {
            const c = getChemical(entry.chemicalId);
            const isLast = idx === contents.length - 1;
            const othersMl = usedMl - entry.amountMl;
            const maxForThis = Math.max(
              0.1,
              Math.round((capacityMl - Math.max(0, othersMl)) * 10) / 10,
            );
            const amountPct = Math.min(
              100,
              (entry.amountMl / capacityMl) * 100,
            );
            return (
              <li key={entry.chemicalId} className="space-y-0.5">
                <div className="flex items-center gap-1 truncate">
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ background: c?.color ?? "#888" }}
                  />
                  <span className="min-w-0 flex-1 truncate font-mono text-lab-ink/85">
                    {c?.formula ?? entry.chemicalId}
                    <span className="ml-1 font-sans text-[10px] text-lab-muted">
                      {c?.name}
                    </span>
                  </span>
                  {isLast ? (
                    <button
                      type="button"
                      className="rounded px-1 text-[9px] text-lab-muted hover:bg-lab-wash hover:text-lab-hazard"
                      title="Remove last chemical"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeLastChemical(vessel.instanceId);
                      }}
                    >
                      undo
                    </button>
                  ) : null}
                </div>
                {isActive ? (
                  <div
                    className="space-y-1 pl-3"
                    data-no-drag
                    onPointerDown={(e) => e.stopPropagation()}
                  >
                    <div className="relative h-1.5 overflow-hidden rounded-full bg-lab-wash">
                      <div
                        className="absolute inset-y-0 left-0 rounded-full bg-lab-teal/80 transition-[width] duration-150"
                        style={{ width: `${amountPct}%` }}
                      />
                      <input
                        type="range"
                        min={0.1}
                        max={maxForThis}
                        step={0.1}
                        value={Math.min(entry.amountMl, maxForThis)}
                        onChange={(e) => {
                          e.stopPropagation();
                          setChemicalAmount(
                            vessel.instanceId,
                            entry.chemicalId,
                            Number(e.target.value),
                          );
                        }}
                        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                        aria-label={`Amount of ${c?.name ?? entry.chemicalId}`}
                      />
                    </div>
                    <label className="flex items-center gap-1">
                      <input
                        type="number"
                        min={0.1}
                        max={maxForThis}
                        step={0.1}
                        value={Number(entry.amountMl.toFixed(1))}
                        onChange={(e) => {
                          e.stopPropagation();
                          const raw = Number(e.target.value);
                          if (!Number.isFinite(raw)) return;
                          setChemicalAmount(
                            vessel.instanceId,
                            entry.chemicalId,
                            raw,
                          );
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="w-12 rounded border border-lab-line/60 bg-white px-1 py-0.5 font-mono text-[10px] text-lab-ink outline-none focus:border-lab-teal focus:ring-1 focus:ring-lab-teal/30"
                        aria-label={`Custom ml for ${c?.name ?? entry.chemicalId}`}
                      />
                      <span className="text-[9px] text-lab-muted">
                        ml · max {maxForThis}
                      </span>
                    </label>
                  </div>
                ) : (
                  <p className="pl-3 font-mono text-[9px] text-lab-muted">
                    {entry.amountMl.toFixed(1)} ml
                  </p>
                )}
              </li>
            );
          })
        )}
      </ul>

      {result?.label ? (
        <p className="equation-pop mt-1.5 rounded-lg bg-lab-ink px-2 py-1.5 font-mono text-[10px] leading-snug text-lab-foam">
          {result.label}
        </p>
      ) : null}

      <div className="mt-2 grid grid-cols-5 gap-1" data-no-drag>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            stirVessel(vessel.instanceId);
          }}
          className="rounded-lg bg-lab-wash px-1 py-1.5 text-[10px] font-semibold text-lab-ink hover:bg-white"
          title="Stir (S)"
        >
          Stir
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            toggleHeat(vessel.instanceId);
          }}
          className={`rounded-lg px-1 py-1.5 text-[10px] font-semibold ${
            vessel.heatAttached
              ? "bg-lab-amber text-white"
              : "bg-lab-wash text-lab-ink hover:bg-white"
          }`}
          title="Heat (H)"
        >
          Heat
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            toggleCool(vessel.instanceId);
          }}
          className={`rounded-lg px-1 py-1.5 text-[10px] font-semibold ${
            vessel.coolAttached
              ? "bg-sky-600 text-white"
              : "bg-lab-wash text-lab-ink hover:bg-white"
          }`}
          title="Cool (C)"
        >
          Cool
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            tryShakeVessel(vessel.instanceId);
          }}
          disabled={!canMix && contents.length < 1}
          className="rounded-lg bg-lab-wash px-1 py-1.5 text-[10px] font-semibold text-lab-ink hover:bg-white disabled:opacity-40"
          title="Shake to agitate (then Mix)"
        >
          Shake
        </button>
        <button
          type="button"
          disabled={!canMix && !labBlocked}
          onClick={(e) => {
            e.stopPropagation();
            tryMixVessel(vessel.instanceId);
          }}
          className={`rounded-lg px-1 py-1.5 text-[10px] font-semibold text-white ${
            labBlocked
              ? "bg-lab-amber hover:bg-lab-amber/90"
              : canMix
                ? "cta-pulse bg-lab-teal hover:bg-lab-teal/90"
                : "cursor-not-allowed bg-lab-teal/35"
          }`}
          title={labBlocked ? "Sign up to Mix" : "Mix / React (M)"}
        >
          {labBlocked ? "Sign up" : "Mix"}
        </button>
      </div>
    </div>
  );
}

function findOverlapTarget(
  source: DeskVessel,
  all: DeskVessel[],
): DeskVessel | null {
  const sx = source.position.x;
  const sy = source.position.y;
  let best: DeskVessel | null = null;
  let bestArea = 0;

  for (const other of all) {
    if (other.instanceId === source.instanceId) continue;
    const ox = other.position.x;
    const oy = other.position.y;
    const overlapW =
      Math.min(sx + VESSEL_CARD.width, ox + VESSEL_CARD.width) -
      Math.max(sx, ox);
    const overlapH =
      Math.min(sy + VESSEL_CARD.height, oy + VESSEL_CARD.height) -
      Math.max(sy, oy);
    if (overlapW <= 0 || overlapH <= 0) continue;
    const area = overlapW * overlapH;
    const minArea = VESSEL_CARD.width * VESSEL_CARD.height * 0.28;
    if (area >= minArea && area > bestArea) {
      bestArea = area;
      best = other;
    }
  }
  return best;
}
