import type { ProductGoal, GoalStep } from "@/domains/chemistry/data/goals";
import {
  placeBeakerStep,
  placeEquipmentStep,
  pourStep,
  mixUntilStep,
  stirStep,
  shakeStep,
  vesselHas,
  vesselCount,
  hasEquipment,
} from "@/domains/chemistry/data/goalSteps";
import { FRAGRANCE_NOTE_BY_ID } from "./fragranceNotes";
import { PERFUME_RECIPES, getPerfumeRecipe } from "./perfumeRecipes";
import {
  DIFFICULTY_REWARDS,
  type GoalDifficulty,
  type PerfumeRecipe,
} from "./types";
import { getChemical } from "@/domains/chemistry/data/chemicals";
import { defaultPourMl } from "@/desk/vesselContents";
import type { VesselContent } from "@/types";

function chemIdsForNotes(noteIds: string[]): string[] {
  return noteIds
    .map((id) => FRAGRANCE_NOTE_BY_ID[id]?.chemicalId)
    .filter((id): id is string => Boolean(id));
}

function chemName(id: string) {
  return getChemical(id)?.name ?? id;
}

function minAmountsFrom(contents: VesselContent[], ids: string[]): Record<string, number> {
  const map = Object.fromEntries(contents.map((c) => [c.chemicalId, c.amountMl]));
  const out: Record<string, number> = {};
  for (const id of ids) {
    out[id] = map[id] ?? defaultPourMl(id);
  }
  return out;
}

function fmtMl(id: string, recipe?: PerfumeRecipe): string {
  const fromRecipe = recipe?.targetContents.find((c) => c.chemicalId === id)?.amountMl;
  const n = fromRecipe ?? defaultPourMl(id);
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

function amountsLine(recipe: PerfumeRecipe, ids: string[]): string {
  return ids
    .map((id) => `${fmtMl(id, recipe)} ml ${chemName(id)}`)
    .join(", ");
}


function mixPred(recipeId: string) {
  return (r: { ok: boolean; explanationKey?: string }) =>
    Boolean(r.ok && r.explanationKey === `product-perfume:${recipeId}`);
}

function formulaCheckStep(
  recipe: PerfumeRecipe,
  required: string[],
): GoalStep {
  const mins = minAmountsFrom(recipe.targetContents, required);
  return {
    id: `${recipe.id}-ready`,
    title: "Formula check",
    instruction: `Confirm every signature ingredient meets the recipe volumes: ${amountsLine(recipe, required)}.`,
    hints: [
      {
        tier: "nudge",
        text: "Compare your beaker to the recipe formula (ml matters).",
      },
      {
        tier: "clue",
        text: `Need: ${amountsLine(recipe, required)}.`,
      },
      {
        tier: "almost",
        text: "All required chemicals at target ml should already be poured — continue.",
      },
    ],
    targetAmounts: required.map((chemicalId) => ({
      chemicalId,
      amountMl: mins[chemicalId]!,
    })),
    check: (s) => vesselHas(s, required, { minAmounts: mins }),
  };
}

function blendMixStep(recipe: PerfumeRecipe): GoalStep {
  return mixUntilStep(`${recipe.id}-mix`, {
    title: "Blend & bottle",
    instruction: "Stir if needed, then Mix — no burner. Pack on success.",
    pred: mixPred(recipe.id),
    nudge: "Blend gently; heat would drive off alcohol.",
    clue: "Press Mix on the finished vessel.",
    almost: `Mix. You should see “${recipe.displayName}”.`,
  });
}

/** Easy: ~7–8 steps — single vessel, signatures, one stir, Mix */
function buildEasy(recipe: PerfumeRecipe, signatures: string[]): GoalStep[] {
  const steps: GoalStep[] = [
    placeBeakerStep(`${recipe.id}-glass`, {
      title: "Place a beaker",
      instruction: "Set out glassware for your perfume blend.",
    }),
    pourStep(`${recipe.id}-solvent`, {
      title: "Add the carrier",
      instruction:
        `Pour ${fmtMl("c2h5oh", recipe)} ml ethanol — the alcohol that carries the scent and evaporates on skin.`,
      chemicalIds: ["c2h5oh"],
        minAmounts: minAmountsFrom(recipe.targetContents, ["c2h5oh"]),
      nudge: "Think of a solvent that evaporates on skin.",
      clue: "Look under organics / alcohols for Ethanol.",
      almost: `Pour ${fmtMl("c2h5oh", recipe)} ml Ethanol (C₂H₅OH) into the beaker.`,
    }),
  ];

  signatures.forEach((chemId, i) => {
    const roleHint =
      i === 0 ? "top" : i === 1 ? "heart" : i === 2 ? "base" : "note";
    steps.push(
      pourStep(`${recipe.id}-sig-${chemId}`, {
        title: `Add ${roleHint}: ${chemName(chemId)}`,
        instruction: `Pour ${fmtMl(chemId, recipe)} ml ${chemName(chemId)} — a signature ${roleHint} for ${recipe.displayName}.`,
        chemicalIds: ["c2h5oh", ...signatures.slice(0, i + 1)],
        minAmounts: minAmountsFrom(recipe.targetContents, ["c2h5oh", ...signatures.slice(0, i + 1)]),
        nudge: `Find the next scent oil for this ${roleHint} note.`,
        clue: `Search Inventory for ${chemName(chemId)}.`,
        almost: `Pour ${fmtMl(chemId, recipe)} ml ${chemName(chemId)} into the beaker.`,
      }),
    );
  });

  steps.push(
    stirStep(`${recipe.id}-stir`, {
      chemicalIds: recipe.requiredChemicalIds,
      minLevel: 1,
      title: "Stir the cologne",
      instruction: "Stir once so the oils dissolve into the alcohol.",
    }),
    formulaCheckStep(recipe, recipe.requiredChemicalIds),
    blendMixStep(recipe),
  );
  return steps;
}

/**
 * Medium: ~10–14 steps — stir gates with escalating minLevel between pours
 * so dumping everything then stirring once cannot skip the whole ladder.
 */
function buildMedium(recipe: PerfumeRecipe, signatures: string[]): GoalStep[] {
  const steps: GoalStep[] = [
    placeBeakerStep(`${recipe.id}-glass`),
    pourStep(`${recipe.id}-solvent`, {
      title: "Add the carrier",
      instruction: `Pour ${fmtMl("c2h5oh", recipe)} ml ethanol as your perfume base.`,
      chemicalIds: ["c2h5oh"],
        minAmounts: minAmountsFrom(recipe.targetContents, ["c2h5oh"]),
      nudge: "Start with the carrier alcohol.",
      clue: "Inventory → Ethanol.",
      almost: `Pour ${fmtMl("c2h5oh", recipe)} ml Ethanol into the beaker.`,
    }),
    stirStep(`${recipe.id}-stir-carrier`, {
      chemicalIds: ["c2h5oh"],
      minLevel: 1,
      title: "Wet the glass",
      instruction: "Stir the ethanol briefly before adding oils.",
    }),
  ];

  signatures.forEach((chemId, i) => {
    const roleHint =
      i === 0 ? "top" : i === 1 ? "heart" : i === 2 ? "base" : "note";
    const soFar = ["c2h5oh", ...signatures.slice(0, i + 1)];
    steps.push(
      pourStep(`${recipe.id}-sig-${chemId}`, {
        title: `Add ${roleHint}: ${chemName(chemId)}`,
        instruction: `Pour ${fmtMl(chemId, recipe)} ml ${chemName(chemId)} for the ${roleHint} of ${recipe.displayName}.`,
        chemicalIds: soFar,
        minAmounts: minAmountsFrom(recipe.targetContents, soFar),
        nudge: `Next ${roleHint} oil.`,
        clue: `Search for ${chemName(chemId)}.`,
        almost: `Pour ${fmtMl(chemId, recipe)} ml ${chemName(chemId)}.`,
      }),
      stirStep(`${recipe.id}-stir-${chemId}`, {
        chemicalIds: soFar,
        // Escalate so one global stir after dumping all oils can't clear every gate
        minLevel: Math.min(3, i + 1),
        title: `Incorporate ${roleHint}`,
        instruction: `Stir well after adding ${chemName(chemId)} (pour resets stir — stir again).`,
      }),
    );
  });

  steps.push(
    formulaCheckStep(recipe, recipe.requiredChemicalIds),
    shakeStep(`${recipe.id}-shake`, {
      chemicalIds: recipe.requiredChemicalIds,
      title: "Shake the concentrate",
      instruction: "A short shake finishes the medium blend.",
    }),
    blendMixStep(recipe),
  );
  return steps;
}

/**
 * Hard: ~15–20 — dual beaker: top+ethanol in A, heart in B, combine, base, shake, Mix
 */
function buildHard(recipe: PerfumeRecipe, signatures: string[]): GoalStep[] {
  const top = signatures[0];
  const heart = signatures[1] ?? signatures[0]!;
  const base = signatures[2] ?? signatures[signatures.length - 1]!;
  const topAccord = ["c2h5oh", top].filter(Boolean) as string[];
  const heartSolo = [heart];
  const combinedTopHeart = ["c2h5oh", top, heart];
  const full = recipe.requiredChemicalIds;

  const steps: GoalStep[] = [
    placeBeakerStep(`${recipe.id}-glass-a`, {
      title: "Place beaker A",
      instruction: "Main beaker for the top accord + ethanol.",
    }),
    placeEquipmentStep(`${recipe.id}-glass-b`, {
      equipmentId: "beaker",
      minCount: 2,
      title: "Place beaker B",
      instruction: "Second beaker for the heart accord.",
      nudge: "Hard recipes use two vessels.",
      clue: "Equipment → Beaker again.",
      almost: "You need two beakers on the desk.",
    }),
    pourStep(`${recipe.id}-solvent-a`, {
      title: "Ethanol in A",
      instruction: `Pour ${fmtMl("c2h5oh", recipe)} ml ethanol into beaker A.`,
      chemicalIds: ["c2h5oh"],
        minAmounts: minAmountsFrom(recipe.targetContents, ["c2h5oh"]),
      nudge: "Carrier goes in the first beaker.",
      clue: `Pour ${fmtMl("c2h5oh", recipe)} ml Ethanol into one beaker.`,
      almost: `Beaker A should contain ${fmtMl("c2h5oh", recipe)} ml Ethanol.`,
    }),
    pourStep(`${recipe.id}-top-a`, {
      title: `Top in A: ${chemName(top!)}`,
      instruction: `Add ${fmtMl(top!, recipe)} ml ${chemName(top!)} to the ethanol in A.`,
      chemicalIds: topAccord,
        minAmounts: minAmountsFrom(recipe.targetContents, topAccord),
      nudge: "Top notes dissolve in alcohol first.",
      clue: `Pour ${fmtMl(top!, recipe)} ml ${chemName(top!)} into the ethanol beaker.`,
      almost: `A holds Ethanol + ${fmtMl(top!, recipe)} ml ${chemName(top!)}.`,
    }),
    stirStep(`${recipe.id}-stir-a`, {
      chemicalIds: topAccord,
      minLevel: 1,
      title: "Stir accord A",
      instruction: "Stir beaker A until the top oil is dispersed.",
    }),
    pourStep(`${recipe.id}-heart-b`, {
      title: `Heart in B: ${chemName(heart)}`,
      instruction: `Pour ${fmtMl(heart, recipe)} ml ${chemName(heart)} into the empty second beaker.`,
      chemicalIds: heartSolo,
        minAmounts: minAmountsFrom(recipe.targetContents, heartSolo),
      nudge: "Heart notes start in their own vessel.",
      clue: `Pour ${chemName(heart)} into beaker B (not A).`,
      almost: `B contains ${chemName(heart)}.`,
    }),
    stirStep(`${recipe.id}-stir-b`, {
      chemicalIds: heartSolo,
      minLevel: 1,
      title: "Stir accord B",
      instruction: "Stir beaker B briefly.",
    }),
    {
      id: `${recipe.id}-combine`,
      title: "Pour A into B (or B into A)",
      instruction:
        "Combine accords: drag one beaker onto the other so top + heart + ethanol share a vessel.",
      hints: [
        {
          tier: "nudge",
          text: "Perfumers combine partial accords carefully.",
        },
        {
          tier: "clue",
          text: "Drag one beaker onto the other to pour.",
        },
        {
          tier: "almost",
          text: `One vessel must hold ${combinedTopHeart.map(chemName).join(" + ")}.`,
        },
      ],
      check: (s) =>
        vesselHas(s, combinedTopHeart, {
          minAmounts: minAmountsFrom(recipe.targetContents, combinedTopHeart),
        }),
    },
    pourStep(`${recipe.id}-base`, {
      title: `Add base: ${chemName(base)}`,
      instruction: `Pour ${fmtMl(base, recipe)} ml ${chemName(base)} into the combined vessel.`,
      chemicalIds: full,
        minAmounts: minAmountsFrom(recipe.targetContents, full),
      nudge: "Base notes finish the pyramid.",
      clue: `Search for ${chemName(base)}.`,
      almost: `Pour ${fmtMl(base, recipe)} ml ${chemName(base)} into the combined beaker.`,
    }),
    stirStep(`${recipe.id}-stir-full`, {
      chemicalIds: full,
      minLevel: 2,
      title: "Deep stir",
      instruction: "Stir twice — pour reset the rod; bring stir level to 2+.",
    }),
    {
      id: `${recipe.id}-no-heat`,
      title: "Keep it cold",
      instruction: "Do not attach heat — alcohol would flash off.",
      hints: [
        { tier: "nudge", text: "Perfume stays off the burner." },
        { tier: "clue", text: "If Heat is on, tap it off." },
        { tier: "almost", text: "Working vessel must not have heatAttached." },
      ],
      check: (s) =>
        s.vessels.some(
          (v) =>
            full.every((id) => v.contentIds.includes(id)) && !v.heatAttached,
        ),
    },
    formulaCheckStep(recipe, full),
    shakeStep(`${recipe.id}-shake`, {
      chemicalIds: full,
      title: "Shake before bottling",
    }),
    {
      id: `${recipe.id}-two-vessels-ok`,
      title: "Desk still has two vessels",
      instruction: "Keep both beakers on the desk (atelier discipline).",
      hints: [
        { tier: "nudge", text: "Don't clear the board yet." },
        { tier: "clue", text: "Two beakers should still be visible." },
        { tier: "almost", text: "Place a second beaker if you cleared one." },
      ],
      check: (s) => vesselCount(s, "beaker") >= 2 || vesselCount(s) >= 2,
    },
    {
      id: `${recipe.id}-brand-check`,
      title: "Inspired-by check",
      instruction: `Confirm you’re bottling ${recipe.displayName} (${recipe.brandLabel}).`,
      hints: [
        { tier: "nudge", text: "Educational recreation only." },
        { tier: "clue", text: recipe.brandLabel },
        { tier: "almost", text: "Formula still in one vessel — continue to Mix." },
      ],
      check: (s) =>
        vesselHas(s, full, {
          minAmounts: minAmountsFrom(recipe.targetContents, full),
        }),
    },
    blendMixStep(recipe),
  ];
  return steps;
}

/**
 * Very hard: ~21–28 — beaker + flask, phased concentrates, transfers, multi-stir/shake
 */
function buildVeryHard(
  recipe: PerfumeRecipe,
  signatures: string[],
): GoalStep[] {
  const top = signatures[0]!;
  const heart = signatures[1] ?? top;
  const base = signatures[2] ?? heart;
  const topAccord = ["c2h5oh", top];
  const heartAccord = [heart];
  // After transfer into flask or beaker
  const mid = ["c2h5oh", top, heart];
  const full = recipe.requiredChemicalIds;

  const steps: GoalStep[] = [
    placeBeakerStep(`${recipe.id}-vh-beaker`, {
      title: "Place working beaker",
      instruction: "Beaker for the top + ethanol concentrate.",
    }),
    placeEquipmentStep(`${recipe.id}-vh-flask`, {
      equipmentId: "flask",
      title: "Place Erlenmeyer flask",
      instruction: "Flask for heart concentrate and final assembly.",
      nudge: "Very hard blends use flask + beaker.",
      clue: "Equipment → Erlenmeyer Flask.",
      almost: "Put an Erlenmeyer flask on the desk.",
    }),
    pourStep(`${recipe.id}-vh-etoh`, {
      title: "Charge beaker with ethanol",
      instruction: `Pour ${fmtMl("c2h5oh", recipe)} ml ethanol into the beaker only.`,
      chemicalIds: ["c2h5oh"],
        minAmounts: minAmountsFrom(recipe.targetContents, ["c2h5oh"]),
      nudge: "Carrier first.",
      clue: "Ethanol → beaker.",
      almost: `Beaker has ${fmtMl("c2h5oh", recipe)} ml Ethanol.`,
    }),
    stirStep(`${recipe.id}-vh-stir-etoh`, {
      chemicalIds: ["c2h5oh"],
      minLevel: 1,
      title: "Condition the solvent",
    }),
    pourStep(`${recipe.id}-vh-top`, {
      title: `Top concentrate: ${chemName(top)}`,
      instruction: `Add ${fmtMl(top, recipe)} ml ${chemName(top)} to the beaker.`,
      chemicalIds: topAccord,
        minAmounts: minAmountsFrom(recipe.targetContents, topAccord),
      nudge: "Build the top accord in the beaker.",
      clue: `Pour ${fmtMl(top, recipe)} ml ${chemName(top)}.`,
      almost: `Beaker: Ethanol + ${fmtMl(top, recipe)} ml ${chemName(top)}.`,
    }),
    stirStep(`${recipe.id}-vh-stir-top`, {
      chemicalIds: topAccord,
      minLevel: 2,
      title: "Macerate top (stir 2+)",
      instruction: "Stir to level 2 — oils need time in alcohol.",
    }),
    pourStep(`${recipe.id}-vh-heart-flask`, {
      title: `Heart in flask: ${chemName(heart)}`,
      instruction: `Pour ${fmtMl(heart, recipe)} ml ${chemName(heart)} into the Erlenmeyer (not the beaker).`,
      chemicalIds: heartAccord,
        minAmounts: minAmountsFrom(recipe.targetContents, heartAccord),
      nudge: "Heart lives in the flask for now.",
      clue: `Target the flask with ${chemName(heart)}.`,
      almost: `Flask contains ${chemName(heart)}.`,
    }),
    stirStep(`${recipe.id}-vh-stir-heart`, {
      chemicalIds: heartAccord,
      minLevel: 1,
      title: "Stir flask heart",
    }),
    {
      id: `${recipe.id}-vh-transfer`,
      title: "Pour beaker into flask",
      instruction:
        "Transfer the top+ethanol concentrate into the flask (drag beaker onto flask).",
      hints: [
        { tier: "nudge", text: "Combine top into heart." },
        { tier: "clue", text: "Drag the beaker onto the Erlenmeyer." },
        {
          tier: "almost",
          text: `Flask (or one vessel) must hold ${mid.map(chemName).join(" + ")}.`,
        },
      ],
      check: (s) =>
        vesselHas(s, mid, {
          minAmounts: minAmountsFrom(recipe.targetContents, mid),
        }),
    },
    stirStep(`${recipe.id}-vh-stir-mid`, {
      chemicalIds: mid,
      minLevel: 2,
      title: "Marry top + heart",
      instruction: "Stir the combined flask to level 2+.",
    }),
    pourStep(`${recipe.id}-vh-base`, {
      title: `Base: ${chemName(base)}`,
      instruction: `Add ${fmtMl(base, recipe)} ml ${chemName(base)} to the combined vessel.`,
      chemicalIds: full,
        minAmounts: minAmountsFrom(recipe.targetContents, full),
      nudge: "Base / resin last.",
      clue: `Pour ${fmtMl(base, recipe)} ml ${chemName(base)}.`,
      almost: `Full formula in one vessel.`,
    }),
    stirStep(`${recipe.id}-vh-stir-base`, {
      chemicalIds: full,
      minLevel: 3,
      title: "Full maceration stir (3)",
      instruction: "Stir to maximum (level 3) — very hard atelier standard.",
    }),
    formulaCheckStep(recipe, full),
    shakeStep(`${recipe.id}-vh-shake-1`, {
      chemicalIds: full,
      title: "First shake",
      instruction: "Shake once to emulsify.",
    }),
    {
      id: `${recipe.id}-vh-glassware`,
      title: "Keep flask and beaker",
      instruction: "Both glassware pieces stay on the desk until bottling.",
      hints: [
        { tier: "nudge", text: "Don't Clear board." },
        {
          tier: "clue",
          text: "You should still have a beaker and a flask.",
        },
        {
          tier: "almost",
          text: "Re-place Erlenmeyer or Beaker if missing.",
        },
      ],
      check: (s) =>
        hasEquipment(s, "beaker") &&
        (hasEquipment(s, "flask") || vesselCount(s) >= 2),
    },
    {
      id: `${recipe.id}-vh-label`,
      title: "Name the concentrate",
      instruction:
        "Mentally label the working vessel — you’re bottling a named inspired scent.",
      hints: [
        {
          tier: "nudge",
          text: `This blend is ${recipe.displayName}.`,
        },
        {
          tier: "clue",
          text: recipe.brandLabel,
        },
        {
          tier: "almost",
          text: "Continue when the full formula is still in one vessel.",
        },
      ],
      check: (s) =>
        vesselHas(s, full, {
          minAmounts: minAmountsFrom(recipe.targetContents, full),
        }),
    },
    {
      id: `${recipe.id}-vh-capacity`,
      title: "Capacity discipline",
      instruction:
        "Confirm the perfume vessel has at most 6 contents (desk capacity).",
      hints: [
        { tier: "nudge", text: "Beakers hold six chemicals max." },
        {
          tier: "clue",
          text: "If something is missing, pour between vessels carefully.",
        },
        {
          tier: "almost",
          text: "Full formula present; no heat attached.",
        },
      ],
      check: (s) =>
        s.vessels.some(
          (v) =>
            full.every((id) => v.contentIds.includes(id)) &&
            v.contentIds.length <= 6 &&
            !v.heatAttached,
        ),
    },
    {
      id: `${recipe.id}-vh-no-heat`,
      title: "No heat on the blend",
      instruction: "Confirm no Bunsen is heating the perfume vessel.",
      hints: [
        { tier: "nudge", text: "Heat drives off alcohol — bad for perfume." },
        { tier: "clue", text: "Detach Heat if a flame is attached." },
        { tier: "almost", text: "Perfume vessel heatAttached must be false." },
      ],
      check: (s) =>
        s.vessels.some(
          (v) =>
            full.every((id) => v.contentIds.includes(id)) && !v.heatAttached,
        ) || !s.vessels.some((v) => v.heatAttached && v.contentIds.length > 0),
    },
    shakeStep(`${recipe.id}-vh-shake-2`, {
      chemicalIds: full,
      title: "Finishing shake",
      instruction: "Shake again before Mix (shakeAt already counts).",
    }),
    {
      id: `${recipe.id}-vh-rest`,
      title: "Rest check",
      instruction: "Confirm the full formula is still in one vessel.",
      hints: [
        { tier: "nudge", text: "Nothing spilled — formula intact." },
        { tier: "clue", text: "Open the vessel contents list." },
        {
          tier: "almost",
          text: requiredList(full),
        },
      ],
      check: (s) =>
        vesselHas(s, full, {
          minAmounts: minAmountsFrom(recipe.targetContents, full),
        }),
    },
    {
      id: `${recipe.id}-vh-inventory`,
      title: "Inventory still highlights notes",
      instruction:
        "Glance at Inventory — fragrance oils for this recipe stay available.",
      hints: [
        { tier: "nudge", text: "Chemicals tab shows your oils." },
        { tier: "clue", text: "You already poured what you need." },
        { tier: "almost", text: "Proceed if the vessel still has the formula." },
      ],
      check: (s) =>
        vesselHas(s, full, {
          minAmounts: minAmountsFrom(recipe.targetContents, full),
        }),
    },
    stirStep(`${recipe.id}-vh-final-stir`, {
      chemicalIds: full,
      minLevel: 1,
      title: "Final gentle stir",
      instruction: "One last stir before Mix (level 1+ is enough here).",
    }),
    blendMixStep(recipe),
  ];
  return steps;
}

function requiredList(ids: string[]) {
  return `Need ${ids.map(chemName).join(", ")}.`;
}

/**
 * Build a guided ProductGoal from a perfume recipe.
 * Step count follows recipe.difficulty (easy → very-hard).
 */
export function perfumeRecipeToGoal(recipe: PerfumeRecipe): ProductGoal {
  const highlight = Array.from(
    new Set([
      "beaker",
      "flask",
      ...recipe.requiredChemicalIds,
      ...chemIdsForNotes(recipe.notes.top),
      ...chemIdsForNotes(recipe.notes.heart),
      ...chemIdsForNotes(recipe.notes.base),
    ]),
  );

  const signatures = recipe.requiredChemicalIds.filter((id) => id !== "c2h5oh");
  const difficulty: GoalDifficulty = recipe.difficulty;
  const rewards = DIFFICULTY_REWARDS[difficulty];

  let steps: GoalStep[];
  switch (difficulty) {
    case "easy":
      steps = buildEasy(recipe, signatures);
      break;
    case "medium":
      steps = buildMedium(recipe, signatures);
      break;
    case "hard":
      steps = buildHard(recipe, signatures);
      break;
    case "very-hard":
      steps = buildVeryHard(recipe, signatures);
      break;
    default:
      steps = buildEasy(recipe, signatures);
  }

  return {
    id: recipe.id,
    title: `Make ${recipe.displayName}`,
    tagline: `${recipe.brandLabel} · ${rewards.label} · ${steps.length} steps`,
    icon: recipe.icon,
    category: "perfume",
    visualKind: "bottle",
    rewardCaption: "Bottled. Spritz-ready.",
    productBlurb: recipe.blurb,
    highlightItemIds: highlight,
    successBlurb: `You made ${recipe.displayName} — ${recipe.brandLabel}. Educational recreation only.`,
    badgeId: recipe.badgeId,
    difficulty,
    steps,
  };
}

const perfumeGoalCache = new Map<string, ProductGoal>();

export function getPerfumeGoal(id: string): ProductGoal | undefined {
  const recipe = getPerfumeRecipe(id);
  if (!recipe) return undefined;
  let goal = perfumeGoalCache.get(id);
  if (!goal) {
    goal = perfumeRecipeToGoal(recipe);
    perfumeGoalCache.set(id, goal);
  }
  return goal;
}

export function allPerfumeGoals(): ProductGoal[] {
  return PERFUME_RECIPES.map((r) => getPerfumeGoal(r.id)!);
}

/** Test helper: clear memoized goals after recipe edits */
export function clearPerfumeGoalCache() {
  perfumeGoalCache.clear();
}
