"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  PRODUCT_GOALS,
  goalDifficulty,
  type GoalCategory,
} from "@/domains/chemistry/data/goals";
import {
  PERFUME_RECIPES,
  getPerfumeGoal,
  DIFFICULTY_REWARDS,
} from "@/domains/chemistry/perfume";
import { useGoalStore } from "@/store/goalStore";
import { useProgressStore } from "@/store/progressStore";
import { track } from "@/lib/analytics/track";
import { DifficultyBadge } from "@/perfume/DifficultyBadge";

const FILTERS: { id: "all" | Exclude<GoalCategory, "perfume">; label: string }[] =
  [
    { id: "all", label: "All" },
    { id: "product", label: "Products" },
    { id: "classic", label: "Classic lab" },
  ];

/** Havas first — Hard showcase so Goals never feels citrus-only */
const SPOTLIGHT_IDS = [
  "inspired-havas",
  "inspired-sauvage",
  "inspired-chanel5",
  "inspired-baccarat",
  "inspired-1million",
  "inspired-jadore",
] as const;

export function GoalPicker({
  onOpenAtelier,
}: {
  onOpenAtelier?: () => void;
} = {}) {
  const open = useGoalStore((s) => s.pickerOpen);
  const setPickerOpen = useGoalStore((s) => s.setPickerOpen);
  const startGoal = useGoalStore((s) => s.startGoal);
  const completedGoalIds = useGoalStore((s) => s.completedGoalIds);
  const activeGoalId = useGoalStore((s) => s.activeGoalId);
  const completedPerfumes = useProgressStore((s) => s.completedPerfumeIds);
  const [filter, setFilter] = useState<"all" | Exclude<GoalCategory, "perfume">>(
    "all",
  );
  const closeRef = useRef<HTMLButtonElement>(null);

  const catalog = PRODUCT_GOALS;

  const filtered = useMemo(() => {
    if (filter === "all") return catalog;
    return PRODUCT_GOALS.filter((g) => g.category === filter);
  }, [filter, catalog]);

  const spotlight = useMemo(
    () =>
      SPOTLIGHT_IDS.map((id) => PERFUME_RECIPES.find((r) => r.id === id)).filter(
        (r): r is (typeof PERFUME_RECIPES)[number] => Boolean(r),
      ),
    [],
  );

  const doneCount = completedGoalIds.filter((id) =>
    catalog.some((g) => g.id === id),
  ).length;

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setPickerOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, setPickerOpen]);

  if (!open) return null;

  function openAtelier(from: string) {
    track("perfume_atelier_open", { from });
    setPickerOpen(false);
    onOpenAtelier?.();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-lab-ink/45 p-3 pt-[8vh] backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-label="Choose a product goal"
      onClick={() => setPickerOpen(false)}
    >
      <div
        className="flex max-h-[80vh] w-full max-w-md flex-col overflow-hidden rounded-xl border border-lab-line/60 bg-lab-panel shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-2 border-b border-lab-line/50 px-3 py-2">
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-lab-muted">
              Goals · {doneCount}/{catalog.length} done
            </p>
            <h2 className="font-display text-xl tracking-tight text-lab-ink">
              Make something real
            </h2>
            <p className="mt-0.5 text-[11px] text-lab-muted">
              Perfumes live in the Atelier. Products & classics stay here.
            </p>
          </div>
          <button
            ref={closeRef}
            type="button"
            className="rounded-md px-1.5 py-0.5 text-xs text-lab-muted hover:bg-lab-wash hover:text-lab-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lab-teal"
            onClick={() => setPickerOpen(false)}
          >
            ✕
          </button>
        </div>

        {/* Always show perfume entry — never gate the whole hero on wiring */}
        <div className="border-b border-lab-line/40 bg-linear-to-br from-lab-teal/10 via-lab-panel to-lab-amber/10 px-3 py-3">
          <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-lab-teal">
            Perfume atelier
          </p>
          <p className="font-display text-lg text-lab-ink">
            {PERFUME_RECIPES.length}+ inspired scents
          </p>
          <p className="mt-0.5 text-[11px] text-lab-muted">
            Easy → Very hard. Tap Havas or browse the full catalog.
          </p>
          <div className="mt-2 flex gap-1.5 overflow-x-auto pb-0.5">
            {spotlight.map((r) => {
              const done = completedPerfumes.includes(r.id);
              const goal = getPerfumeGoal(r.id);
              const steps = goal?.steps.length;
              return (
                <button
                  key={r.id}
                  type="button"
                  title={`${r.displayName} · ${DIFFICULTY_REWARDS[r.difficulty].label}`}
                  onClick={() => {
                    track("perfume_start", {
                      recipeId: r.id,
                      from: "goals_spotlight",
                      difficulty: r.difficulty,
                      stepCount: steps,
                    });
                    startGoal(r.id);
                    setPickerOpen(false);
                  }}
                  className="group flex w-20 shrink-0 flex-col items-center rounded-lg border border-lab-line/50 bg-white/80 px-1 py-1.5 hover:border-lab-teal/50"
                >
                  <span
                    className="mb-1 flex h-10 w-7 flex-col items-center"
                    aria-hidden
                  >
                    <span className="h-1.5 w-2 rounded-t-sm bg-lab-ink/80" />
                    <span className="h-1 w-3.5 rounded-sm bg-lab-amber/90" />
                    <span
                      className="relative h-7 w-5 overflow-hidden rounded-b-lg rounded-t-sm border border-lab-glass/40 shadow-sm"
                      style={{
                        background: `linear-gradient(180deg, #f7faf8 0%, ${r.bottleColor} 100%)`,
                      }}
                    />
                  </span>
                  <span className="line-clamp-2 text-center text-[9px] font-semibold leading-tight text-lab-ink">
                    {r.icon} {r.displayName.replace("–style", "")}
                  </span>
                  <DifficultyBadge
                    difficulty={r.difficulty}
                    className="mt-0.5 scale-90"
                  />
                  {done ? (
                    <span className="mt-0.5 text-[8px] font-semibold text-lab-teal">
                      ✓
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
          <button
            type="button"
            onClick={() => openAtelier("goals_hero")}
            className="mt-2.5 w-full rounded-lg bg-lab-teal px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-lab-teal/90"
          >
            Browse full Atelier →
          </button>
        </div>

        <div className="flex flex-wrap gap-1 border-b border-lab-line/40 px-3 py-2">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition ${
                filter === f.id
                  ? "bg-lab-teal text-white"
                  : "bg-lab-wash text-lab-muted hover:text-lab-ink"
              }`}
            >
              {f.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => openAtelier("goals_chip")}
            className="rounded-full bg-lab-amber/30 px-2.5 py-1 text-[11px] font-semibold text-lab-ink hover:bg-lab-amber/45"
          >
            All perfumes →
          </button>
        </div>

        <ul className="scroll-thin min-h-0 flex-1 space-y-1 overflow-y-auto p-2">
          {filtered.map((g) => {
            const done = completedGoalIds.includes(g.id);
            const active = activeGoalId === g.id;
            const diff = goalDifficulty(g);
            return (
              <li key={g.id}>
                <button
                  type="button"
                  onClick={() => startGoal(g.id)}
                  className={`flex w-full items-start gap-2 rounded-lg border px-2.5 py-2 text-left transition ${
                    active
                      ? "border-lab-teal bg-lab-teal/10"
                      : "border-lab-line/60 bg-white/70 hover:border-lab-teal/50 hover:bg-white"
                  }`}
                >
                  <span className="text-lg" aria-hidden>
                    {g.icon}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-1.5">
                      <span className="text-sm font-semibold text-lab-ink">
                        {g.title}
                      </span>
                      <DifficultyBadge
                        difficulty={diff}
                        steps={g.steps.length}
                      />
                      {done ? (
                        <span className="rounded bg-lab-teal/15 px-1 py-px text-[9px] font-semibold text-lab-teal">
                          Done
                        </span>
                      ) : null}
                      {active ? (
                        <span className="rounded bg-lab-amber/20 px-1 py-px text-[9px] font-semibold text-lab-amber">
                          Active
                        </span>
                      ) : null}
                    </span>
                    <span className="mt-px block text-[11px] text-lab-muted">
                      {g.tagline}
                    </span>
                    <span className="mt-1 block text-[10px] leading-snug text-lab-ink/75">
                      {g.productBlurb}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
