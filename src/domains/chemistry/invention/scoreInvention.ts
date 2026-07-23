import { getGoal } from "@/domains/chemistry/data/goals";
import {
  FRAGRANCE_NOTE_BY_CHEMICAL_ID,
  getPerfumeRecipe,
} from "@/domains/chemistry/perfume";
import type {
  FormulaSnapshot,
  InventionScoreResult,
  MasteryTier,
} from "./types";

function uniqueCount(ids: string[]): number {
  return new Set(ids).size;
}

function perfumeRoleCoverage(contentIds: string[]): {
  top: number;
  heart: number;
  base: number;
  solvent: boolean;
} {
  let top = 0;
  let heart = 0;
  let base = 0;
  let solvent = false;
  for (const id of contentIds) {
    if (id === "c2h5oh") solvent = true;
    const note = FRAGRANCE_NOTE_BY_CHEMICAL_ID[id];
    if (!note) continue;
    if (note.role === "top") top += 1;
    else if (note.role === "heart") heart += 1;
    else if (note.role === "base" || note.role === "fixative") base += 1;
  }
  return { top, heart, base, solvent };
}

/**
 * Deterministic mastery score (0–100).
 * Make = crafted successfully; Refine = efficient / ordered;
 * Signature = authored pyramid that still reads as the product family.
 */
export function scoreInvention(input: {
  snapshot: FormulaSnapshot;
  sourceGoalId?: string;
  perfumeRecipeId?: string;
  kind?: string;
}): InventionScoreResult {
  const notes: string[] = [];
  let score = 0;
  const { snapshot } = input;
  const contentIds = snapshot.contentIds;
  const resultOk = snapshot.lastResult?.ok === true;

  if (!resultOk && contentIds.length === 0) {
    return { score: 0, tier: "make", notes: ["Empty bench — nothing to score yet."] };
  }

  // Base competence for a successful reaction / craft
  if (resultOk) {
    score += 40;
    notes.push("Craft succeeded on the desk.");
  } else if (contentIds.length >= 2) {
    score += 15;
    notes.push("Blend loaded, but Mix has not succeeded yet.");
  }

  const perfumeId = input.perfumeRecipeId ?? input.sourceGoalId;
  const recipe = perfumeId ? getPerfumeRecipe(perfumeId) : undefined;
  const goal = input.sourceGoalId ? getGoal(input.sourceGoalId) : undefined;

  if (recipe) {
    const required = new Set(recipe.requiredChemicalIds);
    const present = contentIds.filter((id) => required.has(id));
    const missing = recipe.requiredChemicalIds.filter(
      (id) => !contentIds.includes(id),
    );
    const extras = contentIds.filter((id) => !required.has(id));

    if (missing.length === 0) {
      score += 25;
      notes.push("All signature notes for this scent are present.");
    } else {
      score += Math.round(
        (present.length / Math.max(1, recipe.requiredChemicalIds.length)) * 18,
      );
      notes.push(
        `Missing ${missing.length} required note(s) for ${recipe.displayName}.`,
      );
    }

    if (extras.length === 0 && missing.length === 0) {
      score += 15;
      notes.push("Clean formula — no wasted reagents.");
    } else if (extras.length <= 1) {
      score += 8;
      notes.push("Nearly clean formula.");
    } else {
      notes.push(`${extras.length} extra reagents dilute the accord.`);
    }
  } else if (goal) {
    const highlights = goal.highlightItemIds.filter((id) =>
      contentIds.includes(id),
    );
    if (highlights.length > 0) {
      score += Math.min(25, 8 * highlights.length);
      notes.push(`Hit ${highlights.length} goal highlight reagent(s).`);
    }
  }

  // Process craftsmanship
  if (snapshot.stirLevel >= 2) {
    score += 10;
    notes.push("Well mixed (stir ≥ 2).");
  } else if (snapshot.stirLevel >= 1) {
    score += 4;
    notes.push("Lightly stirred.");
  }

  const needsHeat =
    snapshot.lastResult?.explanationKey === "product-soap" ||
    snapshot.lastResult?.explanationKey === "product-soap-needs-heat" ||
    goal?.id?.includes("soap");
  if (needsHeat) {
    if (snapshot.heatAttached) {
      score += 10;
      notes.push("Heat applied for saponification.");
    } else {
      notes.push("Soap craft wants heat — attach a burner.");
    }
  }

  // Perfume / freeform authorship (signature path)
  const coverage = perfumeRoleCoverage(contentIds);
  const fullPyramid =
    coverage.solvent &&
    coverage.top >= 1 &&
    coverage.heart >= 1 &&
    coverage.base >= 1;

  if (fullPyramid) {
    score += 12;
    notes.push("Full scent pyramid (top · heart · base) with ethanol.");
  }

  if (
    snapshot.perfumeNotes &&
    snapshot.perfumeNotes.top.length &&
    snapshot.perfumeNotes.heart.length &&
    snapshot.perfumeNotes.base.length
  ) {
    score += 8;
    notes.push("Named pyramid authored in freeform.");
  }

  // Slight penalty for overcrowded vessels
  if (uniqueCount(contentIds) > 6) {
    score -= 5;
    notes.push("Crowded vessel — simplify for a cleaner score.");
  }

  score = Math.max(0, Math.min(100, Math.round(score)));

  let tier: MasteryTier = "make";
  if (score >= 80 && (fullPyramid || (recipe && resultOk))) {
    tier = "signature";
  } else if (score >= 60) {
    tier = "refine";
  }

  if (tier === "signature") {
    notes.push("Signature tier — this reads as yours.");
  } else if (tier === "refine") {
    notes.push("Refine tier — tighten ratios to go signature.");
  } else {
    notes.push("Make tier — craft succeeded; now refine it.");
  }

  return { score, tier, notes };
}
