"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { DeskVessel } from "@/types";
import { getGoal } from "@/domains/chemistry/data/goals";
import {
  isGoalComplete,
  newlyCompletedSteps,
} from "@/goals/goalProgress";

interface GoalState {
  activeGoalId: string | null;
  /** step ids completed for the active goal */
  completedStepIds: string[];
  /** `${goalId}:${stepId}:${tier}` keys user opened */
  openedHintIds: string[];
  completedGoalIds: string[];
  pickerOpen: boolean;
  guideOpen: boolean;
  /** Goal id for the celebration overlay; null when dismissed */
  rewardGoalId: string | null;
  /** XP shown on the reward card for the latest completion */
  rewardXp: number;
  setPickerOpen: (open: boolean) => void;
  setGuideOpen: (open: boolean) => void;
  showReward: (goalId: string, xpGained: number) => void;
  dismissReward: () => void;
  startGoal: (goalId: string) => void;
  abandonGoal: () => void;
  openHint: (goalId: string, stepId: string, tier: string) => void;
  /**
   * Sync desk → goal steps. Returns newly completed step ids
   * and whether the whole goal just finished.
   */
  syncFromDesk: (snap: {
    vessels: DeskVessel[];
    activeVesselId: string | null;
  }) => { newSteps: string[]; goalJustCompleted: boolean; goalId: string | null };
}

export const useGoalStore = create<GoalState>()(
  persist(
    (set, get) => ({
      activeGoalId: null,
      completedStepIds: [],
      openedHintIds: [],
      completedGoalIds: [],
      pickerOpen: false,
      guideOpen: false,
      rewardGoalId: null,
      rewardXp: 0,

      setPickerOpen: (open) => set({ pickerOpen: open }),
      setGuideOpen: (open) => set({ guideOpen: open }),

      showReward: (goalId, xpGained) =>
        set({ rewardGoalId: goalId, rewardXp: xpGained, guideOpen: true }),

      dismissReward: () => set({ rewardGoalId: null, rewardXp: 0 }),

      startGoal: (goalId) => {
        if (!getGoal(goalId)) return;
        set({
          activeGoalId: goalId,
          completedStepIds: [],
          openedHintIds: [],
          pickerOpen: false,
          guideOpen: true,
          rewardGoalId: null,
          rewardXp: 0,
        });
      },

      abandonGoal: () =>
        set({
          activeGoalId: null,
          completedStepIds: [],
          guideOpen: false,
          rewardGoalId: null,
          rewardXp: 0,
        }),

      openHint: (goalId, stepId, tier) => {
        const key = `${goalId}:${stepId}:${tier}`;
        set((s) =>
          s.openedHintIds.includes(key)
            ? s
            : { openedHintIds: [...s.openedHintIds, key] },
        );
      },

      syncFromDesk: (snap) => {
        const goalId = get().activeGoalId;
        if (!goalId) {
          return { newSteps: [], goalJustCompleted: false, goalId: null };
        }
        const goal = getGoal(goalId);
        if (!goal) {
          return { newSteps: [], goalJustCompleted: false, goalId: null };
        }

        const fresh = newlyCompletedSteps(
          goalId,
          get().completedStepIds,
          snap,
        );
        if (!fresh.length) {
          return { newSteps: [], goalJustCompleted: false, goalId };
        }

        const nextCompleted = [...get().completedStepIds, ...fresh];
        const justDone =
          isGoalComplete(goal, nextCompleted) &&
          !get().completedGoalIds.includes(goalId);

        set((s) => ({
          completedStepIds: nextCompleted,
          completedGoalIds: justDone
            ? [...s.completedGoalIds, goalId]
            : s.completedGoalIds,
        }));

        return {
          newSteps: fresh,
          goalJustCompleted: justDone,
          goalId,
        };
      },
    }),
    {
      name: "reactolab-goals",
      partialize: (s) => ({
        activeGoalId: s.activeGoalId,
        completedStepIds: s.completedStepIds,
        openedHintIds: s.openedHintIds,
        completedGoalIds: s.completedGoalIds,
      }),
    },
  ),
);
