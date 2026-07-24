import type {
  EngineEffect,
  LiveIfraSummary,
  LiveVesselPreview,
  VesselContent,
} from "@/types";
import { getChemical } from "@/domains/chemistry/data/chemicals";
import { FRAGRANCE_NOTE_BY_CHEMICAL_ID } from "@/domains/chemistry/perfume/fragranceNotes";
import { resolvedOilFields } from "@/domains/chemistry/perfume/oilMeta";
import {
  checkIfraCompliance,
  type IfraProductCategoryId,
} from "@/domains/chemistry/ifra";
import {
  blendFillColor,
  capacityMlForEquipment,
  fillPctFromContents,
  layerColors,
  softCapacityMl,
  totalMl,
} from "@/desk/vesselContents";
import { assessLiveHazards } from "./liveHazards";

export interface LiveFormulaInput {
  contents: VesselContent[];
  equipmentId: string;
  heatAttached?: boolean;
  coolAttached?: boolean;
  /** IFRA product category; defaults to fine fragrance (cat4). */
  ifraCategory?: IfraProductCategoryId;
}

function concentrationFromOilLoad(oilPct: number): string | undefined {
  if (oilPct <= 0) return undefined;
  if (oilPct < 4) return "Cologne (Eau de Cologne)";
  if (oilPct < 8) return "Eau de Toilette";
  if (oilPct < 15) return "Eau de Parfum";
  return "Parfum / Extrait";
}

function scentVerdict(args: {
  ethanolPct: number;
  oilLoadPct: number;
  notes: LiveVesselPreview["notes"];
  avgPleasantness: number;
  hasFragrance: boolean;
}): { verdict: string; summary: string } {
  if (!args.hasFragrance) {
    return {
      verdict: "lab-mix",
      summary: "Not a perfume formula — general lab mixture.",
    };
  }
  if (args.oilLoadPct < 0.5 && args.ethanolPct > 50) {
    return {
      verdict: "weak",
      summary:
        "Mostly alcohol — this would smell sharp and fade fast. Add more oils.",
    };
  }
  if (args.ethanolPct < 40 && args.oilLoadPct > 5) {
    return {
      verdict: "oily",
      summary:
        "Oil-heavy vs alcohol — may feel greasy and project poorly on skin.",
    };
  }
  const roles = new Set(args.notes.map((n) => n.role));
  if (!roles.has("top") || !roles.has("heart") || !roles.has("base")) {
    return {
      verdict: "unbalanced",
      summary:
        "Pyramid incomplete — need top, heart, and base notes for a wearable scent.",
    };
  }
  if (args.avgPleasantness < -0.25) {
    return {
      verdict: "harsh",
      summary:
        "This would smell harsh or off — overdose of sharp / medicinal notes.",
    };
  }
  if (args.notes.length >= 6 && args.oilLoadPct > 12) {
    return {
      verdict: "muddy",
      summary:
        "Too many strong notes at once — the blend would smell muddy and confused.",
    };
  }
  if (args.avgPleasantness < 0.1) {
    return {
      verdict: "medicinal",
      summary:
        "Leans medicinal / chemical — dial back aldehydes or mint, add softer bases.",
    };
  }
  return {
    verdict: "balanced",
    summary: "Pyramid and ratios look wearable for a teaching blend.",
  };
}

/**
 * Live formula preview — runs on every pour / amount change (before Mix).
 */
function toLiveIfraSummary(
  contents: VesselContent[],
  category: IfraProductCategoryId,
): LiveIfraSummary {
  const result = checkIfraCompliance({ contents, category });
  return {
    status: result.status,
    category: result.category,
    categoryLabel: result.categoryLabel,
    version: result.version,
    screened: result.screened,
    failCount: result.ingredients.filter((i) => i.status === "fail").length,
    unknownCount: result.ingredients.filter((i) => i.status === "unknown")
      .length,
    ingredients: result.ingredients.map((i) => ({
      chemicalId: i.chemicalId,
      name: i.name,
      actualPct: i.actualPct,
      maxPct: i.maxPct,
      status: i.status,
    })),
    disclaimer: result.disclaimer,
  };
}

export function computeLivePreview(input: LiveFormulaInput): LiveVesselPreview {
  const { contents, equipmentId, heatAttached, coolAttached, ifraCategory = "cat4" } = input;
  const total = totalMl(contents);
  const ethanol = contents.find((c) => c.chemicalId === "c2h5oh");
  const ethanolMl = ethanol?.amountMl ?? 0;
  const ethanolPct = total > 0 ? (ethanolMl / total) * 100 : 0;

  const fragranceContents = contents.filter((c) => {
    const chem = getChemical(c.chemicalId);
    return (
      Boolean(FRAGRANCE_NOTE_BY_CHEMICAL_ID[c.chemicalId]) ||
      chem?.subcategory === "fragrance" ||
      chem?.tags.includes("perfume")
    );
  });
  const oilMl = fragranceContents.reduce((s, c) => s + c.amountMl, 0);
  const oilLoadPct = total > 0 ? (oilMl / total) * 100 : 0;

  const notes: LiveVesselPreview["notes"] = [];
  let pleasantSum = 0;
  let pleasantW = 0;
  for (const c of fragranceContents) {
    const note = FRAGRANCE_NOTE_BY_CHEMICAL_ID[c.chemicalId];
    const chem = getChemical(c.chemicalId);
    const role = note?.role ?? "heart";
    if (role === "solvent") continue;
    notes.push({
      role,
      name: note?.name ?? chem?.name ?? c.chemicalId,
      amountMl: c.amountMl,
      pct: total > 0 ? (c.amountMl / total) * 100 : 0,
    });
    const oil = resolvedOilFields(c.chemicalId);
    const p = chem?.pleasantness ?? oil.pleasantness;
    const strength = (chem?.odorStrength ?? oil.odorStrength) * c.amountMl;
    pleasantSum += p * strength;
    pleasantW += strength;
  }

  const avgPleasantness = pleasantW > 0 ? pleasantSum / pleasantW : 0;
  const hasFragrance = fragranceContents.length > 0 || ethanolMl > 0;

  const capacityMl = capacityMlForEquipment(equipmentId);

  // Overdose warnings (IFRA-inspired teaching caps) + overfill spill/foam
  const hazards = assessLiveHazards({
    contents,
    heatAttached: Boolean(heatAttached),
    coolAttached: Boolean(coolAttached),
    ethanolPct,
    oilLoadPct,
    capacityMl,
    totalMl: total,
  });

  for (const c of fragranceContents) {
    const chem = getChemical(c.chemicalId);
    const max = chem?.maxSuggestedPct ?? resolvedOilFields(c.chemicalId).maxSuggestedPct;
    if (total <= 0) continue;
    const pct = (c.amountMl / total) * 100;
    if (pct > max) {
      hazards.push({
        level: "warn",
        message: `${chem?.name ?? c.chemicalId} at ${pct.toFixed(1)}% exceeds suggested ${max}% — likely harsh / IFRA-risky.`,
        effect: "turbid",
      });
    }
  }

  const scent = scentVerdict({
    ethanolPct,
    oilLoadPct,
    notes,
    avgPleasantness,
    hasFragrance: fragranceContents.length > 0,
  });

  const ifra = toLiveIfraSummary(contents, ifraCategory);
  if (ifra.status === "fail") {
    for (const ing of ifra.ingredients.filter((i) => i.status === "fail")) {
      hazards.push({
        level: "warn",
        message: `IFRA screen: ${ing.name} ${ing.actualPct.toFixed(1)}% > ${ing.maxPct}% (${ifra.categoryLabel}).`,
        effect: "turbid",
      });
    }
  }

  const layers = layerColors(contents);
  const effects: EngineEffect[] = [];
  if (layers.length >= 2) {
    effects.push({ kind: "layer", intensity: "medium", value: layers.join(",") });
  }
  for (const h of hazards) {
    if (h.effect) {
      effects.push({
        kind: h.effect,
        intensity: h.level === "danger" ? "high" : "medium",
        messageKey: h.message,
      });
    }
  }

  return {
    fillColor: blendFillColor(contents),
    layerColors: layers,
    fillPct: fillPctFromContents(contents, equipmentId),
    ethanolPct,
    oilLoadPct,
    concentrationLabel: concentrationFromOilLoad(oilLoadPct),
    scentVerdict: hasFragrance ? scent.verdict : undefined,
    scentSummary: hasFragrance ? scent.summary : undefined,
    hazards,
    notes,
    effects,
    ifra,
  };
}

/** Room left before the soft spill ceiling (not marked capacity). */
export function livePreviewRoomLeft(
  contents: VesselContent[],
  equipmentId: string,
): number {
  const cap = capacityMlForEquipment(equipmentId);
  return Math.max(0, softCapacityMl(cap) - totalMl(contents));
}
