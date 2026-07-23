import type { Chemical, ReactionResult } from "../types";

/** Unsafe / blocked combinations — fail safely with hazard explanation + FX hints. */
export function tryHazard(inputs: Chemical[]): ReactionResult | null {
  const formulas = new Set(inputs.map((c) => c.formula));
  const ids = new Set(inputs.map((c) => c.id));

  // Sodium + water (or aqueous) — violent
  if (
    formulas.has("Na") &&
    (formulas.has("H2O") || inputs.some((c) => c.state === "aqueous"))
  ) {
    return {
      ok: false,
      products: [],
      balancedEquation: "Na + H2O → blocked (violent reaction)",
      hazardTriggered: true,
      explanationKey: "hazard-sodium-water",
      reactionType: "hazard",
      gasReleased: true,
      colorChange: "#ff7043",
    };
  }

  // Chlorine with organics / fuels — toxic / dangerous
  if (
    formulas.has("Cl2") &&
    inputs.some((c) => c.isFuel || c.category === "organic")
  ) {
    return {
      ok: false,
      products: [],
      balancedEquation: "Cl2 + organic → blocked (hazardous)",
      hazardTriggered: true,
      explanationKey: "hazard-chlorine",
      reactionType: "hazard",
      colorChange: "#aed581",
    };
  }

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

  // High hazardLevel pairs that shouldn't mix: Na + acid
  if (formulas.has("Na") && inputs.some((c) => c.acidBase === "acid")) {
    return {
      ok: false,
      products: [],
      balancedEquation: "Na + acid → blocked (violent)",
      hazardTriggered: true,
      explanationKey: "hazard-incompatible",
      reactionType: "hazard",
      gasReleased: true,
    };
  }

  // Oxidizer + fragrance oil — not intentional fuel+O2 combustion
  const hasOxygen = inputs.some((c) => c.formula === "O2" || c.id === "o2");
  if (
    !hasOxygen &&
    inputs.some((c) => c.isOxidizer) &&
    inputs.some(
      (c) =>
        c.subcategory === "fragrance" ||
        c.tags.includes("perfume") ||
        (c.isFuel && c.id !== "o2"),
    )
  ) {
    return {
      ok: false,
      products: [],
      balancedEquation: "oxidizer + organic → blocked (fire risk)",
      hazardTriggered: true,
      explanationKey: "hazard-oxidizer-organic",
      reactionType: "hazard",
      heatReleased: "exo",
      colorChange: "#ff5722",
    };
  }

  // Ethanol / fuel + heat is handled at mix time via opts — soft block when flagged
  void ids;
  return null;
}

/**
 * Extra hazard when heat is attached to a flammable perfume / ethanol mix.
 * Does not block intentional combustion (fuel + O₂ + heat).
 */
export function tryHeatFlammableHazard(
  inputs: Chemical[],
  hasHeat: boolean,
): ReactionResult | null {
  if (!hasHeat) return null;

  const hasOxygen = inputs.some((c) => c.formula === "O2" || c.id === "o2");
  if (hasOxygen) return null;

  const hasEthanol = inputs.some((c) => c.id === "c2h5oh");
  const hasFragrance = inputs.some(
    (c) =>
      c.subcategory === "fragrance" || c.tags.includes("perfume"),
  );
  if (!hasEthanol && !hasFragrance) return null;

  const hasFuel = inputs.some((c) => c.isFuel || c.id === "c2h5oh");
  if (!hasFuel) return null;

  return {
    ok: false,
    products: [],
    balancedEquation: "C2H5OH + heat → flash / fire risk (blocked)",
    hazardTriggered: true,
    explanationKey: "hazard-ethanol-flash",
    reactionType: "hazard",
    heatReleased: "exo",
    gasReleased: true,
    colorChange: "#ff9800",
  };
}
