import type { VesselContent } from "@/types";
import { getChemical } from "@/domains/chemistry/data/chemicals";
import { getOilMeta, isOilItem } from "@/domains/chemistry/perfume/oilMeta";
import { totalMl } from "@/desk/vesselContents";
import {
  IFRA_CATEGORY_BY_ID,
  IFRA_STANDARDS_VERSION,
  lookupIfraEntry,
} from "./seed";
import type {
  IfraComplianceResult,
  IfraIngredientCheck,
  IfraOverallStatus,
  IfraProductCategoryId,
} from "./types";
import { IFRA_DISCLAIMER } from "./types";

export interface CheckIfraComplianceInput {
  contents: VesselContent[];
  category?: IfraProductCategoryId;
}

const SOLVENT_IDS = new Set(["c2h5oh", "h2o", "glycerin", "dipropylene-glycol"]);

function isScreenable(chemicalId: string): boolean {
  if (SOLVENT_IDS.has(chemicalId)) return false;
  return isOilItem(chemicalId);
}

/**
 * Pure IFRA Standards–aligned teaching screen.
 * Compares volumetric % of each fragrance material against seed limits.
 */
export function checkIfraCompliance(
  input: CheckIfraComplianceInput,
): IfraComplianceResult {
  const category: IfraProductCategoryId = input.category ?? "cat4";
  const categoryMeta = IFRA_CATEGORY_BY_ID[category];
  const total = totalMl(input.contents);
  const ingredients: IfraIngredientCheck[] = [];

  for (const c of input.contents) {
    if (!isScreenable(c.chemicalId)) continue;
    const chem = getChemical(c.chemicalId);
    const oil = getOilMeta(c.chemicalId);
    const name = chem?.name ?? c.chemicalId;
    const casNumber = oil.casNumber ?? chem?.casNumber;
    const actualPct = total > 0 ? (c.amountMl / total) * 100 : 0;
    const entry = lookupIfraEntry({
      chemicalId: c.chemicalId,
      casNumber,
    });
    const maxPct = entry?.limitsByCategory[category];

    if (maxPct === undefined) {
      ingredients.push({
        chemicalId: c.chemicalId,
        name,
        casNumber,
        actualPct,
        status: "unknown",
        message: `${name}: no teaching limit in ${categoryMeta.shortLabel} for this material.`,
      });
      continue;
    }

    const pass = actualPct <= maxPct + 1e-9;
    ingredients.push({
      chemicalId: c.chemicalId,
      name,
      casNumber,
      actualPct,
      maxPct,
      status: pass ? "pass" : "fail",
      message: pass
        ? `${name}: ${actualPct.toFixed(2)}% ≤ ${maxPct}% (${categoryMeta.shortLabel}).`
        : `${name}: ${actualPct.toFixed(2)}% exceeds ${maxPct}% teaching max (${categoryMeta.shortLabel}).`,
    });
  }

  let status: IfraOverallStatus;
  if (ingredients.length === 0) {
    status = "unknown";
  } else if (ingredients.some((i) => i.status === "fail")) {
    status = "fail";
  } else if (ingredients.every((i) => i.status === "unknown")) {
    status = "unknown";
  } else if (ingredients.some((i) => i.status === "unknown")) {
    // Known ingredients all pass, but some unknowns remain
    status = "pass";
  } else {
    status = "pass";
  }

  return {
    version: IFRA_STANDARDS_VERSION,
    category,
    categoryLabel: categoryMeta.label,
    status,
    ingredients,
    disclaimer: IFRA_DISCLAIMER,
    screened: status === "pass",
  };
}
