import type { Chemical, ReactionResult } from "../types";

/** Unsafe / blocked combinations — fail safely with hazard explanation. */
export function tryHazard(inputs: Chemical[]): ReactionResult | null {
  const ids = new Set(inputs.map((c) => c.id));
  const formulas = new Set(inputs.map((c) => c.formula));

  // Sodium + water (or aqueous) — violent
  if (formulas.has("Na") && (formulas.has("H2O") || inputs.some((c) => c.state === "aqueous"))) {
    return {
      ok: false,
      products: [],
      balancedEquation: "Na + H2O → blocked (violent reaction)",
      hazardTriggered: true,
      explanationKey: "hazard-sodium-water",
      reactionType: "hazard",
    };
  }

  // Chlorine with organics / fuels — toxic / dangerous
  if (formulas.has("Cl2") && inputs.some((c) => c.isFuel || c.category === "organic")) {
    return {
      ok: false,
      products: [],
      balancedEquation: "Cl2 + organic → blocked (hazardous)",
      hazardTriggered: true,
      explanationKey: "hazard-chlorine",
      reactionType: "hazard",
    };
  }

  // Conc. acid + strong base already handled; concentrated H2SO4 + sugar is ok as combustion-ish
  // Two strong oxidizers
  const oxidizers = inputs.filter((c) => c.isOxidizer);
  if (oxidizers.length >= 2) {
    return {
      ok: false,
      products: [],
      balancedEquation: "oxidizer + oxidizer → blocked",
      hazardTriggered: true,
      explanationKey: "hazard-incompatible",
      reactionType: "hazard",
    };
  }

  // Lead compounds + strong reducing metals already go through engine;
  // High hazardLevel pairs that shouldn't mix: Na + acid
  if (formulas.has("Na") && inputs.some((c) => c.acidBase === "acid")) {
    return {
      ok: false,
      products: [],
      balancedEquation: "Na + acid → blocked (violent)",
      hazardTriggered: true,
      explanationKey: "hazard-incompatible",
      reactionType: "hazard",
    };
  }

  void ids;
  return null;
}
