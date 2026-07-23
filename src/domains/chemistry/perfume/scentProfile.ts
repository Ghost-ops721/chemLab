import { getChemical } from "@/domains/chemistry/data/chemicals";
import {
  FRAGRANCE_NOTE_BY_CHEMICAL_ID,
  FRAGRANCE_NOTE_BY_ID,
} from "./fragranceNotes";
import { getPerfumeRecipe } from "./perfumeRecipes";
import type { PerfumeConcentration, PerfumeRecipe, ScentFamily } from "./types";

export interface ScentNoteLine {
  role: "top" | "heart" | "base" | "fixative";
  label: string;
  names: string[];
  blurbs: string[];
}

export interface ScentIngredient {
  chemicalId: string;
  name: string;
  formula?: string;
  role?: string;
  blurb?: string;
}

/** Unified perfume dossier for reward modal, shelf, and explanations */
export interface ScentProfile {
  displayName: string;
  brandLabel?: string;
  family: ScentFamily | string;
  concentration?: PerfumeConcentration | string;
  smellsLike: string;
  hasNotesOf: string[];
  notes: ScentNoteLine[];
  ingredients: ScentIngredient[];
  blurb: string;
  bottleColor?: string;
  icon?: string;
}

const FAMILY_SMELL: Record<ScentFamily, string> = {
  citrus: "bright lemon–orange zest and sparkling cologne freshness",
  floral: "blooming petals — soft, romantic, and powdery-sweet",
  oriental: "warm spices, resins, and golden amber glow",
  woody: "dry woods, cedar warmth, and forest calm",
  aromatic: "herbal lavender–mint clarity with a clean lift",
  gourmand: "edible sweetness — vanilla, cocoa, or pastry warmth",
  fresh: "clean air, light fruit, and just-showered brightness",
  chypre: "bergamot sparkle over mossy, earthy depth",
  fougere: "classic barbershop fern — lavender, coumarin, woods",
  leather: "suave leather, smoke, and soft animalic warmth",
  aquatic: "sea breeze, mineral spray, and cool water",
};

const CONCENTRATION_LABEL: Record<PerfumeConcentration, string> = {
  cologne: "Cologne (Eau de Cologne)",
  edt: "Eau de Toilette",
  edp: "Eau de Parfum",
  parfum: "Parfum / Extrait",
};

const LEGACY_CITRUS_COLOGNE: ScentProfile = {
  displayName: "Citrus Cologne",
  brandLabel: "Chem Lab classic",
  family: "citrus",
  concentration: "cologne",
  smellsLike:
    "Fresh-squeezed lemon peel and bright citrus cologne — clean, sparkling, and light on the skin",
  hasNotesOf: [
    "lemon zest",
    "orange peel",
    "limonene sparkle",
    "light musk",
    "alcohol lift",
  ],
  notes: [
    {
      role: "top",
      label: "Top notes",
      names: ["Limonene", "Ethyl Acetate"],
      blurbs: ["Bright citrus peel sparkle.", "Fruity solvent sparkle (ester)."],
    },
    {
      role: "heart",
      label: "Heart notes",
      names: ["Bergamot"],
      blurbs: ["Earl-grey citrus with a soft floral edge."],
    },
    {
      role: "base",
      label: "Base notes",
      names: ["Musk"],
      blurbs: ["Soft skin-scent linger."],
    },
  ],
  ingredients: [
    {
      chemicalId: "c2h5oh",
      name: "Ethanol (carrier)",
      formula: "C2H5OH",
      role: "solvent",
      blurb: "Alcohol carrier that dissolves oils and evaporates on skin.",
    },
    {
      chemicalId: "limonene",
      name: "Limonene (citrus oil)",
      formula: "C10H16",
      role: "top",
      blurb: "Bright citrus peel sparkle.",
    },
    {
      chemicalId: "ethyl-acetate",
      name: "Ethyl Acetate",
      formula: "C4H8O2",
      role: "top",
      blurb: "Optional fruity ester note.",
    },
  ],
  blurb:
    "Real cologne is fragrant oils (like limonene) dissolved in ethanol. The alcohol evaporates on skin and leaves the scent behind — the same idea as perfume, at a lighter concentration.",
  bottleColor: "#ffe082",
  icon: "🍋",
};

function noteNames(ids: string[]): { names: string[]; blurbs: string[] } {
  const names: string[] = [];
  const blurbs: string[] = [];
  for (const id of ids) {
    const n = FRAGRANCE_NOTE_BY_ID[id];
    if (!n) continue;
    names.push(n.name);
    blurbs.push(n.blurb);
  }
  return { names, blurbs };
}

function smellsLikeFromRecipe(recipe: PerfumeRecipe): string {
  if (recipe.smellsLike?.trim()) return recipe.smellsLike.trim();
  const familyLine =
    FAMILY_SMELL[recipe.family] ?? `a ${recipe.family} character`;
  const top = noteNames(recipe.notes.top).names.slice(0, 3);
  const topBit = top.length ? ` Opens with ${top.join(", ")}.` : "";
  return `${familyLine.charAt(0).toUpperCase()}${familyLine.slice(1)}.${topBit}`;
}

function hasNotesOfFromRecipe(recipe: PerfumeRecipe): string[] {
  if (recipe.hasNotesOf?.length) return [...recipe.hasNotesOf];
  const all = [
    ...recipe.notes.top,
    ...recipe.notes.heart,
    ...recipe.notes.base,
    ...(recipe.notes.fixative ?? []),
  ];
  return noteNames(all).names;
}

function ingredientsFromRecipe(recipe: PerfumeRecipe): ScentIngredient[] {
  const seen = new Set<string>();
  const out: ScentIngredient[] = [];
  for (const id of recipe.requiredChemicalIds) {
    if (seen.has(id)) continue;
    seen.add(id);
    const chem = getChemical(id);
    const note = FRAGRANCE_NOTE_BY_CHEMICAL_ID[id];
    out.push({
      chemicalId: id,
      name: chem?.name ?? note?.name ?? id,
      formula: chem?.formula,
      role: note?.role,
      blurb: note?.blurb,
    });
  }
  // Include pyramid notes that aren't in required list (educational fullness)
  const pyramidChemIds = [
    ...recipe.notes.top,
    ...recipe.notes.heart,
    ...recipe.notes.base,
    ...(recipe.notes.fixative ?? []),
  ]
    .map((nid) => FRAGRANCE_NOTE_BY_ID[nid]?.chemicalId)
    .filter((id): id is string => Boolean(id));
  for (const id of pyramidChemIds) {
    if (seen.has(id)) continue;
    seen.add(id);
    const chem = getChemical(id);
    const note = FRAGRANCE_NOTE_BY_CHEMICAL_ID[id];
    out.push({
      chemicalId: id,
      name: chem?.name ?? note?.name ?? id,
      formula: chem?.formula,
      role: note?.role,
      blurb: note?.blurb,
    });
  }
  return out;
}

export function profileFromRecipe(recipe: PerfumeRecipe): ScentProfile {
  const top = noteNames(recipe.notes.top);
  const heart = noteNames(recipe.notes.heart);
  const base = noteNames(recipe.notes.base);
  const fix = noteNames(recipe.notes.fixative ?? []);
  const notes: ScentNoteLine[] = [
    { role: "top", label: "Top notes", names: top.names, blurbs: top.blurbs },
    {
      role: "heart",
      label: "Heart notes",
      names: heart.names,
      blurbs: heart.blurbs,
    },
    { role: "base", label: "Base notes", names: base.names, blurbs: base.blurbs },
  ];
  if (fix.names.length) {
    notes.push({
      role: "fixative",
      label: "Fixative",
      names: fix.names,
      blurbs: fix.blurbs,
    });
  }
  return {
    displayName: recipe.displayName,
    brandLabel: recipe.brandLabel,
    family: recipe.family,
    concentration: recipe.concentration,
    smellsLike: smellsLikeFromRecipe(recipe),
    hasNotesOf: hasNotesOfFromRecipe(recipe),
    notes,
    ingredients: ingredientsFromRecipe(recipe),
    blurb: recipe.blurb,
    bottleColor: recipe.bottleColor,
    icon: recipe.icon,
  };
}

function profileFromContentIds(
  contentIds: string[],
  displayName = "Custom perfume",
): ScentProfile {
  const byRole: Record<"top" | "heart" | "base" | "fixative", ScentIngredient[]> =
    { top: [], heart: [], base: [], fixative: [] };
  const ingredients: ScentIngredient[] = [];
  for (const id of contentIds) {
    const chem = getChemical(id);
    const note = FRAGRANCE_NOTE_BY_CHEMICAL_ID[id];
    const entry: ScentIngredient = {
      chemicalId: id,
      name: chem?.name ?? note?.name ?? id,
      formula: chem?.formula,
      role: note?.role ?? (id === "c2h5oh" ? "solvent" : undefined),
      blurb: note?.blurb,
    };
    ingredients.push(entry);
    if (note && note.role !== "solvent") {
      const role =
        note.role === "fixative"
          ? "fixative"
          : note.role === "top" || note.role === "heart" || note.role === "base"
            ? note.role
            : null;
      if (role) byRole[role].push(entry);
    }
  }
  const notes: ScentNoteLine[] = (
    [
      ["top", "Top notes"],
      ["heart", "Heart notes"],
      ["base", "Base notes"],
      ["fixative", "Fixative"],
    ] as const
  )
    .filter(([role]) => byRole[role].length > 0)
    .map(([role, label]) => ({
      role,
      label,
      names: byRole[role].map((i) => i.name),
      blurbs: byRole[role].map((i) => i.blurb ?? ""),
    }));

  const scentNames = ingredients
    .filter((i) => i.chemicalId !== "c2h5oh")
    .map((i) => i.name.replace(/ Oil| Absolute| Note| Accord.*/g, ""));
  const smellsLike =
    scentNames.length > 0
      ? `Your blend of ${scentNames.slice(0, 4).join(", ")}${
          scentNames.length > 4 ? "…" : ""
        } — a freeform lab perfume`
      : "A custom ethanol-based fragrance blend";

  return {
    displayName,
    family: "fresh",
    concentration: "edt",
    smellsLike,
    hasNotesOf: scentNames.slice(0, 8),
    notes,
    ingredients,
    blurb:
      "Freeform perfume: ethanol carries your top, heart, and base notes. Educational recreation — not a commercial formula.",
    bottleColor: "#f8bbd0",
    icon: "🧴",
  };
}

export function concentrationLabel(
  c: PerfumeConcentration | string | undefined,
): string {
  if (!c) return "";
  return CONCENTRATION_LABEL[c as PerfumeConcentration] ?? String(c).toUpperCase();
}

export function familyLabel(family: string): string {
  if (family === "fougere") return "Fougère";
  return family.charAt(0).toUpperCase() + family.slice(1);
}

/**
 * Resolve a scent dossier from goal / recipe / chemical product / vessel contents.
 */
export function resolveScentProfile(input: {
  goalId?: string | null;
  perfumeRecipeId?: string | null;
  productChemicalId?: string | null;
  contentIds?: string[];
  displayName?: string;
}): ScentProfile | null {
  const recipeId =
    input.perfumeRecipeId ??
    (input.goalId && getPerfumeRecipe(input.goalId) ? input.goalId : null) ??
    (input.productChemicalId?.startsWith("perfume-")
      ? input.productChemicalId.slice("perfume-".length)
      : null);

  if (recipeId) {
    const recipe = getPerfumeRecipe(recipeId);
    if (recipe) return profileFromRecipe(recipe);
  }

  // Legacy teaching cologne
  if (
    input.goalId === "perfume" ||
    input.productChemicalId === "cologne" ||
    input.perfumeRecipeId === "inspired-citruscologne"
  ) {
    const base = { ...LEGACY_CITRUS_COLOGNE };
    if (input.contentIds?.length) {
      // Prefer actual poured ingredients when available
      const used = input.contentIds
        .map((id) => {
          const chem = getChemical(id);
          const note = FRAGRANCE_NOTE_BY_CHEMICAL_ID[id];
          return {
            chemicalId: id,
            name: chem?.name ?? note?.name ?? id,
            formula: chem?.formula,
            role: note?.role ?? (id === "c2h5oh" ? "solvent" : undefined),
            blurb: note?.blurb,
          } satisfies ScentIngredient;
        })
        .filter((i) => i.chemicalId !== "cologne");
      if (used.length) base.ingredients = used;
    }
    return base;
  }

  if (input.contentIds?.length) {
    const hasEthanol = input.contentIds.includes("c2h5oh");
    const hasScent = input.contentIds.some(
      (id) => id !== "c2h5oh" && FRAGRANCE_NOTE_BY_CHEMICAL_ID[id],
    );
    if (hasEthanol && hasScent) {
      return profileFromContentIds(
        input.contentIds,
        input.displayName ?? "Custom perfume",
      );
    }
  }

  return null;
}
