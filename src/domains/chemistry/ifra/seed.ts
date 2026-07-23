import type {
  IfraProductCategory,
  IfraProductCategoryId,
  IfraStandardEntry,
} from "./types";
import { IFRA_STANDARDS_VERSION } from "./types";

export const IFRA_PRODUCT_CATEGORIES: IfraProductCategory[] = [
  {
    id: "cat4",
    label: "Category 4 — Fine fragrance",
    shortLabel: "Fine fragrance",
    description:
      "Hydroalcoholic fine fragrance / EDT / EDP — primary Alyra Labs perfume category.",
  },
  {
    id: "cat5a",
    label: "Category 5A — Body lotion",
    shortLabel: "Body lotion",
    description: "Leave-on body products (lotions, creams).",
  },
  {
    id: "cat5b",
    label: "Category 5B — Face moisturizer",
    shortLabel: "Face cream",
    description: "Leave-on facial moisturizers.",
  },
  {
    id: "cat9",
    label: "Category 9 — Soap / rinse-off",
    shortLabel: "Rinse-off",
    description: "Bar soap, shower gel, and other rinse-off products.",
  },
  {
    id: "cat11a",
    label: "Category 11A — Candles / air care",
    shortLabel: "Candles",
    description: "Incidental skin contact via candles and similar air care.",
  },
];

export const IFRA_CATEGORY_BY_ID: Record<
  IfraProductCategoryId,
  IfraProductCategory
> = Object.fromEntries(
  IFRA_PRODUCT_CATEGORIES.map((c) => [c.id, c]),
) as Record<IfraProductCategoryId, IfraProductCategory>;

/**
 * Teaching-aligned IFRA-style limits keyed by Alyra Labs oil chemicalIds / CAS.
 * Values are pedagogical approximations inspired by common Category 4 usage
 * ceilings and oilMeta.maxSuggestedPct — version-pinned, not official tables.
 */
export const IFRA_STANDARDS_SEED: IfraStandardEntry[] = [
  {
    chemicalId: "bergamot-oil",
    casNumber: "8007-75-8",
    name: "Bergamot oil",
    limitsByCategory: {
      cat4: 0.4,
      cat5a: 0.2,
      cat5b: 0.1,
      cat9: 1.2,
      cat11a: 5,
    },
    notes: "Photosensitizing citrus — tight fine-fragrance ceiling.",
  },
  {
    chemicalId: "lemon-oil",
    casNumber: "8008-56-8",
    name: "Lemon oil",
    limitsByCategory: {
      cat4: 2,
      cat5a: 1,
      cat5b: 0.5,
      cat9: 5,
      cat11a: 10,
    },
  },
  {
    chemicalId: "orange-oil",
    casNumber: "8008-57-9",
    name: "Orange oil",
    limitsByCategory: {
      cat4: 10,
      cat5a: 5,
      cat5b: 2.5,
      cat9: 20,
      cat11a: 30,
    },
  },
  {
    chemicalId: "grapefruit-oil",
    casNumber: "8016-20-4",
    name: "Grapefruit oil",
    limitsByCategory: {
      cat4: 4,
      cat5a: 2,
      cat5b: 1,
      cat9: 8,
      cat11a: 15,
    },
  },
  {
    chemicalId: "lavender-oil",
    casNumber: "8000-28-0",
    name: "Lavender oil",
    limitsByCategory: {
      cat4: 3,
      cat5a: 2,
      cat5b: 1.5,
      cat9: 8,
      cat11a: 20,
    },
  },
  {
    chemicalId: "mint-oil",
    casNumber: "8006-90-4",
    name: "Mint / peppermint oil",
    limitsByCategory: {
      cat4: 1,
      cat5a: 0.5,
      cat5b: 0.3,
      cat9: 3,
      cat11a: 8,
    },
  },
  {
    chemicalId: "rose-absolute",
    casNumber: "8007-01-0",
    name: "Rose absolute",
    limitsByCategory: {
      cat4: 0.5,
      cat5a: 0.3,
      cat5b: 0.2,
      cat9: 1.5,
      cat11a: 5,
    },
  },
  {
    chemicalId: "jasmine-absolute",
    casNumber: "8022-96-6",
    name: "Jasmine absolute",
    limitsByCategory: {
      cat4: 0.5,
      cat5a: 0.3,
      cat5b: 0.2,
      cat9: 1.5,
      cat11a: 5,
    },
  },
  {
    chemicalId: "sandalwood-oil",
    casNumber: "8006-87-9",
    name: "Sandalwood oil",
    limitsByCategory: {
      cat4: 5,
      cat5a: 3,
      cat5b: 2,
      cat9: 10,
      cat11a: 25,
    },
  },
  {
    chemicalId: "vanilla-absolute",
    casNumber: "8024-06-4",
    name: "Vanilla absolute",
    limitsByCategory: {
      cat4: 5,
      cat5a: 3,
      cat5b: 2,
      cat9: 10,
      cat11a: 25,
    },
  },
  {
    chemicalId: "musk",
    casNumber: "1222-05-5",
    name: "Galaxolide-type musk (HHCB)",
    limitsByCategory: {
      cat4: 5,
      cat5a: 3,
      cat5b: 2,
      cat9: 12,
      cat11a: 30,
    },
  },
  {
    chemicalId: "aldehydes",
    casNumber: "112-31-2",
    name: "Aldehyde C-10 (decanal proxy)",
    limitsByCategory: {
      cat4: 0.5,
      cat5a: 0.3,
      cat5b: 0.2,
      cat9: 1.5,
      cat11a: 5,
    },
  },
  {
    chemicalId: "limonene",
    casNumber: "5989-27-5",
    name: "Limonene",
    limitsByCategory: {
      cat4: 10,
      cat5a: 5,
      cat5b: 2.5,
      cat9: 20,
      cat11a: 40,
    },
  },
];

export { IFRA_STANDARDS_VERSION };

const BY_CHEMICAL = new Map<string, IfraStandardEntry>();
const BY_CAS = new Map<string, IfraStandardEntry>();

for (const entry of IFRA_STANDARDS_SEED) {
  if (entry.chemicalId) BY_CHEMICAL.set(entry.chemicalId, entry);
  if (entry.casNumber) BY_CAS.set(entry.casNumber, entry);
}

export function lookupIfraEntry(args: {
  chemicalId: string;
  casNumber?: string;
}): IfraStandardEntry | undefined {
  return (
    BY_CHEMICAL.get(args.chemicalId) ??
    (args.casNumber ? BY_CAS.get(args.casNumber) : undefined)
  );
}
