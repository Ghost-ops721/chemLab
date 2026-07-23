"use client";

import { useEffect } from "react";
import { getGoal } from "@/domains/chemistry/data/goals";
import { useDeskStore } from "@/store/deskStore";
import { useGoalStore } from "@/store/goalStore";
import { useProgressStore } from "@/store/progressStore";
import { showToast } from "@/gamification/ToastHost";

/**
 * Watches the desk and advances the active product goal.
 * Mount once inside LabShell.
 */
export function GoalProgressWatcher() {
  const vessels = useDeskStore((s) => s.vessels);
  const activeVesselId = useDeskStore((s) => s.activeVesselId);
  const syncFromDesk = useGoalStore((s) => s.syncFromDesk);
  const showReward = useGoalStore((s) => s.showReward);
  const awardGoalXp = useProgressStore((s) => s.awardGoalXp);

  useEffect(() => {
    const { newSteps, goalJustCompleted, goalId } = syncFromDesk({
      vessels,
      activeVesselId,
    });
    if (!goalId) return;
    const goal = getGoal(goalId);
    if (!goal) return;

    for (const stepId of newSteps) {
      const step = goal.steps.find((s) => s.id === stepId);
      showToast({
        title: "Step complete",
        detail: step?.title ?? "Keep going",
      });
    }

    if (goalJustCompleted) {
      const { xpGained } = awardGoalXp(goal.badgeId, goal.title);
      showReward(goal.id, xpGained);
      showToast({
        title: `+${xpGained} XP · Goal complete`,
        detail: goal.title,
      });
    }
  }, [vessels, activeVesselId, syncFromDesk, awardGoalXp, showReward]);

  return null;
}
