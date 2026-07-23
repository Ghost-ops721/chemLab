import type { EngineEffect, EngineResult, Item } from "@/types";
import type { ReactionResult } from "./types";

function discoveryId(reactants: string[], label: string, type: string): string {
  const sorted = [...reactants].sort().join("+");
  return `${type}::${sorted}::${label}`;
}

export function adaptReactionResult(
  result: ReactionResult,
  reactantIds: string[],
): EngineResult {
  const effects: EngineEffect[] = [];

  if (result.hazardTriggered || result.reactionType === "hazard") {
    effects.push({
      kind: "hazard",
      intensity: "high",
      messageKey: result.explanationKey,
    });
  }

  if (result.colorChange) {
    effects.push({ kind: "color", value: result.colorChange });
  }

  if (result.gasReleased) {
    const intensity =
      result.reactionType === "combustion" || result.reactionType === "hazard"
        ? "high"
        : result.reactionType === "gas-forming"
          ? "high"
          : "medium";
    effects.push({ kind: "gas", intensity });
  }

  if (result.precipitateFormed) {
    effects.push({
      kind: "precipitate",
      intensity: result.ok ? "medium" : "low",
      value: result.colorChange,
    });
  }

  if (result.heatReleased === "exo") {
    effects.push({ kind: "heat", intensity: "exo", value: "#ff8a65" });
  } else if (result.heatReleased === "endo") {
    effects.push({ kind: "heat", intensity: "endo", value: "#81d4fa" });
  }

  if (result.reactionType === "combustion" && result.ok) {
    effects.push({ kind: "smoke", intensity: "high" });
  }

  const products: Item[] = result.products.map((p) => ({
    id: p.id,
    name: p.name,
    domain: p.domain,
    category: p.category,
    subcategory: p.subcategory,
    tags: p.tags,
    icon: p.icon,
  }));

  return {
    ok: result.ok && result.reactionType !== "hazard",
    products,
    label: result.balancedEquation || undefined,
    effects,
    explanationKey: result.explanationKey,
    discoveryId: discoveryId(
      reactantIds,
      result.balancedEquation,
      result.reactionType,
    ),
  };
}
