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
