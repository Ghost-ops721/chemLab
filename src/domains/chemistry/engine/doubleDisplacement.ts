import type { Chemical, ReactionResult } from "../types";
import { findOrCreateProduct, getChemical } from "../data/chemicals";
import { wouldPrecipitate } from "../data/solubility";
import { balanceEquation } from "./balance";

const PRODUCT_LOOKUP: Record<
  string,
  { formula: string; name: string; color: string; id?: string }
> = {
  "Ag+|Cl-": { formula: "AgCl", name: "Silver Chloride", color: "#f5f5f5", id: "agcl" },
  "Ag+|Br-": { formula: "AgBr", name: "Silver Bromide", color: "#fff8e1" },
  "Ag+|I-": { formula: "AgI", name: "Silver Iodide", color: "#fff59d" },
  "Ba2+|SO4 2-": { formula: "BaSO4", name: "Barium Sulfate", color: "#ffffff", id: "baso4" },
  "Pb2+|I-": { formula: "PbI2", name: "Lead(II) Iodide", color: "#ffc107", id: "pbi2" },
  "Pb2+|Cl-": { formula: "PbCl2", name: "Lead(II) Chloride", color: "#fafafa" },
  "Pb2+|SO4 2-": { formula: "PbSO4", name: "Lead(II) Sulfate", color: "#ffffff" },
  "Ca2+|CO3 2-": { formula: "CaCO3", name: "Calcium Carbonate", color: "#ffffff" },
  "Ba2+|CO3 2-": { formula: "BaCO3", name: "Barium Carbonate", color: "#ffffff" },
  "Ag+|CrO4 2-": { formula: "Ag2CrO4", name: "Silver Chromate", color: "#c62828" },
  "Ba2+|CrO4 2-": { formula: "BaCrO4", name: "Barium Chromate", color: "#fbc02d" },
  "Fe2+|OH-": { formula: "Fe(OH)2", name: "Iron(II) Hydroxide", color: "#8d6e63" },
  "Cu2+|OH-": { formula: "Cu(OH)2", name: "Copper(II) Hydroxide", color: "#29b6f6" },
  "Mg2+|OH-": { formula: "Mg(OH)2", name: "Magnesium Hydroxide", color: "#eeeeee" },
  "Na+|NO3-": { formula: "NaNO3", name: "Sodium Nitrate", color: "#ffffff", id: "nano3" },
  "Na+|Cl-": { formula: "NaCl", name: "Sodium Chloride", color: "#ffffff", id: "nacl" },
  "K+|NO3-": { formula: "KNO3", name: "Potassium Nitrate", color: "#ffffff" },
  "K+|Cl-": { formula: "KCl", name: "Potassium Chloride", color: "#ffffff", id: "kcl" },
  "Na+|SO4 2-": { formula: "Na2SO4", name: "Sodium Sulfate", color: "#ffffff" },
  "K+|SO4 2-": { formula: "K2SO4", name: "Potassium Sulfate", color: "#ffffff" },
  "Ba2+|Cl-": { formula: "BaCl2", name: "Barium Chloride", color: "#ffffff", id: "bacl2" },
  "Na+|I-": { formula: "NaI", name: "Sodium Iodide", color: "#ffffff" },
  "Pb2+|NO3-": { formula: "Pb(NO3)2", name: "Lead(II) Nitrate", color: "#ffffff", id: "pbno32" },
};

function makeIonic(
  cation: string,
  anion: string,
  asPrecipitate: boolean,
): Chemical {
  const key = `${cation}|${anion}`;
  const known = PRODUCT_LOOKUP[key];
  if (known?.id) {
    const seeded = getChemical(known.id);
    if (seeded) {
      return {
        ...seeded,
        state: asPrecipitate ? "solid" : seeded.state,
        solubility: asPrecipitate ? "insoluble" : seeded.solubility,
      };
    }
  }
  if (known) {
    return findOrCreateProduct(known.formula, {
      name: known.name,
      category: "salt",
      subcategory: "ionic-compound",
      state: asPrecipitate ? "solid" : "aqueous",
      color: known.color,
      solubility: asPrecipitate ? "insoluble" : "soluble",
      cation,
      anion,
      ions: [cation, anion],
    });
  }
  return findOrCreateProduct(`${cation}${anion}`, {
    name: `Compound (${cation}/${anion})`,
    category: "salt",
    subcategory: "ionic-compound",
    state: asPrecipitate ? "solid" : "aqueous",
    solubility: asPrecipitate ? "insoluble" : "soluble",
    cation,
    anion,
  });
}

export function tryDoubleDisplacement(inputs: Chemical[]): ReactionResult | null {
  const aqueous = inputs.filter(
    (c) =>
      (c.state === "aqueous" || c.solubility === "soluble") &&
      c.cation &&
      c.anion &&
      c.category !== "acid" &&
      c.category !== "base",
  );

  // Also allow acid+carbonate as gas-forming separately; here two salts / salt+salt
  const ionics = inputs.filter((c) => c.cation && c.anion);
  if (ionics.length < 2) return null;

  const [a, b] = ionics;
  if (!a?.cation || !a.anion || !b?.cation || !b.anion) return null;
  if (a.id === b.id) return null;

  // Skip pure acid+base (handled by neutralization)
  if (
    (a.acidBase === "acid" && b.acidBase === "base") ||
    (a.acidBase === "base" && b.acidBase === "acid")
  ) {
    return null;
  }

  // Acid + carbonate → gas-forming
  const acid = ionics.find((c) => c.acidBase === "acid");
  const carbonate = ionics.find((c) => c.anion === "CO3 2-" || c.anion === "SO3 2-");
  if (acid && carbonate && carbonate.cation && acid.anion) {
    const salt = makeIonic(carbonate.cation, acid.anion, false);
    const water = findOrCreateProduct("H2O", {
      name: "Water",
      category: "solvent",
      subcategory: "molecular",
      state: "liquid",
      color: "#bbdefb",
    });
    const gas =
      carbonate.anion === "CO3 2-"
        ? findOrCreateProduct("CO2", {
            name: "Carbon Dioxide",
            category: "gas",
            subcategory: "molecular-gas",
            state: "gas",
            color: "#eceff1",
          })
        : findOrCreateProduct("SO2", {
            name: "Sulfur Dioxide",
            category: "gas",
            subcategory: "molecular-gas",
            state: "gas",
            color: "#fff9c4",
            hazardLevel: 2,
          });
    const balanced = balanceEquation(
      [acid.formula, carbonate.formula],
      [salt.formula, water.formula, gas.formula],
    );
    return {
      ok: true,
      products: [salt, water, gas],
      balancedEquation:
        balanced?.label ??
        `${acid.formula} + ${carbonate.formula} → ${salt.formula} + H2O + ${gas.formula}`,
      gasReleased: true,
      colorChange: "#e0f7fa",
      explanationKey: "gas-forming",
      reactionType: "gas-forming",
    };
  }

  if (aqueous.length < 2 && !(a.state === "aqueous" && b.state === "aqueous")) {
    // Need two aqueous ionics for classic precip
    if (!(a.cation && b.cation)) return null;
  }

  const ppt = wouldPrecipitate(a.cation, a.anion, b.cation, b.anion);
  const product1Ppt = ppt
    ? ppt.cation === a.cation && ppt.anion === b.anion
    : false;
  const cross1 = makeIonic(a.cation, b.anion, Boolean(ppt && product1Ppt));
  const cross2 = makeIonic(
    b.cation,
    a.anion,
    Boolean(ppt && !product1Ppt),
  );

  // Ensure precipitate state
  if (ppt) {
    if (ppt.cation === a.cation && ppt.anion === b.anion) {
      cross1.state = "solid";
      cross1.solubility = "insoluble";
    } else {
      cross2.state = "solid";
      cross2.solubility = "insoluble";
    }
  }

  const balanced = balanceEquation(
    [a.formula, b.formula],
    [cross1.formula, cross2.formula],
  );

  if (!ppt) {
    // Still a double displacement conceptually but no observable ppt
    return {
      ok: true,
      products: [cross1, cross2],
      balancedEquation:
        balanced?.label ??
        `${a.formula} + ${b.formula} → ${cross1.formula} + ${cross2.formula}`,
      explanationKey: "double-displacement",
      reactionType: "double-displacement",
      colorChange: cross1.color,
    };
  }

  return {
    ok: true,
    products: [cross1, cross2],
    balancedEquation:
      balanced?.label ??
      `${a.formula} + ${b.formula} → ${cross1.formula} + ${cross2.formula}`,
    precipitateFormed: true,
    colorChange: (cross1.state === "solid" ? cross1.color : cross2.color) ?? "#eeeeee",
    explanationKey: "precipitation",
    reactionType: "precipitation",
  };
}
