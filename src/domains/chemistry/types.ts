import type { Item } from "@/types";

export type PhysicalState = "solid" | "liquid" | "gas" | "aqueous";

export type ReactionType =
  | "neutralization"
  | "precipitation"
  | "single-displacement"
  | "double-displacement"
  | "redox"
  | "combustion"
  | "gas-forming"
  | "product-craft"
  | "no-reaction"
  | "hazard";

export type EquipmentFunction =
  | "container"
  | "heat-source"
  | "cold-source"
  | "measuring"
  | "stirring";

export interface Chemical extends Item {
  domain: "chemistry";
  formula: string;
  state: PhysicalState;
  color: string;
  solubility: "soluble" | "insoluble" | "slightly-soluble" | "n/a";
  reactivityRank?: number;
  hazardLevel: 0 | 1 | 2 | 3;
  /** For acids/bases identity */
  acidBase?: "acid" | "base" | "amphiprotic" | "none";
  /** Dissociation ions when aqueous, e.g. ['Na+', 'Cl-'] */
  ions?: string[];
  /** Oxidation states map for redox, e.g. { Cu: 2, S: 6, O: -2 } */
  oxidationStates?: Record<string, number>;
  /** For organics / fuels */
  isFuel?: boolean;
  isOxidizer?: boolean;
  /** Cation / anion for salt bookkeeping */
  cation?: string;
  anion?: string;
  /** CAS registry number when known (oils / IFRA Phase B). */
  casNumber?: string;
  /** Approximate flash point °C for flammability teaching. */
  flashPointC?: number;
  /** Suggested max % in finished fragrance (teaching / IFRA-inspired). */
  maxSuggestedPct?: number;
  /** Relative density vs water (~1). Oils often ~0.85–0.95. */
  density?: number;
  /** Odor strength 0–1 for live scent weighting. */
  odorStrength?: number;
  /** Pleasantness −1..1 for honest “smells bad” verdicts. */
  pleasantness?: number;
}

export interface Equipment extends Item {
  domain: "chemistry";
  capacity: number;
  function: EquipmentFunction;
}

export interface ReactionResult {
  products: Chemical[];
  balancedEquation: string;
  colorChange?: string;
  gasReleased?: boolean;
  precipitateFormed?: boolean;
  heatReleased?: "exo" | "endo" | null;
  hazardTriggered?: boolean;
  explanationKey: string;
  reactionType: ReactionType;
  ok: boolean;
}

export interface ReactionRule {
  id: string;
  type: ReactionType;
  reactantCategories: string[];
  resolve: (inputs: Chemical[]) => ReactionResult | null;
}
