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
import { VESSEL_CARD } from "@/desk/vesselLayout";

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
  const vessels = useDeskStore((s) => s.vessels);
  const setActiveVessel = useDeskStore((s) => s.setActiveVessel);
  const clearVessel = useDeskStore((s) => s.clearVessel);
  const removeVessel = useDeskStore((s) => s.removeVessel);
  const stirVessel = useDeskStore((s) => s.stirVessel);
  const toggleHeat = useDeskStore((s) => s.toggleHeat);
  const removeLastChemical = useDeskStore((s) => s.removeLastChemical);
  const moveVessel = useDeskStore((s) => s.moveVessel);
  const transferVesselContents = useDeskStore((s) => s.transferVesselContents);

  const dragOffset = useRef<{ dx: number; dy: number } | null>(null);
  const [dragging, setDragging] = useState(false);

  const now = useFxClock(
    [vessel.fx.shakeAt, vessel.fx.mixAt, vessel.fx.pourAt, vessel.fx.transferAt],
    1800,
  );

  const eq = EQUIPMENT_BY_ID[vessel.equipmentId];
  const isActive = activeVesselId === vessel.instanceId;
  const result = vessel.lastResult;
  const hazard = result?.effects.some((e) => e.kind === "hazard");
  const canMix =
    vessel.contentIds.length >= 2 ||
    (vessel.contentIds.length >= 1 && vessel.heatAttached);
  const labBlocked = useAuthStore((s) => s.isLabBlocked());

  const hasBoilable = vessel.contentIds.some((id) => {
    const c = getChemical(id);
    return (
      c?.state === "aqueous" ||
      c?.state === "liquid" ||
      c?.id === "h2o" ||
      Boolean(c?.isFuel)
    );
  });
  const boiling = Boolean(vessel.heatAttached && hasBoilable);

  const fillColor =
    result?.effects.find((e) => e.kind === "color")?.value ??
    (vessel.contentIds.length
      ? getChemical(vessel.contentIds[vessel.contentIds.length - 1]!)?.color
      : undefined) ??
    "transparent";

  const capacity = eq?.capacity ?? 3;
  const fillPct =
    vessel.contentIds.length === 0
      ? 0
      : Math.min(82, 18 + (vessel.contentIds.length / capacity) * 64);

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

    // Vessel→vessel pour: if released overlapping another vessel, transfer
    const target = findOverlapTarget(vessel, vessels);
    if (target && vessel.contentIds.length > 0) {
      const ok = transferVesselContents(vessel.instanceId, target.instanceId);
      if (ok) {
        showToast(
          labCopy.pouringInto(
            EQUIPMENT_BY_ID[target.equipmentId]?.name ?? "vessel",
          ),
        );
      }
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
      }}
      className={`group absolute z-10 w-[11.5rem] select-none rounded-2xl border p-2.5 transition duration-200 touch-none ${
        dragging ? "z-30 cursor-grabbing scale-[1.03] shadow-2xl" : "cursor-grab"
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
          result={result}
          fx={vessel.fx}
          stirLevel={vessel.stirLevel}
          heatAttached={vessel.heatAttached}
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
      </div>

      <ul
        className="mt-1.5 min-h-[2rem] space-y-0.5 text-[11px] text-lab-muted"
        data-no-drag
      >
        {vessel.contentIds.length === 0 ? (
          <li className="italic text-lab-muted/80">Awaiting chemicals…</li>
        ) : (
          vessel.contentIds.map((id, idx) => {
            const c = getChemical(id);
            const isLast = idx === vessel.contentIds.length - 1;
            return (
              <li key={id} className="flex items-center gap-1 truncate">
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ background: c?.color ?? "#888" }}
                />
                <span className="min-w-0 flex-1 truncate font-mono text-lab-ink/85">
                  {c?.formula ?? id}
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

      <div className="mt-2 grid grid-cols-4 gap-1" data-no-drag>
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
            tryShakeVessel(vessel.instanceId);
          }}
          disabled={!canMix && vessel.contentIds.length < 1}
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
