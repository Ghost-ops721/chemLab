/**
 * Solubility rules for common aqueous salts.
 * Key is anion (or special salt id); values list soluble/insoluble cations.
 */

const ALWAYS_SOLUBLE_ANIONS = new Set([
  "NO3-",
  "C2H3O2-",
  "CH3COO-",
  "ClO4-",
]);

const ALWAYS_SOLUBLE_CATIONS = new Set(["Na+", "K+", "NH4+", "Li+"]);

/** Anions that are generally soluble except with listed cations */
const SOLUBLE_EXCEPT: Record<string, Set<string>> = {
  "Cl-": new Set(["Ag+", "Pb2+", "Hg2 2+"]),
  "Br-": new Set(["Ag+", "Pb2+", "Hg2 2+"]),
  "I-": new Set(["Ag+", "Pb2+", "Hg2 2+"]),
  "SO4 2-": new Set(["Ba2+", "Pb2+", "Ca2+", "Sr2+", "Ag+"]),
};

/** Anions that are generally insoluble except with listed cations */
const INSOLUBLE_EXCEPT: Record<string, Set<string>> = {
  "CO3 2-": new Set(["Na+", "K+", "NH4+", "Li+"]),
  "PO4 3-": new Set(["Na+", "K+", "NH4+", "Li+"]),
  "S 2-": new Set(["Na+", "K+", "NH4+", "Li+", "Ca2+", "Ba2+", "Sr2+", "Mg2+"]),
  "OH-": new Set(["Na+", "K+", "NH4+", "Li+", "Ba2+", "Ca2+", "Sr2+"]),
  "CrO4 2-": new Set(["Na+", "K+", "NH4+", "Li+", "Mg2+"]),
};

export function isSoluble(cation: string, anion: string): boolean {
  if (ALWAYS_SOLUBLE_CATIONS.has(cation)) return true;
  if (ALWAYS_SOLUBLE_ANIONS.has(anion)) return true;

  if (SOLUBLE_EXCEPT[anion]) {
    return !SOLUBLE_EXCEPT[anion].has(cation);
  }

  if (INSOLUBLE_EXCEPT[anion]) {
    return INSOLUBLE_EXCEPT[anion].has(cation);
  }

  // Default: assume soluble for unknown pairs (conservative for engine)
  return true;
}

export function wouldPrecipitate(
  cation1: string,
  anion1: string,
  cation2: string,
  anion2: string,
): { cation: string; anion: string } | null {
  // Cross products: c1+a2 and c2+a1
  if (!isSoluble(cation1, anion2)) {
    return { cation: cation1, anion: anion2 };
  }
  if (!isSoluble(cation2, anion1)) {
    return { cation: cation2, anion: anion1 };
  }
  return null;
}
