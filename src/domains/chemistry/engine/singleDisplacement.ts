import type { Chemical, ReactionResult } from "../types";
import { findOrCreateProduct } from "../data/chemicals";
import { canDisplace } from "../data/reactivitySeries";
import { balanceEquation } from "./balance";

const METAL_CHARGE: Record<string, string> = {
  Zn: "Zn2+",
  Fe: "Fe2+",
  Mg: "Mg2+",
  Cu: "Cu2+",
  Al: "Al3+",
  Ag: "Ag+",
  Ca: "Ca2+",
  Na: "Na+",
  Pb: "Pb2+",
  K: "K+",
};

const SALT_FORMULAS: Record<string, { formula: string; name: string; color?: string }> = {
  "Zn2+|Cl-": { formula: "ZnCl2", name: "Zinc Chloride" },
  "Zn2+|SO4 2-": { formula: "ZnSO4", name: "Zinc Sulfate" },
  "Fe2+|Cl-": { formula: "FeCl2", name: "Iron(II) Chloride", color: "#a5d6a7" },
  "Fe2+|SO4 2-": { formula: "FeSO4", name: "Iron(II) Sulfate", color: "#81c784" },
  "Mg2+|Cl-": { formula: "MgCl2", name: "Magnesium Chloride" },
  "Mg2+|SO4 2-": { formula: "MgSO4", name: "Magnesium Sulfate" },
  "Cu2+|Cl-": { formula: "CuCl2", name: "Copper(II) Chloride", color: "#26a69a" },
  "Cu2+|SO4 2-": { formula: "CuSO4", name: "Copper(II) Sulfate", color: "#2196f3" },
  "Cu2+|NO3-": { formula: "Cu(NO3)2", name: "Copper(II) Nitrate", color: "#42a5f5" },
  "Ag+|NO3-": { formula: "AgNO3", name: "Silver Nitrate" },
  "Ca2+|Cl-": { formula: "CaCl2", name: "Calcium Chloride" },
  "Pb2+|NO3-": { formula: "Pb(NO3)2", name: "Lead(II) Nitrate" },
  "Al3+|Cl-": { formula: "AlCl3", name: "Aluminum Chloride" },
  "Na+|Cl-": { formula: "NaCl", name: "Sodium Chloride" },
};

function makeSalt(cation: string, anion: string): Chemical {
  const known = SALT_FORMULAS[`${cation}|${anion}`];
  if (known) {
    return findOrCreateProduct(known.formula, {
      name: known.name,
      category: "salt",
      subcategory: "ionic-compound",
      state: "aqueous",
      color: known.color ?? "#e0e0e0",
      solubility: "soluble",
      cation,
      anion,
      ions: [cation, anion],
    });
  }
  return findOrCreateProduct(`${cation}${anion}`, {
    name: `Salt (${cation}/${anion})`,
    category: "salt",
    subcategory: "ionic-compound",
    state: "aqueous",
    cation,
    anion,
  });
}

function makeMetal(symbol: string): Chemical {
  const names: Record<string, string> = {
    Cu: "Copper",
    Ag: "Silver",
    Fe: "Iron",
    Zn: "Zinc",
    Pb: "Lead",
    H: "Hydrogen",
  };
  if (symbol === "H") {
    return findOrCreateProduct("H2", {
      name: "Hydrogen",
      category: "gas",
      subcategory: "elemental-gas",
      state: "gas",
      color: "#fafafa",
      hazardLevel: 2,
      isFuel: true,
    });
  }
  return findOrCreateProduct(symbol, {
    name: names[symbol] ?? symbol,
    category: "metal",
    subcategory: "elemental-metal",
    state: "solid",
    color: "#b0bec5",
    solubility: "n/a",
  });
}

export function trySingleDisplacement(inputs: Chemical[]): ReactionResult | null {
  const metal = inputs.find((c) => c.category === "metal" && c.state === "solid");
  if (!metal) return null;

  const acid = inputs.find((c) => c.acidBase === "acid" && c.anion);
  if (acid && acid.anion) {
    if (!canDisplace(metal.formula, "H")) {
      return {
        ok: true,
        products: [],
        balancedEquation: `${metal.formula} + ${acid.formula} → no reaction`,
        explanationKey: "no-reaction",
        reactionType: "no-reaction",
      };
    }
    const cation = METAL_CHARGE[metal.formula];
    if (!cation) return null;
    const salt = makeSalt(cation, acid.anion);
    const h2 = makeMetal("H");
    const balanced = balanceEquation(
      [metal.formula, acid.formula],
      [salt.formula, "H2"],
    );
    return {
      ok: true,
      products: [salt, h2],
      balancedEquation:
        balanced?.label ?? `${metal.formula} + ${acid.formula} → ${salt.formula} + H2`,
      gasReleased: true,
      colorChange: salt.color,
      heatReleased: "exo",
      explanationKey: "single-displacement",
      reactionType: "single-displacement",
    };
  }

  const saltSoln = inputs.find(
    (c) => c.category === "salt" && c.state === "aqueous" && c.cation && c.anion,
  );
  if (saltSoln && saltSoln.cation && saltSoln.anion) {
    const displacedSymbol = saltSoln.cation.replace(/\d*\+?$/, "");
    if (!canDisplace(metal.formula, displacedSymbol)) {
      return {
        ok: true,
        products: [],
        balancedEquation: `${metal.formula} + ${saltSoln.formula} → no reaction`,
        explanationKey: "no-reaction",
        reactionType: "no-reaction",
      };
    }
    const newCation = METAL_CHARGE[metal.formula];
    if (!newCation) return null;
    const newSalt = makeSalt(newCation, saltSoln.anion);
    const displaced = makeMetal(displacedSymbol);
    const balanced = balanceEquation(
      [metal.formula, saltSoln.formula],
      [newSalt.formula, displaced.formula],
    );
    return {
      ok: true,
      products: [newSalt, displaced],
      balancedEquation:
        balanced?.label ??
        `${metal.formula} + ${saltSoln.formula} → ${newSalt.formula} + ${displaced.formula}`,
      colorChange: newSalt.color,
      precipitateFormed: displaced.state === "solid",
      explanationKey: "single-displacement",
      reactionType: "single-displacement",
    };
  }

  return null;
}
