import { getChemical } from "@/domains/chemistry/data/chemicals";
import {
  COMPOUNDS,
  getCompoundByFormula,
} from "@/domains/chemistry/knowledge/compounds";

export type AmountUnit = "ml" | "g" | "mmol";

/** Teaching default density (g/ml) when chemical has no density field. */
const DEFAULT_DENSITY = 1;

export function densityForChemical(chemicalId: string): number {
  const c = getChemical(chemicalId);
  if (c?.density && c.density > 0) return c.density;
  return DEFAULT_DENSITY;
}

export function molarMassForChemical(chemicalId: string): number | null {
  const c = getChemical(chemicalId);
  if (!c) return null;
  const byDesk = COMPOUNDS.find((x) => x.deskChemicalId === chemicalId);
  if (byDesk?.molarMass) return byDesk.molarMass;
  const byFormula = getCompoundByFormula(c.formula);
  return byFormula?.molarMass ?? null;
}

export function mlToGrams(chemicalId: string, ml: number): number {
  return ml * densityForChemical(chemicalId);
}

export function mlToMoles(chemicalId: string, ml: number): number | null {
  const mm = molarMassForChemical(chemicalId);
  if (!mm || mm <= 0) return null;
  return mlToGrams(chemicalId, ml) / mm;
}

export function mlToMmol(chemicalId: string, ml: number): number | null {
  const mol = mlToMoles(chemicalId, ml);
  return mol == null ? null : mol * 1000;
}

/** Format a teaching volume for display in the preferred unit. */
export function formatAmount(
  chemicalId: string,
  amountMl: number,
  unit: AmountUnit = "ml",
): string {
  const n = Math.round(amountMl * 100) / 100;
  if (unit === "ml") {
    return `${Number.isInteger(n) ? n : n.toFixed(1)} ml`;
  }
  if (unit === "g") {
    const g = Math.round(mlToGrams(chemicalId, amountMl) * 100) / 100;
    return `${Number.isInteger(g) ? g : g.toFixed(2)} g`;
  }
  const mmol = mlToMmol(chemicalId, amountMl);
  if (mmol == null) {
    return `${Number.isInteger(n) ? n : n.toFixed(1)} ml`;
  }
  const m = Math.round(mmol * 10) / 10;
  return `${Number.isInteger(m) ? m : m.toFixed(1)} mmol`;
}
