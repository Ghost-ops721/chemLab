/** Domain-agnostic base types. Shared desk/drag/animation/gamification use only these. */

export type DomainId = string;

export interface Item {
  id: string;
  name: string;
  domain: DomainId;
  category: string;
  subcategory: string;
  tags: string[];
  icon: string;
}

export type EngineEffectKind =
  | "color"
  | "gas"
  | "precipitate"
  | "heat"
  | "hazard"
  | "smoke"
  | "blast"
  | "burst"
  | "boil"
  | "melt"
  | "foam"
  | "glow"
  | "sparkle"
  | "bubble"
  | "solidify"
  | "dirty"
  | "layer"
  | "flash"
  | "steam"
  | "crystal"
  | "turbid"
  | "overflow";

export interface EngineEffect {
  kind: EngineEffectKind;
  /** CSS color for color/heat glow, or descriptive token */
  value?: string;
  /** exo | endo for heat; severity for hazard */
  intensity?: "low" | "medium" | "high" | "exo" | "endo";
  messageKey?: string;
}

export interface EngineInput {
  itemIds: string[];
  /** Optional volume map chemicalId → mL */
  amounts?: Record<string, number>;
  /** Equipment function present (e.g. heat-source) */
  equipmentFunctions?: string[];
}

/** One chemical species in a vessel with a teaching volume. */
export interface VesselContent {
  chemicalId: string;
  amountMl: number;
}

export interface EngineResult {
  ok: boolean;
  products: Item[];
  label?: string;
  effects: EngineEffect[];
  explanationKey?: string;
  discoveryId: string;
  /** Post-mix vessel contents after teaching stoichiometry (when applied). */
  nextContents?: VesselContent[];
  /** chemicalId that limited reaction extent */
  limitingReagentId?: string;
}

export interface DomainModule {
  id: DomainId;
  label: string;
  getItems: () => Item[];
  getEquipment: () => Item[];
  resolve: (input: EngineInput) => EngineResult;
}

/** Ephemeral bench FX timestamps (ms) — drive CSS one-shots */
export interface VesselFx {
  pourAt?: number;
  stirAt?: number;
  shakeAt?: number;
  mixAt?: number;
  heatFlashAt?: number;
  coolFlashAt?: number;
  /** Last poured chemical color for splash tint */
  pourColor?: string;
  /** Optional desk-local origin of a pour stream */
  pourFrom?: { x: number; y: number };
  /** Vessel→vessel transfer window */
  transferAt?: number;
  transferFromId?: string;
  transferToId?: string;
  /** Role during an active transfer */
  transferRole?: "source" | "target";
}

/** Compact IFRA teaching screen attached to live preview. */
export interface LiveIfraSummary {
  status: "pass" | "fail" | "unknown";
  category: string;
  categoryLabel: string;
  version: string;
  screened: boolean;
  failCount: number;
  unknownCount: number;
  ingredients: {
    chemicalId: string;
    name: string;
    actualPct: number;
    maxPct?: number;
    status: "pass" | "fail" | "unknown";
  }[];
  disclaimer: string;
}

/** Live formula preview attached while pouring (before Mix). */
export interface LiveVesselPreview {
  fillColor?: string;
  layerColors?: string[];
  fillPct: number;
  ethanolPct: number;
  oilLoadPct: number;
  concentrationLabel?: string;
  scentVerdict?: string;
  scentSummary?: string;
  hazards: { level: "info" | "warn" | "danger"; message: string; effect?: EngineEffectKind }[];
  notes: { role: string; name: string; amountMl: number; pct: number }[];
  effects: EngineEffect[];
  /** IFRA Standards–aligned teaching screen (Category 4 default). */
  ifra?: LiveIfraSummary;
}

/** Instance of equipment placed on the desk */
export interface DeskVessel {
  instanceId: string;
  equipmentId: string;
  /** Volumetric contents (source of truth). */
  contents: VesselContent[];
  /**
   * Unique chemical ids present — kept in sync with `contents` for goals / legacy.
   */
  contentIds: string[];
  /** Heat source attached to this vessel */
  heatAttached: boolean;
  /** Cold source (ice bath) attached to this vessel */
  coolAttached: boolean;
  /** How vigorously the liquid has been stirred (0–3) */
  stirLevel: number;
  lastResult?: EngineResult;
  /** Live preview while adjusting amounts (perfume / hazards). */
  livePreview?: LiveVesselPreview;
  position: { x: number; y: number };
  fx: VesselFx;
}
