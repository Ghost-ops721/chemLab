import type { EngineResult } from "@/types";
import type { GoalDeskSnapshot, GoalHint, GoalStep } from "./goals";

export function hints(
  nudge: string,
  clue: string,
  almost: string,
): GoalHint[] {
  return [
    { tier: "nudge", text: nudge },
    { tier: "clue", text: clue },
    { tier: "almost", text: almost },
  ];
}

function anyVessel(snap: GoalDeskSnapshot) {
  return snap.vessels;
}

export function vesselHas(
  snap: GoalDeskSnapshot,
  chemicalIds: string[],
  opts?: { heat?: boolean; equipmentIds?: string[] },
) {
  return anyVessel(snap).some((v) => {
    if (opts?.heat && !v.heatAttached) return false;
    if (
      opts?.equipmentIds &&
      !opts.equipmentIds.includes(v.equipmentId)
    ) {
      return false;
    }
    return chemicalIds.every((id) => v.contentIds.includes(id));
  });
}

export function hasEquipment(snap: GoalDeskSnapshot, equipmentId: string) {
  return snap.vessels.some((v) => v.equipmentId === equipmentId);
}

export function lastResultMatches(
  snap: GoalDeskSnapshot,
  pred: (r: EngineResult) => boolean,
) {
  return snap.vessels.some((v) => v.lastResult && pred(v.lastResult));
}

export function placeBeakerStep(
  id: string,
  opts?: { title?: string; instruction?: string },
): GoalStep {
  return {
    id,
    title: opts?.title ?? "Place a beaker",
    instruction: opts?.instruction ?? "Put a beaker on the desk.",
    hints: hints(
      "Start with glassware.",
      "Equipment → Beaker → desk.",
      "Place a Beaker from Inventory.",
    ),
    check: (s) => hasEquipment(s, "beaker"),
  };
}

export function pourStep(
  id: string,
  opts: {
    title: string;
    instruction: string;
    chemicalIds: string[];
    heat?: boolean;
    nudge: string;
    clue: string;
    almost: string;
  },
): GoalStep {
  return {
    id,
    title: opts.title,
    instruction: opts.instruction,
    hints: hints(opts.nudge, opts.clue, opts.almost),
    check: (s) =>
      vesselHas(s, opts.chemicalIds, opts.heat ? { heat: true } : undefined),
  };
}

export function heatStep(
  id: string,
  opts: {
    title?: string;
    instruction?: string;
    chemicalIds: string[];
    nudge?: string;
    clue?: string;
    almost?: string;
  },
): GoalStep {
  return {
    id,
    title: opts.title ?? "Heat the vessel",
    instruction:
      opts.instruction ?? "Attach a Bunsen burner — this step needs heat.",
    hints: hints(
      opts.nudge ?? "Cold won’t finish this reaction here.",
      opts.clue ?? "Drop a Bunsen burner onto the vessel or tap Heat.",
      opts.almost ?? "Turn Heat on for that beaker.",
    ),
    check: (s) => vesselHas(s, opts.chemicalIds, { heat: true }),
  };
}

export function mixUntilStep(
  id: string,
  opts: {
    title: string;
    instruction: string;
    pred: (r: EngineResult) => boolean;
    nudge: string;
    clue: string;
    almost: string;
  },
): GoalStep {
  return {
    id,
    title: opts.title,
    instruction: opts.instruction,
    hints: hints(opts.nudge, opts.clue, opts.almost),
    check: (s) => lastResultMatches(s, opts.pred),
  };
}
