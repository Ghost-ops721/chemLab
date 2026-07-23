"use client";

import { useRef, useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import { DESK_SURFACE } from "@/drag/types";
import { useDeskStore } from "@/store/deskStore";
import { VesselSlot } from "./VesselSlot";
import { showToast } from "@/gamification/ToastHost";
import { PourStream } from "@/animation/PourStream";
import { resolveGlassShape } from "@/animation/glassware/shapes";
import { fxAlive, useFxClock } from "@/animation/useFxClock";
import { getChemical } from "@/domains/chemistry/data/chemicals";
import { useGoalStore } from "@/store/goalStore";
import {
  tryMixVessel,
  trySeedDemoReaction,
  tryShakeVessel,
} from "@/lab/labActions";
import { labCopy } from "@/lab/labCopy";
import { LAB_GLASS_FALLBACK, VESSEL_CARD } from "@/desk/vesselLayout";

export function DeskWorkspace({
  onOpenAtelier,
}: {
  onOpenAtelier?: () => void;
} = {}) {
  const vessels = useDeskStore((s) => s.vessels);
  const activeVesselId = useDeskStore((s) => s.activeVesselId);
  const placeEquipment = useDeskStore((s) => s.placeEquipment);
  const stirVessel = useDeskStore((s) => s.stirVessel);
  const toggleHeat = useDeskStore((s) => s.toggleHeat);
  const toggleCool = useDeskStore((s) => s.toggleCool);
  const clearDesk = useDeskStore((s) => s.clearDesk);
  const setPickerOpen = useGoalStore((s) => s.setPickerOpen);
  const deskRef = useRef<HTMLElement | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);

  const { setNodeRef, isOver } = useDroppable({
    id: DESK_SURFACE,
    data: { type: "desk" },
  });

  function bindDesk(node: HTMLElement | null) {
    deskRef.current = node;
    setNodeRef(node);
  }

  const active = vessels.find((v) => v.instanceId === activeVesselId) ?? vessels[0];

  const now = useFxClock(
    vessels.flatMap((v) => [v.fx.transferAt, v.fx.pourAt]),
    1400,
  );

  const transferSource = vessels.find(
    (v) =>
      fxAlive(v.fx.transferAt, 1100, now) && v.fx.transferRole === "source",
  );
  const transferTarget = transferSource?.fx.transferToId
    ? vessels.find((v) => v.instanceId === transferSource.fx.transferToId)
    : undefined;

  const streamProps =
    transferSource && transferTarget && transferSource.fx.transferAt
      ? (() => {
          const fromGeo = resolveGlassShape(transferSource.equipmentId);
          const toGeo = resolveGlassShape(transferTarget.equipmentId);
          const scaleX =
            (VESSEL_CARD.width - VESSEL_CARD.glassInsetX * 2) / 100;
          const scaleY = VESSEL_CARD.glassH / 140;
          const lipDesk = (
            v: typeof transferSource,
            geo: typeof fromGeo,
          ) => ({
            x: v.position.x + VESSEL_CARD.glassInsetX + geo.lip.x * scaleX,
            y:
              v.position.y +
              VESSEL_CARD.glassTop +
              geo.lip.y * scaleY,
          });
          const mouthDesk = (
            v: typeof transferTarget,
            geo: typeof toGeo,
          ) => ({
            x: v.position.x + VESSEL_CARD.glassInsetX + geo.mouth.x * scaleX,
            y:
              v.position.y +
              VESSEL_CARD.glassTop +
              geo.mouth.y * scaleY +
              8,
          });
          const color =
            transferSource.fx.pourColor ??
            transferTarget.fx.pourColor ??
            (transferTarget.contentIds.length
              ? getChemical(
                  transferTarget.contentIds[
                    transferTarget.contentIds.length - 1
                  ]!,
                )?.color
              : undefined) ??
            LAB_GLASS_FALLBACK;
          return {
            from: lipDesk(transferSource, fromGeo),
            to: mouthDesk(transferTarget, toGeo),
            color,
            activeKey: transferSource.fx.transferAt,
          };
        })()
      : null;

  return (
    <section
      ref={bindDesk}
      data-lab-desk
      className={`relative min-h-0 flex-1 overflow-hidden rounded-[1.25rem] ${
        isOver ? "ring-2 ring-lab-teal ring-offset-2 ring-offset-lab-wash" : ""
      }`}
    >
      <div className="lab-desk-surface absolute inset-0" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/15 to-transparent" />
      <div className="pointer-events-none absolute inset-0 lab-desk-sheen" />

      {streamProps ? (
        <div className="pointer-events-none absolute inset-0 z-20">
          <PourStream
            from={streamProps.from}
            to={streamProps.to}
            color={streamProps.color}
            activeKey={streamProps.activeKey}
          />
        </div>
      ) : null}

      {vessels.length > 0 ? (
        <div className="absolute bottom-2 left-1/2 z-40 flex max-w-[calc(100%-7.5rem)] -translate-x-1/2 flex-wrap items-center justify-center gap-y-1.5 rounded-xl border border-white/20 bg-lab-ink/90 px-2 py-1.5 shadow-2xl backdrop-blur-md md:max-w-none">
          <span className="hidden px-2 text-[9px] font-semibold uppercase tracking-[0.14em] text-lab-foam/55 sm:inline">
            Tools
          </span>
          <span
            className="mx-1 hidden h-5 w-px bg-white/15 sm:block"
            aria-hidden
          />
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                const n = vessels.length;
                placeEquipment("beaker", {
                  x: 60 + (n % 3) * (VESSEL_CARD.width + 6),
                  y: 50 + Math.floor(n / 3) * 200,
                });
              }}
              className="min-h-7 rounded-lg bg-white/10 px-2.5 py-1.5 text-[10px] font-semibold text-lab-foam transition hover:bg-white/20"
            >
              + Beaker
            </button>
          </div>
          <span className="mx-1 h-5 w-px bg-white/15" aria-hidden />
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                if (!active) return;
                stirVessel(active.instanceId);
                showToast(labCopy.stirring);
              }}
              className="min-h-7 rounded-lg bg-white/10 px-2.5 py-1.5 text-[10px] font-semibold text-lab-foam transition hover:bg-white/20"
            >
              Stir
            </button>
            <button
              type="button"
              onClick={() => {
                if (!active) return;
                toggleHeat(active.instanceId);
              }}
              aria-pressed={Boolean(active?.heatAttached)}
              className={`min-h-7 rounded-lg px-2.5 py-1.5 text-[10px] font-semibold transition ${
                active?.heatAttached
                  ? "bg-lab-amber text-white shadow-[0_0_0_1px_rgba(255,200,120,0.45)]"
                  : "bg-white/10 text-lab-foam hover:bg-white/20"
              }`}
            >
              Heat
            </button>
            <button
              type="button"
              onClick={() => {
                if (!active) return;
                toggleCool(active.instanceId);
              }}
              aria-pressed={Boolean(active?.coolAttached)}
              className={`min-h-7 rounded-lg px-2.5 py-1.5 text-[10px] font-semibold transition ${
                active?.coolAttached
                  ? "bg-[#0c4a6e] text-[#e0f2fe] shadow-[0_0_0_1px_rgba(125,211,252,0.4)]"
                  : "bg-white/10 text-lab-foam hover:bg-white/20"
              }`}
            >
              Cool
            </button>
            <button
              type="button"
              onClick={() => {
                if (!active) return;
                tryShakeVessel(active.instanceId);
              }}
              className="min-h-7 rounded-lg bg-white/10 px-2.5 py-1.5 text-[10px] font-semibold text-lab-foam transition hover:bg-white/20"
            >
              Shake
            </button>
          </div>
          <span className="mx-1 h-5 w-px bg-white/15" aria-hidden />
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                if (!active) return;
                tryMixVessel(active.instanceId);
              }}
              className="min-h-7 rounded-lg bg-lab-teal px-2.5 py-1.5 text-[10px] font-semibold text-white transition hover:bg-lab-teal/90"
            >
              Mix
            </button>
            <button
              type="button"
              onClick={() => {
                if (!confirmClear) {
                  setConfirmClear(true);
                  window.setTimeout(() => setConfirmClear(false), 2500);
                  return;
                }
                clearDesk();
                setConfirmClear(false);
                showToast(labCopy.deskCleared);
              }}
              className="min-h-7 rounded-lg border border-lab-hazard/40 bg-lab-hazard/25 px-2.5 py-1.5 text-[10px] font-semibold text-lab-foam transition hover:bg-lab-hazard/55"
            >
              {confirmClear ? "Confirm clear?" : "Clear board"}
            </button>
          </div>
        </div>
      ) : null}

      <div className="relative z-10 h-full min-h-[22rem] w-full">
        {vessels.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center p-3">
            <div className="max-w-sm px-3 text-center">
              <p className="font-display text-2xl tracking-tight text-lab-foam">
                Your lab desk
              </p>
              <p className="mt-1.5 text-xs leading-snug text-lab-foam/75">
                Drag glassware anywhere on the wood — or use Chemicals /
                Equipment on mobile. Pour, stir, heat, shake to react. Drop one
                beaker onto another to pour between them.
              </p>
              <ol className="mt-4 space-y-1.5 text-left">
                {[
                  "Place a Beaker on the desk (Inventory or + Beaker)",
                  "Drop two chemicals in — watch the stream and splash",
                  "Stir · Heat · Shake · Mix — or pour beaker into beaker",
                ].map((step, i) => (
                  <li
                    key={step}
                    className="flex items-start gap-2 rounded-lg bg-black/25 px-2.5 py-1.5 text-xs text-lab-foam/90 backdrop-blur-sm"
                  >
                    <span className="mt-px flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-lab-teal/90 font-display text-[10px] text-white">
                      {i + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
              <div className="mt-4 flex flex-col items-stretch gap-2">
                <button
                  type="button"
                  onClick={() => trySeedDemoReaction()}
                  className="rounded-lg bg-lab-foam px-3 py-1.5 text-xs font-semibold text-lab-ink shadow-lg transition hover:bg-white active:scale-[0.98]"
                >
                  Try starter: HCl + NaOH
                </button>
                {onOpenAtelier ? (
                  <button
                    type="button"
                    onClick={onOpenAtelier}
                    className="rounded-lg bg-lab-teal px-3 py-1.5 text-xs font-semibold text-white shadow-lg transition hover:bg-lab-teal/90 active:scale-[0.98]"
                  >
                    Browse Perfume Atelier
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => setPickerOpen(true)}
                  className="rounded-lg border border-lab-foam/40 bg-transparent px-3 py-1.5 text-xs font-semibold text-lab-foam transition hover:bg-white/10 active:scale-[0.98]"
                >
                  Pick a lab goal
                </button>
              </div>
            </div>
          </div>
        ) : (
          vessels.map((v) => (
            <VesselSlot key={v.instanceId} vessel={v} deskRef={deskRef} />
          ))
        )}
      </div>
    </section>
  );
}
