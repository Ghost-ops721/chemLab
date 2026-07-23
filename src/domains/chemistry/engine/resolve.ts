import type { Chemical, ReactionResult } from "../types";
import { tryHazard, tryHeatFlammableHazard } from "./hazards";
import { tryNeutralization } from "./neutralization";
import { tryCombustion } from "./combustion";
import { tryRedox } from "./redox";
import { trySingleDisplacement } from "./singleDisplacement";
import { tryDoubleDisplacement } from "./doubleDisplacement";
import { tryProductCraft } from "./productCraft";
import { tryPerfumeCraft } from "./perfumeCraft";

export function resolveChemistry(
  chemicals: Chemical[],
  opts: { hasHeat?: boolean; hasCool?: boolean } = {},
): ReactionResult {
  if (chemicals.length < 2) {
    return {
      ok: false,
      products: [],
      balancedEquation: "",
      explanationKey: "no-reaction",
      reactionType: "no-reaction",
    };
  }

  const hazard = tryHazard(chemicals);
  if (hazard) return hazard;

  const flash = tryHeatFlammableHazard(chemicals, Boolean(opts.hasHeat));
  if (flash) return flash;

  // Perfume atelier crafts before generic product crafts
  const perfume = tryPerfumeCraft(chemicals);
  if (perfume?.ok) return perfume;

  // Product crafts (Goals) before generic “no reaction”
  const craft = tryProductCraft(chemicals, opts);
  if (
    craft &&
    (craft.ok || craft.explanationKey.endsWith("-needs-heat"))
  ) {
    return craft;
  }

  // Priority order
  const combustion = tryCombustion(chemicals, Boolean(opts.hasHeat));
  if (combustion && combustion.ok) return combustion;
  // Soft "needs heat" from combustion — keep looking unless only fuel+O2
  if (
    combustion &&
    !combustion.ok &&
    chemicals.some((c) => c.isFuel) &&
    chemicals.some((c) => c.formula === "O2") &&
    !opts.hasHeat
  ) {
    return combustion;
  }

  const neutralization = tryNeutralization(chemicals);
  if (neutralization) return neutralization;

  // Prefer redox label for metal+salt with oxidation states
  const redox = tryRedox(chemicals);
  if (redox) return redox;

  const single = trySingleDisplacement(chemicals);
  if (single) return single;

  const dbl = tryDoubleDisplacement(chemicals);
  if (dbl) return dbl;

  if (craft) return craft;

  return {
    ok: true,
    products: [],
    balancedEquation: chemicals.map((c) => c.formula).join(" + ") + " → no reaction",
    explanationKey: "no-reaction",
    reactionType: "no-reaction",
  };
}
