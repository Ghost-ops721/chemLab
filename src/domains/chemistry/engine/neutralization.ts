import type { Chemical, ReactionResult } from "../types";
import { findOrCreateProduct } from "../data/chemicals";
import { balanceEquation } from "./balance";

function saltProduct(cation: string, anion: string): Chemical {
  // Common neutralization salts
  const map: Record<string, { formula: string; name: string; color?: string }> = {
    "Na+|Cl-": { formula: "NaCl", name: "Sodium Chloride" },
    "K+|Cl-": { formula: "KCl", name: "Potassium Chloride" },
    "Na+|SO4 2-": { formula: "Na2SO4", name: "Sodium Sulfate" },
    "K+|SO4 2-": { formula: "K2SO4", name: "Potassium Sulfate" },
    "Na+|NO3-": { formula: "NaNO3", name: "Sodium Nitrate" },
    "K+|NO3-": { formula: "KNO3", name: "Potassium Nitrate" },
    "Ca2+|Cl-": { formula: "CaCl2", name: "Calcium Chloride" },
    "Ba2+|Cl-": { formula: "BaCl2", name: "Barium Chloride" },
    "Na+|CH3COO-": { formula: "CH3COONa", name: "Sodium Acetate" },
    "NH4+|Cl-": { formula: "NH4Cl", name: "Ammonium Chloride" },
    "Ca2+|SO4 2-": { formula: "CaSO4", name: "Calcium Sulfate" },
    "Ba2+|SO4 2-": { formula: "BaSO4", name: "Barium Sulfate", color: "#ffffff" },
    "Na+|PO4 3-": { formula: "Na3PO4", name: "Sodium Phosphate" },
  };

  const key = `${cation}|${anion}`;
  const known = map[key];
  if (known) {
    return findOrCreateProduct(known.formula, {
      name: known.name,
      category: "salt",
      subcategory: "ionic-compound",
      state: "aqueous",
      color: known.color ?? "#ffffff",
      solubility: "soluble",
      cation,
      anion,
      ions: [cation, anion],
    });
  }

  // Generic formula guess
  const formula = `${cation.replace(/\d*\+?$/, "")}${anion.replace(/\s*\d*-$/, "")}`;
  return findOrCreateProduct(formula, {
    name: `Salt (${cation}/${anion})`,
    category: "salt",
    subcategory: "ionic-compound",
    state: "aqueous",
    cation,
    anion,
  });
}

export function tryNeutralization(inputs: Chemical[]): ReactionResult | null {
  const acid = inputs.find((c) => c.acidBase === "acid");
  const base = inputs.find((c) => c.acidBase === "base");
  if (!acid || !base) return null;
  if (!acid.anion || !base.cation) return null;

  const water = findOrCreateProduct("H2O", {
    name: "Water",
    category: "solvent",
    subcategory: "molecular",
    state: "liquid",
    color: "#bbdefb",
    hazardLevel: 0,
  });

  const salt = saltProduct(base.cation, acid.anion);

  const balanced = balanceEquation(
    [acid.formula, base.formula],
    [salt.formula, water.formula],
  );

  const bothWeak =
    acid.acidBase === "acid" &&
    base.acidBase === "base" &&
    (acid.subcategory === "weak" ||
      acid.category === "weak-acid" ||
      base.category === "weak-base" ||
      acid.id === "ch3cooh" ||
      base.id === "nh3");

  return {
    ok: true,
    products: [salt, water],
    balancedEquation: balanced?.label ?? `${acid.formula} + ${base.formula} → ${salt.formula} + H2O`,
    colorChange: "#e3f2fd",
    heatReleased: bothWeak ? "endo" : "exo",
    explanationKey: "neutralization",
    reactionType: "neutralization",
  };
}
