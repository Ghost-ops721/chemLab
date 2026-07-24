import type { EngineEffectKind, VesselContent } from "@/types";
import { getChemical } from "@/domains/chemistry/data/chemicals";

export interface LiveHazard {
  level: "info" | "warn" | "danger";
  message: string;
  effect?: EngineEffectKind;
}

/**
 * Amount- and heat-aware live hazards for the Formula Inspector + vessel FX.
 * Safe-fail teaching drama — not a real lab certificate.
 */
export function assessLiveHazards(input: {
  contents: VesselContent[];
  heatAttached: boolean;
  coolAttached?: boolean;
  ethanolPct: number;
  oilLoadPct: number;
  /** Marked glassware capacity (ml). Overfill → overflow / foam FX. */
  capacityMl?: number;
  /** Current total volume (ml). */
  totalMl?: number;
}): LiveHazard[] {
  const {
    contents,
    heatAttached,
    coolAttached,
    ethanolPct,
    capacityMl,
    totalMl: totalVolume,
  } = input;
  const out: LiveHazard[] = [];
  const ids = new Set(contents.map((c) => c.chemicalId));
  const chems = contents
    .map((c) => getChemical(c.chemicalId))
    .filter(Boolean);

  if (
    capacityMl != null &&
    capacityMl > 0 &&
    totalVolume != null &&
    totalVolume > capacityMl + 0.05
  ) {
    const over = totalVolume - capacityMl;
    out.push({
      level: "warn",
      message: `Overfilled by ${over.toFixed(1)} ml — liquid spilling over the rim.`,
      effect: "overflow",
    });
    out.push({
      level: "info",
      message: "Foam / spill at the lip from overfill.",
      effect: "foam",
    });
  }

  const hasFuel = chems.some((c) => c?.isFuel || c?.id === "c2h5oh");
  const hasOxidizer = chems.some((c) => c?.isOxidizer);
  const hasOrganicOil = chems.some(
    (c) =>
      c?.subcategory === "fragrance" ||
      c?.tags.includes("perfume") ||
      c?.category === "organic",
  );
  const hasWater = ids.has("h2o") || chems.some((c) => c?.state === "aqueous");
  const hasSodium = chems.some((c) => c?.formula === "Na");
  const hasAcid = chems.some((c) => c?.acidBase === "acid");
  const hasCarbonate = chems.some(
    (c) =>
      c?.formula?.includes("CO3") ||
      c?.id === "na2co3" ||
      c?.id === "caco3",
  );
  const hasChlorine = chems.some((c) => c?.formula === "Cl2");

  if (hasFuel && heatAttached) {
    out.push({
      level: "danger",
      message:
        "Flammable — alcohol / fuel vapor can flash with open flame. In a real lab: extinguish heat, ventilate.",
      effect: "flash",
    });
    out.push({
      level: "danger",
      message: "Ignition risk — showing flash / blast drama (safe-fail).",
      effect: "blast",
    });
  } else if (hasFuel && ethanolPct >= 40) {
    out.push({
      level: "warn",
      message:
        "High ethanol — keep heat away. Flash point of ethanol is low (~13 °C).",
      effect: "steam",
    });
  }

  if (hasOxidizer && hasOrganicOil) {
    out.push({
      level: "danger",
      message:
        "Oxidizer + organic oil — incompatible. Real labs treat this as fire/explosion risk.",
      effect: "blast",
    });
  }

  if (hasSodium && hasWater) {
    out.push({
      level: "danger",
      message: "Sodium + water — violent reaction. Do not mix in a real lab.",
      effect: "burst",
    });
  }

  if (hasSodium && hasAcid) {
    out.push({
      level: "danger",
      message: "Sodium + acid — violent / hazardous.",
      effect: "blast",
    });
  }

  if (hasChlorine && hasOrganicOil) {
    out.push({
      level: "danger",
      message: "Chlorine + organics — toxic / hazardous combination.",
      effect: "dirty",
    });
  }

  if (hasAcid && hasCarbonate && !heatAttached) {
    out.push({
      level: "info",
      message: "Acid + carbonate — expect foaming CO₂ when mixed.",
      effect: "foam",
    });
  }

  if (heatAttached && hasWater) {
    out.push({
      level: "info",
      message: "Aqueous mix on heat — boiling / steam expected.",
      effect: "boil",
    });
  }

  if (coolAttached && hasWater) {
    out.push({
      level: "info",
      message: "Ice bath on — crystallization or slower reaction expected.",
      effect: "crystal",
    });
  } else if (coolAttached) {
    out.push({
      level: "info",
      message: "Cooling bath attached — temperature dropping.",
      effect: "solidify",
    });
  }

  // Heat unlocks wax / soft organics → melt (reverse of solidify crust)
  const hasMeltable = chems.some(
    (c) =>
      c?.subcategory === "wax" ||
      c?.id === "beeswax" ||
      (c?.state === "solid" &&
        (c.category === "organic" || c.tags.includes("perfume"))),
  );
  if (heatAttached && hasMeltable && !coolAttached) {
    out.push({
      level: "info",
      message: "Heat on solids — wax / organics soften and melt into the mix.",
      effect: "melt",
    });
  }

  const oilsAndWater =
    hasWater &&
    chems.some(
      (c) =>
        c?.solubility === "insoluble" || c?.subcategory === "fragrance",
    );
  if (oilsAndWater) {
    out.push({
      level: "info",
      message: "Oil + water — immiscible layers until emulsified.",
      effect: "layer",
    });
  }

  const oxidizers = chems.filter((c) => c?.isOxidizer);
  if (oxidizers.length >= 2) {
    out.push({
      level: "danger",
      message: "Two strong oxidizers together — blocked as incompatible.",
      effect: "glow",
    });
  }

  return out;
}
