import { getChemical } from "@/domains/chemistry/data/chemicals";
import { FRAGRANCE_NOTE_BY_CHEMICAL_ID } from "@/domains/chemistry/perfume/fragranceNotes";

export interface OilMeta {
  casNumber?: string;
  flashPointC?: number;
  maxSuggestedPct?: number;
  density?: number;
  odorStrength?: number;
  pleasantness?: number;
}

/** Teaching defaults for common fragrance materials (Phase A). */
const OIL_META: Record<string, OilMeta> = {
  "bergamot-oil": {
    casNumber: "8007-75-8",
    flashPointC: 57,
    maxSuggestedPct: 0.4,
    density: 0.88,
    odorStrength: 0.75,
    pleasantness: 0.7,
  },
  "lemon-oil": {
    casNumber: "8008-56-8",
    flashPointC: 48,
    maxSuggestedPct: 2,
    density: 0.85,
    odorStrength: 0.8,
    pleasantness: 0.75,
  },
  "orange-oil": {
    casNumber: "8008-57-9",
    flashPointC: 46,
    maxSuggestedPct: 10,
    density: 0.85,
    odorStrength: 0.7,
    pleasantness: 0.8,
  },
  "grapefruit-oil": {
    casNumber: "8016-20-4",
    flashPointC: 45,
    maxSuggestedPct: 4,
    density: 0.85,
    odorStrength: 0.75,
    pleasantness: 0.7,
  },
  "lavender-oil": {
    casNumber: "8000-28-0",
    flashPointC: 68,
    maxSuggestedPct: 3,
    density: 0.89,
    odorStrength: 0.65,
    pleasantness: 0.75,
  },
  "mint-oil": {
    casNumber: "8006-90-4",
    flashPointC: 67,
    maxSuggestedPct: 1,
    density: 0.9,
    odorStrength: 0.9,
    pleasantness: 0.35,
  },
  "rose-absolute": {
    casNumber: "8007-01-0",
    flashPointC: 90,
    maxSuggestedPct: 0.5,
    density: 0.95,
    odorStrength: 0.85,
    pleasantness: 0.85,
  },
  "jasmine-absolute": {
    casNumber: "8022-96-6",
    flashPointC: 93,
    maxSuggestedPct: 0.5,
    density: 0.95,
    odorStrength: 0.9,
    pleasantness: 0.8,
  },
  "sandalwood-oil": {
    casNumber: "8006-87-9",
    flashPointC: 100,
    maxSuggestedPct: 5,
    density: 0.97,
    odorStrength: 0.6,
    pleasantness: 0.85,
  },
  "vanilla-absolute": {
    casNumber: "8024-06-4",
    flashPointC: 93,
    maxSuggestedPct: 5,
    density: 1.05,
    odorStrength: 0.7,
    pleasantness: 0.9,
  },
  musk: {
    casNumber: "1222-05-5",
    flashPointC: 110,
    maxSuggestedPct: 5,
    density: 1.0,
    odorStrength: 0.55,
    pleasantness: 0.6,
  },
  aldehydes: {
    casNumber: "112-31-2",
    flashPointC: 85,
    maxSuggestedPct: 0.5,
    density: 0.83,
    odorStrength: 0.95,
    pleasantness: -0.1,
  },
  limonene: {
    casNumber: "5989-27-5",
    flashPointC: 48,
    maxSuggestedPct: 10,
    density: 0.84,
    odorStrength: 0.7,
    pleasantness: 0.65,
  },
  c2h5oh: {
    casNumber: "64-17-5",
    flashPointC: 13,
    maxSuggestedPct: 95,
    density: 0.79,
    odorStrength: 0.3,
    pleasantness: -0.2,
  },
};

export function isOilItem(chemicalId: string): boolean {
  const chem = getChemical(chemicalId);
  if (!chem) return false;
  return (
    chem.subcategory === "fragrance" ||
    chem.tags.includes("perfume") ||
    Boolean(FRAGRANCE_NOTE_BY_CHEMICAL_ID[chemicalId]) ||
    chemicalId === "c2h5oh"
  );
}

export function getOilMeta(chemicalId: string): OilMeta {
  const chem = getChemical(chemicalId);
  const seed = OIL_META[chemicalId] ?? {};
  return {
    casNumber: chem?.casNumber ?? seed.casNumber,
    flashPointC: chem?.flashPointC ?? seed.flashPointC ?? 70,
    maxSuggestedPct: chem?.maxSuggestedPct ?? seed.maxSuggestedPct ?? 5,
    density: chem?.density ?? seed.density ?? 0.9,
    odorStrength: chem?.odorStrength ?? seed.odorStrength ?? 0.5,
    pleasantness: chem?.pleasantness ?? seed.pleasantness ?? 0.4,
  };
}

/** Resolve teaching fields onto chemical lookups used by liveFormula. */
export function resolvedOilFields(chemicalId: string): {
  maxSuggestedPct: number;
  odorStrength: number;
  pleasantness: number;
  flashPointC: number;
} {
  const m = getOilMeta(chemicalId);
  return {
    maxSuggestedPct: m.maxSuggestedPct ?? 5,
    odorStrength: m.odorStrength ?? 0.5,
    pleasantness: m.pleasantness ?? 0.4,
    flashPointC: m.flashPointC ?? 70,
  };
}
