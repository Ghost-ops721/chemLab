import type { DeskVessel, EngineResult } from "@/types";
import {
  heatStep,
  mixUntilStep,
  placeBeakerStep,
  pourStep,
  vesselHas,
} from "./goalSteps";

export type HintTier = "nudge" | "clue" | "almost";

export interface GoalHint {
  tier: HintTier;
  text: string;
}

export interface GoalDeskSnapshot {
  vessels: DeskVessel[];
  activeVesselId: string | null;
}

export interface GoalStep {
  id: string;
  title: string;
  instruction: string;
  hints: GoalHint[];
  check: (snap: GoalDeskSnapshot) => boolean;
}

export type GoalCategory = "product" | "classic";

export type GoalVisualKind =
  | "soap"
  | "bottle"
  | "tablet"
  | "beaker"
  | "flame"
  | "crystal"
  | "gas"
  | "slime"
  | "balm";

export interface ProductGoal {
  id: string;
  title: string;
  tagline: string;
  productBlurb: string;
  icon: string;
  category: GoalCategory;
  visualKind: GoalVisualKind;
  rewardCaption: string;
  /** Inventory / equipment IDs to highlight */
  highlightItemIds: string[];
  successBlurb: string;
  badgeId: string;
  steps: GoalStep[];
}

const okKey =
  (key: string) =>
  (r: EngineResult) =>
    r.ok && r.explanationKey === key;

const okType =
  (type: string) =>
  (r: EngineResult) =>
    r.ok && r.explanationKey === type;

const okPrecipitate = (r: EngineResult) =>
  r.ok &&
  (r.effects.some((e) => e.kind === "precipitate") ||
    r.explanationKey === "precipitation");

const okGas = (r: EngineResult) =>
  r.ok &&
  (r.effects.some((e) => e.kind === "gas") ||
    r.explanationKey === "gas-forming");

export const PRODUCT_GOALS: ProductGoal[] = [
  // ——— Existing products ———
  {
    id: "perfume",
    title: "Make a perfume",
    tagline: "Citrus cologne",
    icon: "🍋",
    category: "product",
    visualKind: "bottle",
    rewardCaption: "Bottled. Spritz-ready.",
    productBlurb:
      "Real cologne is fragrant oils dissolved in alcohol so the scent spreads, then the alcohol evaporates. You’ll build a simplified citrus cologne on the desk.",
    highlightItemIds: ["beaker", "c2h5oh", "limonene", "ethyl-acetate"],
    successBlurb:
      "You made a citrus cologne — alcohol + scent oil, the same idea as perfume.",
    badgeId: "made-perfume",
    steps: [
      placeBeakerStep("perfume-glass"),
      pourStep("perfume-solvent", {
        title: "Add the carrier",
        instruction:
          "Pour the alcohol that will carry the scent (and evaporate on skin).",
        chemicalIds: ["c2h5oh"],
        nudge: "Think of a solvent that evaporates on skin.",
        clue: "Look under organics / alcohols.",
        almost: "Pour Ethanol (C₂H₅OH) into the beaker.",
      }),
      {
        id: "perfume-scent",
        title: "Add the scent",
        instruction: "Add a fragrant citrus oil or a fruity ester note.",
        hints: [
          { tier: "nudge", text: "Something that smells like lemon or fruit." },
          {
            tier: "clue",
            text: "Search Inventory for limonene or ethyl acetate.",
          },
          {
            tier: "almost",
            text: "Pour Limonene (citrus oil) — or Ethyl Acetate — into the same beaker.",
          },
        ],
        check: (s) =>
          vesselHas(s, ["c2h5oh", "limonene"]) ||
          vesselHas(s, ["c2h5oh", "ethyl-acetate"]),
      },
      mixUntilStep("perfume-mix", {
        title: "Blend the cologne",
        instruction: "Stir, then Mix — no burner needed for this blend.",
        pred: okKey("product-perfume"),
        nudge: "Blend gently; heat would drive off alcohol.",
        clue: "Click the liquid to stir, then press Mix.",
        almost: "Stir once, then Mix. You should see “citrus cologne”.",
      }),
    ],
  },
  {
    id: "soap",
    title: "Make soap",
    tagline: "Saponification",
    icon: "🧼",
    category: "product",
    visualKind: "soap",
    rewardCaption: "It's a real bar. It knows. It suds.",
    productBlurb:
      "Soap forms when fat meets a strong base under heat — saponification. You’ll cook a plant oil with NaOH into a soap salt.",
    highlightItemIds: ["beaker", "plant-oil", "naoh", "bunsen"],
    successBlurb: "You saponified fat into soap — kitchen chemistry, desk edition.",
    badgeId: "made-soap",
    steps: [
      placeBeakerStep("soap-glass", {
        title: "Place a beaker",
        instruction: "Put a beaker on the desk for the soap pot.",
      }),
      pourStep("soap-fat", {
        title: "Add the fat",
        instruction: "Pour a plant oil (triglyceride) into the beaker.",
        chemicalIds: ["plant-oil"],
        nudge: "Soap starts from oils and fats.",
        clue: "Search for “plant oil” or “fat”.",
        almost: "Pour Plant Oil (triglyceride).",
      }),
      pourStep("soap-lye", {
        title: "Add the lye",
        instruction: "Add a strong base — the classic soapmaking alkali.",
        chemicalIds: ["plant-oil", "naoh"],
        nudge: "You need a strong base (lye).",
        clue: "Look under bases for sodium hydroxide.",
        almost: "Pour NaOH into the same beaker.",
      }),
      heatStep("soap-heat", {
        chemicalIds: ["plant-oil", "naoh"],
        title: "Heat the pot",
        instruction: "Attach a Bunsen burner — saponification needs heat.",
      }),
      mixUntilStep("soap-mix", {
        title: "Cook the soap",
        instruction: "Stir, then Mix to finish saponification.",
        pred: okKey("product-soap"),
        nudge: "Mix under heat to drive the reaction.",
        clue: "Stir then press Mix.",
        almost: "Mix until you see soap in the equation.",
      }),
    ],
  },
  {
    id: "ink",
    title: "Make colored ink",
    tagline: "Bright precipitate",
    icon: "🖋️",
    category: "product",
    visualKind: "bottle",
    rewardCaption: "Yellow pigment, bottled.",
    productBlurb:
      "Many historical inks and pigments are insoluble colored solids. You’ll force a vivid yellow precipitate — a pigment suspended like ink.",
    highlightItemIds: ["beaker", "pbno32", "ki"],
    successBlurb: "You formed a yellow pigment (PbI₂) — precipitate as “ink”.",
    badgeId: "made-ink",
    steps: [
      placeBeakerStep("ink-glass"),
      pourStep("ink-lead", {
        title: "Add lead nitrate",
        instruction: "Pour lead(II) nitrate solution into the beaker.",
        chemicalIds: ["pbno32"],
        nudge: "One partner is a lead salt.",
        clue: "Search Pb(NO₃)₂.",
        almost: "Pour Lead(II) Nitrate.",
      }),
      pourStep("ink-iodide", {
        title: "Add iodide",
        instruction: "Add potassium iodide — the other half of the pigment.",
        chemicalIds: ["pbno32", "ki"],
        nudge: "Iodide will swap partners with lead.",
        clue: "Look for KI in salts.",
        almost: "Pour Potassium Iodide.",
      }),
      mixUntilStep("ink-mix", {
        title: "Precipitate the pigment",
        instruction: "Mix to form the yellow solid pigment.",
        pred: okPrecipitate,
        nudge: "Watch for a bright yellow solid.",
        clue: "Stir and Mix.",
        almost: "Mix until a precipitate effect appears.",
      }),
    ],
  },
  {
    id: "antacid",
    title: "Make an antacid fizz",
    tagline: "Acid meets carbonate",
    icon: "🫧",
    category: "product",
    visualKind: "tablet",
    rewardCaption: "Fizz achieved. Tummy hypothetical.",
    productBlurb:
      "Antacids neutralize stomach acid; carbonates also release CO₂ (the fizz). You’ll model that acid + carbonate gas-forming reaction.",
    highlightItemIds: ["beaker", "hcl", "na2co3"],
    successBlurb: "Acid + carbonate → salt + water + CO₂ — the antacid fizz.",
    badgeId: "made-antacid",
    steps: [
      placeBeakerStep("antacid-glass"),
      pourStep("antacid-acid", {
        title: "Add “stomach acid”",
        instruction: "Pour hydrochloric acid to stand in for stomach acid.",
        chemicalIds: ["hcl"],
        nudge: "Stomach acid is mostly HCl.",
        clue: "Acids → Hydrochloric Acid.",
        almost: "Pour HCl.",
      }),
      pourStep("antacid-base", {
        title: "Add the antacid",
        instruction: "Add a carbonate salt — the classic antacid ingredient.",
        chemicalIds: ["hcl", "na2co3"],
        nudge: "Look for a carbonate.",
        clue: "Sodium carbonate is a common choice.",
        almost: "Pour Na₂CO₃ (Sodium Carbonate).",
      }),
      mixUntilStep("antacid-mix", {
        title: "Make it fizz",
        instruction: "Mix to release carbon dioxide gas.",
        pred: okGas,
        nudge: "You want bubbles — a gas effect.",
        clue: "Mix the vessel.",
        almost: "Mix until the equation shows CO₂ / gas-forming.",
      }),
    ],
  },
  {
    id: "rust-remover",
    title: "Make a rust remover",
    tagline: "Acid cleans oxide",
    icon: "🧱",
    category: "product",
    visualKind: "bottle",
    rewardCaption: "Oxide, meet acid.",
    productBlurb:
      "Rust removers attack iron oxide with acid. You’ll dissolve Fe₂O₃ in HCl into soluble iron chloride — the core of acid rust cleaning.",
    highlightItemIds: ["beaker", "hcl", "fe2o3"],
    successBlurb: "You dissolved rust with acid — rust remover chemistry.",
    badgeId: "made-rust-remover",
    steps: [
      placeBeakerStep("rust-glass", {
        title: "Place a beaker",
        instruction: "Set out a beaker.",
      }),
      pourStep("rust-oxide", {
        title: "Add the rust",
        instruction: "Add iron(III) oxide — laboratory “rust”.",
        chemicalIds: ["fe2o3"],
        nudge: "Rust is an iron oxide.",
        clue: "Search Fe₂O₃ or rust.",
        almost: "Pour Iron(III) Oxide (rust).",
      }),
      pourStep("rust-acid", {
        title: "Add the acid",
        instruction: "Pour hydrochloric acid to attack the oxide.",
        chemicalIds: ["fe2o3", "hcl"],
        nudge: "Acids dissolve many metal oxides.",
        clue: "Use HCl.",
        almost: "Pour Hydrochloric Acid into the beaker.",
      }),
      mixUntilStep("rust-mix", {
        title: "Dissolve the rust",
        instruction: "Stir and Mix to finish the cleaner.",
        pred: okKey("product-rust"),
        nudge: "Mix to dissolve the solid rust.",
        clue: "Stir, then Mix.",
        almost: "Mix until you see FeCl₃ / product-rust.",
      }),
    ],
  },

  // ——— New product crafts ———
  {
    id: "sanitizer",
    title: "Make hand sanitizer",
    tagline: "Alcohol + humectant",
    icon: "🧴",
    category: "product",
    visualKind: "bottle",
    rewardCaption: "Gel ready. Hands hypothetical.",
    productBlurb:
      "Sanitizer gels are mostly alcohol with a humectant so skin doesn’t crack. Blend ethanol with glycerol.",
    highlightItemIds: ["beaker", "c2h5oh", "glycerol"],
    successBlurb: "Ethanol + glycerol — the alcohol + softener core of sanitizer.",
    badgeId: "made-sanitizer",
    steps: [
      placeBeakerStep("sanitizer-glass"),
      pourStep("sanitizer-alcohol", {
        title: "Add ethanol",
        instruction: "Pour ethanol — the antimicrobial carrier.",
        chemicalIds: ["c2h5oh"],
        nudge: "Sanitizer needs a strong alcohol.",
        clue: "Organics → Ethanol.",
        almost: "Pour Ethanol (C₂H₅OH).",
      }),
      pourStep("sanitizer-glycerol", {
        title: "Add glycerol",
        instruction: "Add glycerol so the mix doesn’t dry skin as harshly.",
        chemicalIds: ["c2h5oh", "glycerol"],
        nudge: "Look for a thick, sweet alcohol (humectant).",
        clue: "Search Inventory for glycerol.",
        almost: "Pour Glycerol into the same beaker.",
      }),
      mixUntilStep("sanitizer-mix", {
        title: "Blend the gel",
        instruction: "Mix to finish the sanitizer stand-in.",
        pred: okKey("product-sanitizer"),
        nudge: "No heat needed.",
        clue: "Stir, then Mix.",
        almost: "Mix until you see hand sanitizer gel.",
      }),
    ],
  },
  {
    id: "bath-bomb",
    title: "Make a bath bomb",
    tagline: "Acid + baking soda",
    icon: "💣",
    category: "product",
    visualKind: "tablet",
    rewardCaption: "Fizz tablet acquired.",
    productBlurb:
      "Bath bombs fizz because citric acid meets bicarbonate and releases CO₂ in water. Mix the dry pair on the desk.",
    highlightItemIds: ["beaker", "citric-acid", "nahco3"],
    successBlurb: "Citric acid + NaHCO₃ → fizz — bath-bomb chemistry.",
    badgeId: "made-bath-bomb",
    steps: [
      placeBeakerStep("bath-glass"),
      pourStep("bath-acid", {
        title: "Add citric acid",
        instruction: "Add citric acid — the sour half of the fizz.",
        chemicalIds: ["citric-acid"],
        nudge: "Bath bombs use a food acid.",
        clue: "Search citric acid.",
        almost: "Pour Citric Acid.",
      }),
      pourStep("bath-soda", {
        title: "Add baking soda",
        instruction: "Add sodium bicarbonate (baking soda).",
        chemicalIds: ["citric-acid", "nahco3"],
        nudge: "The other half is a bicarbonate.",
        clue: "Look for NaHCO₃.",
        almost: "Pour Sodium Bicarbonate.",
      }),
      mixUntilStep("bath-mix", {
        title: "Trigger the fizz",
        instruction: "Mix to release CO₂ and form the bath-bomb product.",
        pred: okKey("product-bath-bomb"),
        nudge: "Expect gas bubbles.",
        clue: "Stir and Mix.",
        almost: "Mix until you see bath bomb / CO₂.",
      }),
    ],
  },
  {
    id: "oxygen-demo",
    title: "Make oxygen gas",
    tagline: "Peroxide catalysis",
    icon: "💨",
    category: "product",
    visualKind: "gas",
    rewardCaption: "O₂ on tap (catalytically).",
    productBlurb:
      "Hydrogen peroxide breaks into water and oxygen when a catalyst like MnO₂ is present. A classic gas demo.",
    highlightItemIds: ["beaker", "h2o2", "mno2"],
    successBlurb: "H₂O₂ → H₂O + O₂ with MnO₂ as catalyst.",
    badgeId: "made-oxygen",
    steps: [
      placeBeakerStep("oxygen-glass"),
      pourStep("oxygen-peroxide", {
        title: "Add peroxide",
        instruction: "Pour hydrogen peroxide into the beaker.",
        chemicalIds: ["h2o2"],
        nudge: "Start with H₂O₂.",
        clue: "Oxidizers → Hydrogen Peroxide.",
        almost: "Pour Hydrogen Peroxide.",
      }),
      pourStep("oxygen-catalyst", {
        title: "Add the catalyst",
        instruction: "Add manganese dioxide — it speeds the breakdown.",
        chemicalIds: ["h2o2", "mno2"],
        nudge: "You need a black oxide catalyst.",
        clue: "Search MnO₂.",
        almost: "Pour Manganese Dioxide.",
      }),
      mixUntilStep("oxygen-mix", {
        title: "Release oxygen",
        instruction: "Mix to generate O₂ gas.",
        pred: okKey("product-oxygen"),
        nudge: "Watch for gas.",
        clue: "Stir, then Mix.",
        almost: "Mix until O₂ appears in the equation.",
      }),
    ],
  },
  {
    id: "lime-putty",
    title: "Make lime putty",
    tagline: "Slake quicklime",
    icon: "🏗️",
    category: "product",
    visualKind: "beaker",
    rewardCaption: "Quicklime, slaked.",
    productBlurb:
      "Builders slake quicklime (CaO) with water to make calcium hydroxide putty — exothermic and useful in mortar.",
    highlightItemIds: ["beaker", "cao", "h2o"],
    successBlurb: "CaO + H₂O → lime putty (slaked lime).",
    badgeId: "made-lime-putty",
    steps: [
      placeBeakerStep("lime-glass"),
      pourStep("lime-oxide", {
        title: "Add quicklime",
        instruction: "Add calcium oxide (quicklime).",
        chemicalIds: ["cao"],
        nudge: "Look for CaO.",
        clue: "Search quicklime or calcium oxide.",
        almost: "Pour Calcium Oxide.",
      }),
      pourStep("lime-water", {
        title: "Add water",
        instruction: "Pour water to slake the lime.",
        chemicalIds: ["cao", "h2o"],
        nudge: "Slaking needs water.",
        clue: "Add H₂O.",
        almost: "Pour Water into the beaker.",
      }),
      mixUntilStep("lime-mix", {
        title: "Slake into putty",
        instruction: "Mix — expect heat as CaO hydrates.",
        pred: okKey("product-lime-putty"),
        nudge: "Exothermic slaking.",
        clue: "Stir and Mix.",
        almost: "Mix until lime putty appears.",
      }),
    ],
  },
  {
    id: "brass-cleaner",
    title: "Make a metal cleaner",
    tagline: "Vinegar + salt",
    icon: "✨",
    category: "product",
    visualKind: "bottle",
    rewardCaption: "Tarnish’s worst friend.",
    productBlurb:
      "A kitchen copper/brass cleaner is often vinegar plus salt. Mix acetic acid with NaCl as a mild cleaning stand-in.",
    highlightItemIds: ["beaker", "ch3cooh", "nacl"],
    successBlurb: "Vinegar + salt — a classic tarnish-cleaning combo.",
    badgeId: "made-brass-cleaner",
    steps: [
      placeBeakerStep("cleaner-glass"),
      pourStep("cleaner-vinegar", {
        title: "Add vinegar",
        instruction: "Pour acetic acid (vinegar chemistry).",
        chemicalIds: ["ch3cooh"],
        nudge: "Kitchen acid = acetic acid.",
        clue: "Acids → Acetic Acid.",
        almost: "Pour Acetic Acid.",
      }),
      pourStep("cleaner-salt", {
        title: "Add salt",
        instruction: "Add sodium chloride.",
        chemicalIds: ["ch3cooh", "nacl"],
        nudge: "Table salt finishes the mix.",
        clue: "Pour NaCl.",
        almost: "Pour Sodium Chloride.",
      }),
      mixUntilStep("cleaner-mix", {
        title: "Blend the cleaner",
        instruction: "Mix to form the vinegar–salt cleaner.",
        pred: okKey("product-brass-cleaner"),
        nudge: "No heat needed.",
        clue: "Stir, then Mix.",
        almost: "Mix until the cleaner product appears.",
      }),
    ],
  },
  {
    id: "balm",
    title: "Make an oil balm",
    tagline: "Oil + wax",
    icon: "🕯️",
    category: "product",
    visualKind: "balm",
    rewardCaption: "Soft, glossy, melt-cooled.",
    productBlurb:
      "Balms and salves are oils thickened with wax. Melt plant oil with beeswax under gentle heat.",
    highlightItemIds: ["beaker", "plant-oil", "beeswax", "bunsen"],
    successBlurb: "Oil + beeswax under heat → a soft balm.",
    badgeId: "made-balm",
    steps: [
      placeBeakerStep("balm-glass"),
      pourStep("balm-oil", {
        title: "Add plant oil",
        instruction: "Pour plant oil as the soft base.",
        chemicalIds: ["plant-oil"],
        nudge: "Start with an oil.",
        clue: "Search plant oil.",
        almost: "Pour Plant Oil.",
      }),
      pourStep("balm-wax", {
        title: "Add beeswax",
        instruction: "Add beeswax to thicken the mix.",
        chemicalIds: ["plant-oil", "beeswax"],
        nudge: "Wax makes a balm, not a liquid oil.",
        clue: "Search beeswax.",
        almost: "Pour Beeswax.",
      }),
      heatStep("balm-heat", {
        chemicalIds: ["plant-oil", "beeswax"],
        title: "Melt the wax",
        instruction: "Heat so the wax melts into the oil.",
      }),
      mixUntilStep("balm-mix", {
        title: "Blend the balm",
        instruction: "Mix under heat to finish the balm.",
        pred: okKey("product-balm"),
        nudge: "Keep the burner on.",
        clue: "Stir, then Mix.",
        almost: "Mix until oil balm appears.",
      }),
    ],
  },
  {
    id: "invisible-ink",
    title: "Make invisible ink",
    tagline: "Heat-reveal acid",
    icon: "✍️",
    category: "product",
    visualKind: "bottle",
    rewardCaption: "Write nothing. Reveal everything.",
    productBlurb:
      "Lemon-juice style invisible ink is a weak acid that darkens when heated. Dissolve citric acid and finish with heat.",
    highlightItemIds: ["beaker", "citric-acid", "h2o", "bunsen"],
    successBlurb: "Citric acid solution + heat — invisible-ink stand-in.",
    badgeId: "made-invisible-ink",
    steps: [
      placeBeakerStep("inv-glass"),
      pourStep("inv-acid", {
        title: "Add citric acid",
        instruction: "Add citric acid (the “lemon juice” stand-in).",
        chemicalIds: ["citric-acid"],
        nudge: "Food acid works as invisible ink.",
        clue: "Search citric acid.",
        almost: "Pour Citric Acid.",
      }),
      pourStep("inv-water", {
        title: "Add water",
        instruction: "Dilute with water to make a writing solution.",
        chemicalIds: ["citric-acid", "h2o"],
        nudge: "Ink needs a solvent.",
        clue: "Pour Water.",
        almost: "Pour H₂O into the beaker.",
      }),
      heatStep("inv-heat", {
        chemicalIds: ["citric-acid", "h2o"],
        title: "Heat to “reveal”",
        instruction: "Attach heat — the classic reveal step for this demo.",
      }),
      mixUntilStep("inv-mix", {
        title: "Finish the ink",
        instruction: "Mix under heat to finish the invisible ink.",
        pred: okKey("product-invisible-ink"),
        nudge: "Heat must stay on.",
        clue: "Stir, then Mix.",
        almost: "Mix until invisible ink appears.",
      }),
    ],
  },
  {
    id: "slime",
    title: "Make slime",
    tagline: "Polymer cross-link",
    icon: "🟢",
    category: "product",
    visualKind: "slime",
    rewardCaption: "Goo unlocked. Do not eat.",
    productBlurb:
      "School slime is PVA polymer chains cross-linked by borax. Mix glue with borax solution on the desk.",
    highlightItemIds: ["beaker", "pva", "borax"],
    successBlurb: "PVA + borax → cross-linked slime.",
    badgeId: "made-slime",
    steps: [
      placeBeakerStep("slime-glass"),
      pourStep("slime-pva", {
        title: "Add PVA glue",
        instruction: "Pour PVA (polyvinyl alcohol) glue.",
        chemicalIds: ["pva"],
        nudge: "Slime starts from white glue / PVA.",
        clue: "Search PVA.",
        almost: "Pour PVA Glue.",
      }),
      pourStep("slime-borax", {
        title: "Add borax",
        instruction: "Add borax as the cross-linker.",
        chemicalIds: ["pva", "borax"],
        nudge: "You need a borate cross-linker.",
        clue: "Search borax.",
        almost: "Pour Borax.",
      }),
      mixUntilStep("slime-mix", {
        title: "Cross-link the goo",
        instruction: "Mix until the polymer networks into slime.",
        pred: okKey("product-slime"),
        nudge: "It should thicken.",
        clue: "Stir and Mix.",
        almost: "Mix until slime appears.",
      }),
    ],
  },

  // ——— Classic lab goals ———
  {
    id: "table-salt",
    title: "Make table salt",
    tagline: "Neutralization",
    icon: "🧂",
    category: "classic",
    visualKind: "crystal",
    rewardCaption: "NaCl from acid + base.",
    productBlurb:
      "Acid + base → salt + water. Neutralize HCl with NaOH to make sodium chloride.",
    highlightItemIds: ["beaker", "hcl", "naoh"],
    successBlurb: "HCl + NaOH → NaCl + H₂O — neutralization.",
    badgeId: "goal-salt",
    steps: [
      placeBeakerStep("salt-glass"),
      pourStep("salt-acid", {
        title: "Add hydrochloric acid",
        instruction: "Pour HCl into the beaker.",
        chemicalIds: ["hcl"],
        nudge: "Start with a strong acid.",
        clue: "Pour Hydrochloric Acid.",
        almost: "Add HCl.",
      }),
      pourStep("salt-base", {
        title: "Add sodium hydroxide",
        instruction: "Add NaOH to neutralize the acid.",
        chemicalIds: ["hcl", "naoh"],
        nudge: "Pair it with a strong base.",
        clue: "Pour NaOH.",
        almost: "Add Sodium Hydroxide.",
      }),
      mixUntilStep("salt-mix", {
        title: "Neutralize",
        instruction: "Mix to form salt and water.",
        pred: okType("neutralization"),
        nudge: "Look for neutralization.",
        clue: "Stir, then Mix.",
        almost: "Mix until NaCl appears in the equation.",
      }),
    ],
  },
  {
    id: "silver-chloride",
    title: "Make silver chloride",
    tagline: "White precipitate",
    icon: "⚪",
    category: "classic",
    visualKind: "crystal",
    rewardCaption: "White AgCl crash-out.",
    productBlurb:
      "Silver nitrate plus a chloride salt makes insoluble AgCl — a classic white precipitate.",
    highlightItemIds: ["beaker", "agno3", "nacl"],
    successBlurb: "AgNO₃ + NaCl → AgCl(s) — white ppt.",
    badgeId: "goal-agcl",
    steps: [
      placeBeakerStep("agcl-glass"),
      pourStep("agcl-silver", {
        title: "Add silver nitrate",
        instruction: "Pour AgNO₃ solution.",
        chemicalIds: ["agno3"],
        nudge: "Start with a silver salt.",
        clue: "Search AgNO₃.",
        almost: "Pour Silver Nitrate.",
      }),
      pourStep("agcl-chloride", {
        title: "Add chloride",
        instruction: "Add NaCl so Cl⁻ meets Ag⁺.",
        chemicalIds: ["agno3", "nacl"],
        nudge: "Need a soluble chloride.",
        clue: "Pour Sodium Chloride.",
        almost: "Add NaCl.",
      }),
      mixUntilStep("agcl-mix", {
        title: "Precipitate AgCl",
        instruction: "Mix to crash out white silver chloride.",
        pred: okPrecipitate,
        nudge: "Watch for a white solid.",
        clue: "Stir and Mix.",
        almost: "Mix until a precipitate forms.",
      }),
    ],
  },
  {
    id: "barium-sulfate",
    title: "Make barium sulfate",
    tagline: "Sulfate precipitate",
    icon: "⬜",
    category: "classic",
    visualKind: "crystal",
    rewardCaption: "Insoluble BaSO₄.",
    productBlurb:
      "Barium ions and sulfate ions form insoluble BaSO₄ — used in imaging and as a textbook ppt.",
    highlightItemIds: ["beaker", "bacl2", "mgso4"],
    successBlurb: "BaCl₂ + MgSO₄ → BaSO₄(s).",
    badgeId: "goal-baso4",
    steps: [
      placeBeakerStep("baso4-glass"),
      pourStep("baso4-ba", {
        title: "Add barium chloride",
        instruction: "Pour BaCl₂.",
        chemicalIds: ["bacl2"],
        nudge: "Need Ba²⁺.",
        clue: "Search BaCl₂.",
        almost: "Pour Barium Chloride.",
      }),
      pourStep("baso4-so4", {
        title: "Add a sulfate",
        instruction: "Add magnesium sulfate (or another soluble sulfate).",
        chemicalIds: ["bacl2", "mgso4"],
        nudge: "Pair with SO₄²⁻.",
        clue: "Pour MgSO₄.",
        almost: "Add Magnesium Sulfate.",
      }),
      mixUntilStep("baso4-mix", {
        title: "Precipitate BaSO₄",
        instruction: "Mix to form barium sulfate solid.",
        pred: okPrecipitate,
        nudge: "Expect a white ppt.",
        clue: "Stir, then Mix.",
        almost: "Mix until precipitation shows.",
      }),
    ],
  },
  {
    id: "silver-chromate",
    title: "Make silver chromate",
    tagline: "Brick-red ppt",
    icon: "🔴",
    category: "classic",
    visualKind: "crystal",
    rewardCaption: "Brick-red Ag₂CrO₄.",
    productBlurb:
      "Silver nitrate and potassium chromate make striking brick-red Ag₂CrO₄ — a colorful double displacement.",
    highlightItemIds: ["beaker", "agno3", "k2cro4"],
    successBlurb: "AgNO₃ + K₂CrO₄ → Ag₂CrO₄(s).",
    badgeId: "goal-ag2cro4",
    steps: [
      placeBeakerStep("agcro4-glass"),
      pourStep("agcro4-ag", {
        title: "Add silver nitrate",
        instruction: "Pour AgNO₃.",
        chemicalIds: ["agno3"],
        nudge: "Silver salt first.",
        clue: "Pour Silver Nitrate.",
        almost: "Add AgNO₃.",
      }),
      pourStep("agcro4-cr", {
        title: "Add chromate",
        instruction: "Add potassium chromate.",
        chemicalIds: ["agno3", "k2cro4"],
        nudge: "Look for a yellow chromate salt.",
        clue: "Search K₂CrO₄.",
        almost: "Pour Potassium Chromate.",
      }),
      mixUntilStep("agcro4-mix", {
        title: "Precipitate Ag₂CrO₄",
        instruction: "Mix for the brick-red solid.",
        pred: okPrecipitate,
        nudge: "Colorful ppt ahead.",
        clue: "Stir and Mix.",
        almost: "Mix until a precipitate forms.",
      }),
    ],
  },
  {
    id: "milk-of-magnesia",
    title: "Make milk of magnesia",
    tagline: "Mg(OH)₂ precipitate",
    icon: "🥛",
    category: "classic",
    visualKind: "beaker",
    rewardCaption: "Milky Mg(OH)₂.",
    productBlurb:
      "Milk of magnesia is a suspension of Mg(OH)₂. Precipitate it from magnesium sulfate and sodium hydroxide.",
    highlightItemIds: ["beaker", "mgso4", "naoh"],
    successBlurb: "MgSO₄ + NaOH → Mg(OH)₂(s) — milky hydroxide.",
    badgeId: "goal-mgoh2",
    steps: [
      placeBeakerStep("mgoh-glass"),
      pourStep("mgoh-mg", {
        title: "Add magnesium sulfate",
        instruction: "Pour MgSO₄.",
        chemicalIds: ["mgso4"],
        nudge: "Need Mg²⁺.",
        clue: "Search MgSO₄.",
        almost: "Pour Magnesium Sulfate.",
      }),
      pourStep("mgoh-oh", {
        title: "Add sodium hydroxide",
        instruction: "Add NaOH to precipitate the hydroxide.",
        chemicalIds: ["mgso4", "naoh"],
        nudge: "Hydroxide crashes Mg²⁺ out.",
        clue: "Pour NaOH.",
        almost: "Add Sodium Hydroxide.",
      }),
      mixUntilStep("mgoh-mix", {
        title: "Form Mg(OH)₂",
        instruction: "Mix until the milky precipitate appears.",
        pred: okPrecipitate,
        nudge: "Look for a cloudy solid.",
        clue: "Stir, then Mix.",
        almost: "Mix until precipitation shows.",
      }),
    ],
  },
  {
    id: "make-hydrogen",
    title: "Make hydrogen gas",
    tagline: "Metal + acid",
    icon: "🎈",
    category: "classic",
    visualKind: "gas",
    rewardCaption: "H₂ bubbles incoming.",
    productBlurb:
      "Active metals displace hydrogen from acid. Zinc + HCl is the classic lab route to H₂.",
    highlightItemIds: ["beaker", "zn", "hcl"],
    successBlurb: "Zn + 2HCl → ZnCl₂ + H₂ — hydrogen gas.",
    badgeId: "goal-hydrogen",
    steps: [
      placeBeakerStep("h2-glass"),
      pourStep("h2-zn", {
        title: "Add zinc",
        instruction: "Place zinc metal in the beaker.",
        chemicalIds: ["zn"],
        nudge: "Need an active metal.",
        clue: "Metals → Zinc.",
        almost: "Add Zinc.",
      }),
      pourStep("h2-acid", {
        title: "Add acid",
        instruction: "Pour HCl onto the zinc.",
        chemicalIds: ["zn", "hcl"],
        nudge: "Acid frees hydrogen.",
        clue: "Pour Hydrochloric Acid.",
        almost: "Add HCl.",
      }),
      mixUntilStep("h2-mix", {
        title: "Release H₂",
        instruction: "Mix to generate hydrogen gas.",
        pred: (r) =>
          r.ok &&
          (r.effects.some((e) => e.kind === "gas") ||
            r.explanationKey === "single-displacement" ||
            Boolean(r.label?.includes("H2"))),
        nudge: "Expect bubbles.",
        clue: "Stir and Mix.",
        almost: "Mix until H₂ / gas appears.",
      }),
    ],
  },
  {
    id: "copper-displace",
    title: "Plate out copper",
    tagline: "Single displacement",
    icon: "🟠",
    category: "classic",
    visualKind: "beaker",
    rewardCaption: "Blue fades. Copper appears.",
    productBlurb:
      "Zinc is more reactive than copper, so it displaces Cu²⁺ from blue vitriol (CuSO₄), plating copper metal.",
    highlightItemIds: ["beaker", "zn", "cuso4"],
    successBlurb: "Zn + CuSO₄ → ZnSO₄ + Cu — classic displacement.",
    badgeId: "goal-copper",
    steps: [
      placeBeakerStep("cu-glass"),
      pourStep("cu-salt", {
        title: "Add copper sulfate",
        instruction: "Pour blue CuSO₄ solution.",
        chemicalIds: ["cuso4"],
        nudge: "Blue vitriol = CuSO₄.",
        clue: "Search copper sulfate.",
        almost: "Pour Copper(II) Sulfate.",
      }),
      pourStep("cu-zn", {
        title: "Add zinc",
        instruction: "Add zinc metal to displace copper.",
        chemicalIds: ["cuso4", "zn"],
        nudge: "More reactive metal wins.",
        clue: "Add Zinc.",
        almost: "Pour/add Zinc into the blue solution.",
      }),
      mixUntilStep("cu-mix", {
        title: "Displace copper",
        instruction: "Mix to plate out copper metal.",
        pred: (r) =>
          r.ok &&
          (r.explanationKey === "redox" ||
            r.explanationKey === "single-displacement"),
        nudge: "Watch the blue fade.",
        clue: "Stir, then Mix.",
        almost: "Mix until Cu appears in the equation.",
      }),
    ],
  },
  {
    id: "combustion",
    title: "Burn a fuel",
    tagline: "Combustion",
    icon: "🔥",
    category: "classic",
    visualKind: "flame",
    rewardCaption: "Fuel + O₂ + heat. Whoosh.",
    productBlurb:
      "Combustion needs fuel, oxygen, and ignition heat. Burn methane (or another fuel) with O₂ on a hot vessel.",
    highlightItemIds: ["beaker", "ch4", "o2", "bunsen"],
    successBlurb: "CH₄ + O₂ → CO₂ + H₂O — combustion.",
    badgeId: "goal-combustion",
    steps: [
      placeBeakerStep("burn-glass"),
      pourStep("burn-fuel", {
        title: "Add a fuel",
        instruction: "Add methane (or another listed fuel).",
        chemicalIds: ["ch4"],
        nudge: "Need something flammable.",
        clue: "Gases → Methane.",
        almost: "Add Methane (CH₄).",
      }),
      pourStep("burn-o2", {
        title: "Add oxygen",
        instruction: "Add O₂ as the oxidizer.",
        chemicalIds: ["ch4", "o2"],
        nudge: "Fire needs oxygen.",
        clue: "Add Oxygen gas.",
        almost: "Pour O₂.",
      }),
      heatStep("burn-heat", {
        chemicalIds: ["ch4", "o2"],
        title: "Ignite",
        instruction: "Attach a Bunsen burner to ignite the mix.",
      }),
      mixUntilStep("burn-mix", {
        title: "Combust",
        instruction: "Mix under heat to run combustion.",
        pred: okType("combustion"),
        nudge: "Keep the heat on.",
        clue: "Stir, then Mix.",
        almost: "Mix until combustion / CO₂ shows.",
      }),
    ],
  },
  {
    id: "limewater",
    title: "Test for CO₂",
    tagline: "Limewater milky",
    icon: "🥛",
    category: "classic",
    visualKind: "beaker",
    rewardCaption: "Limewater went milky.",
    productBlurb:
      "The classic CO₂ test: bubble carbon dioxide into limewater (Ca(OH)₂) and watch milky CaCO₃ form.",
    highlightItemIds: ["beaker", "co2", "caoh2"],
    successBlurb: "CO₂ + Ca(OH)₂ → CaCO₃ + H₂O — milky limewater.",
    badgeId: "goal-limewater",
    steps: [
      placeBeakerStep("lw-glass"),
      pourStep("lw-lime", {
        title: "Add limewater",
        instruction: "Pour calcium hydroxide (limewater).",
        chemicalIds: ["caoh2"],
        nudge: "Limewater is Ca(OH)₂(aq).",
        clue: "Bases → Calcium Hydroxide.",
        almost: "Pour Calcium Hydroxide.",
      }),
      pourStep("lw-co2", {
        title: "Add carbon dioxide",
        instruction: "Add CO₂ gas to the limewater.",
        chemicalIds: ["caoh2", "co2"],
        nudge: "The gas under test is CO₂.",
        clue: "Add Carbon Dioxide.",
        almost: "Pour CO₂ into the beaker.",
      }),
      mixUntilStep("lw-mix", {
        title: "Turn it milky",
        instruction: "Mix to precipitate chalky CaCO₃.",
        pred: (r) =>
          r.ok &&
          (r.explanationKey === "product-limewater" || okPrecipitate(r)),
        nudge: "Expect a milky ppt.",
        clue: "Stir and Mix.",
        almost: "Mix until CaCO₃ / milky result appears.",
      }),
    ],
  },
];

export const GOAL_BY_ID: Record<string, ProductGoal> = Object.fromEntries(
  PRODUCT_GOALS.map((g) => [g.id, g]),
);

export function getGoal(id: string): ProductGoal | undefined {
  return GOAL_BY_ID[id];
}
