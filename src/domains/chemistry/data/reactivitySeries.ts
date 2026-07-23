/** Reactivity series: higher index = more reactive (displaces metals below). */
export const REACTIVITY_SERIES = [
  "Au",
  "Ag",
  "Cu",
  "H",
  "Pb",
  "Sn",
  "Ni",
  "Fe",
  "Zn",
  "Al",
  "Mg",
  "Ca",
  "Na",
  "K",
] as const;

export type MetalSymbol = (typeof REACTIVITY_SERIES)[number];

export function reactivityIndex(symbol: string): number {
  const i = REACTIVITY_SERIES.indexOf(symbol as MetalSymbol);
  return i === -1 ? -1 : i;
}

/** Returns true if metalA can displace metalB (A more reactive than B). */
export function canDisplace(metalA: string, metalB: string): boolean {
  const a = reactivityIndex(metalA);
  const b = reactivityIndex(metalB);
  if (a < 0 || b < 0) return false;
  return a > b;
}
