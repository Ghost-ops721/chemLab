import type { GoalDeskSnapshot, ProductGoal } from "@/domains/chemistry/data/goals";
import { getGoal } from "@/domains/chemistry/data/goals";

/** First incomplete step, or null if goal finished. */
export function currentStep(goal: ProductGoal, completedStepIds: string[]) {
  return goal.steps.find((s) => !completedStepIds.includes(s.id)) ?? null;
}

/** Steps that newly pass given current desk snapshot. */
export function newlyCompletedSteps(
  goalId: string,
  completedStepIds: string[],
  snap: GoalDeskSnapshot,
): string[] {
  const goal = getGoal(goalId);
  if (!goal) return [];
  const done = new Set(completedStepIds);
  const fresh: string[] = [];

  // Advance in order, cascading through every consecutive step that already passes
  // (so dumping all ingredients + Mix doesn't leave the user stuck on Formula check).
  for (const step of goal.steps) {
    if (done.has(step.id)) continue;
    if (step.check(snap)) {
      fresh.push(step.id);
      done.add(step.id);
      continue;
    }
    break;
  }
  return fresh;
}

export function isGoalComplete(goal: ProductGoal, completedStepIds: string[]) {
  return goal.steps.every((s) => completedStepIds.includes(s.id));
}

export function goalProgressPct(goal: ProductGoal, completedStepIds: string[]) {
  if (!goal.steps.length) return 0;
  const n = goal.steps.filter((s) => completedStepIds.includes(s.id)).length;
  return Math.round((n / goal.steps.length) * 100);
}
