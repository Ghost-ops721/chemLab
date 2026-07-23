import type { EngineEffect, EngineEffectKind, EngineResult, Item } from "@/types";
import type { ReactionResult } from "./types";

function discoveryId(reactants: string[], label: string, type: string): string {
  const sorted = [...reactants].sort().join("+");
  return `${type}::${sorted}::${label}`;
}

function hazardFxKinds(key?: string): EngineEffectKind[] {
  if (!key) return ["hazard", "blast"];
  if (key.includes("flash") || key.includes("ethanol")) {
    return ["hazard", "flash", "blast", "glow"];
  }
  if (key.includes("sodium")) return ["hazard", "burst", "foam"];
  if (key.includes("chlorine")) return ["hazard", "dirty", "smoke"];
  if (key.includes("oxidizer")) return ["hazard", "blast", "glow"];
  return ["hazard", "blast"];
}

export function adaptReactionResult(
  result: ReactionResult,
  reactantIds: string[],
): EngineResult {
  const effects: EngineEffect[] = [];

  if (result.hazardTriggered || result.reactionType === "hazard") {
    for (const kind of hazardFxKinds(result.explanationKey)) {
      effects.push({
        kind,
        intensity: "high",
        messageKey: result.explanationKey,
      });
    }
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
    effects.push({ kind: "bubble", intensity });
    if (
      result.reactionType === "gas-forming" ||
      result.explanationKey?.includes("carbonate")
    ) {
      effects.push({ kind: "foam", intensity: "high" });
    }
  }

  if (result.precipitateFormed) {
    effects.push({
      kind: "precipitate",
      intensity: result.ok ? "medium" : "low",
      value: result.colorChange,
    });
    effects.push({ kind: "solidify", intensity: "medium" });
  }

  if (result.heatReleased === "exo") {
    effects.push({ kind: "heat", intensity: "exo", value: "#ff8a65" });
    effects.push({ kind: "glow", intensity: "medium", value: "#ff8a65" });
  } else if (result.heatReleased === "endo") {
    effects.push({ kind: "heat", intensity: "endo", value: "#81d4fa" });
  }

  if (result.reactionType === "combustion" && result.ok) {
    effects.push({ kind: "smoke", intensity: "high" });
    effects.push({ kind: "flash", intensity: "high" });
  }

  if (result.reactionType === "product-craft" && result.ok) {
    effects.push({ kind: "sparkle", intensity: "low" });
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
