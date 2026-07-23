"use client";

import { useRef } from "react";
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

/** VesselSlot card width used for lip anchor math */
const CARD_W = 184;

export function DeskWorkspace() {
  const vessels = useDeskStore((s) => s.vessels);
  const activeVesselId = useDeskStore((s) => s.activeVesselId);
  const seedDemoReaction = useDeskStore((s) => s.seedDemoReaction);
  const placeEquipment = useDeskStore((s) => s.placeEquipment);
  const stirVessel = useDeskStore((s) => s.stirVessel);
  const mixVessel = useDeskStore((s) => s.mixVessel);
  const toggleHeat = useDeskStore((s) => s.toggleHeat);
  const shakeVessel = useDeskStore((s) => s.shakeVessel);
  const clearDesk = useDeskStore((s) => s.clearDesk);
  const setPickerOpen = useGoalStore((s) => s.setPickerOpen);
  const deskRef = useRef<HTMLElement | null>(null);

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
          const glassTop = 36;
          const glassH = 150;
          const scaleX = (CARD_W - 20) / 100;
          const scaleY = glassH / 140;
          const lipDesk = (
            v: typeof transferSource,
            geo: typeof fromGeo,
          ) => ({
            x: v.position.x + 10 + geo.lip.x * scaleX,
            y: v.position.y + glassTop + geo.lip.y * scaleY,
          });
          const mouthDesk = (
            v: typeof transferTarget,
            geo: typeof toGeo,
          ) => ({
            x: v.position.x + 10 + geo.mouth.x * scaleX,
            y: v.position.y + glassTop + geo.mouth.y * scaleY + 8,
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
            "#8fc0b5";
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

      {/* Desk-level pour stream between vessels */}
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

      {/* Quick tool dock */}
      {vessels.length > 0 ? (
        <div className="absolute bottom-2 left-1/2 z-40 flex -translate-x-1/2 items-center gap-0.5 rounded-xl border border-white/20 bg-lab-ink/85 px-1.5 py-1 shadow-2xl backdrop-blur-md">
          <span className="hidden px-1.5 text-[9px] uppercase tracking-wider text-lab-foam/60 sm:inline">
            Tools
          </span>
          {(
            [
              {
                id: "beaker",
                label: "+ Beaker",
                run: () => {
                  const n = vessels.length;
                  placeEquipment("beaker", {
                    x: 60 + (n % 3) * 190,
                    y: 50 + Math.floor(n / 3) * 200,
                  });
                },
              },
              {
                id: "stir",
                label: "Stir",
                run: () => {
                  if (!active) return;
                  stirVessel(active.instanceId);
                  showToast({
                    title: "Stirring…",
                    detail: "Click liquid again or Shake to react",
                  });
                },
              },
              {
                id: "heat",
                label: "Heat",
                run: () => {
                  if (!active) return;
                  toggleHeat(active.instanceId);
                },
              },
              {
                id: "shake",
                label: "Shake",
                run: () => {
                  if (!active) return;
                  shakeVessel(active.instanceId);
                },
              },
              {
                id: "mix",
                label: "Mix",
                run: () => {
                  if (!active) return;
                  mixVessel(active.instanceId);
                },
              },
            ] as const
          ).map((tool) => (
            <button
              key={tool.id}
              type="button"
              onClick={tool.run}
              className="rounded-lg bg-white/10 px-2 py-1 text-[10px] font-semibold text-lab-foam transition hover:bg-lab-teal/80"
            >
              {tool.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => {
              clearDesk();
              showToast({
                title: "Desk cleared",
                detail: "All glassware removed",
              });
            }}
            className="rounded-lg bg-lab-hazard/30 px-2 py-1 text-[10px] font-semibold text-lab-foam transition hover:bg-lab-hazard/60"
          >
            Clear board
          </button>
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
                Drag glassware anywhere on the wood. Pour chemicals, stir the
                liquid, light the burner, shake to react — every action has a
                feel. Drop one beaker onto another to pour between them.
              </p>
              <ol className="mt-4 space-y-1.5 text-left">
                {[
                  "Drag a Beaker onto the desk (or click it in Inventory)",
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
              <button
                type="button"
                onClick={() => seedDemoReaction()}
                className="mt-4 rounded-lg bg-lab-foam px-3 py-1.5 text-xs font-semibold text-lab-ink shadow-lg transition hover:bg-white active:scale-[0.98]"
              >
                Try starter: HCl + NaOH
              </button>
              <button
                type="button"
                onClick={() => setPickerOpen(true)}
                className="mt-1.5 rounded-lg border border-lab-foam/40 bg-transparent px-3 py-1.5 text-xs font-semibold text-lab-foam transition hover:bg-white/10 active:scale-[0.98]"
              >
                Pick a goal (e.g. make perfume)
              </button>
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
