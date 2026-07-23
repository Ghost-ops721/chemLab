"use client";

import { useState } from "react";
import { getGoal, type HintTier } from "@/domains/chemistry/data/goals";
import {
  currentStep,
  goalProgressPct,
  isGoalComplete,
} from "@/goals/goalProgress";
import { useGoalStore } from "@/store/goalStore";

const TIER_LABEL: Record<HintTier, string> = {
  nudge: "Nudge",
  clue: "Clue",
  almost: "Almost",
};

export function GoalGuidePanel() {
  const activeGoalId = useGoalStore((s) => s.activeGoalId);
  const completedStepIds = useGoalStore((s) => s.completedStepIds);
  const openedHintIds = useGoalStore((s) => s.openedHintIds);
  const guideOpen = useGoalStore((s) => s.guideOpen);
  const setGuideOpen = useGoalStore((s) => s.setGuideOpen);
  const abandonGoal = useGoalStore((s) => s.abandonGoal);
  const openHint = useGoalStore((s) => s.openHint);
  const setPickerOpen = useGoalStore((s) => s.setPickerOpen);

  const [hintsOpen, setHintsOpen] = useState(false);

  if (!activeGoalId) return null;
  const goal = getGoal(activeGoalId);
  if (!goal) return null;

  const step = currentStep(goal, completedStepIds);
  const pct = goalProgressPct(goal, completedStepIds);
  const done = isGoalComplete(goal, completedStepIds);
  const doneCount = completedStepIds.filter((id) =>
    goal.steps.some((s) => s.id === id),
  ).length;

  if (!guideOpen) {
    return (
      <button
        type="button"
        onClick={() => setGuideOpen(true)}
        className="fixed bottom-20 left-2 z-40 rounded-xl border border-lab-teal/40 bg-lab-ink px-2.5 py-1.5 text-left text-lab-foam shadow-xl md:bottom-20"
      >
        <p className="text-[9px] uppercase tracking-wider text-lab-glass">
          Goal · {doneCount}/{goal.steps.length}
        </p>
        <p className="text-xs font-semibold">
          {goal.icon} {goal.title}
        </p>
      </button>
    );
  }

  return (
    <aside className="pointer-events-auto flex max-h-[min(70vh,24rem)] w-full flex-col overflow-hidden rounded-xl border border-lab-line/70 bg-lab-panel/95 shadow-xl backdrop-blur md:max-w-[17rem]">
      <div className="flex items-start justify-between gap-2 border-b border-lab-line/50 px-2.5 py-1.5">
        <div className="min-w-0">
          <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-lab-muted">
            Active goal
          </p>
          <h3 className="truncate font-display text-base leading-tight text-lab-ink">
            {goal.icon} {goal.title}
          </h3>
          <p className="mt-px text-[10px] text-lab-muted">{goal.tagline}</p>
        </div>
        <div className="flex shrink-0 gap-1">
          <button
            type="button"
            className="rounded-md px-1.5 py-0.5 text-[11px] text-lab-muted hover:bg-lab-wash"
            onClick={() => setGuideOpen(false)}
            title="Minimize"
          >
            –
          </button>
          <button
            type="button"
            className="rounded-md px-1.5 py-0.5 text-[11px] text-lab-muted hover:bg-red-50 hover:text-lab-hazard"
            onClick={() => abandonGoal()}
            title="Abandon goal"
          >
            ✕
          </button>
        </div>
      </div>

      <div className="border-b border-lab-line/40 px-2.5 py-1.5">
        <div className="flex items-center justify-between text-[10px] text-lab-muted">
          <span>
            {doneCount}/{goal.steps.length} steps
          </span>
          <span>{pct}%</span>
        </div>
        <div className="mt-1 h-1 overflow-hidden rounded-full bg-lab-wash">
          <div
            role="progressbar"
            aria-valuenow={pct}
            aria-valuemin={0}
            aria-valuemax={100}
            className="h-full rounded-full bg-lab-teal transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="mt-1.5 text-[10px] leading-snug text-lab-ink/80">
          {goal.productBlurb}
        </p>
      </div>

      <ol className="scroll-thin min-h-0 flex-1 space-y-0.5 overflow-y-auto px-1.5 py-1.5">
        {goal.steps.map((s, i) => {
          const isDone = completedStepIds.includes(s.id);
          const isCurrent = step?.id === s.id;
          return (
            <li
              key={s.id}
              className={`rounded-lg px-2 py-1.5 text-xs ${
                isCurrent
                  ? "bg-lab-teal/10 ring-1 ring-lab-teal/30"
                  : isDone
                    ? "opacity-70"
                    : "opacity-45"
              }`}
            >
              <div className="flex items-start gap-1.5">
                <span
                  className={`mt-px flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[9px] font-bold ${
                    isDone
                      ? "bg-lab-teal text-white"
                      : isCurrent
                        ? "bg-lab-ink text-lab-foam"
                        : "bg-lab-wash text-lab-muted"
                  }`}
                >
                  {isDone ? "✓" : i + 1}
                </span>
                <div className="min-w-0">
                  <p className="font-semibold text-lab-ink">{s.title}</p>
                  {isCurrent ? (
                    <p className="mt-px text-[11px] leading-snug text-lab-ink/85">
                      {s.instruction}
                    </p>
                  ) : null}
                </div>
              </div>
            </li>
          );
        })}
      </ol>

      {done ? (
        <div className="border-t border-lab-line/50 bg-lab-teal/10 px-2.5 py-2">
          <p className="text-xs font-semibold text-lab-teal">Goal complete</p>
          <p className="mt-0.5 text-[11px] leading-snug text-lab-ink/85">
            {goal.successBlurb}
          </p>
          <button
            type="button"
            className="mt-1.5 rounded-md bg-lab-teal px-2.5 py-1 text-[11px] font-semibold text-white"
            onClick={() => {
              abandonGoal();
              setPickerOpen(true);
            }}
          >
            Make more like this
          </button>
        </div>
      ) : step ? (
        <div className="border-t border-lab-line/50 px-2.5 py-1.5">
          <button
            type="button"
            onClick={() => setHintsOpen((v) => !v)}
            className="flex w-full items-center justify-between text-left text-[11px] font-semibold text-lab-ink"
          >
            <span>Hints for this step</span>
            <span className="text-lab-muted">{hintsOpen ? "▾" : "▸"}</span>
          </button>
          {hintsOpen ? (
            <ul className="mt-1.5 space-y-1">
              {step.hints.map((h) => {
                const key = `${goal.id}:${step.id}:${h.tier}`;
                const opened = openedHintIds.includes(key);
                return (
                  <li key={h.tier}>
                    {!opened ? (
                      <button
                        type="button"
                        className="w-full rounded-md border border-dashed border-lab-line bg-white/60 px-2 py-1 text-left text-[10px] text-lab-muted hover:border-lab-teal/50 hover:text-lab-ink"
                        onClick={() => openHint(goal.id, step.id, h.tier)}
                      >
                        Reveal {TIER_LABEL[h.tier].toLowerCase()}…
                      </button>
                    ) : (
                      <div className="rounded-md bg-lab-wash/80 px-2 py-1">
                        <p className="text-[9px] font-semibold uppercase tracking-wider text-lab-muted">
                          {TIER_LABEL[h.tier]}
                        </p>
                        <p className="mt-px text-[11px] leading-snug text-lab-ink">
                          {h.text}
                        </p>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          ) : null}
          <p className="mt-1.5 text-[9px] text-lab-muted">
            Highlighted items in Inventory match this goal.
          </p>
        </div>
      ) : null}
    </aside>
  );
}
