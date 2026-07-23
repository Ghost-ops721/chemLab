import type { Chemical, ReactionResult } from "../types";
import { findOrCreateProduct } from "../data/chemicals";
import { balanceEquation } from "./balance";

/** Simple hydrocarbon / alcohol combustion: fuel + O2 → CO2 + H2O */
export function tryCombustion(
  inputs: Chemical[],
  hasHeat: boolean,
): ReactionResult | null {
  const fuel = inputs.find((c) => c.isFuel);
  const oxygen = inputs.find((c) => c.isOxidizer && c.formula === "O2");
  if (!fuel || !oxygen) return null;

  // Combustion typically needs ignition / heat
  if (!hasHeat && fuel.state !== "gas") {
    // Still allow if Bunsen attached; without heat, soft fail for liquids/solids
    return {
      ok: false,
      products: [],
      balancedEquation: `${fuel.formula} + O2 → (needs heat to ignite)`,
      hazardTriggered: false,
      explanationKey: "no-reaction",
      reactionType: "no-reaction",
    };
  }

  const co2 = findOrCreateProduct("CO2", {
    name: "Carbon Dioxide",
    category: "gas",
    subcategory: "molecular-gas",
    state: "gas",
    color: "#eceff1",
  });
  const water = findOrCreateProduct("H2O", {
    name: "Water",
    category: "solvent",
    subcategory: "molecular",
    state: "liquid",
    color: "#bbdefb",
  });

  // H2 special case
  if (fuel.formula === "H2") {
    const balanced = balanceEquation(["H2", "O2"], ["H2O"]);
    return {
      ok: true,
      products: [water],
      balancedEquation: balanced?.label ?? "2H2 + O2 → 2H2O",
      heatReleased: "exo",
      colorChange: "#ffcc80",
      gasReleased: false,
      explanationKey: "combustion",
      reactionType: "combustion",
    };
  }

  const balanced = balanceEquation([fuel.formula, "O2"], ["CO2", "H2O"]);
  return {
    ok: true,
    products: [co2, water],
    balancedEquation:
      balanced?.label ?? `${fuel.formula} + O2 → CO2 + H2O`,
    heatReleased: "exo",
    colorChange: "#ff8a65",
    gasReleased: true,
    explanationKey: "combustion",
    reactionType: "combustion",
  };
}
