import { describe, expect, it } from "vitest";
import { newlyCompletedSteps } from "@/goals/goalProgress";
import {
  clearPerfumeGoalCache,
  getPerfumeGoal,
  perfumeRecipeToGoal,
} from "@/domains/chemistry/perfume/perfumeGoalFactory";
import { getPerfumeRecipe, PERFUME_RECIPES } from "@/domains/chemistry/perfume";
import { defaultPourMl } from "@/desk/vesselContents";

function emptyFx() {
  return {};
}

function vessel(
  partial: Partial<{
    instanceId: string;
    equipmentId: string;
    contentIds: string[];
    heatAttached: boolean;
    coolAttached: boolean;
    stirLevel: number;
    shakeAt?: number;
    lastResult?: unknown;
  }>,
) {
  return {
    instanceId: partial.instanceId ?? "v1",
    equipmentId: partial.equipmentId ?? "beaker",
    contentIds: partial.contentIds ?? [],
    contents: (partial.contentIds ?? []).map((chemicalId) => ({
      chemicalId,
      amountMl: defaultPourMl(chemicalId),
    })),
    heatAttached: partial.heatAttached ?? false,
    coolAttached: partial.coolAttached ?? false,
    position: { x: 0, y: 0 },
    stirLevel: partial.stirLevel ?? 0,
    fx: { ...emptyFx(), ...(partial.shakeAt ? { shakeAt: partial.shakeAt } : {}) },
    lastResult: partial.lastResult,
  };
}

describe("perfume goal difficulty factory", () => {
  it("assigns difficulties and step budgets in range", () => {
    clearPerfumeGoalCache();
    const counts = { easy: 0, medium: 0, hard: 0, "very-hard": 0 };
    for (const r of PERFUME_RECIPES) {
      counts[r.difficulty]++;
      const g = perfumeRecipeToGoal(r);
      expect(g.difficulty).toBe(r.difficulty);
      const n = g.steps.length;
      if (r.difficulty === "easy") expect(n).toBeGreaterThanOrEqual(6);
      if (r.difficulty === "easy") expect(n).toBeLessThanOrEqual(9);
      if (r.difficulty === "medium") expect(n).toBeGreaterThanOrEqual(10);
      if (r.difficulty === "medium") expect(n).toBeLessThanOrEqual(14);
      if (r.difficulty === "hard") expect(n).toBeGreaterThanOrEqual(15);
      if (r.difficulty === "hard") expect(n).toBeLessThanOrEqual(20);
      if (r.difficulty === "very-hard") expect(n).toBeGreaterThanOrEqual(21);
      if (r.difficulty === "very-hard") expect(n).toBeLessThanOrEqual(30);
    }
    expect(counts.easy).toBeGreaterThan(10);
    expect(counts.hard).toBeGreaterThan(5);
    expect(counts["very-hard"]).toBeGreaterThanOrEqual(4);
  });

  it("marks Havas as Hard with dual-vessel gates", () => {
    clearPerfumeGoalCache();
    const recipe = getPerfumeRecipe("inspired-havas")!;
    expect(recipe.difficulty).toBe("hard");
    const goal = getPerfumeGoal("inspired-havas")!;
    expect(goal.steps.length).toBeGreaterThanOrEqual(15);
    expect(goal.steps.some((s) => /beaker B|second/i.test(s.title))).toBe(true);
  });
});

describe("goalProgress perfume gates", () => {
  it("easy citrus-style cascade still works when stir + mix ready", () => {
    clearPerfumeGoalCache();
    // Pick an easy recipe
    const easy = PERFUME_RECIPES.find((r) => r.difficulty === "easy")!;
    const goal = getPerfumeGoal(easy.id)!;
    const ids = easy.requiredChemicalIds;
    const snap = {
      vessels: [
        vessel({
          contentIds: ids,
          stirLevel: 1,
          lastResult: {
            ok: true,
            products: [],
            effects: [],
            discoveryId: "x",
            explanationKey: `product-perfume:${easy.id}`,
            label: easy.displayName,
          },
        }),
      ],
      activeVesselId: "v1",
    };
    const fresh = newlyCompletedSteps(easy.id, [], snap as never);
    expect(fresh.length).toBe(goal.steps.length);
    expect(fresh.at(-1)).toContain("mix");
  });

  it("hard Havas does not complete from a single full beaker without dual vessels / shake", () => {
    clearPerfumeGoalCache();
    const goal = getPerfumeGoal("inspired-havas")!;
    const snap = {
      vessels: [
        vessel({
          contentIds: [
            "c2h5oh",
            "cardamom-oil",
            "saffron-note",
            "oud-oil",
          ],
          stirLevel: 3,
          lastResult: {
            ok: true,
            products: [],
            effects: [],
            discoveryId: "x",
            explanationKey: "product-perfume:inspired-havas",
            label: "Havas",
          },
        }),
      ],
      activeVesselId: "v1",
    };
    const fresh = newlyCompletedSteps("inspired-havas", [], snap as never);
    // Place beaker + ethanol + top may pass; dual-beaker gate must block full clear
    expect(fresh.length).toBeLessThan(goal.steps.length);
    expect(fresh.some((id) => id.includes("glass-b") || id.includes("heart-b"))).toBe(
      false,
    );
  });

  it("hard Havas completes when dual vessels, combine, stir, shake, and mix are satisfied", () => {
    clearPerfumeGoalCache();
    const goal = getPerfumeGoal("inspired-havas")!;
    const full = ["c2h5oh", "cardamom-oil", "saffron-note", "oud-oil"];
    const snap = {
      vessels: [
        vessel({
          instanceId: "a",
          contentIds: full,
          stirLevel: 2,
          shakeAt: Date.now(),
          lastResult: {
            ok: true,
            products: [],
            effects: [],
            discoveryId: "x",
            explanationKey: "product-perfume:inspired-havas",
            label: "Havas",
          },
        }),
        vessel({
          instanceId: "b",
          contentIds: [],
          stirLevel: 0,
        }),
      ],
      activeVesselId: "a",
    };
    // Heart-in-B alone won't be true (saffron only in A). Simulate after combine:
    // heart was poured into B then combined into A — heartSolo check needs a vessel
    // with only saffron OR saffron present. vesselHas([heart]) passes if A has saffron.
    const fresh = newlyCompletedSteps("inspired-havas", [], snap as never);
    expect(fresh.length).toBe(goal.steps.length);
    expect(fresh.at(-1)).toContain("mix");
  });
});
