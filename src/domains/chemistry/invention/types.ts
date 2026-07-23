import type { DeskVessel, EngineResult } from "@/types";
import type { GoalVisualKind } from "@/domains/chemistry/data/goals";

/** Product family an invention belongs to */
export type InventionKind =
  | "perfume"
  | "soap"
  | "slime"
  | "ink"
  | "antacid"
  | "bath-bomb"
  | "sanitizer"
  | "classic"
  | "freeform"
  | "other";

export type MasteryTier = "make" | "refine" | "signature";

/** Snapshot of desk state that can be remixed later */
export interface FormulaSnapshot {
  equipmentId: string;
  contentIds: string[];
  heatAttached: boolean;
  coolAttached: boolean;
  stirLevel: number;
  /** Optional note pyramid for perfume freeform */
  perfumeNotes?: {
    top: string[];
    heart: string[];
    base: string[];
  };
  lastResult?: Pick<
    EngineResult,
    "ok" | "label" | "explanationKey" | "discoveryId" | "effects"
  >;
}

export interface InventionVersion {
  version: number;
  snapshot: FormulaSnapshot;
  score: number;
  tier: MasteryTier;
  notes: string[];
  createdAt: number;
}

export interface Invention {
  id: string;
  name: string;
  kind: InventionKind;
  sourceGoalId?: string;
  perfumeRecipeId?: string;
  coverVisualKind: GoalVisualKind;
  versions: InventionVersion[];
  bestScore: number;
  createdAt: number;
  updatedAt: number;
}

export interface InventionScoreResult {
  score: number;
  tier: MasteryTier;
  notes: string[];
}

export function snapshotFromVessel(vessel: DeskVessel): FormulaSnapshot {
  return {
    equipmentId: vessel.equipmentId,
    contentIds: [...vessel.contentIds],
    heatAttached: vessel.heatAttached,
    coolAttached: vessel.coolAttached,
    stirLevel: vessel.stirLevel,
    lastResult: vessel.lastResult
      ? {
          ok: vessel.lastResult.ok,
          label: vessel.lastResult.label,
          explanationKey: vessel.lastResult.explanationKey,
          discoveryId: vessel.lastResult.discoveryId,
          effects: vessel.lastResult.effects,
        }
      : undefined,
  };
}

export function kindFromGoalId(
  goalId: string | undefined,
  visualKind?: GoalVisualKind,
): InventionKind {
  if (!goalId) return "freeform";
  if (goalId.startsWith("perfume-") || goalId.includes("perfume")) {
    return "perfume";
  }
  if (goalId.includes("soap")) return "soap";
  if (goalId.includes("slime")) return "slime";
  if (goalId.includes("ink")) return "ink";
  if (goalId.includes("antacid")) return "antacid";
  if (goalId.includes("bath")) return "bath-bomb";
  if (goalId.includes("sanitizer") || goalId.includes("disinfectant")) {
    return "sanitizer";
  }
  if (visualKind === "bottle") return "perfume";
  if (visualKind === "soap") return "soap";
  if (visualKind === "slime") return "slime";
  if (visualKind === "flame" || visualKind === "crystal" || visualKind === "gas") {
    return "classic";
  }
  return "other";
}
