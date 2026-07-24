import type { Chemical } from "../types";
import type { VesselContent } from "@/types";
import type { ReactionResult } from "../types";

export interface TeachingStoichResult {
  nextContents: VesselContent[];
  /** chemicalId that limited the reaction extent */
  limitingReagentId?: string;
  extent: number;
}

function normalizeFormula(f: string): string {
  return f
    .replace(/[₀₁₂₃₄₅₆₇₈₉]/g, (d) => "0123456789"["₀₁₂₃₄₅₆₇₈₉".indexOf(d)]!)
    .replace(/\s+/g, "")
    .replace(/·/g, "")
    .toUpperCase();
}

/** Parse "2HCl + NaOH" → [{coeff, formula}] */
export function parseEquationSide(
  side: string,
): { coeff: number; formula: string }[] {
  return side
    .split("+")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      // Strip trailing state markers like (aq), (s), (g), (l)
      const cleaned = part.replace(/\([^)]*\)\s*$/g, "").trim();
      const m = cleaned.match(/^(\d+)\s*(.+)$/);
      if (m) {
        return { coeff: parseInt(m[1]!, 10), formula: m[2]!.trim() };
      }
      return { coeff: 1, formula: cleaned };
    });
}

function splitEquation(label: string): { left: string; right: string } | null {
  const arrow = label.includes("→")
    ? "→"
    : label.includes("->")
      ? "->"
      : label.includes("⇒")
        ? "⇒"
        : null;
  if (!arrow) return null;
  const [left, right] = label.split(arrow);
  if (!left?.trim() || !right?.trim()) return null;
  // Skip catalyst annotations like "--(MnO2)→"
  if (left.includes("--")) return null;
  return { left: left.trim(), right: right.trim() };
}

/**
 * Teaching ml-ratio stoichiometry: treat ml as proportional "moles"
 * using coefficients from the balanced equation label.
 * Skips perfume/product crafts (preserve blend for IFRA) and hazards.
 */
export function applyTeachingStoich(
  result: ReactionResult,
  chemicals: Chemical[],
  amounts: Record<string, number>,
  capacityMl?: number,
): TeachingStoichResult | null {
  if (!result.ok) return null;
  if (
    result.reactionType === "hazard" ||
    result.reactionType === "no-reaction" ||
    result.reactionType === "product-craft"
  ) {
    return null;
  }

  const parts = splitEquation(result.balancedEquation);
  if (!parts) return null;

  const reactants = parseEquationSide(parts.left);
  const products = parseEquationSide(parts.right);
  if (!reactants.length || !products.length) return null;

  const byFormula = new Map<string, Chemical>();
  for (const c of chemicals) {
    byFormula.set(normalizeFormula(c.formula), c);
  }
  for (const p of result.products) {
    byFormula.set(normalizeFormula(p.formula), p);
  }

  // Map reactant formulas → vessel chemical ids + amounts
  const reactantSlots: {
    chemicalId: string;
    coeff: number;
    amountMl: number;
  }[] = [];
  for (const r of reactants) {
    const chem = byFormula.get(normalizeFormula(r.formula));
    if (!chem) continue;
    const amountMl = amounts[chem.id] ?? 0;
    if (amountMl <= 0) continue;
    reactantSlots.push({
      chemicalId: chem.id,
      coeff: Math.max(1, r.coeff),
      amountMl,
    });
  }
  if (reactantSlots.length < 1) return null;

  let extent = Infinity;
  let limitingReagentId: string | undefined;
  for (const slot of reactantSlots) {
    const e = slot.amountMl / slot.coeff;
    if (e < extent) {
      extent = e;
      limitingReagentId = slot.chemicalId;
    }
  }
  if (!Number.isFinite(extent) || extent <= 0) return null;

  const remaining: Record<string, number> = { ...amounts };
  for (const slot of reactantSlots) {
    const consumed = extent * slot.coeff;
    remaining[slot.chemicalId] = Math.max(
      0,
      (remaining[slot.chemicalId] ?? 0) - consumed,
    );
  }

  for (const p of products) {
    const chem = byFormula.get(normalizeFormula(p.formula));
    if (!chem) continue;
    // Skip pure gas products leaving as FX-only when gasReleased and state gas
    if (chem.state === "gas" && result.gasReleased) {
      // Still add a small teaching volume so contents reflect production
      const produced = extent * Math.max(1, p.coeff);
      remaining[chem.id] = (remaining[chem.id] ?? 0) + produced * 0.25;
      continue;
    }
    const produced = extent * Math.max(1, p.coeff);
    remaining[chem.id] = (remaining[chem.id] ?? 0) + produced;
  }

  let nextContents: VesselContent[] = Object.entries(remaining)
    .filter(([, ml]) => ml > 0.05)
    .map(([chemicalId, amountMl]) => ({
      chemicalId,
      amountMl: Math.round(amountMl * 100) / 100,
    }));

  if (capacityMl != null && capacityMl > 0) {
    const total = nextContents.reduce((s, c) => s + c.amountMl, 0);
    if (total > capacityMl) {
      const scale = capacityMl / total;
      nextContents = nextContents.map((c) => ({
        ...c,
        amountMl: Math.round(c.amountMl * scale * 100) / 100,
      }));
    }
  }

  return { nextContents, limitingReagentId, extent };
}
