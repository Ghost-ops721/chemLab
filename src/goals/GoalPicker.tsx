"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  PRODUCT_GOALS,
  type GoalCategory,
} from "@/domains/chemistry/data/goals";
import { useGoalStore } from "@/store/goalStore";

const FILTERS: { id: "all" | GoalCategory; label: string }[] = [
  { id: "all", label: "All" },
  { id: "product", label: "Products" },
  { id: "classic", label: "Classic lab" },
];

export function GoalPicker() {
  const open = useGoalStore((s) => s.pickerOpen);
  const setPickerOpen = useGoalStore((s) => s.setPickerOpen);
  const startGoal = useGoalStore((s) => s.startGoal);
  const completedGoalIds = useGoalStore((s) => s.completedGoalIds);
  const activeGoalId = useGoalStore((s) => s.activeGoalId);
  const [filter, setFilter] = useState<"all" | GoalCategory>("all");
  const closeRef = useRef<HTMLButtonElement>(null);

  const filtered = useMemo(
    () =>
      filter === "all"
        ? PRODUCT_GOALS
        : PRODUCT_GOALS.filter((g) => g.category === filter),
    [filter],
  );

  const doneCount = completedGoalIds.filter((id) =>
    PRODUCT_GOALS.some((g) => g.id === id),
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
              Goals · {doneCount}/{PRODUCT_GOALS.length} done
            </p>
            <h2 className="font-display text-xl tracking-tight text-lab-ink">
              Make something real
            </h2>
            <p className="mt-0.5 text-[11px] text-lab-muted">
              Pick a product or classic lab recipe. Hints stay optional.
            </p>
          </div>
          <button
            ref={closeRef}
            type="button"
            className="rounded-md px-1.5 py-0.5 text-xs text-lab-muted hover:bg-lab-wash hover:text-lab-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lab-teal"
            onClick={() => setPickerOpen(false)}
          >
            ✕
          </button>
        </div>

        <div className="flex gap-1 border-b border-lab-line/40 px-3 py-2">
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
        </div>

        <ul className="scroll-thin min-h-0 flex-1 space-y-1 overflow-y-auto p-2">
          {filtered.map((g) => {
            const done = completedGoalIds.includes(g.id);
            const active = activeGoalId === g.id;
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
                      <span className="rounded bg-lab-wash px-1 py-px text-[9px] font-semibold uppercase tracking-wider text-lab-muted">
                        {g.category === "product" ? "Product" : "Classic"}
                      </span>
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
