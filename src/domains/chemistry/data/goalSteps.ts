import type { EngineResult, VesselContent } from "@/types";
import { getVesselContents } from "@/desk/vesselContents";
import type { GoalDeskSnapshot, GoalHint, GoalStep } from "./goals";

/** Tolerance when checking min teaching volumes (ml). */
export const AMOUNT_TOLERANCE_ML = 0.05;

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

function vesselMeetsAmounts(
  contents: VesselContent[],
  chemicalIds: string[],
  minAmounts?: Record<string, number>,
): boolean {
  if (!chemicalIds.every((id) => contents.some((c) => c.chemicalId === id))) {
    return false;
  }
  if (!minAmounts) return true;
  const totals: Record<string, number> = {};
  for (const c of contents) {
    totals[c.chemicalId] = (totals[c.chemicalId] ?? 0) + c.amountMl;
  }
  return Object.entries(minAmounts).every(
    ([id, min]) => (totals[id] ?? 0) + AMOUNT_TOLERANCE_ML >= min,
  );
}

export function vesselHas(
  snap: GoalDeskSnapshot,
  chemicalIds: string[],
  opts?: {
    heat?: boolean;
    cool?: boolean;
    equipmentIds?: string[];
    minAmounts?: Record<string, number>;
  },
) {
  return anyVessel(snap).some((v) => {
    if (opts?.heat && !v.heatAttached) return false;
    if (opts?.cool && !v.coolAttached) return false;
    if (
      opts?.equipmentIds &&
      !opts.equipmentIds.includes(v.equipmentId)
    ) {
      return false;
    }
    const contents = getVesselContents(v);
    return vesselMeetsAmounts(contents, chemicalIds, opts?.minAmounts);
  });
}

export function hasEquipment(snap: GoalDeskSnapshot, equipmentId: string) {
  return snap.vessels.some((v) => v.equipmentId === equipmentId);
}

export function vesselCount(
  snap: GoalDeskSnapshot,
  equipmentId?: string,
): number {
  return snap.vessels.filter((v) =>
    equipmentId ? v.equipmentId === equipmentId : true,
  ).length;
}

/** Max stirLevel across vessels that contain all of chemicalIds (or any vessel). */
export function maxStirLevel(
  snap: GoalDeskSnapshot,
  chemicalIds?: string[],
): number {
  const vessels = chemicalIds?.length
    ? snap.vessels.filter((v) =>
        chemicalIds.every((id) =>
          getVesselContents(v).some((c) => c.chemicalId === id),
        ),
      )
    : snap.vessels;
  return vessels.reduce((m, v) => Math.max(m, v.stirLevel), 0);
}

export function hasShaken(
  snap: GoalDeskSnapshot,
  chemicalIds?: string[],
): boolean {
  return snap.vessels.some((v) => {
    if (chemicalIds?.length) {
      const contents = getVesselContents(v);
      if (!chemicalIds.every((id) => contents.some((c) => c.chemicalId === id)))
        return false;
    }
    return Boolean(v.fx.shakeAt);
  });
}

export function lastResultMatches(
  snap: GoalDeskSnapshot,
  pred: (r: EngineResult) => boolean,
) {
  return snap.vessels.some((v) => v.lastResult && pred(v.lastResult));
}

function targetAmountsFrom(
  minAmounts?: Record<string, number>,
): VesselContent[] | undefined {
  if (!minAmounts) return undefined;
  return Object.entries(minAmounts).map(([chemicalId, amountMl]) => ({
    chemicalId,
    amountMl,
  }));
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

export function placeEquipmentStep(
  id: string,
  opts: {
    equipmentId: string;
    title: string;
    instruction: string;
    nudge: string;
    clue: string;
    almost: string;
    /** Require at least this many vessels of that type (default 1). */
    minCount?: number;
  },
): GoalStep {
  const min = opts.minCount ?? 1;
  return {
    id,
    title: opts.title,
    instruction: opts.instruction,
    hints: hints(opts.nudge, opts.clue, opts.almost),
    check: (s) => vesselCount(s, opts.equipmentId) >= min,
  };
}

export function pourStep(
  id: string,
  opts: {
    title: string;
    instruction: string;
    chemicalIds: string[];
    /** Min ml required for each chemicalId (teaching volumes). */
    minAmounts?: Record<string, number>;
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
    targetAmounts: targetAmountsFrom(opts.minAmounts),
    check: (s) =>
      vesselHas(s, opts.chemicalIds, {
        ...(opts.heat ? { heat: true } : {}),
        minAmounts: opts.minAmounts,
      }),
  };
}

export function stirStep(
  id: string,
  opts: {
    title?: string;
    instruction?: string;
    /** Chemicals that must be in the stirred vessel */
    chemicalIds?: string[];
    /** Minimum stirLevel (1–3). Escalating levels block one-stir skips. */
    minLevel?: number;
    nudge?: string;
    clue?: string;
    almost?: string;
  },
): GoalStep {
  const min = opts.minLevel ?? 1;
  return {
    id,
    title: opts.title ?? "Stir the blend",
    instruction:
      opts.instruction ??
      "Click Stir on the vessel — perfume accords need gentle mixing.",
    hints: hints(
      opts.nudge ?? "Oils and alcohol need a stir to marry.",
      opts.clue ?? "Select the vessel, then tap Stir (repeat if needed).",
      opts.almost ?? `Stir until the rod has worked the liquid (level ${min}+).`,
    ),
    check: (s) => maxStirLevel(s, opts.chemicalIds) >= min,
  };
}

export function shakeStep(
  id: string,
  opts: {
    title?: string;
    instruction?: string;
    chemicalIds?: string[];
    nudge?: string;
    clue?: string;
    almost?: string;
  },
): GoalStep {
  return {
    id,
    title: opts.title ?? "Shake to emulsify",
    instruction:
      opts.instruction ??
      "Shake the vessel — a short shake helps disperse the oils.",
    hints: hints(
      opts.nudge ?? "Perfumers swirl and shake concentrates carefully.",
      opts.clue ?? "Select the vessel, then tap Shake.",
      opts.almost ?? "Use Shake once on the working beaker.",
    ),
    check: (s) => hasShaken(s, opts.chemicalIds),
  };
}

export function heatStep(
  id: string,
  opts: {
    title?: string;
    instruction?: string;
    chemicalIds: string[];
    minAmounts?: Record<string, number>;
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
    targetAmounts: targetAmountsFrom(opts.minAmounts),
    check: (s) =>
      vesselHas(s, opts.chemicalIds, {
        heat: true,
        minAmounts: opts.minAmounts,
      }),
  };
}

export function coolStep(
  id: string,
  opts: {
    title?: string;
    instruction?: string;
    chemicalIds: string[];
    minAmounts?: Record<string, number>;
    nudge?: string;
    clue?: string;
    almost?: string;
  },
): GoalStep {
  return {
    id,
    title: opts.title ?? "Cool the vessel",
    instruction:
      opts.instruction ?? "Attach an ice bath — this step needs cooling.",
    hints: hints(
      opts.nudge ?? "Heat won’t finish this step — cool it down.",
      opts.clue ?? "Drop an Ice Bath onto the vessel or tap Cool.",
      opts.almost ?? "Turn Cool on for that beaker.",
    ),
    targetAmounts: targetAmountsFrom(opts.minAmounts),
    check: (s) =>
      vesselHas(s, opts.chemicalIds, {
        cool: true,
        minAmounts: opts.minAmounts,
      }),
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
