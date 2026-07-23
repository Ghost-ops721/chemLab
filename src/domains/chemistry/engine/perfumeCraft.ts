import type { Chemical, ReactionResult } from "../types";
import { findOrCreateProduct, getChemical } from "../data/chemicals";
import {
  FRAGRANCE_NOTE_BY_CHEMICAL_ID,
  PERFUME_RECIPES,
  type PerfumeRecipe,
} from "../perfume";

function hasAll(ids: Set<string>, required: string[]) {
  return required.every((id) => ids.has(id));
}

function perfumeProduct(recipe: PerfumeRecipe): Chemical {
  const existing = getChemical(`perfume-${recipe.id}`);
  if (existing) return existing;
  return findOrCreateProduct(`perfume-${recipe.id}`, {
    name: recipe.displayName,
    category: "product",
    subcategory: "perfume",
    state: "liquid",
    color: recipe.bottleColor,
    solubility: "n/a",
    hazardLevel: 1,
    acidBase: "none",
    icon: recipe.icon,
  });
}

/**
 * Match the most specific perfume recipe whose required chemicals are all present.
 */
export function matchPerfumeRecipe(
  chemicals: Chemical[],
): PerfumeRecipe | null {
  const ids = new Set(chemicals.map((c) => c.id));
  let best: PerfumeRecipe | null = null;
  for (const recipe of PERFUME_RECIPES) {
    if (!hasAll(ids, recipe.requiredChemicalIds)) continue;
    if (
      !best ||
      recipe.requiredChemicalIds.length > best.requiredChemicalIds.length
    ) {
      best = recipe;
    }
  }
  return best;
}

/**
 * Freeform: ethanol + ≥1 top + ≥1 heart + ≥1 base note chemicals.
 */
export function canCraftFreeform(chemicals: Chemical[]): boolean {
  const ids = new Set(chemicals.map((c) => c.id));
  if (!ids.has("c2h5oh")) return false;
  let top = false;
  let heart = false;
  let base = false;
  for (const c of chemicals) {
    const note = FRAGRANCE_NOTE_BY_CHEMICAL_ID[c.id];
    if (!note) continue;
    if (note.role === "top") top = true;
    if (note.role === "heart") heart = true;
    if (note.role === "base" || note.role === "fixative") base = true;
  }
  return top && heart && base;
}

function freeformLabel(chemicals: Chemical[]): string {
  const names = chemicals
    .filter((c) => c.id !== "c2h5oh")
    .map((c) => c.name.replace(/ Oil| Absolute| Note| Accord.*/g, ""))
    .slice(0, 3);
  return names.length ? `Custom: ${names.join(" · ")}` : "Custom perfume";
}

/**
 * Perfume atelier craft — recipe match first, then freeform pyramid.
 * Legacy citrus cologne (ethanol + limonene/ethyl-acetate) still handled in productCraft.
 */
export function tryPerfumeCraft(chemicals: Chemical[]): ReactionResult | null {
  if (chemicals.length < 2) return null;
  const ids = new Set(chemicals.map((c) => c.id));
  if (!ids.has("c2h5oh")) return null;

  const recipe = matchPerfumeRecipe(chemicals);
  if (recipe) {
    const product = perfumeProduct(recipe);
    const noteParts = recipe.requiredChemicalIds
      .filter((id) => id !== "c2h5oh")
      .map((id) => getChemical(id)?.formula ?? id);
    return {
      ok: true,
      products: [product],
      balancedEquation: `C2H5OH + ${noteParts.join(" + ")} → ${recipe.displayName}`,
      colorChange: recipe.bottleColor,
      explanationKey: `product-perfume:${recipe.id}`,
      reactionType: "product-craft",
    };
  }

  if (canCraftFreeform(chemicals)) {
    const label = freeformLabel(chemicals);
    const product =
      getChemical("custom-perfume") ??
      findOrCreateProduct("custom-perfume", {
        name: label,
        category: "product",
        subcategory: "perfume",
        state: "liquid",
        color: "#f8bbd0",
        solubility: "n/a",
        hazardLevel: 1,
        acidBase: "none",
        icon: "🧴",
      });
    const scentFormulas = chemicals
      .filter((c) => c.id !== "c2h5oh")
      .map((c) => c.formula)
      .slice(0, 5);
    return {
      ok: true,
      products: [{ ...product, name: label }],
      balancedEquation: `C2H5OH + ${scentFormulas.join(" + ")} → custom perfume`,
      colorChange: "#f8bbd0",
      explanationKey: "product-perfume:custom",
      reactionType: "product-craft",
    };
  }

  return null;
}

export function isPerfumeExplanationKey(key: string | undefined): boolean {
  return Boolean(key?.startsWith("product-perfume"));
}

export function recipeIdFromExplanationKey(
  key: string | undefined,
): string | null {
  if (!key?.startsWith("product-perfume:")) return null;
  const id = key.slice("product-perfume:".length);
  return id === "custom" ? null : id;
}
