import type { Chemical, ReactionResult } from "../types";
import { findOrCreateProduct } from "../data/chemicals";
import { canDisplace } from "../data/reactivitySeries";
import { balanceEquation } from "./balance";

/**
 * Redox covering metal + salt with oxidation-state tracking,
 * and halogen displacement (Cl2 + KI → I2 + KCl).
 */
export function tryRedox(inputs: Chemical[]): ReactionResult | null {
  const metal = inputs.find((c) => c.category === "metal" && c.state === "solid");
  const salt = inputs.find(
    (c) =>
      c.category === "salt" &&
      c.state === "aqueous" &&
      c.cation &&
      c.oxidationStates,
  );

  if (metal && salt && salt.cation) {
    const displaced = salt.cation.replace(/\d*\+?$/, "");
    if (!canDisplace(metal.formula, displaced)) return null;

    const METAL_CHARGE: Record<string, string> = {
      Zn: "Zn2+",
      Fe: "Fe2+",
      Mg: "Mg2+",
      Cu: "Cu2+",
      Al: "Al3+",
      Ca: "Ca2+",
      Na: "Na+",
      Pb: "Pb2+",
    };
    const SALT_MAP: Record<string, { formula: string; name: string; color: string }> = {
      "Zn2+|SO4 2-": { formula: "ZnSO4", name: "Zinc Sulfate", color: "#e0e0e0" },
      "Fe2+|SO4 2-": { formula: "FeSO4", name: "Iron(II) Sulfate", color: "#81c784" },
      "Mg2+|SO4 2-": { formula: "MgSO4", name: "Magnesium Sulfate", color: "#fafafa" },
      "Cu2+|SO4 2-": { formula: "CuSO4", name: "Copper(II) Sulfate", color: "#2196f3" },
      "Zn2+|NO3-": { formula: "Zn(NO3)2", name: "Zinc Nitrate", color: "#e0e0e0" },
      "Cu2+|NO3-": { formula: "Cu(NO3)2", name: "Copper(II) Nitrate", color: "#42a5f5" },
    };

    const newCation = METAL_CHARGE[metal.formula];
    if (!newCation || !salt.anion) return null;
    const known = SALT_MAP[`${newCation}|${salt.anion}`];
    const newSalt = findOrCreateProduct(known?.formula ?? `${metal.formula}${salt.anion}`, {
      name: known?.name ?? `Salt of ${metal.formula}`,
      category: "salt",
      subcategory: "ionic-compound",
      state: "aqueous",
      color: known?.color ?? "#e0e0e0",
      cation: newCation,
      anion: salt.anion,
      oxidationStates: {
        [metal.formula]: parseInt(newCation.replace(/\D/g, "") || "2", 10),
      },
    });
    const displacedMetal = findOrCreateProduct(displaced, {
      name: displaced,
      category: "metal",
      subcategory: "elemental-metal",
      state: "solid",
      color: displaced === "Cu" ? "#b87333" : "#b0bec5",
      solubility: "n/a",
      oxidationStates: { [displaced]: 0 },
    });

    const balanced = balanceEquation(
      [metal.formula, salt.formula],
      [newSalt.formula, displacedMetal.formula],
    );

    return {
      ok: true,
      products: [newSalt, displacedMetal],
      balancedEquation:
        balanced?.label ??
        `${metal.formula} + ${salt.formula} → ${newSalt.formula} + ${displacedMetal.formula}`,
      colorChange: newSalt.color,
      explanationKey: "redox",
      reactionType: "redox",
    };
  }

  const cl2 = inputs.find((c) => c.formula === "Cl2");
  const iodide = inputs.find((c) => c.anion === "I-" && c.state === "aqueous");
  if (cl2 && iodide && iodide.cation) {
    const kcl = findOrCreateProduct(iodide.cation === "K+" ? "KCl" : "NaCl", {
      name: iodide.cation === "K+" ? "Potassium Chloride" : "Sodium Chloride",
      category: "salt",
      subcategory: "ionic-compound",
      state: "aqueous",
      color: "#ffffff",
      cation: iodide.cation,
      anion: "Cl-",
    });
    const i2 = findOrCreateProduct("I2", {
      name: "Iodine",
      category: "halogen",
      subcategory: "elemental",
      state: "aqueous",
      color: "#6a1b9a",
      hazardLevel: 2,
    });
    const balanced = balanceEquation(
      [cl2.formula, iodide.formula],
      [i2.formula, kcl.formula],
    );
    return {
      ok: true,
      products: [i2, kcl],
      balancedEquation:
        balanced?.label ?? `${cl2.formula} + ${iodide.formula} → I2 + ${kcl.formula}`,
      colorChange: "#6a1b9a",
      explanationKey: "redox",
      reactionType: "redox",
    };
  }

  return null;
}
