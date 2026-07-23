/**
 * Parse a chemical formula into atom counts.
 * Handles parentheses: Ca(OH)2, Pb(NO3)2, Fe2(SO4)3
 */
export function parseFormula(formula: string): Record<string, number> {
  const counts: Record<string, number> = {};

  function add(element: string, n: number) {
    counts[element] = (counts[element] ?? 0) + n;
  }

  function parseGroup(str: string, multiplier: number) {
    const re = /([A-Z][a-z]?)(\d*)|\(([^\)]+)\)(\d*)/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(str)) !== null) {
      if (m[1]) {
        add(m[1], (m[2] ? parseInt(m[2], 10) : 1) * multiplier);
      } else if (m[3]) {
        parseGroup(m[3], (m[4] ? parseInt(m[4], 10) : 1) * multiplier);
      }
    }
  }

  parseGroup(formula, 1);
  return counts;
}

export interface BalancedSpecies {
  formula: string;
  coefficient: number;
}

/**
 * Balance a reaction by integer search on small coefficient bounds.
 * reactants / products are formula strings.
 */
export function balanceEquation(
  reactantFormulas: string[],
  productFormulas: string[],
): { reactants: BalancedSpecies[]; products: BalancedSpecies[]; label: string } | null {
  const all = [...reactantFormulas, ...productFormulas];
  const parsed = all.map(parseFormula);
  const elements = Array.from(
    new Set(parsed.flatMap((p) => Object.keys(p))),
  );

  const nR = reactantFormulas.length;
  const nP = productFormulas.length;
  const n = nR + nP;
  const MAX = n <= 3 ? 8 : 6;

  function tryCoeffs(coeffs: number[]): boolean {
    for (const el of elements) {
      let left = 0;
      let right = 0;
      for (let i = 0; i < nR; i++) {
        left += coeffs[i]! * (parsed[i]![el] ?? 0);
      }
      for (let i = 0; i < nP; i++) {
        right += coeffs[nR + i]! * (parsed[nR + i]![el] ?? 0);
      }
      if (left !== right) return false;
    }
    return true;
  }

  function gcd(a: number, b: number): number {
    a = Math.abs(a);
    b = Math.abs(b);
    while (b) {
      const t = b;
      b = a % b;
      a = t;
    }
    return a || 1;
  }

  function simplify(coeffs: number[]): number[] {
    let g = coeffs[0]!;
    for (let i = 1; i < coeffs.length; i++) g = gcd(g, coeffs[i]!);
    return coeffs.map((c) => c / g);
  }

  // Nested search — small n only
  const coeffs = new Array(n).fill(1) as number[];

  function search(idx: number): number[] | null {
    if (idx === n) {
      if (tryCoeffs(coeffs)) return simplify([...coeffs]);
      return null;
    }
    for (let c = 1; c <= MAX; c++) {
      coeffs[idx] = c;
      const found = search(idx + 1);
      if (found) return found;
    }
    return null;
  }

  const found = search(0);
  if (!found) {
    // fallback: all 1s (unbalanced label still useful)
    const reactants = reactantFormulas.map((f) => ({ formula: f, coefficient: 1 }));
    const products = productFormulas.map((f) => ({ formula: f, coefficient: 1 }));
    return {
      reactants,
      products,
      label: formatLabel(reactants, products),
    };
  }

  const reactants = reactantFormulas.map((f, i) => ({
    formula: f,
    coefficient: found[i]!,
  }));
  const products = productFormulas.map((f, i) => ({
    formula: f,
    coefficient: found[nR + i]!,
  }));
  return {
    reactants,
    products,
    label: formatLabel(reactants, products),
  };
}

function formatLabel(
  reactants: BalancedSpecies[],
  products: BalancedSpecies[],
): string {
  const side = (arr: BalancedSpecies[]) =>
    arr
      .map((s) => (s.coefficient === 1 ? s.formula : `${s.coefficient}${s.formula}`))
      .join(" + ");
  return `${side(reactants)} → ${side(products)}`;
}
