"use client";

import { useState } from "react";
import Link from "next/link";
import { QUESTS, useProgressStore } from "@/store/progressStore";
import { useGoalStore } from "@/store/goalStore";
import { useAuthStore } from "@/store/authStore";
import { getGoal } from "@/domains/chemistry/data/goals";
import { currentStep, goalProgressPct } from "@/goals/goalProgress";

export function GamificationBar() {
  const xp = useProgressStore((s) => s.xp);
  const journal = useProgressStore((s) => s.journal);
  const badges = useProgressStore((s) => s.badges);
  const questIndex = useProgressStore((s) => s.questIndex);
  const xpLevel = useProgressStore((s) => s.xpLevel);
  const quest = QUESTS[questIndex % QUESTS.length];
  const earnedBadges = badges.filter((b) => b.earnedAt);
  const nextBadge = badges.find((b) => !b.earnedAt);
  const { level, intoLevel, toNext } = xpLevel();

  const user = useAuthStore((s) => s.user);
  const guestChemicalAdds = useAuthStore((s) => s.guestChemicalAdds);
  const guestWarn = !user && guestChemicalAdds === 1;
  const guestBlocked = !user && guestChemicalAdds >= 2;

  const activeGoalId = useGoalStore((s) => s.activeGoalId);
  const completedStepIds = useGoalStore((s) => s.completedStepIds);
  const setPickerOpen = useGoalStore((s) => s.setPickerOpen);
  const setGuideOpen = useGoalStore((s) => s.setGuideOpen);

  const goal = activeGoalId ? getGoal(activeGoalId) : undefined;
  const step = goal ? currentStep(goal, completedStepIds) : null;
  const pct = goal ? goalProgressPct(goal, completedStepIds) : 0;

  return (
    <div className="flex flex-col border-b border-white/10 bg-lab-ink text-lab-foam">
      {guestWarn ? (
        <div className="bg-lab-amber/90 px-3 py-1 text-center text-[11px] font-semibold text-lab-ink md:px-4">
          One more chemical — then you&apos;ll need an account to Mix and earn XP.{" "}
          <Link href="/signup" className="underline">
            Sign up
          </Link>
        </div>
      ) : null}
      {guestBlocked ? (
        <div className="bg-lab-teal px-3 py-1 text-center text-[11px] font-semibold text-white md:px-4">
          Sign up to Mix, react, and keep your discoveries.{" "}
          <Link href="/signup" className="underline">
            Create account
          </Link>
        </div>
      ) : null}

      <div className="flex items-center gap-2 px-3 py-1 md:gap-3 md:px-4">
        <div className="flex shrink-0 flex-col leading-none">
          <div className="flex items-baseline gap-1.5">
            <span className="text-[9px] uppercase tracking-[0.18em] text-lab-glass">
              Lv {level}
            </span>
            <span className="font-display text-base text-lab-foam">{xp}</span>
            <span className="text-[9px] text-lab-glass">XP</span>
          </div>
          <div className="mt-0.5 h-1 w-16 overflow-hidden rounded-full bg-white/15">
            <div
              className="h-full rounded-full bg-lab-glass"
              style={{ width: `${intoLevel}%` }}
            />
          </div>
          <p className="mt-0.5 text-[8px] text-lab-glass/80">
            {toNext} to next level
            {nextBadge ? ` · next: ${nextBadge.title}` : ""}
          </p>
        </div>

        <div className="hidden h-8 w-px bg-white/15 sm:block" />

        <div className="min-w-0 flex-1">
          {goal ? (
            <>
              <p className="text-[9px] uppercase tracking-[0.16em] text-lab-glass">
                Goal · {pct}%
              </p>
              <button
                type="button"
                className="block w-full truncate text-left text-xs text-lab-foam/95 hover:text-white"
                onClick={() => setGuideOpen(true)}
              >
                {goal.icon} {goal.title}
                {step ? ` — ${step.title}` : " — complete!"}
              </button>
            </>
          ) : (
            <>
              <p className="text-[9px] uppercase tracking-[0.16em] text-lab-glass">
                Free-play quest
              </p>
              <p className="truncate text-xs text-lab-foam/95">{quest?.prompt}</p>
            </>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-0.5" title="Badges earned">
          {badges.slice(0, 6).map((b) => (
            <span
              key={b.id}
              className={`inline-block h-2 w-2 rounded-full ${
                b.earnedAt ? "bg-lab-amber" : "bg-white/20"
              }`}
              title={b.earnedAt ? b.title : `Locked: ${b.title}`}
            />
          ))}
          <span className="ml-1 text-[10px] text-lab-foam/70">
            {earnedBadges.length}/{badges.length}
          </span>
        </div>

        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          className="shrink-0 rounded-lg bg-lab-teal px-2.5 py-1 text-[11px] font-semibold text-white shadow-sm transition hover:bg-lab-teal/90"
        >
          Goals
        </button>

        <div className="hidden items-center gap-2 text-[11px] text-lab-foam/65 md:flex">
          <span>{journal.length} logged</span>
        </div>
      </div>
    </div>
  );
}

export function RecipeJournal() {
  const [open, setOpen] = useState(false);
  const journal = useProgressStore((s) => s.journal);
  const badges = useProgressStore((s) => s.badges);

  return (
    <div className="hidden border-t border-lab-line/50 bg-lab-panel/95 md:block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-3 py-1.5 text-left text-xs text-lab-ink hover:bg-lab-wash/50"
      >
        <span className="font-medium">
          Recipe log & badges
          <span className="ml-1.5 text-[10px] font-normal text-lab-muted">
            {journal.length} discoveries
          </span>
        </span>
        <span className="text-lab-muted">{open ? "▾" : "▴"}</span>
      </button>
      {open ? (
        <div className="grid max-h-40 grid-cols-1 gap-3 overflow-hidden border-t border-lab-line/40 px-3 py-2 sm:grid-cols-2">
          <div className="scroll-thin min-h-0 overflow-y-auto">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-lab-muted">
              Equations found
            </p>
            <ul className="mt-1.5 space-y-1">
              {journal.length === 0 ? (
                <li className="text-xs text-lab-muted">
                  Mix something new to fill this log.
                </li>
              ) : (
                journal.slice(0, 10).map((e) => (
                  <li
                    key={`${e.discoveryId}-${e.at}`}
                    className={`truncate font-mono text-[11px] ${
                      e.ok ? "text-lab-ink" : "text-lab-hazard"
                    }`}
                  >
                    {e.label}
                  </li>
                ))
              )}
            </ul>
          </div>
          <div className="scroll-thin min-h-0 overflow-y-auto">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-lab-muted">
              Badges
            </p>
            <ul className="mt-1.5 space-y-1.5">
              {badges.map((b) => (
                <li
                  key={b.id}
                  className={`text-xs ${
                    b.earnedAt ? "text-lab-teal" : "text-lab-muted/65"
                  }`}
                >
                  <span className="mr-1.5">{b.earnedAt ? "●" : "○"}</span>
                  {b.title}
                  <span className="ml-1 text-[10px] text-lab-muted">
                    — {b.description}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}
    </div>
  );
}
